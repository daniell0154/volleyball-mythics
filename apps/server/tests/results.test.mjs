import {test} from 'node:test';import assert from 'node:assert/strict';import {ResultQueue} from '../dist/results/queue.js';
const payload={matchId:'test',mode:'1v1',score:{A:6,B:2},winner:'A',reason:'points',rulesVersion:1,startedAt:'2026-11-16T00:00:00Z',endedAt:'2026-11-16T00:01:00Z',players:[]};
test('transient DB failure retries identical payload and marks saved only after success',async()=>{
 let now=0,attempts=0;const states=[],sent=[];const queue=new ResultQueue({persist:async value=>{sent.push(value);if(++attempts<3)throw Error('db_down');}},(_id,state)=>states.push(state),()=>now);
 queue.enqueue(payload);payload.score.A=6;await queue.tick();assert.equal(queue.status('test'),'pending');now=1000;await queue.tick();now=3000;await queue.tick();assert.equal(queue.status('test'),'saved');assert.deepEqual(sent[0],sent[2]);assert.deepEqual(states,['pending','saved']);
});
test('DB down for 5min emits operational failure without fabricating saved result',async()=>{
 let now=0;const failed=[];const queue=new ResultQueue({persist:async()=>{throw Error('db_down');}},()=>{},()=>now,id=>failed.push(id));queue.enqueue(payload);await queue.tick();now=300000;await queue.tick();assert.equal(queue.status('test'),'failed');assert.deepEqual(failed,['test']);
});
test('released pending jobs finish retrying; conflicting payload is rejected',async()=>{
 let now=0,calls=0;const queue=new ResultQueue({persist:async()=>{if(!calls++)throw Error('retry');}},()=>{},()=>now);queue.enqueue(payload);assert.throws(()=>queue.enqueue({...payload,winner:'B'}));await queue.tick();queue.release('test');now=1000;await queue.tick();assert.equal(calls,2);assert.equal(queue.status('test'),undefined);
});
test('hung DB attempt is aborted and does not block retry deadline',async()=>{
 let now=0,aborted=false;const queue=new ResultQueue({persist:(_result,signal)=>new Promise(()=>{signal.addEventListener('abort',()=>{aborted=true;});})},()=>{},()=>now,()=>{},5);
 queue.enqueue(payload);await queue.tick();assert.equal(aborted,true);assert.equal(queue.status('test'),'pending');now=300000;await queue.tick();assert.equal(queue.status('test'),'failed');
});
