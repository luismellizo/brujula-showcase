'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { radioConfig } from '@/lib/radio-config';
import { useRadio } from '@/components/radio/RadioProvider';
import Visualizer from '@/components/radio/Visualizer';
import { useCurrentSlot } from '@/components/radio/useCurrentSlot';

/**
 * Barra inferior persistente. Aparece al hacer scroll más allá del hero,
 * para que el control de reproducción siga siempre a mano.
 */
export default function StickyPlayer() {
  const cfg = radioConfig;
  const { isActive, isBusy, toggle, state } = useRadio();
  const nowSlot = useCurrentSlot();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const title = nowSlot ? nowSlot.slot.name : cfg.stationName;
  const sub = isActive ? 'EN VIVO' : isBusy ? 'Conectando…' : state === 'error' ? 'Error' : 'Toca para escuchar';

  return (
    <div className={`sticky-player ${shown ? 'sticky-player--in' : ''}`} role="region" aria-label="Reproductor">
      <div className="sticky-player-inner">
        <Image
          src={cfg.logoAsset}
          alt={cfg.stationName}
          width={80}
          height={80}
          className="h-10 w-10 shrink-0 rounded-lg object-contain"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight">{title}</p>
          <p className="flex items-center gap-1.5 text-[0.7rem] text-muted">
            {isActive && <span className="now-dot now-dot--sm" />}
            {sub}
          </p>
        </div>

        {isActive && <Visualizer active bars={5} />}

        <button
          type="button"
          onClick={toggle}
          aria-label={isActive ? 'Pausar' : 'Reproducir'}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg transition-transform active:scale-90"
        >
          {isBusy ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : isActive ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
