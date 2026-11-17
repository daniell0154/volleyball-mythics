import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SnapshotBuffer } from '../.test-build/network/interpolation.js';
const frame = (tick, serverTime, x) => ({matchId:'test',tick,serverTime,phase:'rally',score:{A:0,B:0},ball:{x,y:1,z:0},athletes:[{id:'a',team:'A',position:{x,y:0,z:-2}}],lastProcessedSeq:{a:0},cooldowns:{}});
test('100ms interpolation tolerates clock offset and refuses old ticks or extrapolation',()=>{
  const buffer=new SnapshotBuffer();buffer.push(frame(3,100000,0),0);buffer.push(frame(6,100050,10),50);buffer.push(frame(9,100100,20),100);
  assert.equal(buffer.sample(125).ball.x,5);
  assert.equal(buffer.sample(125).renderTick,4.5);
  assert.equal(buffer.sample(125).athletes[0].position.x,5);
  buffer.push(frame(3,99999,999),126);assert.equal(buffer.sample(2000).ball.x,20);
  buffer.push({...frame(9,100100,20),phase:'disconnectedSuspension'},2001);assert.equal(buffer.sample(2001).phase,'disconnectedSuspension');
});

test('resume at the same frozen tick is accepted after a wall-clock pause',()=>{
 const buffer=new SnapshotBuffer();buffer.push(frame(60,1000,0),0);
 buffer.push({...frame(60,1100,0),phase:'disconnectedSuspension'},100);
 buffer.push(frame(60,21000,0),20000);
 assert.equal(buffer.sample(20000).phase,'rally');assert.equal(buffer.sample(20000).renderTick,60);
});

test('action and ball share fractional render tick, including an event recovered from the next snapshot',()=>{
 const buffer=new SnapshotBuffer(),action={id:1,actorId:'a',kind:'receive',tick:5,facing:0};
 buffer.push(frame(3,1000,0),0);
 buffer.push({...frame(6,1050,3),visualActions:[action]},50);
 assert.equal(buffer.sample(125).renderTick,4.5);
 assert.equal(buffer.sample(125).visualActions.length,0);
 const contact=buffer.sample(134);
 assert.ok(contact.renderTick>=5&&contact.renderTick-5<1);
 assert.equal(contact.visualActions[0].id,1);
 assert.ok(Math.abs(contact.ball.x-(contact.renderTick-3))<1e-9);
});
