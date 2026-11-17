import { randomUUID } from "node:crypto";
import { DEFAULT_RULES, ballConfigFromRules, moveAthlete, stepBall, createMatch, transition, createBallContactState, applyContact, resolveGround, type BallState, type MatchState, type BallContactState } from "@volleyball-mythics/domain";
import type { InputPayload, MatchSnapshot, RoomState, Vector3, Team, CharacterAttributes } from "@volleyball-mythics/protocol";
export interface Athlete { id: string; team: Team; slot: number; position: Vector3; velocityY: number; assetKey?: string; attributes: CharacterAttributes }
export interface RunningMatch {
  room: RoomState; state: MatchState; tick: number; phaseTicks: number; startedAt: string;
  athletes: Athlete[]; ball: BallState; contacts: BallContactState; touching: Set<string>;
  pending: Map<string, InputPayload>; receivedSeq: Record<string, number>; processedSeq: Record<string, number>; receivedTick: Record<string, number>;
  suspended: boolean; pointReason: string; winner: Team | null; reason: "points" | "forfeit" | "server_failure" | null; ended: boolean;
}
const fallbackAttributes: CharacterAttributes = { serve: 75, receive: 75, set: 75, attack: 75, block: 75, speed: 75, jump: 75 };
const distance = (a: Vector3, b: Vector3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export class MatchRuntime {
  private matches = new Map<string, RunningMatch>();
  private accumulator = 0;
  onEnded: (match: RunningMatch) => void = () => {};
  onPoint: (room: RoomState, snapshot: MatchSnapshot) => void = () => {};
  constructor(private emit: (room: RoomState, snapshot: MatchSnapshot) => void, private now: () => number = Date.now,
    private resolveAsset: (id: string, version: number) => string | undefined = () => undefined,
    private resolveAttributes: (id: string, version: number) => CharacterAttributes | undefined = () => undefined) {}
  start(room: RoomState): void {
    const athletes: Athlete[] = room.members.map((member) => {
      const key = member.character ? this.resolveAsset(member.character.id, member.character.version) : undefined;
      const attributes = member.character ? this.resolveAttributes(member.character.id, member.character.version) : undefined;
      return { id: member.userId, team: member.team, slot: member.slot, ...(key ? { assetKey: key } : {}), attributes: { ...(attributes ?? fallbackAttributes) },
        position: { x: room.mode === "1v1" ? 0 : member.slot ? 2 : -2, y: 0, z: member.team === "A" ? -6 : 6 }, velocityY: 0 };
    });
    const match: RunningMatch = { room, state: transition(createMatch(randomUUID(), room.mode), { type: "START" }), tick: 0, phaseTicks: 0, startedAt: new Date(this.now()).toISOString(), athletes,
      ball: { position: { x: 0, y: 1, z: -6 }, velocity: { x: 0, y: 0, z: 0 }, grounded: false }, contacts: createBallContactState(room.mode), touching: new Set(), pending: new Map(), receivedTick: {},
      receivedSeq: Object.fromEntries(athletes.map((a) => [a.id, 0])), processedSeq: Object.fromEntries(athletes.map((a) => [a.id, 0])), suspended: false, pointReason: "", winner: null, reason: null, ended: false };
    this.matches.set(room.roomId, match); this.emit(room, this.snapshot(match));
  }
  get(roomId: string): RunningMatch | undefined { return this.matches.get(roomId); }
  submit(room: RoomState, userId: string, input: InputPayload): void {
    const match = this.matches.get(room.roomId);
    if (!match || match.ended || match.suspended || !Object.hasOwn(match.receivedSeq, userId) || input.seq <= match.receivedSeq[userId]!) return;
    match.receivedSeq[userId] = input.seq; match.receivedTick[userId] = match.tick;
    const previous = match.pending.get(userId);
    match.pending.set(userId, { ...input, actions: !["serving", "rally"].includes(match.state.phase) ? [] : [...new Set([...(previous?.actions ?? []), ...input.actions])] });
  }
  suspend(room: RoomState): void { const match = this.matches.get(room.roomId); if (match && !match.ended) { match.suspended = true; match.pending.clear(); this.emit(room, this.snapshot(match)); } }
  resume(room: RoomState): void { const match = this.matches.get(room.roomId); if (match && !match.ended) { match.suspended = false; match.pending.clear(); this.emit(room, this.snapshot(match)); } }
  remove(roomId: string): void { this.matches.delete(roomId); }
  finish(room: RoomState, winner: Team | null, reason: "forfeit" | "server_failure"): void {
    const match = this.matches.get(room.roomId); if (!match || match.ended) return;
    match.winner = winner; match.reason = reason;
    match.state = { ...match.state, phase: winner ? "finished" : "cancelled" }; this.end(match);
  }
  sendCurrent(room: RoomState): void { const match = this.matches.get(room.roomId); if (match) this.emit(room, this.snapshot(match)); }
  advance(milliseconds: number): void {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) throw new Error("invalid elapsed time");
    this.accumulator += milliseconds;
    while (this.accumulator + 1e-9 >= 1000 / 60) {
      this.accumulator -= 1000 / 60;
      for (const match of this.matches.values()) {
        if (match.suspended || match.ended) continue;
        this.step(match); if (match.tick % 3 === 0) this.emit(match.room, this.snapshot(match));
      }
    }
  }
  private point(match: RunningMatch, winner: Team, reason: string): void {
    const state = transition(match.state, { type: "RALLY_POINT", pointId: `${match.state.matchId}:${match.state.rallyId}`, scoringSide: winner });
    if (state === match.state) return;
    match.state = state; match.phaseTicks = 0; match.pointReason = reason; match.pending.clear();
    this.onPoint(match.room, this.snapshot(match));
    if (state.phase === "finished") { match.winner = winner; match.reason = "points"; this.end(match); }
  }
  private end(match: RunningMatch): void {
    if (match.ended) return;
    match.ended = true; match.suspended = false; match.pending.clear(); match.room.status = "finished";
    this.emit(match.room, this.snapshot(match)); this.onEnded(match);
  }
  private resetRally(match: RunningMatch): void {
    match.contacts = createBallContactState(match.room.mode); match.touching.clear(); match.pending.clear();
    for (const athlete of match.athletes) { athlete.position = { x: match.room.mode === "1v1" ? 0 : athlete.slot ? 2 : -2, y: 0, z: athlete.team === "A" ? -6 : 6 }; athlete.velocityY = 0; }
  }
  private step(match: RunningMatch): void {
    match.tick++; match.phaseTicks++;
    if (match.state.phase === "countdown") {
      if (match.phaseTicks >= 180) { match.state = transition(match.state, { type: "COUNTDOWN_FINISHED" }); match.phaseTicks = 0; this.resetRally(match); }
      else return;
    }
    if (match.state.phase === "point") {
      if (match.phaseTicks >= 120) { match.state = transition(match.state, { type: "POINT_DELAY_FINISHED" }); match.phaseTicks = 0; this.resetRally(match); }
      else return;
    }
    if (match.state.phase === "serving" && match.phaseTicks >= 480) { this.point(match, match.state.servingSide === "A" ? "B" : "A", "serve_timeout"); return; }
    const dt = DEFAULT_RULES.fixedDeltaSeconds;
    for (const athlete of [...match.athletes].sort((a,b) => a.team.localeCompare(b.team) || a.slot - b.slot)) {
      const stored = match.pending.get(athlete.id);
      const input = stored && match.tick - (match.receivedTick[athlete.id] ?? 0) <= 15 ? stored : undefined;
      if (input) {
        match.processedSeq[athlete.id] = input.seq;
        const speed = DEFAULT_RULES.athleteSpeedMin + (athlete.attributes.speed - 1) / 99 * (DEFAULT_RULES.athleteSpeedMax - DEFAULT_RULES.athleteSpeedMin);
        athlete.position = moveAthlete(athlete.position, { x: input.moveX, z: input.moveZ }, speed, dt, { minX: -4.175, maxX: 4.175, minZ: athlete.team === "A" ? -8.675 : 0.325, maxZ: athlete.team === "A" ? -0.325 : 8.675 });
        if (input.actions.includes("jump") && athlete.position.y === 0) athlete.velocityY = 4 + (athlete.attributes.jump - 1) / 99 * 5;
        this.action(match, athlete, input);
        match.pending.set(athlete.id, { ...input, actions: [] });
        if (match.state.phase === "point" || match.ended) return;
      }
      if (athlete.position.y > 0 || athlete.velocityY > 0) {
        athlete.velocityY -= DEFAULT_RULES.gravity * dt;
        const y = Math.max(0, athlete.position.y + athlete.velocityY * dt); athlete.position = { ...athlete.position, y }; if (!y) athlete.velocityY = 0;
      }
    }
    if (match.state.phase === "serving") {
      const server = match.athletes.find((a) => a.team === match.state.servingSide && a.slot === match.state.servingSlot)!;
      match.ball = { position: { ...server.position, y: server.position.y + 1.25 }, velocity: { x: 0, y: 0, z: 0 }, grounded: false };
    } else if (match.state.phase === "rally") {
      const step = stepBall(match.ball, ballConfigFromRules(DEFAULT_RULES)); match.ball = step.state;
      for (const athlete of match.athletes) if (distance(match.ball.position, { ...athlete.position, y: athlete.position.y + 1.1 }) > 2.1) match.touching.delete(athlete.id);
      if (step.groundedNow) this.point(match, resolveGround(match.ball.position, match.contacts.lastTouchSide), "ground");
    }
  }
  private action(match: RunningMatch, athlete: Athlete, input: InputPayload): void {
    const direction = athlete.team === "A" ? 1 : -1;
    if (match.state.phase === "serving") {
      if (!input.actions.includes("serve") || athlete.team !== match.state.servingSide || athlete.slot !== match.state.servingSlot) return;
      match.state = transition(match.state, { type: "SERVE_HIT" }); match.phaseTicks = 0;
      match.contacts = { ...createBallContactState(match.room.mode), lastTouchSide: athlete.team, lastPlayerId: athlete.id };
      match.ball = { position: { ...athlete.position, y: athlete.position.y + 1.25 }, velocity: { x: -athlete.position.x * 0.15, y: 7.5, z: direction * (7.5 + athlete.attributes.serve / 100) }, grounded: false }; match.touching.add(athlete.id); return;
    }
    if (match.state.phase !== "rally" || match.touching.has(athlete.id)) return;
    const action = input.actions.includes("attack") ? "attack" : input.actions.includes("set") ? "set" : input.actions.includes("receive") ? "receive" : null;
    if (!action || distance(match.ball.position, { ...athlete.position, y: athlete.position.y + 1.1 }) > 1.9) return;
    const isBlock = action === "receive" && athlete.position.y > 0.2 && Math.abs(athlete.position.z) < 1 && match.ball.position.y >= DEFAULT_RULES.netHeight;
    const result = applyContact(match.contacts, athlete.id, athlete.team, isBlock ? "block" : "hit");
    if (!result.legal) { this.point(match, result.pointFor, result.reason); return; }
    match.contacts = result.state; match.touching.add(athlete.id);
    const targetZ = action === "set" ? athlete.position.z + direction : direction * 5;
    const flight = action === "attack" ? 0.85 : action === "set" ? 1.35 : 1.65;
    match.ball = { position: { ...match.ball.position }, velocity: { x: -match.ball.position.x / flight * 0.3, y: action === "attack" ? (athlete.position.y > 0.5 ? 3 : 6.5) : action === "set" ? 8 : 7.5, z: (targetZ - match.ball.position.z) / flight }, grounded: false };
  }
  snapshot(match: RunningMatch): MatchSnapshot {
    const phase = match.suspended ? "disconnectedSuspension" : match.state.phase;
    const secondsRemaining = match.suspended ? 0 : match.state.phase === "countdown" ? Math.max(0, 3 - match.phaseTicks / 60) : match.state.phase === "serving" ? Math.max(0, 8 - match.phaseTicks / 60) : match.state.phase === "point" ? Math.max(0, 2 - match.phaseTicks / 60) : 0;
    return { matchId: match.state.matchId, tick: match.tick, phase: phase as MatchSnapshot["phase"], score: { ...match.state.score }, serverTime: this.now(),
      lastProcessedSeq: { ...match.processedSeq }, athletes: match.athletes.map((a) => ({ id: a.id, team: a.team, position: { ...a.position }, ...(a.assetKey ? { assetKey: a.assetKey } : {}) })), ball: { ...match.ball.position }, cooldowns: {},
      servingSide: match.state.servingSide, servingSlot: match.state.servingSlot, secondsRemaining, winner: match.winner, reason: match.reason, pointReason: match.pointReason };
  }
}
