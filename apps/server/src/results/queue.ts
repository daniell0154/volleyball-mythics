import type { FinalMatchResult } from "../persistence/results.js";
type Status = "pending" | "saved" | "failed";
interface Job { payload: FinalMatchResult; state: Status; deadline: number; due: number; attempts: number; active: boolean; released: boolean }
export class ResultQueue {
  private jobs = new Map<string, Job>();
  constructor(private repository: { persist(result: FinalMatchResult, signal?: AbortSignal): Promise<void> },
    private changed: (matchId: string, state: Status) => void, private now: () => number = Date.now,
    private operationalFailure: (matchId: string) => void = () => {}, private attemptTimeoutMs = 5000) {}
  enqueue(payload: FinalMatchResult): void {
    const existing = this.jobs.get(payload.matchId);
    if (existing) { if (JSON.stringify(existing.payload) !== JSON.stringify(payload)) throw new Error("immutable_result_conflict"); return; }
    const copy = structuredClone(payload);
    this.jobs.set(payload.matchId, { payload: copy, state: "pending", deadline: this.now() + 300000, due: this.now(), attempts: 0, active: false, released: false });
    this.changed(payload.matchId, "pending");
  }
  status(matchId: string): Status | undefined { return this.jobs.get(matchId)?.state; }
  release(matchId: string): void { const job = this.jobs.get(matchId); if (job?.state === "pending") job.released = true; else this.jobs.delete(matchId); }
  async tick(): Promise<void> {
    await Promise.all([...this.jobs.values()].filter((job) => job.state === "pending" && !job.active && this.now() >= job.due).map((job) => this.attempt(job)));
  }
  private complete(job: Job, state: "saved" | "failed"): void {
    job.state = state; this.changed(job.payload.matchId, state);
    if (state === "failed") this.operationalFailure(job.payload.matchId);
    if (job.released) this.jobs.delete(job.payload.matchId);
  }
  private async attempt(job: Job): Promise<void> {
    if (this.now() >= job.deadline) { this.complete(job, "failed"); return; }
    job.active = true; job.attempts++;
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.repository.persist(structuredClone(job.payload), controller.signal),
        new Promise<never>((_resolve, reject) => { timeout = setTimeout(() => { controller.abort(); reject(new Error("result_timeout")); }, Math.min(this.attemptTimeoutMs, job.deadline - this.now())); }),
      ]);
      this.complete(job, "saved");
    } catch {
      if (this.now() >= job.deadline) this.complete(job, "failed");
      else job.due = Math.min(job.deadline, this.now() + Math.min(30000, 1000 * 2 ** Math.min(job.attempts - 1, 5)));
    } finally { clearTimeout(timeout); job.active = false; }
  }
}
