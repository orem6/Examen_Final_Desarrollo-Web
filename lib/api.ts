import {
  ApiError,
  validateReport,
  encodeFields,
  decodeFields,
  statuses,
} from "./reports";
type Config = { FIREBASE_PROJECT_ID?: string; FIREBASE_API_KEY?: string; FRONTEND_URL?: string };
type Auth = { idToken: string; localId: string; email?: string };
const security = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
export async function handleApi(
  request: Request,
  config: Config,
): Promise<Response> {
  const url = new URL(request.url),
    path = url.pathname.replace(/^\/api\//, ""),
    method = request.method;
  const reply = (data: unknown, status = 200, cookie?: string) =>
    Response.json(data, {
      status,
      headers: { ...security, ...(cookie ? { "Set-Cookie": cookie } : {}) },
    });
  try {
    if (
      method !== "GET" &&
      request.headers.get("origin") &&
      request.headers.get("origin") !== url.origin &&
      !(config.FRONTEND_URL || '').split(',').map(value => value.trim()).filter(Boolean).includes(request.headers.get("origin")!)
    )
      throw new ApiError(403, "Origen de la solicitud no permitido.");
    if (path === "health" && method === "GET")
      return reply({
        configured: !!(config.FIREBASE_PROJECT_ID && config.FIREBASE_API_KEY),
      });
    if (!config.FIREBASE_PROJECT_ID || !config.FIREBASE_API_KEY)
      throw new ApiError(
        503,
        "El servicio está pendiente de conexión a Firebase. Todavía no se pueden registrar reportes.",
      );
    const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.FIREBASE_PROJECT_ID)}/databases/(default)/documents`;
    const authBase = "https://identitytoolkit.googleapis.com/v1/accounts:";
    const upstream = async (target: string, init?: RequestInit) => {
      let response: Response;
      try {
        response = await fetch(target, {
          ...init,
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        throw new ApiError(
          502,
          "No fue posible conectar con Firebase. Intenta nuevamente.",
        );
      }
      const data = (await response.json()) as any;
      if (!response.ok) {
        if (response.status === 409)
          throw new ApiError(409, "El reporte ya existe.");
        if (response.status === 404)
          throw new ApiError(404, "No se encontró el registro.");
        if (
          response.status === 429 ||
          data.error?.message?.includes("TOO_MANY")
        )
          throw new ApiError(
            429,
            "Se alcanzó el límite temporal del servicio. Intenta más tarde.",
          );
        if (response.status === 401 || target.includes("accounts:"))
          throw new ApiError(
            401,
            "No se pudo validar el acceso. Revisa tus datos o inicia sesión nuevamente.",
          );
        if (response.status === 403)
          throw new ApiError(
            403,
            "No tienes permiso para realizar esta operación. Revisa el acceso municipal y las reglas de Firebase.",
          );
        throw new ApiError(
          502,
          "Firebase no pudo completar la operación. Revisa la configuración del proyecto.",
        );
      }
      return data;
    };
    const authCall = (action: string, data: unknown) =>
      upstream(
        `${authBase}${action}?key=${encodeURIComponent(config.FIREBASE_API_KEY!)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
    const cookie = (token: string, age = 3300) =>
      `municipio_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${age}${url.protocol === "https:" ? "; Secure" : ""}`;
    const readAuth = async (): Promise<Auth> => {
      const token = request.headers
        .get("cookie")
        ?.split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("municipio_session="))
        ?.slice(18);
      if (!token) throw new ApiError(401, "Inicia sesión para continuar.");
      const idToken = decodeURIComponent(token),
        data = await authCall("lookup", { idToken });
      if (!data.users?.[0])
        throw new ApiError(401, "La sesión expiró. Inicia sesión nuevamente.");
      return {
        idToken,
        localId: data.users[0].localId,
        email: data.users[0].email,
      };
    };
    const firestore = (suffix: string, auth: Auth, init?: RequestInit) =>
      upstream(base + suffix, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.idToken}`,
        },
      });
    const admin = async (auth: Auth) => {
      let enabled = false;
      try {
        const doc = await firestore(
          `/admins/${encodeURIComponent(auth.localId)}`,
          auth,
        );
        enabled = decodeFields(doc).enabled === true;
      } catch (error) {
        if (!(error instanceof ApiError) || ![403, 404].includes(error.status))
          throw error;
      }
      if (!enabled)
        throw new ApiError(
          403,
          "Tu cuenta no tiene acceso municipal. Solicita que habiliten tu UID en la colección admins.",
        );
      return auth;
    };
    const body = async () => {
      if (!request.headers.get("content-type")?.startsWith("application/json"))
        throw new ApiError(415, "Envía la solicitud como JSON.");
      const reader = request.body?.getReader();
      if (!reader) throw new ApiError(400, "La solicitud está vacía.");
      let text = "",
        size = 0;
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 500000) {
          await reader.cancel();
          throw new ApiError(
            413,
            "La fotografía es demasiado grande. Selecciona otra imagen.",
          );
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
      try {
        const result = JSON.parse(text);
        if (!result || Array.isArray(result) || typeof result !== "object")
          throw new Error();
        return result;
      } catch {
        throw new ApiError(400, "El contenido de la solicitud no es válido.");
      }
    };
    if (path === "session" && method === "POST") {
      try {
        await readAuth();
        return reply({ ready: true });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
      }
      const auth = await authCall("signUp", { returnSecureToken: true });
      return reply({ ready: true }, 200, cookie(auth.idToken));
    }
    if (path === "login" && method === "POST") {
      const input = await body();
      if (
        typeof input.email !== "string" ||
        input.email.length > 150 ||
        typeof input.password !== "string" ||
        input.password.length > 200
      )
        throw new ApiError(400, "Ingresa un correo y una contraseña válidos.");
      const auth = await authCall("signInWithPassword", {
        email: input.email,
        password: input.password,
        returnSecureToken: true,
      });
      await admin(auth);
      return reply({ email: auth.email }, 200, cookie(auth.idToken));
    }
    if (path === "logout" && method === "POST")
      return reply({ ok: true }, 200, cookie("", 0));
    if (path === "me" && method === "GET") {
      const auth = await admin(await readAuth());
      return reply({ email: auth.email });
    }
    if (path === "reports" && method === "POST") {
      const input = validateReport(await body()),
        auth = await readAuth();
      const now = new Date().toISOString();
      const { photo, ...fields } = input;
      const report = {
        ...fields,
        code: `MUN-${input.id.slice(0, 8).toUpperCase()}`,
        ownerUid: auth.localId,
        status: "Recibido",
        createdAt: now,
        updatedAt: now,
        hasPhoto: true,
      };
      const documentBase = `projects/${config.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
      try {
        await firestore(":commit", auth, {
          method: "POST",
          body: JSON.stringify({
            writes: [
              {
                update: {
                  name: `${documentBase}/reports/${input.id}`,
                  fields: encodeFields(report),
                },
                currentDocument: { exists: false },
              },
              {
                update: {
                  name: `${documentBase}/photos/${input.id}`,
                  fields: encodeFields({ ownerUid: auth.localId, data: photo }),
                },
                currentDocument: { exists: false },
              },
            ],
          }),
        });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 409) throw error;
        const existing = decodeFields(
          await firestore(`/reports/${input.id}`, auth),
        );
        if (existing.ownerUid !== auth.localId)
          throw new ApiError(409, "Usa un nuevo identificador de reporte.");
        return reply(
          {
            id: existing.id,
            code: existing.code,
            createdAt: existing.createdAt,
          },
          200,
        );
      }
      return reply({ id: report.id, code: report.code, createdAt: now }, 201);
    }
    if (path === "reports" && method === "GET") {
      const auth = await admin(await readAuth());
      const params = new URLSearchParams({
        pageSize: "50",
        orderBy: "createdAt desc",
      });
      const cursor = url.searchParams.get("cursor");
      if (cursor) {
        if (cursor.length > 3000)
          throw new ApiError(400, "Paginación inválida.");
        params.set("pageToken", cursor);
      }
      const data = await firestore(`/reports?${params.toString().replace(/\+/g, "%20")}`, auth);
      return reply({
        reports: (data.documents || []).map(decodeFields),
        nextCursor: data.nextPageToken || null,
      });
    }
    const detail = /^reports\/([0-9a-f-]{36})$/.exec(path);
    if (detail && (method === "GET" || method === "PATCH")) {
      const auth = await admin(await readAuth()),
        id = detail[1];
      if (method === "PATCH") {
        const input = await body();
        if (!(statuses as readonly unknown[]).includes(input.status))
          throw new ApiError(400, "El estado no es válido.");
        const data = await firestore(
          `/reports/${id}?updateMask.fieldPaths=status&updateMask.fieldPaths=updatedAt&currentDocument.exists=true`,
          auth,
          {
            method: "PATCH",
            body: JSON.stringify({
              fields: encodeFields({
                status: input.status,
                updatedAt: new Date().toISOString(),
              }),
            }),
          },
        );
        return reply({ report: decodeFields(data) });
      }
      const report = decodeFields(await firestore(`/reports/${id}`, auth));
      const photo = decodeFields(await firestore(`/photos/${id}`, auth));
      return reply({ report, photo: photo.data });
    }
    throw new ApiError(404, "Esta ruta no existe.");
  } catch (error) {
    if (error instanceof ApiError)
      return reply({ error: error.message }, error.status);
    return reply(
      { error: "Ocurrió un error inesperado. Intenta nuevamente." },
      500,
    );
  }
}
