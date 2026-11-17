export type Side = "A" | "B";
export type Mode = "1v1" | "2v2";
export type Phase = "lobby" | "countdown" | "serving" | "rally" | "point" | "finished" | "cancelled";

export interface MatchState {
  readonly matchId: string;
  readonly mode: Mode;
  readonly phase: Phase;
  readonly score: Readonly<Record<Side, number>>;
  readonly servingSide: Side;
  readonly servingSlot: 0 | 1;
  readonly rallyId: number;
  readonly lastScoringSide: Side | null;
  readonly appliedPointIds: readonly string[];
  readonly rulesVersion: number;
}

export type MatchEvent =
  | { type: "START" }
  | { type: "COUNTDOWN_FINISHED" }
  | { type: "SERVE_HIT" }
  | { type: "RALLY_POINT"; pointId: string; scoringSide: Side }
  | { type: "POINT_DELAY_FINISHED" }
  | { type: "CANCEL" };

export function createMatch(matchId: string, mode: Mode, rulesVersion = 1): MatchState {
  if (!matchId.trim()) throw new Error("matchId is required");
  if (!Number.isInteger(rulesVersion) || rulesVersion < 1) throw new Error("rulesVersion must be positive");
  return {
    matchId, mode, phase: "lobby", score: { A: 0, B: 0 }, servingSide: "A",
    servingSlot: 0, rallyId: 0, lastScoringSide: null, appliedPointIds: [], rulesVersion,
  };
}

export function transition(state: MatchState, event: MatchEvent): MatchState {
  if (state.phase === "finished" || state.phase === "cancelled") return state;
  if (event.type === "CANCEL") return { ...state, phase: "cancelled" };

  switch (event.type) {
    case "START":
      if (state.phase !== "lobby") return state;
      return { ...state, phase: "countdown" };
    case "COUNTDOWN_FINISHED":
      if (state.phase !== "countdown") return state;
      return { ...state, phase: "serving", rallyId: state.rallyId + 1 };
    case "SERVE_HIT":
      if (state.phase !== "serving") return state;
      return { ...state, phase: "rally" };
    case "RALLY_POINT": {
      if ((state.phase !== "rally" && state.phase !== "serving") || !event.pointId || state.appliedPointIds.includes(event.pointId)) return state;
      const score = { ...state.score, [event.scoringSide]: state.score[event.scoringSide] + 1 };
      const won = score[event.scoringSide] === 6;
      const regainedServe = event.scoringSide !== state.servingSide;
      return {
        ...state, score, phase: won ? "finished" : "point", servingSide: event.scoringSide,
        servingSlot: regainedServe && state.mode === "2v2" ? (state.servingSlot === 0 ? 1 : 0) : state.servingSlot,
        lastScoringSide: event.scoringSide, appliedPointIds: [...state.appliedPointIds, event.pointId],
      };
    }
    case "POINT_DELAY_FINISHED":
      if (state.phase !== "point") return state;
      return { ...state, phase: "serving", rallyId: state.rallyId + 1 };
  }
}
