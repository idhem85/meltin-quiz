/* ════════════════════════════════════════════════════════════════
   UI — Composants partagés (React)
════════════════════════════════════════════════════════════════ */
'use strict';

const { useState, useEffect, useRef, useCallback } = React;

/* QR code généré localement (qrcodejs), fallback API publique */
function QrCode({ text, size }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    try {
      if (window.QRCode) {
        new window.QRCode(el, {
          text, width: size, height: size,
          colorDark: '#22d3ee', colorLight: '#0f172a',
          correctLevel: window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.M : 0,
        });
        return;
      }
    } catch (e) { /* fallback */ }
    const img = document.createElement('img');
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size +
      '&bgcolor=10-18-34&color=22-d3-ee&data=' + encodeURIComponent(text);
    img.alt = 'QR code'; img.width = size; img.height = size; img.className = 'rounded-xl';
    el.appendChild(img);
  }, [text, size]);
  return <div ref={ref} className="qr-wrap inline-block rounded-xl bg-slate-900 p-2 border border-white/10 max-w-full" />;
}

/* Garde-fou : une vue qui plante affiche un écran d'erreur au lieu
d'une page blanche (React 18 démonte sinon tout l'arbre). */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error('[MELTIN QUIZ] Crash de vue :', err, info && info.componentStack); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="glass-strong p-8 max-w-sm w-full fade-in-up">
          <div className="text-5xl mb-4">😵</div>
          <h2 className="font-display text-xl font-bold mb-2">Oups, un pépin d'affichage</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-dim)' }}>
            Un élément de l'écran a planté, mais l'application tourne toujours.
          </p>
          <button onClick={() => this.setState({ err: null })}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-white shadow-lg shadow-cyan-500/25 transition-all active:scale-[0.98]">
            Réessayer
          </button>
          <button onClick={() => { location.hash = '#/'; }}
            className="mt-3 w-full py-3 text-sm hover:text-slate-300 transition" style={{ color: 'var(--text-dim)' }}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }
}

/* Toast flottant */
function Toast({ toast }) {
  if (!toast) return null;
  const styles = toast.type === 'error'
    ? 'bg-rose-500/15 border-rose-400/40 text-rose-100'
    : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100';
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] fade-in-up">
      <div className={'glass-strong px-5 py-3 rounded-2xl border text-sm font-semibold flex items-center gap-2 ' + styles}>
        <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}

/* Indicateur de connexion temps réel */
function ConnectionStatus({ online }) {
  if (online) return null; // On ne montre rien si tout va bien
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] fade-in">
      <div className="glass-strong bg-rose-500/20 border-rose-500/40 text-rose-200 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 border">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        Connexion perdue... tentative de reconnexion
      </div>
    </div>
  );
}


/* ────────────────────────────────────────────────────────────────
   CORPS DE RÉSULTATS PARTAGÉ — rend le graphique du bon format.
   mini : version compacte (mobile) · nameOf : pid → pseudo
──────────────────────────────────────────────────────────────── */
function ResultBody({ q, r, mounted, mini, myAnswer, nameOf }) {
  const type = (r && r.type) || 'mcq';
  const WCOLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#60a5fa'];
  const OPT = window.IB_CONFIG.OPT_COLOR, GRAD = window.IB_CONFIG.OPT_GRADIENT;

  if (!r || !r.total) return <div className="text-center py-8 text-slate-500">Aucune réponse reçue pour cette question.</div>;

  /* QCM : barres horizontales animées */
  if (type === 'mcq') {
    const rows = r.counts || [];
    const top = rows.length ? Math.max(...rows) : 0;
    return (
      <div className={mini ? 'space-y-4' : 'space-y-5'}>
        {(q.options || []).map((opt, i) => {
          const count = rows[i] || 0;
          const pct = Math.round((count / r.total) * 100);
          const isTop = count > 0 && count === top;
          return (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className={'font-semibold truncate pr-3 ' + (mini ? 'text-sm ' : '') + (myAnswer === i ? 'text-cyan-300' : 'text-slate-300')}>
                  {myAnswer === i ? '➜ ' : ''}{opt}
                </span>
                <span className={'font-mono text-slate-400 shrink-0 ' + (mini ? 'text-xs' : 'text-sm')}>{pct}% · {count}</span>
              </div>
              <div className={(mini ? 'h-3.5' : 'h-6') + ' bg-white/5 rounded-full overflow-hidden'}>
                <div className="result-bar-fill h-full rounded-full relative"
                  style={{
                    width: mounted ? pct + '%' : '0%',
                    background: GRAD[i],
                    boxShadow: '0 0 ' + (mini ? '12px ' : '20px ') + OPT[i] + '55' + (mini ? '' : ', inset 0 1px 0 rgba(255,255,255,.35)'),
                  }}>
                  {!mini && isTop && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-lg">👑</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* Nuage de mots — TOP mots seulement (perf à 300 participants) */
  if (type === 'word') {
    const words = (r.words || []).slice(0, mini ? 8 : 24);
    const maxN = words.length ? Math.max(...words.map((x) => x.n)) : 1;
    return (
      <div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 py-4">
          {words.map((x, i) => (
            <span key={i} className="scale-in font-bold leading-none"
              style={{
                fontSize: (mini ? 15 : 20) + Math.round((x.n / maxN) * (mini ? 14 : 28)) + 'px',
                color: WCOLORS[i % WCOLORS.length],
                opacity: 0.5 + 0.5 * (x.n / maxN),
                animationDelay: Math.min(i * 0.05, 0.5) + 's',
              }}>
              {x.w}{x.n > 1 && <span className="text-slate-500 text-xs font-sans ml-1">×{x.n}</span>}
            </span>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500 mt-2">{r.distinct} réponse{r.distinct > 1 ? 's' : ''} différente{r.distinct > 1 ? 's' : ''} · {r.total} au total</p>
      </div>
    );
  }

  /* Estimation chiffrée */
  if (type === 'number') {
    const entries = r.entries || [];
    const hasTarget = q.target != null;
    let ranked = entries;
    if (hasTarget) ranked = [...entries].sort((a, b) => Math.abs(a.v - q.target) - Math.abs(b.v - q.target));
    const shown = ranked.slice(0, mini ? 3 : 8);
    const fmt = window.IB.util.fmtNum;
    return (
      <div>
        {hasTarget && (
          <div className="text-center mb-5">
            <span className="glass rounded-2xl px-5 py-2 inline-block">
              <span className="text-slate-400 text-sm">Réponse cible : </span>
              <span className="font-display font-black text-amber-300 text-xl">{fmt(q.target)} {q.unit || ''}</span>
            </span>
          </div>
        )}
        <div className="space-y-2.5">
          {shown.map((e, i) => {
            const delta = hasTarget ? Math.abs(e.v - q.target) : null;
            return (
              <div key={i} className={'scale-in flex items-center gap-3 rounded-2xl px-4 py-3 ' + (i === 0 && hasTarget ? 'bg-amber-500/10 border border-amber-400/30' : 'bg-white/5')} style={{ animationDelay: i * 0.06 + 's' }}>
                <span className="text-xl">{hasTarget ? ['🎯', '🥈', '🥉'][i] || (i + 1) + '.' : '👤'}</span>
                <span className="font-bold flex-1 truncate">{nameOf ? nameOf(e.pid) || 'Anonyme' : 'Participant'}</span>
                <span className="font-mono font-black text-cyan-300">{fmt(e.v)} {q.unit || ''}</span>
                {delta != null && <span className="font-mono text-xs text-slate-500">Δ {fmt(delta)}</span>}
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-5 text-center">
          {[['Min', r.min], ['Moyenne', Math.round(r.avg * 10) / 10], ['Max', r.max]].map(([lbl, v], i) => (
            <div key={i} className="glass rounded-2xl py-3">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">{lbl}</div>
              <div className="font-display font-black text-lg text-slate-200">{v == null ? '—' : fmt(v)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* Échelle : distribution + moyenne */
  if (type === 'scale') {
    const min = q.min != null ? q.min : 1, max = q.max != null ? q.max : 10;
    const rows = r.counts || [];
    const maxN = Math.max(...rows, 1);
    return (
      <div>
        <div className="text-center mb-5">
          <span className="font-display text-6xl font-black bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}>
            {Math.round(r.avg * 10) / 10}
          </span>
          <span className="text-slate-500 text-lg"> / {max}</span>
          <div className="text-xs text-slate-500 mt-1">score moyen · {r.total} réponse{r.total > 1 ? 's' : ''}</div>
        </div>
        <div className="flex items-end gap-1.5" style={{ height: mini ? '90px' : '150px' }}>
          {rows.map((count, i) => {
            const pct = (count / maxN) * 100;
            const val = min + i;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="font-mono text-[10px] text-slate-400">{count || ''}</span>
                <div className="result-bar-fill w-full rounded-t-lg"
                  style={{
                    height: mounted ? Math.max(pct, 3) + '%' : '0%',
                    background: 'linear-gradient(180deg,#22d3ee,#7c3aed)',
                    boxShadow: '0 0 14px rgba(34,211,238,.35)',
                    opacity: 0.55 + 0.45 * (val / max),
                  }} />
                <span className="font-mono text-[10px] text-slate-500">{val}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
}

window.IB.ui = { QrCode, Toast, ResultBody, ConnectionStatus };
