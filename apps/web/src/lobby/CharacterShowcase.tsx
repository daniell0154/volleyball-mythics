import {lazy,Suspense} from "react";
import type {CatalogEntry,Team} from "@volleyball-mythics/protocol";
const Preview=lazy(()=>import("../scene/CharacterPreview.js").then(module=>({default:module.CharacterPreview})));
export const characterKey=(character:Pick<CatalogEntry,"id"|"version">)=>JSON.stringify([character.id,character.version]);
const attributes=[["serve","Saque"],["receive","Recepção"],["set","Levantamento"],["attack","Ataque"],["block","Bloqueio"],["speed","Velocidade"],["jump","Salto"]] as const;
export function CharacterShowcase({catalog,status,selectedKey,onSelect,onRetry,team="A"}:{
 catalog:readonly CatalogEntry[];status:"loading"|"ready"|"error";selectedKey:string;onSelect(character:CatalogEntry):void;onRetry():void;team?:Team;
}){
 const selected=catalog.find(c=>characterKey(c)===selectedKey)??catalog[0];
 return <section className="showcase panel" aria-label="Elenco e atleta em destaque">
  <div className="eyebrow">Conheça o elenco</div>
  {status==="loading"&&<p role="status">Carregando atletas…</p>}
  {status==="error"&&<div role="alert"><p>Não foi possível carregar o elenco.</p><button onClick={onRetry}>Tentar novamente</button></div>}
  {status==="ready"&&!selected&&<p role="status">Nenhum atleta disponível no momento. Tente novamente mais tarde.</p>}
  {selected&&<><div className="athlete-title"><div><h2>{selected.name}</h2><span className="muted">Atleta em destaque</span></div><div className="overall"><strong>{selected.overall??"—"}</strong><span>OVERALL</span></div></div>
   <div className="athlete-stage">{selected.assetKey?<Suspense fallback={<p role="status">Preparando modelo…</p>}><Preview assetKey={selected.assetKey} team={team}/></Suspense>:<p>Modelo indisponível. A ficha continua disponível.</p>}</div>
   <div className="attribute-grid">{attributes.map(([key,label])=><div className="attribute" key={key}><span>{label}</span><strong>{selected.attributes?.[key]??"—"}</strong><span className="attribute-bar" aria-hidden="true"><span style={{width:(selected.attributes?.[key]??0)+"%"}}/></span></div>)}</div>
   <div className="ability"><span className="eyebrow">Habilidade especial</span><h3>{selected.abilityName??"Não informada"}</h3>{typeof selected.abilityConfig?.description==="string"&&<p>{selected.abilityConfig.description}</p>}</div>
  </>}
  {catalog.length>0&&<div className="roster" role="group" aria-label="Escolher atleta em destaque">{catalog.map(character=><button key={characterKey(character)} aria-pressed={selected?characterKey(character)===characterKey(selected):false} onClick={()=>onSelect(character)}>{character.name}</button>)}</div>}
 </section>;
}
