import { useState } from 'react';

export default function SinglePlayerSetup({ onStart, onBack }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in">
      <button onClick={onBack} className="self-start mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
        ← Back
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤖</div>
          <h1 className="text-3xl font-black text-white">vs AI Bot</h1>
          <p className="text-gray-400 text-sm mt-1">Quick match against our cricket bot</p>
        </div>

        <div className="glass-card mb-6 border border-blue-500/20">
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
              <span>⚡</span><span>AI responds instantly</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
              <span>🎲</span><span>Random strategy — truly unpredictable</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
              <span>🏆</span><span>Full innings match with toss</span>
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

  function handleSubmit(e) {
    e.preventDefault();
    if (name.trim()) onStart(name.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card">
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
        Your Name
      </label>
      <input
        type="text"
        maxLength={16}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Rohit"
        autoFocus
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors mb-4"
      />
      <button
        type="submit"
        disabled={!name.trim()}
        className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Start Match
      </button>
    </form>
  );
}
