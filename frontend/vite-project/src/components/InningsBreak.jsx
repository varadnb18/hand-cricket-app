export default function InningsBreak({ endedInnings, score, target, nextBatter }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grass.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>

      <div className="w-full max-w-md text-center glass-card border-t-8 border-t-blue-600 bg-black/80 shadow-2xl relative z-10">
        <div className="text-6xl mb-4 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">🔄</div>
        <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">INNINGS BREAK</h2>
        <p className="text-gray-300 text-sm mb-6 font-bold uppercase tracking-widest border-b border-white/10 pb-4">First Innings Complete</p>

        <div className="bg-blue-900/30 rounded-md p-4 mb-4 border border-blue-500/20">
          <p className="text-xs text-blue-300 font-black uppercase tracking-widest mb-1">SCORE TO BEAT</p>
          <p className="text-6xl font-black text-white font-mono">{score}</p>
        </div>

        <div className="bg-yellow-900/40 border border-yellow-500/40 rounded-md p-4 mb-8">
          <p className="text-sm text-yellow-400 font-black uppercase tracking-widest mb-1">🎯 TARGET</p>
          <p className="text-5xl font-black text-yellow-400 font-mono drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">{target}</p>
        </div>

        <div className="bg-white/5 p-4 rounded-md border border-white/10">
          <p className="text-gray-300 text-sm font-bold uppercase tracking-wider">
            <span className="text-green-400 font-black text-lg block mb-1">{nextBatter}</span> 
            IS PADDING UP TO CHASE...
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-white/10 border-t-yellow-400 animate-spin" />
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest">STARTING 2ND INNINGS</p>
        </div>
      </div>
    </div>
  );
}
