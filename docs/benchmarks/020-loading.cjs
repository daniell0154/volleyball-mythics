const assert = require("node:assert/strict");
const { readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));

const origin = "http://127.0.0.1:5180";
const route = "/020-build/";
const build = resolve(process.argv[2] ?? ".test-build/020-web");
const output = process.argv[3] ?? ".test-build/020-loading.json";

function trackResources() {
  const counts = { contexts: 0, buffers: 0, textures: 0 };
  window.fixtureCounts = counts;
  const resources = new WeakMap();
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    const gl = getContext.call(this, type, ...args);
    if (gl && type.startsWith("webgl") && !resources.has(gl)) {
      const local = { buffers: new Set(), textures: new Set() };
      resources.set(gl, local);
      counts.contexts++;
      this.addEventListener("webglcontextlost", () => {
        counts.contexts--;
        for (const key of ["buffers", "textures"]) { counts[key] -= local[key].size; local[key].clear(); }
      }, { once: true });
      for (const [type, key] of [["Buffer", "buffers"], ["Texture", "textures"]]) {
        const allocate = gl["create" + type].bind(gl);
        const release = gl["delete" + type].bind(gl);
        gl["create" + type] = () => {
          const resource = allocate();
          if (resource) { local[key].add(resource); counts[key]++; }
          return resource;
        };
        gl["delete" + type] = resource => {
          if (local[key].delete(resource)) counts[key]--;
          release(resource);
        };
      }
    }
    return gl;
  };
}

async function run() {
  const browser = await chromium.launch({ channel: process.env.VOLLEYBALL_BROWSER || "msedge" });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const scripts = new Map();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(trackResources);
    await page.route(origin + route + "**", async request => {
      const name = new URL(request.request().url()).pathname.slice(route.length) || "index.html";
      assert.match(name, /^(?:index\.html|assets\/[\w.-]+\.(?:css|js))$/);
      const path = resolve(build, name);
      const body = readFileSync(path);
      if (name.endsWith(".js")) scripts.set(name, body.length);
      const contentType = name.endsWith(".js") ? "text/javascript" : name.endsWith(".css") ? "text/css" : "text/html";
      await request.fulfill({ body, contentType: contentType + "; charset=UTF-8" });
    });
    const cdp = await page.context().newCDPSession(page);
    const resourceCounts = async () => {
      await cdp.send("HeapProfiler.collectGarbage");
      return { ...await page.evaluate(() => ({ ...window.fixtureCounts, canvases: document.querySelectorAll("canvas").length })),
        heapBytes: (await cdp.send("Runtime.getHeapUsage")).usedSize };
    };
    const start = await page.evaluate(() => Date.now());
    await page.goto(origin + route);
    await page.locator(".athlete-stage canvas").waitFor().catch(async error => {
      throw new Error(JSON.stringify({ body: await page.locator("body").innerText(), scripts: [...scripts.keys()], errors }), { cause: error });
    });
    const lobby = { ms: Date.now() - start, scripts: Object.fromEntries(scripts), jsBytes: [...scripts.values()].reduce((a, b) => a + b, 0) };
    const cycles = [];
    for (let index = 0; index < 10; index++) {
      await page.getByLabel("Seu apelido").fill("Benchmark local");
      await page.getByRole("button", {name: "Solo contra bots"}).click();
      const enter = Date.now();
      await page.getByRole("button", {name: "Criar sala"}).click();
      await page.getByRole("button", {name: "Pronto para jogar"}).click();
      await page.getByRole("button", {name: "Iniciar partida"}).click();
      await page.locator(".court-host canvas").waitFor();
      await page.getByRole("button", {name: "Sacar · L"}).filter({visible: true}).waitFor();
      const serve = page.getByRole("button", {name: "Sacar · L"});
      await page.waitForFunction(() => !document.querySelector("[aria-label='Sacar · L']")?.disabled);
      const playableMs = Date.now() - enter;
      if (index === 0) {
        await serve.click();
        await page.getByText("Em jogo", {exact: true}).waitFor();
        await page.getByRole("region", {name: "Resultado da partida"}).waitFor({timeout: 150_000});
        await page.getByRole("button", {name: "Quero revanche"}).click();
        await page.getByText("Prepare-se", {exact: false}).first().waitFor();
      }
      await page.getByRole("button", {name: "Abandonar partida"}).click();
      await page.locator(".athlete-stage canvas").waitFor();
      await page.waitForFunction(() => window.fixtureCounts.contexts === 1);
      const after = await resourceCounts();
      assert.equal(after.canvases, 1);
      cycles.push({ playableMs, ...after });
    }
    const report = { browser: browser.version(), lobby, scriptsAfterMatch: Object.fromEntries(scripts), cycles, errors };
    writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
    console.log(report);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
