import type { ClientMessage } from "@volleyball-mythics/protocol";
import { validateVisualActions } from "./visualActions.js";
type Command = ClientMessage["type"];
export class RoomConnection {
  private pending = new Map<string, { resolve(value: unknown): void; reject(error: Error): void; timeout: ReturnType<typeof setTimeout> }>();
  private socket: WebSocket;
  private counter = 0;
  constructor(url: string, private event: (type: string, payload: unknown) => void) {
    const parsed = new URL(url);
    if (!["ws:", "wss:"].includes(parsed.protocol) || (location.protocol === "https:" && parsed.protocol !== "wss:") || parsed.search || parsed.username || parsed.password) throw new Error("URL WebSocket inválida");
    this.socket = new WebSocket(url);
    this.socket.onmessage = ({ data }) => {
      try {
        const message = JSON.parse(data);
        if (message.protocolVersion !== 1) throw new Error("Versão incompatível");
        if (message.type === "ack" || message.type === "error") {
          const request = this.pending.get(message.payload.requestId);
          if (!request) return;
          clearTimeout(request.timeout); this.pending.delete(message.payload.requestId);
          if (message.type === "error") request.reject(new Error(message.payload.code)); else request.resolve(message.payload.result);
        } else {
          if (message.type === "snapshot") validateVisualActions(message.payload);
          this.event(message.type, message.payload);
        }
      } catch { this.socket.close(1002, "invalid_message"); }
    };
    this.socket.onclose = () => {
      for (const item of this.pending.values()) { clearTimeout(item.timeout); item.reject(new Error("Conexão encerrada")); }
      this.pending.clear(); this.event("disconnected", null);
    };
  }
  async authenticate(token: string): Promise<{ userId: string }> {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { this.socket.close(); reject(new Error("Tempo de conexão esgotado")); }, 5000);
      this.socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
      this.socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Não foi possível conectar")); }, { once: true });
    });
    return await this.request("auth", { accessToken: token }) as { userId: string };
  }
  request(type: Command | "auth", payload: unknown): Promise<unknown> {
    if (this.socket.readyState !== WebSocket.OPEN || this.pending.size >= 100) return Promise.reject(new Error("Conexão indisponível"));
    const requestId = String(++this.counter);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { this.pending.delete(requestId); reject(new Error("Tempo de resposta esgotado")); }, 5000);
      this.pending.set(requestId, { resolve, reject, timeout });
      this.socket.send(JSON.stringify({ protocolVersion: 1, type, requestId, payload }));
    });
  }
  close(): void { this.socket.close(); }
}
