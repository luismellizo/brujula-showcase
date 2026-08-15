'use client';

import PocketBase, { type RecordModel } from 'pocketbase';
import { radioConfig } from './radio-config';

/** Cliente PocketBase singleton (solo cliente — el chat es del navegador). */
let _pb: PocketBase | null = null;
export function pb(): PocketBase {
  if (!_pb) _pb = new PocketBase(radioConfig.chatBackendUrl);
  return _pb;
}

// ── Tipos de colecciones (espejo del backend) ──────────────────────────────
export interface ParticipantRecord extends RecordModel {
  name: string;
  age: number;
  phone: string;
  device_id: string;
}

export type MessageSender = 'listener' | 'station' | 'admin';
export interface MessageRecord extends RecordModel {
  device_id: string;
  name: string;
  text: string;
  sender: MessageSender;
  seen: boolean;
}

/** Oyente registrado (colección auth `chat_users`). El teléfono nunca se expone en el chat. */
export interface ChatUserRecord extends RecordModel {
  username: string;
  phone: string;
  age_range: string;
}

/** Rangos de edad disponibles en el registro (deben coincidir con el select del backend). */
export const AGE_RANGES = [
  'Menor de 18',
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55 o más',
] as const;

/** Patrocinador / anuncio de cliente (gestionado desde /admin → Publicidad). */
export interface SponsorRecord extends RecordModel {
  name: string;
  link: string;
  enabled: boolean;
  image: string;
  sort: number;
}

/** URL absoluta de un archivo subido a PocketBase (banner del sponsor). */
export function fileUrl(rec: RecordModel, field: string): string {
  const file = (rec as Record<string, unknown>)[field] as string;
  if (!file) return '';
  return pb().files.getURL(rec, file);
}

/**
 * Anuncios activos para la landing. Lee la colección `sponsors`
 * (la misma que administra el panel) ordenada por `sort`. Tolerante a fallos:
 * si la colección no existe o el backend cae, devuelve [].
 */
export async function getSponsors(): Promise<SponsorRecord[]> {
  try {
    const res = await pb()
      .collection('sponsors')
      .getList<SponsorRecord>(1, 50, { sort: 'sort', filter: 'enabled = true' });
    return res.items.filter((s) => !!s.image);
  } catch {
    return [];
  }
}

// ── device_id persistido (sello del dispositivo en cada mensaje) ────────────
const DEVICE_KEY = 'radio_device_id';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

// ── Invitado del chat (sin cuentas) ─────────────────────────────────────────
// Entrada rápida: solo nickname + rango de edad, guardados en el navegador.
// El device_id sella cada mensaje (para saber cuáles son "míos").

const NICK_KEY = 'radio_nick';
const AGE_KEY = 'radio_age';

/** Nickname con el que el oyente entró al chat. */
export function getNickname(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(NICK_KEY) || '';
}

/** Rango de edad elegido al entrar. */
export function getAgeRange(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(AGE_KEY) || '';
}

/** ¿Ya entró al chat (tiene nickname)? */
export function isJoined(): boolean {
  return !!getNickname();
}

/**
 * ¿Hay una sesión de administrador (superuser) activa en este navegador?
 * `/` y `/admin` comparten origen → comparten el authStore de PocketBase, así
 * que el sitio público sabe si quien mira es admin (para mostrarle el acceso).
 */
export function isAdmin(): boolean {
  const s = pb().authStore;
  return s.isValid && s.record?.collectionName === '_superusers';
}

/** Guarda nickname + rango de edad y deja entrar al chat. */
export function joinChat(nickname: string, ageRange: string): void {
  localStorage.setItem(NICK_KEY, nickname.trim());
  localStorage.setItem(AGE_KEY, ageRange);
  getDeviceId(); // asegura el sello de dispositivo
}

/** Sale del chat (olvida nickname para volver a elegir). */
export function leaveChat(): void {
  localStorage.removeItem(NICK_KEY);
  localStorage.removeItem(AGE_KEY);
}

/** Carga el historial completo de la sala pública (últimos mensajes primero → orden cronológico). */
export async function loadMessages(): Promise<MessageRecord[]> {
  // Trae los 200 más recientes y los devuelve en orden cronológico ascendente.
  const res = await pb()
    .collection('messages')
    .getList<MessageRecord>(1, 200, { sort: '-created' });
  return res.items.reverse();
}

/** Envía un mensaje del oyente (sender=listener, name=nickname). */
export async function sendListenerMessage(text: string): Promise<MessageRecord> {
  const device_id = getDeviceId();
  const name = getNickname() || 'Oyente';
  return pb()
    .collection('messages')
    .create<MessageRecord>({ device_id, name, text, sender: 'listener', seen: false });
}

/** Suscripción realtime a TODOS los mensajes de la sala pública. */
export async function subscribeMessages(
  onChange: (rec: MessageRecord, action: string) => void,
): Promise<() => void> {
  const unsub = await pb()
    .collection('messages')
    .subscribe<MessageRecord>('*', (e) => onChange(e.record, e.action));
  return unsub;
}
