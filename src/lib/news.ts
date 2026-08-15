/**
 * Noticias reales de Bucaramanga desde el RSS de Vanguardia (diario local),
 * que SÍ trae imagen por nota. Server-only, cacheado 30 min (ISR) → se
 * refresca solo a lo largo del día sin API key.
 */

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  category: string;
  image: string;
  /** ISO date string. */
  date: string;
}

const FEED = 'https://www.vanguardia.com/arc/outboundfeeds/rss/?outputType=xml';

/** Pistas de que la nota es del Área Metropolitana de Bucaramanga / Santander. */
const LOCAL = /area-metropolitana|bucaramanga|santander|floridablanca|giron|girón|piedecuesta|barrancabermeja/i;

const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
  '&#34;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
};

function decode(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? e);
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
  if (!m) return '';
  return decode(m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim());
}

function firstImage(block: string): string {
  const enc = block.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i)?.[1] ?? block;
  const m = enc.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : '';
}

export async function getBucaramangaNews(limit = 6): Promise<NewsItem[]> {
  try {
    const res = await fetch(FEED, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RadioWeb/1.0)' },
      next: { revalidate: 1800 }, // 30 min
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const all: NewsItem[] = [];
    for (const b of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const block = b[1];
      const link = tag(block, 'link');
      const category = tag(block, 'category');
      const image = firstImage(block);
      // Solo notas con imagen; fuera columnas de opinión.
      if (!image || /\/opinion\//i.test(link)) continue;
      const date = tag(block, 'pubDate');
      all.push({
        title: tag(block, 'title'),
        link,
        source: 'Vanguardia',
        category: category || 'Actualidad',
        image,
        date: date ? new Date(date).toISOString() : '',
      });
    }

    // Locales primero (Bucaramanga / Santander), luego el resto; conserva recencia del feed.
    const local = all.filter((n) => LOCAL.test(n.link) || LOCAL.test(n.category));
    const rest = all.filter((n) => !local.includes(n));
    return [...local, ...rest].slice(0, limit);
  } catch {
    return [];
  }
}
