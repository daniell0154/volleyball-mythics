import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MatchRuntime } from '../dist/runtime/matches.js';
import { RoomRegistry } from '../dist/rooms/registry.js';
test('match pins selected appearance when catalog changes later',()=>{
  const rooms=new RoomRegistry(),room=rooms.create('a','1v1');rooms.join('b',room.code);
  room.members[0].character={id:'samuel',version:1};room.members[1].character={id:'caio',version:1};
  const catalog=new Map([['samuel','procedural:v1:male:2626328580'],['caio','procedural:v1:male:2016838844']]);
  const snapshots=[];const runtime=new MatchRuntime((_room,snapshot)=>snapshots.push(snapshot),()=>1000,id=>catalog.get(id));
  runtime.start(room);catalog.set('samuel','procedural:v1:male:99');runtime.advance(50);
  assert.equal(snapshots.at(-1).athletes.find(a=>a.id==='a').assetKey,'procedural:v1:male:2626328580');
  assert.equal(snapshots.at(-1).athletes.find(a=>a.id==='b').assetKey,'procedural:v1:male:2016838844');
});
test('60 simulation ticks and 20 snapshots/s; inputs cannot control another identity',()=>{
  const rooms=new RoomRegistry(),room=rooms.create('a','1v1');rooms.join('b',room.code);
  const snapshots=[];const runtime=new MatchRuntime((_room,snapshot)=>snapshots.push(snapshot),()=>1000);
  runtime.start(room);runtime.advance(1000);assert.equal(snapshots.length,20);assert.equal(snapshots.at(-1).tick,60);
  runtime.advance(2000);assert.equal(snapshots.at(-1).phase,'serving');
  runtime.submit(room,'intruder',{seq:999,moveX:1,moveZ:1,actions:['serve']});
  runtime.submit(room,'a',{seq:2,moveX:1,moveZ:0,actions:[]});
  runtime.submit(room,'a',{seq:1,moveX:-1,moveZ:0,actions:[]});runtime.advance(50);
  let snapshot=snapshots.at(-1);assert.equal(snapshot.lastProcessedSeq.a,2);assert.equal(snapshot.lastProcessedSeq.b,0);
  assert.ok(snapshot.athletes.find(a=>a.id==='a').position.x>0);assert.equal(snapshot.athletes.find(a=>a.id==='b').position.x,0);
  assert.equal(snapshot.phase,'serving');
  runtime.submit(room,'a',{seq:3,moveX:0,moveZ:0,actions:['serve']});runtime.advance(50);assert.equal(snapshots.at(-1).phase,'rally');
  runtime.suspend(room);snapshot=snapshots.at(-1);runtime.advance(5000);assert.equal(snapshots.at(-1),snapshot);
});
