import {test} from 'node:test';import assert from 'node:assert/strict';
import {RoomRegistry} from '../dist/rooms/registry.js';import {MatchRuntime} from '../dist/runtime/matches.js';import {MatchResults} from '../dist/results/coordinator.js';import {ReconnectController} from '../dist/reconnect/controller.js';import {MatchLifecycle} from '../dist/lifecycle/matches.js';
function setup(){let now=0;const rooms=new RoomRegistry(),room=rooms.create('a','1v1');rooms.join('b',room.code);for(const m of room.members)m.character={id:'fixture',version:1};const runtime=new MatchRuntime(()=>{},()=>now);const results=new MatchResults({persist:async()=>{}},()=>{},()=>now);const reconnect=new ReconnectController(runtime,()=>{},()=>now);const lifecycle=new MatchLifecycle(rooms,runtime,results,reconnect,()=>{},()=>true,()=>now);runtime.onEnded=m=>{results.finish(m);lifecycle.ended(m.room);};runtime.start(room);runtime.finish(room,'A','forfeit');return{rooms,room,runtime,results,lifecycle,advance:ms=>{now+=ms;lifecycle.tick();}};}
test('only unanimous rematch starts fresh id and zero score; duplicate vote is harmless',()=>{
 const s=setup(),id=s.runtime.get(s.room.roomId).state.matchId;s.lifecycle.vote(s.room,'a');s.lifecycle.vote(s.room,'a');assert.equal(s.room.status,'finished');assert.deepEqual(s.results.get(s.room.roomId).rematchVotes,['a']);
 s.lifecycle.vote(s.room,'b');const match=s.runtime.get(s.room.roomId);assert.notEqual(match.state.matchId,id);assert.deepEqual(match.state.score,{A:0,B:0});assert.equal(match.state.phase,'countdown');assert.equal(s.results.get(s.room.roomId),undefined);
});
test('room close removes runtime/result/membership; disconnected finished rooms expire',()=>{
 const s=setup();for(const m of s.room.members)m.connected=false;s.lifecycle.disconnected(s.room);s.advance(19999);assert.ok(s.runtime.get(s.room.roomId));s.advance(1);assert.equal(s.runtime.get(s.room.roomId),undefined);assert.equal(s.results.get(s.room.roomId),undefined);assert.throws(()=>s.rooms.roomFor('a'));assert.equal(s.rooms.all().length,0);
});
test('disconnected voter cannot supply unanimity',()=>{
 const s=setup();s.lifecycle.vote(s.room,'a');s.room.members[0].connected=false;s.lifecycle.disconnected(s.room);s.lifecycle.vote(s.room,'b');assert.equal(s.room.status,'finished');assert.deepEqual(s.results.get(s.room.roomId).rematchVotes,['b']);
});
