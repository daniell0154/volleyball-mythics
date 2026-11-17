import test from "node:test";
import assert from "node:assert/strict";
import { createMatch, transition } from "../dist/match/state.js";

test("match follows lobby, countdown, serve, rally and point phases", () => {
  let match = createMatch("m1", "1v1");
  match = transition(match, { type: "START" });
  assert.equal(match.phase, "countdown");
  match = transition(match, { type: "COUNTDOWN_FINISHED" });
  assert.equal(match.phase, "serving");
  match = transition(match, { type: "SERVE_HIT" });
  assert.equal(match.phase, "rally");
  match = transition(match, { type: "RALLY_POINT", pointId: "r1-p1", scoringSide: "A" });
  assert.deepEqual(match.score, { A: 1, B: 0 });
  assert.equal(match.phase, "point");
});

test("first side to six wins 6–5 and duplicate rally result is ignored", () => {
  let match = createMatch("m2", "1v1");
  for (let i = 0; i < 10; i++) {
    match = transition(match, { type: "START" });
    match = transition(match, { type: "COUNTDOWN_FINISHED" });
    match = transition(match, { type: "SERVE_HIT" });
    match = transition(match, { type: "RALLY_POINT", pointId: `p${i}`, scoringSide: i % 2 === 0 ? "A" : "B" });
    if (match.phase === "point") match = transition(match, { type: "POINT_DELAY_FINISHED" });
  }
  assert.deepEqual(match.score, { A: 5, B: 5 });
  match = transition(match, { type: "SERVE_HIT" });
  match = transition(match, { type: "RALLY_POINT", pointId: "winner", scoringSide: "A" });
  assert.deepEqual(match.score, { A: 6, B: 5 });
  assert.equal(match.phase, "finished");
  const unchanged = transition(match, { type: "RALLY_POINT", pointId: "a8", scoringSide: "B" });
  assert.equal(unchanged.score.B, match.score.B);
});

test("only valid phase events transition and finished match is terminal", () => {
  const match = createMatch("m3", "1v1");
  assert.equal(transition(match, { type: "SERVE_HIT" }), match);
  let finished = { ...match, phase: "finished", score: { A: 6, B: 0 } };
  assert.equal(transition(finished, { type: "CANCEL" }).phase, "finished");
});
