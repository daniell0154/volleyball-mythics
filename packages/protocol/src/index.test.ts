import type { ClientMessage, MatchResult } from "./index.js";

const joinMessage: ClientMessage = {
  protocolVersion: 1,
  type: "joinRoom",
  requestId: "request-1",
  payload: { code: "ABC123" },
};

const finishedMatch: MatchResult = {
  matchId: "00000000-0000-4000-8000-000000000001",
  status: "finished",
  score: { A: 6, B: 4 },
  winner: "A",
  reason: "points",
  rulesVersion: 1,
  startedAt: null,
  endedAt: null,
};

void joinMessage;
void finishedMatch;
