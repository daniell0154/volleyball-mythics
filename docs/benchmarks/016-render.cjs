const { readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const os = require("node:os");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));

async function run() {
  const width = 1280, height = 720, dpr = 1;
  const referencePath = process.argv[2];
  const rows = referencePath ? [JSON.parse(readFileSync(referencePath, "utf8"))] : [];
  if (referencePath && (rows[0].variant !== "baseline" || rows[0].durationMs < 300000 ||
    rows[0].canvas.width !== width || rows[0].canvas.height !== height)) throw new Error("Referência incompleta ou incompatível.");
  const channel = process.env.VOLLEYBALL_BROWSER || "msedge";
  const browser = await chromium.launch({ channel, headless: true });
  try {
    for (const variant of referencePath ? ["candidate"] : ["baseline", "candidate"]) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
      await page.routeWebSocket("ws://127.0.0.1:5180/**", socket => socket.send(JSON.stringify({ type: "connected" })));
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:5180/docs/benchmarks/016-render.html?variant=${variant}`);
      await page.waitForFunction(() => typeof window.measureReplay === "function").catch(error => {
        throw new Error(`${error.message}\n${errors.join("\n")}`);
      });
      const canvas = await page.locator("canvas").boundingBox();
      const gpu = await page.evaluate(() => {
        const gl = document.createElement("canvas").getContext("webgl2");
        const debug = gl?.getExtension("WEBGL_debug_renderer_info");
        return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null;
      });
      await page.evaluate(() => window.replayAt(2));
      await page.screenshot({ path: `docs/benchmarks/016-${variant}.png` });
      const clip = await page.evaluate(async () => {
        const recorder = new MediaRecorder(document.querySelector("canvas").captureStream(30), { mimeType: "video/webm" });
        const parts = [];
        recorder.ondataavailable = event => parts.push(event.data);
        const stopped = new Promise(resolve => { recorder.onstop = resolve; });
        recorder.start();
        await window.measureReplay(6000);
        recorder.stop();
        await stopped;
        return Array.from(new Uint8Array(await new Blob(parts).arrayBuffer()));
      });
      writeFileSync(`docs/benchmarks/016-${variant}.webm`, Buffer.from(clip));
      console.log(`Iniciando cinco minutos de medição: ${variant}, canvas ${canvas.width}×${canvas.height}, ${gpu}`);
      const metrics = await page.evaluate(() => window.measureReplay(300000));
      const row = { variant, canvas: { width: canvas.width, height: canvas.height }, gpu, ...metrics, errors };
      rows.push(row);
      if (variant === "baseline") writeFileSync(".test-build/016-reference.json", JSON.stringify(row, null, 2) + "\n");
      console.log(JSON.stringify(row));
      await page.close();
    }
    const [baseline, candidate] = rows;
    const regressionPercent = (candidate.p95Ms / baseline.p95Ms - 1) * 100;
    const pass = rows.every(row => !row.hidden && row.errors.length === 0) && baseline.gpu === candidate.gpu &&
      candidate.p95Ms <= 33.3 && regressionPercent <= 10;
    const report = {
      date: new Date().toISOString(), browser: browser.version(), cpu: os.cpus()[0].model, os: os.version(), width, height, dpr,
      quality: "low", scenario: `Replay 014 v4, quatro atletas, câmera estável, mesma sequência, ${channel} headless`,
      baselineCommit: "1ee43f0", rows, regressionPercent, pass,
    };
    writeFileSync("docs/benchmarks/016-render.json", JSON.stringify(report, null, 2) + "\n");
    if (!pass) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
