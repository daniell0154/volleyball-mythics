import { randomInt, randomUUID } from "node:crypto";
import type { MatchMode, RoomState, ServerErrorCode,BotDifficulty } from "@volleyball-mythics/protocol";
import {humans} from "./participants.js";
export class RoomError extends Error { constructor(public readonly code: ServerErrorCode) { super(code); } }
export class RoomRegistry {
  private rooms = new Map<string, RoomState>();
  private membership = new Map<string, string>();
  roomFor(userId: string): RoomState {
    const code = this.membership.get(userId), room = code ? this.rooms.get(code) : undefined;
    if (!room) throw new RoomError("room_not_found");
    return room;
  }
  all(): readonly RoomState[] { return [...this.rooms.values()]; }
  destroy(room: RoomState): void { for (const member of humans(room)) this.membership.delete(member.userId); this.rooms.delete(room.code); }
  create(userId: string, mode: MatchMode,bots?:{humanSlots:1|2;difficulty:BotDifficulty}): RoomState {
    if (this.membership.has(userId)) throw new RoomError("invalid_state");
    let code: string;
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    do { code = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join(""); } while (this.rooms.has(code));
    const room: RoomState = { roomId: randomUUID(), code, mode, ownerId: userId, status: "lobby", members: [] };
    this.rooms.set(code, room);
    this.add(room, userId);
    if(bots){Object.assign(room,{matchKind:"vsBots",humanSlots:bots.humanSlots,difficulty:bots.difficulty,botSeed:randomInt(4294967296),botPolicyVersion:1});
      for(const [team,slot] of [["A",1],["B",0],["B",1]] as const){if(team==="A"&&bots.humanSlots===2)continue;room.members.push({participantId:"bot:"+randomUUID(),controller:"bot",team,slot,character:null,ready:false,connected:true});}
    }else room.matchKind="humans";
    return room;
  }
  join(userId: string, code: string,acceptBots=false): RoomState {
    if (this.membership.has(userId)) throw new RoomError("invalid_state");
    const room = this.rooms.get(code);
    if (!room) throw new RoomError("room_not_found");
    if(room.matchKind==="vsBots"&&!acceptBots)throw new RoomError("client_update_required");
    if (room.status !== "lobby") throw new RoomError("invalid_state");
    this.add(room, userId); return room;
  }
  private add(room: RoomState, userId: string): void {
    const capacity = room.mode === "1v1" ? 1 : 2;
    for (const team of ["A", "B"] as const) for (const slot of [0, 1] as const) {
      if (slot >= capacity || room.members.some((member) => member.team === team && member.slot === slot)) continue;
      room.members.push({ userId, participantId:userId,controller:"human", team, slot, character: null, ready: false, connected: true });
      this.membership.set(userId, room.code); this.invalidate(room); return;
    }
    throw new RoomError("room_full");
  }
  invalidate(room: RoomState): void { for (const member of room.members) member.ready = member.controller==="bot"&&member.character!==null; }
  leave(userId: string): RoomState | null {
    const room = this.roomFor(userId);
    if (room.status !== "lobby" && room.status !== "finished") throw new RoomError("invalid_state");
    room.members = room.members.filter((member) => member.userId !== userId);
    this.membership.delete(userId); this.invalidate(room);
    if (!humans(room).length) { this.rooms.delete(room.code); return null; }
    if (room.ownerId === userId) room.ownerId = humans(room)[0]!.userId;
    return room;
  }
}
