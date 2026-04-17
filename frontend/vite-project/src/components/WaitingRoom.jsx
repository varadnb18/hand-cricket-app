export default function WaitingRoom({ roomId, players, onBack }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grass.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>

      <div className="w-full max-w-md text-center relative z-10">
        {/* Spinner */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-white/10" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🏏</div>
        </div>

        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Pavilion</h2>
        <p className="text-gray-300 text-sm mb-8 font-bold uppercase tracking-widest">Waiting for opponent to join</p>

        {/* Room Code Display */}
        <div className="glass-card mb-6 glow-pulse bg-black/60 border-yellow-400">
          <p className="text-xs font-black text-yellow-400 uppercase tracking-widest mb-2">ROOM CODE</p>
          <p className="text-6xl font-black tracking-[0.2em] text-white font-mono">{roomId}</p>
          <button
            onClick={() => navigator.clipboard.writeText(roomId)}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-xs font-bold text-gray-200 uppercase tracking-widest transition-colors flex items-center gap-2 mx-auto"
          >
            📋 COPY CODE
          </button>
        </div>

        {/* Players */}
        <div className="glass-card mb-8 bg-black/40 border-t-4 border-t-blue-500">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">TEAM ROSTER</p>
          <div className="space-y-3">
            {players.map((p, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/5 rounded-md px-4 py-3 border border-white/5">
                <div className={`w-3 h-3 rounded-full ${p ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gray-600'}`} />
                <span className="text-sm font-black uppercase tracking-wider">{p || (i === 0 ? 'Host' : 'Waiting…')}</span>
                {i === 0 && <span className="ml-auto text-[10px] font-black tracking-widest bg-blue-900/50 text-blue-400 px-2 py-1 rounded-sm border border-blue-500/30">HOST</span>}
              </div>
            ))}
            {players.length < 2 && (
              <div className="flex items-center gap-4 bg-white/5 rounded-md px-4 py-3 opacity-50 border border-white/5">
                <div className="w-3 h-3 rounded-full bg-gray-600 animate-pulse" />
                <span className="text-sm font-bold uppercase tracking-wider text-gray-400">WAITING FOR PLAYER 2...</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors text-sm font-black uppercase tracking-widest"
        >
          ← CANCEL MATCH
        </button>
      </div>
    </div>
  );
}
