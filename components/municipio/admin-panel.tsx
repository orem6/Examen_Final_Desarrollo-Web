"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Search,
  RefreshCw,
  ClipboardList,
  Clock3,
  CheckCircle2,
  Wrench,
  X,
  MapPin,
  CalendarDays,
  LogOut,
  LockKeyhole,
  Camera,
  ChevronRight,
  Inbox,
  UserRound,
} from "lucide-react";
import { categories, statuses, type Report } from "@/lib/reports";
import {
  Header,
  Footer,
  ConnectionNotice,
  api,
  useConnection,
  formatDate,
  StatusBadge,
} from "./shared";
export default function AdminPanel() {
  const configured = useConnection();
  const [user, setUser] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<{
    report: Report;
    photo: string;
  } | null>(null);
  const [detailError, setDetailError] = useState("");
  const [saving, setSaving] = useState(false);
  const [detailBusy, setDetailBusy] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const loginDialog = useRef<HTMLDialogElement>(null),
    detailDialog = useRef<HTMLDialogElement>(null);
  const requestNumber = useRef(0);
  const expire = (e: unknown) => {
    if (
      (e as { status?: number }).status === 401 ||
      (e as { status?: number }).status === 403
    ) {
      setUser("");
      setReports([]);
      setLoaded(false);
    }
  };
  async function load(append = false) {
    setLoading(true);
    setError("");
    try {
      const data = await api(
        `reports${append && cursor ? "?cursor=" + encodeURIComponent(cursor) : ""}`,
      );
      setReports((old) =>
        append
          ? [...old, ...data.reports].filter(
              (r, i, a) => a.findIndex((x) => x.id === r.id) === i,
            )
          : data.reports,
      );
      setCursor(data.nextCursor);
      setLoaded(true);
    } catch (e) {
      setError((e as Error).message);
      expire(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    api("me")
      .then((data) => {
        setUser(data.email);
        void load();
      })
      .catch(() => {});
  }, []);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const data = await api("login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      setUser(data.email);
      loginDialog.current?.close();
      void load();
    } catch (err) {
      setLoginError((err as Error).message);
      setLoading(false);
    }
  }
  async function openReport(id: string) {
    const n = ++requestNumber.current;
    setDetailBusy(true);
    setDetailError("");
    setSelected(null);
    detailDialog.current?.showModal();
    try {
      const data = await api(`reports/${id}`);
      if (n !== requestNumber.current) return;
      setSelected(data);
      setNewStatus(data.report.status);
    } catch (e) {
      setDetailError((e as Error).message);
      expire(e);
    } finally {
      if (n === requestNumber.current) setDetailBusy(false);
    }
  }
  async function saveStatus() {
    if (!selected) return;
    setSaving(true);
    setDetailError("");
    try {
      const data = await api(`reports/${selected.report.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setSelected({ ...selected, report: data.report });
      setReports((old) =>
        old.map((r) => (r.id === data.report.id ? data.report : r)),
      );
    } catch (e) {
      setDetailError((e as Error).message);
      expire(e);
    } finally {
      setSaving(false);
    }
  }
  const filtered = reports.filter(
    (r) =>
      (!category || r.category === category) &&
      (!status || r.status === status) &&
      `${r.code} ${r.title} ${r.description} ${r.location}`
        .toLocaleLowerCase("es")
        .includes(query.toLocaleLowerCase("es")),
  );
  const stats = [
    { title: "Reportes cargados", value: reports.length, icon: ClipboardList },
    {
      title: "Por revisar",
      value: reports.filter(
        (r) => r.status === "Recibido" || r.status === "En revisión",
      ).length,
      icon: Clock3,
    },
    {
      title: "En proceso",
      value: reports.filter((r) => r.status === "En proceso").length,
      icon: Wrench,
    },
    {
      title: "Resueltos",
      value: reports.filter((r) => r.status === "Resuelto").length,
      icon: CheckCircle2,
    },
  ];
  return (
    <>
      <Header admin />
      <main className="admin-main">
        <ConnectionNotice configured={configured} />
        <div className="admin-title">
          <div>
            <p className="eyebrow">GESTIÓN MUNICIPAL</p>
            <h1>La comunidad, en perspectiva.</h1>
            <p>Consulta los reportes ciudadanos y organiza su atención.</p>
          </div>
          {user ? (
            <div className="user-chip">
              <span>
                <UserRound size={16} />
                {user}
              </span>
              <button
                className="text-button"
                onClick={async () => {
                  try {
                    await api("logout", { method: "POST" });
                    setUser("");
                    setReports([]);
                    setLoaded(false);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <LogOut size={15} /> Salir
              </button>
            </div>
          ) : (
            <button
              className="primary"
              onClick={() => loginDialog.current?.showModal()}
            >
              <LockKeyhole size={17} /> Acceso municipal
            </button>
          )}
        </div>
        <div className="stats-grid">
          {stats.map(({ title, value, icon: Icon }, i) => (
            <div className="stat-card" key={title}>
              <span className={`stat-icon stat-icon-${i}`}>
                <Icon size={20} />
              </span>
              <div>
                <span>{title}</span>
                <strong>{user && loaded ? value : "—"}</strong>
              </div>
            </div>
          ))}
        </div>
        <section className="card reports-card">
          <div className="reports-title">
            <div>
              <h2>Reportes ciudadanos</h2>
              <p>
                {user && loaded
                  ? `${reports.length} registros cargados${cursor ? " · Hay más disponibles" : ""}`
                  : "Información de la comunidad en un solo lugar"}
              </p>
            </div>
            <button
              className="secondary"
              disabled={!user || loading}
              onClick={() => void load()}
            >
              <RefreshCw size={16} className={loading ? "spin" : ""} />{" "}
              Actualizar
            </button>
          </div>
          <div className="filters">
            <div className="input-icon search-input">
              <Search size={18} />
              <input
                type="search"
                aria-label="Buscar reportes"
                placeholder="Buscar por título, número o ubicación…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={!user}
              />
            </div>
            <select
              aria-label="Filtrar por categoría"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={!user}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              aria-label="Filtrar por estado"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={!user}
            >
              <option value="">Todos los estados</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          {error && (
            <div className="error-message table-error" role="alert">
              {error}
            </div>
          )}
          {!user ? (
            <div className="empty-state">
              <span className="empty-icon">
                <LockKeyhole size={29} />
              </span>
              <h3>Un espacio para el equipo municipal</h3>
              <p>
                Inicia sesión para consultar las descripciones, ver las
                <br /> fotografías y gestionar los reportes registrados.
              </p>
              <button
                className="text-button"
                onClick={() => loginDialog.current?.showModal()}
              >
                Iniciar sesión <ArrowRight size={16} />
              </button>
            </div>
          ) : loading && !loaded ? (
            <div className="empty-state" role="status">
              <RefreshCw className="spin" />
              <p>Consultando reportes…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">
                <Inbox size={30} />
              </span>
              <h3>
                {reports.length
                  ? "No encontramos coincidencias"
                  : "Todavía no hay reportes"}
              </h3>
              <p>
                {reports.length
                  ? "Prueba con otra búsqueda o cambia los filtros."
                  : "Los reportes registrados en el portal aparecerán aquí."}
              </p>
              {reports.length > 0 && (
                <button
                  className="text-button"
                  onClick={() => {
                    setQuery("");
                    setCategory("");
                    setStatus("");
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Reporte</th>
                    <th>Categoría / ubicación</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>
                      <span className="visually-hidden">Consultar</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <small className="report-code">{r.code}</small>
                        <button
                          className="report-link"
                          onClick={() => void openReport(r.id)}
                        >
                          {r.title}
                        </button>
                        <span className="report-excerpt">{r.description}</span>
                      </td>
                      <td>
                        <span>{r.category}</span>
                        <small className="location-cell">
                          <MapPin size={12} />
                          {r.location}
                        </small>
                      </td>
                      <td>
                        <span className="date-cell">
                          {formatDate(r.createdAt)}
                        </span>
                      </td>
                      <td>
                        <StatusBadge value={r.status} />
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`Ver reporte ${r.code}`}
                          onClick={() => void openReport(r.id)}
                        >
                          <ChevronRight size={19} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="table-footer">
            <span>
              {user && loaded
                ? `${filtered.length} resultados en los registros cargados`
                : "Acceso restringido al personal autorizado"}
            </span>
            {user && cursor && (
              <button
                className="secondary"
                onClick={() => void load(true)}
                disabled={loading}
              >
                {loading ? "Cargando…" : "Cargar más reportes"}
              </button>
            )}
            <span>
              <Camera size={14} /> Fotografías disponibles en el detalle
            </span>
          </div>
        </section>
      </main>
      <Footer />
      <dialog ref={loginDialog} className="login-dialog">
        <button
          className="dialog-close icon-button"
          aria-label="Cerrar acceso municipal"
          onClick={() => loginDialog.current?.close()}
        >
          <X size={20} />
        </button>
        <span className="empty-icon">
          <LockKeyhole size={28} />
        </span>
        <p className="eyebrow">ACCESO RESTRINGIDO</p>
        <h2>Bienvenido al panel municipal</h2>
        <p>Ingresa con tu cuenta autorizada.</p>
        <form onSubmit={login}>
          <label className="field-label" htmlFor="admin-email">
            Correo electrónico
          </label>
          <input
            type="email"
            id="admin-email"
            name="email"
            autoComplete="username"
            required
            maxLength={150}
          />
          <label className="field-label" htmlFor="password">
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            required
            maxLength={200}
          />
          {loginError && (
            <div className="error-message" role="alert">
              {loginError}
            </div>
          )}
          {configured === false && (
            <div className="connection-notice">
              Primero debe configurarse la conexión a Firebase.
            </div>
          )}
          <button className="primary" disabled={loading || configured !== true}>
            {loading ? "Validando acceso…" : "Ingresar al panel"}
            <ArrowRight size={17} />
          </button>
        </form>
      </dialog>
      <dialog ref={detailDialog} className="detail-dialog">
        <button
          className="dialog-close icon-button"
          aria-label="Cerrar detalle del reporte"
          onClick={() => {
            requestNumber.current++;
            detailDialog.current?.close();
          }}
        >
          <X size={20} />
        </button>
        {detailBusy ? (
          <div className="empty-state">
            <RefreshCw className="spin" />
            <p>Cargando reporte y fotografía…</p>
          </div>
        ) : (
          selected && (
            <>
              <p className="eyebrow">{selected.report.code}</p>
              <h2>{selected.report.title}</h2>
              <div className="detail-meta">
                <StatusBadge value={selected.report.status} />
                <span>
                  <CalendarDays size={15} />
                  {formatDate(selected.report.createdAt)}
                </span>
              </div>
              <div className="detail-grid">
                <div>
                  <h3>Descripción original</h3>
                  <p className="original-description">
                    {selected.report.description}
                  </p>
                  <h3>Ubicación</h3>
                  <p>
                    <MapPin size={15} /> {selected.report.location}
                  </p>
                  <h3>Categoría</h3>
                  <p>{selected.report.category}</p>
                  <h3>Datos de contacto</h3>
                  <p>
                    {selected.report.name || "Nombre no proporcionado"}
                    <br />
                    {selected.report.email || "Correo no proporcionado"}
                  </p>
                </div>
                <div>
                  <h3>Fotografía del reporte</h3>
                  <a
                    href={selected.photo}
                    target="_blank"
                    rel="noreferrer"
                    className="detail-photo-link"
                  >
                    <img
                      className="detail-photo"
                      src={selected.photo}
                      alt={`Fotografía asociada: ${selected.report.title}`}
                    />
                  </a>
                  <small>Imagen optimizada al momento del registro.</small>
                </div>
              </div>
              <div className="status-control">
                <div>
                  <label className="field-label" htmlFor="new-status">
                    Estado de atención
                  </label>
                  <select
                    id="new-status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    disabled={saving}
                  >
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="primary"
                  disabled={saving || newStatus === selected.report.status}
                  onClick={() => void saveStatus()}
                >
                  {saving ? "Guardando…" : "Guardar estado"}
                  <CheckCircle2 size={17} />
                </button>
              </div>
              <small className="muted">
                Última actualización: {formatDate(selected.report.updatedAt)}
              </small>
            </>
          )
        )}
        {detailError && (
          <div className="error-message" role="alert">
            {detailError}
          </div>
        )}
      </dialog>
    </>
  );
}
