const assert = require("node:assert/strict");
const { writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const os = require("node:os");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));

async function run() {
  const viewport = { width: 1280, height: 720 };
  const channel = process.env.VOLLEYBALL_BROWSER || "msedge";
  const browser = await chromium.launch({ channel });
  try {
    const rows = [];
    for (const camera of ["elevated", "close"]) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.routeWebSocket("ws://127.0.0.1:5180/**", socket => socket.send('{"type":"connected"}'));
      await page.goto(`http://127.0.0.1:5180/docs/benchmarks/016-render.html?variant=candidate&motion=follow&camera=${camera}`);
      await page.waitForFunction(() => typeof window.measureReplay === "function");
      const environment = await page.evaluate(() => {
        const canvas = document.querySelector(".court-host canvas");
        const gl = canvas.getContext("webgl2");
        const debug = gl?.getExtension("WEBGL_debug_renderer_info");
        return {
          width: canvas.width, height: canvas.height, dpr: devicePixelRatio,
          top: document.querySelector(".match-hud").offsetHeight,
          bottom: document.querySelector(".match-controls").offsetHeight,
          gpu: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
        };
      });
      assert.deepEqual([environment.width, environment.height, environment.dpr], [1280, 720, 1]);
      console.log(`Iniciando aquecimento de 10 s e medição de 300 s: ${camera}`);
      await page.evaluate(() => window.measureReplay(10_000));
      const metrics = await page.evaluate(() => window.measureReplay(300_000));
      const row = { camera, ...environment, ...metrics, errors };
      console.log(JSON.stringify(row));
      rows.push(row);
      await page.close();
    }
    const [baseline, candidate] = rows;
    const regressionPercent = (candidate.p95Ms / baseline.p95Ms - 1) * 100;
    const pass = rows.every(row => !row.hidden && row.errors.length === 0) && baseline.gpu === candidate.gpu &&
      baseline.top === candidate.top && baseline.bottom === candidate.bottom &&
      candidate.p95Ms <= 33.3 && regressionPercent <= 10;
    const report = {
      date: new Date().toISOString(), browser: browser.version(), cpu: os.cpus()[0].model, os: os.version(),
      quality: "low", scenario: `Replay 014 v4, quatro atletas, mesmo HUD e sequência, ${channel} headless`,
      baselineCommit: "e819575", rows, regressionPercent, pass,
    };
    writeFileSync("docs/benchmarks/017-render.json", JSON.stringify(report, null, 2) + "\n");
    assert.ok(pass, JSON.stringify(report));
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
