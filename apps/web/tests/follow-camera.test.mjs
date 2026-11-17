import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCamera,followCamera} from '../.test-build/scene/camera.js';
test('third-person camera sits behind each side and follows player position',()=>{
 for(const team of ['A','B']){const camera=createCamera();const player={x:2,y:0,z:team==='A'?-5:5};followCamera(camera,player,team,1/60);
 assert.equal(camera.position.x,2);assert.equal(camera.fov,65);assert.ok(team==='A'?camera.position.z<player.z:camera.position.z>player.z);
 followCamera(camera,{...player,x:3},team,1/60);assert.ok(camera.position.x>2&&camera.position.x<3);}
});
