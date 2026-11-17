import { createRoot } from "react-dom/client";
import { Game } from "./game/Game.js";
import { createScene } from "./scene/createScene.js";
import { useState } from "react";
import { Lobby } from "./lobby/Lobby.js";

function App() {
  const [online, setOnline] = useState(true);
  return <><nav style={{ padding: 20 }}><button onClick={() => setOnline(!online)}>{online ? "Ver demonstração 3D" : "Salas online"}</button></nav><div hidden={!online}><Lobby /></div>{!online && <Game createScene={createScene} />}</>;
}
createRoot(document.getElementById("root")!).render(<App />);
