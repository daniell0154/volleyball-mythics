const assert = require("node:assert/strict");
const { writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));

const origin = "http://127.0.0.1:" + (process.env.VOLLEYBALL_FIXTURE_SOCKET_PORT ?? 3024);
const catalogPort = process.env.VOLLEYBALL_FIXTURE_CATALOG_PORT ?? 3025;
const output = process.argv[2] ?? ".test-build/020-loading.json";

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
    const scripts = () => page.evaluate(() => Object.fromEntries(performance.getEntriesByType("resource")
      .filter(entry => entry.name.endsWith(".js")).map(entry => [new URL(entry.name).pathname, entry.encodedBodySize])));
    const errors = [], sockets = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("websocket", socket => {
      sockets.push(socket.url());
      socket.on("socketerror", error => sockets.push(error));
    });
    await page.addInitScript(trackResources);
    const catalogResponse = await fetch("http://127.0.0.1:" + catalogPort);
    assert.ok(catalogResponse.ok);
    const catalog = await catalogResponse.json();
    await page.route(origin + "/020-catalog", request => request.fulfill({ json: catalog }));
    const cdp = await page.context().newCDPSession(page);
    const resourceCounts = async () => {
      await cdp.send("HeapProfiler.collectGarbage");
      return { ...await page.evaluate(() => ({ ...window.fixtureCounts, canvases: document.querySelectorAll("canvas").length })),
        heapBytes: (await cdp.send("Runtime.getHeapUsage")).usedSize };
    };
    const start = Date.now();
    await page.goto(origin);
    await page.locator(".athlete-stage canvas").waitFor().catch(async error => {
      throw new Error(JSON.stringify({ body: await page.locator("body").innerText(), scripts: await scripts(), errors }), { cause: error });
    });
    const lobbyScripts = await scripts();
    const lobby = { ms: Date.now() - start, scripts: lobbyScripts, jsBytes: Object.values(lobbyScripts).reduce((a, b) => a + b, 0) };
    const cycles = [];
    for (let index = 0; index < 10; index++) {
      await page.getByLabel("Seu apelido").fill("Benchmark local");
      await page.getByRole("button", {name: "Solo contra bots"}).click();
      const enter = Date.now();
      await page.getByRole("button", {name: "Criar sala"}).click();
      await page.getByRole("button", {name: "Pronto para jogar"}).click({timeout: 10_000}).catch(async error => {
        throw new Error(JSON.stringify({ cycle: index + 1, body: await page.locator("body").innerText(), sockets, errors }), { cause: error });
      });
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
    const report = { browser: browser.version(), lobby, scriptsAfterMatch: await scripts(), cycles, errors };
    writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
    console.log(report);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
