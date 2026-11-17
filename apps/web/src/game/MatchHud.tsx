import type {MatchSnapshot,Team} from "@volleyball-mythics/protocol";
import {matchGuidance,phaseLabel} from "./matchGuidance.js";
export function MatchHud({snapshot,team,slot,characterName}:{snapshot:MatchSnapshot|null;team:Team;slot:number;characterName:string}){
 return <header className="match-hud">
  <div className="scoreboard"><div><span className="team-tag">Equipe A</span><small>{team==="A"?"Sua equipe":"Adversários"}</small></div><div className="score-center"><span className="eyebrow">Primeiro a seis</span><strong aria-label="Placar">{snapshot? snapshot.score.A+" × "+snapshot.score.B:"0 × 0"}</strong><span role="status">{phaseLabel[snapshot?.phase??""]??"Preparando quadra"}{snapshot?.secondsRemaining? " · "+Math.ceil(snapshot.secondsRemaining)+"s":""}</span></div><div><span className="team-tag">Equipe B</span><small>{team==="B"?"Sua equipe":"Adversários"}</small></div></div>
  <div className="match-context"><span><b>Você · {team}{slot+1}</b> · {characterName}</span><span>Sacador: {snapshot?.servingSide??"A"}{(snapshot?.servingSlot??0)+1}</span></div>
  <p className="context-instruction">{matchGuidance(snapshot,team,slot)}</p>
 </header>;
}
