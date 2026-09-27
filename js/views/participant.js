/* ════════════════════════════════════════════════════════════════
   VIEW — Participant (mobile first)
════════════════════════════════════════════════════════════════ */
'use strict';

(function () {
  const U = () => window.IB.util;

  function ParticipantJoin({ room, onEnter, onBack }) {
    const [pseudo, setPseudo] = useState('');
    const [emoji] = useState(() => ['🦄','🐙','🦊','🐸','🦉','🐼','🦋','🐝','🐳','🦖','🍕','🚀'][Math.floor(Math.random() * 12)]);
    const inputRef = useRef(null);
    useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);
    const valid = pseudo.trim().length >= 2;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="glass-strong p-8 w-full max-w-sm fade-in-up">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3 select-none">{emoji}</div>
            <h2 className="font-display text-2xl font-bold">Bienvenue !</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
              Salle <span className="font-mono text-cyan-300 font-bold tracking-widest">{room}</span> — choisissez votre pseudo
            </p>
          </div>
          <input ref={inputRef} value={pseudo}
            onChange={(e) => setPseudo(e.target.value.slice(0, 20))}
            onKeyDown={(e) => { if (e.key === 'Enter' && valid) onEnter(pseudo.trim(), emoji); }}
            placeholder="Votre pseudo"
            className="w-full bg-black/30 border border-white/15 rounded-2xl px-5 py-4 text-lg text-center focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition"
          />
          <button onClick={() => valid && onEnter(pseudo.trim(), emoji)} disabled={!valid}
            className="mt-4 w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-30 font-bold text-lg text-white shadow-lg shadow-cyan-500/25 transition-all active:scale-[0.98]">
            Rejoindre la partie 🚀
          </button>
          <button onClick={onBack} className="mt-4 w-full text-sm hover:text-slate-300 transition" style={{ color: 'var(--text-dim)' }}>← Changer de salle</button>
        </div>
      </div>
    );
  }

  function ParticipantWait({ me, hint }) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center fade-in-up">
        <div className="relative w-28 h-28 mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin"></div>
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 animate-pulse flex items-center justify-center text-4xl">
            {me ? me.emoji : '✨'}
          </div>
        </div>
        <h2 className="font-display text-2xl font-bold">Regardez l'écran principal</h2>
        <p className="mt-2 max-w-xs" style={{ color: 'var(--text-dim)' }}>{hint || "L'animateur va lancer la prochaine question… restez attentif ! 👀"}</p>
        {me && (
          <div className="mt-8 glass px-6 py-3 text-sm">
            <span style={{ color: 'var(--text-dim)' }}>Vous êtes</span>{' '}
            <span className="font-bold text-cyan-300">{me.emoji} {me.pseudo}</span>
          </div>
        )}
      </div>
    );
  }

  /* Vote : UI adaptée au format de la question.
     Big Quiz : barre de temps en haut, verrouillage auto à 0. */
  function ParticipantVote({ q, qIndex, total, me, onVote, endsAt }) {
    // (en-tête wrappé : voir JSX ci-dessous)
    const type = (q && q.type) || 'mcq';
    const [selected, setSelected] = useState(null);
    const [text, setText] = useState('');
    const scaleMin = q.min != null ? q.min : 1;
    const [scaleVal, setScaleVal] = useState(scaleMin);
    const done = selected !== null && selected !== undefined;
    const OPT = window.IB_CONFIG.OPT_LABEL;
    const badge = U().typeBadge(q);
    const min = q.min != null ? q.min : 1, max = q.max != null ? q.max : 10;

    /* Timer local : horloge du téléphone, zéro écriture. À 0, on
       verrouille (le « temps écoulé » retentit côté animateur). */
    const [now, setNow] = useState(Date.now());
    const expired = endsAt ? endsAt - now <= 0 : false;
    const locked = done || expired;
    useEffect(() => {
      if (!endsAt || done) return undefined;
      const iv = setInterval(() => setNow(Date.now()), 250);
      return () => clearInterval(iv);
    }, [endsAt, done]);
    const leftMs = endsAt ? Math.max(0, endsAt - now) : null;
    const totalMs = (q.seconds > 0 ? q.seconds : 30) * 1000;
    const pct = leftMs != null ? Math.max(0, Math.min(1, leftMs / totalMs)) : 1;
    const urgent = leftMs != null && leftMs <= 5000;

    const submit = (payload, visualIndex) => {
      if (locked) return;
      setSelected(visualIndex != null ? visualIndex : -1);
      if (navigator.vibrate) { try { navigator.vibrate(30); } catch (e) {} }
      window.IB.audio.lock();
      onVote(payload);
    };

    return (
      <div className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto w-full fade-in-up">
        {/* Barre de temps Big Quiz (fine, pleine largeur) */}
        {leftMs != null && !done && (
          <div className="sticky top-0 -mx-4 px-4 pt-1 pb-2 z-20 bg-gradient-to-b from-slate-950/90 to-transparent">
            <div className="flex items-center justify-between text-[11px] font-mono mb-1" style={{ color: urgent ? '#fb7185' : 'var(--text-dim)' }}>
              <span>{urgent ? '⏰ Dernières secondes !' : '⏱ Temps restant'}</span>
              <span className={urgent ? 'font-black' : ''}>{Math.ceil(leftMs / 1000)}s</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300 ease-linear"
                style={{ width: (pct * 100) + '%', background: urgent ? 'linear-gradient(90deg,#fb7185,#e11d48)' : 'linear-gradient(90deg,var(--accent),var(--accent-2))' }} />
            </div>
          </div>
        )}
        {expired && !done && (
          <div className="glass px-4 py-3 mb-4 text-center text-rose-300 text-sm font-semibold fade-in">
            ⏰ Temps écoulé — réponses verrouillées
          </div>
        )}
        <div className="flex items-center gap-2 mb-4 min-w-0">
          <div className="text-xs font-mono bg-white/5 rounded-full px-3 py-1 shrink-0" style={{ color: 'var(--text-dim)' }}>Q{qIndex + 1}/{total}</div>
          <div className="text-xs bg-violet-500/10 border border-violet-400/30 text-violet-300 rounded-full px-3 py-1 truncate">{badge.icon} {badge.label}</div>
          <div className="flex-1 min-w-2" />
          <div className="text-xs truncate max-w-[6rem] shrink-0" style={{ color: 'var(--text-dim)' }}>{me.emoji} {me.pseudo}</div>
        </div>

        <div className="glass p-6 text-center mb-5">
          <h2 className="font-display text-xl sm:text-2xl font-bold leading-snug">{q.question}</h2>
        </div>

        {type === 'mcq' && (
          <div className="grid gap-3">
            {(q.options || []).map((opt, i) => (
              <button key={i} onClick={() => submit({ opt: i }, i)} disabled={locked}
                className={'answer-btn btn-' + OPT[i].toLowerCase() + ' rounded-2xl px-5 py-5 flex items-center gap-4 text-left text-white font-bold text-base sm:text-lg' + (selected === i ? ' pressed ring-4 ring-white/40' : '')}>
                <span className="w-10 h-10 rounded-xl bg-black/25 flex items-center justify-center font-display text-xl shrink-0">{OPT[i]}</span>
                <span className="leading-snug">{opt}</span>
              </button>
            ))}
          </div>
        )}

        {type === 'scale' && (
          <div className="glass p-6">
            <div className="text-center mb-4">
            <span className="font-display text-6xl font-black bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}>
              {done && selected >= 0 ? min + selected : scaleVal}
            </span>
              <span className="text-lg" style={{ color: 'var(--text-dim)' }}> / {max}</span>
            </div>
            <input type="range" min={min} max={max} step="1" value={scaleVal} disabled={locked}
              onChange={(e) => setScaleVal(Number(e.target.value))}
              onMouseUp={() => submit({ opt: scaleVal - min }, scaleVal - min)}
              onTouchEnd={() => submit({ opt: scaleVal - min }, scaleVal - min)}
              className="w-full accent-cyan-400 h-3 cursor-pointer" />
            <div className="flex justify-between text-xs mt-2 font-mono" style={{ color: 'var(--text-dim)' }}>
              <span>{min} · pas du tout</span><span>{max} · totalement</span>
            </div>
            {!done && (
              <button onClick={() => submit({ opt: scaleVal - min }, scaleVal - min)}
                className="mt-4 w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-white shadow-lg shadow-cyan-500/25 transition-all active:scale-[0.98]">
                Confirmer {scaleVal} / {max}
              </button>
            )}
          </div>
        )}

        {type === 'word' && (
          <div className="glass p-6">
            <input value={text}
              onChange={(e) => setText(e.target.value.slice(0, q.maxLen || 30))}
              onKeyDown={(e) => { if (e.key === 'Enter' && text.trim().length >= 2) submit({ text: text.trim() }, -1); }}
              placeholder={q.placeholder || 'Votre réponse…'}
              disabled={locked} autoFocus
              className="w-full bg-black/30 border border-white/15 rounded-2xl px-5 py-4 text-lg text-center focus:outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/20 transition disabled:opacity-50" />
            <button onClick={() => text.trim().length >= 2 && submit({ text: text.trim() }, -1)}
              disabled={text.trim().length < 2 || locked}
              className="mt-4 w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 disabled:opacity-30 font-bold text-lg text-white shadow-lg shadow-violet-500/25 transition-all active:scale-[0.98]">
              Envoyer ✨
            </button>
          </div>
        )}

        {type === 'number' && (
          <div className="glass p-6">
            <div className="flex items-center gap-2">
              <input type="text" inputMode="decimal" value={text}
                onChange={(e) => setText(e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter' && text !== '' && isFinite(Number(text))) submit({ val: Number(text) }, -1); }}
                placeholder="0" disabled={locked} autoFocus
                className="flex-1 bg-black/30 border border-white/15 rounded-2xl px-5 py-4 text-3xl text-center font-display font-black focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 transition disabled:opacity-50" />
              {q.unit && <span className="text-xl font-bold shrink-0" style={{ color: 'var(--text-dim)' }}>{q.unit}</span>}
            </div>
            <button onClick={() => text !== '' && isFinite(Number(text)) && submit({ val: Number(text) }, -1)}
              disabled={text === '' || !isFinite(Number(text)) || locked}
              className="mt-4 w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 disabled:opacity-30 font-bold text-lg text-white shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98]">
              Valider mon estimation 🎯
            </button>
          </div>
        )}

        {done && (
          <div className="mt-6 text-center fade-in-up">
            <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2.5 text-emerald-300 font-semibold text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Réponse enregistrée — en attente des résultats…
            </div>
          </div>
        )}
      </div>
    );
  }

  function ParticipantResults({ qIndex, total, results, q, myAnswer }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, [qIndex]);
    /* Feedback sonore : bonne réponse (QCM) ou estimation la plus proche */
    useEffect(() => {
      if (!results || results.total == null) return;
      if (myAnswer == null || myAnswer < 0) return;
      let won = false;
      if (q.type === 'mcq' && q.correctIndex != null) won = myAnswer === q.correctIndex;
      else if (q.type === 'number' && q.target != null && results.entries) {
        const mine = results.entries.find((e) => e.v === myAnswer);
        const best = results.entries.reduce((m, e) => Math.abs(e.v - q.target) < Math.abs(m - q.target) ? e.v : m, Infinity);
        won = mine != null && Math.abs(myAnswer - q.target) <= Math.abs(best - q.target) + 1e-9;
      }
      if (won) window.IB.audio.good(); else window.IB.audio.bad();
    }, [results && results.total, qIndex]);
    const r = results || {};
    return (
      <div className="min-h-screen flex flex-col px-5 py-8 max-w-lg mx-auto w-full fade-in-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📊</div>
          <h2 className="font-display text-2xl font-bold">Résultats !</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>Question {qIndex + 1}/{total} — {r.total || 0} réponse{(r.total || 0) > 1 ? 's' : ''}</p>
        </div>
        <div className="glass p-5">
          <ResultBody q={q} r={r} mounted={mounted} mini myAnswer={myAnswer} />
        </div>
        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-dim)' }}>La suite arrive… regardez l'écran principal 👀</p>
      </div>
    );
  }

  function ParticipantPodium({ podium, myPid }) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center fade-in-up">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="font-display text-3xl font-black bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent mb-2">Podium final</h2>
        <p className="text-sm mb-8" style={{ color: 'var(--text-dim)' }}>Merci d'avoir joué !</p>
        {podium && podium.length > 0 ? (
          <div className="glass p-6 w-full max-w-sm space-y-3">
            {podium.map((p, i) => (
              <div key={i} className={'flex items-center gap-3 rounded-2xl px-4 py-3 ' + (p.pid === myPid ? 'bg-cyan-500/10 border border-cyan-400/30' : 'bg-white/5')}>
                <span className="text-2xl">{['🥇','🥈','🥉'][i] || (i + 1) + '.'}</span>
                <span className="font-bold flex-1 text-left">{p.emoji} {p.pseudo}</span>
                <span className="font-mono text-cyan-300 font-bold">{p.score} pts</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass px-6 py-4" style={{ color: 'var(--text-dim)' }}>Session terminée, à bientôt ! 👋</div>
        )}
      </div>
    );
  }

  /* Orchestration du flux participant */
  function ParticipantFlow({ room, showToast, onBack }) {
    const [me, setMe] = useState(null);
    const [state, setState] = useState(null);
    const [isOnline, setIsOnline] = useState(true);
    const myVoteRef = useRef(null);
    const lastQKeyRef = useRef('');

    const enter = (pseudo, emoji) => {
      const pid = U().genId();
      setMe({ pid, pseudo, emoji });
      window.IB.sync.join(room, { pid, pseudo, emoji });
    };

    useEffect(() => {
      if (!me) return undefined;
      return window.IB.sync.watchRoom(room, me, {
        onState: (s) => {
          setState(s);
          setIsOnline(true);
        },
        onError: (msg) => {
          showToast(msg, 'error');
          setIsOnline(false);
        },
      });
    }, [me && me.pid, room]);

    /* Reset du vote local PENDANT le rendu (pas en effet) */
    const qKey = state ? state.status + ':' + state.questionIndex : '';
    if (qKey !== lastQKeyRef.current) {
      if (state && state.status === 'question') myVoteRef.current = null;
      lastQKeyRef.current = qKey;
    }

    if (!me) return <ParticipantJoin room={room} onEnter={enter} onBack={onBack} />;
    if (!state) return <ParticipantWait me={me} hint={window.IB.sync.demoMode
      ? "En attente de l'animateur… ouvrez l'écran Animateur dans un autre onglet de ce navigateur."
      : undefined} />;

    const quiz = state.quiz || U().loadQuiz();
    const q = quiz[state.questionIndex];

    const castVote = (payload) => {
      myVoteRef.current = payload.opt != null ? payload.opt : -1;
      const doc = { questionIndex: state.questionIndex };
      if (payload.opt != null) doc.optionIndex = payload.opt;
      if (payload.text) doc.text = String(payload.text).slice(0, 80);
      if (payload.val != null && isFinite(payload.val)) doc.val = Number(payload.val);
      window.IB.sync.vote(room, me.pid, doc);
    };

    const content = (
      <>
        <window.IB.ui.ConnectionStatus online={isOnline} />
        {state.status === 'question' && q && (
          <ParticipantVote key={state.questionIndex} q={q} qIndex={state.questionIndex} total={quiz.length} me={me} onVote={castVote} endsAt={state.questionEndsAt} />
        )}
        {state.status === 'results' && q && (
          <ParticipantResults qIndex={state.questionIndex} total={quiz.length} results={state.lastResults} q={q} myAnswer={myVoteRef.current} />
        )}
        {state.status === 'podium' && (
          <ParticipantPodium podium={state.podium} myPid={me.pid} />
        )}
        {state.status !== 'question' && state.status !== 'results' && state.status !== 'podium' && (
          <ParticipantWait me={me} />
        )}
      </>
    );

    return content;
  }

  window.IB.views = window.IB.views || {};
  window.IB.views.ParticipantFlow = ParticipantFlow;
})();
