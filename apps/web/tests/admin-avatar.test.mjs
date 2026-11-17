import test from 'node:test';
import assert from 'node:assert/strict';
import {createPresentationAvatar} from '../.test-build/scene/avatarManifest.js';
import {disposeAvatar} from '../.test-build/scene/avatar.js';
test('new admin visual keys resolve athletic avatars without editing the manifest',()=>{
 const a=createPresentationAvatar('procedural:athletic-v2:female:1234','A');
 const b=createPresentationAvatar('procedural:athletic-v2:female:1234','A');
 assert.equal(a.userData.modelVersion,'athletic-v2');assert.equal(a.userData.gender,'female');
 assert.equal(a.children.length,b.children.length);
 assert.throws(()=>createPresentationAvatar('procedural:athletic-v2:male:4294967296','A'));
 disposeAvatar(a);disposeAvatar(b);
});
