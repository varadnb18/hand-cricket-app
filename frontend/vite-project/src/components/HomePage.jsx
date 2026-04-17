import { useState } from 'react';

export default function HomePage({ onSinglePlayer, onMultiplayer }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="text-7xl mb-4 animate-bounce-slow">🏏</div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3 bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 bg-clip-text text-transparent">
          Hand Cricket
        </h1>
        <p className="text-gray-400 text-lg font-medium">
          The classic finger game — now online &amp; real-time
        </p>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Single Player */}
        <button
          onClick={onSinglePlayer}
          onMouseEnter={() => setHovered('sp')}
          onMouseLeave={() => setHovered(null)}
          className={`glass-card text-left group cursor-pointer transition-all duration-300 border
            ${hovered === 'sp'
              ? 'border-emerald-500/60 shadow-2xl shadow-emerald-500/20 -translate-y-1'
              : 'border-white/10'}`}
        >
          <div className="text-4xl mb-4">🤖</div>
          <h2 className="text-xl font-bold text-white mb-1">Single Player</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Challenge the AI Bot. Quick match, no waiting.
          </p>
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            Play now <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* Multiplayer */}
        <button
          onClick={onMultiplayer}
          onMouseEnter={() => setHovered('mp')}
          onMouseLeave={() => setHovered(null)}
          className={`glass-card text-left group cursor-pointer transition-all duration-300 border
            ${hovered === 'mp'
              ? 'border-violet-500/60 shadow-2xl shadow-violet-500/20 -translate-y-1'
              : 'border-white/10'}`}
        >
          <div className="text-4xl mb-4">🌐</div>
          <h2 className="text-xl font-bold text-white mb-1">Multiplayer</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Create or join a room. Play live with a friend on any device.
          </p>
          <div className="mt-4 flex items-center gap-2 text-violet-400 text-sm font-semibold">
            Find match <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>
      </div>

      {/* Rules */}
      <div className="mt-10 glass-card w-full max-w-2xl border border-white/5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">How to play</h3>
        <ol className="space-y-2 text-sm text-gray-300">
          <li className="flex gap-3"><span className="text-emerald-400 font-bold">1.</span> Toss decides who bats first</li>
          <li className="flex gap-3"><span className="text-emerald-400 font-bold">2.</span> Both players pick a number 1–6 simultaneously</li>
          <li className="flex gap-3"><span className="text-emerald-400 font-bold">3.</span> Same number = <span className="text-red-400 font-semibold">OUT!</span> Different = runs scored</li>
          <li className="flex gap-3"><span className="text-emerald-400 font-bold">4.</span> First innings sets the target. Second innings chases it.</li>
          <li className="flex gap-3"><span className="text-emerald-400 font-bold">5.</span> Highest score wins 🏆</li>
        </ol>
      </div>
    </div>
  );
}
