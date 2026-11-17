import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RoomApplication } from '../dist/rooms/application.js';
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
