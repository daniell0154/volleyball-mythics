import os from 'node:os';
import { writeFile } from 'node:fs/promises';
import { MatchRuntime } from '../../apps/server/dist/runtime/matches.js';
import { RoomRegistry } from '../../apps/server/dist/rooms/registry.js';

const tickMs = 1000 / 60;
const thresholdMs = 16.7;
const secondsArg = process.argv.indexOf('--duration-seconds');
const outputArg = process.argv.indexOf('--out');
const durationMs = secondsArg >= 0 ? Number(process.argv[secondsArg + 1]) * 1000 : 15 * 60 * 1000;
const outputPath = outputArg >= 0 ? process.argv[outputArg + 1] : 'docs/benchmarks/007-local.json';
if (!Number.isFinite(durationMs) || durationMs <= 0) throw new Error('duration must be positive');

const registry = new RoomRegistry();
const rooms = Array.from({ length: 10 }, (_, index) => {
  const room = registry.create(`load-${index}-a`, '2v2');
  for (const suffix of ['b', 'c', 'd']) registry.join(`load-${index}-${suffix}`, room.code);
  return room;
});
let snapshotCount = 0;
let fanoutMessages = 0;
let serializedBytes = 0;
const runtime = new MatchRuntime((room, snapshot) => {
  const serialized = JSON.stringify(snapshot);
  snapshotCount++;
  fanoutMessages += room.members.length;
  serializedBytes += Buffer.byteLength(serialized) * room.members.length;
});
for (const room of rooms) runtime.start(room);

const samples = [];
const scheduleLags = [];
let rounds = 0;
let iterations = 0;
const startedAt = performance.now();
const wallStartedAt = new Date().toISOString();
let due = startedAt;
while (performance.now() - startedAt < durationMs) {
  due += tickMs;
  const waitMs = due - performance.now();
  if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
  scheduleLags.push(Math.max(0, performance.now() - due));
  const tickStarted = process.hrtime.bigint();
  runtime.advance(tickMs);
  samples.push(Number(process.hrtime.bigint() - tickStarted) / 1e6);
  iterations++;
  for (const room of rooms) if (runtime.get(room.roomId)?.ended) { rounds++; runtime.start(room); }
}
const elapsedMs = performance.now() - startedAt;
const tickCounts = rooms.map((room) => runtime.get(room.roomId)?.tick ?? 0);
const sorted = [...samples].sort((a, b) => a - b);
const sortedLags = [...scheduleLags].sort((a, b) => a - b);
const percentile = (values, p) => values[Math.min(values.length - 1, Math.ceil(values.length * p) - 1)] ?? 0;
runtime.cancelForShutdown();

const report = {
  task: '007-T2',
  wallStartedAt,
  durationSeconds: Math.round(elapsedMs / 1000),
  rooms: rooms.length,
  players: rooms.length * 4,
  simulationHz: 60,
  runtimeTickP95Ms: Number(percentile(sorted, 0.95).toFixed(4)),
  runtimeTickMaxMs: Number(Math.max(...samples).toFixed(4)),
  scheduleLagP95Ms: Number(percentile(sortedLags, 0.95).toFixed(3)),
  simulationCalls: iterations,
  roundsRestarted: rounds,
  tickCounts,
  snapshots: snapshotCount,
  snapshotFanoutMessages: fanoutMessages,
  snapshotBytesFannedOut: serializedBytes,
  thresholdMs,
  passed: elapsedMs >= durationMs && percentile(sorted, 0.95) <= thresholdMs && tickCounts.every((count) => count === tickCounts[0]),
  environment: {
    platform: `${os.platform()} ${os.release()}`,
    node: process.version,
    cpu: os.cpus()[0]?.model ?? 'unknown',
    logicalCores: os.cpus().length,
    memoryGiB: Number((os.totalmem() / 1024 ** 3).toFixed(1)),
  },
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(report)}\n`);
if (!report.passed) process.exitCode = 1;
