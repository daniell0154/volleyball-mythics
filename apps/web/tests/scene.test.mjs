import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { createCamera, fitCamera } from '../.test-build/scene/camera.js';
import { syntheticSnapshot } from '../.test-build/game/presentation.js';

test('camera contains entire rally volume in desktop and narrow viewports', () => {
  for (const [width, height] of [[1280,720], [1920,1080], [390,844]]) {
    const camera = createCamera(); fitCamera(camera, width, height);
    for (const x of [-4.61, 4.61]) for (const z of [-9.11, 9.11]) for (const y of [0, 6.11]) {
      const point = new Vector3(x,y,z).project(camera);
      assert.ok(Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1 && Math.abs(point.z) <= 1, `${width}x${height}: ${x},${y},${z}`);
    }
    for (let time = 0; time < 120; time += 0.05) {
      const snapshot = syntheticSnapshot(time);
      assert.equal(snapshot.athletes.length, 4);
      const point = new Vector3().copy(snapshot.ball).project(camera);
      assert.ok(Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1);
    }
  }
});
