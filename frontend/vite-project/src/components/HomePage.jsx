import { useState } from 'react';

export default function HomePage({ onSinglePlayer, onMultiplayer }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in relative overflow-hidden">
      {/* Stadium grass background overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grass.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>

      {/* Hero */}
      <div className="text-center mb-12 relative z-10">
        <div className="text-8xl mb-4 animate-bounce-slow drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">🏏</div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-2 text-white uppercase" style={{ textShadow: '0 4px 10px rgba(0,0,0,0.8), 0 0 20px rgba(250,204,21,0.4)' }}>
          Hand Cricket
        </h1>
        <p className="text-yellow-400 text-lg font-bold tracking-widest uppercase">
          The Ultimate Stadium Experience
        </p>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl relative z-10">
        {/* Single Player */}
        <button
          onClick={onSinglePlayer}
          onMouseEnter={() => setHovered('sp')}
          onMouseLeave={() => setHovered(null)}
          className={`glass-card text-left group cursor-pointer transition-all duration-300 border-b-4
            ${hovered === 'sp'
              ? 'border-b-yellow-400 bg-[#0c162d] -translate-y-2 scale-[1.02]'
              : 'border-b-blue-600 bg-[#0c162d]/80'}`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl bg-blue-900/50 p-3 rounded-full border border-blue-500/30">🤖</div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Vs Computer</h2>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed font-medium">
            Challenge the AI Bot. No waiting, jump straight onto the pitch and start batting.
          </p>
          <div className="mt-6 flex items-center gap-2 text-yellow-400 text-sm font-black uppercase tracking-widest">
            Enter Stadium <span className="group-hover:translate-x-2 transition-transform">→</span>
          </div>
        </button>

        {/* Multiplayer */}
        <button
          onClick={onMultiplayer}
          onMouseEnter={() => setHovered('mp')}
          onMouseLeave={() => setHovered(null)}
          className={`glass-card text-left group cursor-pointer transition-all duration-300 border-b-4
            ${hovered === 'mp'
              ? 'border-b-yellow-400 bg-[#0c162d] -translate-y-2 scale-[1.02]'
              : 'border-b-green-600 bg-[#0c162d]/80'}`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl bg-green-900/50 p-3 rounded-full border border-green-500/30">🌐</div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Multiplayer</h2>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed font-medium">
            Create or join a room. Play live against your friends anywhere in the world.
          </p>
          <div className="mt-6 flex items-center gap-2 text-yellow-400 text-sm font-black uppercase tracking-widest">
            Find Match <span className="group-hover:translate-x-2 transition-transform">→</span>
          </div>
        </button>
      </div>

      {/* Rules */}
      <div className="mt-12 glass-card w-full max-w-3xl border-t-4 border-t-yellow-400 border-b-0 rounded-b-none relative z-10 bg-black/80">
        <h3 className="text-lg font-black text-yellow-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Tournament Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex gap-3 items-start"><span className="text-yellow-400 font-black text-xl">1</span> <p className="text-gray-200 text-sm font-medium mt-1">Toss decides who bats first.</p></div>
          <div className="flex gap-3 items-start"><span className="text-yellow-400 font-black text-xl">2</span> <p className="text-gray-200 text-sm font-medium mt-1">Both players pick a number 1–6.</p></div>
          <div className="flex gap-3 items-start"><span className="text-yellow-400 font-black text-xl">3</span> <p className="text-gray-200 text-sm font-medium mt-1">Same number = <span className="text-red-400 font-black">OUT!</span></p></div>
          <div className="flex gap-3 items-start"><span className="text-yellow-400 font-black text-xl">4</span> <p className="text-gray-200 text-sm font-medium mt-1">Different numbers = Runs scored.</p></div>
          <div className="flex gap-3 items-start md:col-span-2 justify-center mt-2 border-t border-white/10 pt-4">
            <span className="text-green-400 font-black text-lg">CHASE THE TARGET TO WIN THE CUP 🏆</span>
          </div>
        </div>
      </div>
    </div>
  );
}
