// Pruebas reales contra Firebase Emulator Suite. Ninguna solicitud llega a producción.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
await build({ entryPoints:['lib/api.ts'], outfile:'.sites-runtime/test-api.mjs', bundle:true, platform:'node', format:'esm' });
const { handleApi } = await import('../.sites-runtime/test-api.mjs');
const originalFetch = globalThis.fetch;
globalThis.fetch = (target, options) => {
  const url = new URL(target);
  if (url.hostname === 'identitytoolkit.googleapis.com') return originalFetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com${url.pathname}${url.search}`,options);
  if (url.hostname === 'firestore.googleapis.com') return originalFetch(`http://127.0.0.1:8086${url.pathname}${url.search}`,options);
  throw new Error('La prueba bloqueó una solicitud fuera de los emuladores.');
};
const config={FIREBASE_PROJECT_ID:'demo-municipio', FIREBASE_API_KEY:'demo-key'};
const db='http://127.0.0.1:8086/v1/projects/demo-municipio/databases/(default)/documents';
const auth='http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:';
let passed=0;
async function check(name, fn){await fn();passed++;console.log(`OK ${passed}. ${name}`);}
async function call(path,method='GET',body,session='',headers={}){return handleApi(new Request(`http://localhost/api/${path}`,{method,headers:{'Content-Type':'application/json',...(session?{cookie:session}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})}),config);}
function fields(data){return Object.fromEntries(Object.entries(data).map(([k,v])=>[k,typeof v==='boolean'?{booleanValue:v}:{stringValue:v}]));}
let citizenCookie='',adminCookie='',citizenToken='',adminToken='',adminId='';
const id=crypto.randomUUID();
const report={id,title:'Luminaria sin funcionamiento',description:'La luminaria del parque lleva varios días sin funcionar y requiere revisión.',category:'Alumbrado público',location:'Parque de pruebas, esquina norte',name:'',email:'',photo:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2Q=='};
await check('Sin configuración: respuesta 503, sin guardar ni confirmar',async()=>{const r=await handleApi(new Request('http://localhost/api/reports',{method:'POST'}),{});assert.equal(r.status,503);});
await check('Se rechazan solicitudes de otro origen',async()=>{assert.equal((await call('session','POST',undefined,'',{origin:'https://otro.example'})).status,403);});
await check('Sesión ciudadana real en Auth Emulator',async()=>{const r=await call('session','POST');assert.equal(r.status,200,await r.text());citizenCookie=r.headers.get('set-cookie').split(';')[0];citizenToken=decodeURIComponent(citizenCookie.slice(18));assert.match(r.headers.get('set-cookie'),/HttpOnly/);});
await check('Validación: descripción corta y fotografía inválida rechazadas',async()=>{assert.equal((await call('reports','POST',{...report,description:'corto'},citizenCookie)).status,400);assert.equal((await call('reports','POST',{...report,photo:'data:image/svg+xml,malicioso'},citizenCookie)).status,400);});
await check('Registro atómico: API guarda reporte y fotografía en Firestore',async()=>{const r=await call('reports','POST',report,citizenCookie);assert.equal(r.status,201,await r.clone().text());assert.equal((await r.json()).code,`MUN-${id.slice(0,8).toUpperCase()}`);const image=await originalFetch(`${db}/photos/${id}`,{headers:{Authorization:`Bearer ${citizenToken}`}});assert.equal(image.status,200);assert.equal((await image.json()).fields.data.stringValue,report.photo);});
await check('Reintentar el mismo envío no duplica el reporte',async()=>{const r=await call('reports','POST',report,citizenCookie);assert.equal(r.status,200,await r.text());});
await check('Un ciudadano no puede consultar la lista administrativa',async()=>{assert.equal((await call('reports','GET',undefined,citizenCookie)).status,403);});
await check('Cuenta municipal autorizada mediante colección admins',async()=>{const response=await originalFetch(`${auth}signUp?key=demo-key`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@example.test',password:'OnlyEmulator123!',returnSecureToken:true})});const account=await response.json();adminId=account.localId;await originalFetch(`${db}/admins/${adminId}`,{method:'PATCH',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({fields:fields({enabled:true})})});const r=await call('login','POST',{email:'admin@example.test',password:'OnlyEmulator123!'});assert.equal(r.status,200,await r.text());adminCookie=r.headers.get('set-cookie').split(';')[0];adminToken=decodeURIComponent(adminCookie.slice(18));});
await check('Panel recupera el reporte persistido, la descripción y la foto',async()=>{const list=await call('reports','GET',undefined,adminCookie);assert.equal(list.status,200,await list.clone().text());assert.equal((await list.json()).reports.length,1);const detail=await call(`reports/${id}`,'GET',undefined,adminCookie);assert.equal(detail.status,200,await detail.clone().text());const data=await detail.json();assert.equal(data.report.description,report.description);assert.equal(data.photo,report.photo);});
await check('Cambio de estado persistido y descripción original inalterada',async()=>{const r=await call(`reports/${id}`,'PATCH',{status:'En proceso'},adminCookie);assert.equal(r.status,200,await r.clone().text());const data=(await r.json()).report;assert.equal(data.status,'En proceso');assert.equal(data.description,report.description);const direct=await originalFetch(`${db}/reports/${id}?updateMask.fieldPaths=description`,{method:'PATCH',headers:{Authorization:`Bearer ${adminToken}`,'Content-Type':'application/json'},body:JSON.stringify({fields:fields({description:'Texto alterado'})})});assert.equal(direct.status,403);});
await check('Reglas impiden autoasignarse permisos municipales',async()=>{const response=await originalFetch(`${db}/admins/cualquier-usuario`,{method:'PATCH',headers:{Authorization:`Bearer ${citizenToken}`,'Content-Type':'application/json'},body:JSON.stringify({fields:fields({enabled:true})})});assert.equal(response.status,403);});
await check('Acceso anónimo a los datos denegado',async()=>{const response=await originalFetch(`${db}/reports/${id}`);assert.equal(response.status,403);});
await check('Un segundo ciudadano no puede leer el reporte ajeno',async()=>{const session=await call('session','POST');const token=decodeURIComponent(session.headers.get('set-cookie').split(';')[0].slice(18));const response=await originalFetch(`${db}/reports/${id}`,{headers:{Authorization:`Bearer ${token}`}});assert.equal(response.status,403);});
await check('Estado inválido se rechaza sin modificar el registro',async()=>{assert.equal((await call(`reports/${id}`,'PATCH',{status:'Inventado'},adminCookie)).status,400);});
await check('Credenciales incorrectas no crean sesión municipal',async()=>{assert.equal((await call('login','POST',{email:'admin@example.test',password:'incorrecta'})).status,401);});
await check('Cierre de sesión elimina la cookie',async()=>{const r=await call('logout','POST',undefined,adminCookie);assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/Max-Age=0/);});
globalThis.fetch=originalFetch;
console.log(`\n${passed} pruebas de integración aprobadas con Auth y Firestore Emulator.`);
