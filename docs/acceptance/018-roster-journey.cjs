const assert = require("node:assert/strict");
const { mkdtemp, realpath, rm, writeFile } = require("node:fs/promises");
const { dirname, join, resolve } = require("node:path");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));
const { openAdmin, editor, address, fixture, athlete } = require("./018-admin.cjs");

const artifacts = "docs/acceptance/";
const rosterRow = page => page.locator(".admin-roster-entry").filter({ hasText: athlete });
const expectedKey = "procedural:visual-v3:athletic:female:1:deep:curly";

async function draftAndPublish(page) {
  await editor(page);
  await page.getByRole("button", { name: "Salvar rascunho", exact: true }).click();
  await page.getByText("Rascunho salvo.", { exact: false }).waitFor();
  const list = async () => (await (await page.request.get(fixture + "/list")).json());
  const saved = (await list()).drafts.find(row => row.payload.name === athlete);
  assert.equal(saved.payload.assetKey, expectedKey);
  assert.equal((await list()).published.some(row => row.id === saved.id), false);
  await openAdmin(page);
  await rosterRow(page).click();
  assert.equal(await page.getByLabel("Saque", { exact: true }).inputValue(), "90");
  assert.equal(await page.getByRole("button", { name: "Escura", exact: true }).getAttribute("aria-pressed"), "true");
  assert.equal(await page.getByRole("button", { name: "Cacheado", exact: true }).getAttribute("aria-pressed"), "true");
  await page.waitForFunction(() => document.querySelectorAll(".admin-hair img").length === 8);
  await page.screenshot({ path: artifacts + "018-desktop.png", fullPage: true });

  await page.getByRole("button", { name: "Publicar revisão", exact: true }).click();
  await page.getByText("Nova revisão publicada.", { exact: false }).waitFor();
  const catalog = await (await page.request.get(fixture + "/catalog")).json();
  const published = catalog.find(row => row.id === saved.id);
  assert.deepEqual([published.version, published.overall, published.assetKey], [1, 56, expectedKey]);
  return published;
}

async function narrow(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  const toggle = page.getByRole("button", { name: "Mostrar elenco" });
  await toggle.waitFor();
  assert.equal(await rosterRow(page).isVisible(), false);
  await toggle.press("Enter");
  await rosterRow(page).waitFor();
  const history = page.getByText(`Histórico de ${athlete}`, { exact: true });
  await history.click();
  await page.getByRole("button", { name: "v1 · Publicado · 56" }).waitFor();
  await page.getByRole("button", { name: "Recolher elenco" }).press("Enter");

  const focus = [];
  await page.getByRole("link", { name: "Voltar ao jogo" }).focus();
  for (let step = 0; step < 60; step++) {
    await page.keyboard.press("Tab");
    const current = await page.evaluate(() => {
      const target = document.activeElement;
      return target.id || target.getAttribute("aria-label") || target.textContent.trim();
    });
    focus.push(current);
    if (current === "Girar à direita") break;
  }
  for (const key of ["Ajustar saque", "admin-serve", "Escura", "Cacheado", "Ir à prévia", "Girar à direita"]) {
    assert.ok(focus.includes(key), `Tab não alcançou '${key}': ${focus.join(", ")}`);
  }
  await page.getByRole("link", { name: "Ir à prévia" }).press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.id), "admin-preview");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  await page.screenshot({ path: artifacts + "018-compacto.png", fullPage: true });
  return focus.length;
}

async function zoom() {
  const root = await realpath(resolve(".test-build"));
  const profile = await mkdtemp(join(root, "018-zoom-"));
  try {
    const context = await chromium.launchPersistentContext(profile, {
      executablePath: chromium.executablePath(), viewport: null, args: ["--window-size=1280,720"],
    });
    try {
      const settings = context.pages()[0];
      await settings.goto("chrome://settings/appearance");
      const select = settings.locator("select").filter({ has: settings.getByRole("option", { name: "200%", exact: true }) });
      await select.selectOption({ label: "200%" });
      const page = await context.newPage();
      await openAdmin(page);
      await page.getByRole("button", { name: "Mostrar elenco" }).press("Enter");
      await rosterRow(page).click();
      await page.getByRole("link", { name: "Ir à prévia" }).press("Enter");
      await page.getByRole("region", { name: /Prévia do atleta/ }).press("Home");
      const viewport = await page.evaluate(() => ({
        width: innerWidth, height: innerHeight, dpr: devicePixelRatio, scrollWidth: document.documentElement.scrollWidth,
      }));
      assert.ok(viewport.width <= 640 && Math.abs(viewport.dpr - 2) < .05 && viewport.scrollWidth <= viewport.width);
      return { browser: context.browser().version(), ...viewport };
    } finally {
      await context.close();
    }
  } finally {
    const target = await realpath(profile);
    if (dirname(target) === root) await rm(target, { recursive: true, force: true });
  }
}

async function court(browser, published) {
  const players = [];
  const errors = [];
  let snapshot;
  try {
    for (let index = 0; index < 4; index++) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      players.push(page);
      page.on("pageerror", error => errors.push(error.message));
      await page.routeWebSocket("ws://127.0.0.1:5177/**", socket => socket.send('{"type":"connected"}'));
      if (index % 2 === 1) await page.addInitScript(() => {
        const current = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
          return kind.startsWith("webgl") ? null : current.call(this, kind, ...args);
        };
      });
      if (index === 0) page.on("websocket", socket => socket.on("framereceived", ({ payload }) => {
        const event = JSON.parse(String(payload));
        if (event.type === "snapshot") snapshot = event.payload;
      }));
      await page.goto(address + "?game");
      await page.getByLabel("Seu apelido", { exact: true }).fill(`Jogador ${index + 1}`);
      await page.getByRole("button", { name: athlete, exact: true }).click();
      if (index % 2 === 0) await page.locator(".athlete-stage canvas").waitFor();
    }

    const owner = players[0];
    await owner.getByRole("button", { name: "Criar sala", exact: true }).click();
    const invite = new URL(await owner.getByLabel("Link de convite").inputValue());
    for (const page of players.slice(1)) {
      await page.getByLabel("Código da sala").fill(invite.searchParams.get("room"));
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      await page.getByLabel("Sala e participantes").waitFor();
    }
    for (const page of players) await page.getByRole("button", { name: "Pronto para jogar" }).click();
    await owner.getByRole("button", { name: "Iniciar partida" }).click();
    for (const [index, side] of [[0, "A"], [2, "B"]]) {
      const player = players[index];
      await player.getByText(`Você · ${side}1`, { exact: true }).waitFor();
      await player.locator(".court-host canvas").waitFor();
      await player.locator(".court-host [data-ball-cue]").waitFor({ state: "visible" });
      await player.screenshot({ path: artifacts + `018-quadra-${side}.png` });
    }
    assert.equal(snapshot.athletes.length, 4);
    assert.deepEqual([...new Set(snapshot.athletes.map(actor => actor.team))].sort(), ["A", "B"]);
    assert.ok(snapshot.athletes.every(actor => actor.assetKey === published.assetKey));
    assert.deepEqual(errors, []);
  } finally {
    for (const page of players) await page.close();
  }
}

async function run() {
  const browser = await chromium.launch({ channel: process.env.VOLLEYBALL_BROWSER || "msedge" });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const published = await draftAndPublish(page);
    const tabStops = await narrow(page);
    assert.deepEqual(errors, []);
    await page.close();
    const nativeZoom = await zoom();
    await court(browser, published);
    const report = {
      browser: browser.version(), published: { overall: published.overall, assetKey: published.assetKey },
      desktop: [1440, 1080], narrow: [390, 844], tabStops, nativeZoom,
      teams: ["A", "B"], athletes: 4, auth: "fixture local; RPC e runtime reais",
    };
    await writeFile(artifacts + "018-results.json", JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify(report));
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
