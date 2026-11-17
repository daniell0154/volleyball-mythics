import type {RoomMember,RoomState} from "@volleyball-mythics/protocol";
export function participantId(member:RoomMember):string{return member.controller==="bot"?member.participantId:member.userId;}
export function humans(room:RoomState):Extract<RoomMember,{userId:string}>[]{return room.members.filter((m):m is Extract<RoomMember,{userId:string}>=>m.controller!=="bot");}
