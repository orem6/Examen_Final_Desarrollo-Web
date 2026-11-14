# 🏛️ Plataforma de Atención Ciudadana Municipal

Aplicación web para registrar quejas y necesidades de la comunidad con una fotografía, recibir una constancia y facilitar su revisión por el personal municipal. El frontend consume una API REST mediante `fetch`; el backend valida las solicitudes y utiliza Firebase para autenticar usuarios y persistir los reportes.

Proyecto académico correspondiente exclusivamente a las **Series I y II**. La Serie III de inteligencia artificial queda fuera del alcance solicitado.

## 🌐 Enlaces del Proyecto

| Recurso | Enlace |
| --- | --- |
| **Portal ciudadano · Netlify** | [atencion-ciudadana-orem6.netlify.app](https://atencion-ciudadana-orem6.netlify.app/) |
| **Panel municipal** | [Acceso a administración](https://atencion-ciudadana-orem6.netlify.app/admin) |
| **Backend / API · Render** | [atencion-ciudadana-api-orem6.onrender.com](https://atencion-ciudadana-api-orem6.onrender.com/) |
| **Estado del backend** | [/healthz](https://atencion-ciudadana-api-orem6.onrender.com/healthz) |
| **API a través de Netlify** | [/api/health](https://atencion-ciudadana-orem6.netlify.app/api/health) |
| **Repositorio GitHub** | [orem6/Examen_Final_Desarrollo-Web](https://github.com/orem6/Examen_Final_Desarrollo-Web) |

<!-- FIREBASE_STATUS_START -->
**Estado actual:** frontend en Netlify, backend en Render y Firebase conectados. El 14 de noviembre de 2026 se aprobaron **12 comprobaciones contra la API publicada**, incluido el registro de un reporte con fotografía, su recuperación desde Firestore y el acceso municipal. El proyecto `atencion-ciudadana-orem6` utiliza el plan Spark, sin facturación habilitada; la autenticación, las reglas y los índices están desplegados. La configuración local también está lista en la computadora original.
<!-- FIREBASE_STATUS_END -->

La raíz del backend contiene únicamente la API; para comprobar disponibilidad se debe abrir `/healthz`. Las pantallas se encuentran en Netlify.

## ✨ Funcionalidades

- Formulario ciudadano con categoría, título, descripción y ubicación del problema.
- Fotografía obligatoria con vista previa, validación y compresión antes del envío.
- Nombre y correo opcionales; el ciudadano no necesita crear una cuenta.
- Confirmación con número de reporte después de recibir la respuesta de guardado.
- Panel municipal con inicio de sesión y acceso restringido por rol.
- Listado por fecha, búsqueda por texto y filtros por categoría y estado.
- Consulta de la descripción original y la fotografía asociada.
- Estados de atención: **Recibido**, **En revisión**, **En proceso** y **Resuelto**.
- Indicadores calculados a partir de los registros cargados y paginación de 50 reportes.
- Validaciones en frontend y backend, manejo de errores y diseño adaptable a móviles.

## 🔐 Acceso al Sistema

| Perfil | Forma de acceso |
| --- | --- |
| **Ciudadanía** | Portal público. La API obtiene una sesión anónima de Firebase; no exige registro ni contraseña. |
| **Personal municipal** | Correo y contraseña de una cuenta Firebase Authentication cuyo UID esté habilitado en `admins/{uid}` con `enabled: true`. |

Las credenciales municipales se entregan al responsable por un medio privado. **Este repositorio no publica contraseñas, tokens ni claves privadas.** La contraseña de la cuenta municipal es independiente de la contraseña de Google utilizada para administrar Firebase.

Los datos de contacto y las fotografías solo están disponibles para las sesiones autorizadas. El usuario no puede asignarse permisos de administración desde el portal.

## 🛠️ Tecnologías

| Área | Tecnologías |
| --- | --- |
| Frontend | React, TypeScript, Vite, CSS y Lucide React |
| Backend | Node.js, API REST y `fetch` |
| Persistencia | Cloud Firestore, mediante su API REST |
| Autenticación | Firebase Authentication: anónimo y correo/contraseña |
| Seguridad | Reglas Firestore, validación de origen y cookies HttpOnly |
| Hosting | Netlify para frontend y Render para backend |

## 🚀 Inicio rápido en Windows

1. Abre esta carpeta: `C:\Users\keyor\Desktop\AtencionCiudadana`.
2. En esta computadora, `.dev.vars` ya contiene la configuración local de Firebase. Si acabas de clonar el repositorio en otra computadora, prepara ese archivo siguiendo la sección de configuración local.
3. Ejecuta `INICIAR.cmd` o, desde una terminal en esta carpeta, `npm run dev`.
4. Abre <http://127.0.0.1:5173> para el portal o <http://127.0.0.1:5173/admin> para administración.

Se requiere Node.js 22.13 o superior. Las dependencias ya están instaladas en esta computadora. En otra computadora ejecuta `npm ci` antes de iniciar. Para comprobar tipos ejecuta `npm run check`. `npm run dev` inicia el frontend Vite en el puerto 5173 y el backend Node en el puerto 3001. Consulta la sección de despliegue para compilar cada parte.

**Configuración local:** los valores de conexión se guardan en `.dev.vars`, excluido de Git y ya presente en la computadora original del proyecto. En una nueva copia, crea este archivo a partir de `.dev.vars.example` y completa `FIREBASE_PROJECT_ID` y `FIREBASE_API_KEY` con la configuración web del proyecto al que tengas acceso. También puedes ejecutar `powershell -ExecutionPolicy Bypass -File .\CONFIGURAR-FIREBASE.ps1` para introducir esos valores localmente. No se requieren claves privadas ni cuentas de servicio.

Mientras falten las dos variables Firebase, se muestra un aviso y el envío permanece deshabilitado. La aplicación no utiliza reportes inventados ni `localStorage` como reemplazo de Firebase.

## 🔥 Firebase del Proyecto

| Ajuste | Configuración |
| --- | --- |
| ID del proyecto | `atencion-ciudadana-orem6` |
| Plan | Spark; facturación no habilitada |
| Base de datos | Cloud Firestore Standard, `(default)` |
| Región configurada | `us-east4` |
| Proveedores habilitados | Anónimo y correo/contraseña |
| Selección local de proyecto | `.firebaserc` |
| Estado del despliegue y prueba real | Publicado; 12 comprobaciones de API aprobadas el 14/11/2026 |

Para trabajar en la instalación existente, utiliza este proyecto y conserva sus datos. No necesitas crear otro proyecto ni cambiar de plan. Los valores de conexión se guardan localmente en `.dev.vars` y en las variables del backend de Render; no se publican contraseñas ni tokens.

### Mantener autenticación, reglas e índices

Con una cuenta autorizada en este proyecto, la CLI oficial se ejecuta sin instalación global:

```powershell
npx -y firebase-tools@latest login
npx -y firebase-tools@latest deploy --only auth,firestore --project atencion-ciudadana-orem6
```

`firebase.json` declara los proveedores anónimo y correo/contraseña. El despliegue de Firestore publica las reglas y las exenciones de índices; los índices normales de `createdAt` permanecen habilitados para ordenar los reportes.

### Replicar la solución en un proyecto independiente

Los siguientes pasos son únicamente para crear otra instalación. No son necesarios para iniciar la copia ya configurada en esta computadora.

1. Entra a <https://console.firebase.google.com/> y crea un proyecto. Conserva el plan **Spark**. Analytics es opcional.
2. Registra una aplicación web con **</>**. Copia `projectId` y `apiKey` del objeto `firebaseConfig`.
3. En **Authentication → Métodos de acceso**, habilita **Anónimo** y **Correo electrónico/contraseña**. El ciudadano recibe una sesión anónima automáticamente; no necesita registrarse.
4. En **Firestore Database**, crea la base de datos **(default)**, edición Standard, en modo producción. Elige una región disponible y conserva esa ubicación.
5. Abre **Firestore → Reglas**, reemplaza el contenido con `firestore.rules` y pulsa **Publicar**. No uses reglas de prueba que permitan todo.
6. En **Authentication → Usuarios → Agregar usuario**, crea la cuenta municipal y copia su **UID**. No envíes su contraseña al chat.
7. En **Firestore → Datos**, crea la colección `admins`. El ID del documento debe ser exactamente el UID anterior. Agrega `enabled` de tipo **boolean** con valor `true`. Nadie puede concederse ese permiso desde la aplicación.
8. Copia `.dev.vars.example` como `.dev.vars` y sustituye sus dos valores. También puedes abrir PowerShell aquí y ejecutar `powershell -ExecutionPolicy Bypass -File .\CONFIGURAR-FIREBASE.ps1`; este script solo solicita la configuración pública y la guarda localmente. No requiere claves privadas ni cuentas de servicio.
9. Reinicia `INICIAR.cmd`. Registra un reporte real y entra al panel con la cuenta municipal.

Para publicar la configuración en esa instalación independiente:

```powershell
npx -y firebase-tools@latest login
npx -y firebase-tools@latest deploy --only auth,firestore --project TU_PROJECT_ID
```

`firebase.json` habilita los proveedores anónimo y correo/contraseña. El despliegue de Firestore publica las reglas y las exenciones de índices. Alternativa manual para los índices: en Firestore → Índices → Exenciones de campo único, deshabilita los índices del campo `data` del grupo de colecciones `photos` y del campo `description` de `reports`. Los índices normales de `createdAt` permanecen habilitados para ordenar los reportes.

La configuración web `apiKey` identifica el proyecto y no equivale a una clave privada. La protección depende de Firebase Authentication y de las reglas incluidas. No publiques contraseñas, tokens de sesión o claves de cuentas de servicio.

## 🖥️ Pantallas y comportamiento

- **Portal ciudadano:** categoría, título, descripción original, ubicación, fotografía obligatoria y nombre/correo opcionales. Valida campos en navegador y API. Comprime JPG, PNG o WebP a JPEG de hasta aproximadamente 345 KB (460 000 caracteres en base64). Solo muestra la constancia después de que Firestore confirma el guardado.
- **Panel municipal:** inicio de sesión, indicadores, listado ordenado por fecha, búsqueda por texto/número/ubicación, filtros por categoría y estado, fotografía y descripción originales, y cambio de estado. Los estados son Recibido, En revisión, En proceso y Resuelto.
- **Paginación:** se recuperan 50 reportes por petición; “Cargar más reportes” obtiene la página siguiente. Indicadores y filtros trabajan sobre los registros cargados y la pantalla lo indica expresamente.
- **Sesiones:** cookie HttpOnly y SameSite=Strict; Secure en HTTPS. Duran 55 minutos y requieren volver a iniciar sesión municipal al expirar. El ciudadano puede obtener otra sesión anónima al registrar.
- **Errores:** mensajes por configuración faltante, permisos, validaciones, conexión y límites del servicio. Un reintento con el mismo identificador evita duplicar el reporte dentro de la misma sesión.

## 🏗️ Arquitectura y organización

```text
Ciudadano + fotografía
    → Frontend React / Netlify
    → fetch a /api → proxy Netlify
    → Backend Node.js / Render
    → Firebase Authentication + Cloud Firestore
    → Backend / API (consulta protegida)
    → Panel municipal / Netlify
```

| Archivo/carpeta | Responsabilidad |
| --- | --- |
| `frontend/main.tsx` | Entrada del frontend y selección de portal/panel |
| `frontend/index.html` | Documento HTML de la aplicación |
| `components/municipio/` | Formulario, panel y componentes visuales |
| `app/globals.css` | Diseño adaptable a móvil y escritorio |
| `server/render.ts` | Servidor HTTP Node y adaptación de solicitudes a la API |
| `lib/api.ts` | Autenticación, autorización y comunicación con Firebase |
| `lib/http-client.ts` | Consumo de la API desde el navegador y errores de conexión |
| `lib/reports.ts` | Validaciones y conversión de documentos Firestore |
| `firestore.rules` | Acceso a reportes, fotografías y roles |
| `firestore.indexes.json` | Exclusión de datos grandes de los índices |
| `netlify.toml` | Configuración de publicación del frontend |
| `render.yaml` | Plantilla para crear una instalación alternativa del backend |
| `scripts/build-frontend.mjs` | Build estático y proxy `/api` hacia Render |
| `scripts/build-backend.mjs` | Bundle ejecutable del servidor Node |
| `tests/firebase.integration.mjs` | Pruebas reales contra emuladores oficiales |
| `tests/render-server.test.mjs` | Pruebas HTTP del backend para Render |
| `tests/http-client.test.mjs` | Sesión y manejo de errores del cliente HTTP |

Frontend React/TypeScript compilado con Vite para Netlify y backend Node.js para Render. Netlify reenvía `/api/*` a Render mediante un proxy para conservar las cookies seguras de mismo origen. El navegador llama a la API propia usando `fetch`; la API llama a Firebase usando `fetch`. No se necesita desplegar Cloud Functions ni habilitar facturación. Se conserva también la configuración anterior de Sites/Vinext, independiente del despliegue solicitado en Render y Netlify.

## ☁️ Publicación en Render y Netlify

Frontend y backend publicados en las URLs indicadas al inicio. Se verificaron las rutas del portal, administración y `/api/health` a través del proxy Netlify; todas responden HTTP 200. Render permite el origen exacto del frontend y rechaza orígenes ajenos con HTTP 403. El estado de la integración con Firebase se indica en el bloque de estado al inicio de este documento.

Netlify se publicó desde el build local en el equipo `keyorellana453`; `BACKEND_URL` está guardado en su contexto production. Para repetir la publicación, ejecutar `npm run build:frontend` con esa variable y `netlify deploy --dir dist/frontend --prod --no-build`. El backend se administra directamente en Render como `atencion-ciudadana-api-orem6`, conectado al repositorio de este proyecto.

### Backend en Render

Crear un **Web Service** Node conectado al repositorio de este proyecto:

- Build command: `npm ci --include=dev && npm run build:backend`
- Start command: `npm run start:backend`
- Health check: `/healthz`
- Plan: Free.
- Variables: `NODE_ENV=production`, `NODE_VERSION=22`, `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY` y `FRONTEND_URL` con el origen HTTPS exacto de Netlify, sin barra final.
- `RENDER_EXTERNAL_URL` lo proporciona Render; se utiliza para formar la URL HTTPS canónica y emitir cookies Secure. Si el proveedor no lo entrega, establecer `PUBLIC_BACKEND_URL` con la URL HTTPS del backend.

`render.yaml` es una plantilla alternativa para una instalación nueva; no administra el servicio existente, que fue creado directamente en Render. Las variables del servicio actual se actualizan directamente en Render. No aplicar la plantilla para actualizarlo, pues podría crear un segundo servicio.

### Frontend en Netlify

Crear un proyecto estático conectado al mismo repositorio:

- Build command: `npm run build:frontend`
- Publish directory: `dist/frontend`
- Variable de compilación: `BACKEND_URL=https://atencion-ciudadana-api-orem6.onrender.com`.
- `netlify.toml` ya contiene los ajustes de compilación. No se necesitan funciones de Next.js para este frontend estático.

El build exige una URL HTTPS válida y genera `_redirects` con el proxy API antes del fallback SPA. Cambiar `BACKEND_URL` requiere recompilar/publicar el frontend; cambiar `FRONTEND_URL` requiere reiniciar/publicar Render. El backend solo acepta el origen exacto configurado. No se utiliza CORS abierto ni cookies de terceros.

### Comprobación posterior al despliegue

1. Visitar `https://URL-RENDER/healthz` y `https://URL-NETLIFY/api/health`; ambos deben responder JSON.
2. `configured: true` indica que existen las variables Firebase. En cada instalación nueva, complementa esa respuesta con una escritura real para comprobar configuración, permisos y reglas.
3. Enviar un reporte desde Netlify, revisar la constancia y abrirlo desde el panel municipal.
4. Confirmar descripción, fotografía y estado persistidos tras recargar.

Render Free puede tardar en iniciar después de inactividad y el proxy de Netlify tiene un límite de 26 segundos. La interfaz informa del error y reintenta únicamente la consulta inicial de estado, nunca un envío de reporte automáticamente.

Para compilar manualmente en PowerShell:

```powershell
npm run build:backend
$env:BACKEND_URL = 'https://atencion-ciudadana-api-orem6.onrender.com'
npm run build:frontend
```

Referencias: [Render Node](https://render.com/docs/deploy-node-express-app), [proxy Netlify](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/).

## 🗃️ Modelo de datos

- `reports/{uuid}`: `id`, `code`, `title`, `description`, `category`, `location`, `name`, `email`, `ownerUid`, `status`, `createdAt`, `updatedAt`, `hasPhoto`.
- `photos/{uuid}`: `ownerUid`, `data` (JPEG base64). Comparte el UUID con el reporte. Se consulta al abrir el detalle para no descargar todas las fotografías al listar.
- `admins/{uid}`: `enabled: true`. Se administra desde la consola de Firebase o mediante una operación administrativa autorizada; nunca desde el portal ciudadano.

El reporte y la foto se escriben en una sola operación atómica `documents:commit`: ambos se guardan o ninguno. Las reglas también exigen que existan juntos y bloquean la modificación de la descripción original. Las fechas se generan en el backend en UTC y se muestran en la zona horaria del navegador.

Se utiliza Firestore para guardar una fotografía pequeña por reporte porque Cloud Storage requiere Blaze. Esta elección sirve para la escala académica y está sujeta a las cuotas gratuitas de Firestore. Una fotografía por documento permanece por debajo de 1 MiB. Para volúmenes grandes se debería migrar a almacenamiento de objetos y agregar controles de abuso; el alcance actual es una entrega académica, no una puesta en producción municipal a gran escala.

## 🔌 API REST

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

## 🧪 Pruebas y demostración

Verificado el 14 de noviembre de 2026: compilación, revisión TypeScript, vistas de escritorio/móvil y **16 pruebas de integración aprobadas** con Firebase Auth y Firestore Emulator. También se aprobaron **7 pruebas HTTP del servidor Node**, incluyendo validación de origen, límite del cuerpo y atributos de cookies.

<!-- FIREBASE_VERIFICATION_START -->
### Verificación de producción

El **14 de noviembre de 2026 a las 10:14, hora de Guatemala** (`2026-11-14T16:14:25.885Z`), se aprobaron **12 comprobaciones mediante solicitudes HTTP a `/api` del dominio Netlify**, pasando por el proxy a Render y la base de datos real de Firebase.

| Comprobación | Resultado |
| --- | --- |
| Estado de la API | `configured: true` |
| Registro real | Reporte `MUN-EB99DC70` creado con fotografía |
| Persistencia de la fotografía | Los 117 794 bytes enviados se recuperaron sin cambios |
| Descripción original | Recuperada sin alteraciones |
| Reintento de envío | El mismo identificador no generó un reporte duplicado |
| Administración | Inicio de sesión, listado y detalle accesibles para la cuenta autorizada |
| Cambio de estado | **En revisión**, conservado al consultar desde una nueva sesión |
| Restricciones de acceso | Ciudadanía sin acceso al listado municipal y Firestore sin autenticación rechazado con HTTP 403 |

Estas comprobaciones verifican el funcionamiento de la **API publicada y la persistencia real**. La revisión visual de las pantallas se realizó por separado; no se presenta esta prueba como una automatización completa del formulario en el navegador. La fotografía y las credenciales utilizadas no se incluyen en el repositorio.
<!-- FIREBASE_VERIFICATION_END -->

Comprobaciones del proyecto:

```powershell
npm run check
node --test tests/render-server.test.mjs tests/http-client.test.mjs
```

Para ejecutar las pruebas de integración se requiere Java 21 o superior. La CLI de Firebase se obtiene mediante `npx`:

```powershell
npx -y firebase-tools@latest emulators:exec --project demo-municipio --only auth,firestore "node tests/firebase.integration.mjs"
```

Las pruebas usan Auth y Firestore locales, ejecutan el backend real y redirigen únicamente el transporte de red hacia los emuladores. No escriben en un proyecto de producción. Incluyen persistencia del reporte/foto, recuperación, cambios de estado, permisos, validación y reintentos. Los datos y usuarios de prueba se crean solamente dentro del emulador.

Para demostrar las Series I y II con tu Firebase real:

1. Envía un reporte con fotografía desde el portal y guarda el número de confirmación.
2. Comprueba en la consola Firebase los documentos `reports` y `photos` con el mismo UUID.
3. Entra al panel municipal y abre ese reporte; verifica descripción y fotografía.
4. Cambia el estado, recarga la página y verifica que se conserva.
5. Cierra la sesión y comprueba que no puedes consultar el listado.

## 📚 Referencias oficiales

- [Firestore REST y autenticación](https://firebase.google.com/docs/firestore/use-rest-api)
- [Firebase Authentication REST](https://firebase.google.com/docs/reference/rest/auth)
- [Reglas de seguridad](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Cuotas gratuitas y límites](https://firebase.google.com/docs/firestore/quotas)
- [Requisito Blaze de Cloud Storage](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)
