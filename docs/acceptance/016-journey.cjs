const assert = require("node:assert/strict");
const { resolve } = require("node:path");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));
const { openPlayer, checkViewport, checkCourt } = require("./016-viewport.cjs");

async function enterMatch(players, mode, difficulty = "normal") {
  const owner = players[0].page;
  if (mode !== "human") {
    await owner.getByRole("button", { name: mode === "solo" ? "Solo contra bots" : "Dupla contra bots" }).click();
    await owner.getByLabel("Dificuldade dos bots").selectOption(difficulty);
  }
  await owner.getByRole("button", { name: "Criar sala" }).click();
  const invite = new URL(await owner.getByLabel("Link de convite").inputValue()).searchParams.get("room");
  for (const { page } of players.slice(1)) {
    await page.getByLabel("Código da sala").fill(invite);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.getByLabel("Sala e participantes").waitFor();
  }
  for (const { page } of players) await page.getByRole("button", { name: "Pronto para jogar" }).click();
  await owner.getByRole("button", { name: "Iniciar partida" }).click();
  for (const { page } of players) await checkViewport(page);
}

const startRally = async page => {
  await page.bringToFront();
  await page.getByRole("button", { name: "Sacar · L" }).click();
  await page.getByText("Em jogo", { exact: true }).waitFor({ timeout: 9000 }).catch(async error => {
    throw new Error(`${error.message}\n${await page.locator(".online-match").innerText()}`);
  });
};
const assertClean = ({ errors }) => assert.deepEqual(errors, []);
const withoutWebGL = page => page.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
    return kind.startsWith("webgl") ? null : original.call(this, kind, ...args);
  };
});

async function humanJourney(browser) {
  const frames = [];
  const players = [];
  for (let index = 0; index < 4; index++) {
    players.push(await openPlayer(browser, "Humano " + (index + 1), {}, async page => {
      if (index % 2 !== 0) await withoutWebGL(page);
      await page.addInitScript(() => {
        const NativeWebSocket = window.WebSocket;
        window.WebSocket = class extends NativeWebSocket {
          constructor(...args) {
            super(...args);
            if (this.url.endsWith(":3020/socket")) window.matchSocket = this;
          }
        };
      });
      if (index === 0) page.on("websocket", socket => socket.on("framereceived", ({ payload }) => {
        const frame = JSON.parse(String(payload));
        if (frame.type === "snapshot") frames.push(frame.payload);
      }));
    }));
  }
  await enterMatch(players, "human");
  const owner = players[0].page;
  const teamB = players[2].page;
  await teamB.getByText("Você · B1").waitFor();
  await startRally(owner);
  const matchId = frames.at(-1).matchId;
  await owner.locator(".court-host canvas").evaluate(canvas => { canvas.dataset.instance = "original"; });
  await owner.evaluate(() => window.matchSocket.close(1000));
  await owner.getByText("Conexão interrompida.", { exact: false }).waitFor();
  assert.equal(await owner.locator(".court-host canvas").getAttribute("data-instance"), "original");
  await teamB.getByText("Aguardando reconexão", { exact: true }).waitFor();
  await owner.waitForFunction(() => window.matchSocket.readyState === WebSocket.OPEN);
  await owner.getByText("Em jogo", { exact: true }).waitFor();
  assert.equal(frames.at(-1).matchId, matchId);
  await checkCourt(owner);

  await teamB.setViewportSize({ width: 1920, height: 1080 });
  await teamB.bringToFront();
  await checkCourt(teamB);
  await checkViewport(teamB);
  await teamB.getByRole("button", { name: "Opções", exact: true }).click();
  await teamB.getByLabel("Câmera estável", { exact: false }).check();
  await teamB.getByRole("button", { name: "Qualidade: baixa" }).click();
  await teamB.getByRole("button", { name: "Fechar opções" }).click();
  await checkCourt(teamB);
  assert.equal(await teamB.locator(".court-host").evaluate(element => element === document.activeElement), true);
  await owner.bringToFront();
  await owner.getByRole("button", { name: "Abandonar partida" }).click();
  await owner.getByLabel("Seu apelido").waitFor({ timeout: 10000 }).catch(async error => {
    throw new Error(`${error.message}\n${await owner.locator("body").innerText()}`);
  });
  await teamB.getByRole("region", { name: "Resultado da partida" }).waitFor();
  await checkViewport(teamB);
  players.forEach(assertClean);
  for (const { context } of players) await context.close();
  console.log("2v2 humano: sacou, reconectou na mesma quadra, ajustou para 1080p e exibiu resultado");
}

async function botsJourney(browser) {
  const player = await openPlayer(browser, "Solo 016");
  const { page } = player;
  const frames = [];
  page.on("websocket", socket => socket.on("framereceived", ({ payload }) => {
    const frame = JSON.parse(String(payload));
    if (frame.type === "snapshot") frames.push(frame.payload);
  }));
  await enterMatch([player], "solo", "hard");
  await startRally(page);
  const matchId = frames.at(-1).matchId;
  assert.equal(frames.at(-1).athletes.length, 4);
  await page.getByRole("region", { name: "Resultado da partida" }).waitFor({ timeout: 150_000 });
  await checkViewport(page);
  assert.equal(await page.locator(".match-stage-panel").evaluate(element => element === document.activeElement), true);
  await page.getByRole("button", { name: "Quero revanche" }).click();
  await page.getByText("Prepare-se", { exact: false }).first().waitFor();
  await checkCourt(page);
  assert.notEqual(frames.at(-1).matchId, matchId);
  assert.deepEqual(frames.at(-1).score, { A: 0, B: 0 });
  assertClean(player);
  await player.context.close();
  console.log("Solo contra bots: resultado por pontos, revanche e novo placar");
}

async function compactAndFallback(browser) {
  const players = [
    await openPlayer(browser, "Compacto 016", { viewport: { width: 640, height: 360 }, deviceScaleFactor: 2 }),
    await openPlayer(browser, "Sem WebGL", {}, withoutWebGL),
  ];
  await enterMatch(players, "coop");
  const [{ page: compact }, { page: fallback }] = players;
  await checkCourt(compact);
  const expand = compact.getByRole("button", { name: "Ações", exact: true });
  assert.equal(await expand.getAttribute("aria-expanded"), "false");
  await expand.focus();
  await compact.keyboard.press("Enter");
  await compact.getByRole("button", { name: "Sacar · L" }).waitFor();
  await checkCourt(compact);
  await compact.keyboard.press("Tab");
  assert.equal(await compact.getByRole("button", { name: "Opções", exact: true }).evaluate(element => element === document.activeElement), true);
  await fallback.getByText("Modo gráfico indisponível").waitFor();
  assert.equal(await fallback.getByRole("button", { name: "Saltar · Espaço" }).isDisabled(), true);
  await fallback.getByRole("button", { name: "Abandonar partida" }).click();
  await fallback.getByLabel("Seu apelido").waitFor();
  players.forEach(assertClean);
  for (const { context } of players) await context.close();
  console.log("Dupla contra bots: ações expansíveis com teclado em 640×360/DPR 2 e saída sem WebGL");
}

async function run() {
  const browser = await chromium.launch({ channel: process.env.VOLLEYBALL_BROWSER || "msedge", headless: true });
  try {
    await humanJourney(browser);
    await compactAndFallback(browser);
    await botsJourney(browser);
    console.log(`016-T3 integração: OK (${browser.version()})`);
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
