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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-lg text-center">
        <div className="text-5xl mb-4">🪙</div>
        <h2 className="text-3xl font-black text-white mb-1">Toss Time!</h2>
        <p className="text-gray-400 text-sm mb-8">
          {players[callerIdx]?.name ?? 'Player'} is calling the toss
        </p>

        {/* Phase: Caller picks odd/even */}
        {phase === 'choosing' && (
          <div className="glass-card animate-slide-up">
            {isCaller ? (
              <>
                <p className="text-white font-semibold mb-6">You call — Odd or Even?</p>
                <div className="flex gap-4 justify-center">
                  {ODD_EVEN.map((c) => (
                    <button
                      key={c}
                      onClick={() => onTossChoice(c)}
                      className="px-8 py-4 rounded-xl font-bold text-lg capitalize transition-all duration-200 hover:scale-105 active:scale-95
                        bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
                    >
                      {c === 'odd' ? '1️⃣ Odd' : '2️⃣ Even'}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-violet-400/30 border-t-violet-400 animate-spin" />
                <p className="text-gray-400">Waiting for {players[callerIdx]?.name} to call…</p>
              </div>
            )}
          </div>
        )}

        {/* Phase: Both throw a number */}
        {phase === 'throwing' && (
          <div className="glass-card animate-slide-up">
            <p className="text-white font-semibold mb-2">
              {players[callerIdx]?.name} called <span className="text-violet-400 capitalize font-bold">{callerChoice}</span>
            </p>
            <p className="text-gray-400 text-sm mb-6">Now both pick a number 1–6!</p>

            {moved ? (
              <div className="flex flex-col items-center gap-3">
                <div className="num-btn selected text-3xl">{selectedNum}</div>
                <p className="text-emerald-400 text-sm font-medium animate-pulse">
                  ✓ Locked in! Waiting for opponent…
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-2 justify-items-center">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button key={n} className="num-btn" onClick={() => pickTossNum(n)}>
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Phase: Toss result */}
        {phase === 'result' && tossResult && (
          <div className="glass-card animate-slide-up">
            <div className="text-5xl mb-3">{tossResult.winnerId === players[myIdx]?.id ? '🎉' : '😔'}</div>
            <p className="text-2xl font-black text-white mb-1">
              {tossResult.winnerName} won the toss!
            </p>
            <p className="text-gray-400 text-sm">
              Total: <span className="text-white font-bold">{tossResult.total}</span>
              {' '}({tossResult.total % 2 === 0 ? 'Even' : 'Odd'})
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <span className="score-chip bg-emerald-900/40 text-emerald-400 border border-emerald-500/30">
                🎯 Toss done
              </span>
            </div>
          </div>
        )}

        {/* Phase: Winner chooses bat/bowl */}
        {phase === 'batbowl' && (
          <div className="glass-card animate-slide-up">
            {myIdx === batBowlWinnerIdx ? (
              <>
                <p className="text-white font-semibold mb-6">You won! Choose to…</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => pickBatBowl('bat')}
                    className="flex-1 py-5 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-95
                      bg-gradient-to-br from-emerald-600 to-green-500 text-white shadow-lg shadow-emerald-500/30"
                  >
                    🏏 Bat
                  </button>
                  <button
                    onClick={() => pickBatBowl('bowl')}
                    className="flex-1 py-5 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105 active:scale-95
                      bg-gradient-to-br from-amber-600 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                  >
                    🎯 Bowl
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-400/30 border-t-emerald-400 animate-spin" />
                <p className="text-gray-400">Waiting for {players[batBowlWinnerIdx]?.name} to decide…</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
