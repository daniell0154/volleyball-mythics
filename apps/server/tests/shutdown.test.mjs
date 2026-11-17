import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RoomRegistry } from '../dist/rooms/registry.js';
import { MatchRuntime } from '../dist/runtime/matches.js';
import { MatchResults } from '../dist/results/coordinator.js';

test('server shutdown cancels each active mode and persists a result without a winner', async () => {
  const rooms = new RoomRegistry();
  const singles = rooms.create('a', '1v1'); rooms.join('b', singles.code);
  const doubles = rooms.create('c', '2v2'); rooms.join('d', doubles.code); rooms.join('e', doubles.code); rooms.join('f', doubles.code);
  for (const room of [singles, doubles]) for (const [index, member] of room.members.entries()) member.character = { id: `fixture-${index}`, version: 1 };

  const saved = [];
  const results = new MatchResults({ persist: async (payload) => saved.push(payload) }, () => {});
  const runtime = new MatchRuntime(() => {});
  runtime.onEnded = (match) => results.finish(match);
  runtime.start(singles); runtime.start(doubles);
  runtime.cancelForShutdown();
  await results.queue.tick();

  assert.equal(runtime.get(singles.roomId).reason, 'server_failure');
  assert.equal(runtime.get(doubles.roomId).reason, 'server_failure');
  assert.equal(saved.length, 2);
  assert.ok(saved.every((result) => result.status === 'cancelled' && result.winner === null));
  assert.ok(saved.every((result) => result.rulesVersion === 3));
  assert.deepEqual(saved.map((result) => result.mode).sort(), ['1v1', '2v2']);
});
