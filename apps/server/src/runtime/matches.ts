import { randomUUID } from "node:crypto";
import { RallyMetrics, type RallyMeasurement } from "./rallyMetrics.js";
import { DEFAULT_RULES, ballConfigFromRules, moveAthlete, stepBall, createMatch, transition, createBallContactState, applyContact, resolveGround, validateAbilityDefinition, rallyProfile, rallyVelocity, actionRange, type RallyProfile, type AbilityDefinition, type BallState, type MatchState, type BallContactState } from "@volleyball-mythics/domain";
import type { InputPayload, MatchSnapshot, RoomState, Vector3, Team, CharacterAttributes, VisualAction, VisualActionKind } from "@volleyball-mythics/protocol";
export interface Athlete { id: string; team: Team; slot: number; position: Vector3; velocityY: number; assetKey?: string; ability?: AbilityDefinition; attributes: CharacterAttributes }
interface ActiveEffect { expiresAtTick: number; multiplier: number; attributes: readonly string[] }
export interface RunningMatch {
  room: RoomState; state: MatchState; tick: number; phaseTicks: number; startedAt: string;
  athletes: Athlete[]; ball: BallState; contacts: BallContactState; touching: Set<string>;
  pending: Map<string, InputPayload>; receivedSeq: Record<string, number>; processedSeq: Record<string, number>; receivedTick: Record<string, number>;
  actionReceivedTick: Record<string, number>;
  abilityCooldowns: Map<string, number>; activeEffects: Map<string, ActiveEffect>;
  visualActions: VisualAction[]; visualSequence: number;
  metrics: RallyMetrics; initialServingSide: Team;
  rallyProfile: RallyProfile; contactRecovery: Map<string, number>;
  suspended: boolean; pointReason: string; winner: Team | null; reason: "points" | "forfeit" | "server_failure" | null; ended: boolean;
}
const fallbackAttributes: CharacterAttributes = { serve: 75, receive: 75, set: 75, attack: 75, block: 75, speed: 75, jump: 75 };
const distance = (a: Vector3, b: Vector3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export class MatchRuntime {
  private matches = new Map<string, RunningMatch>();
  private accumulator = 0;
  onEnded: (match: RunningMatch) => void = () => {};
  onPoint: (room: RoomState, snapshot: MatchSnapshot) => void = () => {};
  onAction: (userId: string, message: string) => void = () => {};
  onRallyMeasured: (measurement: RallyMeasurement) => void = () => {};
  constructor(private emit: (room: RoomState, snapshot: MatchSnapshot) => void, private now: () => number = Date.now,
    private resolveAsset: (id: string, version: number) => string | undefined = () => undefined,
    private resolveAttributes: (id: string, version: number) => CharacterAttributes | undefined = () => undefined,
    private resolveAbility: (id: string, version: number) => { id: string; config: unknown } | undefined = () => undefined,
    private allowDevelopmentFixture = process.env.NODE_ENV === "development",
    private defaultRulesVersion = 3) { rallyProfile(defaultRulesVersion); }
  start(room: RoomState): void {
    const athletes: Athlete[] = room.members.map((member) => {
      const key = member.character ? this.resolveAsset(member.character.id, member.character.version) : undefined;
      const attributes = member.character ? this.resolveAttributes(member.character.id, member.character.version) : undefined;
      const configuredAbility = member.character ? this.resolveAbility(member.character.id, member.character.version) : undefined;
      let ability: AbilityDefinition | undefined;
      if (configuredAbility) { try { ability = validateAbilityDefinition(configuredAbility.id, configuredAbility.config, this.allowDevelopmentFixture); } catch { /* Invalid catalog abilities stay unavailable. */ } }
      return { id: member.userId, team: member.team, slot: member.slot, ...(key ? { assetKey: key } : {}), ...(ability ? { ability } : {}), attributes: { ...(attributes ?? fallbackAttributes) },
        position: { x: room.mode === "1v1" ? 0 : member.slot ? 2 : -2, y: 0, z: member.team === "A" ? -6 : 6 }, velocityY: 0 };
    });
    const profile = rallyProfile(this.defaultRulesVersion);
    const match: RunningMatch = { room, state: transition(createMatch(randomUUID(), room.mode, profile.version), { type: "START" }), tick: 0, phaseTicks: 0, startedAt: new Date(this.now()).toISOString(), athletes,
      ball: { position: { x: 0, y: 1, z: -6 }, velocity: { x: 0, y: 0, z: 0 }, grounded: false }, contacts: createBallContactState(room.mode), touching: new Set(), pending: new Map(), receivedTick: {}, actionReceivedTick: {},
      receivedSeq: Object.fromEntries(athletes.map((a) => [a.id, 0])), processedSeq: Object.fromEntries(athletes.map((a) => [a.id, 0])), abilityCooldowns: new Map(), activeEffects: new Map(), visualActions: [], visualSequence: 0, metrics: new RallyMetrics(), initialServingSide: "A", rallyProfile: profile, contactRecovery: new Map(), suspended: false, pointReason: "", winner: null, reason: null, ended: false };
    this.matches.set(room.roomId, match); this.emit(room, this.snapshot(match));
  }
  get(roomId: string): RunningMatch | undefined { return this.matches.get(roomId); }
  submit(room: RoomState, userId: string, input: InputPayload): void {
    const match = this.matches.get(room.roomId);
    if (!match || match.ended || match.suspended || !Object.hasOwn(match.receivedSeq, userId) || input.seq <= match.receivedSeq[userId]!) return;
    match.receivedSeq[userId] = input.seq; match.receivedTick[userId] = match.tick;
    const previous = match.pending.get(userId);
    const stillFresh = match.tick - (match.actionReceivedTick[userId] ?? -Infinity) <= 6;
    const queued = stillFresh ? previous?.actions ?? [] : [];
    if (input.actions.length && !queued.length) match.actionReceivedTick[userId] = match.tick;
    match.pending.set(userId, { ...input, actions: !["serving", "rally"].includes(match.state.phase) ? [] : [...new Set([...queued, ...input.actions])] });
  }
  suspend(room: RoomState): void { const match = this.matches.get(room.roomId); if (match && !match.ended) { match.suspended = true; match.pending.clear(); this.emit(room, this.snapshot(match)); } }
  resume(room: RoomState): void { const match = this.matches.get(room.roomId); if (match && !match.ended) { match.suspended = false; match.pending.clear(); this.emit(room, this.snapshot(match)); } }
  remove(roomId: string): void { this.matches.delete(roomId); }
  cancelForShutdown(): void {
    for (const match of this.matches.values()) if (!match.ended) this.finish(match.room, null, "server_failure");
  }
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
    this.onRallyMeasured(match.metrics.finish(match.room.mode, match.state.rulesVersion, match.state.rallyId, match.tick, reason));
    match.state = state; match.phaseTicks = 0; match.pointReason = reason; match.pending.clear();
    this.onPoint(match.room, this.snapshot(match));
    if (state.phase === "finished") { match.winner = winner; match.reason = "points"; this.end(match); }
  }
  private end(match: RunningMatch): void {
    if (match.ended) return;
    match.ended = true; match.suspended = false; match.pending.clear(); match.activeEffects.clear(); match.room.status = "finished";
    this.emit(match.room, this.snapshot(match)); this.onEnded(match);
  }
  private resetRally(match: RunningMatch): void {
    match.metrics = new RallyMetrics(); match.initialServingSide = match.state.servingSide;
    match.contactRecovery.clear();
    match.contacts = createBallContactState(match.room.mode); match.touching.clear(); match.pending.clear();
    for (const athlete of match.athletes) { athlete.position = { x: match.room.mode === "1v1" ? 0 : athlete.slot ? 2 : -2, y: 0, z: athlete.team === "A" ? -6 : 6 }; athlete.velocityY = 0; }
  }
  private step(match: RunningMatch): void {
    match.tick++; match.phaseTicks++;
    for (const [userId, effect] of match.activeEffects) if (match.tick >= effect.expiresAtTick) match.activeEffects.delete(userId);
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
        const speedMultiplier = match.activeEffects.get(athlete.id)?.attributes.includes("speed") ? match.activeEffects.get(athlete.id)!.multiplier : 1;
        const speed = (DEFAULT_RULES.athleteSpeedMin + (athlete.attributes.speed - 1) / 99 * (DEFAULT_RULES.athleteSpeedMax - DEFAULT_RULES.athleteSpeedMin)) * speedMultiplier;
        athlete.position = moveAthlete(athlete.position, { x: input.moveX, z: input.moveZ }, speed, dt, { minX: -4.175, maxX: 4.175, minZ: athlete.team === "A" ? -8.675 : 0.325, maxZ: athlete.team === "A" ? -0.325 : 8.675 });
        if (input.actions.includes("jump") && athlete.position.y === 0) athlete.velocityY = 4 + (athlete.attributes.jump - 1) / 99 * 5;
        this.action(match, athlete, { ...input, actions: match.tick - (match.actionReceivedTick[athlete.id] ?? -Infinity) <= 6 ? input.actions : [] });
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
      for (const athlete of match.athletes) if (distance(match.ball.position, { ...athlete.position, y: athlete.position.y + 1.1 }) > match.rallyProfile.separationRange) match.touching.delete(athlete.id);
      if (step.groundedNow) this.point(match, resolveGround(match.ball.position, match.contacts.lastTouchSide), "ground");
    }
  }
  private action(match: RunningMatch, athlete: Athlete, input: InputPayload): void {
    if (input.actions.length) match.metrics.attempt(match.tick - (match.actionReceivedTick[athlete.id] ?? match.tick));
    if (input.actions.includes("ability")) { this.useAbility(match, athlete); if (match.state.phase === "point" || match.ended) return; }
    const direction = athlete.team === "A" ? 1 : -1;
    if (match.state.phase === "serving") {
      if (!input.actions.includes("serve")) return;
      if (athlete.team !== match.state.servingSide || athlete.slot !== match.state.servingSlot) { this.onAction(athlete.id, "Aguarde sua vez de sacar."); return; }
      match.state = transition(match.state, { type: "SERVE_HIT" }); match.phaseTicks = 0;
      match.contacts = { ...createBallContactState(match.room.mode), lastTouchSide: athlete.team, lastPlayerId: athlete.id };
      this.visual(match, athlete, "serve");
      match.metrics.serve(match.tick);
      const position = { ...athlete.position, y: athlete.position.y + 1.25 };
      match.ball = { position, velocity: rallyVelocity(match.rallyProfile,"serve",position,athlete.position,direction,athlete.attributes), grounded: false };
      match.contactRecovery.set(athlete.id,match.tick+match.rallyProfile.recoveryTicks);
      match.touching.add(athlete.id); this.onAction(athlete.id, "Saque!"); return;
    }
    if (match.state.phase !== "rally" || match.touching.has(athlete.id) || match.tick < (match.contactRecovery.get(athlete.id) ?? 0)) return;
    const action = input.actions.includes("attack") ? "attack" : input.actions.includes("set") ? "set" : input.actions.includes("receive") ? "receive" : null;
    if (!action) return;
    const receiveMultiplier = match.activeEffects.get(athlete.id)?.attributes.includes("receive") ? match.activeEffects.get(athlete.id)!.multiplier : 1;
    const attribute = action === "set" ? athlete.attributes.set : action === "attack" ? athlete.attributes.attack : athlete.attributes.receive;
    if (distance(match.ball.position, { ...athlete.position, y: athlete.position.y + 1.1 }) > actionRange(match.rallyProfile,attribute) * receiveMultiplier) { match.metrics.rejectedRange(); this.onAction(athlete.id, "Chegue mais perto da bola."); return; }
    const isBlock = action === "receive" && athlete.position.y > 0.2 && Math.abs(athlete.position.z) < 1 && match.ball.position.y >= DEFAULT_RULES.netHeight;
    const result = applyContact(match.contacts, athlete.id, athlete.team, isBlock ? "block" : "hit");
    if (!result.legal) { this.point(match, result.pointFor, result.reason); return; }
    match.contacts = result.state; match.touching.add(athlete.id);
    match.metrics.contact(athlete.team !== match.initialServingSide);
    match.contactRecovery.set(athlete.id,match.tick+match.rallyProfile.recoveryTicks);
    this.visual(match, athlete, isBlock ? "block" : action);
    this.onAction(athlete.id, isBlock ? "Bloqueio!" : action === "attack" ? "Ataque!" : action === "set" ? "Levantamento!" : "Recepção!");
    const teammate = match.athletes.find((other) => other.team === athlete.team && other.id !== athlete.id);
    match.ball = { position: { ...match.ball.position }, velocity: rallyVelocity(match.rallyProfile,isBlock?"block":action,match.ball.position,athlete.position,direction,athlete.attributes,teammate?.position), grounded: false };
  }
  private useAbility(match: RunningMatch, athlete: Athlete): void {
    const ability = athlete.ability;
    if (!ability) { this.onAction(athlete.id, "Habilidade indisponível."); return; }
    if (!ability.validPhases.includes(match.state.phase as "rally")) { this.onAction(athlete.id, "Use a habilidade durante a jogada."); return; }
    if (match.tick < (match.abilityCooldowns.get(athlete.id) ?? 0)) { this.onAction(athlete.id, "Habilidade em recarga."); return; }
    if (ability.id === "teammate_rant") {
      const teammate = match.athletes.find((other) => other.team === athlete.team && other.id !== athlete.id);
      if (!teammate) { this.onAction(athlete.id, "Habilidade indisponível sem companheiro."); return; }
      match.activeEffects.set(teammate.id, { expiresAtTick: match.tick + ability.durationSeconds * 60, multiplier: ability.multiplier, attributes: ability.affectedAttributes });
      match.abilityCooldowns.set(athlete.id, match.tick + ability.cooldownSeconds * 60);
      this.visual(match, athlete, "rant", teammate.position);
      this.onAction(athlete.id, "Bronca! Seu parceiro recebeu um debuff temporário.");
      this.onAction(teammate.id, "Bronca do Samuel: velocidade e recepção reduzidas.");
      return;
    }
    if (ability.id === "free_point_out") {
      if (distance(match.ball.position, { ...athlete.position, y: athlete.position.y + 1.1 }) > 1.9) { this.onAction(athlete.id, "Chegue mais perto da bola para usar a habilidade."); return; }
      match.abilityCooldowns.set(athlete.id, match.tick + ability.cooldownSeconds * 60);
      this.visual(match, athlete, "freePoint");
      match.ball = { position: { x: athlete.team === "A" ? -5 : 5, y: Math.max(1, match.ball.position.y), z: match.ball.position.z }, velocity: { x: 0, y: 0, z: 0 }, grounded: false };
      this.onAction(athlete.id, "Foi sem querer... bola para fora, ponto para o adversário.");
      this.point(match, athlete.team === "A" ? "B" : "A", "ability_free_point");
      return;
    }
    if (ability.id === "speed_boost_fixture") {
      match.activeEffects.set(athlete.id, { expiresAtTick: match.tick + ability.durationSeconds * 60, multiplier: ability.multiplier, attributes: [ability.attribute] });
      match.abilityCooldowns.set(athlete.id, match.tick + ability.cooldownSeconds * 60);
      this.onAction(athlete.id, "Aumento de velocidade de teste ativado.");
    }
  }
  private visual(match: RunningMatch, athlete: Athlete, kind: VisualActionKind, target = match.ball.position): void {
    const dx = target.x - athlete.position.x, dz = target.z - athlete.position.z;
    match.visualActions.push({ id: ++match.visualSequence, actorId: athlete.id, kind, tick: match.tick,
      facing: Math.hypot(dx, dz) > .01 ? Math.atan2(dx, dz) : athlete.team === "A" ? 0 : Math.PI });
    match.visualActions = match.visualActions.filter((action) => match.tick - action.tick <= 120).slice(-32);
  }
  snapshot(match: RunningMatch): MatchSnapshot {
    const phase = match.suspended ? "disconnectedSuspension" : match.state.phase;
    const secondsRemaining = match.suspended ? 0 : match.state.phase === "countdown" ? Math.max(0, 3 - match.phaseTicks / 60) : match.state.phase === "serving" ? Math.max(0, 8 - match.phaseTicks / 60) : match.state.phase === "point" ? Math.max(0, 2 - match.phaseTicks / 60) : 0;
    return { matchId: match.state.matchId, tick: match.tick, phase: phase as MatchSnapshot["phase"], score: { ...match.state.score }, serverTime: this.now(),
      visualActions: match.visualActions.filter((action) => match.tick - action.tick <= 120).map((action) => ({ ...action })),
      lastProcessedSeq: { ...match.processedSeq }, athletes: match.athletes.map((a) => ({ id: a.id, team: a.team, position: { ...a.position }, ...(a.assetKey ? { assetKey: a.assetKey } : {}) })), ball: { ...match.ball.position }, cooldowns: Object.fromEntries([...match.abilityCooldowns].filter(([, expiry]) => expiry > match.tick).map(([id, expiry]) => [id, (expiry - match.tick) / 60])),
      servingSide: match.state.servingSide, servingSlot: match.state.servingSlot, secondsRemaining, winner: match.winner, reason: match.reason, pointReason: match.pointReason };
  }
}
