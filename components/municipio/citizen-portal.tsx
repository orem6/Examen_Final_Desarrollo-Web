"use client";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Camera,
  MapPin,
  Lightbulb,
  Droplets,
  Trash2,
  Trees,
  Route,
  Ellipsis,
  ShieldCheck,
  X,
  FileCheck2,
  ClipboardList,
  Send,
} from "lucide-react";
import { categories } from "@/lib/reports";
import {
  Header,
  Footer,
  ConnectionNotice,
  api,
  useConnection,
  formatDate,
} from "./shared";
const icons = [Route, Lightbulb, Droplets, Trash2, Trees, Ellipsis];
async function compressPhoto(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Selecciona una imagen JPG, PNG o WebP.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("La fotografía debe pesar como máximo 10 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (img.width * img.height > 50000000)
      throw new Error(
        "La imagen tiene demasiados píxeles. Selecciona una versión más pequeña.",
      );
    const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No fue posible procesar la fotografía.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let photo = "";
    for (let quality = 0.85; quality >= 0.25; quality -= 0.1) {
      photo = canvas.toDataURL("image/jpeg", quality);
      if (photo.length < 460000) return photo;
    }
    throw new Error(
      "No se pudo reducir esta fotografía. Selecciona una imagen más pequeña.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
function CommunityArt() {
  return (
    <svg viewBox="0 0 400 210" className="community-art" aria-hidden="true">
      <circle cx="232" cy="102" r="95" fill="#e0e8d7" />
      <circle cx="325" cy="42" r="16" fill="#d9ac67" />
      <path d="M20 184H385" stroke="#94a68b" strokeWidth="2" />
      <path d="M94 182V91l42-24 42 24v91" fill="#c3d0b8" />
      <path
        d="M167 182V64l60-31 60 31v118"
        fill="#f7f8ef"
        stroke="#64806a"
        strokeWidth="2"
      />
      <path
        d="M159 66l68-36 68 36M198 182v-45h58v45"
        fill="none"
        stroke="#64806a"
        strokeWidth="2"
      />
      <path
        d="M197 80h13v20h-13zm47 0h13v20h-13zM114 110h12v18h-12zm29 0h12v18h-12zM114 146h12v18h-12zm29 0h12v18h-12z"
        fill="#7d997d"
      />
      <circle cx="227" cy="65" r="8" fill="#d9ac67" />
      <path d="M282 182V117l30-18 32 18v65" fill="#9fb79a" />
      <path d="M294 133h11v17h-11zm25 0h11v17h-11z" fill="#f3f4e9" />
      <rect x="309" y="162" width="11" height="20" fill="#52735a" />
      <path d="M58 180v-50m299 50v-49" stroke="#52735a" strokeWidth="4" />
      <ellipse cx="58" cy="116" rx="24" ry="35" fill="#6f9476" />
      <ellipse cx="357" cy="118" rx="19" ry="29" fill="#6f9476" />
      <path
        d="M46 201c68-14 238-14 320 0"
        stroke="#b8c9ad"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M48 47l7-4 7 4m14-16 7-4 7 4"
        stroke="#6f9476"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}
export default function CitizenPortal() {
  const configured = useConnection();
  const [category, setCategory] = useState("");
  const [photo, setPhoto] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [count, setCount] = useState(0);
  const [receipt, setReceipt] = useState<{
    code: string;
    createdAt: string;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const reportId = useRef("");
  const upload = async (file?: File) => {
    if (!file) return;
    setProcessing(true);
    setError("");
    setPhoto("");
    try {
      const result = await compressPhoto(file);
      setPhoto(result);
      setPhotoName(file.name);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessing(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!category) {
      setError("Selecciona el tipo de reporte.");
      return;
    }
    if (!photo) {
      setError("Adjunta una fotografía relacionada con el reporte.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    if (!reportId.current) reportId.current = crypto.randomUUID();
    try {
      await api("session", { method: "POST" });
      const data = await api("reports", {
        method: "POST",
        body: JSON.stringify({
          id: reportId.current,
          category,
          photo,
          title: form.get("title"),
          description: form.get("description"),
          location: form.get("location"),
          name: form.get("name") || "",
          email: form.get("email") || "",
        }),
      });
      setReceipt(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main className="public-main">
        <ConnectionNotice configured={configured} />
        {receipt ? (
          <section className="receipt card" aria-live="polite">
            <div className="success-icon">
              <CheckCircle2 size={38} />
            </div>
            <p className="eyebrow">GRACIAS POR PARTICIPAR</p>
            <h1>Tu reporte ya está registrado.</h1>
            <p>
              La información y la fotografía se guardaron correctamente.
              <br />
              El equipo municipal podrá consultarlas para su revisión.
            </p>
            <div className="receipt-code">
              <small>NÚMERO DE REPORTE</small>
              <strong>{receipt.code}</strong>
              <span>{formatDate(receipt.createdAt)}</span>
            </div>
            <p className="muted">
              Guarda este número como constancia de tu registro.
            </p>
            <button
              className="primary"
              onClick={() => {
                setReceipt(null);
                setPhoto("");
                setCategory("");
                setCount(0);
                reportId.current = "";
              }}
            >
              Crear otro reporte <ArrowRight size={17} />
            </button>
          </section>
        ) : (
          <>
            <section className="hero">
              <div>
                <div className="eyebrow">
                  <span className="little-line" /> JUNTOS CUIDAMOS NUESTRO
                  MUNICIPIO
                </div>
                <h1>
                  Tu voz mejora
                  <br />
                  nuestra <em>comunidad.</em>
                </h1>
                <p>
                  Cuéntanos qué necesita atención. Tu reporte es el primer
                  <br className="desktop-break" /> paso para construir un mejor
                  lugar para todos.
                </p>
              </div>
              <div className="hero-art">
                <CommunityArt />
                <span>
                  <span className="green-dot" /> Cada reporte cuenta
                </span>
              </div>
            </section>
            <div className="portal-grid">
              <form className="card report-form" onSubmit={submit}>
                <div className="form-heading">
                  <div>
                    <span className="eyebrow">PORTAL CIUDADANO</span>
                    <h2>Crear un reporte</h2>
                  </div>
                  <span className="required-note">* Campos obligatorios</span>
                </div>
                <fieldset disabled={busy}>
                  <section className="form-section">
                    <h3>
                      <span className="step-number">01</span> ¿Qué necesita
                      atención?
                    </h3>
                    <label className="field-label">
                      Tipo de reporte <span>*</span>
                    </label>
                    <div
                      className="category-grid"
                      role="radiogroup"
                      aria-label="Tipo de reporte"
                    >
                      {categories.map((value, i) => {
                        const Icon = icons[i];
                        return (
                          <label
                            className={`category ${category === value ? "selected" : ""}`}
                            key={value}
                          >
                            <input
                              type="radio"
                              name="category"
                              value={value}
                              checked={category === value}
                              onChange={() => setCategory(value)}
                              required
                            />
                            <Icon size={22} />
                            <span>{value}</span>
                            {category === value && (
                              <Check size={13} className="category-check" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                    <label className="field-label" htmlFor="title">
                      Título del reporte <span>*</span>
                    </label>
                    <input
                      id="title"
                      name="title"
                      placeholder="Ej. Luminaria apagada frente al parque"
                      required
                      minLength={5}
                      maxLength={120}
                    />
                    <div className="label-row">
                      <label className="field-label" htmlFor="description">
                        Describe lo que sucede <span>*</span>
                      </label>
                      <small>{count}/3000</small>
                    </div>
                    <textarea
                      id="description"
                      name="description"
                      placeholder="Describe el problema, desde cuándo ocurre y los detalles que puedan ayudarnos a atenderlo."
                      required
                      minLength={20}
                      maxLength={3000}
                      rows={4}
                      onChange={(e) => setCount(e.target.value.length)}
                    />
                    <small className="field-help">
                      Incluye al menos 20 caracteres. Evita información personal
                      sensible.
                    </small>
                    <label className="field-label" htmlFor="location">
                      Ubicación del problema <span>*</span>
                    </label>
                    <div className="input-icon">
                      <MapPin size={18} />
                      <input
                        id="location"
                        name="location"
                        placeholder="Dirección, zona, barrio o punto de referencia"
                        required
                        minLength={5}
                        maxLength={250}
                      />
                    </div>
                  </section>
                  <section className="form-section">
                    <h3>
                      <span className="step-number">02</span> Agrega una
                      fotografía
                    </h3>
                    <p className="section-description">
                      Una imagen nos ayuda a entender mejor la situación.{" "}
                      <span>*</span>
                    </p>
                    <input
                      className="visually-hidden"
                      tabIndex={-1}
                      type="file"
                      ref={fileInput}
                      accept="image/jpeg,image/png,image/webp"
                      aria-label="Adjuntar fotografía"
                      onChange={(e) => void upload(e.target.files?.[0])}
                    />
                    {photo ? (
                      <div className="photo-preview">
                        <img
                          src={photo}
                          alt="Fotografía que se adjuntará al reporte"
                        />
                        <div>
                          <strong>{photoName}</strong>
                          <span>
                            <CheckCircle2 size={14} /> Fotografía lista para
                            enviar
                          </span>
                        </div>
                        <button
                          className="icon-button"
                          type="button"
                          aria-label="Quitar fotografía"
                          onClick={() => setPhoto("")}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`dropzone ${dragging ? "dragging" : ""}`}
                        disabled={processing}
                        onClick={() => fileInput.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragging(false);
                          void upload(e.dataTransfer.files[0]);
                        }}
                      >
                        <span className="upload-icon">
                          <Camera size={24} />
                        </span>
                        <strong>
                          {processing
                            ? "Preparando fotografía…"
                            : "Haz clic o arrastra tu fotografía aquí"}
                        </strong>
                        <span>JPG, PNG o WebP · Hasta 10 MB</span>
                        <small>
                          La imagen se optimizará antes de enviarse.
                        </small>
                      </button>
                    )}
                  </section>
                  <section className="form-section contact-section">
                    <h3>
                      <span className="step-number">03</span> Tus datos{" "}
                      <small>Opcional</small>
                    </h3>
                    <div className="two-fields">
                      <div>
                        <label className="field-label" htmlFor="name">
                          Nombre
                        </label>
                        <input
                          id="name"
                          name="name"
                          autoComplete="name"
                          placeholder="Tu nombre"
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <label className="field-label" htmlFor="email">
                          Correo electrónico
                        </label>
                        <input
                          id="email"
                          name="email"
                          autoComplete="email"
                          type="email"
                          placeholder="nombre@correo.com"
                          maxLength={150}
                        />
                      </div>
                    </div>
                    <p className="field-help">
                      Puedes enviar el reporte sin indicar tu nombre ni tu
                      correo.
                    </p>
                  </section>
                </fieldset>
                <div className="form-bottom">
                  <p>
                    <ShieldCheck size={16} /> Solo el personal autorizado podrá
                    consultar tu reporte.
                  </p>
                  {error && (
                    <div className="error-message" role="alert">
                      {error}
                    </div>
                  )}
                  <button
                    className="primary submit-button"
                    type="submit"
                    disabled={busy || processing || configured !== true}
                  >
                    {busy ? "Registrando reporte…" : "Enviar reporte"}{" "}
                    {!busy && <ArrowRight size={18} />}
                  </button>
                  <small>
                    Al enviar, compartirás esta información con la
                    administración municipal.
                  </small>
                </div>
              </form>
              <aside className="portal-aside">
                <div className="how-it-works">
                  <div className="aside-icon">
                    <ClipboardList size={23} />
                  </div>
                  <h2>
                    Un reporte.
                    <br />
                    Un paso hacia el cambio.
                  </h2>
                  <p>
                    Tu participación nos ayuda a identificar lo que necesita
                    nuestra comunidad.
                  </p>
                  <ol className="process-list">
                    <li>
                      <span>
                        <Send size={16} />
                      </span>
                      <div>
                        <strong>Cuéntanos qué sucede</strong>
                        <p>Describe la situación y adjunta una fotografía.</p>
                      </div>
                    </li>
                    <li>
                      <span>
                        <FileCheck2 size={17} />
                      </span>
                      <div>
                        <strong>Recibe tu confirmación</strong>
                        <p>
                          Obtén un número cuando tu reporte quede registrado.
                        </p>
                      </div>
                    </li>
                    <li>
                      <span>
                        <BuildingReview />
                      </span>
                      <div>
                        <strong>El municipio lo revisa</strong>
                        <p>
                          El equipo consulta la información y organiza su
                          atención.
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>
                <div className="tips">
                  <Lightbulb size={21} />
                  <div>
                    <h3>Un buen reporte ayuda más</h3>
                    <p>
                      Indica una ubicación precisa y procura que la fotografía
                      muestre claramente el problema.
                    </p>
                  </div>
                </div>
                <div className="emergency-note">
                  <strong>¿Es una emergencia?</strong>
                  <p>
                    Este portal no brinda atención inmediata. Acude a los
                    servicios de emergencia de tu localidad.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
function BuildingReview() {
  return <CheckCircle2 size={17} />;
}
