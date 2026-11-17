import type { RoomState, Team } from "@volleyball-mythics/protocol";
import type { MatchRuntime } from "../runtime/matches.js";
interface Waiting { room: RoomState; used: Record<Team, number>; since: Partial<Record<Team, number>>; resumeAt: number | null; lastStatus: string }
export class ReconnectController {
  private rooms = new Map<string, Waiting>();
  constructor(private runtime: MatchRuntime, private broadcast: (room: RoomState, type: string, payload: unknown) => void, private now: () => number = Date.now) {}
  disconnect(room: RoomState): void {
    if (this.runtime.get(room.roomId)?.ended) return;
    let waiting = this.rooms.get(room.roomId);
    if (!waiting) { waiting = { room, used: { A: 0, B: 0 }, since: {}, resumeAt: null, lastStatus: "" }; this.rooms.set(room.roomId, waiting); }
    waiting.resumeAt = null;
    for (const team of ["A", "B"] as const) if (room.members.some((m) => m.team === team && !m.connected) && waiting.since[team] === undefined) waiting.since[team] = this.now();
    room.status = "suspended"; this.runtime.suspend(room); this.tick();
  }
  reconnect(room: RoomState): void {
    const waiting = this.rooms.get(room.roomId);
    if (!waiting || this.runtime.get(room.roomId)?.ended) { this.runtime.sendCurrent(room); return; }
    const now = this.now();
    // Enforce the deadline before accepting the return; 20.000s is already late.
    for (const team of ["A", "B"] as const) {
      const since = waiting.since[team];
      if (since !== undefined && now - since >= Math.min(20000, 40000 - waiting.used[team])) {
        const other: Team = team === "A" ? "B" : "A";
        const bothMissing = room.members.some((m) => m.team === other && !m.connected);
        this.runtime.finish(room, bothMissing ? null : other, bothMissing ? "server_failure" : "forfeit"); this.clear(room.roomId); return;
      }
    }
    for (const team of ["A", "B"] as const) if (!room.members.some((m) => m.team === team && !m.connected)) {
      const since = waiting.since[team]; if (since !== undefined) { waiting.used[team] += now - since; delete waiting.since[team]; }
    }
    if (room.members.every((m) => m.connected)) waiting.resumeAt = now + 3000;
    this.runtime.sendCurrent(room); this.publish(waiting);
  }
  abandon(room: RoomState, userId: string): void {
    const team = room.members.find((m) => m.userId === userId)?.team;
    if (team) this.runtime.finish(room, team === "A" ? "B" : "A", "forfeit");
    this.clear(room.roomId);
  }
  clear(roomId: string): void { this.rooms.delete(roomId); }
  tick(): void {
    const now = this.now();
    for (const waiting of this.rooms.values()) {
      if (this.runtime.get(waiting.room.roomId)?.ended) { this.clear(waiting.room.roomId); continue; }
      let expired: Team | null = null;
      for (const team of ["A", "B"] as const) {
        const since = waiting.since[team];
        if (since !== undefined && now - since >= Math.min(20000, 40000 - waiting.used[team])) expired = team;
      }
      if (expired) {
        const missingA = waiting.since.A !== undefined, missingB = waiting.since.B !== undefined;
        const winner = missingA && missingB ? null : expired === "A" ? "B" : "A";
        this.runtime.finish(waiting.room, winner, winner ? "forfeit" : "server_failure"); this.clear(waiting.room.roomId); continue;
      }
      if (waiting.resumeAt !== null && now >= waiting.resumeAt) {
        waiting.resumeAt = null; waiting.room.status = "active"; this.runtime.resume(waiting.room);
        this.broadcast(waiting.room, "roomState", waiting.room);
      }
      this.publish(waiting);
    }
  }
  private publish(waiting: Waiting): void {
    const now = this.now();
    const remaining = (team: Team) => Math.max(0, Math.ceil((Math.min(20000, 40000 - waiting.used[team]) - (waiting.since[team] === undefined ? 0 : now - waiting.since[team]!)) / 1000));
    const payload = { remainingSeconds: { A: remaining("A"), B: remaining("B") }, resumeSeconds: waiting.resumeAt === null ? null : Math.max(0, Math.ceil((waiting.resumeAt - now) / 1000)) };
    const signature = JSON.stringify(payload); if (signature !== waiting.lastStatus) { this.broadcast(waiting.room, "reconnectState", payload); waiting.lastStatus = signature; }
  }
}
