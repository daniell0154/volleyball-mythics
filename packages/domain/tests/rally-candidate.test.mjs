import {test} from 'node:test';import assert from 'node:assert/strict';
import {rallyVelocity,rallyProfile} from '../dist/index.js';
const attrs={serve:75,receive:75,set:75,attack:75,block:75,speed:75,jump:75};
test('candidate directions are bounded, legacy ignores extension and serve attributes remain monotonic',()=>{
 const ball={x:-2,y:1.25,z:-6},actor={...ball,y:0},profile=rallyProfile(4);
 const left=rallyVelocity(profile,'serve',ball,actor,1,attrs,undefined,{x:-1,z:0}),right=rallyVelocity(profile,'serve',ball,actor,1,attrs,undefined,{x:1,z:0});assert.ok(left.x<right.x);
 const flight=(5-ball.z)/right.z;assert.ok(Math.abs(ball.x+right.x*flight-3.5)<1e-8);assert.ok(Math.abs(ball.y+right.y*flight-4.905*flight**2-.11)<1e-8);
 assert.throws(()=>rallyVelocity(profile,'serve',ball,actor,1,attrs,undefined,{x:1,z:1}));
 assert.deepEqual(rallyVelocity(rallyProfile(3),'serve',ball,actor,1,attrs),rallyVelocity(rallyProfile(3),'serve',ball,actor,1,attrs,undefined,{x:1,z:0}));
 assert.ok(rallyVelocity(profile,'serve',ball,actor,1,{...attrs,serve:100}).z>rallyVelocity(profile,'serve',ball,actor,1,{...attrs,serve:1}).z);
});
test('candidate reception and set stay on own half; attack crosses to opponent',()=>{
 for(const sign of [1,-1]){const ball={x:0,y:1.5,z:-sign*5},actor={...ball,y:0},mate={x:2,y:0,z:-sign*6};
  for(const kind of ['receive','set','attack']){const v=rallyVelocity(rallyProfile(4),kind,ball,actor,sign,attrs,mate);const t=(v.y+Math.sqrt(v.y*v.y+2*9.81*(ball.y-.11)))/9.81;const z=ball.z+v.z*t;assert.equal(Math.sign(z),kind==='attack'?sign:-sign);}
 }
});
