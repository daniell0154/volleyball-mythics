import { createClient } from "@supabase/supabase-js";
import { createSupabaseVerifier } from "./network/auth.js";
import { createTransport } from "./network/server.js";
import { RoomApplication } from "./rooms/application.js";

async function main() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const publicKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !secret || !publicKey) throw new Error("Configure SUPABASE_URL, SUPABASE_SECRET_KEY e VITE_SUPABASE_ANON_KEY no .env da raiz.");
  const database = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await database.from("characters").select("id,version,name").eq("enabled", true);
  if (error || !data) throw new Error("Falha ao carregar catálogo do Supabase. Confira migrações e configuração local.");
  const app = new RoomApplication(data);
  const transport = createTransport({ verify: createSupabaseVerifier(url, publicKey),
    origins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173").split(",").map((s) => s.trim()),
    onConnect: (session) => app.connect(session), onCommand: (session, message) => app.command(session, message), onDisconnect: (session) => app.disconnect(session) });
  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isSafeInteger(port) || port <= 0 || port > 65535) throw new Error("PORT inválida");
  transport.http.listen(port, "127.0.0.1", () => console.log(`Servidor local: ws://127.0.0.1:${port}/socket`));
  const close = () => { void transport.close(); };
  process.once("SIGINT", close); process.once("SIGTERM", close);
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Falha ao iniciar servidor"); process.exitCode = 1; });
