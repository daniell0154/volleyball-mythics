import { createRoot } from "react-dom/client";
import { lazy, Suspense, useState } from "react";
import { Lobby } from "./lobby/Lobby.js";
import "./styles.css";
const Demo=lazy(()=>import("./game/Demo.js"));
const Admin=lazy(()=>import("./admin/Admin.js").then(m=>({default:m.Admin})));

function App() {
  const [online, setOnline] = useState(true);
  if(location.pathname==="/admin")return <Suspense fallback={<p role="status">Preparando administração…</p>}><Admin/></Suspense>;
  return <><header className="app-header"><a className="brand" href="/"><span className="brand-mark" aria-hidden="true">V</span>VOLLEYBALL <b>MYTHICS</b></a><a href="/admin">Admin</a><button onClick={() => setOnline(!online)}>{online ? "Ver demonstração 3D" : "Salas online"}</button></header><div hidden={!online}><Lobby /></div>{!online && <Suspense fallback={<p role="status">Preparando quadra…</p>}><Demo/></Suspense>}</>;
}
createRoot(document.getElementById("root")!).render(<App />);
