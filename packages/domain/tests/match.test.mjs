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

test("2v2 serving slot stays on a scoring streak and rotates separately for each team", () => {
  let match = createMatch("m-2v2-serve", "2v2");
  match = transition(match, { type: "START" });
  match = transition(match, { type: "COUNTDOWN_FINISHED" });
  assert.deepEqual([match.servingSide, match.servingSlot], ["A", 0]);
  match = transition(match, { type: "RALLY_POINT", pointId: "a1", scoringSide: "A" });
  match = transition(match, { type: "POINT_DELAY_FINISHED" });
  assert.deepEqual([match.servingSide, match.servingSlot], ["A", 0]);
  match = transition(match, { type: "SERVE_HIT" });
  match = transition(match, { type: "RALLY_POINT", pointId: "b1", scoringSide: "B" });
  assert.deepEqual([match.servingSide, match.servingSlot], ["B", 0]);
  match = transition(match, { type: "POINT_DELAY_FINISHED" });
  match = transition(match, { type: "SERVE_HIT" });
  match = transition(match, { type: "RALLY_POINT", pointId: "a2", scoringSide: "A" });
  assert.deepEqual([match.servingSide, match.servingSlot], ["A", 1]);
  match = transition(match, { type: "POINT_DELAY_FINISHED" });
  match = transition(match, { type: "SERVE_HIT" });
  match = transition(match, { type: "RALLY_POINT", pointId: "b2", scoringSide: "B" });
  assert.deepEqual([match.servingSide, match.servingSlot], ["B", 1]);
});

test("2v2 uses the same first-to-six 6–5 finish rule", () => {
  let match = createMatch("m-2v2-final", "2v2");
  match = transition(match, { type: "START" });
  match = transition(match, { type: "COUNTDOWN_FINISHED" });
  for (let i = 0; i < 10; i++) {
    match = transition(match, { type: "SERVE_HIT" });
    match = transition(match, { type: "RALLY_POINT", pointId: `2v2-${i}`, scoringSide: i % 2 === 0 ? "A" : "B" });
    if (match.phase === "point") match = transition(match, { type: "POINT_DELAY_FINISHED" });
  }
  assert.deepEqual(match.score, { A: 5, B: 5 });
  match = transition(match, { type: "SERVE_HIT" });
  match = transition(match, { type: "RALLY_POINT", pointId: "2v2-winner", scoringSide: "A" });
  assert.deepEqual(match.score, { A: 6, B: 5 });
  assert.equal(match.phase, "finished");
});
