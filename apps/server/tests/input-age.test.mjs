import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MatchRuntime} from '../dist/runtime/matches.js';
import {RoomRegistry} from '../dist/rooms/registry.js';
function setup(){const registry=new RoomRegistry(),room=registry.create('a','1v1');registry.join('b',room.code);const runtime=new MatchRuntime(()=>{});runtime.start(room);runtime.advance(3000);return{runtime,room,match:runtime.get(room.roomId)};}
test('movement cannot renew an old queued hit; actions are consumed once',()=>{
 const {runtime,room,match}=setup();
 runtime.submit(room,'a',{seq:1,moveX:0,moveZ:0,actions:['serve']});
 // Simulate an already aged queue without stepping/consuming it.
 match.actionReceivedTick.a=match.tick-7;
 runtime.submit(room,'a',{seq:2,moveX:1,moveZ:0,actions:[]});runtime.advance(20);
 assert.equal(match.state.phase,'serving');
 runtime.submit(room,'a',{seq:3,moveX:0,moveZ:0,actions:['serve']});runtime.advance(20);
 assert.equal(match.state.phase,'rally');assert.equal(match.visualActions.length,1);
 runtime.advance(20);assert.equal(match.visualActions.length,1);
});
test('one spatial hit follows attack > set > receive priority',()=>{
 const {runtime,room,match}=setup();
 runtime.submit(room,'a',{seq:1,moveX:0,moveZ:0,actions:['serve']});runtime.advance(20);
 match.ball={position:{x:0,y:1.1,z:6},velocity:{x:0,y:0,z:0},grounded:false};
 runtime.submit(room,'b',{seq:1,moveX:0,moveZ:0,actions:['receive','set','attack']});runtime.advance(20);
 assert.equal(match.visualActions.at(-1).kind,'attack');assert.equal(match.contacts.touches,1);
});
