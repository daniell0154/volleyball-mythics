const assert = require("node:assert/strict");
const { writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));
const targeted = require("../../.test-build/017-targeted.json");
const reference = require("./014-traces-4.json").filter(trace => trace.defending === true);

async function measure(page, traces, quality, stable, resize = false) {
  return page.evaluate(async ({ traces, quality, stable, resize }) => {
    const { createCamera } = await import("/apps/web/src/scene/camera.ts");
    const { visualBallScale } = await import("/apps/web/src/scene/ballVisibility.ts");
    const prototype = Object.getPrototypeOf(createCamera());
    const update = prototype.updateMatrixWorld;
    let camera;
    prototype.updateMatrixWorld = function (...args) {
      camera = this;
      return update.apply(this, args);
    };

    const host = document.querySelector(".court-host");
    const canvas = host.querySelector("canvas");
    const cue = host.querySelector("[data-ball-cue]");
    const hud = document.querySelector(".match-hud");
    const controls = document.querySelector(".match-controls");
    const pixels = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    const results = [];
    const round = number => Math.round(number * 100) / 100;
    const bounds = () => ({
      width: host.clientWidth, height: host.clientHeight, top: hud.offsetHeight, bottom: controls.offsetHeight,
    });

    function visiblePixels(centerX, centerY, diameter, width, height) {
      const scale = canvas.width / width;
      const left = Math.max(0, Math.floor((centerX - diameter / 2) * scale));
      const top = Math.max(0, Math.floor((centerY - diameter / 2) * scale));
      const w = Math.min(canvas.width - left, Math.ceil(diameter * scale));
      const h = Math.min(canvas.height - top, Math.ceil(diameter * scale));
      if (w <= 0 || h <= 0 || centerX < 0 || centerX >= width || centerY < 0 || centerY >= height) return 0;
      pixels.canvas.width = w;
      pixels.canvas.height = h;
      pixels.drawImage(canvas, left, top, w, h, 0, 0, w, h);
      const rgba = pixels.getImageData(0, 0, w, h).data;
      let yellow = 0;
      for (let i = 0; i < rgba.length; i += 4) {
        if (rgba[i] > 245 && rgba[i + 1] >= 215 && rgba[i + 1] <= 240 && rgba[i + 2] < 15) yellow++;
      }
      return round(yellow / scale ** 2);
    }

    try {
      for (const trace of traces) for (const viewSide of ["A", "B"]) {
        const playerId = trace.frames[0].athletes.find(player => player.team === viewSide).id;
        window.configureReplay({ viewSide, playerId, quality, stable });
        const { width, height, top, bottom } = bounds();
        const device = { width: canvas.width, height: canvas.height, dpr: devicePixelRatio };
        let minimumMargin = Infinity, minimumDiameter = Infinity, outside = 0, cueOutside = 0, frames = 0;
        let maxStableDelta = 0, firstEye, firstAim;
        const contacts = [];
        const screen = point => [(point.x + 1) * width / 2, (1 - point.y) * height / 2];
        for (const frame of window.withReplayAvatars(trace.frames)) {
          if (frame.phase !== "serving" && frame.phase !== "rally") continue;
          window.drawReplayFrame(frame, frame.tick * 1000 / 60);
          const { x, y, z } = frame.ball;
          const ballView = camera.position.clone().set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
          const center = screen(ballView.clone().applyMatrix4(camera.projectionMatrix));
          const pixelsPerMeter = height * camera.projectionMatrix.elements[5] / (-2 * ballView.z);
          const scale = visualBallScale(camera, frame.ball, height);
          const diameter = .22 * scale * pixelsPerMeter;
          const radius = .11 * 1.18 * scale;
          let margin = Infinity;
          for (const dx of [-radius, radius]) for (const dy of [-radius, radius]) for (const dz of [-radius, radius]) {
            const [sx, sy] = screen(ballView.clone().set(ballView.x + dx, ballView.y + dy, ballView.z + dz)
              .applyMatrix4(camera.projectionMatrix));
            margin = Math.min(margin, sx, width - sx, sy - top, height - bottom - sy);
          }
          const mark = cue.getBoundingClientRect();
          outside += Number(margin < 0 || ballView.z + radius >= -camera.near);
          cueOutside += Number(cue.textContent !== "" || mark.top < top || mark.bottom > height - bottom ||
            mark.left < 0 || mark.right > width);
          minimumMargin = Math.min(minimumMargin, margin);
          minimumDiameter = Math.min(minimumDiameter, diameter);
          if (stable) {
            firstEye ??= camera.position.clone();
            firstAim ??= camera.quaternion.clone();
            maxStableDelta = Math.max(maxStableDelta, camera.position.distanceTo(firstEye), camera.quaternion.angleTo(firstAim));
          }
          const impact = trace.contacts && frame.visualActions.find(action => action.tick === frame.tick);
          if (impact || frames === 0) {
            const player = frame.athletes.find(athlete => athlete.id === playerId);
            const direction = viewSide === "A" ? 1 : -1;
            const ballPixels = visiblePixels(...center, diameter, width, height);
            contacts.push({
              kind: impact?.kind ?? "serve-ready", tick: frame.tick,
              behindPlayer: (player.position.z - camera.position.z) * direction > 0,
              facesNet: camera.getWorldDirection(camera.position.clone()).z * direction > 0,
              ballPixels,
            });
          }
          frames++;
          // Let the GPU consume pending frames before submitting another batch at DPR 2.
          if (frames % 12 === 0) await new Promise(resolve => requestAnimationFrame(resolve));
        }

        const last = trace.frames.at(-1);
        window.drawReplayFrame({ ...last, ball: { x: 80, y: 2, z: 0 } }, (last.tick + 1) * 1000 / 60);
        const arrow = cue.textContent;
        const arrowRect = cue.getBoundingClientRect();
        const arrowInside = arrowRect.top >= top && arrowRect.bottom <= height - bottom &&
          arrowRect.left >= 0 && arrowRect.right <= width;
        results.push({
          scenario: trace.contacts ? "direcionado" : "014", serveSide: trace.side, viewSide, quality, stable,
          viewport: { width, height, top, bottom }, device, resize, frames,
          minimumMarginPx: round(minimumMargin), minimumDiameterPx: round(minimumDiameter),
          outside, cueOutside, maxStableDelta, arrow, arrowInside, contacts,
        });
      }
    } finally {
      prototype.updateMatrixWorld = update;
    }
    return results;
  }, { traces, quality, stable, resize });
}

async function run() {
  const browser = await chromium.launch({ channel: process.env.VOLLEYBALL_BROWSER || "msedge" });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.routeWebSocket("ws://127.0.0.1:5180/**", socket => socket.send('{"type":"connected"}'));
    await page.goto("http://127.0.0.1:5180/docs/benchmarks/016-render.html?variant=candidate&motion=follow&camera=close");
    await page.waitForFunction(() => typeof window.drawReplayFrame === "function");
    const cases = [];
    for (const viewport of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(viewport);
      await page.waitForFunction(width => document.querySelector(".court-host canvas").clientWidth === width, viewport.width);
      cases.push(...await measure(page, [...reference, ...targeted], "low", false));
      cases.push(...await measure(page, targeted, "high", false));
      cases.push(...await measure(page, targeted, "low", true));
    }
    await page.setViewportSize({ width: 640, height: 360 });
    const expand = page.getByRole("button", { name: "Ações", exact: true });
    await expand.click();
    await page.waitForFunction(() => document.querySelector(".match-controls").offsetHeight > 50);
    cases.push(...await measure(page, targeted, "low", false, true));
    const report = { browser: browser.version(), cases, errors };
    writeFileSync("docs/benchmarks/017-visibility.json", JSON.stringify(report, null, 2) + "\n");
    assert.deepEqual(errors, []);
    for (const row of cases) {
      assert.equal(row.outside + row.cueOutside, 0, JSON.stringify(row));
      assert.ok(row.minimumDiameterPx >= 12 && row.arrowInside && row.maxStableDelta < 1e-6, JSON.stringify(row));
      assert.match(row.arrow, row.viewSide === "A" ? /^[↖←↙]$/ : /^[↗→↘]$/);
      assert.ok(row.contacts.every(contact => contact.behindPlayer && contact.facesNet));
      const ratio = row.quality === "high" ? row.device.dpr : 1;
      assert.equal(row.device.width, row.viewport.width * ratio);
      assert.equal(row.device.height, row.viewport.height * ratio);
    }
    console.log(`${cases.length} combinações, ${cases.reduce((sum, row) => sum + row.frames, 0)} amostras, Edge ${browser.version()}`);
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
