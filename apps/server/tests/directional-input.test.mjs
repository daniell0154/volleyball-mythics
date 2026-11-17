import {test} from 'node:test';import assert from 'node:assert/strict';
import {parseEnvelope} from '../dist/network/envelope.js';import {RoomRegistry} from '../dist/rooms/registry.js';import {MatchRuntime} from '../dist/runtime/matches.js';
test('directional input remains optional and rejects authority, incomplete or excessive aim',()=>{
 const parse=p=>parseEnvelope(JSON.stringify({protocolVersion:1,type:'input',requestId:'t',payload:{seq:1,moveX:0,moveZ:0,actions:['serve'],...p}}));
 assert.ok(parse({}));assert.ok(parse({aim:{x:1,z:0}}));for(const aim of [{x:1,z:1},{x:0},{x:'0',z:0},{x:null,z:0},{x:0,z:0,position:4}])assert.equal(parse({aim}),null);assert.equal(parse({score:6}),null);
});
test('candidate requires backcourt serve, pins revision and accepts a single directed contact',()=>{
 const rooms=new RoomRegistry(),room=rooms.create('a','2v2');for(const id of ['aa','b','bb'])rooms.join(id,room.code);
 const runtime=new MatchRuntime(()=>{},Date.now,undefined,undefined,undefined,false,4);runtime.start(room);runtime.advance(3000);const m=runtime.get(room.roomId),actor=m.athletes[0];actor.position.z=-2;
 runtime.submit(room,'a',{seq:1,moveX:0,moveZ:0,actions:['serve'],aim:{x:1,z:0}});runtime.advance(20);assert.equal(m.state.phase,'serving');actor.position.z=-6;
 runtime.submit(room,'a',{seq:2,moveX:0,moveZ:0,actions:['serve'],aim:{x:1,z:0}});runtime.advance(20);assert.equal(m.state.phase,'rally');assert.ok(m.ball.velocity.x>0);assert.equal(runtime.snapshot(m).rulesVersion,4);assert.equal(m.visualActions.filter(a=>a.kind==='serve').length,1);
});
