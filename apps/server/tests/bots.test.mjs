import {test} from 'node:test';import assert from 'node:assert/strict';
import {RoomRegistry} from '../dist/rooms/registry.js';import {MatchRuntime} from '../dist/runtime/matches.js';import {BOT_POLICIES} from '../dist/runtime/bots/controller.js';import {MatchResults} from '../dist/results/coordinator.js';
export function setup(difficulty='normal',seed=123){const rooms=new RoomRegistry(),room=rooms.create('human','2v2');Object.assign(room,{matchKind:'vsBots',humanSlots:1,difficulty,botSeed:seed,botPolicyVersion:1});room.members[0].character={id:'fixture',version:1};
 for(const [i,team,slot]of [[1,'A',1],[2,'B',0],[3,'B',1]])room.members.push({controller:'bot',participantId:'bot:00000000-0000-4000-8000-'+String(i).padStart(12,'0'),team,slot,character:{id:'fixture',version:1},ready:true,connected:true});
 const runtime=new MatchRuntime(()=>{},()=>0);runtime.start(room);return{runtime,room,rooms};}
test('bots generate deterministic legal movement and actions without Auth identities',()=>{
 const a=setup(),b=setup();for(let i=0;i<1200;i++){a.runtime.advance(1000/60);b.runtime.advance(1000/60);}const x=a.runtime.get(a.room.roomId),y=b.runtime.get(b.room.roomId);
 assert.deepEqual(x.athletes.map(p=>p.position),y.athletes.map(p=>p.position));assert.deepEqual(x.state.score,y.state.score);assert.ok(a.room.members.filter(m=>m.controller==='bot').every(m=>!m.userId));assert.ok(x.bots.history.length<=64);
 assert.ok(x.athletes.every(p=>Math.abs(p.position.x)<=4.175&&Math.abs(p.position.z)<=8.675));assert.ok(x.bots.states.size===3);
 const tick=x.tick;a.runtime.suspend(a.room);a.runtime.advance(1000);assert.equal(x.tick,tick);a.runtime.remove(a.room.roomId);assert.equal(a.runtime.get(a.room.roomId),undefined);
});
test('difficulty changes policy and metadata, never attributes or physical ranges',()=>{
 assert.ok(BOT_POLICIES.easy.reactionTicks>BOT_POLICIES.normal.reactionTicks);assert.ok(BOT_POLICIES.normal.reactionTicks>BOT_POLICIES.hard.reactionTicks);assert.ok(BOT_POLICIES.easy.error>BOT_POLICIES.normal.error);
 const a=setup('easy'),b=setup('hard');assert.deepEqual(a.runtime.get(a.room.roomId).athletes.map(p=>p.attributes),b.runtime.get(b.room.roomId).athletes.map(p=>p.attributes));assert.equal(a.runtime.get(a.room.roomId).rallyProfile,b.runtime.get(b.room.roomId).rallyProfile);
});
test('partner never poaches own serve while the delayed observation still shows serving',()=>{
 const s=setup();s.runtime.advance(3000);const m=s.runtime.get(s.room.roomId);m.athletes[0].position.x=3;
 s.runtime.submit(s.room,'human',{seq:1,moveX:0,moveZ:0,actions:['serve']});s.runtime.advance(1000);
 assert.equal(m.contacts.lastTouchSide,'A');assert.equal(m.contacts.touches,0);assert.equal(m.visualActions.filter(a=>a.kind==='receive'&&m.athletes.find(p=>p.id===a.actorId)?.team==='A').length,0);
});
test('bot results carry participant identities and policy while legacy result shapes stay compatible',async()=>{
 const s=setup();let saved;const results=new MatchResults({persist:async p=>{saved=p;}},()=>{});s.runtime.onEnded=m=>results.finish(m);s.runtime.finish(s.room,'B','forfeit');await results.queue.tick();assert.equal(saved.matchKind,'vsBots');assert.equal(saved.botSeed,123);assert.equal(saved.players.length,4);assert.equal(saved.players.filter(p=>p.controller==='bot'&&!p.userId).length,3);
});
