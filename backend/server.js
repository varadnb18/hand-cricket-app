const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ── In-memory store ──────────────────────────────────────────────────────────
const rooms = {}; // roomId → gameState

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createGameState(roomId) {
  return {
    roomId,
    players: [],          // [{ id, name, socketId }]
    phase: 'waiting',     // waiting | toss | batting | gameOver
    toss: {
      callerIdx: null,    // index of player who called
      callerChoice: null, // 'odd' | 'even'
      moves: {},          // { socketId: number }
      winnerId: null,
      batFirst: null,     // socketId of batsman in innings 1
    },
    innings: 1,
    score: [0, 0],        // score[0]=innings1 batting team, score[1]=innings2 batting team
    currentBatterIdx: null,  // index in players[]
    currentBowlerIdx: null,
    target: null,
    moves: {},            // { socketId: number } current ball moves
    timers: {},           // { socketId: timeoutId }
    disconnected: {},     // { socketId: playerIdx }
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function broadcastState(roomId) {
  const g = rooms[roomId];
  if (!g) return;
  io.to(roomId).emit('stateUpdate', buildClientState(g));
}

function buildClientState(g) {
  return {
    roomId: g.roomId,
    phase: g.phase,
    players: g.players.map((p) => ({ id: p.id, name: p.name })),
    toss: {
      callerIdx: g.toss.callerIdx,
      callerChoice: g.toss.callerChoice,
      winnerId: g.toss.winnerId,
      batFirst: g.toss.batFirst,
    },
    innings: g.innings,
    score: g.score,
    currentBatterIdx: g.currentBatterIdx,
    currentBowlerIdx: g.currentBowlerIdx,
    target: g.target,
  };
}

function getPlayerIdx(g, socketId) {
  return g.players.findIndex((p) => p.socketId === socketId);
}

function startToss(g) {
  g.phase = 'toss';
  // Randomly choose who calls
  g.toss.callerIdx = Math.floor(Math.random() * 2);
  broadcastState(g.roomId);
  io.to(g.roomId).emit('tossStart', { callerIdx: g.toss.callerIdx });
}

function resolveToss(g) {
  const moves = g.toss.moves;
  const ids = Object.keys(moves);
  const total = ids.reduce((s, id) => s + moves[id], 0);
  const isOdd = total % 2 !== 0;
  const callerWon =
    (g.toss.callerChoice === 'odd' && isOdd) ||
    (g.toss.callerChoice === 'even' && !isOdd);

  const winnerIdx = callerWon ? g.toss.callerIdx : 1 - g.toss.callerIdx;
  g.toss.winnerId = g.players[winnerIdx].id;
  g.toss.winnerSocketId = g.players[winnerIdx].socketId;

  broadcastState(g.roomId);
  io.to(g.roomId).emit('tossResult', {
    winnerId: g.toss.winnerId,
    winnerName: g.players[winnerIdx].name,
    total,
  });
}

function startInnings(g, batterSocketId) {
  const bIdx = g.players.findIndex((p) => p.socketId === batterSocketId);
  g.currentBatterIdx = bIdx;
  g.currentBowlerIdx = 1 - bIdx;
  g.phase = 'batting';
  g.moves = {};
  clearAllTimers(g);
  broadcastState(g.roomId);
  io.to(g.roomId).emit('inningsStart', {
    innings: g.innings,
    batterIdx: g.currentBatterIdx,
    bowlerIdx: g.currentBowlerIdx,
    target: g.target,
  });
}

function clearAllTimers(g) {
  Object.values(g.timers).forEach((t) => clearTimeout(t));
  g.timers = {};
}

const AUTO_SELECT_MS = 15000; // 15 s

function startMoveTimer(g, socketId) {
  if (g.timers[socketId]) clearTimeout(g.timers[socketId]);
  g.timers[socketId] = setTimeout(() => {
    if (!g.moves[socketId]) {
      const auto = Math.ceil(Math.random() * 6);
      handlePlayerMove(g, socketId, auto, true);
    }
  }, AUTO_SELECT_MS);
}

function handlePlayerMove(g, socketId, number, isAuto = false) {
  if (g.phase !== 'batting') return;
  if (g.moves[socketId] !== undefined) return; // already submitted

  g.moves[socketId] = number;
  clearTimeout(g.timers[socketId]);
  delete g.timers[socketId];

  const pIdx = getPlayerIdx(g, socketId);
  // Tell the player their move was recorded
  io.to(socketId).emit('moveLocked', { number, isAuto });

  // If both players have moved, resolve the ball
  const batterSid = g.players[g.currentBatterIdx].socketId;
  const bowlerSid = g.players[g.currentBowlerIdx].socketId;

  if (g.moves[batterSid] !== undefined && g.moves[bowlerSid] !== undefined) {
    resolveBall(g);
  }
}

function resolveBall(g) {
  clearAllTimers(g);

  const batterSid = g.players[g.currentBatterIdx].socketId;
  const bowlerSid = g.players[g.currentBowlerIdx].socketId;
  const batterNum = g.moves[batterSid];
  const bowlerNum = g.moves[bowlerSid];

  const isOut = batterNum === bowlerNum;
  let runsScored = 0;

  const inningsScoreIdx = g.innings - 1;

  if (!isOut) {
    runsScored = batterNum;
    g.score[inningsScoreIdx] += runsScored;
  }

  const ballResult = {
    batterNum,
    bowlerNum,
    isOut,
    runsScored,
    score: [...g.score],
    innings: g.innings,
    target: g.target,
  };

  io.to(g.roomId).emit('ballResult', ballResult);

  g.moves = {};

  // Check innings-over conditions
  if (isOut) {
    endInnings(g);
  } else if (g.innings === 2 && g.score[1] >= g.target) {
    // Chasing team won
    endGame(g, g.players[g.currentBatterIdx].id);
  } else {
    // Continue batting
    broadcastState(g.roomId);
    // start timers for next ball
    setTimeout(() => {
      if (g.phase === 'batting') {
        startMoveTimer(g, batterSid);
        startMoveTimer(g, bowlerSid);
        io.to(g.roomId).emit('nextBall', { innings: g.innings, score: [...g.score], target: g.target });
      }
    }, 2000);
  }
}

function endInnings(g) {
  if (g.innings === 1) {
    g.target = g.score[0] + 1;
    g.innings = 2;
    broadcastState(g.roomId);
    io.to(g.roomId).emit('inningsChange', {
      endedInnings: 1,
      score: g.score[0],
      target: g.target,
    });

    // Switch batter/bowler for innings 2
    setTimeout(() => {
      const newBatterSid = g.players[g.currentBowlerIdx].socketId;
      startInnings(g, newBatterSid);
    }, 3000);
  } else {
    // Innings 2 over — bowling team wins (chasing team got out before reaching target)
    const bowlingTeamId = g.players[g.currentBowlerIdx].id;
    endGame(g, bowlingTeamId);
  }
}

function endGame(g, winnerId) {
  clearAllTimers(g);
  g.phase = 'gameOver';
  const winner = g.players.find((p) => p.id === winnerId);
  broadcastState(g.roomId);
  io.to(g.roomId).emit('gameOver', {
    winnerId,
    winnerName: winner ? winner.name : 'Unknown',
    score: g.score,
    target: g.target,
  });
}

// ── AI Logic (Single Player) ─────────────────────────────────────────────────
// AI is represented as a fake "player" with id 'AI' and socketId 'AI'

function aiMove() {
  return Math.ceil(Math.random() * 6);
}

function handleAiMove(g) {
  if (g.phase !== 'batting') return;
  setTimeout(() => {
    const aiNum = aiMove();
    g.moves['AI'] = aiNum;
    io.to(g.roomId).emit('opponentMove', { number: aiNum, isAI: true });

    const humanSid = g.players.find((p) => p.id !== 'AI')?.socketId;
    if (humanSid && g.moves[humanSid] !== undefined) {
      resolveBall(g);
    }
  }, 800 + Math.random() * 1200);
}

// ── Socket.io ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  // ── CREATE ROOM ────────────────────────────────────────────────────────────
  socket.on('createRoom', ({ playerName }) => {
    const roomId = generateRoomId();
    const g = createGameState(roomId);
    g.players.push({ id: socket.id, name: playerName || 'Player 1', socketId: socket.id });
    rooms[roomId] = g;
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.emit('roomCreated', { roomId, playerIdx: 0 });
    broadcastState(roomId);
    console.log(`Room ${roomId} created by ${playerName}`);
  });

  // ── JOIN ROOM ──────────────────────────────────────────────────────────────
  socket.on('joinRoom', ({ roomId, playerName }) => {
    const g = rooms[roomId];
    if (!g) {
      socket.emit('error', { message: 'Room not found.' });
      return;
    }

    // Rejoin check
    const existingIdx = g.players.findIndex((p) => p.name === playerName && g.disconnected[p.socketId] !== undefined);
    if (existingIdx !== -1) {
      const oldSid = g.players[existingIdx].socketId;
      delete g.disconnected[oldSid];
      g.players[existingIdx].socketId = socket.id;
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.emit('rejoinSuccess', { playerIdx: existingIdx });
      broadcastState(roomId);

      // If game was in batting phase, restart timers
      if (g.phase === 'batting') {
        const batterSid = g.players[g.currentBatterIdx].socketId;
        const bowlerSid = g.players[g.currentBowlerIdx].socketId;
        startMoveTimer(g, batterSid);
        startMoveTimer(g, bowlerSid);
        io.to(roomId).emit('nextBall', { innings: g.innings, score: [...g.score], target: g.target });
      }
      return;
    }

    if (g.players.length >= 2) {
      socket.emit('error', { message: 'Room is full.' });
      return;
    }

    g.players.push({ id: socket.id, name: playerName || 'Player 2', socketId: socket.id });
    socket.join(roomId);
    socket.data.roomId = roomId;

    const playerIdx = g.players.length - 1;
    socket.emit('joinedRoom', { roomId, playerIdx });

    broadcastState(roomId);

    if (g.players.length === 2) {
      io.to(roomId).emit('gameStart', {
        players: g.players.map((p) => ({ id: p.id, name: p.name })),
      });
      setTimeout(() => startToss(g), 1000);
    }
  });

  // ── SINGLE PLAYER ─────────────────────────────────────────────────────────
  socket.on('startSinglePlayer', ({ playerName }) => {
    const roomId = generateRoomId();
    const g = createGameState(roomId);
    g.players.push({ id: socket.id, name: playerName || 'You', socketId: socket.id });
    g.players.push({ id: 'AI', name: 'AI Bot', socketId: 'AI' });
    g.isSinglePlayer = true;
    rooms[roomId] = g;
    socket.join(roomId);
    socket.data.roomId = roomId;

    socket.emit('roomCreated', { roomId, playerIdx: 0, isSinglePlayer: true });
    broadcastState(roomId);

    io.to(roomId).emit('gameStart', {
      players: g.players.map((p) => ({ id: p.id, name: p.name })),
    });

    setTimeout(() => startToss(g), 500);
  });

  // ── TOSS CHOICE ───────────────────────────────────────────────────────────
  // Caller sends odd/even choice
  socket.on('tossChoice', ({ choice }) => {
    const roomId = socket.data.roomId;
    const g = rooms[roomId];
    if (!g || g.phase !== 'toss') return;

    const pIdx = getPlayerIdx(g, socket.id);
    if (pIdx !== g.toss.callerIdx) return; // only caller sets choice

    g.toss.callerChoice = choice; // 'odd' | 'even'
    io.to(roomId).emit('tossChoiceMade', { callerIdx: pIdx, choice });

    // Now both players throw a number (1-6)
    io.to(roomId).emit('tossThrow');

    if (g.isSinglePlayer) {
      // AI throws
      setTimeout(() => {
        const aiNum = Math.ceil(Math.random() * 6);
        g.toss.moves['AI'] = aiNum;
        checkTossMoves(g);
      }, 800);
    }
  });

  // ── TOSS MOVE ─────────────────────────────────────────────────────────────
  socket.on('tossMove', ({ number }) => {
    const roomId = socket.data.roomId;
    const g = rooms[roomId];
    if (!g || g.phase !== 'toss') return;
    if (g.toss.moves[socket.id]) return;

    g.toss.moves[socket.id] = number;
    checkTossMoves(g);
  });

  function checkTossMoves(g) {
    const p1Sid = g.players[0].socketId;
    const p2Sid = g.players[1].socketId;
    if (g.toss.moves[p1Sid] !== undefined && g.toss.moves[p2Sid] !== undefined) {
      resolveToss(g);
    }
  }

  // ── BAT/BOWL CHOICE (after toss win) ─────────────────────────────────────
  socket.on('batBowlChoice', ({ choice }) => {
    const roomId = socket.data.roomId;
    const g = rooms[roomId];
    if (!g) return;

    const winnerSid = g.toss.winnerSocketId;
    if (socket.id !== winnerSid) return; // only winner chooses

    let batterSid;
    if (choice === 'bat') {
      batterSid = winnerSid;
    } else {
      batterSid = g.players.find((p) => p.socketId !== winnerSid)?.socketId;
    }
    g.toss.batFirst = batterSid;

    io.to(roomId).emit('batBowlDecision', {
      choice,
      batterIdx: g.players.findIndex((p) => p.socketId === batterSid),
    });

    setTimeout(() => startInnings(g, batterSid), 1500);
  });

  // ── PLAYER MOVE ───────────────────────────────────────────────────────────
  socket.on('playerMove', ({ number }) => {
    const roomId = socket.data.roomId;
    const g = rooms[roomId];
    if (!g || g.phase !== 'batting') return;

    handlePlayerMove(g, socket.id, number);

    // If single player, trigger AI move for the other side
    if (g.isSinglePlayer) {
      const aiIsPlaying =
        (g.players[g.currentBatterIdx].socketId === 'AI') ||
        (g.players[g.currentBowlerIdx].socketId === 'AI');
      if (aiIsPlaying && g.moves['AI'] === undefined) {
        handleAiMove(g);
      }
    }
  });

  // ── DISCONNECT ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    const g = rooms[roomId];
    if (!g) return;

    const pIdx = getPlayerIdx(g, socket.id);
    if (pIdx !== -1) {
      g.disconnected[socket.id] = pIdx;
      console.log(`Player ${g.players[pIdx].name} disconnected from ${roomId}`);
      io.to(roomId).emit('playerDisconnected', {
        playerIdx: pIdx,
        playerName: g.players[pIdx].name,
      });
    }

    // Clean up room if both disconnected or single player disconnects
    setTimeout(() => {
      if (!rooms[roomId]) return;
      const allDisconnected = g.players.every((p) => g.disconnected[p.socketId] !== undefined);
      if (allDisconnected || g.isSinglePlayer) {
        clearAllTimers(g);
        delete rooms[roomId];
        console.log(`Room ${roomId} cleaned up`);
      }
    }, 60000); // 60s grace period
  });
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'Hand Cricket server running 🏏' }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Hand Cricket server running on http://0.0.0.0:${PORT}`);
  console.log(`   (Accessible on LAN — share your IP + port with Player 2)`);
});
