import {writeFile} from 'node:fs/promises';
import os from 'node:os';
import {RoomRegistry} from '../../apps/server/dist/rooms/registry.js';
import {MatchRuntime} from '../../apps/server/dist/runtime/matches.js';
const version=Number(process.argv[2]??3),rows=[],traces=[];
const attributes=value=>Object.fromEntries(['serve','receive','set','attack','block','speed','jump'].map(k=>[k,value]));
function scenario(side,index,rtt,defending=true,fullMatch=false){
 const rooms=new RoomRegistry(),room=rooms.create('a','2v2');for(const id of ['aa','b','bb'])rooms.join(id,room.code);
 const value=[25,75,100][index%3],zone=[-3,0,3][Math.floor(index/3)%3];let seq=0,clock=0,summary;
 const runtime=new MatchRuntime(()=>{},()=>clock,undefined,()=>attributes(value),undefined,false,version);
 runtime.onRallyMeasured=s=>{summary=s;};runtime.start(room);let m=runtime.get(room.roomId);m.state.servingSide=side;
 runtime.advance(3000);m.athletes.find(a=>a.team===side&&a.slot===0).position.x=zone;
 const history=[],queue=[];let firstFlight=null,firstReturn=null,serveTick=null,reachableTicks=0;const trace=[];
 for(let tick=0;tick<(fullMatch?18000:2400)&&!m.ended;tick++){
  const snapshot=runtime.snapshot(m);history.push(structuredClone(snapshot));
  if(tick%3===0&&index===0&&rtt===0&&!fullMatch)trace.push(snapshot);
  const down=Math.round((rtt/2)/16.667),observed=history[Math.max(0,history.length-1-down)]||snapshot;
  if(tick%12===0){
   const ball=observed.ball,eligible=m.athletes.filter(a=>a.team!==(side)&&a.id!==m.contacts.lastPlayerId);
   const nearest=eligible.reduce((best,a)=>!best||Math.hypot(a.position.x-ball.x,a.position.z-ball.z)<Math.hypot(best.position.x-ball.x,best.position.z-ball.z)?a:best,null);
   for(const a of m.athletes){
    const direction=a.team==='A'?1:-1,actions=[];let dx=0,dz=0;
    if(m.state.phase==='serving'&&a.team===m.state.servingSide&&a.slot===m.state.servingSlot)actions.push('serve');
    if(defending&&a.team!==side&&a.id===nearest?.id&&m.state.phase==='rally'){
     // Position pursuit from delayed observed ball, never a future landing oracle.
     dx=ball.x-a.position.x;dz=ball.z-a.position.z;
     if(ball.y<2.8)actions.push('receive');
    }
    const length=Math.hypot(dx,dz),jitter=rtt?[-2,0,2][tick/12%3]:0;
    queue.push({at:tick+Math.max(0,down+jitter),a:a.id,p:{seq:++seq,moveX:length>.15?dx/Math.max(length,1):0,moveZ:length>.15?dz/Math.max(length,1):0,actions}});
   }
  }
  for(let i=queue.length-1;i>=0;i--)if(queue[i].at<=tick){const q=queue.splice(i,1)[0];runtime.submit(room,q.a,q.p);}
  clock+=1000/60;runtime.advance(1000/60);
  if(serveTick===null&&m.state.phase==='rally')serveTick=tick;
  if(serveTick!==null&&firstFlight===null&&m.ball.grounded)firstFlight=(tick-serveTick)/60;
  const returnEvent=m.visualActions.find(a=>a.kind==='receive'&&m.athletes.find(p=>p.id===a.actorId)?.team!==side);
  if(returnEvent&&firstReturn===null)firstReturn=(tick-serveTick)/60;
  if(m.state.phase==='rally'&&m.athletes.some(a=>a.team!==side&&Math.hypot(a.position.x-m.ball.position.x,a.position.y+1.1-m.ball.position.y,a.position.z-m.ball.position.z)<2.3))reachableTicks++;
  if(summary&&!fullMatch)break;
 }
 if(fullMatch){if(!m.ended)throw Error('match timed out');return {side,index,rtt,winner:m.winner,serveOnlyWon:m.winner===side,score:m.state.score};}
 if(!summary)throw Error('rally timed out');
 if(trace.length)traces.push({side,defending,frames:trace});
 return{side,index,rtt,defending,attributes:value,serveZoneX:zone,reactionMs:200,firstFlightSeconds:firstFlight,firstReturnSeconds:firstReturn,reachableWindowSeconds:reachableTicks/60,...summary};
}
for(const rtt of [0,150])for(const side of ['A','B'])for(let i=0;i<40;i++)rows.push(scenario(side,i,rtt));
const inactive=['A','B'].map(side=>scenario(side,0,0,false));
const matches=Array.from({length:20},(_,i)=>scenario(i%2?'B':'A',i,150,true,true));
const percentile=(xs,p)=>[...xs].sort((a,b)=>a-b)[Math.ceil(xs.length*p)-1]??0;
const summary=[0,150].flatMap(rtt=>['A','B'].map(side=>{const sample=rows.filter(r=>r.side===side&&r.rtt===rtt);return{side,rtt,samples:sample.length,returnRate:sample.filter(r=>r.returnedServe).length/sample.length,medianContacts:percentile(sample.map(r=>r.contactsAfterServe),.5),medianDuration:percentile(sample.map(r=>r.durationSeconds),.5),rangeRejections:sample.reduce((n,r)=>n+r.rangeRejections,0)};}));
const report={date:new Date().toISOString(),rulesVersion:version,environment:{node:process.version,cpu:os.cpus()[0].model,os:os.version()},fixture:'2v2, 200ms pursuit from delayed ball observations; one defending team, serving team stays still; both teams serve when entitled; test-only, not humans or product bots. RTT shim delays observation/input, jitter +-33ms.',summary,serveOnlyMatchWinRate:matches.filter(m=>m.serveOnlyWon).length/20,inactive,rows,matches};
await writeFile(`docs/benchmarks/014-profile-${version}.json`,JSON.stringify(report,null,2)+'\n');await writeFile(`docs/benchmarks/014-traces-${version}.json`,JSON.stringify(traces)+'\n');console.log(JSON.stringify({version,summary,serveOnlyMatchWinRate:report.serveOnlyMatchWinRate}));
