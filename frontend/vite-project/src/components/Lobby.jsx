import { useState } from 'react';

export default function Lobby({ onCreateRoom, onJoinRoom, onBack }) {
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  function handleCreate(e) {
    e.preventDefault();
    if (!playerName.trim()) { setError('Enter your name first'); return; }
    setError('');
    onCreateRoom(playerName.trim());
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!playerName.trim()) { setError('Enter your name first'); return; }
    if (!roomCode.trim()) { setError('Enter a room code'); return; }
    setError('');
    onJoinRoom(playerName.trim(), roomCode.trim().toUpperCase());
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in">
      <button
        onClick={onBack}
        className="self-start mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
      >
        ← Back
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌐</div>
          <h1 className="text-3xl font-black text-white">Multiplayer</h1>
          <p className="text-gray-400 text-sm mt-1">Create a room or join with a code</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6">
          {['create', 'join'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition-all duration-200
                ${tab === t
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              {t === 'create' ? '➕ Create Room' : '🔑 Join Room'}
            </button>
          ))}
        </div>

        <div className="glass-card">
          {/* Name input (shared) */}
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Your Name
          </label>
          <input
            type="text"
            maxLength={16}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="e.g. Virat"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors mb-4"
          />

          {tab === 'join' && (
            <>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Room Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB12CD"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors mb-4 tracking-widest font-mono text-lg"
              />
            </>
          )}

          {error && (
            <p className="text-red-400 text-sm mb-3 bg-red-900/20 rounded-lg px-3 py-2 border border-red-500/30">
              ⚠️ {error}
            </p>
          )}

          <button
            onClick={tab === 'create' ? handleCreate : handleJoin}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-95
              ${tab === 'create'
                ? 'bg-gradient-to-r from-emerald-600 to-green-500 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50'
                : 'bg-gradient-to-r from-violet-600 to-purple-500 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50'}`}
          >
            {tab === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        </div>
      </div>
    </div>
  );
}
