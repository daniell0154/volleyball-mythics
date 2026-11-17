import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AvatarAnimator} from '../.test-build/scene/animateAvatar.js';
import {ACTION_POSES} from '../.test-build/scene/animateAvatar.js';
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

test('accepted gestures contact on their server tick and repeated history never restarts recovery',()=>{
 for(const kind of Object.keys(ACTION_POSES)){
  const model=createAthleticAvatar(key,'A'),animator=new AvatarAnimator(model);
  const athlete={id:'a',team:'A',position:{x:0,y:0,z:0}};
  const action={id:1,actorId:'a',kind,tick:30,facing:1};
  animator.update({tick:29,phase:'rally'},athlete);
  const frame={tick:30,phase:'rally',visualActions:[action]};
  animator.update(frame,athlete);
  assert.equal(model.getObjectByName('rightShoulder').rotation.x,ACTION_POSES[kind].joints.rightShoulder);
  animator.update({...frame,tick:42},athlete);
  const recovered=model.getObjectByName('rightShoulder').rotation.x;
  animator.update({...frame,tick:42},athlete);
  assert.equal(model.getObjectByName('rightShoulder').rotation.x,recovered);
  animator.update({...frame,tick:44},athlete);
  const restored=createAthleticAvatar(key,'A'),fresh=new AvatarAnimator(restored);
  fresh.update({...frame,tick:44},athlete);
  assert.equal(restored.getObjectByName('rightShoulder').rotation.x,model.getObjectByName('rightShoulder').rotation.x);
  disposeAvatar(model);disposeAvatar(restored);
 }
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
