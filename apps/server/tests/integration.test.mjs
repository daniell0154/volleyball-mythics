import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { WebSocket } from 'ws';
import { createTransport } from '../dist/network/server.js';
import { RoomApplication } from '../dist/rooms/application.js';
import { MatchRuntime } from '../dist/runtime/matches.js';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(condition) { for(let i=0;i<200;i++){if(condition())return;await sleep(5);}throw Error('event timeout'); }
test('real sockets create/join/select/ready/start and receive authorized snapshots',async t=>{
  const runtime=new MatchRuntime((room,snapshot)=>app.broadcast(room,'snapshot',snapshot));
  const app=new RoomApplication([{id:'test-only',version:1,name:'Test fixture'}],{start:r=>runtime.start(r),input:(r,id,p)=>runtime.submit(r,id,p),suspend:r=>runtime.suspend(r),remove:id=>runtime.remove(id)});
  const server=createTransport({origins:['http://localhost:5173'],verify:async token=>({userId:token,expiresAt:Date.now()+60000}),onConnect:s=>app.connect(s),onDisconnect:s=>app.disconnect(s),onCommand:(s,m)=>app.command(s,m)});
  server.http.listen(0,'127.0.0.1');await once(server.http,'listening');t.after(()=>server.close());
  const client=async id=>{
    const socket=new WebSocket(`ws://127.0.0.1:${server.http.address().port}/socket`,{origin:'http://localhost:5173'});
    const messages=[];socket.on('message',data=>messages.push(JSON.parse(data)));await once(socket,'open');let seq=0;
    const request=async(type,payload={})=>{
      const requestId=`${id}-${++seq}`;socket.send(JSON.stringify({protocolVersion:1,type,requestId,payload}));
      await waitFor(()=>messages.some(m=>['ack','error'].includes(m.type)&&m.payload.requestId===requestId));
      return messages.find(m=>['ack','error'].includes(m.type)&&m.payload.requestId===requestId);
    };
    await request('auth',{accessToken:id});return {socket,messages,request};
  };
  const a=await client('a'),b=await client('b'),c=await client('c'),d=await client('d'),outsider=await client('outsider');
  assert.equal((await a.request('createRoom',{mode:'1v1'})).payload.code,'mode_unavailable');
  assert.equal(app.rooms.all().length,0);
  await a.request('createRoom',{mode:'2v2'});const room=app.rooms.roomFor('a');
  assert.equal((await b.request('joinRoom',{code:room.code})).type,'ack');
  for(const joined of [c,d])assert.equal((await joined.request('joinRoom',{code:room.code})).type,'ack');
  assert.equal((await outsider.request('joinRoom',{code:room.code})).payload.code,'room_full');
  for(const client of [a,b,c,d])await client.request('selectCharacter',{characterId:'test-only',version:1});
  for(const client of [a,b,c,d])await client.request('ready',{ready:true});
  assert.equal((await b.request('start')).payload.code,'forbidden');assert.equal((await a.request('start')).type,'ack');
  runtime.advance(3000);await waitFor(()=>a.messages.filter(m=>m.type==='snapshot').length===61&&b.messages.filter(m=>m.type==='snapshot').length===61);
  assert.equal(outsider.messages.filter(m=>m.type==='snapshot').length,0);
  await a.request('input',{seq:2,moveX:1,moveZ:0,actions:[]});await a.request('input',{seq:1,moveX:-1,moveZ:0,actions:[]});runtime.advance(50);
  await waitFor(()=>a.messages.some(m=>m.type==='snapshot'&&m.payload.lastProcessedSeq.a===2));
  const snapshot=a.messages.filter(m=>m.type==='snapshot').at(-1).payload;
  assert.ok(snapshot.athletes.find(p=>p.id==='a').position.x>-2);assert.equal(snapshot.athletes.find(p=>p.id==='b').position.x,2);
  await a.request('input',{seq:3,moveX:0,moveZ:0,actions:['serve']});runtime.advance(50);
  await waitFor(()=>b.messages.some(m=>m.type==='snapshot'&&m.payload.phase==='rally'));
  b.socket.close();await waitFor(()=>room.status==='suspended'&&a.messages.some(m=>m.type==='snapshot'&&m.payload.phase==='disconnectedSuspension'));
  assert.equal(a.messages.some(m=>m.type==='snapshot'&&m.payload.phase==='disconnectedSuspension'),true);
});
