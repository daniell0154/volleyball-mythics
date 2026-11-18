const assert = require("node:assert/strict");
const { mkdtemp, realpath, rm, writeFile } = require("node:fs/promises");
const { dirname, join, resolve } = require("node:path");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));
const { openPlayer, checkViewport, checkCourt } = require("./016-viewport.cjs");

async function run() {
  const tempRoot = await realpath(resolve(".test-build"));
  const profile = await mkdtemp(join(tempRoot, "016-zoom-"));
  const context = await chromium.launchPersistentContext(profile, {
    executablePath: chromium.executablePath(),
    headless: true, viewport: null, args: ["--window-size=1280,720"],
  });
  try {
    const settings = context.pages()[0];
    await settings.goto("chrome://settings/appearance");
    const select = settings.locator("select").filter({ has: settings.getByRole("option", { name: "200%", exact: true }) });
    await select.selectOption({ label: "200%" });
    const { page, errors } = await openPlayer({ newContext: async () => context }, "Zoom 016");
    await page.getByRole("button", { name: "Solo contra bots" }).click();
    await page.getByRole("button", { name: "Criar sala" }).click();
    await page.getByRole("button", { name: "Pronto para jogar" }).click();
    await page.getByRole("button", { name: "Iniciar partida" }).click();
    await checkViewport(page);
    await checkCourt(page);
    const metrics = await page.evaluate(() => ({
      width: innerWidth, height: innerHeight, dpr: devicePixelRatio,
      scrollWidth: document.documentElement.scrollWidth,
      footerScrollWidth: document.querySelector(".match-controls").scrollWidth,
      footerWidth: document.querySelector(".match-controls").clientWidth,
    }));
    assert.ok(Math.abs(metrics.dpr - 2) < .05 && metrics.width <= 640, JSON.stringify(metrics));
    assert.ok(metrics.scrollWidth <= metrics.width && metrics.footerScrollWidth <= metrics.footerWidth);
    const expand = page.getByRole("button", { name: "Ações", exact: true });
    await expand.press("Enter");
    await page.getByRole("button", { name: "Sacar · L" }).press("Enter");
    await page.getByText("Em jogo", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Opções", exact: true }).press("Enter");
    await page.getByLabel("Volume dos sinais sonoros").focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Escape");
    await checkCourt(page);
    assert.equal(await page.locator(".match-controls").evaluate(element => element.scrollTop), 0);
    assert.equal(await page.locator(".court-host").evaluate(element => element === document.activeElement), true);
    await expand.press("Enter");
    assert.equal(await expand.getAttribute("aria-expanded"), "false");
    const cdp = await context.newCDPSession(page);
    const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile("docs/acceptance/016-zoom.png", Buffer.from(screenshot.data, "base64"));
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ browser: context.browser().version(), zoom: "200% nativo", ...metrics }));
  } finally {
    await context.close();
    const target = await realpath(profile);
    if (dirname(target) === tempRoot) await rm(target, { recursive: true, force: true });
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
