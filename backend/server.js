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
    origin: [
      "http://localhost:5173",
      "https://hand-cricket-app.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket"]
});

// ── In-memory store ──────────────────────────────────────────────────────────
const rooms = {}; // roomId → gameState

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createGameState(roomId, maxOvers = 'Unlimited') {
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
    rematchRequests: {},  // { socketId: boolean }
    maxBalls: maxOvers === 'Unlimited' || !maxOvers ? null : parseInt(maxOvers) * 6,
    ballsPlayed: [0, 0],
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
    maxBalls: g.maxBalls,
    ballsPlayed: g.ballsPlayed,
  };
}

function getPlayerIdx(g, socketId) {
  return g.players.findIndex((p) => p.socketId === socketId);
}

function checkTossMoves(g) {
  const p1Sid = g.players[0].socketId;
  const p2Sid = g.players[1].socketId;
  if (g.toss.moves[p1Sid] !== undefined && g.toss.moves[p2Sid] !== undefined) {
    resolveToss(g);
  }
}

function startToss(g) {
  g.phase = 'toss';
  // Randomly choose who calls
  g.toss.callerIdx = Math.floor(Math.random() * 2);
  broadcastState(g.roomId);
  io.to(g.roomId).emit('tossStart', { callerIdx: g.toss.callerIdx });

  if (g.isSinglePlayer && g.players[g.toss.callerIdx].id === 'AI') {
    setTimeout(() => {
      const choices = ['odd', 'even'];
      const choice = choices[Math.floor(Math.random() * 2)];
      g.toss.callerChoice = choice;
      io.to(g.roomId).emit('tossChoiceMade', { callerIdx: g.toss.callerIdx, choice });
      io.to(g.roomId).emit('tossThrow');

      setTimeout(() => {
        const aiNum = Math.ceil(Math.random() * 6);
        g.toss.moves['AI'] = aiNum;
        checkTossMoves(g);
      }, 800);
    }, 1500);
  }
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

  if (g.isSinglePlayer && g.toss.winnerId === 'AI') {
    setTimeout(() => {
      const choices = ['bat', 'bowl'];
      const choice = choices[Math.floor(Math.random() * 2)];
      let batterSid;
      if (choice === 'bat') {
        batterSid = 'AI';
      } else {
        batterSid = g.players.find((p) => p.id !== 'AI')?.socketId;
      }
      g.toss.batFirst = batterSid;

      io.to(g.roomId).emit('batBowlDecision', {
        choice,
        batterIdx: g.players.findIndex((p) => p.socketId === batterSid),
      });

      setTimeout(() => startInnings(g, batterSid), 1500);
    }, 2000);
  }
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

  g.ballsPlayed[inningsScoreIdx]++;

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
    ballsPlayed: g.ballsPlayed[inningsScoreIdx],
    maxBalls: g.maxBalls,
  };

  io.to(g.roomId).emit('ballResult', ballResult);

  g.moves = {};

  const maxBallsReached = g.maxBalls !== null && g.ballsPlayed[inningsScoreIdx] >= g.maxBalls;

  // Check innings-over conditions
  if (isOut || maxBallsReached) {
    setTimeout(() => {
      if (g.innings === 2 && g.score[1] >= g.target) {
        // Chasing team won on the last ball / getting out (Wait, if they get out, they don't score. So if score >= target, they already won).
        endGame(g, g.players[g.currentBatterIdx].id);
      } else {
        endInnings(g);
      }
    }, 2500);
  } else if (g.innings === 2 && g.score[1] >= g.target) {
    // Chasing team won
    setTimeout(() => endGame(g, g.players[g.currentBatterIdx].id), 2500);
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
    }, 2500);
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
    // Innings 2 over
    if (g.score[1] === g.score[0]) {
      endGame(g, 'tie');
    } else {
      const bowlingTeamId = g.players[g.currentBowlerIdx].id;
      endGame(g, bowlingTeamId);
    }
  }
}

function endGame(g, winnerId) {
  clearAllTimers(g);
  g.phase = 'gameOver';
  
  let winnerName = 'Unknown';
  if (winnerId === 'tie') {
    winnerName = 'Tie';
  } else {
    const winner = g.players.find((p) => p.id === winnerId);
    if (winner) winnerName = winner.name;
  }
  
  broadcastState(g.roomId);
  io.to(g.roomId).emit('gameOver', {
    winnerId,
    winnerName,
    score: g.score,
    target: g.target,
    isTie: winnerId === 'tie'
  });
}

// ── AI Logic (Single Player) ─────────────────────────────────────────────────
// AI is represented as a fake "player" with id 'AI' and socketId 'AI'

function aiMove(g) {
  const isBatting = g.players[g.currentBatterIdx].socketId === 'AI';
  const inningsScoreIdx = g.innings - 1;
  const maxBalls = g.maxBalls;
  const ballsPlayed = g.ballsPlayed[inningsScoreIdx];
  const target = g.target;
  const score = g.score[inningsScoreIdx];

  let pool = [1, 2, 3, 4, 5, 6];

  // Smart logic applies mostly in the 2nd innings when chasing a target with limited balls
  if (g.innings === 2 && maxBalls !== null && target !== null) {
    const runsNeeded = target - score;
    const ballsLeft = maxBalls - ballsPlayed;
    
    if (ballsLeft > 0) {
      // Calculate the absolute minimum number the batter MUST hit to mathematically stay in the game.
      // Example: 12 runs needed in 2 balls -> minRequired = 12 - (1 * 6) = 6.
      let minRequired = runsNeeded - ((ballsLeft - 1) * 6);
      
      if (minRequired > 6) {
        // Impossible to win, just play randomly
        minRequired = 1;
      } else if (minRequired < 1) {
        minRequired = 1;
      }
      
      // If the batter is forced to hit big numbers to win, limit the pool.
      // If AI is batting: it MUST hit these big numbers to survive.
      // If AI is bowling: it knows the human MUST hit these big numbers, so it bowls them to get the human out!
      pool = [];
      for (let i = minRequired; i <= 6; i++) {
        pool.push(i);
      }
    }
  }

  // Pick a random number from the smart pool
  let num = pool[Math.floor(Math.random() * pool.length)];
  
  // Fair AI tweak: if it's a completely random guess (pool is large), reduce the chance of 
  // perfectly predicting the human's move instantly, so the human doesn't feel the game is rigged.
  const humanSid = g.players.find((p) => p.id !== 'AI')?.socketId;
  const humanMove = g.moves[humanSid];
  
  if (humanMove !== undefined && !isBatting && pool.length > 2) {
    if (num === humanMove && Math.random() < 0.3) {
      num = pool[Math.floor(Math.random() * pool.length)]; // Reroll
    }
  }
  
  return num;
}

function handleAiMove(g) {
  if (g.phase !== 'batting') return;
  setTimeout(() => {
    const aiNum = aiMove(g);
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
  socket.on('createRoom', ({ playerName, overs }) => {
    const roomId = generateRoomId();
    const g = createGameState(roomId, overs);
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
  socket.on('startSinglePlayer', ({ playerName, overs }) => {
    const roomId = generateRoomId();
    const g = createGameState(roomId, overs);
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

  // checkTossMoves is defined globally

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

  // ── REMATCH ───────────────────────────────────────────────────────────────
  socket.on('requestRematch', () => {
    const roomId = socket.data.roomId;
    const g = rooms[roomId];
    if (!g || g.phase !== 'gameOver') return;

    g.rematchRequests[socket.id] = true;

    // Check if everyone requested
    const allRequested = g.isSinglePlayer || g.players.every(p => g.rematchRequests[p.socketId]);

    if (allRequested) {
      // Reset game state
      g.innings = 1;
      g.score = [0, 0];
      g.ballsPlayed = [0, 0];
      g.target = null;
      g.currentBatterIdx = null;
      g.currentBowlerIdx = null;
      g.moves = {};
      g.timers = {};
      g.rematchRequests = {};
      g.toss = { callerIdx: null, callerChoice: null, moves: {}, winnerId: null, batFirst: null };
      
      // Tell everyone game is restarting
      io.to(roomId).emit('rematchAccepted');
      
      // Start toss again
      setTimeout(() => startToss(g), 500);
    } else {
      // Tell room someone requested
      const pIdx = getPlayerIdx(g, socket.id);
      io.to(roomId).emit('rematchRequested', { playerIdx: pIdx });
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
