import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { existsSync } from 'node:fs';
import { handleApi } from '../lib/api';

// Variables locales opcionales. Render inyecta su configuración en process.env.
if (existsSync('.dev.vars')) process.loadEnvFile('.dev.vars');
const port = Number(process.env.PORT || 3001);
const publicOrigin = process.env.PUBLIC_BACKEND_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
const server = createServer(async (incoming, outgoing) => {
  try {
    const pathname = incoming.url || '/';
    if (!(pathname.startsWith('/api/') || pathname === '/healthz')) {
      outgoing.writeHead(404, { 'Content-Type': 'application/json' });
      outgoing.end(JSON.stringify({ error: 'La API se encuentra en /api.' })); return;
    }
    if (Number(incoming.headers['content-length'] || 0) > 500000) {
      outgoing.writeHead(413, { 'Content-Type': 'application/json' });
      outgoing.end(JSON.stringify({ error: 'La solicitud es demasiado grande.' })); return;
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(incoming.headers)) {
      if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
    const init: RequestInit & { duplex?: 'half' } = { method: incoming.method, headers };
    if (!['GET', 'HEAD'].includes(incoming.method || 'GET')) {
      init.body = Readable.toWeb(incoming) as ReadableStream<Uint8Array>;
      init.duplex = 'half';
    }
    // No se usa X-Forwarded-Host para decidir qué orígenes están autorizados.
    const request = new Request(new URL(pathname === '/healthz' ? '/api/health' : pathname, publicOrigin), init);
    const response = await handleApi(request, {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FRONTEND_URL: process.env.FRONTEND_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:5173,http://127.0.0.1:5173' : ''),
    });
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    if (!outgoing.headersSent) outgoing.writeHead(500, { 'Content-Type': 'application/json' });
    outgoing.end(JSON.stringify({ error: 'No se pudo procesar la solicitud.' }));
  }
});
server.requestTimeout = 60000;
server.headersTimeout = 20000;
server.listen(port, '0.0.0.0', () => console.log(`API lista en puerto ${port}`));
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
