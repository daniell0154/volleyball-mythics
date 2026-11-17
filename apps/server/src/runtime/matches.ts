import { randomUUID } from "node:crypto";
import { DEFAULT_RULES, ballConfigFromRules, moveAthlete, stepBall, type BallState } from "@volleyball-mythics/domain";
import type { InputPayload, MatchSnapshot, RoomState, Vector3 } from "@volleyball-mythics/protocol";
interface Athlete { id: string; team: "A" | "B"; slot: number; position: Vector3; velocityY: number }
interface RunningMatch {
  room: RoomState; matchId: string; tick: number; phase: MatchSnapshot["phase"];
  athletes: Athlete[]; ball: BallState; pending: Map<string, InputPayload>;
  receivedSeq: Record<string, number>; processedSeq: Record<string, number>;
  receivedTick: Record<string, number>;
}
export class MatchRuntime {
  private matches = new Map<string, RunningMatch>();
  private accumulator = 0;
  constructor(private emit: (room: RoomState, snapshot: MatchSnapshot) => void, private now: () => number = Date.now) {}
  start(room: RoomState): void {
    const athletes = room.members.map((m) => ({ id: m.userId, team: m.team, slot: m.slot,
      position: { x: room.mode === "1v1" ? 0 : m.slot === 0 ? -2 : 2, y: 0, z: m.team === "A" ? -6 : 6 }, velocityY: 0 }));
    this.matches.set(room.roomId, { room, matchId: randomUUID(), tick: 0, phase: "countdown", athletes,
      ball: { position: { x: 0, y: 1, z: -6 }, velocity: { x: 0, y: 0, z: 0 }, grounded: false },
      pending: new Map(), receivedTick: {}, receivedSeq: Object.fromEntries(athletes.map((a) => [a.id, 0])), processedSeq: Object.fromEntries(athletes.map((a) => [a.id, 0])) });
  }
  submit(room: RoomState, userId: string, input: InputPayload): void {
    const match = this.matches.get(room.roomId);
    if (!match || match.phase === "disconnectedSuspension" || !Object.hasOwn(match.receivedSeq, userId) || input.seq <= match.receivedSeq[userId]!) return;
    match.receivedSeq[userId] = input.seq;
    match.receivedTick[userId] = match.tick;
    const previous = match.pending.get(userId);
    // Merge discrete actions within one simulation tick; never replay old inputs.
    match.pending.set(userId, { ...input, actions: match.phase === "countdown" ? [] : [...new Set([...(previous?.actions ?? []), ...input.actions])] });
  }
  suspend(room: RoomState): void {
    const match = this.matches.get(room.roomId);
    if (match) { match.phase = "disconnectedSuspension"; match.pending.clear(); this.emit(room, this.snapshot(match)); }
  }
  remove(roomId: string): void { this.matches.delete(roomId); }
  advance(milliseconds: number): void {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) throw new Error("invalid elapsed time");
    this.accumulator += milliseconds;
    const interval = 1000 / 60;
    while (this.accumulator + 1e-9 >= interval) {
      this.accumulator -= interval;
      for (const match of this.matches.values()) {
        if (match.phase === "disconnectedSuspension") continue;
        this.step(match);
        if (match.tick % 3 === 0) this.emit(match.room, this.snapshot(match));
      }
    }
  }
  private step(match: RunningMatch): void {
    match.tick++;
    if (match.tick >= 180 && match.phase === "countdown") match.phase = "serving";
    const dt = DEFAULT_RULES.fixedDeltaSeconds;
    for (const athlete of match.athletes) {
      const stored = match.pending.get(athlete.id);
      const input = stored && match.tick - (match.receivedTick[athlete.id] ?? 0) <= 15 ? stored : undefined;
      if (!input) continue;
      match.processedSeq[athlete.id] = input.seq;
      if (match.phase === "countdown") continue;
      athlete.position = moveAthlete(athlete.position, { x: input.moveX, z: input.moveZ }, 5, dt, {
        minX: -4.175, maxX: 4.175, minZ: athlete.team === "A" ? -8.675 : 0.325, maxZ: athlete.team === "A" ? -0.325 : 8.675 });
      if (input.actions.includes("jump") && athlete.position.y === 0) athlete.velocityY = 6.5;
      if (match.phase === "serving" && athlete.team === "A" && athlete.slot === 0 && input.actions.includes("serve")) {
        match.ball = { position: { ...athlete.position, y: athlete.position.y + 1 }, velocity: { x: 0, y: 7, z: 8 }, grounded: false };
        match.phase = "rally";
      }
      // Movement persists between inputs; discrete actions are consumed once.
      match.pending.set(athlete.id, { ...input, actions: [] });
    }
    for (const athlete of match.athletes) if (athlete.position.y > 0 || athlete.velocityY > 0) {
      athlete.velocityY -= DEFAULT_RULES.gravity * dt;
      const y = Math.max(0, athlete.position.y + athlete.velocityY * dt);
      athlete.position = { ...athlete.position, y }; if (y === 0) athlete.velocityY = 0;
    }
    if (match.phase === "serving") {
      const server = match.athletes.find((a) => a.team === "A" && a.slot === 0)!;
      match.ball = { ...match.ball, position: { ...server.position, y: server.position.y + 1 } };
    } else if (match.phase === "rally") match.ball = stepBall(match.ball, ballConfigFromRules(DEFAULT_RULES)).state;
  }
  private snapshot(match: RunningMatch): MatchSnapshot {
    return { matchId: match.matchId, tick: match.tick, phase: match.phase, score: { A: 0, B: 0 }, serverTime: this.now(),
      lastProcessedSeq: { ...match.processedSeq }, athletes: match.athletes.map((a) => ({ id: a.id, team: a.team, position: { ...a.position } })), ball: { ...match.ball.position }, cooldowns: {} };
  }
}
