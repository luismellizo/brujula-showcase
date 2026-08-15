/**
 * Configuración central y única de la emisora (port de radio_config.dart).
 *
 * ÚNICA fuente de verdad para personalizar la web. Para lanzar otra emisora:
 * cambiar solo los valores de `radioConfig`. Nada hardcodeado en la UI.
 */

export interface BrandTheme {
  /** Color primario de marca. */
  primary: string;
  /** Color de acento. */
  secondary: string;
  /** Color del indicador "EN VIVO". */
  onLive: string;
  /** Fondo base (azul noche). */
  background: string;
}

export interface SocialLinks {
  /** Número WhatsApp internacional sin '+' (ej. 573001234567). */
  whatsappNumber?: string;
  whatsappMessage?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
}

export interface ProgramSlot {
  name: string;
  time: string;
  host?: string;
}

export interface RadioConfig {
  /** Nombre de la emisora. */
  stationName: string;
  /** Lema / descripción corta. */
  tagline: string;
  /** URL del stream de audio en vivo (puede ser HTTP — se proxea a HTTPS). */
  streamUrl: string;
  /** Ruta del logo dentro de /public. */
  logoAsset: string;
  /** Si el logo ya incluye el nombre/lema, la UI no lo repite como texto. */
  logoIncludesName: boolean;
  brand: BrandTheme;
  social: SocialLinks;
  schedule: ProgramSlot[];
  privacyPolicyUrl?: string;
  /** Backend PocketBase (chat + sorteos + app_config). */
  chatBackendUrl: string;
  /** Mensaje incentivo de sorteo en el gate de registro del chat. */
  chatPrizeMessage: string;
}

/**
 * ───────────────────────────────────────────────────────────────
 * INSTANCIA ACTIVA — editar SOLO esto para cambiar de emisora.
 * ───────────────────────────────────────────────────────────────
 */
export const radioConfig: RadioConfig = {
  // Emisora de demostración. La instalación real de este código está en
  // producción con otra configuración: la marca, el stream y las redes son lo
  // ÚNICO que cambia entre una emisora y otra. Ese es justamente el punto.
  stationName: 'Radio Demo',
  tagline: '100.0 FM · Tu música, todo el día',
  // Stream público de prueba de SomaFM (Groove Salad). Es HTTP a propósito:
  // ejercita el proxy `/api/stream`, que existe porque el navegador bloquea
  // audio HTTP en una página HTTPS. Ver src/app/api/stream/route.ts.
  streamUrl: 'http://ice1.somafm.com/groovesalad-128-mp3',
  logoAsset: '/assets/logo.webp?v=2',
  logoIncludesName: false,
  brand: {
    primary: '#3B82F6', // azul señal
    secondary: '#FACC15', // amarillo
    onLive: '#EF4444', // rojo en vivo
    background: '#0A1530', // azul noche
  },
  social: {
    whatsappNumber: '',
    whatsappMessage: '¡Hola! Estoy escuchando la emisora 🎧',
    facebookUrl: '',
    instagramUrl: '',
    websiteUrl: '',
  },
  schedule: [
    { name: 'Amanecer Musical', host: 'Equipo FM', time: '06:00 - 10:00' },
    { name: 'La Mañana', host: 'Equipo FM', time: '10:00 - 13:00' },
    { name: 'Tarde en Vivo', host: 'Equipo FM', time: '13:00 - 18:00' },
    { name: 'Noche FM', host: 'Equipo FM', time: '18:00 - 22:00' },
  ],
  privacyPolicyUrl: '/privacidad',
  // Backend de chat/analítica. Sale del entorno, NO del código: la URL apunta al
  // servidor de origen y no tiene por qué vivir en el repositorio.
  // Se define en `NEXT_PUBLIC_PB_URL` (ver .env.example). Sin ella, `hasChat`
  // queda en false y la UI oculta el chat en vez de romperse.
  chatBackendUrl: process.env.NEXT_PUBLIC_PB_URL ?? '',
  chatPrizeMessage:
    'Regístrate y participa en nuestros sorteos. Solo lo usamos para contactarte si ganas.',
};

// ── Helpers de presencia de enlaces ────────────────────────────────────────
export const hasWhatsapp = (s: SocialLinks) => !!s.whatsappNumber?.trim();
export const hasFacebook = (s: SocialLinks) => !!s.facebookUrl?.trim();
export const hasInstagram = (s: SocialLinks) => !!s.instagramUrl?.trim();
export const hasTiktok = (s: SocialLinks) => !!s.tiktokUrl?.trim();
export const hasYoutube = (s: SocialLinks) => !!s.youtubeUrl?.trim();
export const hasWebsite = (s: SocialLinks) => !!s.websiteUrl?.trim();

/** Devuelve true si hay backend de chat configurado. */
export const hasChat = !!radioConfig.chatBackendUrl?.trim();

/** Construye el enlace wa.me a partir del número y mensaje. */
export function whatsappLink(s: SocialLinks): string {
  const num = (s.whatsappNumber ?? '').replace(/\D/g, '');
  const msg = encodeURIComponent(s.whatsappMessage ?? '');
  return `https://wa.me/${num}${msg ? `?text=${msg}` : ''}`;
}
