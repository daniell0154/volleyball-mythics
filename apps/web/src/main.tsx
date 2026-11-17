import { createRoot } from "react-dom/client";
import { lazy, Suspense, useState } from "react";
import { Lobby } from "./lobby/Lobby.js";
import "./styles.css";
const Demo=lazy(()=>import("./game/Demo.js"));

function App() {
  const [online, setOnline] = useState(true);
  return <><header className="app-header"><a className="brand" href="/"><span className="brand-mark" aria-hidden="true">V</span>VOLLEYBALL <b>MYTHICS</b></a><button onClick={() => setOnline(!online)}>{online ? "Ver demonstração 3D" : "Salas online"}</button></header><div hidden={!online}><Lobby /></div>{!online && <Suspense fallback={<p role="status">Preparando quadra…</p>}><Demo/></Suspense>}</>;
}
createRoot(document.getElementById("root")!).render(<App />);
