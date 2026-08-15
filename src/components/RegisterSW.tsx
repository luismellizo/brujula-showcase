'use client';

import { useEffect } from 'react';

/**
 * Registra el service worker y garantiza que el usuario reciba siempre la última
 * versión:
 *  - Comprueba actualizaciones al cargar y cada vez que vuelve a la pestaña.
 *  - Cuando un SW nuevo toma el control (skipWaiting + claim), recarga una vez
 *    para soltar cualquier resto viejo. (No recarga en la primera instalación.)
 */
export default function RegisterSW() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    const hadController = !!navigator.serviceWorker.controller;
    let refreshing = false;

    const onControllerChange = () => {
      if (refreshing || !hadController) return; // primera instalación → no recargar
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    let reg: ServiceWorkerRegistration | undefined;
    const checkUpdate = () => {
      if (document.visibilityState === 'visible') reg?.update().catch(() => {});
    };

    const onLoad = async () => {
      try {
        reg = await navigator.serviceWorker.register('/sw.js');
        reg.update().catch(() => {});
      } catch {
        /* sin SW */
      }
    };

    window.addEventListener('load', onLoad);
    document.addEventListener('visibilitychange', checkUpdate);
    return () => {
      window.removeEventListener('load', onLoad);
      document.removeEventListener('visibilitychange', checkUpdate);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);
  return null;
}
