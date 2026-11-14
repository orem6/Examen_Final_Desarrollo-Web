"use client";
import { Building2, ArrowUpRight, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { requestApi } from "@/lib/http-client";
export const api = requestApi;
export function useConnection() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    // Only the read-only health check is retried after a Render cold start.
    // Report creation and other mutations are never automatically repeated.
    const check = async () => {
      try {
        const data = await api("health");
        if (!cancelled) setConfigured(data.configured === true);
      } catch {
        if (cancelled) return;
        if (++attempts < 3) timer = setTimeout(check, 10000);
        else setConfigured(false);
      }
    };
    void check();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
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
