// Prueba del servidor HTTP real. No utiliza Firebase de producción ni credenciales.
import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const compile = spawnSync(process.execPath, ['scripts/build-backend.mjs'], {
  cwd: projectRoot,
  encoding: 'utf8',
});
assert.equal(compile.status, 0, compile.stderr || compile.stdout);

const children = [];
let temporaryDirectory;
let unconfigured;
let configured;

async function availablePort() {
  const reservation = createServer();
  await new Promise((resolveReady, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', resolveReady);
  });
  const port = reservation.address().port;
  await new Promise(resolveClosed => reservation.close(resolveClosed));
  return port;
}

async function launch(extraEnvironment = {}) {
  const port = await availablePort();
  const environment = { ...process.env };
  for (const key of Object.keys(environment)) {
    if (/^(FIREBASE_|FRONTEND_URL$|PUBLIC_BACKEND_URL$|RENDER_EXTERNAL_URL$|PORT$)/.test(key)) {
      delete environment[key];
    }
  }
  const child = spawn(process.execPath, [resolve(projectRoot, 'dist/backend/server.mjs')], {
    cwd: temporaryDirectory,
    env: {
      ...environment,
      NODE_ENV: 'production',
      PORT: String(port),
      RENDER_EXTERNAL_URL: 'https://municipio-test.onrender.com',
      FRONTEND_URL: 'https://municipio-test.netlify.app',
      ...extraEnvironment,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  children.push(child);
  await new Promise((resolveReady, reject) => {
    const timer = setTimeout(() => reject(new Error('El servidor no inició a tiempo.')), 10000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`El servidor terminó antes de iniciar: ${code}`)); });
    child.stdout.on('data', data => {
      if (data.toString().includes('API lista en puerto')) { clearTimeout(timer); resolveReady(); }
    });
  });
  return `http://127.0.0.1:${port}`;
}

before(async () => {
  // Aislar cwd impide cargar accidentalmente el .dev.vars del propietario.
  await mkdir(join(projectRoot, '.sites-runtime'), { recursive: true });
  temporaryDirectory = await mkdtemp(join(projectRoot, '.sites-runtime', 'http-test-'));
  unconfigured = await launch();
  configured = await launch({ FIREBASE_PROJECT_ID: 'demo-municipio', FIREBASE_API_KEY: 'demo-key' });
});

after(async () => {
  await Promise.all(children.map(child => new Promise(resolveExit => {
    if (child.exitCode !== null) return resolveExit();
    child.once('exit', resolveExit);
    child.kill('SIGTERM');
    const force = setTimeout(() => child.kill('SIGKILL'), 2000);
    force.unref();
  })));
  if (temporaryDirectory) {
    const target = resolve(temporaryDirectory);
    assert.equal(dirname(target), resolve(projectRoot, '.sites-runtime'));
    assert.ok(basename(target).startsWith('http-test-'));
    await rm(target, { recursive: true, force: true });
  }
});

test('Render health check funciona sin configurar Firebase', async () => {
  for (const path of ['/healthz', '/api/health']) {
    const response = await fetch(unconfigured + path);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { configured: false });
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  }
});

test('API sin Firebase devuelve 503 y no una confirmación falsa', async () => {
  const response = await fetch(unconfigured + '/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://municipio-test.netlify.app' },
    body: '{}',
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /Firebase/);
  assert.equal(response.headers.get('set-cookie'), null);
});

test('Origen ajeno se rechaza aunque falsifique X-Forwarded-Host', async () => {
  const response = await fetch(unconfigured + '/api/session', {
    method: 'POST',
    headers: { Origin: 'https://intruso.example', 'X-Forwarded-Host': 'intruso.example' },
  });
  assert.equal(response.status, 403);
});

test('El origen Netlify debe coincidir exactamente', async () => {
  const response = await fetch(unconfigured + '/api/session', {
    method: 'POST',
    headers: { Origin: 'https://municipio-test.netlify.app.intruso.example' },
  });
  assert.equal(response.status, 403);
});

test('Se rechaza el payload HTTP mayor de 500000 bytes', async () => {
  const response = await fetch(unconfigured + '/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'x'.repeat(500001),
  });
  assert.equal(response.status, 413);
  assert.match((await response.json()).error, /grande/);
});

test('Inicio accesible sin convertir rutas desconocidas en respuestas exitosas', async () => {
  const home = await fetch(unconfigured + '/');
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type'), /text\/html/);
  const html = await home.text();
  assert.match(html, /href="https:\/\/municipio-test\.netlify\.app\/"/);
  assert.match(html, /href="\/healthz"/);
  const head = await fetch(unconfigured + '/', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal((await fetch(unconfigured + '/', { method: 'POST' })).status, 404);
  assert.equal((await fetch(unconfigured + '/admin')).status, 404);
  assert.equal((await fetch(configured + '/api/no-existe')).status, 404);
});

test('HTTPS público de Render produce cookie Secure, HttpOnly y host-only', async () => {
  // Logout no realiza llamadas externas: permite comprobar la política real de cookies.
  const response = await fetch(configured + '/api/logout', {
    method: 'POST',
    headers: { Origin: 'https://municipio-test.netlify.app' },
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, /; Secure/);
  assert.match(cookie, /; HttpOnly/);
  assert.match(cookie, /; SameSite=Strict/);
  assert.match(cookie, /; Path=\/api/);
  assert.match(cookie, /; Max-Age=0/);
  assert.doesNotMatch(cookie, /Domain=/i);
});
