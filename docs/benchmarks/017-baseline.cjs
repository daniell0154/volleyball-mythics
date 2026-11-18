const assert = require("node:assert/strict");
const { writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));
const traces = require("./014-traces-4.json");

async function run() {
  const browser = await chromium.launch({ channel: process.env.VOLLEYBALL_BROWSER || "msedge" });
  const width = 1280, height = 720;
  const cases = [];
  try {
    for (const serveSide of ["A", "B"]) {
      const trace = traces.find(entry => entry.side === serveSide && entry.defending === true).frames;
      for (const viewSide of ["A", "B"]) {
        const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.routeWebSocket("ws://127.0.0.1:5180/**", socket => socket.send('{"type":"connected"}'));
        await page.goto(`http://127.0.0.1:5180/docs/benchmarks/016-render.html?variant=candidate&motion=follow&serveSide=${serveSide}&viewSide=${viewSide}`);
        await page.waitForFunction(() => typeof window.replayAt === "function");
        const measurements = await page.evaluate(async ({ trace, viewSide, width, height }) => {
          const { createCamera, fitCourtViewport, followRallyCamera } = await import("/apps/web/src/scene/camera.ts");
          const { visualBallScale } = await import("/apps/web/src/scene/ballVisibility.ts");
          const camera = createCamera();
          const insets = {
            top: document.querySelector(".match-hud").offsetHeight,
            bottom: document.querySelector(".match-controls").offsetHeight,
          };
          fitCourtViewport(camera, width, height, insets, 16);
          const rounded = value => Math.round(value * 100) / 100;
          const localId = trace[0].athletes.find(athlete => athlete.team === viewSide).id;
          const screen = point => [(point.x + 1) * width / 2, (1 - point.y) * height / 2];
          const worldToScreen = (x, y, z) => screen(camera.position.clone().set(x, y, z).project(camera));
          const milestones = [];
          const seenContacts = new Set();
          let lastTick = trace[0].tick;
          let frames = 0, minimumBallDiameter = Infinity, minimumSafeMargin = Infinity, outside = 0;
          for (const frame of trace) {
            if (frame.phase !== "serving" && frame.phase !== "rally") continue;
            const player = frame.athletes.find(athlete => athlete.id === localId).position;
            followRallyCamera(camera, player, frame.ball, viewSide, (frame.tick - lastTick) / 60);
            lastTick = frame.tick;
            const { x, y, z } = frame.ball;
            const scale = visualBallScale(camera, frame.ball, height);
            const ballView = camera.position.clone().set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
            // The outline sphere fits inside this camera-aligned box.
            const radius = .11 * 1.18 * scale;
            const corners = [-radius, radius].flatMap(dx => [-radius, radius].flatMap(dy =>
              [-radius, radius].map(dz => screen(ballView.clone().set(ballView.x + dx, ballView.y + dy, ballView.z + dz).applyMatrix4(camera.projectionMatrix)))));
            const safeMargin = Math.min(...corners.flatMap(([sx, sy]) => [sx, width - sx, sy - insets.top, height - insets.bottom - sy]));
            const diameter = .22 * scale * height * camera.projectionMatrix.elements[5] / (-2 * ballView.z);
            const footY = worldToScreen(player.x, player.y, player.z)[1];
            const headY = worldToScreen(player.x, player.y + 1.8, player.z)[1];
            const contacts = (frame.visualActions || []).filter(action => !seenContacts.has(action.id));
            for (const action of contacts) seenContacts.add(action.id);
            for (const kind of frames === 0 ? ["serve-ready"] : contacts.map(action => action.kind)) {
              milestones.push({ kind, tick: frame.tick, athleteHeightPx: rounded(Math.abs(footY - headY)), ballDiameterPx: rounded(diameter), safeMarginPx: rounded(safeMargin) });
            }
            frames++;
            minimumBallDiameter = Math.min(minimumBallDiameter, diameter);
            minimumSafeMargin = Math.min(minimumSafeMargin, safeMargin);
            outside += Number(safeMargin < 0);
          }
          return { insets, frames, localId, minimumBallDiameterPx: rounded(minimumBallDiameter), minimumSafeMarginPx: rounded(minimumSafeMargin), outside, milestones };
        }, { trace, viewSide, width, height });
        assert.equal(measurements.outside, 0);
        assert.ok(measurements.minimumBallDiameterPx >= 12);
        const localServe = serveSide === viewSide;
        const kind = localServe ? "serve-ready" : "receive";
        const frameIndex = trace.findIndex(frame => frame.tick === measurements.milestones.find(frame => frame.kind === kind).tick);
        await page.evaluate(async frameIndex => {
          for (let index = 0; index <= frameIndex; index++) {
            await new Promise(resolve => setTimeout(resolve, 50));
            window.replayAt((index + .001) / 20);
          }
        }, frameIndex);
        const screenshot = `017-baseline-${viewSide}-${localServe ? "serve" : "receive"}.png`;
        await page.screenshot({ path: `docs/benchmarks/${screenshot}` });
        assert.deepEqual(errors, []);
        cases.push({ serveSide, viewSide, screenshot, ...measurements });
        await page.close();
      }
    }
    writeFileSync("docs/benchmarks/017-baseline.json", JSON.stringify({
      base: "e819575", browser: browser.version(), width, height, dpr: 1, quality: "low",
      source: "014-traces-4.json, 20 Hz, defending=true, quatro atletas",
      notes: "Altura do atleta aproximada pelo segmento vertical de 1,8 m. Margem conservadora da esfera com contorno, sem medição de oclusão.",
      cases,
    }, null, 2) + "\n");
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
