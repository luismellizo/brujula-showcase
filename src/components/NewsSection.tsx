'use client';
import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import type { NewsItem } from '@/lib/news';

/** Portada local de respaldo si una nota viniera sin imagen. */
const FALLBACK_COVER = '/assets/u-1514525253161-600.webp';

/** Fallback si el feed no responde (build sin red o medio caído). */
const FALLBACK: NewsItem[] = [
  {
    title: 'Mantente al día con lo que pasa en Bucaramanga',
    link: '#',
    source: 'Radio Demo',
    category: 'Actualidad',
    image: FALLBACK_COVER,
    date: '',
  },
];

function relativeDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  if (isNaN(d)) return '';
  const min = Math.round((Date.now() - d) / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const days = Math.round(h / 24);
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

export default function NewsSection({ items }: { items?: NewsItem[] }) {
  const news = items && items.length ? items : FALLBACK;

  return (
    <section className="w-full flex flex-col gap-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.6rem] font-bold tracking-[0.22em] uppercase text-primary opacity-80">
            Actualidad · Bucaramanga
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Noticias de hoy</h2>
        </div>
        <a
          href="https://news.google.com/search?q=Bucaramanga&hl=es-419&gl=CO"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-medium text-muted hover:text-primary transition-colors group"
        >
          Ver todas
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {news.map((n, i) => (
          <motion.a
            key={n.link + i}
            href={n.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
            className={`group relative block overflow-hidden rounded-2xl glass-card cursor-pointer border border-border/50 hover:border-primary/40 transition-colors ${
              i === 0 ? 'md:col-span-2 aspect-[2/1] md:aspect-[2.5/1]' : 'aspect-square md:aspect-[4/3]'
            }`}
          >
            <Image
              src={n.image || FALLBACK_COVER}
              alt={n.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized={!!n.image && !n.image.startsWith('/')}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/10" />

            <div className="absolute inset-0 p-5 flex flex-col justify-end">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {n.category && (
                  <span className="px-2.5 py-1 text-[0.6rem] font-bold tracking-wider uppercase bg-primary text-black rounded-sm">
                    {n.category}
                  </span>
                )}
                {n.source && (
                  <span className="text-[0.7rem] font-medium text-white/60">{n.source}</span>
                )}
                {relativeDate(n.date) && (
                  <div className="flex items-center gap-1 text-[0.7rem] text-white/70">
                    <Clock className="w-3 h-3" />
                    {relativeDate(n.date)}
                  </div>
                )}
              </div>
              <h3 className={`font-bold text-white leading-tight ${i === 0 ? 'text-xl md:text-3xl' : 'text-base md:text-lg'}`}>
                {n.title}
              </h3>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
