const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { writeFileSync } = require("node:fs");
const os = require("node:os");
const { resolve } = require("node:path");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));

async function run() {
  const browser = await chromium.launch({ channel: process.env.VOLLEYBALL_BROWSER || "msedge" });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.routeWebSocket("ws://127.0.0.1:5180/**", socket => socket.send('{"type":"connected"}'));
    await page.goto("http://127.0.0.1:5180/docs/benchmarks/016-render.html?variant=candidate&motion=follow&camera=close");
    await page.waitForFunction(() => typeof window.measureReplay === "function");
    const canvas = await page.locator(".court-host canvas").evaluate(element => {
      const gl = element.getContext("webgl2");
      const debug = gl?.getExtension("WEBGL_debug_renderer_info");
      return { width: element.width, height: element.height, dpr: devicePixelRatio,
        gpu: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null };
    });
    assert.deepEqual([canvas.width, canvas.height, canvas.dpr], [1280, 720, 1]);
    const profileOnly = process.argv.includes("--profile");
    let metrics;
    if (profileOnly) {
      const session = await page.context().newCDPSession(page);
      await session.send("Profiler.enable");
      await session.send("Profiler.start");
      metrics = await page.evaluate(() => window.measureReplay(12_000));
      const { profile } = await session.send("Profiler.stop");
      writeFileSync(".test-build/020-render.cpuprofile", JSON.stringify(profile));
      const rows = profile.nodes.filter(node => node.callFrame.url.includes("/scene/"))
        .map(({ callFrame, hitCount }) => ({ name: callFrame.functionName, file: callFrame.url.split("/").at(-1), samples: hitCount }))
        .filter(row => row.samples > 0).sort((a, b) => b.samples - a.samples);
      console.log(rows.slice(0, 15));
    } else {
      await page.evaluate(() => window.measureReplay(10_000));
      metrics = await page.evaluate(() => window.measureReplay(300_000));
    }
    const report = {
      commit: execFileSync("git", ["rev-parse", "HEAD"], {encoding: "utf8"}).trim(),
      browser: browser.version(), cpu: os.cpus()[0].model, os: os.version(),
      camera: "close", quality: "low", ...canvas, ...metrics, errors,
    };
    if (!profileOnly) writeFileSync(process.argv[2] ?? ".test-build/020-render.json", JSON.stringify(report, null, 2) + "\n");
    console.log(report);
    assert.ok(!metrics.hidden && errors.length === 0);
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
