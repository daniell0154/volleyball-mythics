// Local human playtest tool. Does not replace production Supabase authentication.
import {readFile} from 'node:fs/promises';
import {createTransport} from '../../apps/server/dist/network/server.js';
import {RoomApplication} from '../../apps/server/dist/rooms/application.js';
import {MatchRuntime} from '../../apps/server/dist/runtime/matches.js';
import {ReconnectController} from '../../apps/server/dist/reconnect/controller.js';
import {MatchResults} from '../../apps/server/dist/results/coordinator.js';
import {MatchLifecycle} from '../../apps/server/dist/lifecycle/matches.js';
const version=Number(process.argv[2]??3);
const catalog=JSON.parse(await readFile(new URL('../../content/characters/initial.json',import.meta.url),'utf8'));
const runtime=new MatchRuntime((room,snapshot)=>app.broadcast(room,'snapshot',snapshot),Date.now,
 id=>catalog.find(c=>c.id===id)?.assetKey,id=>catalog.find(c=>c.id===id)?.attributes,
 id=>{const c=catalog.find(c=>c.id===id);return c?{id:c.abilityId,config:c.abilityConfig}:undefined;},false,version);
const reconnect=new ReconnectController(runtime,(room,type,payload)=>app.broadcast(room,type,payload));
const results=new MatchResults({persist:async()=>{}},(room,type,payload)=>app.broadcast(room,type,payload)); // Deliberately no database.
const app=new RoomApplication(catalog,{
 start:room=>runtime.start(room),input:(room,id,input)=>runtime.submit(room,id,input),
 suspend:room=>reconnect.disconnect(room),reconnect:room=>reconnect.reconnect(room),
 abandon:(room,id)=>reconnect.abandon(room,id),rematch:(room,id)=>lifecycle.vote(room,id),
 remove:id=>lifecycle.close(id),finishedDisconnect:room=>lifecycle.disconnected(room),
});
const lifecycle=new MatchLifecycle(app.rooms,runtime,results,reconnect,(room,type,payload)=>app.broadcast(room,type,payload),()=>true);
runtime.onEnded=match=>results.finish(match);
runtime.onRallyMeasured=(summary,room)=>app.broadcast(room,'rallyMeasurement',summary);
runtime.onPoint=(room,snapshot)=>app.broadcast(room,'point',snapshot);
runtime.onAction=(id,message)=>app.sendTo(id,'actionFeedback',{message});
const transport=createTransport({origins:(process.env.PLAYTEST_ORIGINS??'http://127.0.0.1:5176,http://localhost:5176').split(','),
 verify:async token=>{if(!/^playtest-[0-9a-f-]{36}$/.test(token))throw Error('invalid fixture session');return{userId:token,expiresAt:Date.now()+3600000};},
 onConnect:s=>app.connect(s),onDisconnect:s=>app.disconnect(s),onCommand:(s,m)=>app.command(s,m)});
transport.http.listen(3010,process.env.PLAYTEST_HOST??'127.0.0.1',()=>console.log('Playtest: porta 3010; interface Vite /docs/benchmarks/playtest/ — perfil '+version+' — sem banco'));
let previous=performance.now();const ticker=setInterval(()=>{const now=performance.now();reconnect.tick();lifecycle.tick();runtime.advance(Math.min(100,now-previous));void results.queue.tick();previous=now;},5);
const close=()=>{clearInterval(ticker);runtime.cancelForShutdown();void transport.close();};
process.once('SIGINT',close);process.once('SIGTERM',close);
