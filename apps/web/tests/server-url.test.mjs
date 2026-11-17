import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gameServerUrl } from '../.test-build/network/serverUrl.js';
test('production uses same-origin WebSocket and dev keeps separate local server',()=>{
  assert.equal(gameServerUrl('https://volleyball-mythics.onrender.com/?room=CODE',false),'wss://volleyball-mythics.onrender.com/socket');
  assert.equal(gameServerUrl('http://localhost:3001',false),'ws://localhost:3001/socket');
  assert.equal(gameServerUrl('http://localhost:5173',true),'ws://127.0.0.1:3001/socket');
  assert.equal(gameServerUrl('https://game.test',false,' wss://custom.test/socket '),'wss://custom.test/socket');
});
