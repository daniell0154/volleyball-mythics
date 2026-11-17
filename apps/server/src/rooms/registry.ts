import { randomInt, randomUUID } from "node:crypto";
import type { MatchMode, RoomState, ServerErrorCode } from "@volleyball-mythics/protocol";
export class RoomError extends Error { constructor(public readonly code: ServerErrorCode) { super(code); } }
export class RoomRegistry {
  private rooms = new Map<string, RoomState>();
  private membership = new Map<string, string>();
  roomFor(userId: string): RoomState {
    const code = this.membership.get(userId), room = code ? this.rooms.get(code) : undefined;
    if (!room) throw new RoomError("room_not_found");
    return room;
  }
  all(): readonly RoomState[] { return [...this.rooms.values()]; }
  destroy(room: RoomState): void { for (const member of room.members) this.membership.delete(member.userId); this.rooms.delete(room.code); }
  create(userId: string, mode: MatchMode): RoomState {
    if (this.membership.has(userId)) throw new RoomError("invalid_state");
    let code: string;
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    do { code = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join(""); } while (this.rooms.has(code));
    const room: RoomState = { roomId: randomUUID(), code, mode, ownerId: userId, status: "lobby", members: [] };
    this.rooms.set(code, room);
    this.add(room, userId); return room;
  }
  join(userId: string, code: string): RoomState {
    if (this.membership.has(userId)) throw new RoomError("invalid_state");
    const room = this.rooms.get(code);
    if (!room) throw new RoomError("room_not_found");
    if (room.status !== "lobby") throw new RoomError("invalid_state");
    this.add(room, userId); return room;
  }
  private add(room: RoomState, userId: string): void {
    const capacity = room.mode === "1v1" ? 1 : 2;
    for (const team of ["A", "B"] as const) for (const slot of [0, 1] as const) {
      if (slot >= capacity || room.members.some((member) => member.team === team && member.slot === slot)) continue;
      room.members.push({ userId, team, slot, character: null, ready: false, connected: true });
      this.membership.set(userId, room.code); this.invalidate(room); return;
    }
    throw new RoomError("room_full");
  }
  invalidate(room: RoomState): void { for (const member of room.members) member.ready = false; }
  leave(userId: string): RoomState | null {
    const room = this.roomFor(userId);
    if (room.status !== "lobby") throw new RoomError("invalid_state");
    room.members = room.members.filter((member) => member.userId !== userId);
    this.membership.delete(userId); this.invalidate(room);
    if (!room.members.length) { this.rooms.delete(room.code); return null; }
    if (room.ownerId === userId) room.ownerId = room.members[0]!.userId;
    return room;
  }
}
