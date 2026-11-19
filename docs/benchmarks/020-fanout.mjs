import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { cpus } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { WebSocket } = createRequire(new URL("../../apps/server/package.json", import.meta.url))("ws");

const origin = "http://localhost:5173";
const stringify = JSON.stringify;
const currentPath = "apps/server/dist";
const basePath = process.argv[2];
if (!basePath) throw Error("Pass the compiled base server directory as the first argument.");
const traces = JSON.parse(await readFile(new URL("./014-traces-4.json", import.meta.url)));
const frames = traces.find(entry => entry.side === "A" && entry.defending === "both").frames;
const load = async (root, file) => import(pathToFileURL(resolve(root, file)).href);

async function measure(root) {
  const { createTransport } = await load(root, "network/server.js");
  const { RoomApplication } = await load(root, "rooms/application.js");
  const app = new RoomApplication([]);
  const ids = ["A0", "A1", "B0", "B1"];
  const room = app.rooms.create(ids[0], "2v2");
  for (const id of ids.slice(1)) app.rooms.join(id, room.code);
  room.status = "active";
  const transport = createTransport({
    origins: [origin], onCommand() {},
    verify: async userId => ({ userId, expiresAt: Date.now() + 60_000 }),
    onConnect: session => app.connect(session),
    onDisconnect: session => app.disconnect(session),
  });
  const clients = [];
  let encodings = 0, bytes = 0, messages = 0, broadcastNs = 0n, encodeNs = 0n;
  const digest = createHash("sha256");
  const initialCpu = process.cpuUsage();
  async function connect(id) {
    const ws = new WebSocket(`ws://127.0.0.1:${transport.http.address().port}/socket`, { origin });
    clients.push(ws);
    await once(ws, "open");
    const response = once(ws, "message");
    ws.send(stringify({protocolVersion: 1, type: "auth", requestId: id, payload: {accessToken: id}}));
    assert.equal(JSON.parse((await response)[0]).type, "ack");
    return ws;
  }
  try {
    transport.http.listen(0, "127.0.0.1");
    await once(transport.http, "listening");
    for (const id of ids) await connect(id);
    JSON.stringify = (value, ...args) => {
      if (value?.protocolVersion !== 1 || value.type !== "snapshot") return stringify(value, ...args);
      const started = process.hrtime.bigint();
      const text = stringify(value, ...args);
      encodeNs += process.hrtime.bigint() - started;
      encodings++;
      return text;
    };
    for (let batch = 0; batch < 250; batch++) {
      if (batch === 125) {
        const disconnected = clients.pop();
        const closed = once(disconnected, "close");
        disconnected.close();
        await closed;
        await connect(ids.at(-1));
        room.status = "active";
      }
      const samples = Array.from({length: 16}, (_, index) => frames[(batch * 16 + index) % frames.length]);
      const expected = samples.map(payload => stringify({protocolVersion: 1, type: "snapshot", payload}));
      const received = clients.map(ws => new Promise((accept, reject) => {
        let index = 0;
        const guard = setTimeout(() => {
          ws.off("message", receive);
          reject(new Error("snapshot delivery timeout"));
        }, 5000);
        function receive(data) {
          const text = data.toString();
          if (JSON.parse(text).type !== "snapshot") return;
          if (text !== expected[index++]) {
            clearTimeout(guard);
            ws.off("message", receive);
            reject(new Error("snapshot bytes or order changed"));
            return;
          }
          bytes += data.length;
          messages++;
          if (index === expected.length) {
            clearTimeout(guard);
            ws.off("message", receive);
            accept();
          }
        }
        ws.on("message", receive);
      }));
      const started = process.hrtime.bigint();
      for (const snapshot of samples) app.broadcast(room, "snapshot", snapshot);
      broadcastNs += process.hrtime.bigint() - started;
      await Promise.all(received);
      for (const text of expected) digest.update(text);
    }
    const report = { encodings, bytes, messages, broadcastMs: Number(broadcastNs) / 1e6, encodeMs: Number(encodeNs) / 1e6,
      cpu: process.cpuUsage(initialCpu),
      digest: digest.digest("hex") };
    JSON.stringify = stringify;
    const slow = clients.pop();
    const closed = once(slow, "close");
    const slowPort = slow._socket.localPort;
    const descriptor = Object.getOwnPropertyDescriptor(WebSocket.prototype, "bufferedAmount");
    // Inject backpressure at the server socket boundary. Windows TCP buffers vary by host.
    Object.defineProperty(WebSocket.prototype, "bufferedAmount", {
      ...descriptor,
      get() { return this._socket?.remotePort === slowPort ? 65_537 : descriptor.get.call(this); },
    });
    const deliveries = clients.map(ws => once(ws, "message"));
    try {
      app.broadcast(room, "snapshot", frames[0]);
    } finally {
      Object.defineProperty(WebSocket.prototype, "bufferedAmount", descriptor);
    }
    const [code, reason] = await closed;
    assert.equal(code, 1013);
    assert.equal(String(reason), "slow_consumer");
    const expected = stringify({ protocolVersion: 1, type: "snapshot", payload: frames[0] });
    for (const [data] of await Promise.all(deliveries)) assert.equal(String(data), expected);
    return report;
  } finally {
    JSON.stringify = stringify;
    for (const ws of clients) ws.terminate();
    await transport.close();
  }
}

const base = [], current = [];
for (let run = 0; run < 3; run++) {
  const order = run % 2 === 0 ? [[basePath, base], [currentPath, current]] : [[currentPath, current], [basePath, base]];
  for (const [path, report] of order) report.push(await measure(path));
}
for (const report of [...base, ...current]) {
  assert.equal(report.messages, 16_000);
  assert.equal(report.digest, base[0].digest);
  assert.equal(report.bytes, base[0].bytes);
}
assert.ok(base.every(report => report.encodings === 16_000));
assert.ok(current.every(report => report.encodings === 4_000));
console.log(JSON.stringify({ node: process.version, cpu: cpus()[0].model, base, current }, null, 2));
