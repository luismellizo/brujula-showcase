'use client';

import { useState } from 'react';
import { radioConfig } from '@/lib/radio-config';

/** Compartir la emisora vía Web Share API; cae a copiar enlace. */
export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    const data = {
      title: radioConfig.stationName,
      text: `Escucha ${radioConfig.stationName} en vivo · ${radioConfig.tagline}`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* cancelado por el usuario */
    }
  };

  return (
    <button type="button" onClick={onShare} className="share-btn" aria-label="Compartir emisora">
      {copied ? (
        <>
          <CheckIcon /> ¡Enlace copiado!
        </>
      ) : (
        <>
          <ShareIcon /> Compartir
        </>
      )}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
