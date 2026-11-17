import { createClient } from "@supabase/supabase-js";
import { createSupabaseVerifier } from "./network/auth.js";
import { createTransport } from "./network/server.js";
import { RoomApplication } from "./rooms/application.js";
import { MatchRuntime } from "./runtime/matches.js";
import { fileURLToPath } from "node:url";
import { ReconnectController } from "./reconnect/controller.js";
import { createResultsRepository } from "./persistence/results.js";
import { MatchResults } from "./results/coordinator.js";
import { MatchLifecycle } from "./lifecycle/matches.js";
import { VersionedCharacterCatalog } from "@volleyball-mythics/domain";

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publicKey) throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env da raiz.");
  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isSafeInteger(port) || port <= 0 || port > 65535) throw new Error("PORT inválida");
  const characterCatalog = new VersionedCharacterCatalog();
  const runtime = new MatchRuntime((room, snapshot) => app.broadcast(room, "snapshot", snapshot), Date.now,
    (id, version) => app.catalog.find((c) => c.id === id && c.version === version)?.assetKey,
    (id, version) => app.catalog.find((c) => c.id === id && c.version === version)?.attributes,
    (id, version) => { const character = app.catalog.find((c) => c.id === id && c.version === version); return character?.abilityId && character.abilityConfig ? { id: character.abilityId, config: character.abilityConfig } : undefined; },
    process.env.NODE_ENV === "development", Number(process.env.RALLY_RULES_VERSION ?? 3));
  const reconnect = new ReconnectController(runtime, (room, type, payload) => app.broadcast(room, type, payload));
  const results = new MatchResults(process.env.SUPABASE_SECRET_KEY ? createResultsRepository(url, process.env.SUPABASE_SECRET_KEY) : { persist: async () => { throw new Error("server_result_secret_missing"); } },
    (room, type, payload) => app.broadcast(room, type, payload), Date.now, (matchId) => console.error(`result_persistence_failed matchId=${matchId}`));
  const app = new RoomApplication([], { start: (room) => runtime.start(room), input: (room, userId, input) => runtime.submit(room, userId, input), suspend: (room) => reconnect.disconnect(room),
    reconnect: (room) => { lifecycle.reconnected(room); reconnect.reconnect(room); results.restore(room); }, abandon: (room, userId) => reconnect.abandon(room, userId),
    rematch: (room, userId) => lifecycle.vote(room, userId), finishedDisconnect: (room) => lifecycle.disconnected(room), remove: (roomId) => lifecycle.close(roomId) });
  const lifecycle = new MatchLifecycle(app.rooms, runtime, results, reconnect, (room, type, payload) => app.broadcast(room, type, payload),
    (room) => room.members.every((m) => m.character && app.catalog.some((c) => c.id === m.character!.id && c.version === m.character!.version)));
  runtime.onEnded = (match) => { reconnect.clear(match.room.roomId); results.finish(match); lifecycle.ended(match.room); };
  runtime.onPoint = (room, snapshot) => app.broadcast(room, "point", snapshot);
  runtime.onAction = (userId, message) => app.sendTo(userId, "actionFeedback", { message });
  if (process.env.RALLY_TELEMETRY === "1") runtime.onRallyMeasured = (measurement) => console.info(JSON.stringify({ type: "rallyMeasurement", ...measurement }));
  const verifyIdentity = createSupabaseVerifier(url, publicKey);
  const transport = createTransport({ verify: async (token) => {
    const identity = await verifyIdentity(token);
    // Read through authenticated RLS using this guest's token, never a service secret.
    const database = createClient(url, publicKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await database.from("characters").select("id,version,name,overall,asset_key,ability_id,ability_config,serve,receive,set_skill,attack,block,speed,jump").eq("enabled", true);
    if (error || !data) throw new Error("unauthorized");
    const revisions = characterCatalog.replaceEnabled(data.map((c) => ({ id: c.id, version: c.version, name: c.name, overall: c.overall, assetKey: c.asset_key,
      attributes: { serve: c.serve, receive: c.receive, set: c.set_skill, attack: c.attack, block: c.block, speed: c.speed, jump: c.jump },
      abilityId: c.ability_id, abilityConfig: c.ability_config
      })));
    app.refreshCatalog(revisions.map((c) => ({ id: c.id, version: c.version, name: c.name, overall: c.overall, ...(c.assetKey ? { assetKey: c.assetKey } : {}), attributes: c.attributes,
      ...(c.abilityId ? { abilityId: c.abilityId } : {}), ...(c.abilityConfig ? { abilityConfig: c.abilityConfig } : {}),
      ...(typeof c.abilityConfig?.name === "string" ? { abilityName: c.abilityConfig.name } : {}) })));
    return identity;
  },
    staticDirectory: fileURLToPath(new URL("../../web/dist/", import.meta.url)),
    origins: (process.env.ALLOWED_ORIGINS ?? `http://localhost:5173,http://127.0.0.1:5173,http://localhost:${port},http://127.0.0.1:${port}`).split(",").map((s) => s.trim()),
    onConnect: (session) => app.connect(session), onCommand: (session, message) => app.command(session, message), onDisconnect: (session) => app.disconnect(session) });
  const host = process.env.HOST ?? (process.env.RENDER ? "0.0.0.0" : "127.0.0.1");
  transport.http.listen(port, host, () => console.log(`Servidor iniciado em ${host}:${port}`));
  let previous = performance.now();
  const ticker = setInterval(() => { const now = performance.now(); reconnect.tick(); lifecycle.tick(); runtime.advance(Math.min(100, now - previous)); void results.queue.tick(); previous = now; }, 5);
  let closing: Promise<void> | undefined;
  const close = () => {
    if (closing) return;
    clearInterval(ticker);
    runtime.cancelForShutdown();
    closing = (async () => { await results.queue.tick(); await transport.close(); })();
    void closing.catch(() => { process.exitCode = 1; });
  };
  process.once("SIGINT", close); process.once("SIGTERM", close);
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Falha ao iniciar servidor"); process.exitCode = 1; });
