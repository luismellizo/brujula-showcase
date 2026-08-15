import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Build standalone para imagen Docker mínima (deploy Coolify).
  output: 'standalone',
  // Next 16: query string en imágenes locales requiere localPatterns.
  // Permite el cache-bust ?v=N del logo.
  images: {
    localPatterns: [
      { pathname: '/**', search: '' }, // assets locales sin query (todo en /assets)
      { pathname: '/assets/logo.webp', search: '?v=2' }, // cache-bust del logo
    ],
    // Imágenes de la UI viven en /public/assets. Las de noticias vienen del
    // diario Vanguardia (RSS) y son remotas.
    remotePatterns: [
      { protocol: 'https', hostname: 'www.vanguardia.com' },
    ],
  },
  async rewrites() {
    return [
      // El panel admin (vanilla JS) vive en /public/admin servido tal cual.
      { source: '/admin', destination: '/admin/index.html' },
    ];
  },
  async headers() {
    // El SW y el manifest NUNCA se cachean en HTTP → el navegador siempre
    // revalida y detecta una versión nueva al instante tras cada deploy.
    const noCache = [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }];
    return [
      { source: '/sw.js', headers: [...noCache, { key: 'Service-Worker-Allowed', value: '/' }] },
      { source: '/manifest.json', headers: noCache },
    ];
  },
};

export default nextConfig;
