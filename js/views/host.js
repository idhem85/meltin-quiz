/* ════════════════════════════════════════════════════════════════
   VIEW — Animateur (grand écran)
════════════════════════════════════════════════════════════════ */
'use strict';

(function () {
  const U = () => window.IB.util;
  const R = () => window.IB.results;
  const OPT_LABEL = () => window.IB_CONFIG.OPT_LABEL;

  function HostLobby({ room, joinUrl, players, onKick, onStart, quizTitle }) {
    const [copied, setCopied] = useState(false);
    const [search, setSearch] = useState('');
    // Plafond de rendu : 150 chips max (le compteur, lui, reste exact).
    const MAX_CHIPS = 150;
    const filtered = search.trim()
      ? players.filter((p) => p.pseudo.toLowerCase().includes(search.trim().toLowerCase()))
      : players;
    const shownPlayers = filtered.slice(0, MAX_CHIPS);
    const hiddenCount = filtered.length - shownPlayers.length;
    const copy = () => {
      if (navigator.clipboard) navigator.clipboard.writeText(joinUrl).catch(() => {});
      setCopied(true); setTimeout(() => setCopied(false), 1600);
    };
    return (
      <div className="min-h-screen px-3 sm:px-4 py-6 sm:py-8 pb-20 fade-in-up">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-start">
          <div className="text-center lg:text-left min-w-0">
            <div className="inline-block glass px-4 py-1.5 text-xs font-semibold tracking-widest text-cyan-300 mb-4">
              {window.IB.sync.demoMode ? '🔧 MODE DÉMO LOCAL' : '🌐 MODE EN LIGNE'}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black mb-2 break-words">
              Salle <span className="font-mono bg-clip-text text-transparent text-glow"
                style={{ backgroundImage: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}>{room}</span>
            </h1>
            <p className="mb-5 sm:mb-6 break-words" style={{ color: 'var(--text-dim)' }}>{quizTitle || 'Quiz interactif en direct'}</p>
            {/* Carte QR : block + max-width, jamais dimensionnée par l'URL */}
            <div className="glass-strong p-4 sm:p-6 inline-block max-w-full">
              <QrCode text={joinUrl} size={210} />
              <div className="mt-3 sm:mt-4 flex items-center gap-2 justify-center max-w-full">
                <code className="lobby-url text-cyan-300 font-mono text-[11px] sm:text-xs bg-black/40 rounded-lg px-3 py-2 border border-white/10 select-all truncate min-w-0">{joinUrl}</code>
                <button onClick={copy} title="Copier le lien" className="glass px-3 py-2 text-sm hover:bg-white/10 transition shrink-0">{copied ? '✅' : '📋'}</button>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-dim)' }}>Scannez pour rejoindre depuis votre téléphone</p>
            </div>
          </div>

          <div className="glass p-4 sm:p-6 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Participants connectés
              </h2>
              <span className="font-display text-3xl font-black text-cyan-300">{players.length}</span>
            </div>
            {players.length === 0 ? (
              <div className="text-center py-10" style={{ color: 'var(--text-dim)' }}>
                <div className="text-4xl mb-3 animate-bounce">👀</div>
                En attente des premiers participants…
              </div>
            ) : (
              <div>
                {/* Grandes sessions : on plafonne le DOM rendu (perf vidéo-
                    projecteur) ; la recherche retrouve tout le monde. */}
                {players.length > 60 && (
                  <input className="dash-input mb-2" placeholder={`Rechercher parmi ${players.length}…`}
                    value={search} onChange={(e) => setSearch(e.target.value)} />
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {shownPlayers.map((p, i) => (
                    <div key={p.pid} className={'glass rounded-xl px-3 py-2.5 flex items-center gap-2 group' + (i < 24 ? ' scale-in' : '')} style={i < 24 ? { animationDelay: (i % 12) * 0.03 + 's' } : undefined}>
                      <span>{p.emoji}</span>
                      <span className="text-sm font-medium truncate flex-1">{p.pseudo}</span>
                      <button onClick={() => onKick(p)} title="Exclure" className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 text-xs transition">✕</button>
                    </div>
                  ))}
                </div>
                {hiddenCount > 0 && (
                  <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-dim)' }}>
                    + {hiddenCount} autre{hiddenCount > 1 ? 's' : ''} participant{hiddenCount > 1 ? 's' : ''} (recherchez pour afficher)
                  </p>
                )}
              </div>
            )}
            <button onClick={onStart}
              className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-lg text-white shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.99]">
              ▶ Lancer la question 1
            </button>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur border-t border-white/10 py-2 overflow-hidden z-20">
          <div className="marquee-track text-sm" style={{ color: 'var(--text-dim)' }}>
            {[0, 1].map((k) => (
              <span key={k} className="pr-12">
                🧠 MELTIN QUIZ — rejoignez avec le code <span className="text-cyan-300 font-mono font-bold">{room}</span>
                &nbsp;•&nbsp; 📱 Scannez le QR code &nbsp;•&nbsp; ⚡ Résultats en temps réel &nbsp;•&nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function HostQuestion({ q, qIndex, total, answerCount, playerCount }) {
    const badge = U().typeBadge(q);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 fade-in-up">              <div className="flex items-center gap-4 mb-4 flex-wrap justify-center">
          <span className="glass rounded-full px-4 py-1.5 text-sm font-mono text-cyan-300">Question {qIndex + 1} / {total}</span>
          <span className="glass rounded-full px-4 py-1.5 text-sm flex items-center gap-2 max-w-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="truncate">{answerCount} réponse{answerCount > 1 ? 's' : ''} · {playerCount} joueur{playerCount > 1 ? 's' : ''}</span>
          </span>
        </div>
        <div className="mb-8 text-sm bg-violet-500/10 border border-violet-400/30 text-violet-300 rounded-full px-4 py-1.5 font-semibold">
          {badge.icon} {badge.label}{q.unit ? ' · unité : ' + q.unit : ''}
        </div>
        <h1 className="host-title font-display font-black text-center max-w-5xl leading-tight">{q.question}</h1>

        {q.type === 'mcq' && q.options && (
          <div className="mt-8 sm:mt-10 grid gap-2.5 sm:gap-3 max-w-2xl w-full">
            {q.options.map((opt, i) => (
              <div key={i} className="glass px-4 py-3.5 sm:py-4 flex items-center gap-3 sm:gap-4 min-w-0">
                <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center font-display font-black shrink-0 text-white"
                  style={{ background: window.IB_CONFIG.OPT_GRADIENT[i], boxShadow: '0 4px 14px ' + window.IB_CONFIG.OPT_COLOR[i] + '44' }}>{OPT_LABEL()[i]}</span>
                <span className="font-semibold text-base sm:text-lg min-w-0 break-words text-left">{opt}</span>
              </div>
            ))}
          </div>
        )}
        {(q.type === 'word' || q.type === 'number' || q.type === 'scale') && (
          <div className="mt-10 text-lg flex items-center gap-3" style={{ color: 'var(--text-dim)' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            {q.type === 'word' ? 'Les réponses libres arrivent — nuage en direct à la clôture'
              : q.type === 'number' ? 'Estimation en cours — qui sera le plus proche ?'
              : 'Échelle de ' + (q.min != null ? q.min : 1) + ' à ' + (q.max != null ? q.max : 10) + ' — les participants glissent le curseur'}
          </div>
        )}
      </div>
    );
  }

  function HostResults({ qIndex, total, q, results, playerCount, nameOf }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { const t = setTimeout(() => setMounted(true), 120); return () => clearTimeout(t); }, [qIndex]);
    const badge = U().typeBadge(q);
    return (
      <div className="min-h-screen flex flex-col px-6 py-8 max-w-5xl mx-auto w-full fade-in-up">
        <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
          <span className="glass rounded-full px-4 py-1.5 text-sm font-mono text-violet-300">Résultats — Q{qIndex + 1}/{total}</span>
          <span className="text-sm bg-violet-500/10 border border-violet-400/30 text-violet-300 rounded-full px-3 py-1">{badge.icon} {badge.label}</span>
          <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{results ? results.total : 0} réponse(s) · {playerCount} joueur(s)</span>
        </div>
        <h1 className="host-title-xl font-display font-black text-center mb-10 leading-tight">{q.question}</h1>
        <div className="glass p-6 sm:p-10 flex-1">
          <ResultBody q={q} r={results} mounted={mounted} nameOf={nameOf} />
        </div>
      </div>
    );
  }

  function HostPodium({ podium, playerCount, room }) {
    const order = [1, 0, 2];
    const heights = ['h-28', 'h-40', 'h-24'];
    const cols = podium || [];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 fade-in-up">
        <div className="text-7xl mb-2">🏆</div>
        <h1 className="font-display text-4xl sm:text-5xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent mb-10">Podium final</h1>
        <div className="flex items-end gap-4 sm:gap-8 mb-10">
          {order.map((idx, pos) => {
            const p = cols[idx];
            if (!p) return null;
            return (
              <div key={idx} className="podium-col flex flex-col items-center scale-in" style={{ animationDelay: pos * 0.15 + 's' }}>
                <div className="text-4xl mb-2">{p.emoji}</div>
                <div className="font-bold text-lg mb-1 max-w-[9rem] truncate text-center">{p.pseudo}</div>
                <div className="font-mono text-cyan-300 text-sm mb-3">{p.score} pts</div>
                <div className={'w-full rounded-t-2xl flex items-start justify-center pt-3 text-3xl ' + heights[pos]}
                  style={{ background: ['linear-gradient(180deg,#fbbf24,#b45309)', 'linear-gradient(180deg,#e2e8f0,#64748b)', 'linear-gradient(180deg,#fb923c,#9a3412)'][idx] }}>
                  {['🥇','🥈','🥉'][idx]}
                </div>
              </div>
            );
          })}
        </div>
        {playerCount > 3 && (
          <div className="glass px-6 py-3 text-sm" style={{ color: 'var(--text-dim)' }}>
            + {playerCount - 3} autre{playerCount - 3 > 1 ? 's' : ''} participant{playerCount - 3 > 1 ? 's' : ''} — bravo à tous ! 👏
          </div>
        )}
        <div className="mt-8 text-xs" style={{ color: 'var(--text-dim)' }}>Salle <span className="font-mono">{room}</span> — session terminée</div>
      </div>
    );
  }

  function HostControls({ phase, onClose, onNext, onRestart, onExit, isLast, answersCount }) {
    const btn = 'px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2';
    return (
      <div className="host-controls fixed bottom-5 left-1/2 -translate-x-1/2 z-40 fade-in-up">
        <div className="ctrl-bar glass-strong px-4 py-3 flex items-center gap-2.5 flex-wrap justify-center">
          {phase === 'question' && (
            <React.Fragment>
              <span className="text-sm px-2 hidden sm:block" style={{ color: 'var(--text-dim)' }}>Votes ouverts · {answersCount} reçu{answersCount > 1 ? 's' : ''}</span>
              <button onClick={onClose} className={btn + ' bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30 hover:from-rose-400'}>🔒 Clôturer les votes</button>
            </React.Fragment>
          )}
          {phase === 'results' && (
            <button onClick={onNext} className={btn + ' bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-400'}>
              {isLast ? '🏆 Voir le podium' : '▶ Question suivante'}
            </button>
          )}
          {phase === 'podium' && (
            <button onClick={onRestart} className={btn + ' bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:from-cyan-400'}>🔄 Nouvelle partie</button>
          )}
          {phase !== 'podium' && <button onClick={onRestart} title="Recommencer la session" className={btn + ' glass hover:bg-white/10'}>🔄</button>}
          <button onClick={onExit} title="Quitter" className={btn + ' glass hover:bg-white/10'}>✕</button>
        </div>
      </div>
    );
  }

  /* Orchestration du flux animateur */
  function HostFlow({ room, showToast, onExit }) {
    const [state, setState] = useState({ status: 'waiting', questionIndex: -1, quiz: U().loadQuiz(), lastResults: null, podium: null });
    const [players, setPlayers] = useState([]);
    const [answersMap, setAnswersMap] = useState({});

    useEffect(() => {
      return window.IB.sync.host(room, {
        onState: setState,
        onPlayers: setPlayers,
        onAnswers: setAnswersMap,
        onError: (msg) => showToast(msg, 'error'),
      });
    }, [room]);

    /* Applique le thème de la salle dès qu'il change */
    useEffect(() => { window.IB.theme.applyTheme(state && state.theme); }, [state && state.theme]);

    const quiz = (state && state.quiz) || U().loadQuiz();
    const qIndex = state ? state.questionIndex : -1;
    const status = state ? state.status : 'waiting';

    const startQuestion = async (idx) => {
      window.IB.sync.patchState(room, { status: 'question', questionIndex: idx, lastResults: null });
      await window.IB.sync.clearAnswers(room);
    };
    const closeVotes = async () => {
      const q = quiz[qIndex];
      const results = R().computeResults(q, answersMap, qIndex);
      window.IB.sync.patchState(room, { status: 'results', lastResults: results });
      const winners = R().computeWinners(q, answersMap, qIndex);
      winners.forEach((pid) => window.IB.sync.setScore(room, pid, 1));
    };
    const nextQuestion = () => { qIndex + 1 < quiz.length ? startQuestion(qIndex + 1) : finishQuiz(); };
    const finishQuiz = async () => {
      const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
      const podium = sorted.slice(0, 3).map((p) => ({ pid: p.pid, pseudo: p.pseudo, emoji: p.emoji, score: p.score || 0 }));
      window.IB.sync.patchState(room, { status: 'podium', podium, questionIndex: -1 });
    };
    const restart = async () => {
      await window.IB.sync.resetScores(room);
      await window.IB.sync.clearAnswers(room);
      window.IB.sync.patchState(room, { status: 'waiting', questionIndex: -1, lastResults: null, podium: null });
    };
    const kickPlayer = (p) => window.IB.sync.kick(room, p.pid);

    const currentQ = qIndex >= 0 && qIndex < quiz.length ? quiz[qIndex] : null;
    const answerCount = R().countAnswers(answersMap, qIndex);
    const nameOf = (pid) => { const p = players.find((x) => x.pid === pid); return p ? p.pseudo : null; };

    if (status === 'podium') {
      return (
        <React.Fragment>
          <HostPodium podium={state.podium || []} playerCount={players.length} room={room} />
          <HostControls phase="podium" onRestart={restart} onExit={onExit} />
        </React.Fragment>
      );
    }
    if (status === 'question' && currentQ) {
      return (
        <React.Fragment>
          <HostQuestion q={currentQ} qIndex={qIndex} total={quiz.length} answerCount={answerCount} playerCount={players.length} />
          <HostControls phase="question" answersCount={answerCount} onClose={closeVotes} onRestart={restart} onExit={onExit} />
        </React.Fragment>
      );
    }
    if (status === 'results' && currentQ) {
      const isLast = qIndex + 1 >= quiz.length;
      return (
        <React.Fragment>
          <HostResults qIndex={qIndex} total={quiz.length} q={currentQ} results={state.lastResults} playerCount={players.length} nameOf={nameOf} />
          <HostControls phase="results" isLast={isLast} onNext={nextQuestion} onRestart={restart} onExit={onExit} answersCount={answerCount} />
        </React.Fragment>
      );
    }
    return (
      <HostLobby room={room} joinUrl={U().joinUrlFor(room)} players={players}
        onKick={kickPlayer} onStart={() => startQuestion(0)} quizTitle={state && state.quizTitle} />
    );
  }

  window.IB.views = window.IB.views || {};
  window.IB.views.HostFlow = HostFlow;
})();
