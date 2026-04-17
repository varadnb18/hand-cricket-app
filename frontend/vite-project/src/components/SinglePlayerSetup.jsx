import { useState } from 'react';

export default function SinglePlayerSetup({ onStart, onBack }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grass.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>

      <button onClick={onBack} className="self-start mb-8 flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest relative z-10">
        ← LEAVE PAVILION
      </button>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">🤖</div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-lg">Vs Computer</h1>
          <p className="text-yellow-400 font-bold text-sm mt-1 uppercase tracking-widest">Challenge the AI Bot</p>
        </div>

        <div className="glass-card mb-6 border-t-4 border-t-yellow-400 bg-black/60">
          <div className="space-y-4 text-sm text-gray-300 font-bold uppercase tracking-wide">
            <div className="flex items-center gap-4 bg-black/40 rounded-md px-4 py-3 border border-white/5">
              <span className="text-xl">⚡</span><span>Instant Deliveries</span>
            </div>
            <div className="flex items-center gap-4 bg-black/40 rounded-md px-4 py-3 border border-white/5">
              <span className="text-xl">🎲</span><span>Unpredictable Strategy</span>
            </div>
            <div className="flex items-center gap-4 bg-black/40 rounded-md px-4 py-3 border border-white/5">
              <span className="text-xl">🏆</span><span>Full Match Experience</span>
            </div>
          </div>
        </div>

        <NameForm onStart={onStart} />
      </div>
    </div>
  );
}

function NameForm({ onStart }) {
  const [name, setName] = useState('');
  const [overs, setOvers] = useState('Unlimited');

  function handleSubmit(e) {
    e.preventDefault();
    if (name.trim()) onStart(name.trim(), overs);
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card bg-blue-900/40">
      <label className="block text-xs font-black text-gray-300 uppercase tracking-widest mb-2">
        Player Name
      </label>
      <input
        type="text"
        maxLength={16}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Rohit"
        autoFocus
        className="w-full bg-black/50 border-2 border-white/10 rounded-md px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all mb-4 font-bold"
      />

      <label className="block text-xs font-black text-gray-300 uppercase tracking-widest mb-2 mt-4">
        Overs
      </label>
      <select
        value={overs}
        onChange={(e) => setOvers(e.target.value)}
        className="w-full bg-black/50 border-2 border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all mb-6 font-bold cursor-pointer"
      >
        <option value="1">1 Over</option>
        <option value="2">2 Overs</option>
        <option value="5">5 Overs</option>
        <option value="10">10 Overs</option>
        <option value="Unlimited">Unlimited</option>
      </select>
      <button
        type="submit"
        disabled={!name.trim()}
        className="w-full py-4 rounded-md font-black text-white uppercase tracking-widest transition-all duration-200 hover:scale-[1.02] active:scale-95 active:translate-y-1 disabled:opacity-50 disabled:active:translate-y-0 disabled:hover:scale-100
          bg-gradient-to-b from-blue-500 to-blue-700 shadow-[0_4px_0_#1e3a8a] active:shadow-none"
      >
        START MATCH
      </button>
    </form>
  );
}
