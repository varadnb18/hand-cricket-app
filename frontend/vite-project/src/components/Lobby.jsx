import { useState } from 'react';

export default function Lobby({ onCreateRoom, onJoinRoom, onBack }) {
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [overs, setOvers] = useState('Unlimited');

  function handleCreate(e) {
    e.preventDefault();
    if (!playerName.trim()) { setError('Enter your name first'); return; }
    setError('');
    onCreateRoom(playerName.trim(), overs);
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!playerName.trim()) { setError('Enter your name first'); return; }
    if (!roomCode.trim()) { setError('Enter a room code'); return; }
    setError('');
    onJoinRoom(playerName.trim(), roomCode.trim().toUpperCase());
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grass.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>

      <button
        onClick={onBack}
        className="self-start mb-8 flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest relative z-10"
      >
        ← LEAVE PAVILION
      </button>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">🌐</div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-lg">Multiplayer</h1>
          <p className="text-yellow-400 font-bold text-sm mt-1 uppercase tracking-widest">Connect with your friends</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-t-xl overflow-hidden border-b-4 border-black bg-black/40">
          {['create', 'join'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all duration-200
                ${tab === t
                  ? 'bg-blue-600 text-white border-b-4 border-yellow-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              {t === 'create' ? '➕ HOST GAME' : '🔑 JOIN GAME'}
            </button>
          ))}
        </div>

        <div className="glass-card rounded-t-none border-t-0">
          {/* Name input (shared) */}
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
            Player Name
          </label>
          <input
            type="text"
            maxLength={16}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="e.g. Virat"
            className="w-full bg-black/50 border-2 border-white/10 rounded-md px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all mb-5 font-bold"
          />

          {tab === 'create' && (
            <>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 mt-2">
                Overs
              </label>
              <select
                value={overs}
                onChange={(e) => setOvers(e.target.value)}
                className="w-full bg-black/50 border-2 border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all mb-5 font-bold cursor-pointer"
              >
                <option value="1">1 Over</option>
                <option value="2">2 Overs</option>
                <option value="5">5 Overs</option>
                <option value="10">10 Overs</option>
                <option value="Unlimited">Unlimited</option>
              </select>
            </>
          )}

          {tab === 'join' && (
            <>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Room Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB12CD"
                className="w-full bg-black/50 border-2 border-white/10 rounded-md px-4 py-3 text-yellow-400 placeholder-gray-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all mb-5 tracking-[0.2em] font-mono text-xl font-bold uppercase"
              />
            </>
          )}

          {error && (
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-4 bg-red-900/40 rounded-md px-3 py-3 border-l-4 border-red-500">
              ⚠️ {error}
            </p>
          )}

          <button
            onClick={tab === 'create' ? handleCreate : handleJoin}
            className={`w-full py-4 rounded-md font-black text-white uppercase tracking-widest transition-all duration-200 hover:scale-[1.02] active:scale-95 active:translate-y-1
              ${tab === 'create'
                ? 'bg-gradient-to-b from-blue-500 to-blue-700 shadow-[0_4px_0_#1e3a8a] active:shadow-none'
                : 'bg-gradient-to-b from-green-500 to-green-700 shadow-[0_4px_0_#14532d] active:shadow-none'}`}
          >
            {tab === 'create' ? 'Create Match' : 'Enter Match'}
          </button>
        </div>
      </div>
    </div>
  );
}
