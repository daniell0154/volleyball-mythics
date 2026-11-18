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
    const viewport = document.querySelector(".match-viewport").getBoundingClientRect();
    const area = court.getBoundingClientRect(), draw = canvas.getBoundingClientRect();
    const cue = court.querySelector("[data-ball-cue]");
    const sameSize = [area, draw].every(rect => Math.abs(rect.height - viewport.height) < 1 &&
      Math.abs(rect.width - viewport.width) < 1 && rect.top === viewport.top && rect.left === viewport.left);
    if (!sameSize || !cue || cue.style.display === "none") return false;
    const ball = cue.getBoundingClientRect();
    return ball.top >= hud.getBoundingClientRect().bottom && ball.bottom <= controls.getBoundingClientRect().top;
  });
  return canvas.boundingBox();
}

async function checkContrast(page) {
  const ratios = await page.evaluate(() => {
    const color = (selector, property) => getComputedStyle(document.querySelector(selector))[property];
    const luminance = color => color.match(/[\d.]+/g).slice(0, 3)
      .map(channel => Number(channel) / 255)
      .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4)
      .reduce((total, channel, index) => total + channel * [.2126, .7152, .0722][index], 0);
    return [
      [".scoreboard strong", ".scoreboard"], [".match-phase", ".scoreboard"],
      [".match-identity", ".match-identity"], [".move-tip", ".match-toolbar"],
      [".match-toolbar button[aria-expanded]:not(.expand-actions)", ".match-toolbar button[aria-expanded]:not(.expand-actions)"],
    ].map(([text, background]) => {
      const values = [luminance(color(text, "color")), luminance(color(background, "backgroundColor"))];
      return (Math.max(...values) + .05) / (Math.min(...values) + .05);
    });
  });
  const minimum = Math.min(...ratios);
  assert.ok(minimum >= 4.5, JSON.stringify(ratios));
  return minimum;
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
    const minimumContrast = await checkContrast(page);
    await page.getByRole("button", { name: "Sacar · L" }).click();
    await page.getByText("Em jogo", { exact: true }).waitFor();
    await page.screenshot({ path: "docs/acceptance/016-match.png" });

    const options = page.getByRole("button", { name: "Opções", exact: true });
    await options.click();
    const opened = await checkCourt(page);
    assert.deepEqual(opened, closed);
    const enter = page.getByRole("button", { name: "Tela cheia do navegador" });
    const tabStops = new Set();
    for (let step = 0; step < 16 && !tabStops.has("Tela cheia do navegador"); step++) {
      await page.keyboard.press("Tab");
      tabStops.add(await page.evaluate(() => document.activeElement.getAttribute("aria-label") || document.activeElement.textContent.trim()));
    }
    assert.ok(tabStops.has("Volume dos sinais sonoros") && tabStops.has("Tela cheia do navegador"), [...tabStops].join(", "));
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
    console.log(`016 viewport, Tab, fullscreen, recusa e retorno ao lobby: OK (Edge ${browser.version()}, contraste mínimo ${minimumContrast.toFixed(2)}:1)`);
  } finally {
    await browser.close();
  }
}

if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { openPlayer, checkViewport, checkCourt };
