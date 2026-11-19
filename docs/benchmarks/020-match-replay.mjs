import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const base = process.argv[2];
if (!base) throw Error("Pass the compiled base server directory as the first argument.");
const load = async (root, file) => import(pathToFileURL(resolve(root, file)).href);
const catalog = JSON.parse(await readFile(new URL("../../content/characters/initial.json", import.meta.url)));
const tickMs = 1000 / 60;

async function replay(root, difficulty) {
  const { MatchRuntime } = await load(root, "runtime/matches.js");
  const { RoomRegistry } = await load(root, "rooms/registry.js");
  const { ReconnectController } = await load(root, "reconnect/controller.js");
  const { MatchLifecycle } = await load(root, "lifecycle/matches.js");
  const { MatchResults } = await load(root, "results/coordinator.js");
  const registry = new RoomRegistry();
  const room = registry.create("a0", "2v2", difficulty === "humans" ? undefined : {humanSlots: 1, difficulty});
  if (difficulty === "humans") for (const id of ["a1", "b0", "b1"]) registry.join(id, room.code);
  else room.botSeed = 123;
  room.roomId = "fixture";
  room.code = "FIXTURE";
  for (const [index, member] of room.members.entries()) {
    if (member.controller === "bot") member.participantId = "bot:" + index;
    member.character = {id: catalog[index % catalog.length].id, version: 1};
  }
  let clock = 0;
  const now = () => Math.round(clock);
  const hash = createHash("sha256");
  const matchIds = new Map();
  const find = id => catalog.find(character => character.id === id);
  const unsignedId = value => {
    if (!matchIds.has(value)) matchIds.set(value, String(matchIds.size + 1));
    return matchIds.get(value);
  };
  const record = (type, data) => hash.update(JSON.stringify([type, data], (key, value) =>
    key === "matchId" ? unsignedId(value) : value));
  const broadcast = (_room, type, data) => record(type, data);
  const runtime = new MatchRuntime((room, snapshot) => broadcast(room, "snapshot", snapshot), now,
    id => find(id)?.assetKey, id => find(id)?.attributes, id => {
      const character = find(id);
      return { id: character.abilityId, config: character.abilityConfig };
    }, false, 4);
  const results = new MatchResults({persist: async () => {}}, broadcast, now);
  const reconnect = new ReconnectController(runtime, broadcast, now);
  const lifecycle = new MatchLifecycle(registry, runtime, results, reconnect, broadcast, () => true, now);
  const humans = room.members.filter(member => member.controller === "human");
  const serveSides = new Set();
  const phases = new Set();
  let abilityFeedback = 0;
  let points = 0;
  runtime.onPoint = (_room, point) => { points++; record("point", point); };
  runtime.onAction = (userId, message) => { abilityFeedback++; record("feedback", {userId, message}); };
  runtime.onEnded = match => results.finish(match);
  room.status = "active";
  runtime.start(room);
  for (let inputTick = 0; inputTick < 7200; inputTick++) {
    const match = runtime.get(room.roomId);
    if (match.ended) break;
    clock = inputTick * tickMs;
    if (inputTick === 240) {
      const tick = match.tick;
      humans[0].connected = false;
      reconnect.disconnect(room);
      runtime.advance(tickMs);
      assert.equal(match.tick, tick);
    }
    if (inputTick === 270) {
      humans[0].connected = true;
      reconnect.reconnect(room);
    }
    reconnect.tick();
    for (const member of humans) {
      const serving = match.state.phase === "serving" &&
        member.team === match.state.servingSide && member.slot === match.state.servingSlot;
      const actions = serving ? ["serve"] : match.state.phase === "rally" && inputTick % 9 === 0 ? ["ability", "receive"] : [];
      const aim = {x: member.slot ? 1 : -1, z: 0};
      runtime.submit(room, member.userId, {seq: inputTick + 1, moveX: 0, moveZ: 0, actions, aim});
    }
    const previousVisual = match.visualSequence;
    runtime.advance(tickMs);
    if (match.visualSequence !== previousVisual) {
      const serve = match.visualActions.filter(action => action.id > previousVisual).find(action => action.kind === "serve");
      if (serve) serveSides.add(match.athletes.find(athlete => athlete.id === serve.actorId).team);
    }
    const snapshot = runtime.snapshot(match);
    phases.add(snapshot.phase);
    record("tick", {snapshot, ball: match.ball, contacts: match.contacts, pending: [...match.pending],
      bots: [...(match.bots?.states ?? [])], effects: [...match.activeEffects]});
  }
  const final = runtime.get(room.roomId);
  assert.ok(final.ended && points > 0 && phases.has("disconnectedSuspension") && phases.has("rally"), difficulty);
  for (const member of humans) lifecycle.vote(room, member.userId);
  const rematch = runtime.get(room.roomId);
  assert.notEqual(rematch.state.matchId, final.state.matchId);
  assert.deepEqual(rematch.state.score, {A: 0, B: 0});
  return {digest: hash.digest("hex"), points, score: final.state.score, serveSides: [...serveSides], abilityFeedback};
}

const scenarios = {};
for (const difficulty of ["humans", "easy", "normal", "hard"]) {
  const expected = await replay(base, difficulty);
  const actual = await replay("apps/server/dist", difficulty);
  assert.deepEqual(actual, expected);
  scenarios[difficulty] = actual;
}
assert.deepEqual(new Set(Object.values(scenarios).flatMap(row => row.serveSides)), new Set(["A", "B"]));
assert.ok(Object.values(scenarios).some(row => row.abilityFeedback > 0));
console.log(JSON.stringify(scenarios, null, 2));
