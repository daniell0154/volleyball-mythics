// Run after building @volleyball-mythics/domain.
import { writeFileSync, mkdirSync } from "node:fs";
import { stepBall, moveAthlete, createMatch, transition, createBallContactState, applyContact, resolveGround, rallyProfile, rallyVelocity } from "../../packages/domain/dist/index.js";

const config = { fixedDeltaSeconds: 1/60, gravity: 9.81, radius: .11, netHeight: 2.43, netHalfWidth: 4.5, netRestitution: .45 };
const attributes = { serve: 70, receive: 70, set: 70, attack: 70, block: 70, speed: 70, jump: 70 };
const fixtures = { balls: [], contacts: [], matches: [], shots: [], ground: [], movement: [] };
for (const initial of [
  { position: {x:0,y:3,z:-4}, velocity:{x:1,y:2,z:4}, grounded:false },
  { position: {x:0,y:.3,z:2}, velocity:{x:0,y:-100,z:0}, grounded:false },
  { position: {x:0,y:2,z:-1}, velocity:{x:0,y:0,z:120}, grounded:false },
  { position: {x:0,y:.12,z:-.02}, velocity:{x:0,y:-100,z:120}, grounded:false },
]) {
  let state = initial;
  const ticks = [];
  for (let i=0;i<180;i++) { const step=stepBall(state,config); ticks.push(step); state=step.state; }
  fixtures.balls.push({initial,ticks});
}
for (const mode of ["1v1","2v2"]) {
  let state=createBallContactState(mode);
  const steps=[];
  for (const [id,side,kind] of [["a0","A","hit"],["a0","A","hit"],["a1","A","hit"],["a0","A","hit"],["a1","A","hit"],["b0","B","block"],["b0","B","hit"],["a0","A","hit"]]) {
    const result=applyContact(state,id,side,kind); steps.push({id,side,kind,result});
    if(result.legal)state=result.state;
  }
  fixtures.contacts.push({mode,steps});
  let match=createMatch("fixture-"+mode,mode,4);
  const events=[{type:"SERVE_HIT"},{type:"START"},{type:"COUNTDOWN_FINISHED"}];
  for(let i=0;i<11;i++) {
    events.push({type:"SERVE_HIT"},{type:"RALLY_POINT",pointId:"p"+i,scoringSide:i%2===0?"A":"B"});
    events.push({type:"RALLY_POINT",pointId:"p"+i,scoringSide:i%2===0?"A":"B"},{type:"POINT_DELAY_FINISHED"});
  }
  events.push({type:"CANCEL"});
  const transitions=events.map(event=>{match=transition(match,event);return {event,state:match};});
  fixtures.matches.push({mode,transitions});
}
for(const direction of [1,-1]) for(const kind of ["serve","receive","set","attack","block"]) for(const y of [0,1]) {
  const ball={x:1,y:2,z:-direction*3}, athlete={x:1,y,z:-direction*6}, teammate={x:-2,y:0,z:-direction*4}, aim={x:.6,z:.8};
  const velocity=rallyVelocity(rallyProfile(4),kind,ball,athlete,direction,attributes,teammate,aim);
  const initial={position:ball,velocity,grounded:false};
  let state=initial;
  const ticks=[];
  for(let i=0;i<180;i++){const step=stepBall(state,config);ticks.push(step);state=step.state;}
  fixtures.shots.push({kind,ball,athlete,direction,attributes,teammate,aim,velocity});
  fixtures.balls.push({initial,ticks});
}
for(const [x,z,side] of [[4.5,9,"A"],[0,-4,"A"],[4.5001,0,"A"],[0,-9.0001,"B"]])
  fixtures.ground.push({position:{x,z},side,result:resolveGround({x,z},side)});
const bounds={minX:-4.2,maxX:4.2,minZ:-8.7,maxZ:-.2};
for(const input of [{x:1,z:1},{x:0,z:0},{x:-1,z:-1}]) {
  const position={x:4,y:0,z:-8},speed=5,dt=1;
  fixtures.movement.push({position,input,speed,dt,bounds,result:moveAthlete(position,input,speed,dt,bounds)});
}
mkdirSync(new URL("../tests/",import.meta.url),{recursive:true});
const serialized = JSON.stringify(fixtures);
mkdirSync(new URL("../tests/FixtureChunks/",import.meta.url),{recursive:true});
const count = Math.ceil(serialized.length / 100000);
for (let index = 0; index < count; index++) {
  writeFileSync(new URL("../tests/FixtureChunks/Chunk"+(index+1)+".luau",import.meta.url),
    "return [=["+serialized.slice(index*100000,(index+1)*100000)+"]=]\n");
}
writeFileSync(new URL("../tests/FixtureData.luau",import.meta.url),
  '--!strict\n-- Generated from TypeScript. Chunks respect Studio Source size limits.\nlocal chunks = {}\nfor i = 1, '+count+' do\n table.insert(chunks, require(script.Parent.FixtureChunks:FindFirstChild("Chunk" .. i) :: ModuleScript))\nend\nreturn game:GetService("HttpService"):JSONDecode(table.concat(chunks))\n');
console.log("Generated",fixtures.balls.length*180,"ball ticks, 20 shots, 2 contact traces and 2 match traces.");
