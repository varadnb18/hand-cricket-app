export default function InningsBreak({ endedInnings, score, target, nextBatter }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-md text-center glass-card border border-violet-500/30 shadow-2xl shadow-violet-500/10">
        <div className="text-6xl mb-4">🔄</div>
        <h2 className="text-3xl font-black text-white mb-1">Innings Break!</h2>
        <p className="text-gray-400 text-sm mb-6">First innings over</p>

        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">First Innings Score</p>
          <p className="text-5xl font-black text-emerald-400">{score}</p>
        </div>

        <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 mb-6">
          <p className="text-xs text-amber-400 uppercase tracking-widest mb-1">🎯 Target</p>
          <p className="text-4xl font-black text-amber-400">{target}</p>
        </div>

        <p className="text-gray-400 text-sm">
          <span className="text-violet-400 font-semibold">{nextBatter}</span> now bats to chase
        </p>

        <div className="mt-6 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin" />
        </div>
        <p className="text-gray-600 text-xs mt-3">Starting 2nd innings…</p>
      </div>
    </div>
  );
}
