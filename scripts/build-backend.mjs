import { build } from 'esbuild';
await build({ entryPoints:['server/render.ts'], outfile:'dist/backend/server.mjs', bundle:true, platform:'node', target:'node22', format:'esm', sourcemap:true });
console.log('Backend compilado en dist/backend/server.mjs');
