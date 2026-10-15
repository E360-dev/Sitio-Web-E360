// Auth callbacks schedule role queries outside Supabase's authentication lock.
export function crearEstadoAuth(client, { defer = (fn) => setTimeout(fn, 0), now = Date.now } = {}) {
  let state = { user: null, session: null, rol: null, loading: true, error: null };
  let generation = 0;
  let fetching = null;
  let lastCheck = 0;
  let subscription;
  let users = 0;
  const listeners = new Set();
  const publish = (next) => { state = { ...state, ...next }; listeners.forEach((listener) => listener()); };

  async function refreshRole(force = false) {
    if (!state.user || fetching || (!force && now() - lastCheck < 60_000)) return fetching;
    const revision = generation;
    const userId = state.user.id;
    const task = (async () => {
      try {
        const { data, error } = await client.from('roles_usuario').select('rol').eq('user_id', userId).maybeSingle();
        if (revision !== generation) return;
        if (error) throw error;
        lastCheck = now();
        publish({ rol: data?.rol || null, loading: false, error: null });
      } catch {
        if (revision === generation) publish({ loading: false, error: 'No se pudo verificar el acceso. Comprueba la conexión y vuelve a intentar.' });
      }
    })();
    fetching = task;
    try { await task; } finally { if (fetching === task) fetching = null; }
  }

  function acceptSession(session, event) {
    const changed = state.user?.id !== session?.user?.id;
    if (!session) {
      generation++;
      fetching = null;
      lastCheck = 0;
      publish({ user: null, session: null, rol: null, loading: false, error: null });
      return;
    }
    if (changed) {
      generation++;
      fetching = null;
      lastCheck = 0;
      publish({ user: session.user, session, rol: null, loading: true, error: null });
      defer(() => refreshRole(true));
    } else {
      publish({ user: session.user, session });
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') defer(() => refreshRole());
    }
  }

  const focus = () => { if (typeof document === 'undefined' || document.visibilityState === 'visible') void refreshRole(); };
  return {
    getSnapshot: () => state,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    retry: () => state.user ? refreshRole(true) : client.auth.getSession().then(({ data, error }) => {
      if (error) publish({ loading: false, error: 'No se pudo recuperar la sesión. Vuelve a intentar.' });
      else acceptSession(data.session, 'INITIAL_SESSION');
    }),
    start() {
      if (users++ === 0) {
        let receivedEvent = false;
        const { data } = client.auth.onAuthStateChange((event, session) => {
          receivedEvent = true;
          acceptSession(session, event);
        });
        subscription = data.subscription;
        client.auth.getSession().then(({ data, error }) => {
          if (!users || receivedEvent) return;
          if (error) publish({ loading: false, error: 'No se pudo recuperar la sesión. Vuelve a intentar.' });
          else acceptSession(data.session, 'INITIAL_SESSION');
        }).catch(() => publish({ loading: false, error: 'No se pudo recuperar la sesión. Vuelve a intentar.' }));
        globalThis.document?.addEventListener('visibilitychange', focus);
        globalThis.window?.addEventListener('online', focus);
      }
      return () => {
        if (--users === 0) {
          subscription?.unsubscribe();
          globalThis.document?.removeEventListener('visibilitychange', focus);
          globalThis.window?.removeEventListener('online', focus);
        }
      };
    },
  };
}

export function idSesion(session) {
  if (!session?.access_token) return null;
  try {
    const payload = session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).session_id || null;
  } catch { return null; }
}
