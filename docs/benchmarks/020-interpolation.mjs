import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { cpus } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const basePath = process.argv[2];
const currentPath = "apps/web/.test-build/network/interpolation.js";
const load = async path => (await import(pathToFileURL(resolve(path)).href)).SnapshotBuffer;
const current = await load(currentPath);
const base = basePath ? await load(basePath) : current;
const traces = JSON.parse(await readFile(new URL("./014-traces-4.json", import.meta.url)));
const rally = traces.find(entry => entry.side === "A" && entry.defending === "both").frames;
const timeline = [];
let match = 0;
for (let index = 0; index < 1200; index++) {
  const now = index * 50;
  const source = rally[index % rally.length];
  if (index % 400 === 0) match++;
  const frame = {
    ...source, matchId: String(match), tick: index * 3, serverTime: 1_000_000 + now,
    visualActions: Array.from({ length: 12 }, (_, offset) => ({
      id: index - offset, actorId: source.athletes[0].id, kind: "receive", tick: (index - offset) * 3 + 1, facing: 0,
    })).reverse(),
  };
  timeline.push(["push", frame, now]);
  if (index % 175 === 0) {
    timeline.push(["push", { ...frame, tick: frame.tick - 3 }, now + 1]);
    timeline.push(["push", { ...frame, phase: "disconnectedSuspension" }, now + 2]);
    timeline.push(["sample", now + 3]);
    timeline.push(["push", frame, now + 4]);
  }
  for (const offset of [5, 22, 39]) timeline.push(["sample", now + offset]);
  if (index % 150 === 0) timeline.push(["sample", now + 150]);
}

function replay(BufferClass, consume) {
  const buffer = new BufferClass();
  for (const [op, first, second] of timeline) {
    if (op === "push") buffer.push(first, second);
    else consume(buffer.sample(first));
  }
}

function digest(BufferClass) {
  const hash = createHash("sha256");
  replay(BufferClass, sample => hash.update(JSON.stringify(sample)));
  return hash.digest("hex");
}

function measure(BufferClass) {
  let ticks = 0;
  const use = process.cpuUsage();
  const started = process.hrtime.bigint();
  for (let run = 0; run < 120; run++) replay(BufferClass, sample => { ticks += sample.renderTick; });
  assert.ok(ticks > 0);
  const cpu = process.cpuUsage(use);
  return { wallMs: Number(process.hrtime.bigint() - started) / 1e6, cpuMs: (cpu.system + cpu.user) / 1000 };
}

const snapshotDigest = digest(base);
assert.equal(digest(current), snapshotDigest);
const baseSamples = [], currentSamples = [];
for (let repetition = 0; repetition < 3; repetition++) {
  const order = repetition % 2 === 0 ? [[base, baseSamples], [current, currentSamples]] : [[current, currentSamples], [base, baseSamples]];
  for (const [BufferClass, samples] of order) samples.push(measure(BufferClass));
}
console.log(JSON.stringify({ node: process.version, cpu: cpus()[0].model,
  events: timeline.length, snapshotDigest, baseSamples, currentSamples }, null, 2));
