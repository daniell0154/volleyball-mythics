import {test} from 'node:test';import assert from 'node:assert/strict';import {KeyboardInput} from '../.test-build/input/keyboard.js';
test('candidate keyboard and cursor aim normalize, keep WASD and clear on blur',()=>{
 const input=new KeyboardInput();assert.equal(input.sample('rally').aim,undefined);assert.equal(input.press('ArrowUp'),false);input.enableAim(true);input.press('ArrowUp');input.press('ArrowRight');input.press('KeyW');const p=input.sample('rally');assert.ok(Math.abs(Math.hypot(p.aim.x,p.aim.z)-1)<1e-9);assert.equal(p.moveZ,-1);
 input.clear();input.setCursorAim(2,-2);assert.ok(Math.abs(Math.hypot(...Object.values(input.sample('rally').aim))-1)<1e-9);input.press('KeyC');assert.deepEqual(input.sample('rally').aim,{x:0,z:0});input.clear();input.enableAim(false);assert.equal(input.sample('rally').aim,undefined);
});
