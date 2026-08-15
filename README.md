<div align="center">

# Radio FM — Web + PWA

### An entire radio station as an installable web app

**Live stream, public real-time chat, automatic local news, an admin panel and
listener analytics.** It replaced the station's native Android app.

[![Live](https://img.shields.io/badge/▶_Live-labrujulafm.com-3B82F6?style=for-the-badge)](https://labrujulafm.com)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![PocketBase](https://img.shields.io/badge/PocketBase-realtime-B8DBE4?style=flat-square&logo=pocketbase&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?style=flat-square&logo=pwa&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-standalone-2496ED?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-View_only-DC2626?style=flat-square)

</div>

---

> ### ⚠️ About this repository
>
> A portfolio snapshot of the code I built for **La Brújula 93.4 FM**
> ([labrujulafm.com](https://labrujulafm.com)), published as a work sample.
>
> The **station's brand is not included**: logo, team photographs and contact
> details were replaced with generic placeholders, because they belong to the
> station and not to me. The configuration you see is a demo station.
>
> What is complete is the engineering: the stream proxy, background audio
> handling, the service worker, real-time chat and analytics. See
> [LICENSE](LICENSE) — view-only.

---

## The four problems worth the trip

<details open>
<summary><strong>1. The stream is HTTP, the site is HTTPS — and it doesn't speak HTTP anyway</strong></summary>

Two problems chained together.

Browsers block HTTP audio on an HTTPS page (*mixed content*), so the stream has
to go through a proxy on our own server: `/api/stream`.

But writing that proxy surfaces the second one: the station broadcasts over
**SHOUTcast**, which answers `ICY 200 OK` instead of `HTTP/1.1`. Node's `fetch`
rejects it outright with `HPE_INVALID_CONSTANT` — it isn't valid HTTP, and there
is no option to relax that.

The fix is to drop a level: open a **raw TCP socket** with `node:net`, write the
request by hand, skip the ICY headers up to the first `\r\n\r\n`, and stream the
MP3 body through to the client.

→ [`src/app/api/stream/route.ts`](src/app/api/stream/route.ts)
</details>

<details open>
<summary><strong>2. Audio died when the screen locked on iOS</strong></summary>

The player has a spectrum visualizer, which needs Web Audio:
`createMediaElementSource(audio)` → `AnalyserNode`.

The detail that broke it: **`createMediaElementSource` routes *all* of the
element's sound through the graph.** And iOS suspends the `AudioContext` when the
app goes to the background. Result: you lock the phone and the radio goes silent.

The fix wasn't fighting the `AudioContext` — it was **not building the graph on
iOS at all**. With no graph, the `<audio>` element plays on its own and keeps
playing in the background; the visualizer falls back to a CSS animation. Android
and desktop keep the real spectrum.

On top of that sits the **Media Session API**: artwork, title and play/pause
controls in the notification and on the lock screen. The artwork requires an
absolute URL and several sizes (96→512).

→ [`src/components/radio/RadioProvider.tsx`](src/components/radio/RadioProvider.tsx)
</details>

<details>
<summary><strong>3. Listeners kept seeing the old version after every deploy</strong></summary>

The classic PWA trap: the service worker caches, the user doesn't see the new
build, and nobody is going to ask a radio audience to hard-reload.

The strategy that stuck:

- **HTML `network-first`** — always the latest version when there's a network.
- **Static assets `stale-while-revalidate`** — fast, and refreshed behind the
  scenes.
- Next's chunks carry a hash in the filename, so stale JS is never served.
- `RegisterSW` calls `update()` on load and when the tab regains focus, and
  **reloads exactly once** when a new SW takes control — never on first install,
  which would hand a new visitor a free refresh.
- `sw.js` and `manifest.json` are served with `no-cache`, so the browser spots
  the new SW immediately.

→ [`public/sw.js`](public/sw.js) · [`src/components/RegisterSW.tsx`](src/components/RegisterSW.tsx)
</details>

<details>
<summary><strong>4. Live chat without forcing anyone to create an account</strong></summary>

There was a version with accounts: unique username, hidden phone number, 4-digit
secret, re-login, impersonation guards. It worked. **The client asked for
something simpler** — the friction of signing up was killing participation.

The design that stayed: the room is public, reading asks for nothing. To write,
the minimum gate is **nickname + age range**, stored in `localStorage`. Every
message is stamped with a `device_id` so you can tell which ones are yours,
because the nickname isn't unique.

The interesting part is security without accounts: backend rules stop a listener
from posting as `admin` — an anonymous user can only write with
`sender = "listener"`. Moderators can delete messages, ban by device and clear
the room from the panel.

→ [`src/lib/pocketbase.ts`](src/lib/pocketbase.ts) · [`src/components/LiveChat.tsx`](src/components/LiveChat.tsx)
</details>

---

## Stack

| Area | Decision | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) + TS | SSR, API routes, ISR for the news feed |
| Styling | Tailwind v4 | Palette in CSS custom properties |
| Audio | `<audio>` + Media Session API | Lock-screen controls |
| Chat | PocketBase JS SDK (realtime) | Live subscriptions without writing a backend |
| Admin | Vanilla JS in `public/admin` | Already battle-tested; rewriting it was rework with no gain |
| PWA | manifest + service worker | Installable, replaces the native app |
| Deploy | Standalone Dockerfile | Minimal image, its own healthcheck |

## Other decisions

**News with zero maintenance.** The home page is an `async` Server Component that
reads the local newspaper's RSS, prioritizes regional stories and skips opinion
pieces. ISR at 30 minutes: it refreshes itself, with no API key, no cron and no
panel to feed.

**Homegrown analytics.** `presence` keeps one row per device with a deterministic
id — so it can update without reading first, since listing presence is
admin-only — holding live listeners, country, city (IP geolocation, cached for a
day) and whether they're in the chat. `events` records app open, session end with
the duration sent via `sendBeacon` on exit, clicks and messages. Heartbeat every
30 s.

**Local images.** All artwork lives in `/public/assets`. No dependency on a
third-party CDN that can go down or 404 — which happened with three Unsplash URLs
during development.

**A single source of truth.** Name, tagline, stream, logo, colors, socials and
schedule all come from `src/lib/radio-config.ts`. The UI has nothing hardcoded:
switching stations means editing that file and swapping two images.

---

## Layout

```
src/lib/radio-config.ts       ★ Single source of truth for the station
src/lib/pocketbase.ts         PB client + guest chat (realtime)
src/lib/news.ts               Local news over RSS, ISR 30 min
src/lib/analytics.ts          Listener tracking → presence + events
src/app/api/stream/route.ts   ★ Stream proxy: raw TCP socket, SHOUTcast
src/app/api/pb-config/        Backend config for the admin panel (runtime)
src/app/page.tsx              Async Server Component; chat embedded inline
src/components/radio/         RadioProvider (audio + Media Session) and Visualizer
src/components/               LiveChat, NewsSection, HostsSection, StickyPlayer…
public/admin/                 Vanilla JS admin panel, served at /admin
public/sw.js                  Service worker: network-first + SWR
```

## Configuration

```bash
cp .env.example .env.local
npm install
npm run dev      # http://localhost:3000
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_PB_URL` | URL of the PocketBase instance (chat, analytics, admin) |

Without it the site still boots: `hasChat` stays `false` and the UI hides the
chat instead of breaking.

## Deploy

Built by `Dockerfile` using Next's `standalone` output. The final image runs as a
non-privileged user and ships `curl` for the healthcheck — `node:22-alpine`
doesn't include it, and without it the orchestrator rolled back every deploy.

CI on GitHub Actions: typecheck and build on every push and pull request.

---

## Author

**Luis Mellizo** — Bogotá, Colombia

Built for **[La Brújula 93.4 FM](https://labrujulafm.com)**.

Other portfolio snapshots:
**[propaga-showcase](https://github.com/luismellizo/propaga-showcase)** ·
**[dilo-showcase](https://github.com/luismellizo/dilo-showcase)**

---

<div align="center">
<sub>Code under a <a href="LICENSE">view-only license</a>. All rights reserved.</sub>
<br><sub>Code comments and inline documentation are in Spanish — the product serves a Spanish-speaking market.</sub>
</div>
