import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import { Lobby } from "./lobby/Lobby.js";
import "./styles.css";
const Admin=lazy(()=>import("./admin/Admin.js").then(m=>({default:m.Admin})));

function App() {
  if(location.pathname==="/admin")return <Suspense fallback={<p role="status">Preparando administração…</p>}><Admin/></Suspense>;
  return <Lobby header={<header className="app-header"><a className="brand" href="/"><span className="brand-mark" aria-hidden="true">V</span>VOLLEYBALL <b>MYTHICS</b></a><a className="admin-nav" href="/admin">Admin do elenco</a></header>}/>;
}
createRoot(document.getElementById("root")!).render(<App />);
