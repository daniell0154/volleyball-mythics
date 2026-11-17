import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lobbyGuidance,inviteUrl,commandMessage} from '../.test-build/lobby/guidance.js';
const member=(id,slot,ready=true)=>({userId:id,team:slot?'B':'A',slot:0,connected:true,ready,character:{id:'same-character',version:1}});
test('guidance explains incomplete/selection/readiness and accepts repeated characters',()=>{
 const room={mode:'1v1',members:[member('a',0)]};
 assert.equal(lobbyGuidance(room).canStart,false);assert.match(lobbyGuidance(room).message,/Falta 1/);
 room.members.push(member('b',1,false));assert.match(lobbyGuidance(room).message,/Pronto/);
 room.members[1].ready=true;assert.equal(lobbyGuidance(room).canStart,true);
 room.members[1].character=null;assert.match(lobbyGuidance(room).message,/escolher um atleta/);
});
test('invite retains route but never carries existing query/hash data',()=>{
 assert.equal(inviteUrl('ABCDEF','https://game.test/play?unrelated=value#fragment'),'https://game.test/play?room=ABCDEF');
 assert.match(commandMessage('room_full'),/cheia/);
 assert.match(commandMessage('mode_unavailable'),/1v1.*Atualize.*2v2/);
 assert.ok(!commandMessage('internal_debug_error').includes('internal_debug_error'));
});
