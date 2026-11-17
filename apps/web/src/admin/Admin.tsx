import {lazy,Suspense,useEffect,useState} from "react";
import {attributeKeys,createAdminServices,type AdminServices,type Draft,type RosterPayload} from "./services.js";
const Preview=lazy(()=>import("../scene/CharacterPreview.js").then(m=>({default:m.CharacterPreview})));
const labels={serve:"Saque",receive:"Recepção",set:"Levantamento",attack:"Ataque",block:"Bloqueio",speed:"Velocidade",jump:"Salto"};
const blank=():RosterPayload=>({name:"",attributes:{serve:50,receive:50,set:50,attack:50,block:50,speed:50,jump:50},abilityId:"teammate_rant",assetKey:"procedural:athletic-v2:male:1"});
export function Admin({services}:{services?:AdminServices}){
 const [backend]=useState(()=>{try{return services??createAdminServices();}catch{return null;}});
 const [authorized,setAuthorized]=useState(false),[checking,setChecking]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[page,setPage]=useState(0);
 const [items,setItems]=useState<Awaited<ReturnType<AdminServices["list"]>>>({drafts:[],published:[]});
 const [draft,setDraft]=useState<Draft>({id:"",revision:0,payload:blank()}),[dirty,setDirty]=useState(false);
 const [email,setEmail]=useState(""),[password,setPassword]=useState("");
 const report=(e:unknown)=>{const code=typeof e==="object"&&e!==null&&"code"in e?String(e.code):"";setError(code==="40001"?"Este rascunho mudou. Recarregue a lista e abra a versão atual antes de tentar novamente.":"Não foi possível concluir. Confira sua permissão e conexão e tente novamente.");};
 const load=async()=>{if(!backend)return;setItems(await backend.list(page));};
 useEffect(()=>{let active=true;if(!backend){setChecking(false);return;}void backend.authorized().then(value=>{if(active)setAuthorized(value);}).catch(report).finally(()=>{if(active)setChecking(false);});return()=>{active=false;};},[backend]);
 useEffect(()=>{if(authorized)void load().catch(report);},[authorized,page]);
 const run=async(task:()=>Promise<void>)=>{if(busy)return;setBusy(true);setError("");setNotice("");try{await task();}catch(e){report(e);}finally{setBusy(false);}};
 const edit=(payload:RosterPayload)=>{setDraft(d=>({...d,payload}));setDirty(true);};
 const open=(d:Draft)=>{if(dirty&&!confirm("Descartar as alterações não salvas?"))return;setDraft(structuredClone(d));setDirty(false);setError("");setNotice("");};
 const validAsset=/^procedural:athletic-v2:(male|female):([0-9]{1,10})$/.test(draft.payload.assetKey)&&Number(draft.payload.assetKey.split(":")[3])<=4294967295;
 if(checking)return <main className="app-shell"><p role="status">Verificando acesso administrativo…</p></main>;
 return <main className="app-shell"><header className="button-row"><h1>Admin do elenco</h1><a href="/">Voltar ao jogo</a></header>
 {!backend&&<p role="alert" className="notice error">Configure a URL e a chave pública do Supabase para acessar o admin.</p>}
 {error&&<p role="alert" className="notice error">{error}</p>}{notice&&<p role="status" className="notice">{notice}</p>}
 {!authorized?<form className="panel entry-form" onSubmit={e=>{e.preventDefault();void run(async()=>{if(!backend)throw Error();await backend.login(email,password);setPassword("");setAuthorized(true);});}}>
  <h2>Acesso do administrador</h2><p>Use a conta autorizada pelo proprietário. A sessão do jogo fica separada.</p>
  <label>Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
  <label>Senha<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
  <button className="primary" disabled={busy||!backend}>Entrar no admin</button>
 </form>:<>
 <div className="button-row"><button disabled={busy} onClick={()=>open({id:crypto.randomUUID(),revision:0,payload:blank()})}>Novo personagem</button><button disabled={busy} onClick={()=>void run(load)}>Recarregar lista</button><button disabled={busy} onClick={()=>void run(async()=>{await backend!.logout();setAuthorized(false);setItems({drafts:[],published:[]});setDraft({id:"",revision:0,payload:blank()});setDirty(false);})}>Sair do admin</button></div>
 <div className="room-grid"><section className="panel"><h2>Rascunhos</h2>{items.drafts.length===0&&<p>Nenhum rascunho nesta página.</p>}
  {items.drafts.map(d=><p key={d.id}><button disabled={busy} onClick={()=>open(d)}>{d.payload.name} · rascunho {d.revision}</button></p>)}
  <h2>Revisões publicadas</h2>{items.published.map(c=><p key={c.id+":"+c.version}><button disabled={busy} onClick={()=>{const existing=items.drafts.find(d=>d.id===c.id);open(existing??{id:c.id,revision:0,payload:{...c.payload,assetKey:c.payload.assetKey.replace("procedural:v1:","procedural:athletic-v2:")}});}}>{c.name} · v{c.version} · {c.enabled?"ativo":"inativo"}</button></p>)}
  <div className="button-row"><button disabled={page===0||busy} onClick={()=>setPage(p=>p-1)}>Página anterior</button><span>Página {page+1}</span><button disabled={busy||(items.drafts.length<50&&items.published.length<50)} onClick={()=>setPage(p=>p+1)}>Próxima página</button></div>
 </section>
 <section className="panel"><h2>{draft.payload.name||"Novo personagem"}</h2>{!draft.id?<p>Abra um rascunho ou crie um novo personagem.</p>:<form className="entry-form" onSubmit={e=>{e.preventDefault();void run(async()=>{const saved=await backend!.write("save",draft.id,draft.revision,draft.payload);setDraft(saved);setDirty(false);await load();setNotice("Rascunho salvo. Publique para disponibilizar no jogo.");});}}>
  <fieldset disabled={busy}><legend>Ficha do personagem · revisão {draft.revision}</legend>
  <label>Nome<input required maxLength={64} value={draft.payload.name} onChange={e=>edit({...draft.payload,name:e.target.value})}/></label>
  <div className="attribute-grid">{attributeKeys.map(key=><label key={key}>{labels[key]}<input required type="number" min={1} max={100} step={1} value={Number.isNaN(draft.payload.attributes[key])?"":draft.payload.attributes[key]} onChange={e=>edit({...draft.payload,attributes:{...draft.payload.attributes,[key]:e.target.valueAsNumber}})}/></label>)}</div>
  <p>Overall: <output>{Math.round(attributeKeys.reduce((sum,k)=>sum+draft.payload.attributes[k],0)/7)||"—"}</output></p>
  <label>Habilidade<select value={draft.payload.abilityId} onChange={e=>edit({...draft.payload,abilityId:e.target.value})}><option value="teammate_rant">Bronca no Parceiro</option><option value="free_point_out">Foi Sem Querer</option></select></label>
  <p className="helper">As habilidades usam as configurações já aprovadas. Criar novos poderes exige implementação própria.</p>
  <label>Modelo<select aria-label="Modelo" value={draft.payload.assetKey.split(":")[2]} onChange={e=>edit({...draft.payload,assetKey:`procedural:athletic-v2:${e.target.value}:${draft.payload.assetKey.split(":")[3]}`})}><option value="male">Masculino</option><option value="female">Feminino</option></select></label>
  <label>Variação visual<input required type="number" min={0} max={4294967295} step={1} value={draft.payload.assetKey.split(":")[3]??""} onChange={e=>edit({...draft.payload,assetKey:`procedural:athletic-v2:${draft.payload.assetKey.split(":")[2]}:${e.target.value}`})}/></label><p className="helper">O mesmo número mantém a aparência do atleta nas próximas partidas.</p>
  {!validAsset&&<p className="notice error">Informe um visual permitido antes de salvar.</p>}
  <div className="athlete-stage">{validAsset&&<Suspense fallback={<p>Preparando preview…</p>}><Preview assetKey={draft.payload.assetKey} team="A"/></Suspense>}</div>
  <button className="primary" disabled={!validAsset}>Salvar rascunho</button>
  </fieldset>
  <div className="button-row"><button type="button" disabled={busy||dirty||draft.revision===0} onClick={()=>void run(async()=>{setDraft(await backend!.write("publish",draft.id,draft.revision));await load();setNotice("Nova revisão publicada. Disponível para novas seleções no jogo.");})}>Publicar revisão</button>
  <button type="button" disabled={busy||dirty||draft.revision===0} onClick={()=>{if(confirm("Desativar este personagem para novas partidas?"))void run(async()=>{setDraft(await backend!.write("disable",draft.id,draft.revision));await load();setNotice("Personagem desativado. Partidas em andamento preservadas.");});}}>Desativar personagem</button></div>
  {dirty&&<p className="helper">Salve as alterações antes de publicar ou desativar.</p>}
 </form>}</section></div></>}
 </main>;
}
