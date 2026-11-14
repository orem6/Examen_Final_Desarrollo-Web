# Municipio · Atención ciudadana

Repositorio: https://github.com/orem6/Examen_Final_Desarrollo-Web

Backend Render: https://atencion-ciudadana-api-orem6.onrender.com — comprobar `/healthz` para estado. El servicio puede estar iniciándose; Firebase sigue pendiente de configuración.

Proyecto académico correspondiente exclusivamente a las **Series I y II**. No incluye los servicios de IA de la Serie III.

## Inicio rápido en Windows

1. Abre esta carpeta: `C:\Users\keyor\Desktop\AtencionCiudadana`.
2. Configura Firebase siguiendo los pasos de abajo.
3. Ejecuta `INICIAR.cmd` o, desde una terminal en esta carpeta, `npm run dev`.
4. Abre <http://127.0.0.1:5173> para el portal o <http://127.0.0.1:5173/admin> para administración.

Se requiere Node.js 22.13 o superior. Las dependencias ya están instaladas en esta computadora. En otra computadora ejecuta `npm ci` antes de iniciar. Para comprobar tipos ejecuta `npm run check`. `npm run dev` inicia el frontend Vite en el puerto 5173 y el backend Node en el puerto 3001. Consulta la sección de despliegue para compilar cada parte.

**Estado de conexión:** el proyecto no contiene credenciales ni una base de datos de producción preconfigurada. Mientras falten `FIREBASE_PROJECT_ID` y `FIREBASE_API_KEY`, se muestra un aviso y el envío permanece deshabilitado. La aplicación no utiliza reportes inventados ni localStorage como reemplazo de Firebase.

## Crear y conectar Firebase, sin plan de pago

1. Entra a <https://console.firebase.google.com/> y crea un proyecto. Conserva el plan **Spark**. Analytics es opcional.
2. Registra una aplicación web con **</>**. Copia `projectId` y `apiKey` del objeto `firebaseConfig`.
3. En **Authentication → Métodos de acceso**, habilita **Anónimo** y **Correo electrónico/contraseña**. El ciudadano recibe una sesión anónima automáticamente; no necesita registrarse.
4. En **Firestore Database**, crea la base de datos **(default)**, edición Standard, en modo producción. Elige una región disponible y conserva esa ubicación.
5. Abre **Firestore → Reglas**, reemplaza el contenido con `firestore.rules` y pulsa **Publicar**. No uses reglas de prueba que permitan todo.
6. En **Authentication → Usuarios → Agregar usuario**, crea la cuenta municipal y copia su **UID**. No envíes su contraseña al chat.
7. En **Firestore → Datos**, crea la colección `admins`. El ID del documento debe ser exactamente el UID anterior. Agrega `enabled` de tipo **boolean** con valor `true`. Nadie puede concederse ese permiso desde la aplicación.
8. Copia `.dev.vars.example` como `.dev.vars` y sustituye sus dos valores. También puedes abrir PowerShell aquí y ejecutar `powershell -ExecutionPolicy Bypass -File .\CONFIGURAR-FIREBASE.ps1`; este script solo solicita la configuración pública y la guarda localmente. No requiere claves privadas ni cuentas de servicio.
9. Reinicia `INICIAR.cmd`. Registra un reporte real y entra al panel con la cuenta municipal.

Opcionalmente instala la CLI oficial (`npm install -g firebase-tools`), ejecuta `firebase login` y publica reglas e índices con `firebase deploy --only firestore --project TU_PROJECT_ID`. Alternativa manual para los índices: en Firestore → Índices → Exenciones de campo único, deshabilita los índices del campo `data` del grupo de colecciones `photos` y del campo `description` de `reports`. Los índices normales de `createdAt` permanecen habilitados para ordenar los reportes.

La configuración web `apiKey` identifica el proyecto y no equivale a una clave privada. La protección depende de Firebase Authentication y de las reglas incluidas. No publiques contraseñas, tokens de sesión o claves de cuentas de servicio.

## Pantallas y comportamiento

- **Portal ciudadano:** categoría, título, descripción original, ubicación, fotografía obligatoria y nombre/correo opcionales. Valida campos en navegador y API. Comprime JPG, PNG o WebP a JPEG de hasta aproximadamente 345 KB (460 000 caracteres en base64). Solo muestra la constancia después de que Firestore confirma el guardado.
- **Panel municipal:** inicio de sesión, indicadores, listado ordenado por fecha, búsqueda por texto/número/ubicación, filtros por categoría y estado, fotografía y descripción originales, y cambio de estado. Los estados son Recibido, En revisión, En proceso y Resuelto.
- **Paginación:** se recuperan 50 reportes por petición; “Cargar más reportes” obtiene la página siguiente. Indicadores y filtros trabajan sobre los registros cargados y la pantalla lo indica expresamente.
- **Sesiones:** cookie HttpOnly y SameSite=Strict; Secure en HTTPS. Duran 55 minutos y requieren volver a iniciar sesión municipal al expirar. El ciudadano puede obtener otra sesión anónima al registrar.
- **Errores:** mensajes por configuración faltante, permisos, validaciones, conexión y límites del servicio. Un reintento con el mismo identificador evita duplicar el reporte dentro de la misma sesión.

## Arquitectura y organización

```text
Ciudadano + fotografía
    → React (fetch a /api)
    → API del servidor (validación + autenticación)
    → Firebase Auth + Firestore REST API
    → API del servidor (consulta protegida)
    → Panel municipal
```

| Archivo/carpeta | Responsabilidad |
| --- | --- |
| `app/page.tsx` | Ruta del portal público |
| `app/admin/page.tsx` | Ruta de administración |
| `components/municipio/` | Formulario, panel y componentes visuales |
| `app/globals.css` | Diseño adaptable a móvil y escritorio |
| `app/api/[...path]/route.ts` | Entrada de las rutas REST del servidor |
| `lib/api.ts` | Autenticación, autorización y comunicación con Firebase |
| `lib/reports.ts` | Validaciones y conversión de documentos Firestore |
| `firestore.rules` | Acceso a reportes, fotografías y roles |
| `firestore.indexes.json` | Exclusión de datos grandes de los índices |
| `tests/firebase.integration.mjs` | Pruebas reales contra emuladores oficiales |

Frontend React/TypeScript compilado con Vite para Netlify y backend Node.js para Render. Netlify reenvía `/api/*` a Render mediante un proxy para conservar las cookies seguras de mismo origen. El navegador llama a la API propia usando `fetch`; la API llama a Firebase usando `fetch`. No se necesita desplegar Cloud Functions ni habilitar facturación. Se conserva también la configuración anterior de Sites/Vinext, independiente del despliegue solicitado en Render y Netlify.

## Publicación en Render y Netlify

Los archivos de configuración están preparados; su presencia no significa que los servicios ya estén publicados. Se requieren sesiones autorizadas en ambas plataformas y el repositorio GitHub exclusivo indicado por el propietario.

### Backend en Render

Crear un **Web Service** Node conectado al repositorio de este proyecto:

- Build command: `npm ci --include=dev && npm run build:backend`
- Start command: `npm run start:backend`
- Health check: `/healthz`
- Plan: Free.
- Variables: `NODE_ENV=production`, `NODE_VERSION=22`, `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY` y `FRONTEND_URL` con el origen HTTPS exacto de Netlify, sin barra final.
- `RENDER_EXTERNAL_URL` lo proporciona Render; se utiliza para formar la URL HTTPS canónica y emitir cookies Secure. Si el proveedor no lo entrega, establecer `PUBLIC_BACKEND_URL` con la URL HTTPS del backend.

`render.yaml` contiene la configuración equivalente. No reemplazar servicios de otros proyectos.

### Frontend en Netlify

Crear un proyecto estático conectado al mismo repositorio:

- Build command: `npm run build:frontend`
- Publish directory: `dist/frontend`
- Variable de compilación: `BACKEND_URL=https://URL-REAL-DEL-SERVICIO.onrender.com`.
- `netlify.toml` ya contiene los ajustes de compilación. No se necesitan funciones de Next.js para este frontend estático.

El build exige una URL HTTPS válida y genera `_redirects` con el proxy API antes del fallback SPA. Cambiar `BACKEND_URL` requiere recompilar/publicar el frontend; cambiar `FRONTEND_URL` requiere reiniciar/publicar Render. El backend solo acepta el origen exacto configurado. No se utiliza CORS abierto ni cookies de terceros.

### Comprobación posterior al despliegue

1. Visitar `https://URL-RENDER/healthz` y `https://URL-NETLIFY/api/health`; ambos deben responder JSON.
2. `configured: true` indica que existen las variables Firebase. Todavía debe demostrarse una escritura real para confirmar configuración, permisos y reglas.
3. Enviar un reporte desde Netlify, revisar la constancia y abrirlo desde el panel municipal.
4. Confirmar descripción, fotografía y estado persistidos tras recargar.

Render Free puede tardar en iniciar después de inactividad y el proxy de Netlify tiene un límite de 26 segundos. La interfaz informa del error y reintenta únicamente la consulta inicial de estado, nunca un envío de reporte automáticamente.

Para compilar manualmente en PowerShell:

```powershell
npm run build:backend
$env:BACKEND_URL = 'https://URL-REAL-DEL-SERVICIO.onrender.com'
npm run build:frontend
```

Referencias: [Render Node](https://render.com/docs/deploy-node-express-app), [proxy Netlify](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/).

## Modelo de datos

- `reports/{uuid}`: `id`, `code`, `title`, `description`, `category`, `location`, `name`, `email`, `ownerUid`, `status`, `createdAt`, `updatedAt`, `hasPhoto`.
- `photos/{uuid}`: `ownerUid`, `data` (JPEG base64). Comparte el UUID con el reporte. Se consulta al abrir el detalle para no descargar todas las fotografías al listar.
- `admins/{uid}`: `enabled: true`. Se administra exclusivamente desde la consola de Firebase.

El reporte y la foto se escriben en una sola operación atómica `documents:commit`: ambos se guardan o ninguno. Las reglas también exigen que existan juntos y bloquean la modificación de la descripción original. Las fechas se generan en el backend en UTC y se muestran en la zona horaria del navegador.

Se utiliza Firestore para guardar una fotografía pequeña por reporte porque Cloud Storage requiere Blaze. Esta elección sirve para la escala académica y está sujeta a las cuotas gratuitas de Firestore. Una fotografía por documento permanece por debajo de 1 MiB. Para volúmenes grandes se debería migrar a almacenamiento de objetos y agregar controles de abuso; el alcance actual es una entrega académica, no una puesta en producción municipal a gran escala.

## API REST

| Método | Ruta | Acción |
| --- | --- | --- |
| GET | `/api/health` | Indica si están configuradas las dos variables Firebase |
| POST | `/api/session` | Inicia/reutiliza sesión ciudadana anónima |
| POST | `/api/reports` | Valida y registra reporte + fotografía |
| POST | `/api/login` | Valida credenciales y permiso municipal |
| GET | `/api/me` | Consulta la sesión municipal |
| GET | `/api/reports?cursor=...` | Lista 50 reportes y devuelve `nextCursor` |
| GET | `/api/reports/{id}` | Descripción y fotografía, solo personal autorizado |
| PATCH | `/api/reports/{id}` | Cambia `status`, solo personal autorizado |
| POST | `/api/logout` | Elimina la cookie de sesión |

Respuestas JSON; errores con `{ "error": "mensaje" }`. Se emplean códigos HTTP 400, 401, 403, 404, 409, 413, 415, 429, 502 y 503 según el caso. `/api/health` comprueba presencia de configuración, no reemplaza una prueba de conexión real.

## Pruebas y demostración

Verificado el 14 de noviembre de 2026: compilación, revisión TypeScript, vistas de escritorio/móvil y **16 pruebas de integración aprobadas** con Firebase Auth y Firestore Emulator. La conexión a un proyecto Firebase de producción queda pendiente de que el propietario proporcione su configuración y publique las reglas.

Para ejecutar las pruebas de integración se requiere Java 21 o superior y la CLI de Firebase:

```powershell
npm exec --yes --package=firebase-tools -- firebase emulators:exec --project demo-municipio --only auth,firestore "node tests/firebase.integration.mjs"
```

Las pruebas usan Auth y Firestore locales, ejecutan el backend real y redirigen únicamente el transporte de red hacia los emuladores. No escriben en un proyecto de producción. Incluyen persistencia del reporte/foto, recuperación, cambios de estado, permisos, validación y reintentos. Los datos y usuarios de prueba se crean solamente dentro del emulador.

Para demostrar las Series I y II con tu Firebase real:

1. Envía un reporte con fotografía desde el portal y guarda el número de confirmación.
2. Comprueba en la consola Firebase los documentos `reports` y `photos` con el mismo UUID.
3. Entra al panel municipal y abre ese reporte; verifica descripción y fotografía.
4. Cambia el estado, recarga la página y verifica que se conserva.
5. Cierra la sesión y comprueba que no puedes consultar el listado.

## Referencias oficiales

- [Firestore REST y autenticación](https://firebase.google.com/docs/firestore/use-rest-api)
- [Firebase Authentication REST](https://firebase.google.com/docs/reference/rest/auth)
- [Reglas de seguridad](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Cuotas gratuitas y límites](https://firebase.google.com/docs/firestore/quotas)
- [Requisito Blaze de Cloud Storage](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)
