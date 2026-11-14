import { createRoot } from "react-dom/client";
import CitizenPortal from "../components/municipio/citizen-portal";
import AdminPanel from "../components/municipio/admin-panel";
import "../app/globals.css";

const path = window.location.pathname.replace(/\/+$/, "") || "/";
const root = document.getElementById("root");
if (!root) throw new Error("No se encontró el contenedor de la aplicación.");

createRoot(root).render(
  path === "/" ? (
    <CitizenPortal />
  ) : path === "/admin" ? (
    <AdminPanel />
  ) : (
    <main className="public-main">
      <section className="receipt card">
        <p className="eyebrow">PÁGINA NO ENCONTRADA</p>
        <h1>Esta dirección no existe.</h1>
        <a className="primary" href="/">Volver al portal ciudadano</a>
      </section>
    </main>
  ),
);
