import type { Vector3, CharacterAttributes } from "@volleyball-mythics/protocol";

export interface RallyProfile {
  readonly version: number;
  readonly actionRange: number;
  readonly separationRange: number;
  readonly recoveryTicks: number;
  readonly targetedArcs: boolean;
}
/** Reviewed immutable revisions: legacy, reach-only comparison, targeted trajectories. */
export const RALLY_PROFILES: Readonly<Record<number, RallyProfile>> = Object.freeze({
  1: Object.freeze({ version: 1, actionRange: 1.9, separationRange: 2.1, recoveryTicks: 0, targetedArcs: false }),
  2: Object.freeze({ version: 2, actionRange: 2.3, separationRange: 2.5, recoveryTicks: 6, targetedArcs: false }),
  3: Object.freeze({ version: 3, actionRange: 2.15, separationRange: 2.5, recoveryTicks: 6, targetedArcs: true }),
});
export function rallyProfile(version: number): RallyProfile {
  const profile = RALLY_PROFILES[version]; if (!profile) throw new Error("Unknown rally rules version"); return profile;
}
export function actionRange(profile: RallyProfile, attribute: number): number {
  return profile.actionRange + (profile.targetedArcs ? .2 * (attribute - 1) / 99 : 0);
}
export function rallyVelocity(profile: RallyProfile, kind: "serve" | "receive" | "set" | "attack" | "block",
  ball: Vector3, athlete: Vector3, direction: number, attributes: CharacterAttributes, teammate?: Vector3): Vector3 {
  if (!profile.targetedArcs) {
    if (kind === "serve") return { x: -athlete.x*.15, y: 7.5, z: direction*(7.5+attributes.serve/100) };
    const action = kind === "block" ? "receive" : kind;
    const flight = action === "attack" ? .85 : action === "set" ? 1.35 : 1.65;
    return { x: -ball.x/flight*.3, y: action === "attack" ? (athlete.y>.5 ? 3 : 6.5) : action === "set" ? 8 : 7.5,
      z: ((action === "set" ? athlete.z+direction : direction*5)-ball.z)/flight };
  }
  const normalized = (value: number) => (value-1)/99;
  const flight = kind === "serve" ? 1.85-.15*normalized(attributes.serve)
    : kind === "attack" ? (athlete.y>.5 ? 1.3 : 1.65)-.12*normalized(attributes.attack)
    : kind === "set" ? 1.35+.15*normalized(attributes.set)
    : kind === "block" ? 1.35 : 1.8+.15*normalized(attributes.receive);
  const targetX = kind === "set" && teammate ? teammate.x : ball.x*.25;
  const rawZ = teammate ? teammate.z+direction*.6 : athlete.z+direction*2;
  const targetZ = kind === "set" ? (direction>0 ? Math.max(-7.5,Math.min(-1.5,rawZ)) : Math.min(7.5,Math.max(1.5,rawZ))) : direction*4;
  return { x: (targetX-ball.x)/flight, y: (.11-ball.y+.5*9.81*flight*flight)/flight, z: (targetZ-ball.z)/flight };
}
