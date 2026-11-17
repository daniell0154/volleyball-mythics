import {RoomRegistry} from '../../apps/server/dist/rooms/registry.js';
export function botRoom(index=0,difficulty='normal'){
 const registry=new RoomRegistry(),room=registry.create('fixture-human-'+index,'2v2');Object.assign(room,{matchKind:'vsBots',humanSlots:1,difficulty,botSeed:123+index,botPolicyVersion:1});room.members[0].character={id:'fixture',version:1};
 for(const [i,team,slot]of [[1,'A',1],[2,'B',0],[3,'B',1]])room.members.push({controller:'bot',participantId:'bot:00000000-0000-4000-8000-'+String(index*3+i).padStart(12,'0'),team,slot,character:{id:'fixture',version:1},ready:true,connected:true});return room;
}
