const assert = require("node:assert/strict");
const { resolve } = require("node:path");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));

async function openPlayer(browser, name, options = {}, preparePage = async () => {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...options });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.routeWebSocket("ws://127.0.0.1:5180/**", socket => socket.send(JSON.stringify({ type: "connected" })));
  await preparePage(page);
  await page.goto("http://127.0.0.1:5180/docs/acceptance/015-preview/");
  await page.getByLabel("Seu apelido", { exact: true }).fill(name);
  return { page, context, errors };
}

async function checkViewport(page) {
  await page.getByRole("main", { name: "Quadra e controles" }).waitFor();
  assert.equal(await page.locator(".app-header, .app-shell").count(), 0);
  const sizes = await page.locator(".match-viewport").evaluate(element => ({
    width: element.clientWidth, height: element.clientHeight,
    viewportWidth: innerWidth, viewportHeight: innerHeight,
    scrollY, overflow: getComputedStyle(document.body).overflow,
  }));
  assert.equal(sizes.width, sizes.viewportWidth);
  assert.equal(sizes.height, sizes.viewportHeight);
  assert.equal(sizes.scrollY, 0);
  assert.equal(sizes.overflow, "hidden");
}

async function checkCourt(page) {
  const canvas = page.locator(".court-host canvas");
  await canvas.waitFor();
  await page.waitForFunction(() => {
    const court = document.querySelector(".court-host");
    const canvas = court?.querySelector("canvas");
    const hud = document.querySelector(".match-hud");
    const controls = document.querySelector(".match-controls");
    if (!court || !canvas || !hud || !controls) return false;
    const area = court.getBoundingClientRect(), draw = canvas.getBoundingClientRect();
    return area.height > 0 && Math.abs(draw.height - area.height) < 1 &&
      Math.abs(draw.width - area.width) < 1 &&
      area.top >= hud.getBoundingClientRect().bottom && area.bottom <= controls.getBoundingClientRect().top;
  });
  return canvas.boundingBox();
}

async function run() {
  const browser = await chromium.launch({ channel: process.env.VOLLEYBALL_BROWSER || "msedge", headless: true });
  try {
    const { page, errors } = await openPlayer(browser, "Viewport 016");
    assert.equal(await page.locator(".app-header").count(), 1);
    await page.getByRole("button", { name: "Solo contra bots" }).click();
    await page.getByRole("button", { name: "Criar sala" }).click();
    await page.getByRole("button", { name: "Pronto para jogar" }).click();
    await page.getByRole("button", { name: "Iniciar partida" }).click();
    await checkViewport(page);
    const closed = await checkCourt(page);

    const options = page.getByRole("button", { name: "Opções", exact: true });
    await options.click();
    const opened = await checkCourt(page);
    assert.ok(opened.height < closed.height);
    const enter = page.getByRole("button", { name: "Tela cheia do navegador" });
    await enter.click();
    await page.getByRole("button", { name: "Sair da tela cheia" }).waitFor();
    assert.equal(await page.evaluate(() => document.fullscreenElement?.className), "match-viewport");
    await page.evaluate(() => document.exitFullscreen());
    await enter.waitFor();
    await page.evaluate(() => {
      Element.prototype.requestFullscreen = () => Promise.reject(new DOMException("Fixture", "NotAllowedError"));
    });
    await enter.click();
    await page.getByText("Tela cheia do navegador indisponível.", { exact: false }).waitFor();
    await checkViewport(page);
    await page.keyboard.press("Escape");
    assert.equal(await options.getAttribute("aria-expanded"), "false");
    assert.equal(await page.locator(".court-host").evaluate(element => element === document.activeElement), true);
    await checkCourt(page);

    await page.getByRole("button", { name: /Abandonar partida|Sair da sala/ }).click();
    await page.locator(".app-header").waitFor();
    assert.equal(await page.getByLabel("Seu apelido", { exact: true }).evaluate(element => element === document.activeElement), true);
    assert.deepEqual(errors, []);
    console.log(`016-T1 viewport, fullscreen, recusa e retorno ao lobby: OK (Edge ${browser.version()})`);
  } finally {
    await browser.close();
  }
}

if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { openPlayer, checkViewport, checkCourt };
