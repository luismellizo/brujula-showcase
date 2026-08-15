'use client';

import Image from 'next/image';
import { radioConfig } from '@/lib/radio-config';
import { useRadio, type RadioState } from '@/components/radio/RadioProvider';
import Visualizer from '@/components/radio/Visualizer';
import { useCurrentSlot } from '@/components/radio/useCurrentSlot';
import { motion, AnimatePresence } from 'framer-motion';

export default function RadioPlayer() {
  const cfg = radioConfig;
  const { state, isActive, isBusy, toggle } = useRadio();
  const nowSlot = useCurrentSlot();

  return (
    <div className="flex w-full flex-col items-center gap-6 relative z-10">
      {/* Logo con halo */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-[clamp(200px,62vw,360px)]"
      >
        <span className="pointer-events-none absolute inset-0 -z-10 scale-150 rounded-full bg-primary/20 blur-[80px]" />
        <Image
          src={cfg.logoAsset}
          alt={cfg.stationName}
          width={720}
          height={400}
          priority
          className="h-auto w-full object-contain drop-shadow-[0_0_30px_rgba(0,212,255,0.4)]"
        />
      </motion.div>

      {!cfg.logoIncludesName && (
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white drop-shadow-md">{cfg.stationName}</h1>
        </div>
      )}

      {/* AL AIRE AHORA — programa actual */}
      <div className="min-h-[3rem] mt-2">
        <AnimatePresence mode="wait">
          {nowSlot ? (
            <motion.div 
              key="playing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-red-500">
                  Al aire
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-white tracking-tight drop-shadow-md">{nowSlot.slot.name}</span>
                {nowSlot.slot.host && <span className="text-sm font-medium text-white/70">con {nowSlot.slot.host}</span>}
              </div>
            </motion.div>
          ) : (
            <motion.p 
              key="tagline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm font-medium text-white/60 tracking-wide"
            >
              {cfg.tagline}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Botón play + ondas + visualizador */}
      <div className="relative flex flex-col items-center gap-6 mt-4">
        <div className="relative grid place-items-center">
          {isActive && (
            <>
              <span className="pointer-events-none absolute h-36 w-36 rounded-full border border-primary/40 [animation:pulse-ring_2s_cubic-bezier(0.215,0.61,0.355,1)_infinite]" />
              <span className="pointer-events-none absolute h-36 w-36 rounded-full border border-primary/20 [animation:pulse-ring_2s_cubic-bezier(0.215,0.61,0.355,1)_infinite_0.6s]" />
              <span className="pointer-events-none absolute h-36 w-36 rounded-full border border-primary/10 [animation:pulse-ring_2s_cubic-bezier(0.215,0.61,0.355,1)_infinite_1.2s]" />
            </>
          )}
          
          <motion.button
            type="button"
            onClick={toggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={isActive ? 'Pausar' : 'Reproducir'}
            className={`relative grid h-20 w-20 md:h-24 md:w-24 place-items-center rounded-full transition-colors duration-300 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 ${
              isActive 
                ? 'bg-white text-black hover:bg-gray-200' 
                : 'bg-primary text-black hover:bg-[#00bfff]'
            }`}
          >
            {isBusy ? (
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-black/20 border-t-black" />
            ) : isActive ? (
              <PauseIcon />
            ) : (
              <PlayIcon />
            )}
          </motion.button>
        </div>

        {/* Indicador + ecualizador centrado y responsivo */}
        <div className="flex w-full flex-col items-center gap-4">
          <LiveIndicator state={state} />
          <div
            className={`mx-auto h-12 w-[clamp(220px,80vw,360px)] sm:h-16 transition-opacity duration-500 ${
              isActive ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <Visualizer active={isActive} />
          </div>
        </div>

        <div className="absolute -bottom-8 h-5 text-center text-xs font-medium text-red-400 w-full px-2 truncate">
          <AnimatePresence>
            {state === 'error' && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                No se pudo conectar. Reintenta.
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function LiveIndicator({ state }: { state: RadioState }) {
  const live = state === 'live';
  const label =
    state === 'live'
      ? 'ONLINE'
      : state === 'connecting'
        ? 'CONECTANDO…'
        : state === 'reconnecting'
          ? 'RECONECTANDO…'
          : 'OFFLINE';
  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-bold tracking-widest uppercase transition-colors ${
      live ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-white/5 text-white/50 border border-white/10'
    }`}>
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: live ? 'currentColor' : 'currentColor',
          animation: live ? 'blink-live 1.4s infinite' : undefined,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="ml-1 md:w-10 md:h-10">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="md:w-9 md:h-9">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}
