import type { ProgramSlot } from './radio-config';

export interface SlotProgress {
  slot: ProgramSlot;
  index: number;
  /** Progreso 0..1 dentro de la franja. */
  progress: number;
}

/** Parsea "06:00" → minutos desde medianoche. null si no es válido. */
function toMinutes(hhmm: string): number | null {
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Rango "06:00 - 10:00" → [start, end] en minutos. Soporta cruce de medianoche. */
function parseRange(time: string): [number, number] | null {
  const parts = time.split(/[-–—]/);
  if (parts.length !== 2) return null;
  const start = toMinutes(parts[0]);
  const end = toMinutes(parts[1]);
  if (start === null || end === null) return null;
  return [start, end];
}

/**
 * Devuelve la franja al aire según la hora `now` (minutos desde medianoche)
 * y su progreso. null si ninguna franja cubre la hora actual.
 */
export function currentSlot(schedule: ProgramSlot[], nowMinutes: number): SlotProgress | null {
  for (let i = 0; i < schedule.length; i++) {
    const range = parseRange(schedule[i].time);
    if (!range) continue;
    let [start, end] = range;
    // Cruce de medianoche: 22:00 - 02:00.
    const crosses = end <= start;
    if (crosses) end += 24 * 60;
    let now = nowMinutes;
    if (crosses && now < start) now += 24 * 60;
    if (now >= start && now < end) {
      return { slot: schedule[i], index: i, progress: (now - start) / (end - start) };
    }
  }
  return null;
}

/** Minutos desde medianoche en hora local del navegador. */
export function nowMinutes(d = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}
