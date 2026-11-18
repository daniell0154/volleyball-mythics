import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { Vector3 } from "three";
import { createCamera, fitCourtViewport } from "../../apps/web/.test-build/scene/camera.js";
import { CloseRallyCamera } from "../../apps/web/.test-build/scene/closeRallyCamera.js";
import { ballScreenCue, visualBallScale } from "../../apps/web/.test-build/scene/ballVisibility.js";

const traces = JSON.parse(readFileSync(new URL("./014-traces-4.json", import.meta.url)));
const baseline = JSON.parse(readFileSync(new URL("./017-baseline.json", import.meta.url)));
const { width, height } = baseline;
const round = number => Math.round(number * 100) / 100;

function measure(profile, reference) {
  const { serveSide, viewSide, insets, localId } = reference;
  const frames = traces.find(trace => trace.side === serveSide && trace.defending === true).frames;
  const milestones = reference.milestones.filter(milestone => milestone.kind === (serveSide === viewSide ? "serve-ready" : "receive"));
  const camera = createCamera();
  const rig = new CloseRallyCamera(profile);
  fitCourtViewport(camera, width, height, insets, 16);
  let minimumMargin = Infinity, minimumDiameter = Infinity, outside = 0, offscreenCue = 0, count = 0;
  let lastTick = frames[0].tick;
  const gains = [];
  for (const frame of frames) {
    if (frame.phase !== "serving" && frame.phase !== "rally") continue;
    const player = frame.athletes.find(athlete => athlete.id === localId).position;
    const { ball } = frame;
    rig.update(camera, player, ball, viewSide, (frame.tick - lastTick) / 60, width, height, insets);
    lastTick = frame.tick;
    const ballView = new Vector3(ball.x, ball.y, ball.z).applyMatrix4(camera.matrixWorldInverse);
    const scale = visualBallScale(camera, ball, height);
    const radius = .11 * 1.18 * scale;
    let margin = Infinity;
    for (const x of [-radius, radius]) for (const y of [-radius, radius]) for (const z of [-radius, radius]) {
      const projected = ballView.clone().add(new Vector3(x, y, z)).applyMatrix4(camera.projectionMatrix);
      const screenX = (projected.x + 1) * width / 2, screenY = (1 - projected.y) * height / 2;
      margin = Math.min(margin, screenX, width - screenX, screenY - insets.top, height - insets.bottom - screenY);
    }
    const diameter = .22 * scale * height * camera.projectionMatrix.elements[5] / (-2 * ballView.z);
    const cue = ballScreenCue(camera, ball, width, height, 16, insets);
    count++;
    outside += Number(margin < 0 || ballView.z + radius >= -camera.near);
    offscreenCue += Number(cue.offscreen);
    minimumMargin = Math.min(minimumMargin, margin);
    minimumDiameter = Math.min(minimumDiameter, diameter);
    const milestone = milestones.find(item => item.tick === frame.tick);
    if (milestone) {
      const foot = new Vector3(player.x, player.y, player.z).project(camera);
      const head = new Vector3(player.x, player.y + 1.8, player.z).project(camera);
      const pixels = Math.abs(head.y - foot.y) * height / 2;
      gains.push({ kind: milestone.kind, tick: frame.tick, athleteHeightPx: round(pixels), gainPercent: round(100 * (pixels / milestone.athleteHeightPx - 1)) });
    }
  }
  assert.equal(gains.length, 1);
  return { serveSide, viewSide, frames: count, minimumMarginPx: round(minimumMargin), minimumDiameterPx: round(minimumDiameter), outside, offscreenCue, ...gains[0] };
}

const profiles = [{ setback: 5.8, height: 3.2 }, { setback: 5.8, height: 5 }, { setback: 8, height: 3.2 }, { setback: 8, height: 5 }];
const variants = profiles.map(profile => {
  const cases = baseline.cases.map(reference => measure(profile, reference));
  return { profile, cases, pass: cases.every(result => result.outside === 0 && result.minimumDiameterPx >= 12 && result.gainPercent >= 30) };
});
const selected = baseline.cases.map(reference => measure(undefined, reference));
assert.ok(selected.every(result => result.outside === 0 && result.minimumDiameterPx >= 12 && result.gainPercent >= 30));
const report = { width, height, source: "017-baseline.json e 014-traces-4.json", variants, selected };
writeFileSync(new URL("./017-candidates.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
console.table(variants.map(({ profile, cases, pass }) => ({
  ...profile, pass, gainMin: Math.min(...cases.map(result => result.gainPercent)),
  marginMin: Math.min(...cases.map(result => result.minimumMarginPx)), cue: cases.reduce((sum, result) => sum + result.offscreenCue, 0),
})));
