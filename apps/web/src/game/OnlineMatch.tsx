import { useEffect, useRef, useState } from "react";
import type { MatchSnapshot } from "@volleyball-mythics/protocol";
import { KeyboardInput, attachKeyboard } from "../input/keyboard.js";
import type { RoomConnection } from "../network/connection.js";
import { SnapshotBuffer } from "../network/interpolation.js";
import { createScene } from "../scene/createScene.js";

export function OnlineMatch({ snapshot, connection }: { snapshot: MatchSnapshot | null; connection: RoomConnection }) {
  const host = useRef<HTMLDivElement>(null);
  const buffer = useRef(new SnapshotBuffer());
  const keyboard = useRef(new KeyboardInput());
  const phase = useRef("");
  const [error, setError] = useState("");
  const [quality, setQuality] = useState<"low" | "high">("low");
  useEffect(() => { if (snapshot) { buffer.current.push(snapshot, performance.now()); phase.current = snapshot.phase; } }, [snapshot]);
  useEffect(() => {
    if (!host.current) return;
    const target = host.current;
    let scene: ReturnType<typeof createScene>;
    try { scene = createScene(target); } catch { setError("WebGL indisponível"); return; }
    scene.setQuality(quality);
    const detach = attachKeyboard(target, keyboard.current);
    const resize = new ResizeObserver(([entry]) => { if (entry) scene.resize(entry.contentRect.width, entry.contentRect.height); });
    resize.observe(target);
    let raf = 0;
    const render = (now: number) => { const frame = buffer.current.sample(now); if (frame) scene.update(frame); raf = requestAnimationFrame(render); };
    raf = requestAnimationFrame(render);
    // 50 inputs/s leaves margin below the server's 60/s limit. Simulation is 60 Hz.
    const inputTimer = setInterval(() => {
      if (phase.current !== "serving" && phase.current !== "rally") { keyboard.current.clear(); return; }
      void connection.request("input", keyboard.current.sample(phase.current)).catch((e: unknown) => setError(e instanceof Error ? e.message : "Falha de entrada"));
    }, 20);
    return () => { cancelAnimationFrame(raf); clearInterval(inputTimer); detach(); resize.disconnect(); scene.dispose(); };
  }, [connection, quality]);
  return <div>
    <p>{snapshot ? `${snapshot.score.A} × ${snapshot.score.B} · ${snapshot.phase}` : "Aguardando estado do servidor…"}</p>
    <button onClick={() => setQuality(quality === "low" ? "high" : "low")}>Qualidade: {quality === "low" ? "baixa" : "alta"}</button>
    <div ref={host} tabIndex={0} onClick={() => host.current?.focus()} aria-label="Quadra online. Clique para usar o teclado." style={{ width: "100%", height: "65vh", minHeight: 280 }} />
    <p>WASD mover · Espaço saltar · L sacar. Protótipo de sincronização: recepção, ataque, pontos e reconexão serão integrados na etapa de partida.</p>
    {error && <p role="alert">{error}</p>}
  </div>;
}
