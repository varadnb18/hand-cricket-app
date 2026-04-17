import { useEffect, useRef, useState } from 'react';

const TIMER_SECONDS = 15;

export default function GameScreen({
  players,
  myIdx,
  gameState,
  lastBall,
  onMove,
  isSinglePlayer,
}) {
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [showReveal, setShowReveal] = useState(false);
  const [revealData, setRevealData] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const timerRef = useRef(null);
  const prevBall = useRef(null);

  const { innings, score, target, currentBatterIdx, currentBowlerIdx } = gameState;
  const myPlayer = players[myIdx];
  const oppIdx = 1 - myIdx;
  const oppPlayer = players[oppIdx];
  const iAmBatting = currentBatterIdx === myIdx;
  const iAmBowling = currentBowlerIdx === myIdx;

  // Start countdown timer
  function startTimer() {
    setTimeLeft(TIMER_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  // Reset when new ball starts
  useEffect(() => {
    setSelected(null);
    setLocked(false);
    setShowReveal(false);
    setRevealData(null);
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [lastBall?.ballCount]);

  // Show ball result reveal
  useEffect(() => {
    if (lastBall && lastBall !== prevBall.current) {
      prevBall.current = lastBall;
      clearInterval(timerRef.current);
      setShowReveal(true);
      setRevealData(lastBall);
      if (lastBall.isOut) setIsShaking(true);
      const t = setTimeout(() => {
        setShowReveal(false);
        setIsShaking(false);
      }, 2200);
      return () => clearTimeout(t);
    }
  }, [lastBall]);

  function handlePick(n) {
    if (locked || showReveal) return;
    setSelected(n);
    setLocked(true);
    clearInterval(timerRef.current);
    onMove(n);
  }

  const timerPct = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor = timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-6 animate-fade-in">
      <div className="w-full max-w-lg space-y-4">

        {/* ── Top Bar: Innings + Target ─────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`badge ${innings === 1 ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30' : 'bg-violet-900/50 text-violet-400 border border-violet-500/30'}`}>
              {innings === 1 ? '1st Innings' : '2nd Innings'}
            </span>
            {isSinglePlayer && (
              <span className="badge bg-blue-900/50 text-blue-400 border border-blue-500/30">vs AI</span>
            )}
          </div>
          {innings === 2 && target && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Target</p>
              <p className="text-xl font-black text-amber-400">{target}</p>
            </div>
          )}
        </div>

        {/* ── Scoreboard ────────────────────────────────────────────── */}
        <div className="glass-card">
          <div className="grid grid-cols-2 gap-4 text-center">
            {players.map((p, i) => {
              const isBatter = currentBatterIdx === i;
              const isBowler = currentBowlerIdx === i;
              // In innings 1: batter = score[0], bowler = 0 shown (they bowl)
              // In innings 2: batter = score[1], bowler = score[0] (what they set)
              const displayScore = innings === 1
                ? (isBatter ? score[0] : '-')
                : (isBatter ? score[1] : score[0]);
              return (
                <div key={i} className={`rounded-xl p-3 transition-all duration-300 ${i === myIdx ? 'bg-emerald-900/20 border border-emerald-500/20' : 'bg-white/5 border border-white/5'}`}>
                  <p className="text-xs text-gray-400 font-medium truncate mb-1">{p?.name ?? '?'}</p>
                  <p className={`text-3xl font-black ${i === myIdx ? 'text-emerald-400' : 'text-white'}`}>
                    {displayScore ?? 0}
                  </p>
                  <div className="flex justify-center gap-1 mt-1">
                    {isBatter && <span className="badge bg-emerald-900/50 text-emerald-400 border border-emerald-500/20 text-[10px]">🏏 BAT</span>}
                    {isBowler && <span className="badge bg-amber-900/50 text-amber-400 border border-amber-500/20 text-[10px]">🎯 BOWL</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Innings Score summary */}
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-xs text-gray-500">
            <span>Innings 1: <span className="text-white font-semibold">{score[0] ?? 0}</span></span>
            {innings === 2 && <span>Innings 2: <span className="text-violet-400 font-semibold">{score[1] ?? 0}</span></span>}
            {innings === 2 && target && (
              <span>Need: <span className="text-amber-400 font-semibold">{Math.max(0, target - (score[1] ?? 0))}</span></span>
            )}
          </div>
        </div>

        {/* ── Ball Result Reveal ────────────────────────────────────── */}
        {showReveal && revealData && (
          <div className={`glass-card text-center border animate-slide-up ${revealData.isOut ? 'border-red-500/40 bg-red-900/10' : 'border-emerald-500/30 bg-emerald-900/10'} ${isShaking ? 'shake' : ''}`}>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Ball Result</p>
            <div className="flex items-center justify-center gap-6 mb-3">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">{players[currentBatterIdx]?.name}</p>
                <div className="num-btn selected reveal-anim mx-auto text-2xl w-16 h-16">
                  {revealData.batterNum}
                </div>
              </div>
              <div className="text-2xl font-black text-gray-500">vs</div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">{players[currentBowlerIdx]?.name}</p>
                <div className="num-btn out reveal-anim mx-auto text-2xl w-16 h-16">
                  {revealData.bowlerNum}
                </div>
              </div>
            </div>
            {revealData.isOut ? (
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl">💥</span>
                <p className="text-2xl font-black text-red-400">OUT!</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <p className="text-2xl font-black text-emerald-400">+{revealData.runsScored} runs</p>
              </div>
            )}
          </div>
        )}

        {/* ── Your Role Label ───────────────────────────────────────── */}
        {!showReveal && (
          <div className="text-center">
            <p className="text-sm text-gray-400">
              You are{' '}
              <span className={`font-bold ${iAmBatting ? 'text-emerald-400' : 'text-amber-400'}`}>
                {iAmBatting ? '🏏 Batting' : '🎯 Bowling'}
              </span>
            </p>
          </div>
        )}

        {/* ── Number Input ──────────────────────────────────────────── */}
        {!showReveal && (
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-300">
                {locked ? '✅ Move locked in!' : 'Pick your number'}
              </p>
              {/* Timer bar */}
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold tabular-nums ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-gray-300'}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>

            {/* Timer bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
                style={{ width: `${timerPct}%` }}
              />
            </div>

            <div className="grid grid-cols-6 gap-2 justify-items-center">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  disabled={locked}
                  onClick={() => handlePick(n)}
                  className={`num-btn ${selected === n ? 'selected' : ''}`}
                >
                  {n}
                </button>
              ))}
            </div>

            {locked && (
              <p className="text-center text-xs text-gray-500 mt-4 animate-pulse">
                Waiting for {oppPlayer?.name ?? 'opponent'}…
              </p>
            )}
          </div>
        )}

        {/* ── Innings Change Banner ─────────────────────────────────── */}
        {/* shown from parent via prop if needed */}
      </div>
    </div>
  );
}
