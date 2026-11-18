const assert = require("node:assert/strict");
const { resolve } = require("node:path");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));

const address = "http://127.0.0.1:5177/docs/acceptance/012-preview/";
const fixture = "http://127.0.0.1:3014";

async function login(page, draw = true) {
  await page.routeWebSocket("ws://127.0.0.1:5177/**", socket => socket.send('{"type":"connected"}'));
  await page.goto(address + (draw ? "?ability-review" : ""));
  await page.getByLabel("Email", { exact: true }).fill("admin@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("fixture-only");
  await page.getByRole("button", { name: "Entrar no admin" }).click();
  await page.getByRole("button", { name: /Samuel.*Publicado/ }).waitFor();
}

async function availability(browser, count, drawEnabled) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.route(fixture + "/list", async route => {
      const response = await route.fetch();
      const data = await response.json();
      const ids = ["teammate_rant", "free_point_out"].slice(0, count);
      for (const ability of data.abilities) ability.enabled = ids.includes(ability.id);
      await route.fulfill({ response, json: data });
    });
    await login(page, drawEnabled);
    await page.getByRole("button", { name: "Novo personagem" }).click();
    const selector = page.getByLabel("Habilidade", { exact: true });
    const draw = page.getByRole("button", { name: "Sortear habilidade" });
    if (!count || !drawEnabled) {
      assert.equal(await draw.isDisabled(), true);
      await page.getByText(count ? "Sorteio aguardando liberação." : "Nenhuma habilidade disponível para publicação.").waitFor();
    } else {
      await page.getByLabel("Nome", { exact: true }).fill("Rascunho local 019");
      await page.getByLabel("Saque", { exact: true }).fill("93");
      const original = await selector.inputValue();
      await draw.press("Enter");
      assert.equal(await selector.inputValue(), count === 1 ? original : "free_point_out");
      assert.equal(await page.getByLabel("Nome", { exact: true }).inputValue(), "Rascunho local 019");
      assert.equal(await page.getByLabel("Saque", { exact: true }).inputValue(), "93");
      if (count === 1) await page.getByText("Única habilidade disponível: Bronca no Parceiro.").waitFor();
      else {
        const details = page.getByRole("group", { name: "Detalhes da habilidade" });
        await details.getByText("Time adversário", { exact: true }).waitFor();
        await details.getByText("Imediata", { exact: true }).waitFor();
        await details.getByText("25 s", { exact: true }).waitFor();
        await draw.press("Space");
        assert.equal(await selector.inputValue(), original);
      }
    }
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
}

async function run() {
  const browser = await chromium.launch({ channel: process.env.VOLLEYBALL_BROWSER || "msedge" });
  try {
    for (const [count, enabled] of [[0, true], [1, true], [2, true], [2, false]]) {
      await availability(browser, count, enabled);
    }
    console.log(`019 seletor/sorteio: zero, uma e múltiplas opções e flag de produção (${browser.version()})`);
  } finally {
    await browser.close();
  }
}

if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { login, address, fixture };
