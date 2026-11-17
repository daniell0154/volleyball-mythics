import type { Mode, Side } from "../match/state.js";

export interface BallContactState {
  readonly mode: Mode;
  readonly touches: number;
  readonly lastPlayerId: string | null;
  readonly lastTouchSide: Side | null;
  readonly lastContactWasBlock: boolean;
}

export type ContactResult =
  | { legal: true; state: BallContactState; counted: boolean }
  | { legal: false; pointFor: Side; reason: "fourth_touch" | "consecutive_player" };

export function createBallContactState(mode: Mode): BallContactState {
  return { mode, touches: 0, lastPlayerId: null, lastTouchSide: null, lastContactWasBlock: false };
}

export function applyContact(
  state: BallContactState,
  playerId: string,
  side: Side,
  kind: "hit" | "block",
): ContactResult {
  if (!playerId.trim()) throw new Error("playerId is required");
  const opposingSide: Side = side === "A" ? "B" : "A";
  if (kind === "block") {
    return { legal: true, counted: false, state: { ...state, touches: 0, lastPlayerId: playerId, lastTouchSide: side, lastContactWasBlock: true } };
  }
  const touches = state.lastTouchSide !== null && state.lastTouchSide !== side ? 0 : state.touches;
  if (state.mode === "2v2" && touches > 0 && state.lastPlayerId === playerId && !state.lastContactWasBlock) {
    return { legal: false, pointFor: opposingSide, reason: "consecutive_player" };
  }
  if (touches >= 3) return { legal: false, pointFor: opposingSide, reason: "fourth_touch" };
  return {
    legal: true,
    counted: true,
    state: { ...state, touches: touches + 1, lastPlayerId: playerId, lastTouchSide: side, lastContactWasBlock: false },
  };
}

export function resolveGround(position: { x: number; z: number }, lastTouchSide: Side | null): Side {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.z)) throw new Error("position must be finite");
  const inside = Math.abs(position.x) <= 4.5 && Math.abs(position.z) <= 9;
  if (inside) {
    if (lastTouchSide === null) throw new Error("grounded ball requires last touch side");
    return position.z < 0 ? "B" : "A";
  }
  if (lastTouchSide === null) throw new Error("out ball requires last touch side");
  return lastTouchSide === "A" ? "B" : "A";
}

export function serveTimeoutPoint(servingSide: Side): Side {
  return servingSide === "A" ? "B" : "A";
}
