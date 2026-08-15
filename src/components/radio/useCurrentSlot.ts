'use client';

import { useEffect, useState } from 'react';
import { radioConfig } from '@/lib/radio-config';
import { currentSlot, nowMinutes, type SlotProgress } from '@/lib/schedule';

/**
 * Franja al aire ahora mismo, recalculada cada 30s. Devuelve `undefined`
 * hasta el primer cálculo en cliente (evita mismatch de hidratación).
 */
export function useCurrentSlot(): SlotProgress | null | undefined {
  const [slot, setSlot] = useState<SlotProgress | null | undefined>(undefined);
  useEffect(() => {
    const tick = () => setSlot(currentSlot(radioConfig.schedule, nowMinutes()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return slot;
}
