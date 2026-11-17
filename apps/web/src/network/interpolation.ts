import type { MatchSnapshot, Vector3 } from "@volleyball-mythics/protocol";
const blend = (a: Vector3, b: Vector3, t: number): Vector3 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
export class SnapshotBuffer {
  private frames: MatchSnapshot[] = [];
  private receivedAt = 0;
  push(frame: MatchSnapshot, now: number): void {
    const latest = this.frames.at(-1);
    if (latest?.matchId === frame.matchId && (frame.tick < latest.tick || (frame.tick === latest.tick && frame.phase === latest.phase))) return;
    if (latest?.matchId !== frame.matchId || frame.phase === "disconnectedSuspension" || latest?.phase === "disconnectedSuspension") this.frames = [];
    this.frames.push(frame); this.frames = this.frames.slice(-120); this.receivedAt = now;
  }
  sample(now: number): (MatchSnapshot & { renderTick: number }) | null {
    const latest = this.frames.at(-1); if (!latest) return null;
    const target = latest.serverTime + Math.max(0, now - this.receivedAt) - 100;
    let previous = this.frames[0]!;
    for (const next of this.frames.slice(1)) {
      if (target < next.serverTime) {
        const duration = next.serverTime - previous.serverTime;
        const t = duration > 0 ? Math.max(0, Math.min(1, (target - previous.serverTime) / duration)) : 1;
        const renderTick = previous.tick + (next.tick - previous.tick) * t;
        return { ...previous, renderTick, ball: blend(previous.ball, next.ball, t), athletes: previous.athletes.map((athlete) => {
          const other = next.athletes.find((a) => a.id === athlete.id);
          return other ? { ...athlete, position: blend(athlete.position, other.position, t) } : athlete;
        }) };
      }
      previous = next;
    }
    return { ...latest, renderTick: latest.tick }; // Never extrapolate beyond server state.
  }
}
