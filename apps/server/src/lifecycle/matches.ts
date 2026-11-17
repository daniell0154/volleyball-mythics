import type { RoomState } from "@volleyball-mythics/protocol";
import type { MatchRuntime } from "../runtime/matches.js";
import type { MatchResults } from "../results/coordinator.js";
import type { ReconnectController } from "../reconnect/controller.js";
import { RoomError, type RoomRegistry } from "../rooms/registry.js";
export class MatchLifecycle {
  private votes = new Map<string, Set<string>>();
  private expiry = new Map<string, number>();
  constructor(private rooms: RoomRegistry, private runtime: MatchRuntime, private results: MatchResults,
    private reconnect: ReconnectController, private broadcast: (room: RoomState, type: string, payload: unknown) => void,
    private validSelection: (room: RoomState) => boolean, private now: () => number = Date.now) {}
  vote(room: RoomState, userId: string): void {
    if (room.status !== "finished" || !this.results.get(room.roomId) || !room.members.some((m) => m.userId === userId && m.connected)) throw new RoomError("invalid_state");
    if (room.members.length !== (room.mode === "1v1" ? 2 : 4) || !this.validSelection(room)) throw new RoomError("invalid_state");
    let votes = this.votes.get(room.roomId); if (!votes) { votes = new Set(); this.votes.set(room.roomId, votes); }
    votes.add(userId); this.results.votes(room, [...votes]);
    if (room.members.some((m) => !m.connected || !votes!.has(m.userId))) return;
    this.results.clear(room.roomId); this.reconnect.clear(room.roomId); this.votes.delete(room.roomId); this.expiry.delete(room.roomId);
    room.status = "active"; this.runtime.start(room); this.broadcast(room, "roomState", room);
  }
  ended(room: RoomState): void { this.votes.delete(room.roomId); if (room.members.every((m) => !m.connected)) this.expiry.set(room.roomId, this.now() + 20000); }
  disconnected(room: RoomState): void {
    const votes = this.votes.get(room.roomId);
    if (votes) for (const member of room.members) if (!member.connected) votes.delete(member.userId);
    if (votes) this.results.votes(room, [...votes]);
    if (room.members.every((m) => !m.connected)) this.expiry.set(room.roomId, this.now() + 20000);
  }
  reconnected(room: RoomState): void { this.expiry.delete(room.roomId); }
  tick(): void { for (const [roomId, deadline] of this.expiry) if (this.now() >= deadline) this.close(roomId); }
  close(roomId: string): void {
    const room = this.rooms.all().find((r) => r.roomId === roomId);
    if (room) this.rooms.destroy(room);
    this.runtime.remove(roomId); this.reconnect.clear(roomId); this.results.clear(roomId); this.votes.delete(roomId); this.expiry.delete(roomId);
  }
}
