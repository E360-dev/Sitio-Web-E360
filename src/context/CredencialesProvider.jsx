import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';
import { idSesion } from '../lib/authStore.mjs';
import { operarCuentasTecnologia } from '../lib/cuentasTecnologiaApi';

const Context = createContext(null);

export function CredencialesProvider({ children }) {
  const { user, session, rol } = useAuth();
  const identity = rol === 'admin' && user && idSesion(session) ? `${user.id}:${idSesion(session)}` : null;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const [grant, setGrant] = useState(null);
  const [revelada, setRevelada] = useState(null);
  const grantRef = useRef(null);
  const revision = useRef(0);
  const revealRevision = useRef(0);
  const timer = useRef(null);

  const ocultar = useCallback(() => {
    revealRevision.current++;
    clearTimeout(timer.current);
    setRevelada(null);
  }, []);
  const bloquear = useCallback(() => {
    const current = grantRef.current;
    revision.current++;
    grantRef.current = null;
    setGrant(null);
    ocultar();
    if (current) void operarCuentasTecnologia('bloquear', {}, current.token).catch(() => {});
  }, [ocultar]);

  useEffect(() => { bloquear(); }, [identity, bloquear]);
  useEffect(() => {
    const hidden = () => { if (document.visibilityState === 'hidden') ocultar(); };
    window.addEventListener('pagehide', bloquear);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('pagehide', bloquear);
      document.removeEventListener('visibilitychange', hidden);
      clearTimeout(timer.current);
    };
  }, [bloquear, ocultar]);

  const desbloquear = async (password) => {
    const original = identityRef.current;
    const requestRevision = revision.current;
    if (!original) throw new Error('Solo los administradores pueden desbloquear credenciales.');
    const data = await operarCuentasTecnologia('desbloquear', { contrasena: password });
    if (identityRef.current !== original || revision.current !== requestRevision) {
      void operarCuentasTecnologia('bloquear', {}, data.desbloqueo).catch(() => {});
      throw new Error('La sesión ha cambiado. Vuelve a intentarlo.');
    }
    const next = { identity: original, token: data.desbloqueo };
    grantRef.current = next;
    setGrant(next);
  };

  const operar = async (accion, datos) => {
    const current = grantRef.current;
    const token = current?.identity === identityRef.current ? current.token : null;
    try { return await operarCuentasTecnologia(accion, datos, token); }
    catch (error) {
      if (['SESION_INVALIDA', 'SOLO_ADMIN', 'BOVEDA_BLOQUEADA'].includes(error.codigo)) bloquear();
      throw error;
    }
  };
  const revelar = async (id, copiar = false) => {
    ocultar();
    const original = identityRef.current;
    const requestRevision = revision.current;
    const requestRevealRevision = revealRevision.current;
    const plaintext = operar('revelar', { id, motivo: copiar ? 'copiar' : 'mostrar' }).then((data) => {
      if (identityRef.current !== original || revision.current !== requestRevision || revealRevision.current !== requestRevealRevision) throw new Error('La sesión ha cambiado. Vuelve a intentarlo.');
      return data.contrasena;
    });
    if (copiar) {
      try {
        // Start the clipboard operation during the actual click. Its data is
        // supplied asynchronously so browsers retain the user's activation.
        if (globalThis.ClipboardItem && navigator.clipboard?.write) {
          await navigator.clipboard.write([new ClipboardItem({ 'text/plain': plaintext.then((text) => new Blob([text], { type: 'text/plain' })) })]);
        } else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(await plaintext);
        else { await plaintext; throw new DOMException('Clipboard unavailable', 'NotAllowedError'); }
      } catch (error) {
        // Consume a failed fetch even when clipboard permissions failed first.
        await plaintext.catch(() => {});
        if (error instanceof DOMException) throw new Error('El navegador no permitió copiar. Pulsa Mostrar para copiar la contraseña manualmente.');
        throw error;
      }
    } else {
      setRevelada({ id, contrasena: await plaintext });
      timer.current = setTimeout(ocultar, 30_000);
    }
  };
  return <Context.Provider value={{ desbloqueada: Boolean(identity && grant?.identity === identity), desbloquear, bloquear, operar, revelar, revelada, ocultar }}>{children}</Context.Provider>;
}

export const useCredenciales = () => useContext(Context);
