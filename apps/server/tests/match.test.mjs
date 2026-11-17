import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MatchRuntime} from '../dist/runtime/matches.js';
import {RoomRegistry} from '../dist/rooms/registry.js';
function setup(){const rooms=new RoomRegistry(),room=rooms.create('a','1v1');rooms.join('b',room.code);const frames=[];const runtime=new MatchRuntime((_r,s)=>frames.push(s));runtime.start(room);return{runtime,room,frames};}
test('a complete match reaches sixth point without fabricated winner or duplicated point',()=>{
 const {runtime,room,frames}=setup();let ended=0;runtime.onEnded=()=>ended++;
 runtime.advance(3000);for(let n=0;n<12&&!runtime.get(room.roomId).ended;n++)runtime.advance(10000);
 const final=frames.at(-1);assert.equal(final.phase,'finished');assert.equal(Math.max(final.score.A,final.score.B),6);assert.equal(final.winner,final.score.A===6?'A':'B');assert.equal(final.reason,'points');
 const before=JSON.stringify(final.score);runtime.advance(60000);runtime.submit(room,'a',{seq:1,moveX:0,moveZ:0,actions:['serve']});assert.equal(JSON.stringify(frames.at(-1).score),before);assert.equal(ended,1);
});
test('only server can serve; ball landing in opponent half scores for the serving side',()=>{
 const {runtime,room,frames}=setup();runtime.advance(3000);runtime.submit(room,'b',{seq:1,moveX:0,moveZ:0,actions:['serve']});runtime.advance(50);assert.equal(frames.at(-1).phase,'serving');
 runtime.submit(room,'a',{seq:1,moveX:0,moveZ:0,actions:['serve']});runtime.advance(2000);assert.equal(frames.at(-1).score.A,1);assert.equal(frames.at(-1).score.B,0);assert.equal(frames.at(-1).phase,'point');
});
test('receive action requires ball in range and separation prevents repeated touches',()=>{
 const {runtime,room}=setup();runtime.advance(3000);runtime.submit(room,'a',{seq:1,moveX:0,moveZ:0,actions:['serve']});runtime.advance(50);
 const match=runtime.get(room.roomId);const before=match.contacts.lastTouchSide;
 runtime.submit(room,'b',{seq:1,moveX:0,moveZ:0,actions:['receive']});runtime.advance(20);assert.equal(match.contacts.lastTouchSide,before);
 match.ball={position:{x:0,y:1.1,z:6},velocity:{x:0,y:0,z:0},grounded:false};
 runtime.submit(room,'b',{seq:2,moveX:0,moveZ:0,actions:['receive']});runtime.advance(20);assert.equal(match.contacts.lastTouchSide,'B');assert.equal(match.contacts.touches,1);
 runtime.submit(room,'b',{seq:3,moveX:0,moveZ:0,actions:['receive']});runtime.advance(20);assert.equal(match.contacts.touches,1);
});
