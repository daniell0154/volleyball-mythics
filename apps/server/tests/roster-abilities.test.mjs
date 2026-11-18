import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { actionRange, createBallContactState, rallyProfile, validateAbilityDefinition } from "@volleyball-mythics/domain";
import { RoomRegistry } from "../dist/rooms/registry.js";
import { MatchRuntime } from "../dist/runtime/matches.js";

const candidates = readFileSync(new URL("../../../supabase/migrations/202611180010_ability_candidates.sql", import.meta.url), "utf8");
const definitions = Object.fromEntries([...candidates.matchAll(/\('([a-z_]+)', '(\{[^\n]+?\})'::jsonb\)/g)]
  .map(([, id, config]) => [id, JSON.parse(config)]));
const initial = JSON.parse(readFileSync(new URL("../../../content/characters/initial.json", import.meta.url), "utf8"));
for (const character of initial) definitions[character.abilityId] = character.abilityConfig;
const tickMs = 1000 / 60;

function setup(abilities, stat = 75, variant = "humans") {
  const rooms = new RoomRegistry();
  const mode = variant === "no-partner" ? "1v1" : "2v2";
  const room = rooms.create("a1", mode, variant === "bot" ? { humanSlots: 1, difficulty: "normal" } : undefined);
  if (variant === "humans") for (const id of ["a2", "b1", "b2"]) rooms.join(id, room.code);
  if (variant === "no-partner") rooms.join("b1", room.code);
  for (const member of room.members) {
    member.character = { id: abilities[member.userId] ?? "no-ability", version: 1 };
  }
  const attrs = Object.fromEntries(["serve", "receive", "set", "attack", "block", "speed", "jump"].map(key => [key, stat]));
  const runtime = new MatchRuntime(() => {}, () => 0, undefined, () => attrs,
    id => definitions[id] ? { id, config: definitions[id] } : undefined, false, 4);
  const feedback = [];
  runtime.onAction = (id, message) => feedback.push({ id, message });
  runtime.start(room);
  runtime.advance(3000);
  const match = runtime.get(room.roomId);
  let sequence = 0;
  function send(id, actions = [], moveX = 0, seq = ++sequence) {
    runtime.submit(room, id, { seq, actions, moveX, moveZ: 0 });
    runtime.advance(tickMs);
    return seq;
  }
  function serve() {
    send("a1", ["serve"]);
    assert.equal(match.state.phase, "rally");
    // Keep the rally live while measuring expiration and cooldown independently of points.
    match.ball = { position: { x: 0, y: 10000, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, grounded: false };
    runtime.advance(match.rallyProfile.recoveryTicks * tickMs);
  }
  function distancePerTick(id) {
    const athlete = match.athletes.find(actor => actor.id === id);
    const start = athlete.position.x;
    send(id, [], 1);
    const speed = (athlete.position.x - start) * 60;
    send(id);
    return speed;
  }
  function contact(id, distance, action) {
    const athlete = match.athletes.find(actor => actor.id === id);
    const { x, y, z } = athlete.position;
    const opponent = match.athletes.find(other => other.team !== athlete.team);
    match.contacts = { ...createBallContactState(room.mode), lastTouchSide: opponent.team, lastPlayerId: opponent.id };
    match.touching.clear();
    match.ball = { position: { x: x + distance, y: y + 1.1, z }, velocity: { x: 0, y: 0, z: 0 }, grounded: false };
    const before = match.visualSequence;
    send(id, [action]);
    const accepted = match.visualSequence > before && match.visualActions.at(-1).kind === action;
    match.ball = { position: { x: 0, y: 10000, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, grounded: false };
    return accepted;
  }
  return { room, runtime, match, feedback, serve, send, distancePerTick, contact };
}

function expire(session, target) {
  const { match, runtime } = session;
  const expireTick = match.activeEffects.get(target).expiresAtTick;
  runtime.advance((expireTick - match.tick - 1) * tickMs);
  assert.ok(match.activeEffects.has(target));
  runtime.advance(tickMs);
  assert.equal(match.tick, expireTick);
  assert.equal(match.activeEffects.has(target), false);
}

test("the versioned candidates validate their handler, trigger, target, attribute and direction", () => {
  assert.deepEqual(Object.keys(definitions).slice(0, 3), ["coffee_break", "butter_fingers", "my_ball"]);
  for (const id of ["coffee_break", "butter_fingers", "my_ball"]) {
    const config = definitions[id];
    assert.equal(validateAbilityDefinition(id, config).multiplier, config.multiplier);
    assert.throws(() => validateAbilityDefinition(id, { ...config, target: "opponent_team" }));
    assert.throws(() => validateAbilityDefinition(id, { ...config, attribute: "attack" }));
    assert.throws(() => validateAbilityDefinition(id, { ...config, multiplier: 1 }));
    assert.throws(() => validateAbilityDefinition(id, { ...config, validPhases: ["serving"] }));
    assert.throws(() => validateAbilityDefinition(id, { ...config, stackable: true }));
  }
});

for (const [actor, partner] of [["a1", "a2"], ["b1", "b2"]]) for (const stat of [1, 100]) {
  test(`running, receiving and expiration for ${actor} at ${stat}`, t => {
    const coffee = setup({ [actor]: "coffee_break" }, stat);
    coffee.send(actor, ["ability"]);
    assert.equal(coffee.match.activeEffects.size, 0);
    assert.equal(coffee.match.abilityCooldowns.size, 0);
    coffee.serve();
    const controlSpeed = coffee.distancePerTick(actor);
    const activation = coffee.send(actor, ["ability"]);
    assert.equal(coffee.match.activeEffects.get(actor).expiresAtTick - coffee.match.tick, 180);
    assert.equal(coffee.match.abilityCooldowns.get(actor) - coffee.match.tick, 1320);
    const fastSpeed = coffee.distancePerTick(actor);
    assert.ok(Math.abs(fastSpeed / controlSpeed - 1.15) < 1e-9);
    expire(coffee, actor);
    assert.ok(Math.abs(coffee.distancePerTick(actor) - controlSpeed) < 1e-9);
    coffee.send(actor, ["ability"]);
    assert.match(coffee.feedback.at(-1).message, /recarga/);
    coffee.runtime.advance((coffee.match.abilityCooldowns.get(actor) - coffee.match.tick + 1) * tickMs);
    coffee.send(actor, ["ability"], 0, activation);
    assert.equal(coffee.match.activeEffects.size, 0);
    coffee.send(actor, ["ability"]);
    assert.ok(coffee.match.activeEffects.has(actor));
    assert.equal(coffee.match.athletes.find(athlete => athlete.id === actor).attributes.speed, stat);

    const range = actionRange(rallyProfile(4), stat);
    const short = range * .925;
    const long = range * 1.05;
    const control = setup({}, stat);
    control.serve();
    assert.equal(control.contact(actor, short, "receive"), true);
    const butter = setup({ [actor]: "butter_fingers" }, stat);
    butter.serve();
    butter.send(actor, ["ability"]);
    assert.equal(butter.match.activeEffects.get(actor).expiresAtTick - butter.match.tick, 240);
    assert.equal(butter.match.abilityCooldowns.get(actor) - butter.match.tick, 1080);
    assert.equal(butter.contact(actor, short, "receive"), false);
    expire(butter, actor);
    assert.equal(butter.contact(actor, short, "receive"), true);
    const attack = setup({ [actor]: "butter_fingers" }, stat);
    attack.serve();
    attack.send(actor, ["ability"]);
    assert.equal(attack.contact(actor, short, "attack"), true);

    const support = setup({ [actor]: "my_ball" }, stat);
    support.serve();
    assert.equal(support.contact(partner, long, "receive"), false);
    support.send(actor, ["ability"]);
    assert.equal(support.match.activeEffects.get(partner).expiresAtTick - support.match.tick, 240);
    assert.equal(support.match.abilityCooldowns.get(actor) - support.match.tick, 1440);
    assert.equal(support.contact(partner, long, "receive"), true);
    const expired = setup({ [actor]: "my_ball" }, stat);
    expired.serve();
    expired.send(actor, ["ability"]);
    expire(expired, partner);
    assert.equal(expired.contact(partner, long, "receive"), false);
    t.diagnostic(JSON.stringify({ controlSpeed: +controlSpeed.toFixed(3), fastSpeed: +fastSpeed.toFixed(3),
      baseReach: range, deniedByButterAt: +short.toFixed(4), enabledByMyBallAt: +long.toFixed(4) }));
  });
}

test("the target must exist and be active, including connected bot partners", () => {
  const solo = setup({ a1: "my_ball" }, 75, "no-partner");
  solo.serve();
  solo.send("a1", ["ability"]);
  assert.equal(solo.match.abilityCooldowns.size, 0);
  assert.match(solo.feedback.at(-1).message, /sem parceiro ativo/);

  const disconnected = setup({ a1: "my_ball" });
  disconnected.serve();
  disconnected.room.members.find(member => member.userId === "a2").connected = false;
  disconnected.send("a1", ["ability"]);
  assert.equal(disconnected.match.activeEffects.size, 0);
  assert.equal(disconnected.match.abilityCooldowns.size, 0);

  const withBots = setup({ a1: "my_ball" }, 75, "bot");
  withBots.serve();
  withBots.send("a1", ["ability"]);
  const teammate = withBots.room.members.find(member => member.controller === "bot" && member.team === "A");
  assert.equal(withBots.match.activeEffects.get(teammate.participantId).multiplier, 1.10);
  assert.ok(withBots.feedback.some(event => event.id === "a1" && event.message.includes("Bot A2")));
});

test("timed effects keep the first modifier in either order and coexist on different targets", () => {
  for (const id of ["coffee_break", "butter_fingers"]) for (const [first, second] of [["a1", "a2"], ["a2", "a1"]]) {
    const scenario = setup({ a1: id, a2: "teammate_rant" });
    scenario.serve();
    scenario.send(first, ["ability"]);
    const effect = scenario.match.activeEffects.get("a1");
    scenario.send(second, ["ability"]);
    assert.equal(scenario.match.activeEffects.get("a1"), effect);
    assert.equal(scenario.match.abilityCooldowns.has(second), false);
    assert.match(scenario.feedback.at(-1).message, /efeito temporário/);
  }
  for (const [first, second] of [["a1", "a2"], ["a2", "a1"]]) {
    const scenario = setup({ a1: "my_ball", a2: "teammate_rant" });
    scenario.serve();
    scenario.send(first, ["ability"]);
    scenario.send(second, ["ability"]);
    assert.equal(scenario.match.activeEffects.get("a1").multiplier, .85);
    assert.equal(scenario.match.activeEffects.get("a2").multiplier, 1.1);
  }
});
