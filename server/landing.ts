export function landingPage(frontendOrigins: string): string {
  let portal = '';
  for (const candidate of frontendOrigins.split(',')) {
    try {
      const url = new URL(candidate.trim());
      if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) {
        portal = url.origin;
        break;
      }
    } catch { /* Una dirección inválida no se publica como enlace. */ }
  }
  const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Atención Ciudadana · Servicio en línea</title>
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f6f5f0;color:#193d35;font-family:system-ui,sans-serif}
    main{width:100%;max-width:620px;background:#fff;border:1px solid #dce5de;border-radius:24px;padding:clamp(24px,6vw,48px);box-shadow:0 12px 48px #173d3510}
    .status{display:inline-block;border-radius:24px;padding:7px 12px;background:#e7f4eb;color:#22603d;font-size:14px;font-weight:600}
    h1{font-size:clamp(28px,6vw,40px);line-height:1.15;margin:24px 0 16px;letter-spacing:-1px}p{color:#53655e;line-height:1.7;margin:0 0 24px}
    nav{display:flex;gap:12px;flex-wrap:wrap}a{color:#285a46;text-underline-offset:4px}nav a{padding:13px 18px;border:1px solid #ccdcd1;border-radius:10px;font-weight:600;text-decoration:none}
    nav a:first-child{background:#285a46;color:#fff;border-color:#285a46}a:focus-visible{outline:3px solid #dfab39;outline-offset:4px}footer{margin-top:30px;padding-top:22px;border-top:1px solid #e6ebe7;font-size:14px;line-height:1.7}
  </style>
</head>
<body><main>
  <span class="status">● Servidor en línea</span>
  <h1>Atención Ciudadana</h1>
  <p>Este servicio recibe y consulta los reportes del municipio. Para registrar un reporte o ingresar a la administración, abre el portal.</p>
  ${portal ? `<nav aria-label="Acceso al sistema"><a href="${escape(portal)}/">Abrir portal ciudadano</a><a href="${escape(portal)}/admin">Panel municipal</a></nav>` : '<p>El enlace al portal todavía no está configurado.</p>'}
  <footer>Backend / API · Render<br><a href="/healthz">Consultar estado de la API</a></footer>
</main></body></html>`;
}
