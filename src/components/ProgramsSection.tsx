'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Calendar, Headphones } from 'lucide-react';

const mockPrograms = [
  {
    id: 1,
    title: 'Morning Vibes',
    host: 'Javi Báez',
    time: '06:00 - 09:00',
    days: 'Lun - Vie',
    image: '/assets/u-1593697821252-600.webp',
    color: 'from-blue-500/20 to-cyan-500/0',
  },
  {
    id: 2,
    title: 'Top 40 Hits',
    host: 'Javi Báez',
    time: '12:00 - 15:00',
    days: 'Lun - Vie',
    image: '/assets/u-1478737270239-800.webp',
    color: 'from-purple-500/20 to-pink-500/0',
  },
  {
    id: 3,
    title: 'Noches Acústicas',
    host: 'Javi Báez',
    time: '20:00 - 23:00',
    days: 'Mar - Jue',
    image: '/assets/u-1485686531765-600.webp',
    color: 'from-orange-500/20 to-red-500/0',
  },
  {
    id: 4,
    title: 'Weekend Dance',
    host: 'Javi Báez',
    time: '22:00 - 02:00',
    days: 'Sábados',
    image: '/assets/u-1514525253161-600.webp',
    color: 'from-green-500/20 to-emerald-500/0',
  }
];

export default function ProgramsSection() {
  return (
    <section className="w-full flex flex-col gap-6 py-4">
      <div className="flex flex-col gap-1.5 text-center items-center mb-4">
        <span className="text-[0.6rem] font-bold tracking-[0.22em] uppercase text-primary opacity-80">
          Nuestra Oferta
        </span>
        <h2 className="text-2xl font-bold tracking-tight">Programas Destacados</h2>
        <p className="text-sm text-muted max-w-sm mt-2">
          Descubre los shows que marcan tendencia en nuestra emisora.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mockPrograms.map((program, i) => (
          <motion.div
            key={program.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="group relative flex items-center p-3 gap-4 rounded-2xl glass-card border border-border/50 hover:border-primary/30 transition-all hover:-translate-y-1 overflow-hidden"
          >
            {/* Subtle Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${program.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

            {/* Image */}
            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
              <Image
                src={program.image}
                alt={program.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            {/* Info */}
            <div className="flex flex-col flex-1 min-w-0 z-10">
              <h3 className="font-bold text-lg truncate text-foreground group-hover:text-primary transition-colors">
                {program.title}
              </h3>
              <p className="text-sm text-muted truncate">
                con {program.host}
              </p>
              
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-[0.65rem] text-muted font-medium bg-surface-2 px-2 py-0.5 rounded-md">
                  <Calendar className="w-3 h-3 text-primary" />
                  {program.days}
                </div>
                <div className="flex items-center gap-1 text-[0.65rem] text-muted font-medium bg-surface-2 px-2 py-0.5 rounded-md">
                  <Headphones className="w-3 h-3 text-primary" />
                  {program.time}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
