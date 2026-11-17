import type {InputPayload,BotDifficulty} from "@volleyball-mythics/protocol";
import type {RunningMatch} from "../matches.js";
export const BOT_POLICIES=Object.freeze({easy:Object.freeze({reactionTicks:24,error:1.8}),normal:Object.freeze({reactionTicks:12,error:.35}),hard:Object.freeze({reactionTicks:6,error:.06})});
export type BotState="position"|"receive"|"set"|"attack"|"block"|"serve";
interface Observation{tick:number;phase:string;serveSide:string|null;ball:{x:number;y:number;z:number};last:string|null;side:string|null;touches:number;athletes:{team:string;x:number;z:number}[]}
const noise=(seed:number)=>{let x=seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;return((x>>>0)/4294967295)*2-1;};
/** Bounded delayed observations. No future positions, teleports or privileged contacts. */
export class BotController{
 private history:Observation[]=[];
 readonly states=new Map<string,BotState>();
 constructor(readonly seed:number,readonly difficulty:BotDifficulty){}
 step(match:RunningMatch,submit:(id:string,input:InputPayload)=>void):void{
  if(match.tick%3===0){this.history.push({tick:match.tick,phase:match.state.phase,serveSide:match.contacts.touches===0&&!match.contacts.lastContactWasBlock?match.contacts.lastTouchSide:null,ball:{...match.ball.position},last:match.contacts.lastPlayerId,side:match.contacts.lastTouchSide,touches:match.contacts.touches,athletes:match.athletes.map(a=>({team:a.team,x:a.position.x,z:a.position.z}))});if(this.history.length>64)this.history.shift();}
  const policy=BOT_POLICIES[this.difficulty];if(match.tick%policy.reactionTicks!==0)return;
  const observed=[...this.history].reverse().find(s=>s.tick<=match.tick-policy.reactionTicks)??this.history[0];if(!observed)return;
  const previous=[...this.history].reverse().find(s=>s.tick<=observed.tick-3)??observed;
  const dt=Math.max(1,observed.tick-previous.tick)/60,ball=observed.ball;
  const vx=(ball.x-previous.ball.x)/dt,vy=(ball.y-previous.ball.y)/dt,vz=(ball.z-previous.ball.z)/dt;
  const d=vy*vy+2*9.81*(ball.y-1.7),flight=d>0?Math.max(0,Math.min(2.5,(vy+Math.sqrt(d))/9.81)):0;
  const error=noise(this.seed+(match.state.score.A+match.state.score.B+1)*109)*policy.error;
  const target={x:ball.x+vx*flight+error,z:ball.z+vz*flight+error};
  const bots=new Set(match.room.members.filter(m=>m.controller==="bot").map(m=>m.participantId));
  for(const team of ['A','B']as const){
   const eligible=match.athletes.filter(a=>a.team===team&&a.id!==observed.last&&(bots.has(a.id)||Math.hypot(match.pending.get(a.id)?.moveX??0,match.pending.get(a.id)?.moveZ??0)>.1||match.tick-(match.actionReceivedTick[a.id]??-1000)<12));
   const responsible=eligible.reduce<typeof eligible[number]|undefined>((best,a)=>!best||Math.hypot(a.position.x-target.x,a.position.z-target.z)<Math.hypot(best.position.x-target.x,best.position.z-target.z)?a:best,undefined);
   for(const a of match.athletes.filter(a=>a.team===team&&bots.has(a.id))){
    const direction=team==='A'?1:-1,actions:InputPayload['actions'][number][]=[];let x=a.slot?2:-2,z=-direction*6,state:BotState='position';let aim:{x:number;z:number}|undefined;
    if(match.state.phase==='serving'&&team===match.state.servingSide&&a.slot===match.state.servingSlot){x=a.position.x;z=-direction*6;state='serve';if(a.position.z*direction<=-5)actions.push('serve');}
    else if(match.state.phase==='rally'&&observed.phase==='rally'&&observed.serveSide!==team&&(target.z<0?'A':'B')===team&&responsible?.id===a.id){x=target.x;z=target.z;state=observed.side===team?(observed.touches>=2?'attack':'set'):'receive';actions.push(state);
     if(Math.abs(a.position.z)<1&&ball.y>2.5&&observed.side!==team){actions.length=0;actions.push('jump','receive');state='block';}
    }
    if((state==='attack'||state==='serve')&&this.difficulty!=='easy'){
     const candidates=[{x:-1,z:0},{x:1,z:0},{x:0,z:-1},{x:0,z:1},{x:-.7,z:.7},{x:.7,z:.7}];
     const opponents=observed.athletes.filter(p=>p.team!==team);
     aim=candidates.reduce((best,c)=>{const score=(t:{x:number;z:number})=>Math.min(...opponents.map(p=>Math.hypot(p.x-t.x*3.5,p.z-direction*(5+t.z*2))));return !best||score(c)>score(best)?c:best;},undefined as {x:number;z:number}|undefined);
     if(state==='attack'&&Math.hypot(a.position.x-ball.x,a.position.z-ball.z)<2&&ball.y>1.5)actions.unshift('jump');
    }
    this.states.set(a.id,state);const dx=x-a.position.x,dz=z-a.position.z,length=Math.hypot(dx,dz);
    submit(a.id,{seq:(match.receivedSeq[a.id]??0)+1,moveX:length>.15?dx/Math.max(1,length):0,moveZ:length>.15?dz/Math.max(1,length):0,actions,...(aim?{aim}:{})});
   }
  }
 }
}
