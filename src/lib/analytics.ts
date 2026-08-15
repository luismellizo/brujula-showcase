'use client';

/**
 * Analítica de oyentes (alimenta el panel /admin → Reportes).
 *  - `presence`: fila por dispositivo (live now, país, ciudad, en chat).
 *  - `events`:   app_open, session_end, clicks (play/pause/redes/chat), chat.
 *
 * No requiere auth: las colecciones tienen create/update públicos.
 * El id de presence se deriva del device_id (15 chars) para poder hacer
 * update sin necesidad de leer (list/view de presence es solo-admin).
 */

import { pb, getDeviceId } from './pocketbase';
import { radioConfig } from './radio-config';

const APP_VERSION = '2.0-web';
const GEO_KEY = 'radio_geo';
const HEARTBEAT_MS = 30_000;

interface Geo {
  country: string;
  city: string;
}

let started = false;
let inChat = false;
let geo: Geo = { country: '', city: '' };
let sessionStart = 0;
let hbTimer: ReturnType<typeof setInterval> | undefined;

/** id de presence determinístico (15 chars [a-z0-9]) a partir del device. */
function presenceId(): string {
  const d = getDeviceId().replace(/[^a-z0-9]/gi, '').toLowerCase();
  return (d + 'pad0000000000000').slice(0, 15);
}

/** Geolocalización aproximada por IP (cacheada ~1 día). gratis, https. */
async function resolveGeo(): Promise<Geo> {
  try {
    const raw = localStorage.getItem(GEO_KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (c.t && Date.now() - c.t < 86_400_000) return { country: c.country, city: c.city };
    }
  } catch {}
  try {
    const r = await fetch('https://get.geojs.io/v1/ip/geo.json');
    const j = await r.json();
    const g: Geo = { country: (j.country_code || '').toUpperCase(), city: j.city || '' };
    localStorage.setItem(GEO_KEY, JSON.stringify({ ...g, t: Date.now() }));
    return g;
  } catch {
    return { country: '', city: '' };
  }
}

/** Registra un evento (clicks, chat, aperturas). */
export function track(type: string, name: string, extra: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  pb()
    .collection('events')
    .create({
      device_id: getDeviceId(),
      type,
      name,
      country: geo.country,
      city: geo.city,
      platform: 'web',
      app_version: APP_VERSION,
      ...extra,
    })
    .catch(() => {});
}

/** Crea/actualiza la presencia del dispositivo (live now + en chat). */
async function heartbeat(): Promise<void> {
  const data = {
    device_id: getDeviceId(),
    country: geo.country,
    city: geo.city,
    platform: 'web',
    in_chat: inChat,
  };
  const id = presenceId();
  try {
    await pb().collection('presence').update(id, data);
  } catch {
    try {
      await pb().collection('presence').create({ id, ...data });
    } catch {}
  }
}

/** Marca si el oyente está en el chat (refleja en presencia al instante). */
export function setInChat(v: boolean): void {
  inChat = v;
  heartbeat();
}

/** Cierra la sesión con su duración (vía sendBeacon para que llegue al salir). */
function endSession(): void {
  if (!sessionStart) return;
  const duration = Math.round((Date.now() - sessionStart) / 1000);
  sessionStart = 0;
  try {
    const body = JSON.stringify({
      device_id: getDeviceId(),
      type: 'session',
      name: 'session_end',
      duration,
      country: geo.country,
      city: geo.city,
      platform: 'web',
      app_version: APP_VERSION,
    });
    const url = `${radioConfig.chatBackendUrl}/api/collections/events/records`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    }
  } catch {}
}

/** Arranca la analítica (idempotente). Llamar una vez al montar la app. */
export async function initAnalytics(): Promise<void> {
  if (started || typeof window === 'undefined') return;
  started = true;
  sessionStart = Date.now();

  geo = await resolveGeo();
  track('session', 'app_open');
  heartbeat();

  hbTimer = setInterval(heartbeat, HEARTBEAT_MS);

  // Pausa/retoma el heartbeat con la visibilidad de la pestaña.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') heartbeat();
  });

  // Cierre de sesión al salir / ocultar la pestaña.
  const close = () => endSession();
  window.addEventListener('pagehide', close);
  window.addEventListener('beforeunload', close);
}

export function stopAnalytics(): void {
  if (hbTimer) clearInterval(hbTimer);
}
