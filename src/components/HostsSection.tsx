'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Share2, Link as LinkIcon } from 'lucide-react';

// Datos de ejemplo. En la instalación real salen del panel admin.
const mockHosts = [
  {
    id: 1,
    name: 'Ana Ríos',
    role: 'Directora de la emisora',
    image: '/assets/u-1500648767791-400.webp',
    social: '@anarios',
  },
  {
    id: 2,
    name: 'Carlos Ruiz',
    role: 'Top 40 Hits',
    image: '/assets/u-1590602847861-800.webp',
    social: '@carlosruizdj',
  },
];

export default function HostsSection() {
  return (
    <section className="w-full flex flex-col gap-6 py-4">
      <div className="flex flex-col gap-1.5 items-center text-center">
        <span className="text-[0.6rem] font-bold tracking-[0.22em] uppercase text-primary opacity-80">
          Nuestro Equipo
        </span>
        <h2 className="text-2xl font-bold tracking-tight">Las Voces de la Estación</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-md mx-auto w-full">
        {mockHosts.map((host, i) => (
          <motion.div
            key={host.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
            className="group relative flex flex-col items-center gap-3"
          >
            <div className="relative w-full aspect-square rounded-full overflow-hidden border-2 border-border/50 group-hover:border-primary/50 transition-colors p-1">
              <div className="relative w-full h-full rounded-full overflow-hidden">
                <Image
                  src={host.image}
                  alt={host.name}
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                />
              </div>
              
              {/* Hover Social Overlay */}
              <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-10 backdrop-blur-sm">
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-black transition-colors">
                  <Share2 className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-black transition-colors">
                  <LinkIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="text-center">
              <h3 className="font-bold text-sm md:text-base text-foreground group-hover:text-primary transition-colors">
                {host.name}
              </h3>
              <p className="text-[0.65rem] md:text-xs text-muted font-mono mt-0.5">
                {host.role}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
