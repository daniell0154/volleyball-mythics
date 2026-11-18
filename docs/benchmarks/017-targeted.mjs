import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { RoomRegistry } from "../../apps/server/dist/rooms/registry.js";
import { MatchRuntime } from "../../apps/server/dist/runtime/matches.js";

function rally(side) {
  const rooms = new RoomRegistry();
  const room = rooms.create("a1", "2v2");
  for (const id of ["a2", "b1", "b2"]) rooms.join(id, room.code);
  const runtime = new MatchRuntime(() => {}, () => 0);
  runtime.start(room);
  const match = runtime.get(room.roomId);
  // Select the initial server for each mirror; all positions and impacts come from legal inputs.
  match.state.servingSide = side;
  runtime.advance(3000);
  const receiving = side === "A" ? "B" : "A";
  const back = receiving === "B" ? 1 : -1;
  const server = match.athletes.find(athlete => athlete.team === side && athlete.slot === 0);
  const receiver = match.athletes.find(athlete => athlete.team === receiving && athlete.slot === 0);
  const setter = match.athletes.find(athlete => athlete.team === receiving && athlete.slot === 1);
  const frames = [];
  const contacts = [];
  let seq = 0;
  function send(athlete, target, action, aim) {
    const dx = target.x - athlete.position.x;
    const dz = target.z - athlete.position.z;
    const scale = Math.max(.12, Math.hypot(dx, dz));
    runtime.submit(room, athlete.id, { seq: ++seq, moveX: dx / scale, moveZ: dz / scale, actions: action ? [action] : [], aim });
  }
  for (let step = 0; step < 600; step++) {
    const { position: ball, velocity } = match.ball;
    const last = match.visualActions.at(-1);
    if (match.tick % 3 === 0 || last?.tick === match.tick || match.state.phase === "point") {
      frames.push({ ...runtime.snapshot(match), matchId: `017-target-${side}` });
    }
    if (last?.tick === match.tick) contacts.push({ kind: last.kind, tick: last.tick, ball: { ...ball } });
    if (match.state.phase === "point") break;
    switch (last?.kind) {
      case undefined:
        send(setter, { x: 1.5, z: 2.1 * back });
        if (step >= 30) send(server, server.position, "serve", { x: -.5, z: .86 });
        break;
      case "serve": {
        const ready = velocity.y < 0 && ball.z * back >= 6 && ball.y < 2.8;
        send(receiver, { x: -1.75, z: 6.45 * back }, ready ? "receive" : undefined, { x: 0, z: -1 });
        send(setter, { x: 1.5, z: 2.1 * back });
        break;
      }
      case "receive": {
        const ready = velocity.y < 0 && ball.z * back <= 3.2 && ball.y < 3;
        send(setter, { x: 1.5, z: 2.1 * back }, ready ? "set" : undefined, { x: .55, z: -.83 });
        send(receiver, { x: -.8, z: 1.6 * back });
        break;
      }
      case "set": {
        const ready = velocity.y < 0 && ball.y < 3;
        send(receiver, { x: 1.15, z: 1.6 * back }, ready ? "attack" : undefined, { x: -.9, z: .4 });
        break;
      }
    }
    runtime.advance(1000 / 60);
  }
  assert.deepEqual(contacts.map(contact => contact.kind), ["serve", "receive", "set", "attack"]);
  const [, receive, set, attack] = contacts;
  const apex = frames.filter(frame => frame.tick >= set.tick && frame.tick < attack.tick)
    .reduce((highest, frame) => frame.ball.y > highest.ball.y ? frame : highest);
  const landing = frames.at(-1);
  assert.ok(receive.ball.z * back >= 6, "defesa no fundo");
  assert.ok(apex.ball.y >= 4 && Math.abs(apex.ball.z) < 3, "levantamento alto junto à rede");
  assert.ok(attack.ball.x > .5 && landing.ball.x < -2 && landing.ball.z * back < 0 && landing.phase === "point", "ataque cruzado");
  console.log(JSON.stringify({ side, contacts, apex: apex.ball, landing: landing.ball }));
  return { side, defending: true, contacts, frames };
}

await writeFile(".test-build/017-targeted.json", JSON.stringify(["A", "B"].map(rally)));
