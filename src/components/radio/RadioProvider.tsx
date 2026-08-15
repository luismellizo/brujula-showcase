'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { radioConfig } from '@/lib/radio-config';
import { track } from '@/lib/analytics';

/** Estado de alto nivel (espejo de RadioState del Flutter). */
export type RadioState = 'stopped' | 'connecting' | 'live' | 'reconnecting' | 'error';

interface RadioContextValue {
  state: RadioState;
  isActive: boolean;
  isBusy: boolean;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  /** Elemento <audio> real, para conectar un visualizador (Web Audio). */
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** Nodo de análisis FFT (null si el navegador no soporta Web Audio). */
  analyser: AnalyserNode | null;
}

const STREAM_SRC = '/api/stream';
const MAX_BACKOFF = 30; // segundos (igual que el handler Flutter)

/**
 * iOS suspende el AudioContext al pasar a segundo plano / bloquear pantalla,
 * y enrutar el <audio> por Web Audio (createMediaElementSource) hace que el
 * sonido SOLO salga por ese grafo → en iOS el audio se CORTA en background.
 * Por eso en iOS NO construimos el grafo: el <audio> suena solo (sigue en
 * segundo plano y en pantalla de bloqueo). El visualizador cae a animación CSS.
 */
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS se reporta como Mac con pantalla táctil
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1)
  );
}

const RadioContext = createContext<RadioContextValue | null>(null);

/**
 * Fuente única del reproductor. Mantiene UN solo <audio> y toda la lógica de
 * reconexión, compartida por el hero y la barra inferior sticky.
 */
export function RadioProvider({ children }: { children: ReactNode }) {
  const cfg = radioConfig;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<RadioState>('stopped');

  const wantPlay = useRef(false);
  const retry = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Grafo Web Audio (visualizador real) ──────────────────────────────────
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  /** Crea el grafo una sola vez (gesto de usuario). Tolerante a fallos. */
  const ensureAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    // iOS: jamás enrutar por Web Audio → preserva reproducción en segundo plano.
    if (isIOS()) return;
    if (!audio || sourceRef.current) {
      audioCtxRef.current?.resume().catch(() => {});
      return;
    }
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const src = ctx.createMediaElementSource(audio);
      const an = ctx.createAnalyser();
      an.fftSize = 64;
      an.smoothingTimeConstant = 0.78;
      src.connect(an);
      an.connect(ctx.destination); // mantiene el sonido
      audioCtxRef.current = ctx;
      sourceRef.current = src;
      setAnalyser(an);
      ctx.resume().catch(() => {});
    } catch {
      // Sin Web Audio → el visualizador cae a animación CSS.
    }
  }, []);

  const clearReconnect = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  };

  const startPlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.src = `${STREAM_SRC}?t=${Date.now()}`;
      audio.load();
      await audio.play();
      retry.current = 0;
    } catch {
      scheduleReconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!wantPlay.current || reconnectTimer.current) return;
    setState('reconnecting');
    const seconds = Math.min(2 ** retry.current, MAX_BACKOFF);
    retry.current += 1;
    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;
      if (!wantPlay.current) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        scheduleReconnect();
        return;
      }
      startPlayback();
    }, seconds * 1000);
  }, [startPlayback]);

  const play = useCallback(() => {
    wantPlay.current = true;
    retry.current = 0;
    setState('connecting');
    ensureAudioGraph(); // dentro del gesto de usuario
    startPlayback();
    track('click', 'play');
  }, [startPlayback, ensureAudioGraph]);

  const pause = useCallback(() => {
    wantPlay.current = false;
    clearReconnect();
    audioRef.current?.pause();
    setState('stopped');
    track('click', 'pause');
  }, []);

  const toggle = useCallback(() => {
    if (wantPlay.current) pause();
    else play();
  }, [play, pause]);

  // ── Listeners del <audio> + red ──────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlaying = () => {
      retry.current = 0;
      setState('live');
    };
    const onWaiting = () => {
      if (wantPlay.current) setState((s) => (s === 'reconnecting' ? s : 'connecting'));
    };
    const onError = () => {
      if (wantPlay.current) scheduleReconnect();
      else setState('error');
    };
    const onEnded = () => {
      if (wantPlay.current) scheduleReconnect();
    };
    const onOnline = () => {
      if (wantPlay.current && audio.paused) scheduleReconnect();
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('stalled', onWaiting);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);
    window.addEventListener('online', onOnline);

    return () => {
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('stalled', onWaiting);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
      window.removeEventListener('online', onOnline);
      clearReconnect();
    };
  }, [scheduleReconnect]);

  // ── Media Session API (controles de bloqueo / notificación) ──────────────
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    // URL absoluta: iOS/Android necesitan ruta completa para la carátula del bloqueo.
    const origin = window.location.origin;
    const art = `${origin}/assets/logo.webp`;
    const artwork = ['96x96', '128x128', '192x192', '256x256', '384x384', '512x512'].map(
      (sizes) => ({ src: art, sizes, type: 'image/webp' }),
    );
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: cfg.stationName,
        artist: cfg.tagline,
        album: 'EN VIVO',
        artwork,
      });
    } catch {
      /* MediaMetadata no soportado */
    }
    const set = (a: MediaSessionAction, fn: (() => void) | null) => {
      try {
        navigator.mediaSession.setActionHandler(a, fn);
      } catch {
        /* acción no soportada en este navegador */
      }
    };
    set('play', play);
    set('pause', pause);
    set('stop', pause);
    // Live: sin retroceso/avance/seek (los desactivamos para una UI limpia).
    set('previoustrack', null);
    set('nexttrack', null);
    set('seekbackward', null);
    set('seekforward', null);
  }, [cfg.stationName, cfg.tagline, play, pause]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = state === 'live' ? 'playing' : 'paused';
  }, [state]);

  const value: RadioContextValue = {
    state,
    isActive: state === 'live',
    isBusy: state === 'connecting' || state === 'reconnecting',
    toggle,
    play,
    pause,
    audioRef,
    analyser,
  };

  return (
    <RadioContext.Provider value={value}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} preload="none" />
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio(): RadioContextValue {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error('useRadio debe usarse dentro de <RadioProvider>');
  return ctx;
}
