import {test} from 'node:test';import assert from 'node:assert/strict';import {RoomRegistry} from '../dist/rooms/registry.js';import {MatchRuntime} from '../dist/runtime/matches.js';import {MatchResults} from '../dist/results/coordinator.js';
function room(){const rooms=new RoomRegistry(),room=rooms.create('a','1v1');rooms.join('b',room.code);for(const m of room.members)m.character={id:'samuel',version:1};return room;}
test('cancelled result keeps null winner and real scores in persistence payload',async()=>{
 const r=room(),sent=[],events=[];const results=new MatchResults({persist:async p=>sent.push(p)},(_room,type,p)=>events.push({type,p}));const runtime=new MatchRuntime(()=>{});runtime.onEnded=m=>results.finish(m);runtime.start(r);runtime.finish(r,null,'server_failure');await results.queue.tick();
 assert.equal(sent.length,1);assert.equal(sent[0].winner,null);assert.equal(sent[0].status,'cancelled');assert.deepEqual(sent[0].score,{A:0,B:0});assert.equal(results.get(r.roomId).persistence,'saved');
});
test('old save completion cannot replace a newer match result',async()=>{
 const r=room(),resolvers=new Map();const results=new MatchResults({persist:p=>new Promise(resolve=>resolvers.set(p.matchId,resolve))},()=>{});const runtime=new MatchRuntime(()=>{});runtime.onEnded=m=>results.finish(m);
 runtime.start(r);runtime.finish(r,'A','forfeit');const old=runtime.get(r.roomId).state.matchId;const first=results.queue.tick();results.clear(r.roomId);
 runtime.start(r);runtime.finish(r,'B','forfeit');const current=runtime.get(r.roomId).state.matchId;const second=results.queue.tick();resolvers.get(old)();await first;assert.equal(results.get(r.roomId).matchId,current);assert.equal(results.get(r.roomId).persistence,'pending');resolvers.get(current)();await second;assert.equal(results.get(r.roomId).winner,'B');assert.equal(results.get(r.roomId).persistence,'saved');
});
