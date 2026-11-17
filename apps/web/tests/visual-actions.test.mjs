import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateVisualActions} from '../.test-build/network/visualActions.js';
const event={id:1,actorId:'a',kind:'serve',tick:10,facing:0};
const frame={tick:10,athletes:[{id:'a'}]};
test('optional animation extension validates identity, bounded history and finite values',()=>{
 validateVisualActions(frame);
 validateVisualActions({...frame,visualActions:[event]});
 for(const invalid of [{...event,actorId:'intruder'},{...event,kind:'custom-script'},{...event,tick:11},{...event,facing:NaN},{...event,id:0}])
  assert.throws(()=>validateVisualActions({...frame,visualActions:[invalid]}));
 assert.throws(()=>validateVisualActions({...frame,visualActions:[event,event]}));
 assert.throws(()=>validateVisualActions({...frame,visualActions:Array(33).fill(event)}));
});
