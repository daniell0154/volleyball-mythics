const assert = require("node:assert/strict");
const { mkdtemp, realpath, rm } = require("node:fs/promises");
const { dirname, join, resolve } = require("node:path");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));
const { openPlayer, checkViewport, checkCourt } = require("./016-viewport.cjs");

async function enterSolo(page) {
  await page.getByRole("button", { name: "Solo contra bots" }).click();
  await page.getByRole("button", { name: "Criar sala" }).click();
  await page.getByRole("button", { name: "Pronto para jogar" }).click();
  await page.getByRole("button", { name: "Iniciar partida" }).click();
  await checkViewport(page);
  await checkCourt(page);
}

async function reconnect() {
  const browser = await chromium.launch({ channel: process.env.VOLLEYBALL_BROWSER || "msedge" });
  try {
    const { page, errors } = await openPlayer(browser, "Câmera 017", {}, page => page.addInitScript(() => {
      const NativeWebSocket = window.WebSocket;
      window.WebSocket = class extends NativeWebSocket {
        constructor(...args) {
          super(...args);
          if (this.url.endsWith(":3020/socket")) window.matchSocket = this;
        }
      };
    }));
    const frames = [];
    page.on("websocket", socket => socket.on("framereceived", ({ payload }) => {
      const frame = JSON.parse(String(payload));
      if (frame.type === "snapshot") frames.push(frame.payload);
    }));
    await enterSolo(page);
    await page.getByRole("button", { name: "Sacar · L" }).click();
    await page.getByText("Em jogo", { exact: true }).waitFor();
    const matchId = frames.at(-1).matchId;
    assert.equal(frames.at(-1).athletes.length, 4);
    const canvas = await page.locator(".court-host canvas").elementHandle();
    await page.evaluate(() => window.matchSocket.close(1000));
    await page.getByText("Conexão interrompida.", { exact: false }).waitFor();
    await checkCourt(page);
    await page.waitForFunction(() => window.matchSocket.readyState === WebSocket.OPEN);
    await page.getByText("Em jogo", { exact: true }).waitFor();
    await checkCourt(page);
    assert.equal(await canvas.evaluate(node => node === document.querySelector(".court-host canvas")), true);
    assert.equal(frames.at(-1).matchId, matchId);
    assert.ok(frames.some(frame => frame.phase === "disconnectedSuspension"));

    await page.setViewportSize({ width: 1920, height: 1080 });
    await checkViewport(page);
    await checkCourt(page);
    await page.getByRole("button", { name: "Opções", exact: true }).click();
    const stable = page.getByLabel("Câmera estável", { exact: false });
    await stable.check();
    assert.equal(await page.evaluate(() => localStorage.getItem("volleyball-mythics-reduced-motion")), "true");
    await checkCourt(page);
    await stable.uncheck();
    await page.getByRole("button", { name: "Fechar opções" }).click();
    await checkCourt(page);
    assert.deepEqual(errors, []);
    console.log(`Reconexão na mesma quadra, 720p → 1080p e alternância de câmera estável: OK (${browser.version()})`);
  } finally {
    await browser.close();
  }
}

async function nativeZoom() {
  const tempRoot = await realpath(resolve(".test-build"));
  const profile = await mkdtemp(join(tempRoot, "017-zoom-"));
  try {
    const context = await chromium.launchPersistentContext(profile, {
      executablePath: chromium.executablePath(), viewport: null, args: ["--window-size=1280,720"],
    });
    try {
      const settings = context.pages()[0];
      await settings.goto("chrome://settings/appearance");
      const select = settings.locator("select").filter({ has: settings.getByRole("option", { name: "200%", exact: true }) });
      await select.selectOption({ label: "200%" });
      const { page, errors } = await openPlayer({ newContext: async () => context }, "Zoom 017");
      await enterSolo(page);
      const actions = page.getByRole("button", { name: "Ações", exact: true });
      await actions.press("Enter");
      await page.getByRole("button", { name: "Sacar · L" }).press("Enter");
      await page.getByText("Em jogo", { exact: true }).waitFor();
      await checkCourt(page);
      assert.equal(await actions.getAttribute("aria-expanded"), "true");
      await actions.press("Enter");
      assert.equal(await actions.getAttribute("aria-expanded"), "false");
      await checkCourt(page);
      const viewport = await page.evaluate(() => ({
        width: innerWidth, height: innerHeight, dpr: devicePixelRatio, scrollWidth: document.documentElement.scrollWidth,
      }));
      assert.ok(Math.abs(viewport.dpr - 2) < .05 && viewport.width <= 640 && viewport.scrollWidth <= viewport.width);
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ browser: context.browser().version(), zoom: "200% nativo", ...viewport }));
    } finally {
      await context.close();
    }
  } finally {
    const target = await realpath(profile);
    if (dirname(target) === tempRoot) await rm(target, { recursive: true, force: true });
  }
}

reconnect().then(nativeZoom).catch(error => { console.error(error); process.exitCode = 1; });
