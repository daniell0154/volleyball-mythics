export const PROTOCOL_VERSION = 1 as const;

export type MatchMode = "1v1" | "2v2";
export type Team = "A" | "B";
export type MatchStatus = "created" | "active" | "finished" | "cancelled";
export type MatchReason = "points" | "forfeit" | "server_failure";

export interface CharacterAttributes {
  serve: number;
  receive: number;
  set: number;
  attack: number;
  block: number;
  speed: number;
  jump: number;
}

export interface Character {
  id: string;
  version: number;
  name: string;
  attributes: CharacterAttributes;
  overall: number;
  abilityId: string;
  abilityConfig: Readonly<Record<string, unknown>>;
  assetKey: string;
  enabled: boolean;
}

export interface MatchResult {
  matchId: string;
  status: MatchStatus;
  score: Readonly<Record<Team, number>>;
  winner: Team | null;
  reason: MatchReason | null;
  rulesVersion: number;
  startedAt: string | null;
  endedAt: string | null;
}

export interface MatchPlayer {
  matchId: string;
  userId: string;
  team: Team;
  slot: 0 | 1;
  characterId: string;
  characterVersion: number;
}

export interface ClientEnvelope<TType extends string, TPayload> {
  protocolVersion: typeof PROTOCOL_VERSION;
  type: TType;
  requestId: string;
  payload: TPayload;
}

export interface CreateRoomPayload {
  mode: MatchMode;
}

export interface JoinRoomPayload {
  code: string;
}

export interface SelectCharacterPayload {
  characterId: string;
  version: number;
}

export interface SetTeamPayload {
  team: Team;
  slot: 0 | 1;
}

export interface ReadyPayload {
  ready: boolean;
}

export interface InputPayload {
  seq: number;
  moveX: number;
  moveZ: number;
  actions: readonly ("jump" | "receive" | "set" | "attack" | "serve" | "ability")[];
}

export type ClientMessage =
  | ClientEnvelope<"createRoom", CreateRoomPayload>
  | ClientEnvelope<"joinRoom", JoinRoomPayload>
  | ClientEnvelope<"selectCharacter", SelectCharacterPayload>
  | ClientEnvelope<"setTeam", SetTeamPayload>
  | ClientEnvelope<"ready", ReadyPayload>
  | ClientEnvelope<"start", Record<string, never>>
  | ClientEnvelope<"input", InputPayload>
  | ClientEnvelope<"leave", Record<string, never>>
  | ClientEnvelope<"rematchVote", Record<string, never>>;

export interface ServerMessage<TType extends string, TPayload> {
  protocolVersion: typeof PROTOCOL_VERSION;
  type: TType;
  payload: TPayload;
}

export type ServerErrorCode =
  | "unauthorized"
  | "invalid_message"
  | "room_not_found"
  | "room_full"
  | "invalid_state"
  | "forbidden"
  | "rate_limited";

export interface RoomMember {
  userId: string;
  team: Team;
  slot: 0 | 1;
  character: { id: string; version: number } | null;
  ready: boolean;
  connected: boolean;
}
export interface RoomState {
  roomId: string;
  code: string;
  mode: MatchMode;
  ownerId: string;
  status: "lobby" | "active" | "suspended" | "finished";
  members: RoomMember[];
}
export interface CatalogEntry { id: string; version: number; name: string; assetKey?: string; overall?: number; abilityName?: string; attributes?: CharacterAttributes }
export interface Vector3 { readonly x: number; readonly y: number; readonly z: number }
export interface MatchSnapshot {
  matchId: string;
  tick: number;
  phase: "countdown" | "serving" | "rally" | "point" | "finished" | "cancelled" | "disconnectedSuspension";
  score: Readonly<Record<Team, number>>;
  serverTime: number;
  lastProcessedSeq: Readonly<Record<string, number>>;
  athletes: readonly { id: string; team: Team; position: Vector3; assetKey?: string }[];
  ball: Vector3;
  cooldowns: Readonly<Record<string, number>>;
  servingSide?: Team;
  servingSlot?: 0 | 1;
  secondsRemaining?: number;
  winner?: Team | null;
  reason?: MatchReason | null;
  pointReason?: string;
}
export interface MatchEnded {
  matchId: string; score: Readonly<Record<Team, number>>; winner: Team | null;
  reason: MatchReason; persistence: "pending" | "saved" | "failed" | "not_required";
  rematchVotes: readonly string[];
}

export type ServerResponse<T> =
  | ServerMessage<"ack", { requestId: string; result: T }>
  | ServerMessage<"error", { requestId: string; code: ServerErrorCode }>;
