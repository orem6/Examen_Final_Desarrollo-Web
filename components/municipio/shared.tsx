"use client";
import { Building2, ArrowUpRight, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
export async function api(path: string, options: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error(
      "No hay conexión con el servidor. Revisa tu conexión e intenta nuevamente.",
    );
  }
  const data = (await response.json()) as any;
  if (!response.ok)
    throw Object.assign(
      new Error(data.error || "No se pudo completar la solicitud."),
      { status: response.status },
    );
  return data;
}
export function useConnection() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  useEffect(() => {
    api("health")
      .then((data) => setConfigured(data.configured))
      .catch(() => setConfigured(false));
  }, []);
  return configured;
}
export function Header({ admin = false }: { admin?: boolean }) {
  return (
    <header className="site-header">
      <a href="/" className="brand" aria-label="Municipio, inicio">
        <span className="brand-icon">
          <Building2 size={25} />
        </span>
        <span>
          municipio<span className="brand-caption">ATENCIÓN CIUDADANA</span>
        </span>
      </a>
      <nav>
        <a className={!admin ? "nav-active" : ""} href="/">
          Portal ciudadano
        </a>
        <a className={admin ? "nav-active" : ""} href="/admin">
          Administración <ArrowUpRight size={15} />
        </a>
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <span>
        municipio <span>·</span> Una comunidad que participa, mejora.
      </span>
      <span>
        <ShieldCheck size={15} /> Tus datos tienen acceso restringido
      </span>
    </footer>
  );
}
export function ConnectionNotice({
  configured,
}: {
  configured: boolean | null;
}) {
  return configured === false ? (
    <div className="connection-notice" role="status">
      Conexión pendiente. El registro se habilitará cuando se configure
      Firebase.
    </div>
  ) : null;
}
export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`status-badge status-${["Recibido", "En revisión", "En proceso", "Resuelto"].indexOf(value)}`}
    >
      <i />
      {value}
    </span>
  );
}
