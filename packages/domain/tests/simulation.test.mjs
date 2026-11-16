import test from "node:test";
import assert from "node:assert/strict";
import { moveAthlete, stepBall } from "../dist/index.js";

const config = { fixedDeltaSeconds: 1 / 60, gravity: 9.81, radius: 0.11, netHeight: 2.43, netHalfWidth: 4.5, netRestitution: 0.45 };

test("fixed input and ticks produce repeatable ball states", () => {
  const initial = { position: { x: 0, y: 3, z: -4 }, velocity: { x: 1, y: 2, z: 4 }, grounded: false };
  let a = initial;
  let b = initial;
  for (let i = 0; i < 30; i++) {
    a = stepBall(a, config).state;
    b = stepBall(b, config).state;
  }
  assert.deepEqual(a, b);
});

test("swept collision catches floor crossing at high downward velocity", () => {
  const result = stepBall({ position: { x: 0, y: 0.3, z: 2 }, velocity: { x: 0, y: -100, z: 0 }, grounded: false }, config);
  assert.equal(result.groundedNow, true);
  assert.equal(result.state.position.y, config.radius);
  assert.equal(result.state.grounded, true);
});

test("swept collision catches the net between distant tick endpoints", () => {
  const result = stepBall({ position: { x: 0, y: 2, z: -1 }, velocity: { x: 0, y: 0, z: 120 }, grounded: false }, config);
  assert.equal(result.netHit, true);
  assert.ok(result.state.velocity.z < 0);
  assert.ok(Math.abs(result.state.position.z) <= config.radius);
});

test("athlete movement is bounded and diagonal speed is normalized", () => {
  const bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
  const start = { x: 0, y: 0, z: -2 };
  const moved = moveAthlete(start, { x: 1, z: 1 }, 5, 1, bounds);
  assert.ok(Math.abs(Math.hypot(moved.x, moved.z - start.z) - 5) < 1e-9);
  assert.equal(moveAthlete({ x: 4.2, y: 0, z: -8.7 }, { x: 1, z: -1 }, 20, 1, { ...bounds, minX: -4.2, maxX: 4.2, minZ: -8.7, maxZ: -0.2 }).x, 4.2);
});
