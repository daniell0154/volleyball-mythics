import {test} from 'node:test';import assert from 'node:assert/strict';import {Vector3} from 'three';
import {readFileSync} from 'node:fs';
import {visualBallScale,ballScreenCue} from '../.test-build/scene/ballVisibility.js';import {createCamera,fitStableCamera,followRallyCamera} from '../.test-build/scene/camera.js';
test('ball has a minimum projected 12 CSS pixels in both views; offscreen cue stays inside canvas',()=>{
 for(const team of ['A','B'])for(const [width,height]of [[1280,720],[1920,1080],[640,360]]){
 const camera=createCamera();fitStableCamera(camera,team,width,height);
 for(const p of [{x:-4.5,y:.11,z:-9},{x:4.5,y:8,z:9},{x:0,y:12,z:0}]){
  const scale=visualBallScale(camera,p,height),depth=-new Vector3(p.x,p.y,p.z).applyMatrix4(camera.matrixWorldInverse).z;
  const pixels=.22*scale/(2*depth*Math.tan(camera.fov*Math.PI/360))*height;assert.ok(pixels>=12-1e-8);
  const cue=ballScreenCue(camera,p,width,height);assert.equal(cue.offscreen,false);
 }
 const outside=ballScreenCue(camera,{x:100,y:20,z:0},width,height);assert.equal(outside.offscreen,true);assert.ok(outside.x>=16&&outside.x<=width-16);assert.ok(outside.arrow);
 followRallyCamera(camera,{x:4,y:2,z:8},{x:-4,y:8,z:-8},team,.016);
 assert.equal(ballScreenCue(camera,{x:-4,y:8,z:-8},width,height).offscreen,false);
 }
});

test('the full canvas projection keeps rally traces and cue between HUD overlays', () => {
  const traces = JSON.parse(readFileSync(new URL('../../../docs/benchmarks/014-traces-4.json', import.meta.url)));
  for (const team of ['A', 'B']) {
    const trace = traces.find(trace => trace.side === team && trace.defending === true).frames;
    for (const [width, height, top, bottom] of [[1280, 720, 47, 58], [1920, 1080, 47, 58], [631, 312, 54, 93], [320, 360, 54, 135]]) {
      for (const stable of [false, true]) {
        const camera = createCamera();
        const insets = { top, bottom };
        fitStableCamera(camera, team, width, height, 16, insets);
        for (const frame of trace.filter(frame => ['serving', 'rally'].includes(frame.phase))) {
          const ball = frame.ball;
          if (!stable) followRallyCamera(camera, frame.athletes.find(athlete => athlete.team === team).position, ball, team, .05);
          const cue = ballScreenCue(camera, ball, width, height, 16, insets);
          const depth = -new Vector3(ball.x, ball.y, ball.z).applyMatrix4(camera.matrixWorldInverse).z;
          const pixels = .22 * visualBallScale(camera, ball, height) * height * camera.projectionMatrix.elements[5] / (2 * depth);
          assert.ok(pixels >= 12 - 1e-8);
          assert.ok(cue.x >= 16 && cue.y >= top + 16 && cue.x <= width - 16 && cue.y <= height - bottom - 16);
          if (Math.abs(ball.x) <= 4.5 && Math.abs(ball.z) <= 9) assert.equal(cue.offscreen, false, JSON.stringify({ team, width, height, ball }));
        }
      }
    }
  }
});
