import type { Metadata, Viewport } from 'next';
import { Poppins, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { radioConfig } from '@/lib/radio-config';
import { RadioProvider } from '@/components/radio/RadioProvider';
import StickyPlayer from '@/components/StickyPlayer';
import Analytics from '@/components/Analytics';
import AdminLink from '@/components/AdminLink';

const sans = Poppins({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

const mono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: `${radioConfig.stationName} · ${radioConfig.tagline}`,
  description: `Escucha ${radioConfig.stationName} en vivo. ${radioConfig.tagline}`,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: radioConfig.stationName,
  },
  icons: {
    icon: '/assets/logo.webp',
    apple: '/assets/logo.webp',
  },
};

export const viewport: Viewport = {
  themeColor: '#080808',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <RadioProvider>
          {children}
          <StickyPlayer />
        </RadioProvider>
        <Analytics />
        <AdminLink />
      </body>
    </html>
  );
}
