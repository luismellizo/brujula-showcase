'use client';

import { useEffect, useRef } from 'react';
import { useRadio } from '@/components/radio/RadioProvider';

/**
 * Ecualizador. Si hay analizador Web Audio + reproducción, dibuja el espectro
 * REAL del stream (rAF + refs DOM). Si no, cae a animación CSS.
 */
export default function Visualizer({ active, bars = 40 }: { active: boolean; bars?: number }) {
  const { analyser } = useRadio();
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const real = !!analyser && active;

  useEffect(() => {
    if (!analyser || !active) {
      // Modo CSS: limpiamos cualquier alto inline previo.
      refs.current.forEach((el) => el && (el.style.height = ''));
      return;
    }
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    const draw = () => {
      analyser.getByteFrequencyData(data);
      const n = refs.current.length;
      // Usamos las primeras ~2/3 de bandas (las altas suelen ir vacías).
      const usable = Math.max(1, Math.floor(data.length * 0.7));
      for (let i = 0; i < n; i++) {
        const el = refs.current[i];
        if (!el) continue;
        const idx = Math.floor((i / n) * usable);
        const v = data[idx] / 255; // 0..1
        const pct = 12 + v * v * 88; // curva: realza picos
        el.style.height = `${pct}%`;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [analyser, active]);

  return (
    <div className={`viz ${active ? 'viz--live' : ''} ${real ? 'viz--data' : ''}`} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="viz-bar"
          style={{
            // Onda viajera: el desfase sigue una curva senoidal a lo ancho.
            animationDelay: `${(Math.sin((i / bars) * Math.PI * 2) * 0.5 + 0.5) * 0.9}s`,
            animationDuration: `${0.9 + (i % 4) * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}
