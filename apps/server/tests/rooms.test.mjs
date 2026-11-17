import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RoomRegistry } from '../dist/rooms/registry.js';
test('concurrent joins respect singles/doubles capacity and code resolves invite', async () => {
  for (const [mode, capacity] of [['1v1',2],['2v2',4]]) {
    const rooms=new RoomRegistry(), room=rooms.create('owner',mode);
    const link=new URL(`http://localhost:5173/?room=${room.code}`);
    const results=await Promise.allSettled(Array.from({length:6},(_,i)=>Promise.resolve().then(()=>rooms.join(`u${i}`,link.searchParams.get('room')))));
    assert.equal(results.filter(r=>r.status==='fulfilled').length,capacity-1);
    assert.equal(room.members.length,capacity);
    assert.equal(new Set(room.members.map(m=>`${m.team}:${m.slot}`)).size,capacity);
    assert.ok(results.filter(r=>r.status==='rejected').every(r=>r.reason.code==='room_full'));
  }
});
test('owner transfers to oldest remaining member; empty room code expires',()=>{
  const rooms=new RoomRegistry(),room=rooms.create('oldest','2v2');rooms.join('second',room.code);rooms.join('third',room.code);
  assert.equal(rooms.leave('oldest').ownerId,'second');rooms.leave('second');assert.equal(rooms.leave('third'),null);
  assert.throws(()=>rooms.join('new',room.code),e=>e.code==='room_not_found');
});
