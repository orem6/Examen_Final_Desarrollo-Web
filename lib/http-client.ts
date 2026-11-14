/** Requests stay on the frontend origin; Netlify proxies /api to Render. */
export async function requestApi(path: string, options: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, {
      ...options,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...options.headers },
      signal: options.signal || AbortSignal.timeout(30000),
    });
  } catch (error) {
    const timedOut = error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);
    throw new Error(timedOut
      ? "El servidor está tardando en responder o se está iniciando. Espera un momento e intenta nuevamente."
      : "No hay conexión con el servidor. Revisa tu conexión e intenta nuevamente.");
  }
  let data: any;
  try { data = await response.json(); }
  catch {
    throw Object.assign(new Error(
      response.status >= 500
        ? "El servidor se está iniciando o no está disponible. Espera un momento e intenta nuevamente."
        : "El servidor devolvió una respuesta inesperada. Intenta nuevamente."
    ), { status: response.status });
  }
  if (!response.ok) {
    throw Object.assign(new Error(
      typeof data?.error === "string" ? data.error : "No se pudo completar la solicitud."
    ), { status: response.status });
  }
  if (!data || typeof data !== "object") throw new Error("El servidor devolvió una respuesta inesperada.");
  return data;
}
