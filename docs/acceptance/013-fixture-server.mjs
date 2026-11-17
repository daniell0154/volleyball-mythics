// Isolated UI acceptance server: no Supabase and no production auth changes.
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createTransport} from '../../apps/server/dist/network/server.js';
import {RoomApplication} from '../../apps/server/dist/rooms/application.js';
import {MatchRuntime} from '../../apps/server/dist/runtime/matches.js';
import {ReconnectController} from '../../apps/server/dist/reconnect/controller.js';
import {MatchResults} from '../../apps/server/dist/results/coordinator.js';
import {MatchLifecycle} from '../../apps/server/dist/lifecycle/matches.js';
const source=JSON.parse(await readFile(new URL('../../content/characters/initial.json',import.meta.url),'utf8'));
const catalog=[...source.map(c=>({...c,abilityName:c.abilityConfig.name})),...Array.from({length:3},(_,i)=>({
 id:'test-only-'+i,version:1,name:i===2?'Atleta de teste com um nome deliberadamente muito longo para validar a interface':'Atleta de teste '+(i+1),
 assetKey:'procedural:v1:male:'+(i+100),overall:75,attributes:{serve:75,receive:75,set:75,attack:75,block:75,speed:75,jump:75},abilityName:'Especial de teste',abilityConfig:{description:'Fixture de interface, sem publicação no catálogo real.'}
}))];
const runtime=new MatchRuntime((room,snapshot)=>app.broadcast(room,'snapshot',snapshot),Date.now,id=>catalog.find(c=>c.id===id)?.assetKey,id=>catalog.find(c=>c.id===id)?.attributes,id=>{const c=catalog.find(c=>c.id===id);return c?.abilityId?{id:c.abilityId,config:c.abilityConfig}:undefined;});
const reconnect=new ReconnectController(runtime,(room,type,payload)=>app.broadcast(room,type,payload));
const results=new MatchResults({persist:async()=>{}},(room,type,payload)=>app.broadcast(room,type,payload));
const app=new RoomApplication(catalog,{start:r=>runtime.start(r),input:(r,id,p)=>runtime.submit(r,id,p),suspend:r=>reconnect.disconnect(r),reconnect:r=>{reconnect.reconnect(r);results.restore(r);},abandon:(r,id)=>reconnect.abandon(r,id),rematch:(r,id)=>lifecycle.vote(r,id),remove:id=>lifecycle.close(id),finishedDisconnect:r=>lifecycle.disconnected(r)});
const lifecycle=new MatchLifecycle(app.rooms,runtime,results,reconnect,(room,type,payload)=>app.broadcast(room,type,payload),()=>true);
runtime.onEnded=match=>results.finish(match);runtime.onPoint=(r,s)=>app.broadcast(r,'point',s);runtime.onAction=(id,message)=>app.sendTo(id,'actionFeedback',{message});
const transport=createTransport({staticDirectory:fileURLToPath(new URL('../../apps/web/dist/',import.meta.url)),origins:['http://127.0.0.1:5178','http://localhost:5178'],verify:async token=>{if(!/^ui-test-[0-9a-f-]{36}$/.test(token))throw Error('fixture identity');return{userId:token,expiresAt:Date.now()+3600000};},onConnect:s=>app.connect(s),onDisconnect:s=>app.disconnect(s),onCommand:(s,m)=>app.command(s,m)});
transport.http.listen(3016,'127.0.0.1',()=>console.log('013 fixture WebSocket on 3016'));
const catalogServer=createServer((request,response)=>{response.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:5178');response.setHeader('Content-Type','application/json');response.end(JSON.stringify(catalog));});catalogServer.listen(3017,'127.0.0.1');
let previous=performance.now();const ticker=setInterval(()=>{const now=performance.now();reconnect.tick();lifecycle.tick();runtime.advance(Math.min(100,now-previous));void results.queue.tick();previous=now;},5);
const close=()=>{clearInterval(ticker);runtime.cancelForShutdown();catalogServer.close();void transport.close();};process.once('SIGINT',close);process.once('SIGTERM',close);
