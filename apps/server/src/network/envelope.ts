import type { ClientMessage } from "@volleyball-mythics/protocol";
export function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function keys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  return Object.keys(value).length === expected.length && expected.every((key) => Object.hasOwn(value, key));
}
const text = (value: unknown, max: number): value is string => typeof value === "string" && value.length > 0 && value.length <= max;
export function parseEnvelope(raw: string): ClientMessage | null {
  let message: unknown;
  try { message = JSON.parse(raw); } catch { return null; }
  if (!object(message) || !keys(message, ["protocolVersion", "type", "requestId", "payload"]) || message.protocolVersion !== 1 || !text(message.requestId, 128) || !object(message.payload)) return null;
  const p = message.payload;
  let valid = false;
  switch (message.type) {
    case "createRoom": valid = (keys(p, ["mode"]) && ["1v1", "2v2"].includes(String(p.mode))) || (keys(p,["mode","matchKind","humanSlots","difficulty"])&&p.mode==="2v2"&&p.matchKind==="vsBots"&&(p.humanSlots===1||p.humanSlots===2)&&["easy","normal","hard"].includes(String(p.difficulty))); break;
    case "joinRoom": valid = (keys(p, ["code"])||(keys(p,["code","acceptBots"])&&p.acceptBots===true)) && typeof p.code === "string" && /^[A-Z2-9]{6}$/.test(p.code); break;
    case "selectCharacter": valid = keys(p, ["characterId", "version"]) && text(p.characterId, 128) && Number.isSafeInteger(p.version) && Number(p.version) > 0; break;
    case "setTeam": valid = keys(p, ["team", "slot"]) && ["A", "B"].includes(String(p.team)) && (p.slot === 0 || p.slot === 1); break;
    case "ready": valid = keys(p, ["ready"]) && typeof p.ready === "boolean"; break;
    case "input": valid = (keys(p, ["seq", "moveX", "moveZ", "actions"]) || (keys(p,["seq","moveX","moveZ","actions","aim"]) && object(p.aim) && keys(p.aim,["x","z"]) && typeof p.aim.x==="number" && typeof p.aim.z==="number" && Number.isFinite(p.aim.x) && Number.isFinite(p.aim.z) && Math.hypot(p.aim.x,p.aim.z)<=1)) && Number.isSafeInteger(p.seq) && Number(p.seq) > 0
      && typeof p.moveX === "number" && Number.isFinite(p.moveX) && Math.abs(p.moveX) <= 1
      && typeof p.moveZ === "number" && Number.isFinite(p.moveZ) && Math.abs(p.moveZ) <= 1
      && Array.isArray(p.actions) && p.actions.length <= 6 && new Set(p.actions).size === p.actions.length
      && p.actions.every((action) => ["jump", "receive", "set", "attack", "serve", "ability"].includes(action)); break;
    case "start": case "leave": case "rematchVote": valid = keys(p, []); break;
  }
  return valid ? message as unknown as ClientMessage : null;
}
export function parseAuth(raw: string): { requestId: string; token: string } | null {
  let m: unknown; try { m = JSON.parse(raw); } catch { return null; }
  if (!object(m) || !keys(m, ["protocolVersion", "type", "requestId", "payload"]) || m.protocolVersion !== 1 || m.type !== "auth" || !text(m.requestId, 128)
    || !object(m.payload) || !keys(m.payload, ["accessToken"]) || !text(m.payload.accessToken, 7000)) return null;
  return { requestId: m.requestId, token: m.payload.accessToken };
}
