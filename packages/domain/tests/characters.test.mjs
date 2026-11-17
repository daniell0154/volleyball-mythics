import test from 'node:test';
import assert from 'node:assert/strict';
import { overallFromAttributes, validateCharacterRevision, VersionedCharacterCatalog } from '../dist/index.js';

const attributes={serve:88,receive:80,set:82,attack:90,block:83,speed:86,jump:86};
const samuel={id:'samuel',version:1,name:'Samuel',attributes,overall:85,assetKey:'procedural:v1:male:2626328580',abilityId:'teammate_rant',abilityConfig:{trigger:'manual',validPhases:['rally'],target:'teammate',affectedAttributes:['speed','receive'],multiplier:.85,durationSeconds:5,cooldownSeconds:20,stackable:false}};

test('character revisions validate exact rounded overall and keep published revisions immutable',()=>{
  assert.equal(overallFromAttributes(attributes),85);
  assert.equal(validateCharacterRevision(samuel).overall,85);
  const catalog=new VersionedCharacterCatalog();
  assert.equal(catalog.replaceEnabled([samuel])[0].version,1);
  assert.equal(catalog.get('samuel',1).assetKey,samuel.assetKey);
  catalog.replaceEnabled([]);
  assert.equal(catalog.get('samuel',1).version,1);
  assert.throws(()=>catalog.replaceEnabled([{...samuel,overall:84}]),/overall/);
  assert.throws(()=>catalog.replaceEnabled([{...samuel,attributes:{...attributes,speed:100}}]),/overall/);
  assert.throws(()=>catalog.replaceEnabled([{...samuel,attributes:{...attributes,serve:undefined,unknown:88}}]));
  assert.throws(()=>catalog.replaceEnabled([{...samuel,name:'Changed'}]),/immutable/);
});

