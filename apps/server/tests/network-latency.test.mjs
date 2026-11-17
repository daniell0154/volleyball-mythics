import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { WebSocket } from 'ws';
import { createTransport } from '../dist/network/server.js';
import { RoomApplication } from '../dist/rooms/application.js';
import { MatchRuntime } from '../dist/runtime/matches.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const random = (seed) => { let state = seed >>> 0; return () => ((state = (1664525 * state + 1013904223) >>> 0) / 2 ** 32); };
const latency = (rng) => 60 + Math.floor(rng() * 31); // 60–90 ms each way: 150 ms RTT, ±30 ms jitter.

test('four 2v2 clients keep one authoritative score under a 150ms RTT / 30ms jitter shim', async (t) => {
  let app;
  const runtime = new MatchRuntime((room, snapshot) => app.broadcast(room, 'snapshot', snapshot));
  app = new RoomApplication([{ id: 'fixture', version: 1, name: 'Fixture' }], {
    start: (room) => runtime.start(room), input: (room, userId, input) => runtime.submit(room, userId, input),
  });
  const transport = createTransport({
    origins: ['http://localhost:5173'],
    verify: async (token) => ({ userId: token, expiresAt: Date.now() + 60000 }),
    onConnect: (session) => app.connect(session), onDisconnect: (session) => app.disconnect(session),
    onCommand: (session, message) => app.command(session, message),
  });
  transport.http.listen(0, '127.0.0.1'); await once(transport.http, 'listening');

  const clients = [];
  const requestId = { value: 0 };
  const request = async (client, type, payload = {}) => {
    const id = `${client.id}-${++requestId.value}`;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`request timeout ${type}`)), 5000);
      client.waiters.set(id, (message) => { clearTimeout(timeout); resolve(message); });
      client.send(type, payload, id);
    });
  };
  try {
    for (let i = 0; i < 4; i++) {
      const rng = random(i + 13);
      const client = { id: `latency-${i}`, rng, socket: new WebSocket(`ws://127.0.0.1:${transport.http.address().port}/socket`, { origin: 'http://localhost:5173' }),
        waiters: new Map(), latest: null, sequence: 0, outboundDue: 0, inboundDue: 0, sentLatency: [], receivedLatency: [], actions: null };
      client.send = (type, payload, id = `${client.id}-${++requestId.value}`) => {
        const delay = latency(client.rng); client.sentLatency.push(delay);
        client.outboundDue = Math.max(client.outboundDue, performance.now() + delay);
        setTimeout(() => {
          if (client.socket.readyState === WebSocket.OPEN) client.socket.send(JSON.stringify({ protocolVersion: 1, type, requestId: id, payload }));
        }, Math.max(0, client.outboundDue - performance.now()));
      };
      client.socket.on('error', () => {});
      client.socket.on('message', (data) => {
        const message = JSON.parse(data.toString());
        const delay = latency(client.rng); client.receivedLatency.push(delay);
        client.inboundDue = Math.max(client.inboundDue, performance.now() + delay);
        setTimeout(() => {
          const pendingId = message.payload?.requestId;
          if (pendingId && client.waiters.has(pendingId)) { const resolve = client.waiters.get(pendingId); client.waiters.delete(pendingId); resolve(message); }
          if (message.type === 'snapshot') client.latest = message.payload;
        }, Math.max(0, client.inboundDue - performance.now()));
      });
      await once(client.socket, 'open'); clients.push(client);
      const auth = await request(client, 'auth', { accessToken: client.id });
      assert.equal(auth.type, 'ack');
    }

    await request(clients[0], 'createRoom', { mode: '2v2' });
    const room = app.rooms.roomFor(clients[0].id);
    for (const client of clients.slice(1)) assert.equal((await request(client, 'joinRoom', { code: room.code })).type, 'ack');
    for (const client of clients) assert.equal((await request(client, 'selectCharacter', { characterId: 'fixture', version: 1 })).type, 'ack');
    for (const client of clients) assert.equal((await request(client, 'ready', { ready: true })).type, 'ack');
    assert.equal((await request(clients[0], 'start')).type, 'ack');

    const teamByUser = new Map(room.members.map((member) => [member.userId, member]));
    let serveAttempts = 0;
    const inputTimer = setInterval(() => {
      for (const client of clients) {
        const member = teamByUser.get(client.id);
        const serving = client.latest?.phase === 'serving' && client.latest.servingSide === member.team && client.latest.servingSlot === member.slot;
        if (serving) serveAttempts++;
        client.sequence++;
        client.send('input', { seq: client.sequence, moveX: 0, moveZ: 0, actions: serving ? ['serve'] : [] });
      }
    }, 100);
    let previousTick = performance.now();
    const tickTimer = setInterval(() => { const now = performance.now(); runtime.advance(Math.min(100, now - previousTick)); previousTick = now; }, 5);
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline && !clients.every((client) => (client.latest?.score.A ?? 0) + (client.latest?.score.B ?? 0) >= 1)) await sleep(50);
    clearInterval(inputTimer); clearInterval(tickTimer);
    const currentMatch = runtime.get(room.roomId);
    assert.ok(clients.every((client) => (client.latest?.score.A ?? 0) + (client.latest?.score.B ?? 0) >= 1), `all four clients observe the first resolved point; phase=${currentMatch?.state.phase}; tick=${currentMatch?.tick}; serves=${serveAttempts}; ball=${JSON.stringify(currentMatch?.ball.position)}; velocity=${JSON.stringify(currentMatch?.ball.velocity)}; scores=${clients.map((client) => JSON.stringify(client.latest?.score)).join(',')}`);
    await sleep(300);
    const scores = clients.map((client) => `${client.latest.score.A}:${client.latest.score.B}`);
    assert.equal(new Set(scores).size, 1, `clients disagree after delivery settles: ${scores.join(',')}`);
    const allDelays = clients.flatMap((client) => [...client.sentLatency, ...client.receivedLatency]);
    assert.ok(allDelays.every((delay) => delay >= 60 && delay <= 90));
    runtime.cancelForShutdown();
  } finally {
    for (const client of clients) client.socket.terminate();
    await transport.close();
  }
});
