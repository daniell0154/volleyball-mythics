import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { CatalogEntry, ClientMessage, RoomState, MatchSnapshot, MatchEnded } from "@volleyball-mythics/protocol";
import { RoomConnection } from "../network/connection.js";
import { ResultPanel } from "../results/ResultPanel.js";
import {createLobbyServices,type LobbyServices} from "./services.js";
import {CharacterShowcase,characterKey} from "./CharacterShowcase.js";
const OnlineMatch=lazy(()=>import("../game/OnlineMatch.js").then(module=>({default:module.OnlineMatch})));

export function Lobby({services}:{services?:LobbyServices}={}) {
  const [backend]=useState(()=>services??createLobbyServices());
  const connection = useRef<RoomConnection | null>(null);
  const roomRef = useRef<RoomState | null>(null);
  const manualClose = useRef(false);
  const alive = useRef(true);
  const connecting = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const retryDeadline = useRef(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const connectLatest = useRef<() => Promise<unknown>>(async () => {});
  const [room, setRoom] = useState<RoomState | null>(null);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [catalogStatus,setCatalogStatus]=useState<"loading"|"ready"|"error">("loading");
  const [featuredKey,setFeaturedKey]=useState("");
  const [mode,setMode]=useState<"1v1"|"2v2">("1v1");
  const catalogGeneration=useRef(0);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState(new URLSearchParams(location.search).get("room")?.toUpperCase() ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [reconnectStatus, setReconnectStatus] = useState("");
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);
  const [result, setResult] = useState<MatchEnded | null>(null);
  const [feedback, setFeedback] = useState("");
  const loadCatalog=async()=>{
    const generation=++catalogGeneration.current;setCatalogStatus("loading");
    try{const entries=await backend.loadCatalog();if(alive.current&&generation===catalogGeneration.current){setCatalog(entries);setCatalogStatus("ready");}}
    catch{if(alive.current&&generation===catalogGeneration.current)setCatalogStatus("error");}
  };
  useEffect(()=>{void loadCatalog();},[backend]);
  useEffect(() => () => { alive.current = false; manualClose.current = true; clearTimeout(retryTimer.current); clearTimeout(feedbackTimer.current); connection.current?.close(); }, []);
  const scheduleRetry = () => {
    if (manualClose.current || !alive.current || !roomRef.current || retryTimer.current !== undefined) return;
    if (!retryDeadline.current) retryDeadline.current = Date.now() + 20000;
    if (Date.now() >= retryDeadline.current) { setReconnectStatus("Não foi possível reconectar no prazo. Entre novamente para consultar o resultado."); setUserId(""); return; }
    setReconnectStatus("Conexão interrompida. Reconectando…");
    retryTimer.current = setTimeout(() => { retryTimer.current = undefined; void connectLatest.current(); }, 1000);
  };
  const connect = async () => {
    if (connecting.current) return false;
    connecting.current = true; manualClose.current = false;
    setBusy(true); setError("");
    try {
      const token=await backend.prepareSession();
      await backend.saveName(name);
      const socket = new RoomConnection(backend.serverUrl(), (type, payload) => {
        if (type === "roomState") { roomRef.current = payload as RoomState | null; setRoom(roomRef.current); if (!payload) { setSnapshot(null); setResult(null); } }
        if (type === "catalog") {catalogGeneration.current++;setCatalog(payload as CatalogEntry[]);setCatalogStatus("ready");}
        if (type === "snapshot") { const frame = payload as MatchSnapshot; setSnapshot(frame); setResult((current) => current && current.matchId !== frame.matchId ? null : current); }
        if (type === "matchEnded") setResult(payload as MatchEnded);
        if (type === "actionFeedback" && typeof (payload as { message?: unknown }).message === "string") {
          setFeedback((payload as { message: string }).message); clearTimeout(feedbackTimer.current); feedbackTimer.current = setTimeout(() => setFeedback(""), 1800);
        }
        if (type === "resultSaveState") {
          const saved = payload as { matchId: string; persistence: MatchEnded["persistence"] };
          setResult((current) => current?.matchId === saved.matchId ? { ...current, persistence: saved.persistence } : current);
        }
        if (type === "reconnectState") {
          const status = payload as { remainingSeconds: { A: number; B: number }; resumeSeconds: number | null };
          setReconnectStatus(status.resumeSeconds !== null ? `Retomando em ${status.resumeSeconds}s` : roomRef.current?.status === "suspended" ? `Aguardando reconexão · A ${status.remainingSeconds.A}s / B ${status.remainingSeconds.B}s` : "");
        }
        if (type === "disconnected" && connection.current === socket && alive.current) {
          setConnected(false);
          if (!manualClose.current && roomRef.current && roomRef.current.status !== "lobby") scheduleRetry();
          else { setUserId(""); roomRef.current = null; setRoom(null); setError("Conexão encerrada."); }
        }
      });
      connection.current = socket;
      const identity = await socket.authenticate(token); setUserId(identity.userId); setConnected(true); retryDeadline.current = 0;
      if (roomRef.current?.status !== "suspended") setReconnectStatus("");
      return true;
    } catch (e) { connection.current?.close(); setError("Não foi possível entrar. Verifique a conexão e tente novamente."); scheduleRetry(); return false; }
    finally { connecting.current = false; if (alive.current) setBusy(false); }
  };
  connectLatest.current = connect;
  const command = async (type: ClientMessage["type"], payload: unknown = {}) => {
    setError(""); try { await connection.current?.request(type, payload); } catch (e) { setError(e instanceof Error ? e.message : "Falha no comando"); }
  };
  const self = room?.members.find((m) => m.userId === userId);
  const selected = catalog.find((c) => c.id === self?.character?.id && c.version === self?.character?.version);
  const enter=async(type:"createRoom"|"joinRoom",payload:unknown)=>{if(!connected&&!await connect())return;await command(type,payload);};
  return <section className="app-shell">
    {room&&<h1 style={{fontSize:"2.5rem"}}>Volleyball Mythics</h1>}
    {error && <p role="alert">{error}</p>}
    {reconnectStatus && <p role="status">{reconnectStatus}</p>}
    {!room?<div className="entry-grid"><div className="entry-copy">
      <div className="eyebrow">Vôlei 3D · 1v1 e 2v2 · Primeiro a 6</div><h1>A quadra<br/>é de vocês.</h1><p className="lead">Escolha seu atleta, chame seus amigos e transforme o próximo rally em história.</p>
      <form className="entry-form panel" onSubmit={event=>{event.preventDefault();void enter("createRoom",{mode});}}>
       <label>Seu apelido<input autoComplete="nickname" value={name} minLength={2} maxLength={24} onChange={event=>setName(event.target.value)} required placeholder="Como você quer ser chamado?"/></label>
       <div className="mode-choice" role="group" aria-label="Modo de jogo"><button type="button" aria-pressed={mode==="1v1"} onClick={()=>setMode("1v1")}>1v1 · Duelo</button><button type="button" aria-pressed={mode==="2v2"} onClick={()=>setMode("2v2")}>2v2 · Duplas</button></div>
       <button className="primary wide" disabled={busy||name.trim().length<2} type="submit">{busy?"Entrando…":"Criar sala"}</button>
       <div className="divider">ou entre com um convite</div>
       <div className="join-row"><label>Código da sala<input value={code} maxLength={6} onChange={event=>setCode(event.target.value.toUpperCase())} placeholder="6 caracteres"/></label><button type="button" disabled={busy||name.trim().length<2||!/^[A-Z2-9]{6}$/.test(code)} onClick={()=>void enter("joinRoom",{code})}>Entrar</button></div>
       <p className="helper">Você joga como visitante. Seu apelido deve ter de 2 a 24 caracteres.</p>{connected&&<span className="connected-label">Conectado como {name}</span>}
      </form>
    </div><CharacterShowcase catalog={catalog} status={catalogStatus} selectedKey={featuredKey} onSelect={character=>setFeaturedKey(characterKey(character))} onRetry={()=>void loadCatalog()}/></div>:<div>
      <p>{room.mode} · {room.code} · {room.status}</p>
      {room.status === "lobby" && <><p>Convite: <a style={{ color: "#a8f5cb" }} href={`${location.origin}/?room=${room.code}`}>{`${location.origin}/?room=${room.code}`}</a></p>
      <ul>{room.members.map((member) => <li key={member.userId}>{member.userId === userId ? "Você" : member.userId.slice(0, 8)} · {member.team}/{member.slot + 1} · {member.ready ? "Pronto" : "Aguardando"}{member.userId === room.ownerId ? " · Dono" : ""}</li>)}</ul></>}
      {room.status === "lobby" && <>
      {!catalog.length && <p>O catálogo ainda está vazio. O proprietário precisa fornecer o elenco antes de iniciar partidas.</p>}
      <label>Personagem <select disabled={room.status !== "lobby"} value={self?.character ? JSON.stringify([self.character.id, self.character.version]) : ""} onChange={(e) => { const [characterId, version] = JSON.parse(e.target.value); void command("selectCharacter", { characterId, version }); }}>
        <option value="" disabled>Selecionar</option>{catalog.map((c) => <option key={`${c.id}:${c.version}`} value={JSON.stringify([c.id, c.version])}>{c.name}{c.overall !== undefined ? ` · ${c.overall}` : ""} · v{c.version}</option>)}
      </select></label>
      <CharacterShowcase catalog={catalog} status={catalogStatus} selectedKey={selected?characterKey(selected):featuredKey} onSelect={character=>void command("selectCharacter",{characterId:character.id,version:character.version})} onRetry={()=>void loadCatalog()} team={self?.team??"A"}/>
      <label>Equipe/posição <select disabled={room.status !== "lobby"} value={self ? `${self.team}:${self.slot}` : ""} onChange={(e) => { const [team, slot] = e.target.value.split(":"); void command("setTeam", { team, slot: Number(slot) }); }}>
        {(["A", "B"] as const).flatMap((team) => (room.mode === "1v1" ? [0] : [0, 1]).map((slot) => <option key={`${team}:${slot}`} value={`${team}:${slot}`} disabled={room.members.some((m) => m.userId !== userId && m.team === team && m.slot === slot)}>{team}/{slot + 1}</option>))}
      </select></label>
      <button disabled={!self?.character || room.status !== "lobby"} onClick={() => command("ready", { ready: !self?.ready })}>{self?.ready ? "Não pronto" : "Pronto"}</button>
      {room.ownerId === userId && <button disabled={!connected || room.members.length !== (room.mode === "1v1" ? 2 : 4) || room.members.some((m) => !m.ready || !m.connected || !m.character)} onClick={() => command("start")}>Iniciar</button>}
      </>}
      <button disabled={!connected} onClick={() => command("leave")}>{room.status === "active" || room.status === "suspended" ? "Abandonar partida" : "Sair da sala"}</button>
      {room.status === "finished" && result && self && <ResultPanel result={result} team={self.team} userId={userId} onVote={() => void command("rematchVote")} />}
      {room.status !== "lobby" && connected && connection.current && self && <Suspense fallback={<p role="status">Preparando quadra…</p>}><OnlineMatch key={snapshot?.matchId ?? room.roomId} snapshot={snapshot} connection={connection.current} userId={userId} team={self.team} slot={self.slot} feedback={feedback} abilityAvailable={Boolean(selected?.abilityId)}/></Suspense>}
    </div>}
    {userId && <button onClick={() => { manualClose.current = true; clearTimeout(retryTimer.current); connection.current?.close(); }}>Desconectar</button>}
  </section>;
}
