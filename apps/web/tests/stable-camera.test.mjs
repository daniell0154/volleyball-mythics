import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Frustum,Matrix4,Vector3} from 'three';
import {createCamera,fitStableCamera} from '../.test-build/scene/camera.js';
test('stable view keeps both sides of the court in frame and aligns behind each team',()=>{
 for(const team of ['A','B']){
  const camera=createCamera();fitStableCamera(camera,team,1280,720);
  assert.equal(camera.position.x,0);assert.equal(Math.sign(camera.position.z),team==='A'?-1:1);
  const frustum=new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  for(const x of [-4.5,4.5])for(const z of [-9,9])assert.ok(frustum.containsPoint(new Vector3(x,0,z)));
 }
});
