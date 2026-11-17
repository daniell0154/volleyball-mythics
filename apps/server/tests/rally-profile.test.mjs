import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MatchRuntime} from '../dist/runtime/matches.js';
import {RoomRegistry} from '../dist/rooms/registry.js';
test('running matches pin rules revision and recovery rejects immediate repeat contact',()=>{
 const registry=new RoomRegistry(),room=registry.create('a','1v1');registry.join('b',room.code);
 const runtime=new MatchRuntime(()=>{});runtime.start(room);runtime.advance(3000);
 const match=runtime.get(room.roomId);assert.equal(match.state.rulesVersion,3);
 runtime.defaultRulesVersion=1;
 assert.equal(match.rallyProfile.version,3);
 runtime.submit(room,'a',{seq:1,moveX:0,moveZ:0,actions:['serve']});runtime.advance(20);
 match.touching.clear();match.ball={position:{x:0,y:1.1,z:-6},velocity:{x:0,y:0,z:0},grounded:false};
 runtime.submit(room,'a',{seq:2,moveX:0,moveZ:0,actions:['receive']});runtime.advance(20);
 assert.equal(match.visualActions.length,1);
 const second=registry.create('c','1v1');registry.join('d',second.code);runtime.start(second);
 assert.equal(runtime.get(second.roomId).state.rulesVersion,1);
});
