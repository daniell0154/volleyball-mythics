import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RoomApplication} from '../dist/rooms/application.js';
import {MatchRuntime} from '../dist/runtime/matches.js';
import {ReconnectController} from '../dist/reconnect/controller.js';
import {MatchResults} from '../dist/results/coordinator.js';
import {MatchLifecycle} from '../dist/lifecycle/matches.js';
function setup(){
 let now=0,app;const saved=[];
 const runtime=new MatchRuntime((r,s)=>app.broadcast(r,'snapshot',s),()=>now);
 const reconnect=new ReconnectController(runtime,(r,t,p)=>app.broadcast(r,t,p),()=>now);
 const results=new MatchResults({persist:async p=>{saved.push(p);}},(r,t,p)=>app.broadcast(r,t,p),()=>now);
 app=new RoomApplication([{id:'fixture',version:1,name:'Fixture'}],{start:r=>runtime.start(r),suspend:r=>reconnect.disconnect(r),reconnect:r=>reconnect.reconnect(r),abandon:(r,id)=>reconnect.abandon(r,id),rematch:(r,id)=>lifecycle.vote(r,id)});
 const lifecycle=new MatchLifecycle(app.rooms,runtime,results,reconnect,(r,t,p)=>app.broadcast(r,t,p),()=>true,()=>now);
 runtime.onEnded=m=>results.finish(m);
 const sessions=['a','allyA','b','allyB'].map(userId=>({userId,expiresAt:Infinity,events:[],send(type,payload){this.events.push({type,payload});}}));sessions.forEach(s=>app.connect(s));
 const send=(index,type,payload={})=>app.command(sessions[index],{protocolVersion:1,type,requestId:'test',payload});
 send(0,'createRoom',{mode:'2v2'});const room=app.rooms.roomFor('a');
 for(let i=1;i<4;i++){send(0,'start');assert.equal(sessions[0].events.at(-1).payload.code,'invalid_state');send(i,'joinRoom',{code:room.code});}
 for(let i=0;i<4;i++)send(i,'selectCharacter',{characterId:'fixture',version:1});
 for(let i=0;i<4;i++)send(i,'ready',{ready:true});send(0,'start');
 assert.equal(room.members.length,4);assert.equal(room.status,'active');
 return {app,runtime,reconnect,results,room,sessions,send,saved,advance:ms=>{now+=ms;reconnect.tick();},drop:i=>app.disconnect(sessions[i]),restore:i=>app.connect(sessions[i])};
}
test('2v2: incomplete lobbies never start, reconnect freezes and resumes after 3s',()=>{
 const s=setup();s.runtime.advance(3000);const tick=s.runtime.get(s.room.roomId).tick;
 s.drop(1);s.advance(19000);s.runtime.advance(1000);assert.equal(s.runtime.get(s.room.roomId).tick,tick);
 s.restore(1);s.advance(2999);assert.equal(s.room.status,'suspended');s.advance(1);assert.equal(s.room.status,'active');
});
test('2v2: 20s timeout, 40s cumulative budget, both teams absent and abandonment',()=>{
 for(const both of [false,true]){const s=setup();s.drop(0);if(both)s.drop(2);s.advance(20000);const match=s.runtime.get(s.room.roomId);assert.equal(match.winner,both?null:'B');assert.deepEqual(match.state.score,{A:0,B:0});}
 const s=setup();for(let i=0;i<2;i++){s.drop(1);s.advance(19000);s.restore(1);s.advance(3000);}s.drop(1);s.advance(1999);assert.equal(s.runtime.get(s.room.roomId).ended,false);s.advance(1);assert.equal(s.runtime.get(s.room.roomId).winner,'B');
 const other=setup();other.send(2,'leave');assert.equal(other.runtime.get(other.room.roomId).winner,'A');
});
test('2v2: six points persist with four participants; all four votes required for rematch',async()=>{
 const s=setup();s.runtime.advance(120000);const previous=s.runtime.get(s.room.roomId);assert.equal(previous.ended,true);assert.equal(Math.max(previous.state.score.A,previous.state.score.B),6);
 await s.results.queue.tick();assert.equal(s.saved.length,1);assert.equal(s.saved[0].mode,'2v2');assert.equal(s.saved[0].players.length,4);
 for(let i=0;i<3;i++)s.send(i,'rematchVote');assert.equal(s.room.status,'finished');
 s.send(3,'rematchVote');const next=s.runtime.get(s.room.roomId);assert.notEqual(next.state.matchId,previous.state.matchId);assert.deepEqual(next.state.score,{A:0,B:0});assert.equal(next.state.phase,'countdown');
});
