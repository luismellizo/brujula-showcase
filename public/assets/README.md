# /public/assets — todas las imágenes del proyecto

Fuente única de imágenes. Antes vivían en Unsplash (remotas) → descargadas aquí
para ser **offline-first**: sin dependencia externa y sin 404 si el proveedor
cae. `next.config.ts` ya no necesita `remotePatterns` para ellas.

| Archivo | Uso | Origen |
|---------|-----|--------|
| `logo.webp` | Logo de marca (player, footer, icono PWA, manifest, Media Session) | marcador genérico |
| `bg_principal.webp` | Fondo del hero | marcador genérico |
| `u-1590602847861-800.webp` | Locutor / podcast | Unsplash |
| `u-1478737270239-800.webp` | Programa Top 40 | Unsplash |
| `u-1511671782779-800.webp` | Noticia: entrevista banda | Unsplash |
| `u-1459749411175-800.webp` | Noticia: gira internacional | Unsplash |
| `u-1514525253161-600.webp` | Noticia: festival / Weekend Dance | Unsplash |
| `u-1593697821252-600.webp` | Programa: Morning Vibes | Unsplash |
| `u-1485686531765-600.webp` | Programa: Noches Acústicas | Unsplash |
| `u-1500648767791-400.webp` | Locutora | Unsplash |

> Nombre `u-<id>-<ancho>.webp` = id de la foto Unsplash original + ancho
> descargado. Se usan bajo la licencia de Unsplash.

## Nota sobre este repositorio

`logo.webp` y `bg_principal.webp` son **marcadores genéricos** generados para el
snapshot público. La instalación en producción usa los assets de marca de la
emisora, que no se publican aquí porque no son míos.

Cambiar de emisora = reemplazar esos dos archivos y editar
`src/lib/radio-config.ts`. Nada más.
