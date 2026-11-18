const assert = require("node:assert/strict");
const { writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { chromium } = require(resolve(".test-build/browser/node_modules/playwright"));
const traces = require("../../.test-build/017-targeted.json");

async function capture(page, trace, viewSide) {
  return page.evaluate(async ({ trace, viewSide }) => {
    const source = { width: 1280, height: 720 };
    const tile = { width: 800, height: 450 };
    const labelHeight = 40;
    const views = await Promise.all(["elevated", "close"].map(camera => new Promise((resolve, reject) => {
      const frame = document.createElement("iframe");
      frame.style.cssText = `position:fixed;inset:0;width:${source.width}px;height:${source.height}px;border:0`;
      frame.src = `./016-render.html?variant=candidate&motion=follow&camera=${camera}&viewSide=${viewSide}`;
      frame.onload = async () => {
        const view = frame.contentWindow;
        const deadline = performance.now() + 15_000;
        while (typeof view.drawReplayFrame !== "function") {
          if (performance.now() >= deadline) {
            reject(new Error(`Replay indisponível: ${camera}`));
            return;
          }
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
        const playerId = trace.frames[0].athletes.find(player => player.team === viewSide).id;
        view.configureReplay({ viewSide, playerId });
        resolve({ view, canvas: view.document.querySelector(".court-host canvas"), frame });
      };
      frame.onerror = reject;
      document.body.append(frame);
    })));

    const output = document.createElement("canvas");
    output.width = tile.width * views.length;
    output.height = tile.height + labelHeight;
    const context = output.getContext("2d");
    const scale = tile.width / source.width;
    const checkpoints = [];
    const phases = { serving: "Saque", rally: "Em jogo", point: "Ponto" };
    function paint(snapshot) {
      views.forEach(({ view, canvas }, index) => {
        view.drawReplayFrame(snapshot, snapshot.tick * 1000 / 60);
        const x = tile.width * index;
        context.drawImage(canvas, x, labelHeight, tile.width, tile.height);
        context.fillStyle = "#112738";
        context.fillRect(x, 0, tile.width, labelHeight);
        context.fillStyle = "#fff";
        context.font = "bold 20px sans-serif";
        context.textAlign = "left";
        context.fillText(index === 0 ? "016 · Câmera elevada" : "017 · Câmera próxima", x + 14, 27);
        context.font = "16px sans-serif";
        context.textAlign = "right";
        context.fillText(`Você · ${viewSide}1   |   Saque · time ${trace.side}`, x + tile.width - 14, 26);

        // The DOM overlays are drawn at their measured positions on each captured canvas.
        const top = view.document.querySelector(".match-hud").offsetHeight * scale;
        const bottom = view.document.querySelector(".match-controls").offsetHeight * scale;
        context.fillStyle = "#132738df";
        context.fillRect(x, labelHeight, tile.width, top);
        context.fillRect(x, output.height - bottom, tile.width, bottom);
        context.fillStyle = "#fff";
        context.font = "14px sans-serif";
        context.textAlign = "center";
        context.fillText(`A  ${snapshot.score.A} × ${snapshot.score.B}  B   ·   ${phases[snapshot.phase]}`,
          x + tile.width / 2, labelHeight + top * .7);
        context.fillText("WASD Mover   ·   Espaço Saltar   ·   L Atacar   ·   J Receber   ·   K Levantar",
          x + tile.width / 2, output.height - bottom * .32);

        const cue = view.document.querySelector("[data-ball-cue]");
        const rect = cue.getBoundingClientRect();
        const cx = x + (rect.left + rect.width / 2) * scale;
        const cy = labelHeight + (rect.top + rect.height / 2) * scale;
        context.beginPath();
        context.arc(cx, cy, rect.width * scale / 2, 0, Math.PI * 2);
        context.fillStyle = "#ffe600";
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = "#101820";
        context.stroke();
        if (cue.textContent) {
          context.fillStyle = "#101820";
          context.fillText(cue.textContent, cx, cy + 4);
        }
      });
      context.fillStyle = "#fff";
      context.fillRect(tile.width - 1, 0, 2, output.height);
    }
    const frames = views[0].view.withReplayAvatars(trace.frames);
    paint(frames[0]);
    const stream = output.captureStream(0);
    const track = stream.getVideoTracks()[0];
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm", videoBitsPerSecond: 2_400_000 });
    const chunks = [];
    recorder.ondataavailable = event => chunks.push(event.data);
    const stopped = new Promise(resolve => { recorder.onstop = resolve; });
    recorder.start();
    // Present every snapshot even if capture runs slower than the simulation.
    for (const [index, snapshot] of frames.entries()) {
      track.requestFrame();
      paint(snapshot);
      const contact = trace.contacts.find(action => action.tick === snapshot.tick);
      if (contact) checkpoints.push({ kind: contact.kind, image: output.toDataURL("image/png") });
      const next = frames[index + 1];
      const delay = next ? Math.max(33, (next.tick - snapshot.tick) * 1000 / 60) : 400;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    track.requestFrame();
    paint(frames.at(-1));
    await new Promise(resolve => setTimeout(resolve, 120));
    recorder.stop();
    await stopped;
    track.stop();
    views.forEach(({ frame }) => frame.remove());
    const clip = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(new Blob(chunks, { type: "video/webm" }));
    });
    return { clip, checkpoints };
  }, { trace, viewSide });
}

async function run() {
  const browser = await chromium.launch({ channel: process.env.VOLLEYBALL_BROWSER || "msedge" });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 720 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.routeWebSocket("ws://127.0.0.1:5180/**", socket => socket.send('{"type":"connected"}'));
    const captureUrl = "http://127.0.0.1:5180/docs/benchmarks/017-capture.html";
    await page.route(captureUrl, route => route.fulfill({ contentType: "text/html", body: "<!doctype html><body>" }));
    await page.goto(captureUrl);
    for (const trace of traces) for (const viewSide of ["A", "B"]) {
      const { clip, checkpoints } = await capture(page, trace, viewSide);
      assert.equal(checkpoints.length, 4);
      const name = `017-serve-${trace.side}-view-${viewSide}`;
      const video = Buffer.from(clip.split(",")[1], "base64");
      assert.ok(video.length > 50_000, `Clipe vazio ou incompleto: ${name}`);
      writeFileSync(`docs/benchmarks/${name}.webm`, video);
      for (const { kind, image } of checkpoints) {
        writeFileSync(`.test-build/${name}-${kind}.png`, Buffer.from(image.split(",")[1], "base64"));
      }
      console.log(`${name}: ${video.length} bytes`);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
