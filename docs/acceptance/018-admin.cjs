const assert = require("node:assert/strict");
const { resolve } = require("node:path");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));

const address = "http://127.0.0.1:5177/docs/acceptance/012-preview/";
const fixture = "http://127.0.0.1:3014";
const athlete = "Atleta de aceite 018";

async function openAdmin(page) {
  await page.routeWebSocket("ws://127.0.0.1:5177/**", socket => socket.send('{"type":"connected"}'));
  await page.goto(address);
  await page.getByLabel("Email", { exact: true }).fill("admin@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("fixture-only");
  await page.getByRole("button", { name: "Entrar no admin" }).click();
  await page.locator(".admin-roster-entry").filter({ hasText: "Samuel" }).waitFor({ state: "attached" });
}

async function trackAvatar(page) {
  await page.evaluate(async () => {
    const { createPresentationAvatar } = await import("/apps/web/src/scene/avatarManifest.ts");
    const { disposeAvatar } = await import("/apps/web/src/scene/avatar.ts");
    const model = createPresentationAvatar("procedural:athletic-v2:male:1", "A");
    const group = Object.getPrototypeOf(model);
    disposeAvatar(model);
    const update = group.updateMatrixWorld;
    group.updateMatrixWorld = function (...args) {
      if (this.userData.assetKey) window.avatarReadout = { key: this.userData.assetKey, angle: this.rotation.y };
      return update.apply(this, args);
    };
  });
}

async function editor(page) {
  await openAdmin(page);
  const samuel = page.locator(".admin-roster-entry").filter({ hasText: "Samuel" });
  await samuel.click();
  await page.getByText("Histórico de Samuel", { exact: true }).click();
  await page.getByRole("button", { name: "v1 · Publicado · 85" }).waitFor();
  await page.getByLabel("Nome", { exact: true }).fill("Samuel em edição");
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Novo personagem" }).click();
  assert.equal(await page.getByLabel("Nome", { exact: true }).inputValue(), "Samuel em edição");
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Novo personagem" }).click();
  await page.getByLabel("Nome", { exact: true }).fill(athlete);

  const panels = await page.locator(".admin-layout > section").evaluateAll(items =>
    items.map(item => { const rect = item.getBoundingClientRect(); return [rect.left, rect.top]; }));
  assert.equal(new Set(panels.map(([, top]) => top)).size, 1);
  assert.ok(panels[0][0] < panels[1][0] && panels[1][0] < panels[2][0]);
  await page.locator(".admin-appearance").evaluate(block => block.scrollIntoView({ block: "center" }));
  const previewTop = await page.locator(".admin-preview").evaluate(block => block.getBoundingClientRect().top);
  assert.ok(previewTop >= 0 && previewTop < 120);

  const slider = page.getByRole("slider", { name: "Ajustar saque" });
  await slider.press("End");
  assert.equal(await page.getByLabel("Saque", { exact: true }).inputValue(), "100");
  await page.getByLabel("Saque", { exact: true }).fill("90");
  assert.equal(await slider.inputValue(), "90");
  assert.equal(await page.locator(".admin-overall output").innerText(), "56");
  await page.getByLabel("Modelo", { exact: true }).selectOption("athletic:female");
  const preview = page.getByRole("region", { name: /Prévia do atleta/ });
  await preview.locator("canvas").waitFor();
  await page.waitForFunction(() => document.querySelectorAll(".admin-hair img").length === 8);
  const thumbnailRows = await page.locator(".admin-hair button").evaluateAll(cards =>
    Object.values(Object.groupBy(cards, card => card.offsetTop)).map(row => row.length));
  assert.deepEqual(thumbnailRows, [4, 4]);
  const canvas = await preview.locator("canvas").elementHandle();
  await trackAvatar(page);
  await preview.press("Home");
  await preview.press("ArrowRight");
  const angle = Math.PI / 8;
  assert.equal(await page.evaluate(() => window.avatarReadout.angle), angle);
  const rectangle = await preview.boundingBox();
  await page.mouse.move(rectangle.x + rectangle.width / 2, rectangle.y + rectangle.height / 2);
  await page.mouse.down();
  await page.mouse.move(rectangle.x + rectangle.width / 2 + 40, rectangle.y + rectangle.height / 2, { steps: 4 });
  await page.mouse.up();
  assert.ok(await page.evaluate(() => window.avatarReadout.angle) > angle);
  await page.getByRole("button", { name: "Frente", exact: true }).click();
  await preview.press("ArrowRight");

  await page.getByRole("button", { name: "Escura", exact: true }).press("Space");
  await page.getByRole("button", { name: "Cacheado", exact: true }).press("Enter");
  const look = await page.evaluate(() => window.avatarReadout);
  assert.deepEqual(look, { key: "procedural:visual-v3:athletic:female:1:deep:curly", angle });
  assert.equal(await canvas.evaluate(node => node === document.querySelector(".admin-preview canvas")), true);
  assert.equal(await page.locator(".admin-layout canvas").count(), 1);
  assert.equal(await page.getByRole("button", { name: "Escura", exact: true }).getAttribute("aria-pressed"), "true");
  assert.equal(await page.getByRole("button", { name: "Cacheado", exact: true }).getAttribute("aria-pressed"), "true");
  return look;
}

async function fallback(browser) {
  const page = await browser.newPage();
  try {
    await page.addInitScript(() => {
      const context = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...settings) {
        return kind.startsWith("webgl") ? null : context.call(this, kind, ...settings);
      };
    });
    await openAdmin(page);
    await page.getByRole("button", { name: "Novo personagem" }).click();
    const preview = page.locator("#admin-preview");
    await preview.getByRole("status").filter({ hasText: "Modelo 3D indisponível" }).waitFor();
    await page.getByRole("button", { name: "Escura", exact: true }).click();
    await preview.getByRole("status").filter({ hasText: "pele escura" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Salvar rascunho" }).isEnabled(), true);
  } finally {
    await page.close();
  }
}

async function run() {
  const browser = await chromium.launch({ channel: process.env.VOLLEYBALL_BROWSER || "msedge" });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await editor(page);
    await fallback(browser);
    assert.deepEqual(errors, []);
    console.log(`018-T3: ficha, galeria, mouse, teclado, um canvas e fallback WebGL aprovados no Edge ${browser.version()}`);
  } finally {
    await browser.close();
  }
}

if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { openAdmin, editor, fallback, address, fixture, athlete };
