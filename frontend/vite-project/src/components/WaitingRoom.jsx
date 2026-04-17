export default function WaitingRoom({ roomId, players, onBack }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-md text-center">
        {/* Spinner */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">🏏</div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Waiting for opponent…</h2>
        <p className="text-gray-400 text-sm mb-8">Share the room code with your friend</p>

        {/* Room Code Display */}
        <div className="glass-card mb-6 glow-pulse">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Room Code</p>
          <p className="text-5xl font-black tracking-widest text-emerald-400 font-mono">{roomId}</p>
          <button
            onClick={() => navigator.clipboard.writeText(roomId)}
            className="mt-3 text-xs text-gray-500 hover:text-emerald-400 transition-colors flex items-center gap-1 mx-auto"
          >
            📋 Click to copy
          </button>
        </div>

        {/* Players */}
        <div className="glass-card mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Players</p>
          <div className="space-y-2">
            {players.map((p, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2">
                <div className={`w-2 h-2 rounded-full ${p ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                <span className="text-sm font-medium">{p || (i === 0 ? 'Host' : 'Waiting…')}</span>
                {i === 0 && <span className="ml-auto badge bg-emerald-900/50 text-emerald-400 border border-emerald-500/30">HOST</span>}
              </div>
            ))}
            {players.length < 2 && (
              <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2 opacity-50">
                <div className="w-2 h-2 rounded-full bg-gray-600 animate-pulse" />
                <span className="text-sm font-medium text-gray-500">Waiting for player 2…</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onBack}
          className="text-gray-500 hover:text-white transition-colors text-sm"
        >
          ← Leave Room
        </button>
      </div>
    </div>
  );
}
