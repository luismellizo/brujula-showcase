import { NextResponse } from 'next/server';

/**
 * Config del panel admin, servida como JavaScript.
 *
 * `public/admin/` es un panel vanilla JS servido como archivo estático: no pasa
 * por el bundler de Next, así que no puede leer `process.env`. Antes la URL del
 * backend estaba escrita a mano en `app.js`, lo que metía la dirección del
 * servidor de origen dentro del repositorio.
 *
 * Este route la entrega en runtime. `index.html` lo carga como script clásico
 * ANTES de `app.js`, y los scripts clásicos se ejecutan en orden, así que
 * `window.__PB_URL__` ya está definido cuando `app.js` arranca.
 *
 * Se sirve sin caché: si el backend cambia de dirección, basta con redesplegar.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  const pbUrl = process.env.NEXT_PUBLIC_PB_URL ?? '';

  // JSON.stringify escapa comillas y cierres de etiqueta: la variable viene del
  // entorno, pero se inyecta en un contexto de script y no se asume confiable.
  const body = `window.__PB_URL__=${JSON.stringify(pbUrl)};`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
