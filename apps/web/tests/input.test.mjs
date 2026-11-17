import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KeyboardInput } from '../.test-build/input/keyboard.js';
test('movement normalizes diagonals, cancels opposite keys and increments sequence', () => {
  const input = new KeyboardInput(); input.press('KeyW'); input.press('KeyD');
  const diagonal = input.sample('rally'); assert.equal(Math.hypot(diagonal.moveX, diagonal.moveZ), 1);
  input.press('KeyS'); assert.equal(input.sample('rally').moveZ, 0);
  input.release('KeyD'); assert.equal(input.sample('rally').moveX, 0);
  assert.ok(input.sample('rally').seq > diagonal.seq);
});
test('discrete actions fire once; L follows phase; repeats cannot queue actions', () => {
  const input = new KeyboardInput();
  for (const key of ['Space','KeyJ','KeyK','KeyL','KeyU']) input.press(key);
  assert.deepEqual(input.sample('serving').actions, ['jump','receive','set','ability','serve']);
  input.press('KeyL', true); assert.deepEqual(input.sample('rally').actions, []);
  input.release('KeyL'); input.press('KeyL'); assert.deepEqual(input.sample('rally').actions, ['attack']);
  input.release('KeyL'); input.press('KeyL'); assert.deepEqual(input.sample('countdown').actions, []);
});
test('clear discards held movement and queued actions', () => {
  const input = new KeyboardInput(); input.press('KeyW'); input.press('Space'); input.clear();
  const sample = input.sample('rally'); assert.equal(sample.moveZ, 0); assert.deepEqual(sample.actions, []);
  input.press('Space'); assert.deepEqual(input.sample('rally').actions, ['jump']);
});
