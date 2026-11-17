import { createClient } from "@supabase/supabase-js";
import { createSupabaseVerifier } from "./network/auth.js";
import { createTransport } from "./network/server.js";
import { RoomApplication } from "./rooms/application.js";
import { MatchRuntime } from "./runtime/matches.js";

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publicKey) throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env da raiz.");
  const runtime = new MatchRuntime((room, snapshot) => app.broadcast(room, "snapshot", snapshot));
  const app = new RoomApplication([], { start: (room) => runtime.start(room), input: (room, userId, input) => runtime.submit(room, userId, input), suspend: (room) => runtime.suspend(room), remove: (roomId) => runtime.remove(roomId) });
  const verifyIdentity = createSupabaseVerifier(url, publicKey);
  const transport = createTransport({ verify: async (token) => {
    const identity = await verifyIdentity(token);
    // Read through authenticated RLS using this guest's token, never a service secret.
    const database = createClient(url, publicKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await database.from("characters").select("id,version,name").eq("enabled", true);
    if (error || !data) throw new Error("unauthorized");
    app.refreshCatalog(data);
    return identity;
  },
    origins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173").split(",").map((s) => s.trim()),
    onConnect: (session) => app.connect(session), onCommand: (session, message) => app.command(session, message), onDisconnect: (session) => app.disconnect(session) });
  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isSafeInteger(port) || port <= 0 || port > 65535) throw new Error("PORT inválida");
  const host = process.env.HOST ?? (process.env.RENDER ? "0.0.0.0" : "127.0.0.1");
  transport.http.listen(port, host, () => console.log(`Servidor iniciado em ${host}:${port}`));
  let previous = performance.now();
  const ticker = setInterval(() => { const now = performance.now(); runtime.advance(Math.min(100, now - previous)); previous = now; }, 5);
  const close = () => { clearInterval(ticker); void transport.close(); };
  process.once("SIGINT", close); process.once("SIGTERM", close);
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Falha ao iniciar servidor"); process.exitCode = 1; });
