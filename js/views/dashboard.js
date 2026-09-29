/* ════════════════════════════════════════════════════════════════
   VIEW — Dashboard (#/admin)
   Créer / modifier les questions, changer le style, personnaliser
   les options. Persisté en localStorage ; les salles déjà créées
   gardent leur copie (diffusée à l'exécution).
════════════════════════════════════════════════════════════════ */
'use strict';

(function () {
  const U = () => window.IB.util;

  /* ── Verrou PIN ─────────────────────────────────────────────
     SHA-256 du PIN (jamais en clair côté JS expose) ; la config
     contient IB_CONFIG.ADMIN_PIN. Session mémorisée 8 h.        */
  async function sha256(txt) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  const UNLOCK_HOURS = 8;

  function PinGate({ onUnlock }) {
    const [pin, setPin] = useState('');
    const pinRef = useRef('');                 // source de vérité pour le submit async
    const [error, setError] = useState(false);
    const [hashOk, setHashOk] = useState(false);
    const expectedRef = useRef(null);

    useEffect(() => {
      sha256(String(window.IB_CONFIG.ADMIN_PIN)).then((h) => { expectedRef.current = h; setHashOk(true); });
    }, []);

    const submit = async () => {
      const h = await sha256(pinRef.current);
      if (expectedRef.current && h === expectedRef.current) {
        U().store.set('admin_unlocked_until', Date.now() + UNLOCK_HOURS * 3600 * 1000);
        onUnlock();
      } else {
        setError(true);
        pinRef.current = '';
        setPin('');
        setTimeout(() => setError(false), 600);
      }
    };

    const digit = (d) => {
      if (pinRef.current.length >= 4) return;
      const next = pinRef.current + d;
      pinRef.current = next;
      setPin(next);
      if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
      if (next.length === 4) setTimeout(submit, 120);
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className={'glass-strong p-8 w-full max-w-xs text-center fade-in-up' + (error ? ' shake' : '')}>
          <div className="text-5xl mb-3 select-none">🔐</div>
          <h2 className="font-display text-2xl font-bold mb-1">Dashboard</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>Saisissez le code à 4 chiffres</p>
          <div className="flex justify-center gap-3 mb-6" aria-label="PIN saisi">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}
                className={'w-12 h-14 rounded-xl border-2 flex items-center justify-center font-display text-2xl font-black transition-all ' +
                  (error ? 'border-rose-400/70 text-rose-300' : pin.length > i ? 'border-cyan-400/70 text-cyan-300 bg-cyan-400/10' : 'border-white/15 text-transparent')}>
                {pin.length > i ? '•' : '·'}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {['1','2','3','4','5','6','7','8','9'].map((d) => (
              <button key={d} onClick={() => digit(d)} className="glass py-3.5 font-display text-xl font-bold hover:bg-white/10 transition active:scale-95">{d}</button>
            ))}
            <button onClick={() => { pinRef.current = ''; setPin(''); }} className="glass py-3.5 text-sm hover:bg-white/10 transition active:scale-95" style={{ color: 'var(--text-dim)' }}>C</button>
            <button onClick={() => digit('0')} className="glass py-3.5 font-display text-xl font-bold hover:bg-white/10 transition active:scale-95">0</button>
            <button onClick={() => { pinRef.current = pinRef.current.slice(0, -1); setPin(pinRef.current); }} className="glass py-3.5 text-xl hover:bg-white/10 transition active:scale-95" style={{ color: 'var(--text-dim)' }}>⌫</button>
          </div>
          {error && <p className="text-rose-300 text-sm mt-4 fade-in-up">Code incorrect</p>}
          {!hashOk && <p className="text-xs mt-4" style={{ color: 'var(--text-dim)' }}>Initialisation…</p>}
          <a href="#/" className="block mt-6 text-xs hover:text-slate-300 transition" style={{ color: 'var(--text-dim)' }}>← Retour à l'accueil</a>
        </div>
      </div>
    );
  }

  const newQuestion = (type) => {
    const base = { phase: '', type, question: '', seconds: 30 };
    if (type === 'mcq') return { ...base, options: ['Option 1', 'Option 2', '', ''] };
    if (type === 'word') return { ...base, placeholder: 'Votre réponse…', maxLen: 30 };
    if (type === 'number') return { ...base, unit: '', maxLen: 12, target: '' };
    if (type === 'scale') return { ...base, min: 1, max: 10 };
    return base;
  };

  function QuestionEditor({ q, index, onChange, onDelete, onMove }) {
    const badge = U().typeBadge(q);
    return (
      <div className="dash-card fade-in-up">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-xs bg-white/5 rounded-lg px-2.5 py-1" style={{ color: 'var(--text-dim)' }}>Q{index + 1}</span>
          <span className="text-xs bg-violet-500/10 border border-violet-400/30 text-violet-300 rounded-full px-2.5 py-1">{badge.icon} {badge.label}</span>
          <div className="flex-1" />
          <button onClick={() => onMove(index, -1)} title="Monter" className="btn-ghost px-2.5 py-1 text-xs">↑</button>
          <button onClick={() => onMove(index, 1)} title="Descendre" className="btn-ghost px-2.5 py-1 text-xs">↓</button>
          <button onClick={onDelete} title="Supprimer" className="btn-ghost btn-danger px-2.5 py-1 text-xs">✕</button>
        </div>

        <label className="dash-label">Phase</label>
        <input className="dash-input mb-3" value={q.phase || ''}
          onChange={(e) => onChange({ ...q, phase: e.target.value })} placeholder="Ex : Phase 1 — Le Réveil" list="ib-phases" />

        <div className="grid sm:grid-cols-[1fr_auto] gap-3 mb-3">
          <div>
            <label className="dash-label">⏱ Durée (Big Quiz — 0 = pas de timer)</label>
            <div className="flex items-center gap-2">
              <input className="dash-input" type="number" min="0" max="300" value={q.seconds != null ? q.seconds : 0}
                onChange={(e) => onChange({ ...q, seconds: Math.max(0, Math.min(300, Number(e.target.value) || 0)) })} />
              <span className="text-xs shrink-0" style={{ color: 'var(--text-dim)' }}>secondes</span>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-[1fr_auto] gap-3 mb-3">
          <div>
            <label className="dash-label">Question</label>
            <textarea className="dash-textarea" rows="2" value={q.question}
              onChange={(e) => onChange({ ...q, question: e.target.value })} placeholder="Votre question…" />
          </div>
          <div className="sm:w-40">
            <label className="dash-label">Format</label>
            <select className="dash-select" value={q.type}
              onChange={(e) => onChange({ ...newQuestion(e.target.value), phase: q.phase, question: q.question })}>
              <option value="mcq">🔘 Choix multiple</option>
              <option value="word">☁️ Nuage de mots</option>
              <option value="number">🔢 Estimation</option>
              <option value="scale">📏 Échelle</option>
            </select>
          </div>
        </div>

        {q.type === 'mcq' && (
          <div className="grid sm:grid-cols-2 gap-2 mb-3">
            {q.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-1.5 min-w-0">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-black text-sm shrink-0 text-white"
                  style={{ background: window.IB_CONFIG.OPT_GRADIENT[i] }}>{window.IB_CONFIG.OPT_LABEL[i]}</span>
                <input className="dash-input min-w-0 flex-1" value={opt}
                  onChange={(e) => { const options = [...q.options]; options[i] = e.target.value; onChange({ ...q, options }); }} />
                <button title="Bonne réponse" onClick={() => onChange({ ...q, correctIndex: q.correctIndex === i ? undefined : i })}
                  className={'shrink-0 text-lg ' + (q.correctIndex === i ? '' : 'opacity-30 hover:opacity-70 transition')}>
                  {q.correctIndex === i ? '✅' : '⬜'}
                </button>
              </div>
            ))}
          </div>
        )}

        {q.type === 'word' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="dash-label">Placeholder</label>
              <input className="dash-input" value={q.placeholder || ''}
                onChange={(e) => onChange({ ...q, placeholder: e.target.value })} />
            </div>
            <div>
              <label className="dash-label">Longueur max</label>
              <input className="dash-input" type="number" min="4" max="80" value={q.maxLen || 30}
                onChange={(e) => onChange({ ...q, maxLen: Number(e.target.value) })} />
            </div>
          </div>
        )}

        {q.type === 'number' && (
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="dash-label">Unité</label>
              <input className="dash-input" value={q.unit || ''} onChange={(e) => onChange({ ...q, unit: e.target.value })} placeholder="M€, jours, %…" />
            </div>
            <div>
              <label className="dash-label">Cible (le + proche gagne)</label>
              <input className="dash-input" type="number" value={q.target != null && q.target !== '' ? q.target : ''}
                onChange={(e) => onChange({ ...q, target: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="optionnel" />
            </div>
            <div>
              <label className="dash-label">Longueur max</label>
              <input className="dash-input" type="number" min="3" max="15" value={q.maxLen || 12}
                onChange={(e) => onChange({ ...q, maxLen: Number(e.target.value) })} />
            </div>
          </div>
        )}

        {q.type === 'scale' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="dash-label">Minimum</label>
              <input className="dash-input" type="number" value={q.min != null ? q.min : 1}
                onChange={(e) => onChange({ ...q, min: Number(e.target.value) })} />
            </div>
            <div>
              <label className="dash-label">Maximum</label>
              <input className="dash-input" type="number" value={q.max != null ? q.max : 10}
                onChange={(e) => onChange({ ...q, max: Number(e.target.value) })} />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* Interrupteur sons (persistant, partagé animateur/participants) */
  function SoundToggle() {
    const [on, setOn] = useState(window.IB.audio.enabled());
    return (
      <button onClick={() => { const v = !on; window.IB.audio.setEnabled(v); setOn(v); }}
        className={'shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition ' + (on ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300' : 'glass text-slate-400')}
        title={on ? 'Couper les sons' : 'Activer les sons'}>
        {on ? '🔊 Activés' : '🔇 Coupés'}
      </button>
    );
  }

  function StyleEditor({ theme, onChange }) {
    const presets = window.IB_CONFIG.THEME_PRESETS;
    const fonts = window.IB.theme.FONT_CHOICES;
    const vars = theme.vars || {};
    const setVar = (k, v) => onChange({ ...theme, vars: { ...vars, [k]: v } });
    const ROWS = [
      ['--bg', 'Fond principal'], ['--bg-2', 'Fond des cartes'], ['--bg-3', 'Fond surélevé'],
      ['--accent', 'Accent principal'], ['--accent-2', 'Accent secondaire'], ['--accent-3', 'Accent tertiaire'],
      ['--text', 'Texte'], ['--text-dim', 'Texte secondaire'],
    ];
    return (
      <div className="space-y-4">
        <div>
          <label className="dash-label">Preset</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(presets).map(([key, p]) => (
              <button key={key} onClick={() => onChange({ preset: key, vars: {} })}
                className={'dash-card text-left text-sm font-semibold transition ' + (theme.preset === key || (!theme.preset && key === 'navy') ? 'ring-2 ring-cyan-400/60' : 'hover:border-white/20')}>
                {p.label}
                <div className="flex gap-1 mt-2">
                  {['--accent', '--accent-2', '--accent-3'].map((k) => (
                    <span key={k} className="w-4 h-4 rounded-full" style={{ background: p.vars[k] }} />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {ROWS.map(([k, label]) => (
            <div key={k} className="flex items-center gap-3">
              <input type="color" value={vars[k] || presets[theme.preset || 'navy'].vars[k]}
                onChange={(e) => setVar(k, e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border border-white/15 shrink-0" />
              <div className="flex-1">
                <label className="dash-label mb-0">{label}</label>
                <code className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{k}</code>
              </div>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="dash-label">Police des titres</label>
            <select className="dash-select" value={(vars['--font-display'] || presets[theme.preset || 'navy'].vars['--font-display']).split(',')[0].replace(/'/g, '')}
              onChange={(e) => { const f = e.target.value; window.IB.theme.loadDisplayFont(f); setVar('--font-display', "'" + f + "', sans-serif"); }}>
              {fonts.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="dash-label">Arrondi des cartes</label>
            <select className="dash-select" value={vars['--radius'] || presets[theme.preset || 'navy'].vars['--radius']}
              onChange={(e) => setVar('--radius', e.target.value)}>
              <option value="0.25rem">Carré (0.25rem)</option>
              <option value="0.5rem">Doux (0.5rem)</option>
              <option value="0.75rem">Moyen (0.75rem)</option>
              <option value="1.25rem">Arrondi (1.25rem)</option>
              <option value="1.75rem">Très arrondi (1.75rem)</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  function Dashboard({ onBack }) {
    const [unlocked, setUnlocked] = useState(() => {
      const until = U().store.get('admin_unlocked_until', 0);
      return Date.now() < until;
    });
    const [tab, setTab] = useState('quiz');                    // quiz | style | data
    const [quiz, setQuiz] = useState(U().loadQuiz());
    const [theme, setTheme] = useState(U().store.get('theme', { preset: 'navy', vars: {} }));
    const [savedFlash, setSavedFlash] = useState(false);
    const [saveState, setSaveState] = useState('');     // '' | 'saving…' | '✅ cloud' | '⚠️ local' | '✗'
    const [importText, setImportText] = useState('');
    const [importErr, setImportErr] = useState('');

    /* Live preview du style pendant l'édition */
    useEffect(() => { window.IB.theme.applyTheme(theme); }, [theme]);

    /* Au montage : la source officielle est le CLOUD (config/dashboard).
       On remplace l'état local si le cloud a une version — évite les
       divergences entre appareils/navigateurs/domaines. */
    useEffect(() => {
      if (!window.IB.sync.loadDashboard) return;      // mode démo : localStorage only
      let dead = false;
      window.IB.sync.loadDashboard().then((cfg) => {
        if (dead || !cfg) return;
        if (Array.isArray(cfg.quiz) && cfg.quiz.length) {
          setQuiz(cfg.quiz);
          U().saveQuiz(cfg.quiz);
        }
        if (cfg.theme) {
          setTheme(cfg.theme);
          window.IB.theme.applyTheme(cfg.theme);
          U().store.set('theme', cfg.theme);
        }
      });
      return () => { dead = true; };
    }, []);

    const phases = [...new Set(quiz.map((q) => q.phase).filter(Boolean))];

    const save = async (nextQuiz, nextTheme) => {
      const cleanQuiz = U().sanitizeQuiz(nextQuiz);
      U().saveQuiz(cleanQuiz);                        // cache local (repli + mode démo)
      U().store.set('theme', nextTheme);
      setQuiz(cleanQuiz);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
      /* Source officielle : le cloud (tous les appareils verront ceci) */
      if (window.IB.sync.saveDashboard) {
        setSaveState('saving…');
        const ok = await window.IB.sync.saveDashboard(cleanQuiz, nextTheme);
        setSaveState(ok ? '✅ cloud' : '⚠️ local seul');
        setTimeout(() => setSaveState(''), 2500);
      }
    };

    const updateQ = (i, nq) => setQuiz(quiz.map((x, j) => (j === i ? nq : x)));
    const deleteQ = (i) => setQuiz(quiz.filter((_, j) => j !== i));
    const moveQ = (i, dir) => {
      const j = i + dir;
      if (j < 0 || j >= quiz.length) return;
      const next = [...quiz];
      [next[i], next[j]] = [next[j], next[i]];
      setQuiz(next);
    };
    const addQ = (type) => setQuiz([...quiz, newQuestion(type)]);

    /* Tout effacer : confirmation, purge locale + cloud (le thème est
       conservé). Chaque organisateur part de zéro. */
    const clearAll = () => {
      if (quiz.length === 0) return;
      if (!window.confirm('Effacer les ' + quiz.length + ' question' + (quiz.length > 1 ? 's' : '') + ' ? Cette action est définitive (pensez à exporter avant).')) return;
      save([], theme);
    };

    const exportJson = () => {
      const blob = new Blob([JSON.stringify({ quiz, theme }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'icebreaker-quiz.json';
      a.click();
      URL.revokeObjectURL(a.href);
    };

    const importJson = () => {
      try {
        const data = JSON.parse(importText);
        if (!Array.isArray(data.quiz) && !Array.isArray(data)) throw new Error('Structure inattendue');
        const nextQuiz = U().sanitizeQuiz(Array.isArray(data) ? data : data.quiz);
        if (data.theme) { setTheme(data.theme); window.IB.theme.applyTheme(data.theme); U().store.set('theme', data.theme); }
        setQuiz(nextQuiz);
        U().saveQuiz(nextQuiz);
        setImportText(''); setImportErr('');
        setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1500);
      } catch (e) { setImportErr('JSON invalide : ' + e.message); }
    };

    if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;

    return (      <div className="min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto">

          <div className="flex items-center gap-2 sm:gap-3 mb-4 fade-in-up flex-wrap">
            <button onClick={onBack} className="btn-ghost shrink-0">← Retour</button>
            <h1 className="font-display text-xl sm:text-2xl font-black flex-1 min-w-0 truncate">🎛️ Dashboard</h1>
            {savedFlash && <span className="text-emerald-300 text-sm font-semibold fade-in-up">✅</span>}
            {saveState && <span className={'text-xs font-semibold fade-in ' + (saveState.startsWith('✅') ? 'text-emerald-300' : saveState.startsWith('⚠️') ? 'text-amber-300' : 'text-slate-400')}>{saveState}</span>}
            <button onClick={() => { U().store.del('admin_unlocked_until'); location.hash = '#/'; }}
              title="Re-verrouiller le dashboard" className="btn-ghost shrink-0">🔒</button>
            <button onClick={() => save(quiz, theme)} className="btn-primary shrink-0">💾 Enregistrer</button>
          </div>

          <div className="flex gap-2 mb-6 fade-in-up flex-wrap">
            {[['quiz', '❓ Questions'], ['style', '🎨 Style'], ['data', '📦 Import / Export']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={'px-4 py-2 rounded-xl text-sm font-bold transition ' + (tab === key ? 'bg-white/12 text-white border border-white/25' : 'glass text-sm') }
                style={tab === key ? {} : { color: 'var(--text-dim)' }}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'quiz' && (
            <div className="space-y-4">
              {quiz.length === 0 && (
                <div className="dash-card text-center py-10 fade-in-up">
                  <div className="text-5xl mb-3">📝</div>
                  <h3 className="font-display font-bold text-lg mb-1">Aucune question pour l'instant</h3>
                  <p className="text-sm mb-5" style={{ color: 'var(--text-dim)' }}>
                    Créez vos questions une par une, ou importez un JSON existant (onglet Import / Export).
                  </p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {[['mcq', '＋ QCM'], ['word', '＋ Nuage'], ['number', '＋ Estimation'], ['scale', '＋ Échelle']].map(([t, label]) => (
                      <button key={t} onClick={() => addQ(t)} className="btn-primary">{label}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="dash-card flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-sm">🔊 Sons & timer</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    Sons façon Kahoot + compte à rebours par question (champ « Durée »).
                  </p>
                </div>
                <SoundToggle />
              </div>
              <datalist id="ib-phases">{phases.map((p) => <option key={p} value={p} />)}</datalist>
              {quiz.map((q, i) => (
                <QuestionEditor key={i} q={q} index={i} onChange={(nq) => updateQ(i, nq)} onDelete={() => deleteQ(i)} onMove={moveQ} />
              ))}
              <div className="flex gap-2 flex-wrap pt-2">
                {[['mcq', '＋ QCM'], ['word', '＋ Nuage'], ['number', '＋ Estimation'], ['scale', '＋ Échelle']].map(([t, label]) => (
                  <button key={t} onClick={() => addQ(t)} className="btn-ghost">{label}</button>
                ))}
              </div>
              {quiz.length > 0 && (
                <div className="pt-2">
                  <button onClick={clearAll}
                    className="text-xs text-rose-300/70 hover:text-rose-300 underline underline-offset-2 transition">
                    🗑 Tout effacer ({quiz.length} question{quiz.length > 1 ? 's' : ''})
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'style' && <StyleEditor theme={theme} onChange={setTheme} />}

          {tab === 'data' && (
            <div className="space-y-6">
              <div className="dash-card">
                <h3 className="font-display font-bold mb-2">Exporter</h3>
                <p className="text-sm mb-3" style={{ color: 'var(--text-dim)' }}>Sauvegarde vos {quiz.length} questions et votre thème dans un fichier JSON.</p>
                <button onClick={exportJson} className="btn-primary">⬇️ Télécharger le JSON</button>
              </div>
              <div className="dash-card">
                <h3 className="font-display font-bold mb-2">Importer</h3>
                <textarea className="dash-textarea font-mono text-xs" rows="5" value={importText}
                  onChange={(e) => setImportText(e.target.value)} placeholder='{"quiz": [...], "theme": {...}}' />
                {importErr && <p className="text-rose-300 text-sm mt-2">{importErr}</p>}
                <button onClick={importJson} disabled={!importText.trim()} className="btn-primary mt-3">⬆️ Importer</button>
                <button onClick={clearAll}
                  className="btn-ghost btn-danger ml-2">🗑 Tout effacer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  window.IB.views = window.IB.views || {};
  window.IB.views.Dashboard = Dashboard;
})();
