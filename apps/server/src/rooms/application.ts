import type { CatalogEntry, ClientMessage, InputPayload, RoomState } from "@volleyball-mythics/protocol";
import type { Session } from "../network/server.js";
import { RoomRegistry, RoomError } from "./registry.js";

export class RoomApplication {
  readonly rooms = new RoomRegistry();
  private sessions = new Map<string, Session>();
  constructor(public catalog: readonly CatalogEntry[], private hooks: {
    start?(room: RoomState): void;
    input?(room: RoomState, userId: string, input: InputPayload): void;
    suspend?(room: RoomState): void;
    remove?(roomId: string): void;
    reconnect?(room: RoomState, userId: string): void;
    abandon?(room: RoomState, userId: string): void;
  } = {}) {}
  refreshCatalog(catalog: readonly CatalogEntry[]): void {
    this.catalog = catalog;
    for (const room of this.rooms.all()) if (room.status === "lobby") {
      let changed = false;
      for (const member of room.members) if (member.character && !catalog.some((c) => c.id === member.character!.id && c.version === member.character!.version)) {
        member.character = null; changed = true;
      }
      if (changed) { this.rooms.invalidate(room); this.changed(room); }
    }
    for (const session of this.sessions.values()) session.send("catalog", catalog);
  }
  connect(session: Session): void {
    this.sessions.set(session.userId, session); session.send("catalog", this.catalog);
    try {
      const room = this.rooms.roomFor(session.userId); const member = room.members.find((m) => m.userId === session.userId)!;
      member.connected = true; this.hooks.reconnect?.(room, session.userId); this.changed(room);
    } catch { /* New guests have no room to restore. */ }
  }
  broadcast(room: RoomState, type: string, payload: unknown): void {
    for (const member of room.members) this.sessions.get(member.userId)?.send(type, payload);
  }
  private changed(room: RoomState): void { this.broadcast(room, "roomState", room); }
  disconnect(session: Session): void {
    this.sessions.delete(session.userId);
    let room: RoomState; try { room = this.rooms.roomFor(session.userId); } catch { return; }
    if (room.status === "lobby") { const remaining = this.rooms.leave(session.userId); if (remaining) this.changed(remaining); }
    else if (room.status === "finished") { const member = room.members.find((m) => m.userId === session.userId); if (member) member.connected = false; this.changed(room); }
    else {
      const member = room.members.find((m) => m.userId === session.userId)!; member.connected = false;
      room.status = "suspended"; this.hooks.suspend?.(room); this.changed(room);
    }
  }
  command(session: Session, message: ClientMessage): void {
    try {
      let room: RoomState;
      if (message.type === "createRoom") room = this.rooms.create(session.userId, message.payload.mode);
      else if (message.type === "joinRoom") room = this.rooms.join(session.userId, message.payload.code);
      else {
        room = this.rooms.roomFor(session.userId);
        const member = room.members.find((m) => m.userId === session.userId)!;
        if (message.type === "leave" && room.status !== "lobby" && room.status !== "finished") this.hooks.abandon?.(room, session.userId);
        if (message.type === "leave" && room.status === "finished") {
          const remaining = this.rooms.leave(session.userId); session.send("roomState", null); if (remaining) this.changed(remaining); else this.hooks.remove?.(room.roomId);
          session.send("ack", { requestId: message.requestId, result: null }); return;
        }
        if (message.type === "input") {
          if (room.status !== "active" || !this.hooks.input) throw new RoomError("invalid_state");
          this.hooks.input(room, session.userId, message.payload);
          session.send("ack", { requestId: message.requestId, result: null }); return;
        }
        if (room.status !== "lobby") throw new RoomError("invalid_state");
        switch (message.type) {
          case "selectCharacter": {
            const selected = this.catalog.find((c) => c.id === message.payload.characterId && c.version === message.payload.version);
            if (!selected) throw new RoomError("invalid_message");
            member.character = { id: selected.id, version: selected.version }; this.rooms.invalidate(room); break;
          }
          case "setTeam": {
            if ((room.mode === "1v1" && message.payload.slot !== 0) || room.members.some((m) => m !== member && m.team === message.payload.team && m.slot === message.payload.slot)) throw new RoomError("room_full");
            member.team = message.payload.team; member.slot = message.payload.slot; this.rooms.invalidate(room); break;
          }
          case "ready":
            if (message.payload.ready && !member.character) throw new RoomError("invalid_state");
            member.ready = message.payload.ready; break;
          case "start":
            if (room.ownerId !== session.userId) throw new RoomError("forbidden");
            if (room.members.length !== (room.mode === "1v1" ? 2 : 4) || room.members.some((m) => !m.ready || !m.character || !m.connected)) throw new RoomError("invalid_state");
            this.hooks.start?.(room); room.status = "active"; break;
          case "leave": {
            const remaining = this.rooms.leave(session.userId);
            session.send("roomState", null); if (remaining) this.changed(remaining);
            session.send("ack", { requestId: message.requestId, result: null }); return;
          }
          default: throw new RoomError("invalid_state");
        }
      }
      this.changed(room); session.send("ack", { requestId: message.requestId, result: { roomId: room.roomId, code: room.code } });
    } catch (error) { session.send("error", { requestId: message.requestId, code: error instanceof RoomError ? error.code : "invalid_state" }); }
  }
}
