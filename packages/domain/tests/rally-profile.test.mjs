import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rallyProfile,actionRange,rallyVelocity} from '../dist/index.js';
const attrs={serve:75,receive:75,set:75,attack:75,block:75,speed:75,jump:75};
test('rally profiles are immutable, legacy velocity is exact and unknown versions fail',()=>{
 assert.ok(Object.isFrozen(rallyProfile(3)));
 assert.throws(()=>rallyProfile(999));
 assert.deepEqual(rallyVelocity(rallyProfile(1),'serve',{x:0,y:1.25,z:-6},{x:0,y:0,z:-6},1,attrs),{x:-0,y:7.5,z:8.25});
});
test('targeted arc lands inside court and attribute effects remain monotonic',()=>{
 const profile=rallyProfile(3),position={x:0,y:1.25,z:-6},athlete={x:0,y:0,z:-6};
 const low=rallyVelocity(profile,'serve',position,athlete,1,{...attrs,serve:1});
 const high=rallyVelocity(profile,'serve',position,athlete,1,{...attrs,serve:100});
 assert.ok(high.z>low.z);
 const flight=10/high.z;
 assert.ok(Math.abs(position.y+high.y*flight-.5*9.81*flight**2-.11)<1e-9);
 assert.ok(actionRange(profile,100)>actionRange(profile,1));
 const attackLow=rallyVelocity(profile,'attack',position,athlete,1,{...attrs,attack:1});
 const attackHigh=rallyVelocity(profile,'attack',position,athlete,1,{...attrs,attack:100});
 assert.ok(attackHigh.z>attackLow.z);
});
