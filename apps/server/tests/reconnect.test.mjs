import {test} from 'node:test';import assert from 'node:assert/strict';
import {MatchRuntime} from '../dist/runtime/matches.js';import {RoomRegistry} from '../dist/rooms/registry.js';import {ReconnectController} from '../dist/reconnect/controller.js';
function setup(){let now=0;const rooms=new RoomRegistry(),room=rooms.create('a','1v1');rooms.join('b',room.code);room.status='active';const runtime=new MatchRuntime(()=>{},()=>now);runtime.start(room);const controller=new ReconnectController(runtime,()=>{},()=>now);return{room,runtime,controller,advance:ms=>{now+=ms;controller.tick();},drop:id=>{room.members.find(m=>m.userId===id).connected=false;controller.disconnect(room);},restore:id=>{room.members.find(m=>m.userId===id).connected=true;controller.reconnect(room);}};}
test('return in 19s resumes after 3s and preserves tick/phase',()=>{
 const s=setup();s.runtime.advance(3000);const tick=s.runtime.get(s.room.roomId).tick;s.drop('a');s.advance(19000);s.runtime.advance(10000);assert.equal(s.runtime.get(s.room.roomId).tick,tick);
 s.restore('a');s.advance(2999);assert.equal(s.room.status,'suspended');s.advance(1);assert.equal(s.room.status,'active');assert.equal(s.runtime.get(s.room.roomId).state.phase,'serving');
});
test('20s deadline forfeits with actual score, both absent cancels without winner',()=>{
 for(const both of [false,true]){const s=setup();s.drop('a');if(both)s.drop('b');s.advance(20000);const match=s.runtime.get(s.room.roomId);assert.equal(match.ended,true);assert.deepEqual(match.state.score,{A:0,B:0});assert.equal(match.winner,both?null:'B');assert.equal(match.state.phase,both?'cancelled':'finished');}
});
test('team wait budget across reconnects is at most 40s',()=>{
 const s=setup();for(let i=0;i<2;i++){s.drop('a');s.advance(19000);s.restore('a');s.advance(3000);}
 s.drop('a');s.advance(1999);assert.equal(s.runtime.get(s.room.roomId).ended,false);s.advance(1);assert.equal(s.runtime.get(s.room.roomId).winner,'B');
});
test('late return cannot reset deadline; explicit abandonment forfeits immediately',()=>{
 const s=setup();s.drop('a');s.advance(20000);s.restore('a');assert.equal(s.runtime.get(s.room.roomId).winner,'B');
 const other=setup();other.controller.abandon(other.room,'b');assert.equal(other.runtime.get(other.room.roomId).winner,'A');
});
