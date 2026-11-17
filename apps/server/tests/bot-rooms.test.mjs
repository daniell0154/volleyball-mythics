import {test} from 'node:test';import assert from 'node:assert/strict';
import {RoomApplication} from '../dist/rooms/application.js';import {MatchRuntime} from '../dist/runtime/matches.js';import {MatchResults} from '../dist/results/coordinator.js';import {MatchLifecycle} from '../dist/lifecycle/matches.js';import {ReconnectController} from '../dist/reconnect/controller.js';import {parseEnvelope} from '../dist/network/envelope.js';
function setup(slots=1){let now=0,app;const runtime=new MatchRuntime(()=>{},()=>now),reconnect=new ReconnectController(runtime,()=>{},()=>now),saved=[];const results=new MatchResults({persist:async p=>saved.push(p)},()=>{},()=>now);
 app=new RoomApplication([{id:'fixture',version:1,name:'Fixture'}],{start:r=>runtime.start(r),suspend:r=>reconnect.disconnect(r),reconnect:r=>reconnect.reconnect(r),abandon:(r,id)=>reconnect.abandon(r,id),rematch:(r,id)=>lifecycle.vote(r,id),remove:id=>lifecycle.close(id),finishedDisconnect:r=>lifecycle.disconnected(r)});
 const lifecycle=new MatchLifecycle(app.rooms,runtime,results,reconnect,()=>{},()=>true,()=>now);runtime.onEnded=m=>{results.finish(m);lifecycle.ended(m.room);};
 const sessions=['human','friend','stranger'].map(userId=>({userId,expiresAt:Infinity,events:[],send(type,payload){this.events.push({type,payload});}}));sessions.forEach(s=>app.connect(s));const send=(i,type,payload={})=>app.command(sessions[i],{protocolVersion:1,type,requestId:'t',payload});send(0,'createRoom',{mode:'2v2',matchKind:'vsBots',humanSlots:slots,difficulty:'normal'});const room=app.rooms.roomFor('human');return{app,runtime,reconnect,lifecycle,results,room,sessions,send,saved,advance:ms=>{now+=ms;reconnect.tick();lifecycle.tick();}};
}
test('solo: bot identities, owner-only input, one human ready/vote and pinned rematch policy',async()=>{
 const s=setup(),seed=s.room.botSeed;assert.equal(s.room.members.length,4);assert.equal(s.room.members.filter(m=>m.controller==='bot'&&!m.userId).length,3);
 s.send(0,'setTeam',{team:'B',slot:0});assert.equal(s.sessions[0].events.at(-1).payload.code,'forbidden');
 s.send(0,'selectCharacter',{characterId:'fixture',version:1});s.send(0,'ready',{ready:true});s.send(0,'start');assert.equal(s.room.status,'active');s.runtime.advance(3000);assert.ok(s.runtime.get(s.room.roomId).bots);
 const bot=s.room.members.find(m=>m.controller==='bot');assert.throws(()=>s.app.rooms.roomFor(bot.participantId));
 const id=s.runtime.get(s.room.roomId).state.matchId;s.runtime.finish(s.room,'A','forfeit');await s.results.queue.tick();assert.equal(s.saved[0].players.filter(p=>p.controller==='human').length,1);
 s.send(0,'rematchVote');assert.equal(s.room.status,'active');assert.notEqual(s.runtime.get(s.room.roomId).state.matchId,id);assert.equal(s.room.botSeed,seed);assert.equal(s.room.difficulty,'normal');
 s.send(0,'leave');assert.equal(s.app.rooms.all().length,0);assert.equal(s.runtime.get(s.room.roomId),undefined);
});
test('coop: explicit capability, second human A1, full capacity, two votes and reconnect timeout cleanup',()=>{
 const s=setup(2);s.send(1,'joinRoom',{code:s.room.code});assert.equal(s.sessions[1].events.at(-1).payload.code,'client_update_required');
 s.send(1,'joinRoom',{code:s.room.code,acceptBots:true});assert.equal(s.room.members.find(m=>m.userId==='friend').team,'A');s.send(2,'joinRoom',{code:s.room.code,acceptBots:true});assert.equal(s.sessions[2].events.at(-1).payload.code,'room_full');
 for(let i=0;i<2;i++){s.send(i,'selectCharacter',{characterId:'fixture',version:1});}for(let i=0;i<2;i++)s.send(i,'ready',{ready:true});s.send(0,'start');s.runtime.finish(s.room,'A','forfeit');s.send(0,'rematchVote');assert.equal(s.room.status,'finished');s.send(1,'rematchVote');assert.equal(s.room.status,'active');
 s.app.disconnect(s.sessions[0]);s.app.disconnect(s.sessions[1]);s.advance(20000);assert.equal(s.runtime.get(s.room.roomId).ended,true);s.advance(20000);assert.equal(s.runtime.get(s.room.roomId),undefined);
});
test('wire rejects client supplied bot IDs, seed, invalid difficulty and fake controller inputs',()=>{
 const parse=payload=>parseEnvelope(JSON.stringify({protocolVersion:1,type:'createRoom',requestId:'t',payload}));const good={mode:'2v2',matchKind:'vsBots',humanSlots:1,difficulty:'normal'};assert.ok(parse(good));for(const p of [{...good,seed:1},{...good,controller:'bot'},{...good,difficulty:'god'},{...good,humanSlots:4}])assert.equal(parse(p),null);
 const s=setup();s.send(0,'leave');assert.equal(s.app.rooms.all().length,0);
});
