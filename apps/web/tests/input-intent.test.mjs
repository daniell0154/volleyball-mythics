import {test} from 'node:test';
import assert from 'node:assert/strict';
import {KeyboardInput} from '../.test-build/input/keyboard.js';
import {inputIntent} from '../.test-build/game/inputIntent.js';
test('keyboard intent occurs before sampling, once per press and never asserts a hit',()=>{
 const input=new KeyboardInput(),messages=[];input.onIntent=code=>messages.push(inputIntent(code,'rally'));
 input.press('KeyL');assert.match(messages[0],/solicitado.*aguardando/);
 input.press('KeyL',true);assert.equal(messages.length,1);
 assert.deepEqual(input.sample('rally').actions,['attack']);assert.deepEqual(input.sample('rally').actions,[]);
 assert.equal(inputIntent('KeyW','rally'),null);assert.equal(inputIntent('KeyL','point'),null);
});
