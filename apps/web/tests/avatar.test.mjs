import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Mesh } from 'three';
import { appearance, createAvatar, disposeAvatar } from '../.test-build/scene/avatar.js';
test('seeded looks are stable, gender explicit and both owner characters distinct',()=>{
  const samuel='procedural:v1:male:2626328580', caio='procedural:v1:male:2016838844';
  assert.deepEqual(appearance(samuel),appearance(samuel));assert.notDeepEqual(appearance(samuel),appearance(caio));
  assert.equal(appearance(samuel).gender,'male');assert.equal(appearance('procedural:v1:female:42').gender,'female');
  assert.throws(()=>appearance('https://untrusted.test/model.glb'));assert.throws(()=>appearance('procedural:v1:male:9999999999'));
});
test('procedural model stands on the ground and all GPU resources are released',()=>{
  const model=createAvatar('procedural:v1:male:2626328580','A');const bounds=new Box3().setFromObject(model);
  assert.ok(Math.abs(bounds.min.y)<1e-6);assert.ok(bounds.max.y>1.7&&bounds.max.y<2.3);
  let meshes=0,geometries=0,materials=0;model.traverse(o=>{if(o instanceof Mesh){meshes++;o.geometry.addEventListener('dispose',()=>geometries++);o.material.addEventListener('dispose',()=>materials++);}});
  disposeAvatar(model);assert.ok(meshes>10);assert.equal(geometries,meshes);assert.equal(materials,meshes);
});
