import type { Ref } from "react";
import type {MatchSnapshot,Team} from "@volleyball-mythics/protocol";
import {phaseLabel} from "./matchGuidance.js";
export function MatchHud({snapshot,team,slot,hudRef}:{snapshot:MatchSnapshot|null;team:Team;slot:number;hudRef:Ref<HTMLElement>}){
 return <header ref={hudRef} className="match-hud">
  <strong className="match-identity">Você · {team}{slot+1}</strong>
  <div className="scoreboard">
    <span>A</span><strong aria-label="Placar">{snapshot ? snapshot.score.A+" × "+snapshot.score.B : "0 × 0"}</strong><span>B</span>
    <span className="match-phase" role="status">{phaseLabel[snapshot?.phase??""]??"Preparando quadra"}{snapshot?.secondsRemaining? " · "+Math.ceil(snapshot.secondsRemaining)+"s":""}</span>
  </div>
 </header>;
}
