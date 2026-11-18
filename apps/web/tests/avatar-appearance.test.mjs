import assert from "node:assert/strict";
import { test } from "node:test";
import { editAppearance, parseAppearance } from "../.test-build/scene/avatarAppearance.js";
import { createPresentationAvatar } from "../.test-build/scene/avatarManifest.js";
import { disposeAvatar } from "../.test-build/scene/avatar.js";

test("legacy defaults select the same rig and persist an untouched key", () => {
  const cases = [
    ["procedural:v1:male:2626328580", "athletic", "warm", "back"],
    ["procedural:v1:male:2016838844", "athletic", "peach", "short"],
    ["procedural:v1:female:0000000012", "classic", "peach", "swept-long"],
    ["procedural:athletic-v2:female:12", "athletic", "peach", "swept-long"],
  ];
  for (const [assetKey, rig, skinId, hairId] of cases) {
    const look = parseAppearance(assetKey);
    assert.deepEqual([look.rig, look.skinId, look.hairId], [rig, skinId, hairId]);
    assert.equal(editAppearance(assetKey, { skinId, hairId }), assetKey);
    const custom = parseAppearance(editAppearance(assetKey, { skinId: "deep" }));
    assert.deepEqual(custom, { ...look, skinId: "deep", skin: "#704931" });
    assert.deepEqual(parseAppearance(editAppearance(assetKey, { hairId: "bald" })), {
      ...look, hairId: "bald", hairStyle: 0, longHair: false,
    });
    const legacy = createPresentationAvatar(assetKey, "A");
    const modern = createPresentationAvatar(`procedural:visual-v3:${rig}:${look.gender}:${look.seed}:${skinId}:${hairId}`, "A");
    function geometry(model) {
      const nodes = [];
      model.traverse(node => nodes.push([
        node.name, node.type, node.position.toArray(), node.rotation.toArray(), node.scale.toArray(),
        node.geometry?.parameters, node.material?.color?.getHex(),
      ]));
      return nodes;
    }
    assert.deepEqual(geometry(modern), geometry(legacy));
    disposeAvatar(modern);
    disposeAvatar(legacy);
  }
});

test("the versioned format rejects unknown choices and preserves seeded properties when changing model", () => {
  const asset = "procedural:visual-v3:athletic:female:4294967295:bronze:curly";
  const look = parseAppearance(asset);
  assert.equal(look.seed, 4294967295);
  assert.deepEqual(parseAppearance(editAppearance(asset, { rig: "classic", gender: "male" })), {
    ...look, rig: "classic", gender: "male",
  });
  for (const invalid of [asset.replace("4294967295", "4294967296"), asset.replace("bronze", "unknown"),
    asset.replace("curly", "unknown"), asset.replace("athletic", "unknown"), asset + "\n"]) {
    assert.equal(parseAppearance(invalid), null);
  }
});
