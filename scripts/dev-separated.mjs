import { spawn } from 'node:child_process';
import './build-backend.mjs';
const children = [
  spawn(process.execPath, ['dist/backend/server.mjs'], {stdio:'inherit'}),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js','--config','vite.frontend.config.ts','--host','127.0.0.1','--port','5173'], {stdio:'inherit'}),
];
function stop(){for(const child of children) child.kill();}
process.on('SIGINT', stop); process.on('SIGTERM', stop);
for(const child of children) child.on('exit', code=>{if(code)stop();});
