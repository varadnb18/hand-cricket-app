import { useEffect, useRef, useState } from 'react';
import socket from './socket';

import HomePage from './components/HomePage';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import TossScreen from './components/TossScreen';
import GameScreen from './components/GameScreen';
import InningsBreak from './components/InningsBreak';
import GameOver from './components/GameOver';
import SinglePlayerSetup from './components/SinglePlayerSetup';

// ── Screen constants ──────────────────────────────────────────────────────────
const SCREEN = {
  HOME: 'home',
  SP_SETUP: 'sp_setup',
  LOBBY: 'lobby',
  WAITING: 'waiting',
  TOSS: 'toss',
  INNINGS_BREAK: 'innings_break',
  GAME: 'game',
  GAME_OVER: 'game_over',
};

export default function App() {
  const [screen, setScreen] = useState(SCREEN.HOME);

  // Player info
  const [myIdx, setMyIdx] = useState(0);
  const [players, setPlayers] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);

  // Toss state
  const [tossPhase, setTossPhase] = useState('choosing'); // choosing | throwing | result | batbowl
  const [tossCallerIdx, setTossCallerIdx] = useState(0);
  const [tossCallerChoice, setTossCallerChoice] = useState(null);
  const [tossResult, setTossResult] = useState(null);
  const [batBowlWinnerIdx, setBatBowlWinnerIdx] = useState(null);

  // Game state (from server stateUpdate)
  const [gameState, setGameState] = useState({
    innings: 1,
    score: [0, 0],
    target: null,
    currentBatterIdx: 0,
    currentBowlerIdx: 1,
    phase: 'waiting',
  });

  // Ball result for reveal animation
  const [lastBall, setLastBall] = useState(null);
  const ballCountRef = useRef(0);

  // Innings break data
  const [inningsBreakData, setInningsBreakData] = useState(null);

  // Game over result
  const [gameOverResult, setGameOverResult] = useState(null);

  // Disconnect notice
  const [disconnectMsg, setDisconnectMsg] = useState('');

  // Error
  const [serverError, setServerError] = useState('');

  // ── Socket Setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setServerError('');
    });

    socket.on('connect_error', () => {
      setServerError('Cannot connect to server. Make sure the backend is running.');
    });

    socket.on('error', ({ message }) => {
      setServerError(message);
    });

    // Room events
    socket.on('roomCreated', ({ roomId: rid, playerIdx, isSinglePlayer: isSP }) => {
      setRoomId(rid);
      setMyIdx(playerIdx);
      setIsSinglePlayer(!!isSP);
      if (!isSP) setScreen(SCREEN.WAITING);
    });

    socket.on('joinedRoom', ({ roomId: rid, playerIdx }) => {
      setRoomId(rid);
      setMyIdx(playerIdx);
    });

    socket.on('rejoinSuccess', ({ playerIdx }) => {
      setMyIdx(playerIdx);
    });

    // Game start
    socket.on('gameStart', ({ players: ps }) => {
      setPlayers(ps);
    });

    // State sync
    socket.on('stateUpdate', (state) => {
      setGameState({
        innings: state.innings,
        score: state.score,
        target: state.target,
        currentBatterIdx: state.currentBatterIdx ?? 0,
        currentBowlerIdx: state.currentBowlerIdx ?? 1,
        phase: state.phase,
      });
      if (state.players?.length) setPlayers(state.players);
    });

    // Toss events
    socket.on('tossStart', ({ callerIdx }) => {
      setTossCallerIdx(callerIdx);
      setTossPhase('choosing');
      setTossResult(null);
      setScreen(SCREEN.TOSS);
    });

    socket.on('tossChoiceMade', ({ callerIdx, choice }) => {
      setTossCallerIdx(callerIdx);
      setTossCallerChoice(choice);
      setTossPhase('throwing');
    });

    socket.on('tossThrow', () => {
      setTossPhase('throwing');
    });

    socket.on('tossResult', (result) => {
      setTossResult(result);
      setTossPhase('result');
      // Give 1.5s then show bat/bowl choice
      setTimeout(() => {
        setTossPhase('batbowl');
      }, 1800);
    });

    socket.on('batBowlDecision', ({ batterIdx }) => {
      // Decision made, innings starting soon
    });

    // Innings events
    socket.on('inningsStart', ({ innings, batterIdx, bowlerIdx, target }) => {
      setGameState((g) => ({ ...g, innings, currentBatterIdx: batterIdx, currentBowlerIdx: bowlerIdx, target }));
      setLastBall(null);
      setScreen(SCREEN.GAME);
    });

    socket.on('inningsChange', ({ endedInnings, score, target }) => {
      setInningsBreakData({ endedInnings, score, target });
      setScreen(SCREEN.INNINGS_BREAK);
    });

    // Ball result
    socket.on('ballResult', (result) => {
      ballCountRef.current += 1;
      setLastBall({ ...result, ballCount: ballCountRef.current });
      setGameState((g) => ({ ...g, score: result.score, innings: result.innings, target: result.target }));
    });

    socket.on('nextBall', ({ innings, score, target }) => {
      setGameState((g) => ({ ...g, innings, score, target }));
    });

    socket.on('moveLocked', () => {
      // handled locally in GameScreen
    });

    // Game over
    socket.on('gameOver', (result) => {
      setGameOverResult(result);
      setScreen(SCREEN.GAME_OVER);
    });

    // Disconnect notice
    socket.on('playerDisconnected', ({ playerName }) => {
      setDisconnectMsg(`${playerName} disconnected. Waiting for them to reconnect…`);
      setTimeout(() => setDisconnectMsg(''), 5000);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('error');
      socket.off('roomCreated');
      socket.off('joinedRoom');
      socket.off('rejoinSuccess');
      socket.off('gameStart');
      socket.off('stateUpdate');
      socket.off('tossStart');
      socket.off('tossChoiceMade');
      socket.off('tossThrow');
      socket.off('tossResult');
      socket.off('batBowlDecision');
      socket.off('inningsStart');
      socket.off('inningsChange');
      socket.off('ballResult');
      socket.off('nextBall');
      socket.off('moveLocked');
      socket.off('gameOver');
      socket.off('playerDisconnected');
    };
  }, []);

  // ── Action Handlers ─────────────────────────────────────────────────────────
  function handleSinglePlayerStart(playerName) {
    setIsSinglePlayer(true);
    socket.emit('startSinglePlayer', { playerName });
  }

  function handleCreateRoom(playerName) {
    socket.emit('createRoom', { playerName });
  }

  function handleJoinRoom(playerName, roomCode) {
    setServerError('');
    socket.emit('joinRoom', { roomId: roomCode, playerName });
    setScreen(SCREEN.WAITING);
  }

  function handleTossChoice(choice) {
    socket.emit('tossChoice', { choice });
  }

  function handleTossMove(number) {
    socket.emit('tossMove', { number });
  }

  function handleBatBowlChoice(choice) {
    socket.emit('batBowlChoice', { choice });
  }

  function handlePlayerMove(number) {
    socket.emit('playerMove', { number });
  }

  function resetAll() {
    setScreen(SCREEN.HOME);
    setPlayers([]);
    setRoomId('');
    setMyIdx(0);
    setIsSinglePlayer(false);
    setTossPhase('choosing');
    setTossCallerIdx(0);
    setTossCallerChoice(null);
    setTossResult(null);
    setBatBowlWinnerIdx(null);
    setGameState({ innings: 1, score: [0, 0], target: null, currentBatterIdx: 0, currentBowlerIdx: 1, phase: 'waiting' });
    setLastBall(null);
    setInningsBreakData(null);
    setGameOverResult(null);
    setDisconnectMsg('');
    setServerError('');
    ballCountRef.current = 0;
    socket.disconnect();
    setTimeout(() => socket.connect(), 300);
  }

  // Find winner idx for toss screen
  const tossWinnerIdx = tossResult
    ? players.findIndex((p) => p.id === tossResult.winnerId)
    : null;

  // Innings break: next batter name
  const inningsBreakNextBatter = inningsBreakData
    ? players[gameState.currentBowlerIdx]?.name ?? 'Opponent'
    : '';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Server error toast */}
      {serverError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-500/50 text-red-200 text-sm px-5 py-3 rounded-xl shadow-2xl max-w-sm text-center animate-slide-up">
          ⚠️ {serverError}
        </div>
      )}

      {/* Disconnect notice */}
      {disconnectMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-900/90 border border-amber-500/50 text-amber-200 text-sm px-5 py-3 rounded-xl shadow-2xl max-w-sm text-center animate-slide-up">
          📡 {disconnectMsg}
        </div>
      )}

      {/* ── Screens ─────────────────────────────────────────────────────── */}
      {screen === SCREEN.HOME && (
        <HomePage
          onSinglePlayer={() => setScreen(SCREEN.SP_SETUP)}
          onMultiplayer={() => setScreen(SCREEN.LOBBY)}
        />
      )}

      {screen === SCREEN.SP_SETUP && (
        <SinglePlayerSetup
          onStart={handleSinglePlayerStart}
          onBack={() => setScreen(SCREEN.HOME)}
        />
      )}

      {screen === SCREEN.LOBBY && (
        <Lobby
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onBack={() => setScreen(SCREEN.HOME)}
        />
      )}

      {screen === SCREEN.WAITING && (
        <WaitingRoom
          roomId={roomId}
          players={players.map((p) => p?.name)}
          onBack={resetAll}
        />
      )}

      {screen === SCREEN.TOSS && (
        <TossScreen
          players={players}
          myIdx={myIdx}
          callerIdx={tossCallerIdx}
          callerChoice={tossCallerChoice}
          tossResult={tossResult}
          batBowlWinnerIdx={tossWinnerIdx}
          onTossChoice={handleTossChoice}
          onTossMove={handleTossMove}
          onBatBowlChoice={handleBatBowlChoice}
          phase={tossPhase}
        />
      )}

      {screen === SCREEN.INNINGS_BREAK && inningsBreakData && (
        <InningsBreak
          endedInnings={inningsBreakData.endedInnings}
          score={inningsBreakData.score}
          target={inningsBreakData.target}
          nextBatter={inningsBreakNextBatter}
        />
      )}

      {screen === SCREEN.GAME && (
        <GameScreen
          players={players}
          myIdx={myIdx}
          gameState={gameState}
          lastBall={lastBall}
          onMove={handlePlayerMove}
          isSinglePlayer={isSinglePlayer}
        />
      )}

      {screen === SCREEN.GAME_OVER && gameOverResult && (
        <GameOver
          result={gameOverResult}
          players={players}
          myIdx={myIdx}
          onPlayAgain={resetAll}
          onHome={resetAll}
        />
      )}
    </div>
  );
}
