import { useEffect, useRef, useState } from "react";
import type { MatchSnapshot, Team } from "@volleyball-mythics/protocol";
import { KeyboardInput, attachKeyboard } from "../input/keyboard.js";
import type { RoomConnection } from "../network/connection.js";
import { SnapshotBuffer } from "../network/interpolation.js";
import { createScene } from "../scene/createScene.js";
import { enableFeedbackSound, playFeedbackSound } from "./feedbackSound.js";

const phases: Record<string, string> = { countdown: "Prepare-se", serving: "Saque", rally: "Em jogo", point: "Ponto", finished: "Partida encerrada", cancelled: "Partida cancelada", disconnectedSuspension: "Aguardando reconexão" };
export function OnlineMatch({ snapshot, connection, userId, team, slot, feedback, abilityAvailable }: { snapshot: MatchSnapshot | null; connection: RoomConnection; userId: string; team: Team; slot: number; feedback: string; abilityAvailable: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const buffer = useRef(new SnapshotBuffer());
  const keyboard = useRef(new KeyboardInput());
  const phase = useRef("");
  const lastScore = useRef("");
  const [error, setError] = useState("");
  const [quality, setQuality] = useState<"low" | "high">("low");
  const [volume, setVolume] = useState(() => {
    let saved = 50;
    try {
      const stored = localStorage.getItem("volleyball-mythics-volume");
      if (stored !== null) saved = Number(stored);
    } catch { /* storage may be disabled */ }
    return Number.isFinite(saved) ? Math.max(0, Math.min(100, saved)) : 50;
  });
  useEffect(() => { if (snapshot) {
    buffer.current.push(snapshot, performance.now()); phase.current = snapshot.phase;
    keyboard.current.synchronizeSequence(snapshot.lastProcessedSeq[userId] ?? 0);
    const score = `${snapshot.score.A}:${snapshot.score.B}`;
    if (lastScore.current && score !== lastScore.current) playFeedbackSound(volume);
    lastScore.current = score;
  } }, [snapshot, userId, volume]);
  useEffect(() => setError(""), [snapshot?.phase]);
  useEffect(() => {
    if (!host.current) return;
    const target = host.current;
    let scene: ReturnType<typeof createScene>;
    try { scene = createScene(target); } catch { setError("WebGL indisponível"); return; }
    scene.setQuality(quality); scene.setFollowPlayer?.(userId);
    const detach = attachKeyboard(target, keyboard.current);
    const resize = new ResizeObserver(([entry]) => { if (entry) scene.resize(entry.contentRect.width, entry.contentRect.height); }); resize.observe(target);
    let raf = 0;
    const render = (now: number) => { const frame = buffer.current.sample(now); if (frame) scene.update(frame); raf = requestAnimationFrame(render); }; raf = requestAnimationFrame(render);
    const inputTimer = setInterval(() => {
      if (phase.current !== "serving" && phase.current !== "rally") { keyboard.current.clear(); return; }
      const input = keyboard.current.sample(phase.current);
      const sign = team === "A" ? -1 : 1;
      void connection.request("input", { ...input, moveX: input.moveX * sign, moveZ: input.moveZ * sign }).catch((e: unknown) => {
        // A snapshot can arrive just after the server suspends/finishes the match.
        if (e instanceof Error && e.message === "invalid_state") return;
        setError(e instanceof Error ? e.message : "Falha de entrada");
      });
    }, 20);
    return () => { cancelAnimationFrame(raf); clearInterval(inputTimer); detach(); resize.disconnect(); scene.dispose(); };
  }, [connection, quality, userId, team]);
  const playing = snapshot?.phase === "rally" || snapshot?.phase === "serving";
  const serving = snapshot?.phase === "serving" && snapshot.servingSide === team && snapshot.servingSlot === slot;
  const abilityCooldown = Math.ceil(snapshot?.cooldowns[userId] ?? 0);
  const trigger = (code: string) => { host.current?.focus(); keyboard.current.press(code); keyboard.current.release(code); };
  return <section aria-label="Partida online" style={{ marginTop: 18 }}>
    <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
      <strong style={{ fontSize: 30 }} aria-label="Placar">{snapshot ? `${snapshot.score.A} × ${snapshot.score.B}` : "0 × 0"}</strong>
      <span>{phases[snapshot?.phase ?? ""] ?? "Aguardando servidor"}{snapshot?.secondsRemaining ? ` · ${Math.ceil(snapshot.secondsRemaining)}s` : ""}</span>
      <span>Você: equipe {team} · Saque: {snapshot?.servingSide ?? "A"}</span>
      <button onClick={() => setQuality(quality === "low" ? "high" : "low")}>Qualidade: {quality === "low" ? "baixa" : "alta"}</button>
      <label>Volume dos sinais <input aria-label="Volume dos sinais sonoros" type="range" min="0" max="100" value={volume} onPointerDown={enableFeedbackSound} onKeyDown={enableFeedbackSound} onChange={(event) => { const next = Number(event.target.value); setVolume(next); try { localStorage.setItem("volleyball-mythics-volume", String(next)); } catch { /* keep the in-memory preference */ } }} /></label>
    </div>
    <div ref={host} tabIndex={0} onClick={() => host.current?.focus()} aria-label="Quadra em terceira pessoa. Clique para usar o teclado." style={{ width: "100%", height: "65vh", minHeight: 280, outlineColor: "#8bf0ce" }} />
    {error && <div role="status" aria-label="Placar textual, modo gráfico indisponível" style={{ padding: 16, color: "#fff", background: "#102236", border: "2px solid #fff" }}><strong>Modo gráfico indisponível</strong><p>Placar: equipe A {snapshot?.score.A ?? 0}, equipe B {snapshot?.score.B ?? 0}. {phases[snapshot?.phase ?? ""] ?? "Aguardando servidor"}. Você joga pela equipe {team}; o saque é da equipe {snapshot?.servingSide ?? "A"}.</p><p>Você ainda pode usar os botões de ação abaixo. Para recuperar a quadra 3D, habilite WebGL/aceleração gráfica e recarregue.</p></div>}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
      <button disabled={!playing} onClick={() => trigger("Space")}>Saltar · Espaço</button>
      <button disabled={!serving} onClick={() => trigger("KeyL")}>Sacar · L</button>
      <button disabled={snapshot?.phase !== "rally"} onClick={() => trigger("KeyJ")}>Receber / bloquear · J</button>
      <button disabled={snapshot?.phase !== "rally"} onClick={() => trigger("KeyK")}>Levantar · K</button>
      <button disabled={snapshot?.phase !== "rally"} onClick={() => trigger("KeyL")}>Atacar · L</button>
      <button disabled={!playing || !abilityAvailable || abilityCooldown > 0} onClick={() => trigger("KeyU")}>Especial · {abilityCooldown > 0 ? `${abilityCooldown}s` : "U"}</button>
    </div>
    <p>WASD move em relação à câmera. Clique na quadra para usar o teclado. Aproxime-se da bola para receber, levantar ou atacar; salte perto da rede e receba para bloquear.</p>
    {feedback && <p role="status">{feedback}</p>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
