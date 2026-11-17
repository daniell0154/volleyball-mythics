import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { CatalogEntry, ClientMessage, RoomState, MatchSnapshot, MatchEnded } from "@volleyball-mythics/protocol";
import { RoomConnection } from "../network/connection.js";
import { ResultPanel } from "../results/ResultPanel.js";
import {createLobbyServices,type LobbyServices} from "./services.js";
import {CharacterShowcase,characterKey} from "./CharacterShowcase.js";
import {RoomLobby} from "./RoomLobby.js";
import {commandMessage} from "./guidance.js";
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
  const catalogRef=useRef<CatalogEntry[]>([]);
  const [catalogStatus,setCatalogStatus]=useState<"loading"|"ready"|"error">("loading");
  const [featuredKey,setFeaturedKey]=useState("");
  const catalogGeneration=useRef(0);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState(new URLSearchParams(location.search).get("room")?.toUpperCase() ?? "");
  const [error, setError] = useState("");
  const [commandError,setCommandError]=useState<{action:string;message:string}|null>(null);
  const [pending,setPending]=useState<string|null>(null);
  const commandInFlight=useRef(false);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [reconnectStatus, setReconnectStatus] = useState("");
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);
  const [result, setResult] = useState<MatchEnded | null>(null);
  const [feedback, setFeedback] = useState("");
  const loadCatalog=async()=>{
    const generation=++catalogGeneration.current;setCatalogStatus("loading");
    try{const entries=await backend.loadCatalog();if(alive.current&&generation===catalogGeneration.current){catalogRef.current=entries;setCatalog(entries);setCatalogStatus("ready");}}
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
        if (type === "catalog") {catalogGeneration.current++;catalogRef.current=payload as CatalogEntry[];setCatalog(catalogRef.current);setCatalogStatus("ready");}
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
    if(commandInFlight.current)return false;
    commandInFlight.current=true;setPending(type);setCommandError(null);
    try{if(!connection.current)throw Error("disconnected");await connection.current.request(type,payload);return true;}
    catch(e){setCommandError({action:type,message:commandMessage(e instanceof Error?e.message:"")});return false;}
    finally{commandInFlight.current=false;setPending(null);}
  };
  const self = room?.members.find((m) => m.userId === userId);
  const selected = catalog.find((c) => c.id === self?.character?.id && c.version === self?.character?.version);
  const enter=async(type:"createRoom"|"joinRoom",payload:unknown)=>{if(!connected&&!await connect())return;if(!await command(type,payload))return;const featured=catalogRef.current.find(c=>characterKey(c)===featuredKey)??catalogRef.current[0];if(featured)await command("selectCharacter",{characterId:featured.id,version:featured.version});};
  return <section className="app-shell">
    {error && <p className="notice error" role="alert">{error}</p>}
    {reconnectStatus && <p className="notice" role="status">{reconnectStatus}</p>}
    {!room?<div className="entry-grid"><div className="entry-copy">
      <div className="eyebrow">Vôlei 3D · 2v2 online · Primeiro a 6</div><h1>A quadra<br/>é de vocês.</h1><p className="lead">Escolha seu atleta e chame mais três pessoas para o próximo rally.</p>
      <form className="entry-form panel" onSubmit={event=>{event.preventDefault();void enter("createRoom",{mode:"2v2"});}}>
       <label>Seu apelido<input autoComplete="nickname" value={name} minLength={2} maxLength={24} onChange={event=>setName(event.target.value)} required placeholder="Como você quer ser chamado?"/></label>
       <p className="helper">2v2 online · Dois jogadores por equipe. Compartilhe o convite para completar os quatro lugares.</p>
       <button className="primary wide" disabled={busy||Boolean(pending)||name.trim().length<2} type="submit">{busy?"Entrando…":"Criar sala"}</button>
       {commandError?.action==="createRoom"&&<p className="notice error" role="alert">{commandError.message}</p>}
       <div className="divider">ou entre com um convite</div>
       <div className="join-row"><label>Código da sala<input value={code} maxLength={6} onChange={event=>setCode(event.target.value.toUpperCase())} placeholder="6 caracteres"/></label><button type="button" disabled={busy||Boolean(pending)||name.trim().length<2||!/^[A-Z2-9]{6}$/.test(code)} onClick={()=>void enter("joinRoom",{code})}>Entrar</button></div>
       {commandError?.action==="joinRoom"&&<p className="notice error" role="alert">{commandError.message}</p>}
       <p className="helper">Você joga como visitante. Seu apelido deve ter de 2 a 24 caracteres.</p>{connected&&<span className="connected-label">Conectado como {name}</span>}
      </form>
    </div><CharacterShowcase catalog={catalog} status={catalogStatus} selectedKey={featuredKey} onSelect={character=>setFeaturedKey(characterKey(character))} onRetry={()=>void loadCatalog()}/></div>:room.status==="lobby"?<RoomLobby room={room} userId={userId} catalog={catalog} catalogStatus={catalogStatus} onRetry={()=>void loadCatalog()} command={command} pending={pending} error={commandError}/>:<div>
      <p className="helper">Sala {room.code} · {room.mode}</p>
      <button disabled={!connected} onClick={() => command("leave")}>{room.status === "active" || room.status === "suspended" ? "Abandonar partida" : "Sair da sala"}</button>
      {commandError&&<p className="notice error" role="alert">{commandError.message}</p>}
      {room.status === "finished" && result && self && <ResultPanel result={result} team={self.team} userId={userId} onVote={() => void command("rematchVote")} />}
      {connected && connection.current && self && <Suspense fallback={<p role="status">Preparando quadra…</p>}><OnlineMatch key={snapshot?.matchId ?? room.roomId} snapshot={snapshot} connection={connection.current} userId={userId} team={self.team} slot={self.slot} feedback={feedback} characterName={selected?.name??"Seu atleta"} abilityAvailable={Boolean(selected?.abilityId&&!(selected.abilityConfig?.target==="teammate"&&room.mode==="1v1"))}/></Suspense>}
    </div>}
    {userId && <button onClick={() => { manualClose.current = true; clearTimeout(retryTimer.current); connection.current?.close(); }}>Desconectar</button>}
  </section>;
}
