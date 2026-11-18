import type {MatchSnapshot,Team} from "@volleyball-mythics/protocol";
import {phaseLabel} from "./matchGuidance.js";
export function MatchHud({snapshot,team,slot,characterName,roomLabel}:{snapshot:MatchSnapshot|null;team:Team;slot:number;characterName:string;roomLabel?:string}){
 return <header className="match-hud">
  <div className="match-identity"><strong>Você · {team}{slot+1}</strong><span>{characterName}</span></div>
  <div className="scoreboard">
    <span>A</span><strong aria-label="Placar">{snapshot ? snapshot.score.A+" × "+snapshot.score.B : "0 × 0"}</strong><span>B</span>
    <span className="match-phase" role="status">{phaseLabel[snapshot?.phase??""]??"Preparando quadra"}{snapshot?.secondsRemaining? " · "+Math.ceil(snapshot.secondsRemaining)+"s":""}</span>
  </div>
  <div className="match-meta"><span>{roomLabel}</span>{snapshot?.servingSide && <span>Sacador · {snapshot.servingSide}{(snapshot.servingSlot??0)+1}</span>}</div>
 </header>;
}
