import { useEffect, useRef, useState } from "react";
import type { MatchSnapshot, Team } from "@volleyball-mythics/protocol";
import { KeyboardInput, attachKeyboard } from "../input/keyboard.js";
import type { RoomConnection } from "../network/connection.js";
import { SnapshotBuffer } from "../network/interpolation.js";
import { createScene } from "../scene/createScene.js";
import { enableFeedbackSound, playFeedbackSound } from "./feedbackSound.js";
import { inputIntent } from "./inputIntent.js";
import {MatchHud} from "./MatchHud.js";

export function OnlineMatch({ snapshot, connection, userId, team, slot, feedback, abilityAvailable,characterName="Seu atleta" }: { snapshot: MatchSnapshot | null; connection: RoomConnection; userId: string; team: Team; slot: number; feedback: string; abilityAvailable: boolean;characterName?:string }) {
  const host = useRef<HTMLDivElement>(null);
  const buffer = useRef(new SnapshotBuffer());
  const keyboard = useRef(new KeyboardInput());
  const phase = useRef("");
  const lastScore = useRef("");
  const [error, setError] = useState("");
  const [graphicsError,setGraphicsError]=useState("");
  const [reducedMotion,setReducedMotion]=useState(()=>{try{const saved=localStorage.getItem("volleyball-mythics-reduced-motion");if(saved!==null)return saved==="true";}catch{}return matchMedia("(prefers-reduced-motion: reduce)").matches;});
  const [intent, setIntent] = useState<{ text: string; at: number } | null>(null);
  useEffect(() => {
    keyboard.current.onIntent = (code) => { const message = inputIntent(code, phase.current); if (message) setIntent({ text: message, at: performance.now() }); };
    return () => { keyboard.current.onIntent = undefined; };
  }, []);
  useEffect(() => { if (!intent) return; const timer = setTimeout(() => setIntent(null), 1200); return () => clearTimeout(timer); }, [intent]);
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
    try { scene = createScene(target);setGraphicsError(""); } catch { setGraphicsError("A quadra 3D precisa de WebGL. Habilite a aceleração gráfica e recarregue."); return; }
    scene.setQuality(quality); scene.setFollowPlayer?.(userId);scene.setReducedMotion?.(reducedMotion);
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
  }, [connection, quality, userId, team,reducedMotion]);
  const playing = !graphicsError&&(snapshot?.phase === "rally" || snapshot?.phase === "serving");
  const serving = !graphicsError&&snapshot?.phase === "serving" && snapshot.servingSide === team && snapshot.servingSlot === slot;
  const abilityCooldown = Math.ceil(snapshot?.cooldowns[userId] ?? 0);
  const trigger = (code: string) => { host.current?.focus(); keyboard.current.press(code); keyboard.current.release(code); };
  return <section aria-label="Partida online" className="online-match" onPointerDown={enableFeedbackSound} onKeyDown={enableFeedbackSound}>
    <MatchHud snapshot={snapshot} team={team} slot={slot} characterName={characterName}/>
    <details className="game-options"><summary>Áudio e imagem</summary><div className="options-grid">
      <button onClick={() => setQuality(quality === "low" ? "high" : "low")}>Qualidade: {quality === "low" ? "baixa" : "alta"}</button>
      <label>Volume dos sinais · {volume===0?"mudo":volume+"%"}<input aria-label="Volume dos sinais sonoros" aria-valuetext={volume===0?"Mudo":volume+" por cento"} type="range" min="0" max="100" value={volume} onChange={(event) => { const next = Number(event.target.value); setVolume(next); try { localStorage.setItem("volleyball-mythics-volume", String(next)); } catch {} }} /></label>
      <label className="checkbox-label"><input type="checkbox" checked={reducedMotion} onChange={event=>{setReducedMotion(event.target.checked);try{localStorage.setItem("volleyball-mythics-reduced-motion",String(event.target.checked));}catch{}}}/>Câmera estável (reduzir movimento)</label>
    </div><p className="helper">As opções não pausam a partida. Câmera estável usa uma visão fixa da quadra.</p></details>
    <div ref={host} className="court-host" tabIndex={0} onClick={() => host.current?.focus()} aria-label="Quadra em terceira pessoa. Clique para usar o teclado." style={{height:graphicsError?180:"60vh",minHeight:graphicsError?180:280}} />
    {graphicsError&&<div className="notice error" role="alert"><strong>Modo gráfico indisponível</strong><p>{graphicsError}</p><p>O placar continua disponível, mas a partida online não foi pausada. Você pode sair pelos controles da sala.</p></div>}
    <div className="action-bar" role="group" aria-label="Ações da partida">
      <button disabled={!playing} onClick={() => trigger("Space")}>Saltar · Espaço</button>
      <button disabled={!serving} onClick={() => trigger("KeyL")}>Sacar · L</button>
      <button disabled={!playing||snapshot?.phase !== "rally"} onClick={() => trigger("KeyJ")}>Receber / bloquear · J</button>
      <button disabled={!playing||snapshot?.phase !== "rally"} onClick={() => trigger("KeyK")}>Levantar · K</button>
      <button disabled={!playing||snapshot?.phase !== "rally"} onClick={() => trigger("KeyL")}>Atacar · L</button>
      <button disabled={!playing || !abilityAvailable || abilityCooldown > 0} onClick={() => trigger("KeyU")}>Especial · {abilityCooldown > 0 ? `${abilityCooldown}s` : "U"}</button>
    </div>
    <p className="helper">WASD move em relação à câmera. A marca “VOCÊ” identifica seu atleta. Salte perto da rede e receba para bloquear.</p>
    <p className="helper">Especial: {!abilityAvailable?"indisponível nesta formação":abilityCooldown>0?"em recarga · "+abilityCooldown+"s":"pronto · U"}</p>
    {feedback && <p className="notice" role="status">{feedback}</p>}
    {intent && <p className="helper" role="status">{intent.text}</p>}
    {error && <p className="notice error" role="alert">{error}</p>}
  </section>;
}
