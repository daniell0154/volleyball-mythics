import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Mesh,Vector3} from 'three';
import {createAthleticAvatar} from '../.test-build/scene/athleticAvatar.js';
import {disposeAvatar} from '../.test-build/scene/avatar.js';

test('athletic rig keeps articulated limbs attached and feet at ground level',()=>{
 const model=createAthleticAvatar('procedural:v1:male:2626328580','A');
 const bounds=new Box3().setFromObject(model);
 assert.ok(Math.abs(bounds.min.y)<.01);
 assert.ok(bounds.max.y>1.7&&bounds.max.y<2.1);
 for(const side of ['left','right']) {
  const shoulder=model.getObjectByName(side+'Shoulder'),elbow=model.getObjectByName(side+'Elbow');
  assert.equal(elbow.parent,shoulder);
  shoulder.rotation.z=.8;elbow.rotation.x=-1.1;model.updateMatrixWorld(true);
  assert.ok(elbow.getWorldPosition(new Vector3()).distanceTo(shoulder.getWorldPosition(new Vector3()))<.3);
  for(const name of ['Wrist','Hip','Knee','Ankle'])assert.ok(model.getObjectByName(side+name));
 }
 const geometries=new Set(),materials=new Set();
 model.traverse(o=>{if(o instanceof Mesh){geometries.add(o.geometry);materials.add(o.material);}});
 let released=0;for(const resource of [...geometries,...materials]) resource.addEventListener('dispose',()=>released++);
 disposeAvatar(model);assert.equal(released,geometries.size+materials.size);
});
