import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MatchRuntime} from '../dist/runtime/matches.js';
import {RoomRegistry} from '../dist/rooms/registry.js';
test('only accepted contacts emit bounded animation history; old server inputs remain unchanged',()=>{
 const registry=new RoomRegistry(),room=registry.create('a','1v1');registry.join('b',room.code);
 const runtime=new MatchRuntime(()=>{});runtime.start(room);runtime.advance(3000);
 const match=runtime.get(room.roomId);
 runtime.submit(room,'b',{seq:1,moveX:0,moveZ:0,actions:['serve']});runtime.advance(20);
 assert.equal(runtime.snapshot(match).visualActions.length,0);
 runtime.submit(room,'a',{seq:1,moveX:0,moveZ:0,actions:['serve']});runtime.advance(20);
 const first=runtime.snapshot(match).visualActions[0];
 assert.equal(first.kind,'serve');assert.equal(first.actorId,'a');assert.equal(first.tick,match.tick);
 runtime.submit(room,'a',{seq:1,moveX:0,moveZ:0,actions:['serve']});runtime.advance(20);
 runtime.submit(room,'b',{seq:2,moveX:0,moveZ:0,actions:['attack']});runtime.advance(20);
 assert.equal(runtime.snapshot(match).visualActions.length,1);
 match.ball={position:{x:0,y:1.1,z:6},velocity:{x:0,y:0,z:0},grounded:false};
 runtime.submit(room,'b',{seq:3,moveX:0,moveZ:0,actions:['receive']});runtime.advance(20);
 const actions=runtime.snapshot(match).visualActions;
 assert.equal(actions[1].kind,'receive');assert.ok(actions[1].id>first.id);
 runtime.advance(2100);assert.equal(runtime.snapshot(match).visualActions.length,0);
});

test('server identifies set, attack and block, and caps dense accepted-contact history',()=>{
 const registry=new RoomRegistry(),room=registry.create('a','1v1');registry.join('b',room.code);
 const runtime=new MatchRuntime(()=>{});runtime.start(room);runtime.advance(3000);
 runtime.submit(room,'a',{seq:1,moveX:0,moveZ:0,actions:['serve']});runtime.advance(20);
 const match=runtime.get(room.roomId),athlete=match.athletes[0];
 for(let seq=2;seq<42;seq++){
  match.touching.clear();
  match.contacts={...match.contacts,touches:0}; // Independent legal-contact fixture, not a fourth touch.
  match.ball={position:{...athlete.position,y:athlete.position.y+1.1},velocity:{x:0,y:0,z:0},grounded:false};
  const action=seq%2?'attack':'set';
  runtime.submit(room,'a',{seq,moveX:0,moveZ:0,actions:[action]});runtime.advance(20);
  assert.equal(runtime.snapshot(match).visualActions.at(-1).kind,action);
 }
 assert.equal(runtime.snapshot(match).visualActions.length,32);
 match.touching.clear();match.contacts={...match.contacts,touches:0};athlete.position={x:0,y:1,z:-.5};
 match.ball={position:{x:0,y:2.5,z:-.5},velocity:{x:0,y:0,z:0},grounded:false};
 runtime.submit(room,'a',{seq:42,moveX:0,moveZ:0,actions:['receive']});runtime.advance(20);
 assert.equal(runtime.snapshot(match).visualActions.at(-1).kind,'block');
});
