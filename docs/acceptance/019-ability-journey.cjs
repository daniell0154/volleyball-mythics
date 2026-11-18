const assert = require("node:assert/strict");
const { writeFile } = require("node:fs/promises");
const { resolve } = require("node:path");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));
const { login, address, fixture } = require("./019-ability-picker.cjs");

const abilities = {
  coffee_break: "Fixture 019 Café",
  butter_fingers: "Fixture 019 Manteiga",
  my_ball: "Fixture 019 Minha Bola",
};
const files = "docs/acceptance/";
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const button = (page, name) => page.getByRole("button", { name, exact: typeof name === "string" });

async function request(page, route, data) {
  const response = data === undefined ? await page.request.get(fixture + route) : await page.request.post(fixture + route, { data });
  const payload = await response.json();
  assert.ok(response.ok(), JSON.stringify(payload));
  return payload;
}

async function publishCandidates(page) {
  await login(page);
  assert.ok((await request(page, "/catalog")).every(entry => !Object.hasOwn(abilities, entry.abilityId)));
  const published = [];
  let checkedUnavailable = false;
  for (const [abilityId, name] of Object.entries(abilities)) {
    await button(page, "Novo personagem").click();
    await page.getByLabel("Nome", { exact: true }).fill(name);
    const picker = page.getByLabel("Habilidade", { exact: true });
    if (abilityId === "coffee_break") {
      await page.evaluate(() => { Math.random = () => .30; });
      await button(page, "Sortear habilidade").press("Enter");
    } else {
      await picker.selectOption(abilityId);
    }
    assert.equal(await picker.inputValue(), abilityId);
    const sent = page.waitForRequest(request => request.url() === fixture + "/write" && request.postDataJSON().action === "save");
    await button(page, "Salvar rascunho").click();
    assert.equal((await sent).postDataJSON().payload.abilityId, abilityId);
    await page.getByText("Rascunho salvo.", { exact: false }).waitFor();
    const draft = (await request(page, "/list")).drafts.find(entry => entry.payload.name === name);
    assert.equal(draft.revision, 1);
    assert.equal(draft.payload.abilityId, abilityId);
    await login(page);
    await page.locator(".admin-roster-entry").filter({ hasText: name }).click();
    assert.equal(await picker.inputValue(), abilityId);
    await button(page, "Salvar rascunho").click();
    await page.getByText("Rascunho salvo.", { exact: false }).waitFor();
    const reopened = (await request(page, "/list")).drafts.find(entry => entry.id === draft.id);
    assert.deepEqual(reopened, { ...draft, revision: 2 });

    if (abilityId === "my_ball") {
      await request(page, "/ability-availability", { id: abilityId, enabled: false });
      await button(page, "Publicar revisão").click();
      await page.getByRole("alert").filter({ hasText: "A habilidade selecionada ficou indisponível." }).waitFor();
      await picker.locator("option:checked").filter({ hasText: "indisponível" }).waitFor({ state: "attached" });
      assert.equal(await picker.inputValue(), abilityId);
      assert.equal(await page.getByLabel("Nome", { exact: true }).inputValue(), name);
      assert.deepEqual((await request(page, "/list")).drafts.find(entry => entry.id === draft.id), reopened);
      assert.ok(!(await request(page, "/catalog")).some(entry => entry.id === draft.id));
      await request(page, "/ability-availability", { id: abilityId, enabled: true });
      await button(page, "Recarregar lista").click();
      checkedUnavailable = true;
    }
    await button(page, "Publicar revisão").click();
    await page.getByText("Nova revisão publicada.", { exact: false }).waitFor();
    const entry = (await request(page, "/catalog")).find(entry => entry.id === draft.id);
    const canonical = (await request(page, "/list")).abilities.find(ability => ability.id === abilityId);
    assert.deepEqual([entry.version, entry.abilityId, entry.abilityConfig], [1, abilityId, canonical.ability_config]);
    published.push({ abilityId, version: entry.version, duration: entry.abilityConfig.durationSeconds, cooldown: entry.abilityConfig.cooldownSeconds });
  }
  assert.ok(checkedUnavailable);
  await page.screenshot({ path: files + "019-admin.png" });
  return published;
}

async function openPlayer(browser, name, slot, video) {
  const viewport = { width: 960, height: 540 };
  const context = await browser.newContext({ viewport, ...(video && { recordVideo: { dir: ".test-build/019-video", size: viewport } }) });
  try {
    // Keep four WebGL peers affordable on the fixture machine. Server ticks stay at 60 Hz.
    await context.addInitScript(() => {
      window.requestAnimationFrame = callback => window.setTimeout(() => callback(performance.now()), 33);
      window.cancelAnimationFrame = handle => window.clearTimeout(handle);
    });
    const page = await context.newPage();
    const errors = [], feedback = [], frames = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("websocket", socket => socket.on("framereceived", ({ payload }) => {
      const frame = JSON.parse(String(payload));
      if (frame.type === "actionFeedback") feedback.push(frame.payload.message);
      if (frame.type === "snapshot") frames.push(frame.payload);
    }));
    await page.routeWebSocket("ws://127.0.0.1:5177/**", socket => socket.send('{"type":"connected"}'));
    await page.goto(address + "?game");
    await page.getByLabel("Seu apelido", { exact: true }).fill("Jogador " + slot);
    await button(page, name).click();
    return { page, context, errors, feedback, frames, video };
  } catch (error) {
    await context.close();
    throw error;
  }
}

async function withMatch(browser, selections, videos, test) {
  const players = [];
  let completed = false;
  try {
    for (const [index, name] of selections.entries()) {
      players.push(await openPlayer(browser, name, ["A1", "A2", "B1", "B2"][index], videos[index]));
    }
    const owner = players[0].page;
    await button(owner, "Criar sala").click();
    const code = new URL(await owner.getByLabel("Link de convite").inputValue()).searchParams.get("room");
    for (const { page } of players.slice(1)) {
      await page.getByLabel("Código da sala").fill(code);
      await button(page, "Entrar").click();
      await page.getByLabel("Sala e participantes").waitFor();
    }
    for (const { page } of players) await button(page, "Pronto para jogar").click();
    await button(owner, "Iniciar partida").click();
    await button(owner, "Sacar · L").click();
    await owner.getByText("Em jogo", { exact: true }).waitFor();
    const state = () => request(owner, "/ability-state", { room: code });
    const ball = (mode, slot, distance) => request(owner, "/ability-ball", { room: code, mode, slot, distance });
    await ball("hold");
    // The serving athlete still has six ticks of contact recovery after the opening serve.
    const opening = (await state()).tick;
    for (let attempt = 0; attempt < 30 && (await state()).tick < opening + 6; attempt++) await delay(30);
    assert.ok((await state()).tick >= opening + 6);
    const result = await test(players, state, ball);
    players.forEach(player => assert.deepEqual(player.errors, []));
    completed = true;
    return result;
  } finally {
    for (const { context, page, video } of players) {
      const artifact = page.video();
      await context.close();
      if (completed && video) await artifact.saveAs(files + video);
    }
  }
}

async function assertFeedback(player, offset, expected) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (player.feedback.slice(offset).some(message => expected.test(message))) return;
    await delay(25);
  }
  throw Error(`Feedback ${expected} ausente após: ${player.feedback.slice(offset).join(", ")}`);
}

async function act(player, action, feedback) {
  await player.page.bringToFront();
  const offset = player.feedback.length;
  await button(player.page, action).click();
  await assertFeedback(player, offset, feedback);
}

async function receive(player, ball, slot, distance, accepted) {
  await ball("probe", slot, distance);
  await act(player, "Receber / bloquear · J", accepted ? /^Recepção!$/ : /Chegue mais perto da bola/);
  await ball("hold");
  if (accepted) await delay(120);
}

async function waitUntilExpired(state, slot) {
  for (let attempt = 0; attempt < 180; attempt++) {
    const snapshot = await state();
    if (snapshot.athletes[slot].effect === null) return snapshot;
    await delay(40);
  }
  throw Error(`Efeito em ${slot} ainda ativo`);
}

async function movement(player, key) {
  await player.page.bringToFront();
  await player.page.locator(".court-host").focus();
  const offset = Math.max(0, player.frames.length - 1);
  await player.page.keyboard.down(key);
  await delay(230);
  await player.page.keyboard.up(key);
  await delay(100);
  const frames = player.frames.slice(offset);
  const speeds = frames.slice(1).flatMap((frame, index) => {
    const previous = frames[index];
    return frame.tick > previous.tick
      ? [Math.abs(frame.athletes[0].position.x - previous.athletes[0].position.x) * 60 / (frame.tick - previous.tick)] : [];
  });
  assert.ok(speeds.length >= 2);
  return Math.max(...speeds);
}

async function timedPowers(browser) {
  return withMatch(browser, [abilities.coffee_break, abilities.my_ball, abilities.butter_fingers, "Samuel"],
    ["019-time-A.webm", null, "019-time-B.webm"], async ([a1, a2, b1, b2], state, ball) => {
      const start = await state();
      assert.deepEqual(Object.values(start.athletes).map(actor => actor.ability), ["coffee_break", "my_ball", "butter_fingers", "teammate_rant"]);
      await receive(a1, ball, "A1", 2.35, false);
      const baseline = await movement(a1, "KeyA");
      await act(a1, /^Especial · U$/, /☕ Velocidade \+15%/);
      const coffee = (await state()).athletes.A1;
      assert.equal(coffee.cooldownUntil - coffee.effect.expiresAtTick, (22 - 3) * 60);
      const boosted = await movement(a1, "KeyD");
      assert.ok(Math.abs(boosted / baseline - 1.15) < .01, JSON.stringify({ baseline, boosted }));
      await act(a2, /^Especial · U$/, /alvo já tem um efeito/);
      assert.equal((await state()).athletes.A2.cooldownUntil, null);
      await waitUntilExpired(state, "A1");
      const expired = await movement(a1, "KeyA");
      assert.ok(Math.abs(expired / baseline - 1) < .01, JSON.stringify({ baseline, expired }));
      const targetFeedback = a1.feedback.length;
      await act(a2, /^Especial · U$/, /Parceiro A1: recepção \+10%/);
      await assertFeedback(a1, targetFeedback, /Minha Bola! Recepção \+10%/);
      assert.equal((await state()).athletes.A1.effect.multiplier, 1.10);
      await delay(500);
      await receive(a1, ball, "A1", 2.35, true);
      await waitUntilExpired(state, "A1");
      await receive(a1, ball, "A1", 2.35, false);

      await receive(b1, ball, "B1", 2.1, true);
      await act(b1, /^Especial · U$/, /🧤 Recepção −15%/);
      assert.equal((await state()).athletes.B1.effect.multiplier, .85);
      await delay(500);
      await receive(b1, ball, "B1", 2.1, false);
      await act(b2, /^Especial · U$/, /alvo já tem um efeito/);
      assert.equal((await state()).athletes.B2.cooldownUntil, null);
      await waitUntilExpired(state, "B1");
      await receive(b1, ball, "B1", 2.1, true);
      await act(b2, /^Especial · U$/, /Bronca! Seu parceiro/);
      const final = await state();
      assert.equal(final.athletes.B1.effect.multiplier, .85);
      assert.equal(final.lastAction, "rant");
      await delay(600);
      const round = value => +value.toFixed(3);
      return { speed: [baseline, boosted, expired].map(round), myBallProbeMeters: 2.35, butterProbeMeters: 2.1, collisionPreserved: true };
    });
}

async function freePoint(browser) {
  return withMatch(browser, ["Caio", "Samuel", abilities.butter_fingers, abilities.my_ball], [],
    async ([a1], state, ball) => {
      await act(a1, /^Especial · U$/, /Chegue mais perto da bola para usar/);
      assert.equal((await state()).athletes.A1.cooldownUntil, null);
      await ball("probe", "A1", 0);
      await act(a1, /^Especial · U$/, /Foi sem querer.*ponto para o adversário/);
      const after = await state();
      assert.deepEqual(after.score, { A: 0, B: 1 });
      assert.equal(after.lastAction, "freePoint");
      return after.score;
    });
}

async function botPartner(browser) {
  const player = await openPlayer(browser, abilities.my_ball, "A1");
  const { page, context } = player;
  try {
    await button(page, "Solo contra bots").click();
    await button(page, "Criar sala").click();
    const room = new URL(await page.getByLabel("Link de convite").inputValue()).searchParams.get("room");
    await button(page, "Pronto para jogar").click();
    await button(page, "Iniciar partida").click();
    await button(page, "Sacar · L").click();
    await page.getByText("Em jogo", { exact: true }).waitFor();
    await request(page, "/ability-ball", { room, mode: "hold" });
    await act(player, /^Especial · U$/, /Bot A2: recepção \+10%/);
    const snapshot = await request(page, "/ability-state", { room });
    assert.equal(snapshot.athletes.A2.effect.multiplier, 1.10);
    assert.deepEqual(player.errors, []);
    return "A2";
  } finally {
    await context.close();
  }
}

async function run() {
  const browser = await chromium.launch({ channel: process.env.VOLLEYBALL_BROWSER || "msedge" });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const published = await publishCandidates(page);
    console.log("Três candidatos publicados pela primeira vez; rascunho recuperado após recusa.");
    assert.deepEqual(errors, []);
    await page.close();
    const timed = await timedPowers(browser);
    console.log("Efeitos temporários, expiração e coexistência verificados em 2v2.");
    const caioScore = await freePoint(browser);
    const botTarget = await botPartner(browser);
    const report = { browser: browser.version(), published, recoveredUnavailableDraft: true, timed, caioScore, botTarget,
      fixture: "PGlite, WebSocket v1 e runtime v4 locais, posições de bola controladas" };
    await writeFile(files + "019-results.json", JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify(report));
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
