import { connect } from 'node:net';
import { radioConfig } from '@/lib/radio-config';

/**
 * Proxy del stream de audio (SHOUTcast/Icecast).
 *
 * Dos problemas que resuelve:
 *  1. Mixed-content: el stream es HTTP y la web HTTPS → el navegador bloquea el
 *     audio. Este route server-side lo reenvía por HTTPS.
 *  2. SHOUTcast responde `ICY 200 OK` en vez de `HTTP/1.1 200 OK`. El `fetch` de
 *     Node (undici) lo rechaza con `HPE_INVALID_CONSTANT`. Por eso abrimos un
 *     socket TCP crudo, saltamos los headers a mano y streameamos el body.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = new URL(radioConfig.streamUrl);
  const host = url.hostname;
  const port = Number(url.port) || 80;
  const path = (url.pathname + url.search) || '/';

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const socket = connect({ host, port });
      let headersDone = false;
      let buffer = Buffer.alloc(0);
      let closed = false;

      const close = () => {
        if (closed) return;
        closed = true;
        socket.destroy();
        try {
          controller.close();
        } catch {
          /* ya cerrado */
        }
      };

      socket.on('connect', () => {
        socket.write(
          `GET ${path} HTTP/1.0\r\n` +
            `Host: ${host}:${port}\r\n` +
            `User-Agent: RadioWeb/1.0\r\n` +
            `Icy-MetaData: 0\r\n` +
            `Connection: close\r\n\r\n`,
        );
      });

      socket.on('data', (chunk: Buffer) => {
        if (headersDone) {
          try {
            controller.enqueue(new Uint8Array(chunk));
          } catch {
            close();
          }
          return;
        }
        // Acumula hasta el fin de los headers (ICY o HTTP) y descártalos.
        buffer = Buffer.concat([buffer, chunk]);
        const sep = buffer.indexOf('\r\n\r\n');
        if (sep !== -1) {
          headersDone = true;
          const body = buffer.subarray(sep + 4);
          if (body.length) controller.enqueue(new Uint8Array(body));
          buffer = Buffer.alloc(0);
        }
      });

      socket.on('error', () => close());
      socket.on('end', () => close());
      socket.on('close', () => close());
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
