/* ════════════════════════════════════════════════════════════════
   APP — Routeur par hash + montage
   #/        → accueil
   #/join    → participant (avec ?room=CODE)
   #/host    → animateur (avec ?room=CODE)
   #/admin   → dashboard questions & style
════════════════════════════════════════════════════════════════ */
'use strict';

(function () {
  const U = window.IB.util;

  function App() {
    const [route, setRoute] = useState(U.hash());          // home | join | host | admin
    const [room, setRoom] = useState(U.getRoomParam());
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    const showToast = useCallback((msg, type) => {
      setToast({ msg, type: type || 'success' });
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 2800);
    }, []);

    useEffect(() => {
      const onHash = () => setRoute(U.hash());
      window.addEventListener('hashchange', onHash);
      return () => window.removeEventListener('hashchange', onHash);
    }, []);

    /* Lien QR scanné (?room=CODE sans #) : sauter l'accueil, aller
       directement à la saisie du pseudo. */
    useEffect(() => {
      if (U.getRoomParam() && !window.location.hash) location.hash = '#/join';
    }, []);

    const goJoin = (code) => { setRoom(code); U.setRoomParam(code); location.hash = '#/join'; };
    const goCreate = () => {
      const c = U.genRoomCode();
      setRoom(c); U.setRoomParam(c); location.hash = '#/host';
    };
    const goHome = () => { U.setRoomParam(''); setRoom(''); location.hash = '#/'; };
    const goAdmin = () => { location.hash = '#/admin'; };

    const views = window.IB.views;
    return (
      <React.Fragment>
        <Toast toast={toast} />
        {route === 'home' && <views.HomeScreen onJoin={goJoin} onCreate={goCreate} />}
        {route === 'join' && <views.ParticipantFlow room={room} showToast={showToast} onBack={goHome} />}
        {route === 'host' && <views.HostFlow room={room} showToast={showToast} onExit={goHome} />}
        {route === 'admin' && <views.Dashboard onBack={goHome} />}
      </React.Fragment>
    );
  }

  /* Thème au démarrage (avant premier rendu pour éviter le flash) */
  window.IB.theme.applyTheme(window.IB.util.store.get('theme', { preset: 'navy', vars: {} }));
  const dispFont = (window.IB.util.store.get('theme', {}).vars || {})['--font-display'];
  if (dispFont) window.IB.theme.loadDisplayFont(dispFont);

  /* Le bouton "Créer" doit exposer son code de salle : le router host lit ?room= */
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
