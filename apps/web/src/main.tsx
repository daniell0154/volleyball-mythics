import { createRoot } from "react-dom/client";
import { Game } from "./game/Game.js";
import { createScene } from "./scene/createScene.js";

createRoot(document.getElementById("root")!).render(<Game createScene={createScene} />);
