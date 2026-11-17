import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AvatarAnimator} from '../.test-build/scene/animateAvatar.js';
import {createAthleticAvatar} from '../.test-build/scene/athleticAvatar.js';
import {disposeAvatar} from '../.test-build/scene/avatar.js';
const key='procedural:v1:male:2626328580';
function simulate(fps){
 const model=createAthleticAvatar(key,'A'),animator=new AvatarAnimator(model);
 for(let step=0;step<=fps;step++){
  const t=step/fps,athlete={id:'a',team:'A',position:{x:t*3,y:0,z:0}};
  animator.update({tick:t*60,renderTick:t*60,phase:'rally'},athlete);
 }
 return {model,animator};
}
test('locomotion is time based at 30/60/120 FPS and never translates root',()=>{
 const poses=[30,60,120].map(fps=>simulate(fps));
 const hips=poses.map(({model})=>model.getObjectByName('leftHip').rotation.x);
 assert.ok(Math.max(...hips)-Math.min(...hips)<.13,hips.toString());
 for(const {model}of poses){assert.equal(model.position.length(),0);disposeAvatar(model);}
});
test('suspension freezes joints and resume keeps animation time without restarting',()=>{
 const {model,animator}=simulate(60),hip=model.getObjectByName('leftHip');
 const before=hip.rotation.x;
 const athlete={id:'a',team:'A',position:{x:3,y:0,z:0}};
 animator.update({tick:60,phase:'disconnectedSuspension'},athlete);
 animator.update({tick:60,phase:'rally'},athlete);
 assert.equal(hip.rotation.x,before);
 animator.update({tick:63,phase:'rally'}, {...athlete,position:{x:3,y:.3,z:0}});
 assert.notEqual(hip.rotation.x,before);disposeAvatar(model);
});
