import {useState} from "react";
import type {CatalogEntry,RoomState,ClientMessage} from "@volleyball-mythics/protocol";
import {CharacterShowcase,characterKey} from "./CharacterShowcase.js";
import {inviteUrl,lobbyGuidance} from "./guidance.js";
export function RoomLobby({room,userId,catalog,catalogStatus,onRetry,command,pending,error}:{
 room:RoomState;userId:string;catalog:CatalogEntry[];catalogStatus:"loading"|"ready"|"error";onRetry():void;
 command(type:ClientMessage["type"],payload?:unknown):Promise<boolean>;pending:string|null;error:{action:string;message:string}|null;
}){
 const own=room.members.find(member=>member.userId===userId),selected=catalog.find(c=>c.id===own?.character?.id&&c.version===own.character.version);
 const guidance=lobbyGuidance(room),[copyStatus,setCopyStatus]=useState("");
 const invite=inviteUrl(room.code,location.href),owner=room.ownerId===userId;
 const copy=async()=>{try{await navigator.clipboard.writeText(invite);setCopyStatus("Convite copiado.");}catch{setCopyStatus("Selecione o link abaixo para copiar manualmente.");}};
 return <div className="room-grid"><section className="panel room-panel" aria-label="Sala e participantes">
  <div className="eyebrow">{room.mode==="1v1"?"Duelo · 2 jogadores":"Duplas · 4 jogadores"}</div><h1 className="room-heading">Seu time<br/>começa aqui.</h1>
  {room.matchKind==="vsBots"&&<p className="notice">{room.humanSlots===1?"Solo: você e um parceiro bot":"Cooperativo: dois humanos"} contra dois bots · Dificuldade: {room.difficulty==="easy"?"Fácil":room.difficulty==="hard"?"Difícil":"Normal"}</p>}
  <div className="room-code"><span>Código da sala</span><strong>{room.code}</strong></div>
  <div className="button-row"><button onClick={copy}>Copiar convite</button><button disabled={Boolean(pending)} onClick={()=>void command("leave")}>Sair da sala</button></div>
  <label className="invite-field">Link de convite<input readOnly value={invite} onFocus={event=>event.currentTarget.select()}/></label>{copyStatus&&<p className="helper" role="status">{copyStatus}</p>}
  <div className="teams">{(["A","B"]as const).map(team=><section className="team-panel" key={team} aria-label={"Equipe "+team}><h2>Equipe {team}</h2>{(room.mode==="1v1"?[0]:[0,1]).map(slot=>{
   const member=room.members.find(m=>m.team===team&&m.slot===slot),character=catalog.find(c=>c.id===member?.character?.id&&c.version===member.character.version);
   return <div className="player-slot" key={slot}><span className="slot-number">{team}{slot+1}</span>{member?<div><strong>{member.controller==="bot"?"Bot "+team+(slot+1):member.userId===userId?"Você":"Jogador "+team+(slot+1)}{member.userId===room.ownerId?" · Criador":""}</strong><span>{character?.name??"Escolhendo atleta"}</span><small>{!member.connected?"○ Desconectado":member.ready?"✓ Pronto":"○ Aguardando"}</small></div>:<div><strong>Lugar livre</strong><span>Envie o convite</span></div>}</div>;
  })}</section>)}</div>
  <label>Seu lado e posição<select disabled={Boolean(pending)||room.matchKind==="vsBots"} value={own?own.team+":"+own.slot:""} onChange={event=>{const[team,slot]=event.target.value.split(":");void command("setTeam",{team,slot:Number(slot)});}}>
   {(["A","B"]as const).flatMap(team=>(room.mode==="1v1"?[0]:[0,1]).map(slot=><option key={team+slot} value={team+":"+slot} disabled={room.members.some(m=>m.userId!==userId&&m.team===team&&m.slot===slot)}>Equipe {team} · posição {slot+1}</option>))}
  </select></label>
  <p className="notice" role="status">{guidance.message}</p>
  <div className="button-row"><button disabled={!own?.character||Boolean(pending)} aria-pressed={Boolean(own?.ready)} onClick={()=>void command("ready",{ready:!own?.ready})}>{own?.ready?"Cancelar prontidão":"Pronto para jogar"}</button><button className="primary" disabled={!owner||!guidance.canStart||Boolean(pending)} onClick={()=>void command("start")}>{pending==="start"?"Iniciando…":"Iniciar partida"}</button></div>
  {!owner&&<p className="helper">O criador inicia quando todos estiverem prontos.</p>}
  {error&&<p className="notice error" role="alert">{error.message}</p>}
 </section><div><CharacterShowcase catalog={catalog} status={catalogStatus} selectedKey={selected?characterKey(selected):""} onSelect={character=>{if(!pending)void command("selectCharacter",{characterId:character.id,version:character.version});}} onRetry={onRetry} team={own?.team??"A"}/><p className="helper">Escolha seu atleta tocando no nome. Personagens podem se repetir entre jogadores.</p></div></div>;
}
