import React, {useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import type {RoomState,MatchSnapshot} from "@volleyball-mythics/protocol";
import {RoomConnection} from "../../../apps/web/src/network/connection.js";
import {OnlineMatch} from "../../../apps/web/src/game/OnlineMatch.js";

function Playtest(){
 const connection=useRef<RoomConnection|null>(null);
 const [userId,setUserId]=useState(""),[room,setRoom]=useState<RoomState|null>(null),[snapshot,setSnapshot]=useState<MatchSnapshot|null>(null);
 const [code,setCode]=useState(""),[feedback,setFeedback]=useState(""),[error,setError]=useState(""),[measurements,setMeasurements]=useState<unknown[]>([]);
 const [skill,setSkill]=useState(""),[opinion,setOpinion]=useState("");
 useEffect(()=>{
  const key="volley-playtest-id";let id=sessionStorage.getItem(key);if(!id){const hex=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,"0")).join("");id="playtest-"+[hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join("-");sessionStorage.setItem(key,id);}
  const client=new RoomConnection("ws://"+location.hostname+":3010/socket",(type,payload)=>{
   if(type==="roomState")setRoom(payload as RoomState|null);
   if(type==="snapshot")setSnapshot(payload as MatchSnapshot);
   if(type==="actionFeedback")setFeedback((payload as {message:string}).message);
   if(type==="rallyMeasurement")setMeasurements(rows=>[...rows,payload].slice(-60));
   if(type==="disconnected")setError("Conexão encerrada. Recarregue para reconectar.");
  });connection.current=client;client.authenticate(id).then(result=>setUserId(result.userId)).catch(e=>setError(String(e)));
  return()=>client.close();
 },[]);
 const request=(type:Parameters<RoomConnection["request"]>[0],payload:unknown={})=>{
  setError("");void connection.current?.request(type,payload).catch(e=>setError(e instanceof Error&&e.message==="invalid_state"?"Todos precisam entrar, escolher personagem e marcar Pronto antes de iniciar.":String(e)));
 };
 const own=room?.members.find(member=>member.userId===userId);
 const required=room?.mode==="2v2"?4:2;
 const canStart=room?.status==="lobby"&&room.members.length===required&&room.members.every(member=>member.connected&&member.ready&&member.character);
 const download=()=>{const report={participantType:"human self-report",skill,opinion,timestamp:new Date().toISOString(),userAgent:navigator.userAgent,measurements};const link=document.createElement("a"),url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:"application/json"}));link.href=url;link.download="010-playtest-human.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <main style={{padding:20}}>
  <h1>010 · Playtest local</h1><p>Partida entre pessoas com controles reais. Resultados ficam nesta sessão para exportar, sem Supabase ou salvamento no banco.</p>
  <p>{userId?"Conectado":"Conectando…"} · {room?"Sala "+room.code+" · "+room.mode:"Crie ou entre em uma sala"} · Rallies coletados: {measurements.length}/40</p>
  {!room&&<div><button disabled={!userId} onClick={()=>request("createRoom",{mode:"1v1"})}>Criar 1v1</button> <button disabled={!userId} onClick={()=>request("createRoom",{mode:"2v2"})}>Criar 2v2</button> <input aria-label="Código da sala" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/><button onClick={()=>request("joinRoom",{code})}>Entrar</button></div>}
  {room?.status==="lobby"&&<div><p>{room.members.map(member=>member.team+(member.slot+1)+" "+(member.character?.id??"escolhendo")+(member.ready?" pronto":" não pronto")).join(" · ")}</p>
   <p role="status">{room.members.length<required?"Aguardando "+(required-room.members.length)+" jogador(es). Abra outra sessão e entre pelo código "+room.code+".":canStart?"Todos prontos. O criador pode iniciar.":"Todos devem escolher personagem e marcar Pronto. Trocar personagem redefine a prontidão da sala."}</p>
   <button onClick={()=>request("selectCharacter",{characterId:"samuel",version:1})}>Escolher Samuel</button> <button onClick={()=>request("selectCharacter",{characterId:"caio",version:1})}>Escolher Caio</button> <button disabled={!own?.character} onClick={()=>request("ready",{ready:!own?.ready})}>Pronto</button> <button disabled={room.ownerId!==userId||!canStart} onClick={()=>request("start")}>Iniciar partida</button></div>}
  {room?.status==="finished"&&<div><p>Fim da partida. Todos devem votar para revanche; use “Sair” para trocar de modo.</p><button onClick={()=>request("rematchVote")}>Revanche</button></div>}
  {room&&<button onClick={()=>{request("leave");setSnapshot(null);}}>Sair da sala</button>}
  {snapshot&&own&&connection.current&&<OnlineMatch snapshot={snapshot} connection={connection.current} userId={userId} team={own.team} slot={own.slot} feedback={feedback} abilityAvailable={own.character?.id==="caio"||room?.mode==="2v2"}/>}
  <section><h2>Exportar o playtest</h2><p>Acumule pelo menos 20 rallies em 1v1 e 20 em 2v2. Não recarregue a aba antes de exportar.</p>
   <label>Experiência dos participantes <input value={skill} onChange={e=>setSkill(e.target.value)} placeholder="Ex.: dois jogadores familiarizados"/></label><br/>
   <label>Diversão e previsibilidade <input value={opinion} onChange={e=>setOpinion(e.target.value)} placeholder="Como sentiu o ritmo, alcance e tempo de reação?"/></label> <button onClick={download}>Exportar métricas</button>
  </section>{error&&<p role="alert">{error}</p>}
 </main>;
}
createRoot(document.getElementById("root")!).render(<Playtest/>);
