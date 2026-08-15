'use client';

import { useEffect, useState } from 'react';
import { isAdmin } from '@/lib/pocketbase';

/**
 * Acceso rápido al panel, visible SOLO si hay sesión de admin (superuser) en
 * este navegador. Para el público normal no aparece.
 */
export default function AdminLink() {
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    setAdmin(isAdmin());
    // Reevalúa al volver a la pestaña (por si entró/salió del panel en otra).
    const onVis = () => setAdmin(isAdmin());
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  if (!admin) return null;

  return (
    <a
      href="/admin"
      className="fixed left-4 top-4 z-50 flex items-center gap-2 rounded-full border border-primary/40 bg-surface/90 px-3.5 py-2 text-xs font-bold text-primary shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-md transition-transform hover:scale-105"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
      Panel admin
    </a>
  );
}
