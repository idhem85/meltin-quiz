/* ════════════════════════════════════════════════════════════════
   VIEW — Accueil : Rejoindre / Créer / Dashboard
════════════════════════════════════════════════════════════════ */
'use strict';

function HomeScreen({ onJoin, onCreate }) {
  const [room, setRoom] = useState(window.IB.util.getRoomParam());
  const canJoin = room.length >= 4;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="fade-in-up text-center mb-8 sm:mb-10">
        <div className="text-6xl sm:text-7xl mb-4 select-none">🧠</div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
          MELTIN <span className="bg-clip-text text-transparent text-glow"
            style={{ backgroundImage: 'linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent-3))' }}>QUIZ</span>
        </h1>
        <p className="mt-3 text-lg max-w-md mx-auto" style={{ color: 'var(--text-dim)' }}>
          Quiz &amp; icebreakers interactifs en temps réel — jusqu'à <span className="text-cyan-300 font-semibold">300 participants</span>.
        </p>
      </div>

      <div className="grid gap-5 w-full max-w-xl">
        <div className="glass p-4 sm:p-6 fade-in-up hover:border-cyan-400/40 transition-all duration-300">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/30 shrink-0">📱</div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-lg sm:text-xl text-cyan-300">Rejoindre <span className="text-sm font-normal" style={{ color: 'var(--text-dim)' }}>(Participant)</span></div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>Entrez le code de salle affiché à l'écran principal.</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              onKeyDown={(e) => { if (e.key === 'Enter' && canJoin) onJoin(room); }}
              placeholder="CODE"
              inputMode="text" autoCapitalize="characters" autoCorrect="off" spellCheck={false}
              className="flex-1 min-w-0 bg-black/30 border border-white/15 rounded-xl px-2 sm:px-4 py-3 font-mono text-lg tracking-[0.25em] sm:tracking-[0.35em] text-center uppercase placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition"
            />
            <button onClick={() => canJoin && onJoin(room)} disabled={!canJoin}
              className="px-4 sm:px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 font-bold transition active:scale-95 shrink-0"
              style={{ color: '#06121f' }}>
              OK
            </button>
          </div>
        </div>

        <button onClick={onCreate}
          className="glass p-4 sm:p-6 text-left hover:border-violet-400/40 transition-all duration-300 group fade-in-up" style={{ animationDelay: '.12s' }}>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/30 shrink-0">🖥️</div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-lg sm:text-xl text-violet-300">Créer <span className="text-sm font-normal" style={{ color: 'var(--text-dim)' }}>(Animateur)</span></div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>Lancez une session et affichez le QR code au vidéoprojecteur.</div>
            </div>
            <span className="text-violet-400/60 text-2xl group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        <a href="#/admin"
          className="glass p-4 text-left hover:border-emerald-400/40 transition-all duration-300 group fade-in-up flex items-center gap-3" style={{ animationDelay: '.2s' }}>
          <span className="text-xl">🎛️</span>
          <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--text-dim)' }}>
            Dashboard — questions, style &amp; options
          </span>
          <span className="text-emerald-400/60 group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>

      <p className="mt-10 text-xs text-center fade-in-up" style={{ color: 'var(--text-dim)', animationDelay: '.25s' }}>
        {window.IB.sync.demoMode
          ? <span>Mode <span className="text-amber-300">démo local</span> (multi-onglets). Renseignez <code className="text-cyan-500/80">FIREBASE_CONFIG</code> dans js/config.js pour jouer en ligne à 300.</span>
          : <span>Connecté à Firebase — mode <span className="text-emerald-400">temps réel en ligne</span> 🌐</span>}
      </p>
    </div>
  );
}

window.IB.views = window.IB.views || {};
window.IB.views.HomeScreen = HomeScreen;
