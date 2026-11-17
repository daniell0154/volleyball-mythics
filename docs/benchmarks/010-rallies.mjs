import os from 'node:os';
import {writeFile} from 'node:fs/promises';
import {MatchRuntime} from '../../apps/server/dist/runtime/matches.js';
import {RoomRegistry} from '../../apps/server/dist/rooms/registry.js';
const rows=[];
for(const mode of ['1v1','2v2']){
 const registry=new RoomRegistry(),room=registry.create('fixture-a',mode);
 for(const id of mode==='1v1'?['fixture-b']:['fixture-b','fixture-c','fixture-d'])registry.join(id,room.code);
 let clock=0,seq=0;
 const runtime=new MatchRuntime(()=>{},()=>clock);
 runtime.onRallyMeasured=summary=>rows.push(summary);
 runtime.start(room);
 for(let step=0;step<120000&&rows.filter(r=>r.mode===mode).length<20;step++){
  const match=runtime.get(room.roomId);
  if(match.ended){runtime.start(room);continue;}
  const ball=match.ball.position;
  // Test-only pursuit, 100ms reaction; no bots or new participants in the product.
  const sampleIndex=rows.filter(r=>r.mode===mode).length;
  const reactionTicks=[6,9,12,18][sampleIndex%4];
  const aimError=[0,.5,1.2,1.8][sampleIndex%4];
  if(step%reactionTicks===0){
   const eligible=match.athletes.filter(a=>a.team===(ball.z<0?'A':'B'));
   const nearest=eligible.reduce((best,a)=>!best||Math.hypot(a.position.x-ball.x,a.position.z-ball.z)<Math.hypot(best.position.x-ball.x,best.position.z-ball.z)?a:best,null);
   for(const athlete of match.athletes){
    const active=nearest?.id===athlete.id&&match.phaseTicks<900,dx=active?ball.x+Math.sin(sampleIndex+1)*aimError-athlete.position.x:0,dz=active?ball.z+Math.cos(sampleIndex+1)*aimError-athlete.position.z:0;
    const length=Math.hypot(dx,dz),actions=[];
    if(match.state.phase==='serving'&&athlete.team===match.state.servingSide&&athlete.slot===match.state.servingSlot)actions.push('serve');
    if(match.state.phase==='rally'&&active&&ball.y<2.8)actions.push('receive');
    runtime.submit(room,athlete.id,{seq:++seq,moveX:length>.2?dx/Math.max(1,length):0,moveZ:length>.2?dz/Math.max(1,length):0,actions});
   }
  }
  clock+=1000/60;runtime.advance(1000/60);
 }
 if(rows.filter(r=>r.mode===mode).length!==20)throw Error('did not capture 20 rallies '+mode+' captured='+rows.filter(r=>r.mode===mode).length);
}
const percentile=(values,p)=>[...values].sort((a,b)=>a-b)[Math.ceil(values.length*p)-1]??0;
const report={timestamp:new Date().toISOString(),participantType:'automated test-only pursuit fixture: reaction 100/150/200/300ms and aim error 0/.5/1.2/1.8m; stops attempting contacts after 15s/rally; not human skill/playtest evidence',environment:{node:process.version,cpu:os.cpus()[0].model,os:os.version()},rows,summary:['1v1','2v2'].map(mode=>{const sample=rows.filter(r=>r.mode===mode),served=sample.filter(r=>r.served);return{mode,rallies:sample.length,served:served.length,returnRate:served.filter(r=>r.returnedServe).length/served.length,medianContacts:percentile(served.map(r=>r.contactsAfterServe),.5),medianDurationSeconds:percentile(served.map(r=>r.durationSeconds),.5),p95DurationSeconds:percentile(served.map(r=>r.durationSeconds),.95),rangeRejections:sample.reduce((n,r)=>n+r.rangeRejections,0)};})};
await writeFile(process.argv[2]??'docs/benchmarks/010-baseline.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary));
