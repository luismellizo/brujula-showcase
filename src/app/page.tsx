import Link from 'next/link';
import Image from 'next/image';
import RadioPlayer from '@/components/RadioPlayer';
import SocialBar from '@/components/SocialBar';
import ScheduleSection from '@/components/ScheduleSection';
import LiveChat from '@/components/LiveChat';
import RegisterSW from '@/components/RegisterSW';
import { SponsorFeature, SponsorStrip } from '@/components/SponsorAds';
import ShareButton from '@/components/ShareButton';
import CurrentProgramCard from '@/components/CurrentProgramCard';
import NewsSection from '@/components/NewsSection';
import ProgramsSection from '@/components/ProgramsSection';
import HostsSection from '@/components/HostsSection';
import { hasChat, radioConfig } from '@/lib/radio-config';
import { getBucaramangaNews } from '@/lib/news';

export default async function Home() {
  const cfg = radioConfig;
  const news = await getBucaramangaNews();

  return (
    <>
      <RegisterSW />

      {/* ── HERO PREMIUM (con placeholder de imagen alta calidad o video) ───────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-[90svh] md:min-h-screen overflow-hidden px-4">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/bg_principal.webp"
            alt="Radio Studio Background"
            fill
            className="object-cover opacity-40 mix-blend-luminosity"
            priority
          />
          {/* Gradients to blend background with content */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
          {/* Subtle noise overlay */}
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
        </div>

        {/* Contenido Hero */}
        <div className="relative z-10 w-full max-w-lg mt-12 md:mt-0 flex flex-col items-center">
          <RadioPlayer />
        </div>

      </section>

      {/* ── CONTENIDO PRINCIPAL ──────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-12 md:gap-20 px-5 pb-32 pt-10">

        {/* Sección 1: Programación en Vivo y Publicidad (Top) */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-2/3 flex flex-col gap-6">
            <CurrentProgramCard />
            <SponsorFeature />
          </div>
          <div className="w-full md:w-1/3 flex flex-col gap-4 sticky top-6">
            <SectionHeading kicker="Comunidad" title="Chat en vivo" />
            <div className="h-[440px] md:h-[520px] chat-shell overflow-hidden">
              {hasChat ? <LiveChat /> : <div className="p-4 text-center text-muted text-sm h-full flex items-center justify-center">Chat desactivado</div>}
            </div>
          </div>
        </div>

        {/* Sección 2: Noticias y Actualidad (Bucaramanga, automáticas vía RSS) */}
        <NewsSection items={news} />

        {/* Sección 3: Programas Destacados */}
        <ProgramsSection />

        {/* Sección 4: Parrilla de Programación Completa */}
        <section className="flex flex-col gap-5">
          <SectionHeading kicker="En antena" title="Parrilla Completa" />
          <div className="glass-card p-4 md:p-6 rounded-3xl border border-border/50">
            <ScheduleSection />
          </div>
        </section>

        {/* Sección 5: Nuestro Equipo */}
        <HostsSection />

        {/* Redes sociales y Compartir */}
        <section className="flex flex-col items-center gap-6 py-10 border-t border-border/30">
          <SectionHeading kicker="Conéctate" title="Síguenos en Redes" />
          <SocialBar />
          <ShareButton />
        </section>

        {/* Tira de patrocinadores */}
        <SponsorStrip />

        {/* Footer */}
        <footer className="mt-auto flex flex-col items-center gap-4 pt-10 pb-6 text-center border-t border-border/10">
          <Image
            src={cfg.logoAsset}
            alt={cfg.stationName}
            width={120}
            height={60}
            className="h-auto w-24 object-contain opacity-50 grayscale hover:grayscale-0 transition-all duration-300"
          />
          <p className="text-[0.65rem] tracking-[0.2em] uppercase font-medium text-muted">
            {cfg.tagline}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Link
              href="/admin"
              className="px-4 py-1.5 rounded-full border border-border/50 text-[0.7rem] font-medium text-muted transition-all hover:border-primary/50 hover:text-primary hover:bg-primary/5"
            >
              Acceso Staff
            </Link>
          </div>
          <span className="text-[0.6rem] tracking-wider text-muted/50 mt-4">
            © {new Date().getFullYear()} · {cfg.stationName} · Diseñado para el mundo
          </span>
        </footer>
      </main>
    </>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="flex flex-col gap-1.5 mb-2">
      <span className="text-[0.6rem] font-bold tracking-[0.22em] uppercase text-primary/80">
        {kicker}
      </span>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h2>
    </div>
  );
}
