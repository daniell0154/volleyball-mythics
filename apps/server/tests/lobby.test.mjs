import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RoomApplication } from '../dist/rooms/application.js';
import { MatchRuntime } from '../dist/runtime/matches.js';
test('catalog version, capacity, ready invalidation and owner-only start',()=>{
  const app=new RoomApplication([{id:'fixture-only',version:1,name:'Test fixture'}]);
  const sessions=['a','b'].map(userId=>({userId,expiresAt:Date.now()+100000,events:[],send(type,payload){this.events.push({type,payload});}}));
  const [a,b]=sessions; sessions.forEach(s=>app.connect(s));
  const send=(s,type,payload={})=>app.command(s,{protocolVersion:1,type,requestId:'test',payload});
  send(a,'createRoom',{mode:'1v1'});const room=app.rooms.roomFor('a');send(b,'joinRoom',{code:room.code});
  send(a,'selectCharacter',{characterId:'fixture-only',version:2}); assert.equal(a.events.at(-1).type,'error');
  for(const s of sessions){send(s,'selectCharacter',{characterId:'fixture-only',version:1});}
  for(const s of sessions)send(s,'ready',{ready:true});
  send(a,'setTeam',{team:'B',slot:0});assert.equal(a.events.at(-1).payload.code,'room_full');
  send(b,'start');assert.equal(b.events.at(-1).payload.code,'forbidden');
  send(a,'selectCharacter',{characterId:'fixture-only',version:1});assert.ok(room.members.every(m=>!m.ready));
  send(a,'start');assert.equal(a.events.at(-1).type,'error');
  for(const s of sessions)send(s,'ready',{ready:true});send(a,'start');assert.equal(room.status,'active');
});

test('2v2 synchronizes four players in exclusive slots and permits repeated characters',()=>{
  let started;
  let app;
  const runtime=new MatchRuntime((room,snapshot)=>app.broadcast(room,'snapshot',snapshot));
  app=new RoomApplication([{id:'fixture',version:3,name:'Shared character'}],{start:room=>{started=structuredClone(room);runtime.start(room);}});
  const sessions=['a','b','c','d'].map(userId=>({userId,expiresAt:Date.now()+100000,events:[],send(type,payload){this.events.push({type,payload});}}));
  const [a,b,c,d]=sessions; sessions.forEach(s=>app.connect(s));
  const send=(s,type,payload={})=>app.command(s,{protocolVersion:1,type,requestId:`${s.userId}-${type}`,payload});
  send(a,'createRoom',{mode:'2v2'});const room=app.rooms.roomFor('a');
  for(const s of [b,c,d])send(s,'joinRoom',{code:room.code});
  assert.deepEqual(room.members.map(m=>`${m.team}:${m.slot}`),['A:0','A:1','B:0','B:1']);
  for(const s of sessions)send(s,'selectCharacter',{characterId:'fixture',version:3});
  for(const s of sessions)send(s,'ready',{ready:true});
  send(a,'start');
  assert.equal(a.events.at(-1).type,'ack');
  assert.equal(started.members.length,4);
  assert.deepEqual(new Set(started.members.map(m=>`${m.team}:${m.slot}`)).size,4);
  assert.ok(started.members.every(m=>m.character.id==='fixture'));
  assert.ok(sessions.every(s=>s.events.some(e=>e.type==='roomState'&&e.payload?.status==='active')));
  assert.ok(sessions.every(s=>s.events.some(e=>e.type==='snapshot'&&e.payload.athletes.length===4)));
});
