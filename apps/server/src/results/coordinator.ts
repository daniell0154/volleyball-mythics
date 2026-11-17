import type { MatchEnded, RoomState } from "@volleyball-mythics/protocol";
import type { RunningMatch } from "../runtime/matches.js";
import type { FinalMatchResult } from "../persistence/results.js";
import { ResultQueue } from "./queue.js";

export class MatchResults {
  private records = new Map<string, { room: RoomState; result: MatchEnded }>();
  readonly queue: ResultQueue;
  constructor(repository: { persist(result: FinalMatchResult, signal?: AbortSignal): Promise<void> },
    private emit: (room: RoomState, type: string, payload: unknown) => void, private now: () => number = Date.now,
    operationalFailure: (matchId: string) => void = () => {}) {
    this.queue = new ResultQueue(repository, (matchId, status) => {
      const record = [...this.records.values()].find((r) => r.result.matchId === matchId);
      if (!record) return;
      record.result = { ...record.result, persistence: status };
      this.emit(record.room, "resultSaveState", { matchId, persistence: status });
    }, now, operationalFailure);
  }
  finish(match: RunningMatch): void {
    const result: MatchEnded = { matchId: match.state.matchId, score: { ...match.state.score }, winner: match.winner, reason: match.reason ?? "server_failure", persistence: "pending", rematchVotes: [] };
    this.records.set(match.room.roomId, { room: match.room, result });
    this.emit(match.room, "roomState", match.room); this.emit(match.room, "matchEnded", result);
    const players = match.room.members.map((member) => {
      if (!member.character) throw new Error("match_missing_character_revision");
      return { userId: member.userId, team: member.team, slot: member.slot, characterId: member.character.id, characterVersion: member.character.version };
    });
    this.queue.enqueue({ matchId: result.matchId, mode: match.room.mode, score: result.score, winner: result.winner, reason: result.reason,
      status: result.winner ? "finished" : "cancelled", rulesVersion: match.state.rulesVersion, startedAt: match.startedAt, endedAt: new Date(this.now()).toISOString(), players });
  }
  restore(room: RoomState): void { const record = this.records.get(room.roomId); if (record) this.emit(room, "matchEnded", record.result); }
  get(roomId: string): MatchEnded | undefined { return this.records.get(roomId)?.result; }
  votes(room: RoomState, userIds: readonly string[]): void {
    const record = this.records.get(room.roomId); if (record) { record.result = { ...record.result, rematchVotes: [...userIds] }; this.emit(room, "matchEnded", record.result); }
  }
  clear(roomId: string): void {
    const record = this.records.get(roomId); if (record) this.queue.release(record.result.matchId);
    this.records.delete(roomId);
  }
}
