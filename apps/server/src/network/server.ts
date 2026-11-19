import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import type { ClientMessage } from "@volleyball-mythics/protocol";
import type { Identity, VerifyToken } from "./auth.js";
import { parseAuth, parseEnvelope } from "./envelope.js";
import { createStaticHandler } from "./static.js";

export interface SharedMessageEncoding { text?: string }
export interface Session extends Identity { send(type: string, payload: unknown, encoding?: SharedMessageEncoding): void }
export function createTransport(options: {
  verify: VerifyToken;
  origins: readonly string[];
  onCommand(session: Session, message: ClientMessage): void;
  onConnect?(session: Session): void;
  onDisconnect?(session: Session): void;
  authTimeoutMs?: number;
  staticDirectory?: string;
}) {
  const handler = options.staticDirectory ? createStaticHandler(options.staticDirectory) : undefined;
  const http = createServer((request, response) => {
    if (handler) { void handler(request, response); return; }
    response.writeHead(200, { "Content-Type": "text/plain" }); response.end("Volleyball Mythics\n");
  });
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 8192, perMessageDeflate: false });
  const identities = new Set<string>();
  http.on("upgrade", (request, socket, head) => {
    if (request.url !== "/socket" || !request.headers.origin || !options.origins.includes(request.headers.origin)) {
      socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n"); return;
    }
    sockets.handleUpgrade(request, socket, head, (ws) => sockets.emit("connection", ws));
  });
  sockets.on("connection", (ws) => {
    let alive = true;
    ws.on("pong", () => { alive = true; });
    const heartbeat = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) return;
      if (!alive) { ws.terminate(); return; }
      alive = false; ws.ping();
    }, 5000);
    let session: Session | undefined;
    let verifying = false;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    const timeout = setTimeout(() => ws.close(1008, "unauthorized"), options.authTimeoutMs ?? 5000);
    let windowStart = Date.now(), inputs = 0, commands = 0;
    const send = (type: string, payload: unknown, encoding?: SharedMessageEncoding) => { if (ws.readyState === WebSocket.OPEN) {
      if (ws.bufferedAmount > 65536) { ws.close(1013, "slow_consumer"); return; }
      const text = encoding?.text ?? JSON.stringify({ protocolVersion: 1, type, payload });
      if (encoding) encoding.text = text;
      ws.send(text);
    } };
    ws.on("error", () => {}); // Never log frame contents or authentication tokens.
    ws.on("close", () => {
      clearTimeout(timeout); clearTimeout(expiry); clearInterval(heartbeat);
      if (session) { identities.delete(session.userId); options.onDisconnect?.(session); }
    });
    ws.on("message", async (data, binary) => {
      const bytes = Array.isArray(data) ? Buffer.concat(data) : data instanceof ArrayBuffer ? Buffer.from(data) : data;
      if (binary || bytes.byteLength > 8192) { ws.close(1009, "invalid_message"); return; }
      if (!session) {
        const auth = parseAuth(bytes.toString());
        if (!auth || verifying) { ws.close(1008, "unauthorized"); return; }
        verifying = true;
        try {
          const identity = await options.verify(auth.token);
          if (ws.readyState !== WebSocket.OPEN) return;
          if (!identity.userId || !Number.isFinite(identity.expiresAt) || identity.expiresAt <= Date.now() || identities.has(identity.userId)) throw new Error("unauthorized");
          session = { ...identity, send }; identities.add(identity.userId); clearTimeout(timeout);
          expiry = setTimeout(() => ws.close(1008, "unauthorized"), Math.min(2147483647, identity.expiresAt - Date.now()));
          send("ack", { requestId: auth.requestId, result: { userId: identity.userId } });
          options.onConnect?.(session);
        } catch { ws.close(1008, "unauthorized"); }
        return;
      }
      if (session.expiresAt <= Date.now()) { ws.close(1008, "unauthorized"); return; }
      const message = parseEnvelope(bytes.toString());
      if (!message) { send("error", { requestId: "", code: "invalid_message" }); return; }
      if (Date.now() - windowStart >= 1000) { windowStart = Date.now(); inputs = commands = 0; }
      if ((message.type === "input" ? ++inputs > 60 : ++commands > 10)) { send("error", { requestId: message.requestId, code: "rate_limited" }); return; }
      try { options.onCommand(session, message); }
      catch { send("error", { requestId: message.requestId, code: "invalid_state" }); }
    });
  });
  return {
    http,
    async close() { for (const ws of sockets.clients) ws.terminate(); await new Promise<void>((resolve) => sockets.close(() => resolve())); await new Promise<void>((resolve) => http.close(() => resolve())); },
  };
}
