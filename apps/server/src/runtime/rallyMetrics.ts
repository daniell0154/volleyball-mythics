import type { MatchMode } from "@volleyball-mythics/protocol";

export interface RallyMeasurement {
  mode: MatchMode; rulesVersion: number; rallyId: number; served: boolean;
  durationSeconds: number; contactsAfterServe: number; returnedServe: boolean;
  rangeRejections: number; attempts: number; inputDelayTicksP95: number; reason: string;
}
/** Aggregates only; never retains identities, positions, tokens or raw input. */
export class RallyMetrics {
  private servedAt: number | undefined;
  private contacts = 0;
  private returned = false;
  private range = 0;
  private attempts = 0;
  private delays = Array<number>(17).fill(0);
  serve(tick: number): void { this.servedAt = tick; }
  attempt(delay: number): void { this.attempts++; this.delays[Math.max(0, Math.min(16, Math.floor(delay)))]!++; }
  rejectedRange(): void { this.range++; }
  contact(opponent: boolean): void { this.contacts++; if (opponent) this.returned = true; }
  finish(mode: MatchMode, rulesVersion: number, rallyId: number, tick: number, reason: string): RallyMeasurement {
    let count = 0, p95 = 0;
    for (let i = 0; i < this.delays.length; i++) { count += this.delays[i]!; if (count >= Math.ceil(this.attempts * .95)) { p95 = i; break; } }
    return { mode, rulesVersion, rallyId, served: this.servedAt !== undefined,
      durationSeconds: this.servedAt === undefined ? 0 : (tick - this.servedAt) / 60,
      contactsAfterServe: this.contacts, returnedServe: this.returned, rangeRejections: this.range,
      attempts: this.attempts, inputDelayTicksP95: p95, reason };
  }
}
