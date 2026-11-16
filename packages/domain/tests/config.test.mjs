import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_RULES, overallFromAttributes, validateCharacterAttributes, validateRulesConfig } from "../dist/index.js";

test("rules v1 exposes fixed step and documented court/action limits", () => {
  assert.equal(DEFAULT_RULES.fixedDeltaSeconds, 1 / 60);
  assert.equal(DEFAULT_RULES.courtWidth, 9);
  assert.equal(DEFAULT_RULES.courtLength, 18);
  assert.equal(DEFAULT_RULES.serveTimeoutSeconds, 8);
  assert.equal(validateRulesConfig(DEFAULT_RULES), DEFAULT_RULES);
});

test("rejects non-finite or out-of-bound physics values", () => {
  assert.throws(() => validateRulesConfig({ ...DEFAULT_RULES, gravity: Number.NaN }));
  assert.throws(() => validateRulesConfig({ ...DEFAULT_RULES, fixedDeltaSeconds: Infinity }));
  assert.throws(() => validateRulesConfig({ ...DEFAULT_RULES, fixedDeltaSeconds: 0.1 }));
});

test("validates seven integer attributes and derives rounded overall", () => {
  const attributes = { serve: 50, receive: 50, set: 50, attack: 50, block: 50, speed: 50, jump: 50 };
  assert.equal(overallFromAttributes(attributes), 50);
  assert.equal(validateCharacterAttributes(attributes), attributes);
  assert.throws(() => validateCharacterAttributes({ ...attributes, speed: 101 }));
  assert.throws(() => validateCharacterAttributes({ ...attributes, jump: Number.NaN }));
});
