import { useEffect, useRef, useState } from "react";
import type { CatalogEntry, ClientMessage, RoomState } from "@volleyball-mythics/protocol";
import { createWebSupabaseClient, saveGuestProfile } from "../auth/client.js";
import { RoomConnection } from "../network/connection.js";

export function Lobby() {
  const connection = useRef<RoomConnection | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState(new URLSearchParams(location.search).get("room")?.toUpperCase() ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [snapshot, setSnapshot] = useState<unknown>(null);
  useEffect(() => () => connection.current?.close(), []);
  const connect = async () => {
    setBusy(true); setError("");
    try {
      const client = createWebSupabaseClient({ url: import.meta.env.VITE_SUPABASE_URL ?? "", publishableKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "" });
      let { data: { session } } = await client.auth.getSession();
      if (!session) {
        const result = await client.auth.signInAnonymously(); if (result.error) throw result.error; session = result.data.session;
      }
      if (!session) throw new Error("Sessão guest indisponível");
      await saveGuestProfile(client, name);
      const socket = new RoomConnection(import.meta.env.VITE_GAME_SERVER_URL ?? "ws://localhost:3001/socket", (type, payload) => {
        if (type === "roomState") setRoom(payload as RoomState | null);
        if (type === "catalog") setCatalog(payload as CatalogEntry[]);
        if (type === "snapshot") setSnapshot(payload);
        if (type === "disconnected") { setUserId(""); setRoom(null); setError("Conexão encerrada. Conecte novamente."); }
      });
      connection.current = socket;
      const identity = await socket.authenticate(session.access_token); setUserId(identity.userId);
    } catch (e) { connection.current?.close(); setError(e instanceof Error ? e.message : "Falha de conexão"); }
    finally { setBusy(false); }
  };
  const command = async (type: ClientMessage["type"], payload: unknown = {}) => {
    setError(""); try { await connection.current?.request(type, payload); } catch (e) { setError(e instanceof Error ? e.message : "Falha no comando"); }
  };
  const self = room?.members.find((m) => m.userId === userId);
  return <section style={{ color: "#f0f6ff", padding: 20, fontFamily: "sans-serif" }}>
    <h1>Sala privada</h1>
    {error && <p role="alert">{error}</p>}
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
        <option value="" disabled>Selecionar</option>{catalog.map((c) => <option key={`${c.id}:${c.version}`} value={JSON.stringify([c.id, c.version])}>{c.name} · v{c.version}</option>)}
      </select></label>
      <label>Equipe/posição <select disabled={room.status !== "lobby"} value={self ? `${self.team}:${self.slot}` : ""} onChange={(e) => { const [team, slot] = e.target.value.split(":"); void command("setTeam", { team, slot: Number(slot) }); }}>
        {(["A", "B"] as const).flatMap((team) => (room.mode === "1v1" ? [0] : [0, 1]).map((slot) => <option key={`${team}:${slot}`} value={`${team}:${slot}`} disabled={room.members.some((m) => m.userId !== userId && m.team === team && m.slot === slot)}>{team}/{slot + 1}</option>))}
      </select></label>
      <button disabled={!self?.character || room.status !== "lobby"} onClick={() => command("ready", { ready: !self?.ready })}>{self?.ready ? "Não pronto" : "Pronto"}</button>
      {room.ownerId === userId && <button disabled={room.status !== "lobby"} onClick={() => command("start")}>Iniciar</button>}
      <button disabled={room.status !== "lobby"} onClick={() => command("leave")}>Sair da sala</button>
      {snapshot !== null && <p>Estado de partida recebido.</p>}
    </div>}
    {userId && <button onClick={() => connection.current?.close()}>Desconectar</button>}
  </section>;
}
