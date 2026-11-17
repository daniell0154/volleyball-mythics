import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchGuidance} from '../.test-build/game/matchGuidance.js';
test('instructions follow authoritative phase and identify exact serving slot',()=>{
 const frame={phase:'serving',servingSide:'A',servingSlot:1};
 assert.match(matchGuidance(frame,'A',1),/É seu saque/);
 assert.match(matchGuidance(frame,'A',0),/Aguarde/);
 assert.match(matchGuidance({...frame,phase:'rally'},'A',0),/J recebe/);
 assert.match(matchGuidance({...frame,phase:'disconnectedSuspension'},'A',0),/suspensa/);
 assert.match(matchGuidance({...frame,phase:'finished'},'A',0),/revanche/);
 assert.match(matchGuidance(null,'A',0),/Aguardando/);
});
