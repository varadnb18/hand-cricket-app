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
  const timerColor = timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-amber-400' : 'bg-green-500';

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-2 py-4 animate-fade-in relative">
      {/* ── TV Scoreboard (Top) ────────────────────────────────────── */}
      <div className="w-full max-w-lg mb-4 glass-card p-3 flex flex-col shadow-2xl relative overflow-hidden">
        {/* Subtle grass texture behind scoreboard */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]" />
        
        <div className="relative z-10 flex items-center justify-between border-b-2 border-white/10 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="badge bg-blue-600 text-white shadow-md">
              {innings === 1 ? '1ST INNINGS' : '2ND INNINGS'}
            </span>
            {isSinglePlayer && (
              <span className="badge bg-slate-700 text-white shadow-md">vs AI</span>
            )}
          </div>
          {innings === 2 && target && (
            <div className="text-right flex items-baseline gap-2">
              <span className="text-xs text-yellow-400 font-bold uppercase tracking-wider">Target</span>
              <span className="text-xl font-black text-white">{target}</span>
            </div>
          )}
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 text-center">
          {players.map((p, i) => {
            const isBatter = currentBatterIdx === i;
            const isBowler = currentBowlerIdx === i;
            const displayScore = innings === 1
              ? (isBatter ? score[0] : '-')
              : (isBatter ? score[1] : score[0]);
            
            return (
              <div key={i} className={`rounded-md p-2 flex flex-col justify-center border-l-4 ${i === myIdx ? 'bg-blue-900/40 border-blue-400' : 'bg-slate-800/40 border-slate-500'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-gray-300 font-bold uppercase truncate max-w-[80px]">{p?.name ?? '?'}</span>
                  {isBatter && <span className="text-[10px] bg-yellow-500 text-black px-1 rounded-sm font-black">BAT</span>}
                  {isBowler && <span className="text-[10px] bg-red-500 text-white px-1 rounded-sm font-black">BOWL</span>}
                </div>
                <div className="text-3xl font-black font-mono text-white tracking-tighter">
                  {displayScore ?? 0}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Line */}
        <div className="relative z-10 mt-2 pt-2 border-t border-white/10 flex justify-between text-[11px] text-gray-300 font-bold uppercase">
          <span>Overs: <span className="text-white">Unlimited</span></span>
          {innings === 2 && target && (
            <span className="text-yellow-400">Need {Math.max(0, target - (score[1] ?? 0))} to win</span>
          )}
        </div>
      </div>

      {/* ── Pitch Area (Center) ────────────────────────────────────── */}
      <div className="flex-1 w-full max-w-sm relative flex flex-col items-center justify-between py-8">
        {/* The Pitch Background */}
        <div className="absolute inset-y-0 w-3/4 bg-[#e8cd96] opacity-30 rounded-t-3xl rounded-b-3xl" style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)' }}></div>
        {/* Stumps Top */}
        <div className="flex gap-1 z-10 opacity-70">
          <div className="w-1.5 h-8 bg-white rounded-t-sm shadow-sm"></div>
          <div className="w-1.5 h-8 bg-white rounded-t-sm shadow-sm"></div>
          <div className="w-1.5 h-8 bg-white rounded-t-sm shadow-sm"></div>
        </div>

        {/* Ball Reveal Animation */}
        {showReveal && revealData && (
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center ${isShaking ? 'shake' : ''}`}>
             <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-white mb-1 shadow-black">{players[currentBatterIdx]?.name}</span>
                  <div className="num-btn w-16 h-16 text-3xl shadow-2xl"><span>{revealData.batterNum}</span></div>
                </div>
                <span className="text-2xl font-black text-white italic drop-shadow-lg">VS</span>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-white mb-1 shadow-black">{players[currentBowlerIdx]?.name}</span>
                  <div className="num-btn w-16 h-16 text-3xl shadow-2xl animate-ball-bowl"><span>{revealData.bowlerNum}</span></div>
                </div>
             </div>

             <div className="mt-8">
                {revealData.isOut ? (
                  <div className="text-center bg-red-600 border-4 border-white px-6 py-2 rounded-lg shadow-2xl transform -rotate-6 scale-110">
                    <p className="text-4xl font-black text-white tracking-widest uppercase">WICKET!</p>
                  </div>
                ) : (
                  <div className="text-center bg-green-600 border-4 border-white px-6 py-2 rounded-lg shadow-2xl transform rotate-3 scale-110">
                    <p className="text-4xl font-black text-white tracking-widest uppercase">+{revealData.runsScored} RUNS</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {!showReveal && (
          <div className="z-10 text-center bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
             <p className="text-sm font-bold text-white uppercase tracking-widest">
               {iAmBatting ? '🏏 You are Batting' : '🎯 You are Bowling'}
             </p>
          </div>
        )}

        {/* Stumps Bottom */}
        <div className="flex gap-1 z-10 opacity-70">
          <div className="w-1.5 h-10 bg-white rounded-t-sm shadow-sm"></div>
          <div className="w-1.5 h-10 bg-white rounded-t-sm shadow-sm"></div>
          <div className="w-1.5 h-10 bg-white rounded-t-sm shadow-sm"></div>
        </div>
      </div>

      {/* ── Controls (Bottom) ──────────────────────────────────────── */}
      <div className="w-full max-w-lg mt-4 bg-[#0a1622]/90 backdrop-blur-md p-4 rounded-t-3xl border-t-2 border-blue-500/50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {!showReveal && (
          <>
            <div className="flex items-center justify-between mb-3 px-2">
              <p className="text-xs font-black uppercase text-gray-300 tracking-wider">
                {locked ? '✅ BALL LOCKED' : 'SELECT YOUR DELIVERY'}
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black tabular-nums ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                  00:{timeLeft.toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Timer bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full mb-5 overflow-hidden">
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
                  <span>{n}</span>
                </button>
              ))}
            </div>

            {locked && (
              <p className="text-center text-xs text-yellow-400 mt-4 animate-pulse font-bold tracking-widest uppercase">
                WAITING FOR OPPONENT...
              </p>
            )}
          </>
        )}
        {showReveal && (
           <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest h-20 flex items-center justify-center">
             Umpire Decision...
           </p>
        )}
      </div>
    </div>
  );
}
