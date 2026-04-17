import { useState } from 'react';

const ODD_EVEN = ['odd', 'even'];

export default function TossScreen({
  players,
  myIdx,
  callerIdx,
  callerChoice,
  tossResult,
  batBowlWinnerIdx,
  onTossChoice,
  onTossMove,
  onBatBowlChoice,
  phase, // 'choosing' | 'throwing' | 'result' | 'batbowl'
}) {
  const [selectedNum, setSelectedNum] = useState(null);
  const [moved, setMoved] = useState(false);

  const isCaller = myIdx === callerIdx;
  const myName = players[myIdx]?.name ?? 'You';
  const opponentName = players[1 - myIdx]?.name ?? 'Opponent';

  function pickTossNum(n) {
    if (moved) return;
    setSelectedNum(n);
    setMoved(true);
    onTossMove(n);
  }

  function pickBatBowl(choice) {
    onBatBowlChoice(choice);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in relative overflow-hidden">
      {/* Stadium grass background overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grass.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>

      <div className="w-full max-w-lg text-center relative z-10">
        
        {/* Pitch Graphic Top */}
        <div className="mb-6 mx-auto w-32 h-8 bg-[#e8cd96] opacity-30 rounded-t-full shadow-inner"></div>

        <div className="text-6xl mb-2 animate-bounce-slow">🪙</div>
        <h2 className="text-4xl font-black text-white mb-1 uppercase tracking-widest drop-shadow-lg">Toss Time!</h2>
        <p className="text-green-300 text-sm mb-8 font-bold uppercase tracking-wider">
          <span className="text-white">{players[callerIdx]?.name ?? 'Player'}</span> is calling the toss
        </p>

        {/* Phase: Caller picks odd/even */}
        {phase === 'choosing' && (
          <div className="glass-card animate-slide-up bg-black/60 border-yellow-500">
            {isCaller ? (
              <>
                <p className="text-white font-bold mb-6 text-lg tracking-wide">WHAT'S YOUR CALL?</p>
                <div className="flex gap-4 justify-center">
                  {ODD_EVEN.map((c) => (
                    <button
                      key={c}
                      onClick={() => onTossChoice(c)}
                      className="px-8 py-4 rounded-md font-black text-xl uppercase tracking-widest transition-all duration-200 hover:scale-105 active:scale-95
                        bg-gradient-to-b from-blue-500 to-blue-800 text-white shadow-[0_4px_0_#1e3a8a] active:shadow-none active:translate-y-1"
                    >
                      {c === 'odd' ? '1️⃣ ODD' : '2️⃣ EVEN'}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full border-4 border-yellow-400/30 border-t-yellow-400 animate-spin" />
                <p className="text-gray-300 font-bold uppercase tracking-wider">Waiting for {players[callerIdx]?.name} to call…</p>
              </div>
            )}
          </div>
        )}

        {/* Phase: Both throw a number */}
        {phase === 'throwing' && (
          <div className="glass-card animate-slide-up bg-black/60 border-blue-500">
            <div className="bg-blue-900/50 rounded-lg p-3 mb-6 border border-blue-500/30">
              <p className="text-white font-bold text-sm">
                {players[callerIdx]?.name} called <span className="text-yellow-400 uppercase font-black text-lg ml-1">{callerChoice}</span>
              </p>
            </div>
            <p className="text-gray-300 text-xs font-black uppercase tracking-widest mb-4">SELECT YOUR NUMBER</p>

            {moved ? (
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="num-btn selected w-20 h-20 text-4xl"><span>{selectedNum}</span></div>
                <p className="text-green-400 text-sm font-black uppercase tracking-widest animate-pulse">
                  ✓ LOCKED IN!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-2 justify-items-center">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button key={n} className="num-btn" onClick={() => pickTossNum(n)}>
                    <span>{n}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Phase: Toss result */}
        {phase === 'result' && tossResult && (
          <div className="glass-card animate-slide-up bg-black/60 border-yellow-500">
            <div className="text-6xl mb-4">{tossResult.winnerId === players[myIdx]?.id ? '🎉' : '🏏'}</div>
            <p className="text-3xl font-black text-yellow-400 mb-1 uppercase tracking-wider drop-shadow-md">
              {tossResult.winnerName} WINS THE TOSS!
            </p>
            <div className="mt-4 bg-white/10 rounded-lg p-3 inline-block">
              <p className="text-gray-200 text-sm font-bold uppercase">
                Total: <span className="text-white font-black text-xl ml-1">{tossResult.total}</span>
                <span className="text-blue-400 ml-2">({tossResult.total % 2 === 0 ? 'EVEN' : 'ODD'})</span>
              </p>
            </div>
          </div>
        )}

        {/* Phase: Winner chooses bat/bowl */}
        {phase === 'batbowl' && (
          <div className="glass-card animate-slide-up bg-black/60 border-green-500">
            {myIdx === batBowlWinnerIdx ? (
              <>
                <p className="text-yellow-400 font-black text-xl uppercase tracking-widest mb-6">YOU WON! WHAT WILL YOU DO?</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => pickBatBowl('bat')}
                    className="flex-1 py-5 rounded-md font-black text-2xl tracking-widest uppercase transition-all duration-200 hover:scale-105 active:scale-95
                      bg-gradient-to-b from-green-500 to-green-700 text-white shadow-[0_4px_0_#14532d] active:shadow-none active:translate-y-1"
                  >
                    🏏 BAT
                  </button>
                  <button
                    onClick={() => pickBatBowl('bowl')}
                    className="flex-1 py-5 rounded-md font-black text-2xl tracking-widest uppercase transition-all duration-200 hover:scale-105 active:scale-95
                      bg-gradient-to-b from-red-500 to-red-700 text-white shadow-[0_4px_0_#7f1d1d] active:shadow-none active:translate-y-1"
                  >
                    🎯 BOWL
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full border-4 border-green-400/30 border-t-green-400 animate-spin" />
                <p className="text-gray-300 font-bold uppercase tracking-wider">Waiting for {players[batBowlWinnerIdx]?.name} to decide…</p>
              </div>
            )}
          </div>
        )}

        {/* Pitch Graphic Bottom */}
        <div className="mt-6 mx-auto w-40 h-10 bg-[#e8cd96] opacity-30 rounded-b-full shadow-inner"></div>
      </div>
    </div>
  );
}
