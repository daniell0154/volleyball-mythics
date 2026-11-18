import assert from "node:assert/strict";
import { test } from "node:test";
import { drawAbility } from "../.test-build/admin/rosterAbilities.js";

test("the roster draw covers zero, one and all uniformly indexed alternatives", () => {
  const zero = [{ id: "disabled", enabled: false }];
  const options = ["current", "first", "second", "third"].map(id => ({ id, enabled: true }));
  const unexpected = () => { throw new Error("random is unnecessary with zero or one option"); };
  assert.equal(drawAbility(zero, "current", unexpected), undefined);
  assert.equal(drawAbility([...zero, options[0]], "current", unexpected), options[0]);
  assert.equal(drawAbility([...zero, options[0]], "legacy", unexpected), options[0]);
  const catalog = [...options, ...zero];
  for (const [roll, expected] of [[0, "first"], [.33332, "first"], [1 / 3, "second"], [2 / 3, "third"], [.999999, "third"]]) {
    assert.equal(drawAbility(catalog, "current", () => roll).id, expected);
  }
  for (const [index, option] of options.entries()) {
    assert.equal(drawAbility(catalog, "unavailable", () => (index + .5) / options.length), option);
  }
});
