import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { MatchSnapshot, Team } from "@volleyball-mythics/protocol";
import { KeyboardInput, attachKeyboard } from "../input/keyboard.js";
import type { RoomConnection } from "../network/connection.js";
import { SnapshotBuffer } from "../network/interpolation.js";
import { createScene } from "../scene/createScene.js";
import { enableFeedbackSound, playFeedbackSound } from "./feedbackSound.js";
import { inputIntent } from "./inputIntent.js";
import { MatchHud } from "./MatchHud.js";
import { matchGuidance } from "./matchGuidance.js";
import type { CourtInsets } from "./presentation.js";

interface OnlineMatchProps {
  snapshot: MatchSnapshot | null;
  connection: RoomConnection | null;
  userId: string;
  team: Team;
  slot: number;
  feedback: string;
  abilityAvailable: boolean;
  characterName?: string;
  roomLabel?: string;
  status?: string;
  commandError?: string;
  fullscreen?: ReactNode;
  onLeave?(): void;
  leaveDisabled?: boolean;
  result?: ReactNode;
}

export function OnlineMatch({ snapshot, connection, userId, team, slot, feedback, abilityAvailable,
  characterName = "Seu atleta", roomLabel = "", status, commandError, fullscreen, onLeave, leaveDisabled, result }: OnlineMatchProps) {
  const host = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLElement>(null);
  const controls = useRef<HTMLElement>(null);
  const options = useRef<HTMLDivElement>(null);
  const courtInsets = useRef<CourtInsets>({ top: 0, bottom: 0 });
  const resultPanel = useRef<HTMLDivElement>(null);
  const hadResult = useRef(false);
  const sceneRef = useRef<ReturnType<typeof createScene> | null>(null);
  const optionsId = useId();
  const actionsId = useId();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const focusCourt = () => (resultPanel.current ?? host.current)?.focus({ preventScroll: true });
  const closeOptions = () => {
    setOptionsOpen(false);
    if (options.current) options.current.scrollTop = 0;
    focusCourt();
  };
  useEffect(() => {
    if (document.activeElement === host.current?.closest(".match-viewport")) focusCourt();
  }, []);
  const showingResult = Boolean(result);
  useEffect(() => {
    if (showingResult || hadResult.current) {
      setOptionsOpen(false);
      setActionsExpanded(false);
      if (options.current) options.current.scrollTop = 0;
      focusCourt();
    }
    hadResult.current = showingResult;
  }, [showingResult]);
  const buffer = useRef(new SnapshotBuffer());
  const keyboard = useRef(new KeyboardInput());
  const phase = useRef("");
  const lastScore = useRef<{ matchId: string; value: string } | null>(null);
  const [error, setError] = useState("");
  const [graphicsError,setGraphicsError]=useState("");
  const [cursorAim,setCursorAim]=useState(false);
  useEffect(()=>{keyboard.current.enableAim(snapshot?.rulesVersion===4);},[snapshot?.rulesVersion]);
  useEffect(()=>{keyboard.current.clear();},[cursorAim]);
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
    if (lastScore.current?.matchId === snapshot.matchId && score !== lastScore.current.value) playFeedbackSound(volume);
    lastScore.current = { matchId: snapshot.matchId, value: score };
  } }, [snapshot, userId, volume]);
  useEffect(() => setError(""), [snapshot?.phase]);
  useEffect(() => {
    if (!host.current) return;
    const target = host.current;
    let scene: ReturnType<typeof createScene>;
    try { scene = createScene(target, { reserveCueMargin: true });setGraphicsError(""); } catch { setGraphicsError("A quadra 3D precisa de WebGL. Habilite a aceleração gráfica e recarregue."); return; }
    sceneRef.current = scene;
    const resize = new ResizeObserver(() => {
      const width = target.clientWidth, height = target.clientHeight;
      const top = Math.min(hud.current?.offsetHeight ?? 0, Math.max(0, height - 1));
      const bottom = Math.min(controls.current?.offsetHeight ?? 0, Math.max(0, height - top - 1));
      courtInsets.current = { top, bottom };
      scene.resize(width, height, courtInsets.current);
    });
    resize.observe(target);
    if (hud.current) resize.observe(hud.current);
    if (controls.current) resize.observe(controls.current);
    let raf = 0;
    const render = (now: number) => { const frame = buffer.current.sample(now); if (frame) scene.update(frame); raf = requestAnimationFrame(render); }; raf = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(raf); resize.disconnect(); scene.dispose(); sceneRef.current = null; };
  }, []);
  useEffect(() => { sceneRef.current?.setFollowPlayer?.(userId); }, [userId]);
  useEffect(() => { sceneRef.current?.setQuality(quality); }, [quality]);
  useEffect(() => { sceneRef.current?.setReducedMotion?.(reducedMotion); }, [reducedMotion]);
  useEffect(() => {
    if (!connection || !host.current || graphicsError || showingResult) return;
    setError("");
    const detach = attachKeyboard(host.current, keyboard.current);
    let active = true;
    const inputTimer = setInterval(() => {
      if (phase.current !== "serving" && phase.current !== "rally") { keyboard.current.clear(); return; }
      const input = keyboard.current.sample(phase.current);
      const sign = team === "A" ? -1 : 1;
      void connection.request("input", { ...input, moveX: input.moveX * sign, moveZ: input.moveZ * sign,...(input.aim?{aim:{x:input.aim.x*sign,z:input.aim.z}}:{}) }).catch((e: unknown) => {
        // A snapshot can arrive just after the server suspends/finishes the match.
        if (!active || (e instanceof Error && e.message === "invalid_state")) return;
        setError(e instanceof Error ? e.message : "Falha de entrada");
      });
    }, 20);
    return () => { active = false; clearInterval(inputTimer); detach(); };
  }, [connection, graphicsError, showingResult, team]);
  const playing = Boolean(connection) && !graphicsError && !showingResult && (snapshot?.phase === "rally" || snapshot?.phase === "serving");
  const serving = playing && snapshot?.phase === "serving" && snapshot.servingSide === team && snapshot.servingSlot === slot;
  const abilityCooldown = Math.ceil(snapshot?.cooldowns[userId] ?? 0);
  const trigger = (code: string) => { focusCourt(); keyboard.current.press(code); keyboard.current.release(code); };
  const hint = status || feedback || intent?.text || (serving ? "Seu saque" : "");
  const leaveLabel = !connection ? "Voltar ao lobby" : result ? "Sair da sala" : "Abandonar partida";
  return <section aria-label="Partida online" className="online-match" onPointerDown={enableFeedbackSound} onKeyDown={event => {
    enableFeedbackSound();
    if (event.key === "Escape" && optionsOpen) closeOptions();
  }}>
    <MatchHud snapshot={snapshot} team={team} slot={slot} hudRef={hud}/>
    <div className="match-stage">
      {result && <div ref={resultPanel} className="match-stage-panel" tabIndex={-1} aria-label="Resultado e revanche">{result}</div>}
      <div ref={host} className="court-host" tabIndex={showingResult ? -1 : 0} onPointerMove={event => {
        if (!cursorAim || snapshot?.rulesVersion !== 4 || document.activeElement !== host.current) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const { top, bottom } = courtInsets.current;
        const height = rect.height - top - bottom;
        if (rect.width && height > 0) keyboard.current.setCursorAim((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top-top)/height*2);
      }} onClick={focusCourt} aria-label="Quadra em terceira pessoa. Clique para usar o teclado." />
      {graphicsError && !result && <div className="match-stage-panel"><div className="notice error" role="alert">
        <strong>Modo gráfico indisponível</strong><p>{graphicsError}</p><p>O placar e o botão de saída continuam disponíveis.</p>
      </div></div>}
    </div>
    <footer ref={controls} className="match-controls">
      {hint && <span className="match-hint" role="status">{hint}</span>}
      {(commandError || error) && <p className="notice error" role="alert">{commandError || error}</p>}
      <div className="match-toolbar">
        <span className="move-tip"><kbd>WASD</kbd> Mover</span>
        <button type="button" className="expand-actions" aria-expanded={actionsExpanded} aria-controls={actionsId} onClick={() => setActionsExpanded(!actionsExpanded)}>Ações</button>
        <div id={actionsId} className="action-bar" data-expanded={actionsExpanded} role="group" aria-label="Ações da partida">
          <button aria-label="Saltar · Espaço" disabled={!playing} onClick={() => trigger("Space")}><kbd>Espaço</kbd> Saltar</button>
          {snapshot?.phase === "serving" ? <button aria-label="Sacar · L" disabled={!serving} onClick={() => trigger("KeyL")}><kbd>L</kbd> Sacar</button>
            : <button aria-label="Atacar · L" disabled={!playing} onClick={() => trigger("KeyL")}><kbd>L</kbd> Atacar</button>}
          <button aria-label="Receber / bloquear · J" disabled={!playing||snapshot?.phase !== "rally"} onClick={() => trigger("KeyJ")}><kbd>J</kbd> Receber</button>
          <button aria-label="Levantar · K" disabled={!playing||snapshot?.phase !== "rally"} onClick={() => trigger("KeyK")}><kbd>K</kbd> Levantar</button>
          <button aria-label={`Especial · ${abilityCooldown > 0 ? `${abilityCooldown}s` : "U"}`} disabled={!playing || !abilityAvailable || abilityCooldown > 0} onClick={() => trigger("KeyU")}><kbd>{abilityCooldown > 0 ? `${abilityCooldown}s` : "U"}</kbd> Especial</button>
        </div>
        <button type="button" aria-expanded={optionsOpen} aria-controls={optionsId} onClick={() => {
          if (optionsOpen) closeOptions();
          else { keyboard.current.clear(); setOptionsOpen(true); }
        }}>Opções</button>
        {onLeave && <button type="button" aria-label={leaveLabel} title={leaveLabel} disabled={leaveDisabled} onClick={onLeave}>{!connection ? "Voltar" : "Sair"}</button>}
      </div>
      <div ref={options} id={optionsId} className="game-options" hidden={!optionsOpen}>
       <p className="helper">{characterName}{roomLabel && ` · ${roomLabel}`}</p>
       <div className="options-grid">
      <button onClick={() => setQuality(quality === "low" ? "high" : "low")}>Qualidade: {quality === "low" ? "baixa" : "alta"}</button>
      <label>Volume dos sinais · {volume===0?"mudo":volume+"%"}<input aria-label="Volume dos sinais sonoros" aria-valuetext={volume===0?"Mudo":volume+" por cento"} type="range" min="0" max="100" value={volume} onChange={(event) => { const next = Number(event.target.value); setVolume(next); try { localStorage.setItem("volleyball-mythics-volume", String(next)); } catch {} }} /></label>
      <label className="checkbox-label"><input type="checkbox" checked={reducedMotion} onChange={event=>{setReducedMotion(event.target.checked);try{localStorage.setItem("volleyball-mythics-reduced-motion",String(event.target.checked));}catch{}}}/>Câmera estável (reduzir movimento)</label>
        {snapshot?.rulesVersion === 4 && <button onClick={() => setCursorAim(value => !value)}>Direção: {cursorAim ? "cursor" : "teclado"}</button>}
        {fullscreen}
        <button onClick={closeOptions}>Fechar opções</button>
       </div>
       <p className="helper">{matchGuidance(snapshot, team, slot)} As opções não pausam a partida. {snapshot?.rulesVersion === 4 && (cursorAim ? "Mire com o cursor na quadra. C centraliza." : "Mire com as setas. C centraliza.")}</p>
      </div>
    </footer>
  </section>;
}
