import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { WebSocket } from 'ws';
import { createTransport } from '../dist/network/server.js';
import { parseEnvelope } from '../dist/network/envelope.js';

const envelope = (type, payload, requestId = 'test') => JSON.stringify({ protocolVersion: 1, type, requestId, payload });
async function setup(t) {
  const commands = [];
  const transport = createTransport({ origins: ['http://localhost:5173'], authTimeoutMs: 100,
    verify: async token => {
      if (token !== 'valid') throw Error('unauthorized');
      return { userId: 'test-user', expiresAt: Date.now() + 10000 };
    }, onCommand: (session, message) => commands.push({ userId: session.userId, message }) });
  transport.http.listen(0, '127.0.0.1'); await once(transport.http, 'listening');
  t.after(() => transport.close());
  const connect = async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${transport.http.address().port}/socket`, { origin: 'http://localhost:5173' });
    ws.on('error', () => {}); await once(ws, 'open'); return ws;
  };
  return { connect, commands };
}
test('strict envelopes reject injected identity, non-finite and unknown data', () => {
  assert.equal(parseEnvelope(envelope('input', { seq: 1, moveX: 0, moveZ: 0, actions: [], userId: 'other' })), null);
  assert.equal(parseEnvelope(envelope('input', { seq: 1, moveX: 2, moveZ: 0, actions: [] })), null);
  assert.equal(parseEnvelope(envelope('ready', { ready: true, score: 6 })), null);
  assert.equal(parseEnvelope(envelope('createRoom', { mode: '1v1' })).type, 'createRoom');
});
test('invalid token and unauthenticated commands are closed', async t => {
  const { connect } = await setup(t);
  for (const data of [envelope('auth', { accessToken: 'invalid' }), envelope('createRoom', { mode: '1v1' })]) {
    const ws = await connect(); const closed = once(ws, 'close'); ws.send(data); assert.equal((await closed)[0], 1008);
  }
});
test('authenticated identity reaches handler; command rate is limited', async t => {
  const { connect, commands } = await setup(t); const ws = await connect();
  let response = once(ws, 'message'); ws.send(envelope('auth', { accessToken: 'valid' }));
  assert.equal(JSON.parse((await response)[0]).type, 'ack');
  response = once(ws, 'message');
  for (let i = 0; i < 11; i++) ws.send(envelope('createRoom', { mode: '1v1' }, String(i)));
  assert.equal(JSON.parse((await response)[0]).payload.code, 'rate_limited');
  assert.equal(commands.length, 10); assert.equal(commands[0].userId, 'test-user');
});
test('excessive payload is closed before reaching application', async t => {
  const { connect, commands } = await setup(t); const ws = await connect();
  const closed = once(ws, 'close'); ws.send('x'.repeat(8193)); assert.equal((await closed)[0], 1009); assert.equal(commands.length, 0);
});
test('expired identity is rejected even if verifier returns it', async t => {
  const server = createTransport({ origins: ['http://localhost:5173'], verify: async () => ({ userId: 'expired', expiresAt: Date.now() - 1 }), onCommand() {} });
  server.http.listen(0,'127.0.0.1'); await once(server.http,'listening'); t.after(()=>server.close());
  const ws = new WebSocket(`ws://127.0.0.1:${server.http.address().port}/socket`, {origin:'http://localhost:5173'});
  await once(ws,'open'); const closed=once(ws,'close'); ws.send(envelope('auth',{accessToken:'expired'})); assert.equal((await closed)[0],1008);
});
