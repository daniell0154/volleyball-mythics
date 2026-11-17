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
  const snapshot={...runtime.snapshot(m),fixtureContacts:{...m.contacts}};history.push(structuredClone(snapshot));
  if(tick%3===0&&index===0&&rtt===0&&!fullMatch)trace.push(snapshot);
  const down=Math.round((rtt/2)/16.667),observedIndex=Math.max(0,history.length-1-down-12),observed=history[observedIndex]||snapshot;
  if(tick%12===0){
   const ball=observed.ball,previous=history[Math.max(0,observedIndex-3)]?.ball??ball,dt=3/60;
   const velocity={x:(ball.x-previous.x)/dt,y:(ball.y-previous.y)/dt,z:(ball.z-previous.z)/dt};
   const discriminant=velocity.y**2+2*9.81*(ball.y-1.6),flight=discriminant>0?Math.max(0,Math.min(2.5,(velocity.y+Math.sqrt(discriminant))/9.81)):0;
   // Intercept estimated only from two delayed observations and known gravity.
   const target={x:ball.x+velocity.x*flight,z:ball.z+velocity.z*flight};
   const eligible=m.athletes.filter(a=>(defending==='both'?a.team===(target.z<0?'A':'B'):a.team!==side)&&a.id!==observed.fixtureContacts.lastPlayerId);
   const nearest=eligible.reduce((best,a)=>!best||Math.hypot(a.position.x-target.x,a.position.z-target.z)<Math.hypot(best.position.x-target.x,best.position.z-target.z)?a:best,null);
   for(const a of m.athletes){
    const direction=a.team==='A'?1:-1,actions=[];let dx=0,dz=0;
    if(m.state.phase==='serving'&&a.team===m.state.servingSide&&a.slot===m.state.servingSlot)actions.push('serve');
    if(defending&&(defending==='both'||a.team!==side)&&a.id===nearest?.id&&m.state.phase==='rally'&&m.phaseTicks<900){
     dx=target.x-a.position.x;dz=target.z-a.position.z;
     actions.push(observed.fixtureContacts.lastTouchSide===a.team?(observed.fixtureContacts.touches>=2?'attack':'set'):'receive');
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
  if(returnEvent&&firstReturn===null){firstReturn=(tick-serveTick)/60;firstFlight??=firstReturn;}
  if(firstReturn===null&&m.state.phase==='rally'&&m.athletes.some(a=>a.team!==side&&Math.hypot(a.position.x-m.ball.position.x,a.position.y+1.1-m.ball.position.y,a.position.z-m.ball.position.z)<2.3))reachableTicks++;
  if(summary&&!fullMatch)break;
 }
 if(fullMatch){if(!m.ended)throw Error('match timed out');return {side,index,rtt,winner:m.winner,serveOnlyWon:m.winner===side,score:m.state.score};}
 if(!summary)throw Error('rally timed out');
 if(trace.length)traces.push({side,defending,frames:trace});
 return{side,index,rtt,defending,attributes:value,serveZoneX:zone,reactionMs:200,firstFlightSeconds:firstFlight,firstReturnSeconds:firstReturn,reachableWindowSeconds:reachableTicks/60,...summary};
}
for(const rtt of [0,150])for(const side of ['A','B'])for(let i=0;i<40;i++)rows.push(scenario(side,i,rtt));
const inactive=['A','B'].map(side=>scenario(side,0,0,false));
const bothActive=Array.from({length:40},(_,i)=>scenario(i%2?'B':'A',i,i%2?150:0,'both'));
const matches=Array.from({length:20},(_,i)=>scenario(i%2?'B':'A',i,150,true,true));
const percentile=(xs,p)=>[...xs].sort((a,b)=>a-b)[Math.ceil(xs.length*p)-1]??0;
const summary=[0,150].flatMap(rtt=>['A','B'].map(side=>{const sample=rows.filter(r=>r.side===side&&r.rtt===rtt);return{side,rtt,samples:sample.length,returnRate:sample.filter(r=>r.returnedServe).length/sample.length,medianContacts:percentile(sample.map(r=>r.contactsAfterServe),.5),medianDuration:percentile(sample.map(r=>r.durationSeconds),.5),rangeRejections:sample.reduce((n,r)=>n+r.rangeRejections,0)};}));
const report={date:new Date().toISOString(),rulesVersion:version,environment:{node:process.version,cpu:os.cpus()[0].model,os:os.version()},fixture:'2v2, observations delayed by 200ms reaction plus RTT/2, input delayed RTT/2 with jitter +-33ms. Interception estimated from two past ball observations and gravity; receive/set/attack from delayed accepted contacts. One defending team, serving team stays still; separate both-active series. Stops attempting hits after 15s per rally, so long-rally durations are censored. Both teams serve when entitled. Deterministic index schedule, UUIDs not used in decisions. Test-only, not humans or product bots.',summary,bothActiveMedianContacts:percentile(bothActive.map(r=>r.contactsAfterServe),.5),bothActive,serveOnlyMatchWinRate:matches.filter(m=>m.serveOnlyWon).length/20,inactive,rows,matches};
await writeFile(`docs/benchmarks/014-profile-${version}.json`,JSON.stringify(report,null,2)+'\n');await writeFile(`docs/benchmarks/014-traces-${version}.json`,JSON.stringify(traces)+'\n');console.log(JSON.stringify({version,summary,serveOnlyMatchWinRate:report.serveOnlyMatchWinRate}));
