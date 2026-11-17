import { useEffect, useRef, useState } from "react";
import type { CatalogEntry, ClientMessage, RoomState, MatchSnapshot } from "@volleyball-mythics/protocol";
import { createWebSupabaseClient, saveGuestProfile } from "../auth/client.js";
import { RoomConnection } from "../network/connection.js";
import { OnlineMatch } from "../game/OnlineMatch.js";
import { gameServerUrl } from "../network/serverUrl.js";
import { CharacterPreview } from "../scene/CharacterPreview.js";

export function Lobby() {
  const connection = useRef<RoomConnection | null>(null);
  const clientRef = useRef<ReturnType<typeof createWebSupabaseClient> | null>(null);
  const roomRef = useRef<RoomState | null>(null);
  const manualClose = useRef(false);
  const alive = useRef(true);
  const connecting = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const retryDeadline = useRef(0);
  const connectLatest = useRef<() => Promise<void>>(async () => {});
  const [room, setRoom] = useState<RoomState | null>(null);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState(new URLSearchParams(location.search).get("room")?.toUpperCase() ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [reconnectStatus, setReconnectStatus] = useState("");
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);
  useEffect(() => () => { alive.current = false; manualClose.current = true; clearTimeout(retryTimer.current); connection.current?.close(); }, []);
  const scheduleRetry = () => {
    if (manualClose.current || !alive.current || !roomRef.current || retryTimer.current !== undefined) return;
    if (!retryDeadline.current) retryDeadline.current = Date.now() + 20000;
    if (Date.now() >= retryDeadline.current) { setReconnectStatus("Não foi possível reconectar no prazo. Entre novamente para consultar o resultado."); setUserId(""); return; }
    setReconnectStatus("Conexão interrompida. Reconectando…");
    retryTimer.current = setTimeout(() => { retryTimer.current = undefined; void connectLatest.current(); }, 1000);
  };
  const connect = async () => {
    if (connecting.current) return;
    connecting.current = true; manualClose.current = false;
    setBusy(true); setError("");
    try {
      const client = clientRef.current ?? createWebSupabaseClient({ url: import.meta.env.VITE_SUPABASE_URL ?? "", publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "" });
      clientRef.current = client;
      let { data: { session } } = await client.auth.getSession();
      if (!session) {
        const result = await client.auth.signInAnonymously(); if (result.error) throw result.error; session = result.data.session;
      }
      if (!session) throw new Error("Sessão guest indisponível");
      await saveGuestProfile(client, name);
      const socket = new RoomConnection(gameServerUrl(location.href, import.meta.env.DEV, import.meta.env.VITE_GAME_SERVER_URL), (type, payload) => {
        if (type === "roomState") { roomRef.current = payload as RoomState | null; setRoom(roomRef.current); if (!payload) setSnapshot(null); }
        if (type === "catalog") setCatalog(payload as CatalogEntry[]);
        if (type === "snapshot") setSnapshot(payload as MatchSnapshot);
        if (type === "reconnectState") {
          const status = payload as { remainingSeconds: { A: number; B: number }; resumeSeconds: number | null };
          setReconnectStatus(status.resumeSeconds !== null ? `Retomando em ${status.resumeSeconds}s` : roomRef.current?.status === "suspended" ? `Aguardando reconexão · A ${status.remainingSeconds.A}s / B ${status.remainingSeconds.B}s` : "");
        }
        if (type === "disconnected" && connection.current === socket && alive.current) {
          setConnected(false);
          if (!manualClose.current && roomRef.current) scheduleRetry();
          else { setUserId(""); roomRef.current = null; setRoom(null); setError("Conexão encerrada."); }
        }
      });
      connection.current = socket;
      const identity = await socket.authenticate(session.access_token); setUserId(identity.userId); setConnected(true); retryDeadline.current = 0;
      if (roomRef.current?.status !== "suspended") setReconnectStatus("");
    } catch (e) { connection.current?.close(); setError(e instanceof Error ? e.message : "Falha de conexão"); scheduleRetry(); }
    finally { connecting.current = false; if (alive.current) setBusy(false); }
  };
  connectLatest.current = connect;
  const command = async (type: ClientMessage["type"], payload: unknown = {}) => {
    setError(""); try { await connection.current?.request(type, payload); } catch (e) { setError(e instanceof Error ? e.message : "Falha no comando"); }
  };
  const self = room?.members.find((m) => m.userId === userId);
  const selected = catalog.find((c) => c.id === self?.character?.id && c.version === self?.character?.version);
  return <section style={{ color: "#f0f6ff", padding: 20, fontFamily: "sans-serif" }}>
    <h1>Sala privada</h1>
    {error && <p role="alert">{error}</p>}
    {reconnectStatus && <p role="status">{reconnectStatus}</p>}
    {!userId ? <div>
      <label>Nome de exibição <input value={name} minLength={2} maxLength={24} onChange={(e) => setName(e.target.value)} /></label>
      <button disabled={busy || name.trim().length < 2} onClick={connect}>{busy ? "Conectando…" : "Entrar como guest"}</button>
    </div> : !room ? <div>
      <button onClick={() => command("createRoom", { mode: "1v1" })}>Criar 1v1</button>
      <button onClick={() => command("createRoom", { mode: "2v2" })}>Criar 2v2</button>
      <label>Código <input value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} /></label>
      <button disabled={!/^[A-Z2-9]{6}$/.test(code)} onClick={() => command("joinRoom", { code })}>Entrar na sala</button>
    </div> : <div>
      <p>{room.mode} · {room.code} · {room.status}</p>
      <p>Convite: <a style={{ color: "#a8f5cb" }} href={`${location.origin}/?room=${room.code}`}>{`${location.origin}/?room=${room.code}`}</a></p>
      <ul>{room.members.map((member) => <li key={member.userId}>{member.userId === userId ? "Você" : member.userId.slice(0, 8)} · {member.team}/{member.slot + 1} · {member.ready ? "Pronto" : "Aguardando"}{member.userId === room.ownerId ? " · Dono" : ""}</li>)}</ul>
      {!catalog.length && <p>O catálogo ainda está vazio. O proprietário precisa fornecer o elenco antes de iniciar partidas.</p>}
      <label>Personagem <select disabled={room.status !== "lobby"} value={self?.character ? JSON.stringify([self.character.id, self.character.version]) : ""} onChange={(e) => { const [characterId, version] = JSON.parse(e.target.value); void command("selectCharacter", { characterId, version }); }}>
        <option value="" disabled>Selecionar</option>{catalog.map((c) => <option key={`${c.id}:${c.version}`} value={JSON.stringify([c.id, c.version])}>{c.name}{c.overall !== undefined ? ` · ${c.overall}` : ""} · v{c.version}</option>)}
      </select></label>
      {selected?.assetKey && <CharacterPreview assetKey={selected.assetKey} team={self?.team ?? "A"} />}
      {selected?.abilityName && <p>Habilidade: {selected.abilityName} · efeito em breve.</p>}
      <label>Equipe/posição <select disabled={room.status !== "lobby"} value={self ? `${self.team}:${self.slot}` : ""} onChange={(e) => { const [team, slot] = e.target.value.split(":"); void command("setTeam", { team, slot: Number(slot) }); }}>
        {(["A", "B"] as const).flatMap((team) => (room.mode === "1v1" ? [0] : [0, 1]).map((slot) => <option key={`${team}:${slot}`} value={`${team}:${slot}`} disabled={room.members.some((m) => m.userId !== userId && m.team === team && m.slot === slot)}>{team}/{slot + 1}</option>))}
      </select></label>
      <button disabled={!self?.character || room.status !== "lobby"} onClick={() => command("ready", { ready: !self?.ready })}>{self?.ready ? "Não pronto" : "Pronto"}</button>
      {room.ownerId === userId && <button disabled={room.status !== "lobby"} onClick={() => command("start")}>Iniciar</button>}
      <button disabled={!connected} onClick={() => command("leave")}>{room.status === "active" || room.status === "suspended" ? "Abandonar partida" : "Sair da sala"}</button>
      {room.status !== "lobby" && connected && connection.current && self && <OnlineMatch key={snapshot?.matchId ?? room.roomId} snapshot={snapshot} connection={connection.current} userId={userId} team={self.team} slot={self.slot} />}
    </div>}
    {userId && <button onClick={() => { manualClose.current = true; clearTimeout(retryTimer.current); connection.current?.close(); }}>Desconectar</button>}
  </section>;
}
