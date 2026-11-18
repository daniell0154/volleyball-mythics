import assert from "node:assert/strict";
import { test } from "node:test";
import { ballScreenCue } from "../.test-build/scene/ballVisibility.js";
import { createCamera, fitCourtViewport } from "../.test-build/scene/camera.js";
import { CloseRallyCamera } from "../.test-build/scene/closeRallyCamera.js";

const insets = { top: 42, bottom: 50 };
const player = { x: -2, y: 0, z: -6 };
const serve = { ...player, y: 1.25 };

test("the rig mirrors sides and the eye stays anchored to the floor on a jump", () => {
  const camera = createCamera();
  const rig = new CloseRallyCamera();
  fitCourtViewport(camera, 1280, 720, insets, 16);
  rig.update(camera, player, serve, "A", 0, 1280, 720, insets);
  const initial = camera.position.clone();
  assert.ok(initial.z < player.z);
  rig.update(camera, { ...player, y: 1 }, serve, "A", .016, 1280, 720, insets);
  assert.ok(camera.position.distanceTo(initial) < 1e-8);
  rig.update(camera, { ...player, z: 6 }, { ...serve, z: 6 }, "B", .016, 1280, 720, insets);
  assert.ok(Math.abs(camera.position.z + initial.z) < 1e-8);
  assert.equal(camera.position.y, initial.y);
});

test("an extreme arc opens the frame while aim and return remain gradual after resize", () => {
  const camera = createCamera();
  const rig = new CloseRallyCamera();
  fitCourtViewport(camera, 1280, 720, insets, 16);
  rig.update(camera, player, serve, "A", 0, 1280, 720, insets);
  const initial = camera.position.clone();
  const initialAim = camera.quaternion.clone();
  const highBall = { x: 4.5, y: 11, z: -8 };
  const dt = .016;
  rig.update(camera, player, highBall, "A", dt, 1280, 720, insets);
  assert.ok(camera.position.distanceTo(initial) > 2);
  assert.ok(camera.quaternion.angleTo(initialAim) <= 1.4 * dt + 1e-7);
  assert.equal(ballScreenCue(camera, highBall, 1280, 720, 16, insets).offscreen, false);

  const compactInsets = { top: 55, bottom: 90 };
  fitCourtViewport(camera, 631, 312, compactInsets, 16);
  rig.update(camera, player, highBall, "A", dt, 631, 312, compactInsets);
  assert.equal(ballScreenCue(camera, highBall, 631, 312, 16, compactInsets).offscreen, false);
  const wideAngle = camera.position.distanceTo(initial);
  rig.update(camera, player, serve, "A", dt, 631, 312, compactInsets);
  assert.ok(camera.position.distanceTo(initial) > wideAngle * .9);
  for (let frame = 0; frame < 240; frame++) rig.update(camera, player, serve, "A", dt, 631, 312, compactInsets);
  assert.ok(camera.position.distanceTo(initial) < .1);
  const outside = { x: 100, y: 8, z: 0 };
  rig.update(camera, player, outside, "A", dt, 631, 312, compactInsets);
  assert.ok(ballScreenCue(camera, outside, 631, 312, 16, compactInsets).offscreen);
});
