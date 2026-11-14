import { build } from "vite";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Netlify's CDN forwards /api to Render. Cookies remain scoped to the frontend
// host, so browser requests do not need cross-site cookie or CORS exceptions.
const configuredUrl = process.env.BACKEND_URL;
if (!configuredUrl) {
  throw new Error("Configura BACKEND_URL con la URL HTTPS del backend de Render antes de compilar el frontend.");
}
const backend = new URL(configuredUrl);
if (backend.protocol !== "https:" || backend.username || backend.password || backend.search || backend.hash || !["", "/"].includes(backend.pathname)) {
  throw new Error("BACKEND_URL debe ser un origen HTTPS sin credenciales, ruta, parámetros ni fragmento.");
}

await build({ configFile: fileURLToPath(new URL("../vite.frontend.config.ts", import.meta.url)) });
await writeFile(
  new URL("../dist/frontend/_redirects", import.meta.url),
  `/api/*  ${backend.origin}/api/:splat  200!\n/*  /index.html  200\n`,
  "utf8",
);
await writeFile(
  new URL("../dist/frontend/_headers", import.meta.url),
  "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n\n/api/*\n  Cache-Control: no-store\n",
  "utf8",
);
console.log(`Frontend listo en dist/frontend; proxy API: ${backend.origin}`);
