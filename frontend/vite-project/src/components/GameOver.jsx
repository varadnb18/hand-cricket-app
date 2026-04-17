export default function GameOver({ result, players, myIdx, onPlayAgain, onHome }) {
  const { winnerId, winnerName, score, target } = result;
  const myPlayer = players[myIdx];
  const iWon = myPlayer && myPlayer.id === winnerId;
  const isDraw = !winnerId;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-md text-center">

        {/* Trophy / Result */}
        <div className={`glass-card mb-6 border ${iWon ? 'border-yellow-500/40 shadow-2xl shadow-yellow-500/10' : isDraw ? 'border-gray-500/30' : 'border-red-500/30 shadow-red-500/10'}`}>
          <div className="text-7xl mb-4 animate-bounce-slow">
            {iWon ? '🏆' : isDraw ? '🤝' : '😢'}
          </div>
          <h1 className={`text-4xl font-black mb-2 ${iWon ? 'text-yellow-400' : isDraw ? 'text-gray-300' : 'text-red-400'}`}>
            {iWon ? 'You Won!' : isDraw ? "It's a Draw!" : 'You Lost!'}
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            {winnerName ? <><span className="text-white font-semibold">{winnerName}</span> won the match</> : 'Match tied!'}
          </p>

          {/* Score breakdown */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">1st Innings</p>
              <p className="text-2xl font-black text-emerald-400">{score?.[0] ?? 0}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">2nd Innings</p>
              <p className="text-2xl font-black text-violet-400">{score?.[1] ?? 0}</p>
            </div>
          </div>

          {target && (
            <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl px-4 py-2 text-sm text-amber-400">
              Target was <span className="font-bold">{target}</span>
            </div>
          )}
        </div>

        {/* Player results */}
        <div className="glass-card mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Players</p>
          <div className="space-y-2">
            {players.map((p, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-lg px-4 py-3 ${p?.id === winnerId ? 'bg-yellow-900/20 border border-yellow-500/20' : 'bg-white/5'}`}>
                <span className="text-lg">{p?.id === winnerId ? '🏆' : '🏏'}</span>
                <span className="font-medium text-sm flex-1 text-left">{p?.name}</span>
                {p?.id === winnerId && <span className="badge bg-yellow-900/50 text-yellow-400 border border-yellow-500/30">WINNER</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-green-500 shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            🔄 Play Again
          </button>
          <button
            onClick={onHome}
            className="w-full py-3 rounded-xl font-semibold text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  );
}
