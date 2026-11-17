import assert from 'node:assert/strict';
import { stepBall } from '../../packages/domain/dist/simulation/ball.js';
import { DEFAULT_RULES, ballConfigFromRules } from '../../packages/domain/dist/config/physics.js';

// Baseline arcade shot; does not prescribe final character power/attributes.
const config = ballConfigFromRules(DEFAULT_RULES);
let ball = { position: { x: 0, y: 1, z: -8 }, velocity: { x: 0, y: 7, z: 8 }, grounded: false };
let ticks = 0, netHits = 0, maxHeight = 1;
while (!ball.grounded && ticks < 600) {
  const step = stepBall(ball, config);
  ball = step.state; netHits += Number(step.netHit); ticks++;
  maxHeight = Math.max(maxHeight, ball.position.y);
}
assert.ok(ball.grounded && netHits === 0 && ball.position.z > 0 && ball.position.z <= 9);
console.log(JSON.stringify({ config: DEFAULT_RULES, launch: { position: { x: 0, y: 1, z: -8 }, velocity: { x: 0, y: 7, z: 8 } }, ticks, flightSeconds: ticks / 60, maxHeight, netHits, landing: ball.position }, null, 2));
