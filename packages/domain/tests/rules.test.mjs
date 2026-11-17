import test from "node:test";
import assert from "node:assert/strict";
import { applyContact, createBallContactState, resolveGround, serveTimeoutPoint } from "../dist/index.js";

test("line is in; ball outside awards the point opposite the last touch", () => {
  assert.equal(resolveGround({ x: 4.5, z: 9 }, "A"), "A");
  assert.equal(resolveGround({ x: 0, z: -4 }, "A"), "B");
  assert.equal(resolveGround({ x: 0, z: 4 }, "B"), "A");
  assert.equal(resolveGround({ x: 4.5001, z: 0 }, "A"), "B");
  assert.equal(resolveGround({ x: 0, z: -9.0001 }, "B"), "A");
});

test("fourth touch is a fault and a change of side resets touch count", () => {
  let state = createBallContactState("2v2");
  for (const [id, side] of [["a1", "A"], ["a2", "A"], ["a1", "A"]]) {
    const result = applyContact(state, id, side, "hit");
    assert.equal(result.legal, true);
    state = result.state;
  }
  assert.deepEqual(applyContact(state, "a2", "A", "hit"), { legal: false, pointFor: "B", reason: "fourth_touch" });
  const otherSide = applyContact(state, "b1", "B", "hit");
  assert.equal(otherSide.legal, true);
  assert.equal(otherSide.state.touches, 1);
});

test("same player consecutive is illegal in doubles but legal in singles", () => {
  let doubles = createBallContactState("2v2");
  doubles = applyContact(doubles, "a1", "A", "hit").state;
  assert.deepEqual(applyContact(doubles, "a1", "A", "hit"), { legal: false, pointFor: "B", reason: "consecutive_player" });
  let singles = createBallContactState("1v1");
  singles = applyContact(singles, "a1", "A", "hit").state;
  assert.equal(applyContact(singles, "a1", "A", "hit").legal, true);
});

test("block is not counted as a team hit and the next blocker touch is legal", () => {
  let state = createBallContactState("2v2");
  state = applyContact(state, "a1", "A", "hit").state;
  state = applyContact(state, "a2", "A", "hit").state;
  const block = applyContact(state, "b1", "B", "block");
  assert.equal(block.legal, true);
  assert.equal(block.counted, false);
  assert.equal(block.state.touches, 0);
  assert.equal(applyContact(block.state, "b1", "B", "hit").legal, true);
});

test("serve timeout awards the point to the receiving side", () => {
  assert.equal(serveTimeoutPoint("A"), "B");
  assert.equal(serveTimeoutPoint("B"), "A");
});
