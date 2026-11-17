import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAbilityDefinition } from '../dist/index.js';

const rant={trigger:'manual',validPhases:['rally'],target:'teammate',affectedAttributes:['speed','receive'],multiplier:.85,durationSeconds:5,cooldownSeconds:20,stackable:false};

test('ability configs only select bounded, reviewed server handlers',()=>{
  assert.equal(validateAbilityDefinition('teammate_rant',rant).durationSeconds,5);
  assert.throws(()=>validateAbilityDefinition('teammate_rant',{...rant,multiplier:1.5}));
  assert.throws(()=>validateAbilityDefinition('teammate_rant',{...rant,validPhases:['serving']}));
  assert.throws(()=>validateAbilityDefinition('teammate_rant',{...rant,target:'opponent_team'}));
  assert.throws(()=>validateAbilityDefinition('teammate_rant',{...rant,durationSeconds:31}));
  assert.throws(()=>validateAbilityDefinition('teammate_rant',{...rant,cooldownSeconds:0}));
  const fixture={trigger:'manual',validPhases:['rally'],target:'self',attribute:'speed',multiplier:1.2,durationSeconds:4,cooldownSeconds:10};
  assert.throws(()=>validateAbilityDefinition('speed_boost_fixture',fixture));
  assert.equal(validateAbilityDefinition('speed_boost_fixture',fixture,true).multiplier,1.2);
});
