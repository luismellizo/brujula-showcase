'use client';

import { useEffect, useRef, useState } from 'react';
import { getSponsors, fileUrl, type SponsorRecord } from '@/lib/pocketbase';
import { radioConfig, whatsappLink } from '@/lib/radio-config';

/** Estado compartido: cargamos los sponsors una vez por montaje. */
function useSponsors() {
  const [items, setItems] = useState<SponsorRecord[] | null>(null);
  useEffect(() => {
    let alive = true;
    getSponsors().then((s) => alive && setItems(s));
    return () => {
      alive = false;
    };
  }, []);
  return items;
}

/* ───────────────────────────────────────────────────────────────
 * Banner destacado (bajo el player). Carrusel auto-rotativo.
 * Si no hay anuncios, muestra un slot "Tu marca aquí" (gancho de venta).
 * ─────────────────────────────────────────────────────────────── */
export function SponsorFeature() {
  const items = useSponsors();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!items || items.length < 2) return;
    const id = setInterval(() => setI((p) => (p + 1) % items.length), 5500);
    return () => clearInterval(id);
  }, [items]);

  // Cargando: reservamos el espacio sin parpadeo.
  if (items === null) {
    return <div className="ad-feature-skeleton" aria-hidden />;
  }

  // Sin anuncios → slot disponible. Lleva a WhatsApp con mensaje de anunciante.
  if (items.length === 0) {
    const s = radioConfig.social;
    const href = s.whatsappNumber
      ? whatsappLink({
          ...s,
          whatsappMessage: `Hola, me interesa el espacio publicitario en ${radioConfig.stationName}. ¿Me dan info?`,
        })
      : '#';
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="ad-slot-empty group">
        <span className="ad-chip">ESPACIO PUBLICITARIO</span>
        <span className="text-lg font-extrabold">Tu marca aquí</span>
        <span className="text-sm text-muted">Llega a miles de oyentes · Anúnciate con nosotros</span>
      </a>
    );
  }

  const active = items[i];
  return (
    <section className="w-full" aria-label="Patrocinadores">
      <SectionLabel>Con el respaldo de</SectionLabel>
      <div className="ad-feature">
        {items.map((s, idx) => (
          <Banner key={s.id} s={s} active={idx === i} />
        ))}
        {items.length > 1 && (
          <div className="ad-dots">
            {items.map((s, idx) => (
              <button
                key={s.id}
                aria-label={`Ver ${s.name}`}
                onClick={() => setI(idx)}
                className={idx === i ? 'ad-dot active' : 'ad-dot'}
              />
            ))}
          </div>
        )}
        <span className="ad-chip ad-chip--corner">{active.name}</span>
      </div>
    </section>
  );
}

function Banner({ s, active }: { s: SponsorRecord; active: boolean }) {
  const img = fileUrl(s, 'image');
  const inner = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={img} alt={s.name} loading="lazy" className="h-full w-full object-cover" />
  );
  return (
    <div className="ad-slide" data-active={active} aria-hidden={!active}>
      {s.link ? (
        <a href={s.link} target="_blank" rel="noopener noreferrer" tabIndex={active ? 0 : -1}>
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
 * Tira compacta (footer). Logos en marquee. Se oculta si no hay.
 * ─────────────────────────────────────────────────────────────── */
export function SponsorStrip() {
  const items = useSponsors();
  const trackRef = useRef<HTMLDivElement>(null);
  if (!items || items.length === 0) return null;

  // Duplicamos para marquee continuo si hay varios.
  const loop = items.length > 2 ? [...items, ...items] : items;

  return (
    <section className="w-full" aria-label="Nuestros patrocinadores">
      <SectionLabel center>Patrocinadores</SectionLabel>
      <div className="ad-strip">
        <div ref={trackRef} className="ad-strip-track" data-marquee={items.length > 2}>
          {loop.map((s, idx) => {
            const img = fileUrl(s, 'image');
            const content = (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={s.name} loading="lazy" className="h-12 w-auto object-contain" />
            );
            return (
              <span key={`${s.id}-${idx}`} className="ad-strip-item" title={s.name}>
                {s.link ? (
                  <a href={s.link} target="_blank" rel="noopener noreferrer">
                    {content}
                  </a>
                ) : (
                  content
                )}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SectionLabel({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className={`section-label ${center ? 'justify-center' : ''}`}>
      <span className="section-label-line" />
      <span>{children}</span>
      <span className="section-label-line" />
    </div>
  );
}
