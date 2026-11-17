import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MatchRuntime} from '../dist/runtime/matches.js';
import {RoomRegistry} from '../dist/rooms/registry.js';
function setup(){const rooms=new RoomRegistry(),room=rooms.create('a','1v1');rooms.join('b',room.code);const frames=[];const runtime=new MatchRuntime((_r,s)=>frames.push(s));runtime.start(room);return{runtime,room,frames};}
test('a complete match reaches sixth point without fabricated winner or duplicated point',()=>{
 const {runtime,room,frames}=setup();let ended=0;runtime.onEnded=()=>ended++;
 runtime.advance(3000);for(let n=0;n<12&&!runtime.get(room.roomId).ended;n++)runtime.advance(10000);
 const final=frames.at(-1);assert.equal(final.phase,'finished');assert.equal(Math.max(final.score.A,final.score.B),6);assert.equal(final.winner,final.score.A===6?'A':'B');assert.equal(final.reason,'points');
 const before=JSON.stringify(final.score);runtime.advance(60000);runtime.submit(room,'a',{seq:1,moveX:0,moveZ:0,actions:['serve']});assert.equal(JSON.stringify(frames.at(-1).score),before);assert.equal(ended,1);
});
test('only server can serve; ball landing in opponent half scores for the serving side',()=>{
 const {runtime,room,frames}=setup();runtime.advance(3000);runtime.submit(room,'b',{seq:1,moveX:0,moveZ:0,actions:['serve']});runtime.advance(50);assert.equal(frames.at(-1).phase,'serving');
 runtime.submit(room,'a',{seq:1,moveX:0,moveZ:0,actions:['serve']});runtime.advance(2500);assert.equal(frames.at(-1).score.A,1);assert.equal(frames.at(-1).score.B,0);assert.equal(frames.at(-1).phase,'point');
});
test('receive action requires ball in range and separation prevents repeated touches',()=>{
 const {runtime,room}=setup();const feedback=[];runtime.onAction=(id,message)=>feedback.push({id,message});runtime.advance(3000);runtime.submit(room,'a',{seq:1,moveX:0,moveZ:0,actions:['serve']});runtime.advance(50);
 const match=runtime.get(room.roomId);const before=match.contacts.lastTouchSide;
 runtime.submit(room,'b',{seq:1,moveX:0,moveZ:0,actions:['receive']});runtime.advance(20);assert.equal(match.contacts.lastTouchSide,before);assert.ok(feedback.some(f=>f.id==='b'&&f.message.includes('bola')));
 match.ball={position:{x:0,y:1.1,z:6},velocity:{x:0,y:0,z:0},grounded:false};
 runtime.submit(room,'b',{seq:2,moveX:0,moveZ:0,actions:['receive']});runtime.advance(20);assert.equal(match.contacts.lastTouchSide,'B');assert.equal(match.contacts.touches,1);
 runtime.submit(room,'b',{seq:3,moveX:0,moveZ:0,actions:['receive']});runtime.advance(20);assert.equal(match.contacts.touches,1);
});

const rant={trigger:'manual',validPhases:['rally'],target:'teammate',affectedAttributes:['speed','receive'],multiplier:.85,durationSeconds:5,cooldownSeconds:20,stackable:false};
const freePoint={trigger:'manual',validPhases:['rally'],target:'opponent_team',effect:'force_ball_out',requiresBallInActionRange:true,points:1,pointPolicy:'opponent_once_on_rally_resolution',durationSeconds:0,cooldownSeconds:25,endsRally:true,stackable:false};
function doubles(abilityId){
 const rooms=new RoomRegistry(),room=rooms.create('a','2v2');for(const id of ['b','c','d'])rooms.join(id,room.code);
 room.members.forEach((member,index)=>{member.character={id:index===0?abilityId:'none',version:1};});
 const frames=[];const runtime=new MatchRuntime((_r,s)=>frames.push(s),Date.now,()=>undefined,()=>undefined,(id)=>id==='teammate_rant'?{id,config:rant}:id==='free_point_out'?{id,config:freePoint}:undefined);
 runtime.start(room);return{runtime,room,frames};
}
test('teammate ability applies one bounded debuff, ignores spam during cooldown, expires, and clears on match end',()=>{
 const {runtime,room}=doubles('teammate_rant');runtime.advance(3000);
 runtime.submit(room,'a',{seq:1,moveX:0,moveZ:0,actions:['serve']});runtime.advance(50);
 const match=runtime.get(room.roomId);match.ball={position:{x:0,y:10000,z:0},velocity:{x:0,y:0,z:0},grounded:false};
 runtime.submit(room,'a',{seq:2,moveX:0,moveZ:0,actions:['ability']});runtime.advance(20);
 const expires=match.activeEffects.get('b').expiresAtTick;assert.equal(match.activeEffects.get('b').multiplier,.85);
 assert.equal(runtime.snapshot(match).visualActions.at(-1).kind,'rant');
 const visualId=runtime.snapshot(match).visualActions.at(-1).id;
 assert.ok(match.abilityCooldowns.get('a')>match.tick);
 runtime.submit(room,'a',{seq:3,moveX:0,moveZ:0,actions:['ability']});runtime.advance(20);
 assert.equal(match.activeEffects.get('b').expiresAtTick,expires);
 assert.equal(runtime.snapshot(match).visualActions.at(-1).id,visualId);
 runtime.advance(5000);assert.equal(match.activeEffects.has('b'),false);
 match.activeEffects.set('b',{expiresAtTick:match.tick+500,multiplier:.85,attributes:['speed']});runtime.finish(room,'A','forfeit');
 assert.equal(match.activeEffects.size,0);
});
test('free point ability requires range and resolves at most one opponent point per rally',()=>{
 const {runtime,room}=doubles('free_point_out');runtime.advance(3000);
 runtime.submit(room,'a',{seq:1,moveX:0,moveZ:0,actions:['serve']});runtime.advance(50);
 const match=runtime.get(room.roomId);const caio=match.athletes.find(a=>a.id==='a');match.ball={position:{x:100,y:100,z:100},velocity:{x:0,y:0,z:0},grounded:false};
 runtime.submit(room,'a',{seq:2,moveX:0,moveZ:0,actions:['ability']});runtime.advance(20);
 assert.deepEqual(match.state.score,{A:0,B:0});assert.equal(match.abilityCooldowns.has('a'),false);
 match.ball={position:{x:caio.position.x,y:caio.position.y+1.1,z:caio.position.z},velocity:{x:0,y:0,z:0},grounded:false};
 runtime.submit(room,'a',{seq:3,moveX:0,moveZ:0,actions:['ability']});runtime.advance(20);
 assert.deepEqual(match.state.score,{A:0,B:1});assert.equal(match.state.phase,'point');assert.ok(match.abilityCooldowns.get('a')>match.tick);
 assert.equal(runtime.snapshot(match).visualActions.at(-1).kind,'freePoint');
 runtime.advance(20);assert.deepEqual(match.state.score,{A:0,B:1});
});
