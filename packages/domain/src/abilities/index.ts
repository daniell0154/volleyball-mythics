const candidateEffects = {
  coffee_break: { target: "self", attribute: "speed", min: 1.01, max: 1.5 },
  butter_fingers: { target: "self", attribute: "receive", min: .5, max: .99 },
  my_ball: { target: "teammate", attribute: "receive", min: 1.01, max: 1.5 },
} as const;

export type AbilityDefinition =
  | { id: "teammate_rant"; validPhases: readonly ["rally"]; target: "teammate"; multiplier: number; durationSeconds: number; cooldownSeconds: number; affectedAttributes: readonly ["speed", "receive"] }
  | { id: "free_point_out"; validPhases: readonly ["rally"]; target: "opponent_team"; effect: "force_ball_out"; requiresBallInActionRange: true; points: 1; pointPolicy: "opponent_once_on_rally_resolution"; durationSeconds: 0; cooldownSeconds: number; endsRally: true }
  | { id: "speed_boost_fixture"; validPhases: readonly ["rally"]; target: "self"; attribute: "speed"; multiplier: number; durationSeconds: number; cooldownSeconds: number }
  | { id: keyof typeof candidateEffects; validPhases: readonly ["rally"]; target: "self" | "teammate"; attribute: "speed" | "receive"; multiplier: number; durationSeconds: number; cooldownSeconds: number };

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function seconds(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

/** Accept only the server's reviewed ability handlers and bounded configuration. */
export function validateAbilityDefinition(id: string, value: unknown, allowDevelopmentFixture = false): AbilityDefinition {
  if (!record(value)) throw new Error("ability config must be an object");
  if (value.trigger !== "manual" || !Array.isArray(value.validPhases) || value.validPhases.length !== 1 || value.validPhases[0] !== "rally") {
    throw new Error("ability phase or trigger is not supported");
  }
  if (id === "teammate_rant") {
    if (value.target !== "teammate" || !Array.isArray(value.affectedAttributes) || value.affectedAttributes.length !== 2 || !value.affectedAttributes.includes("speed") || !value.affectedAttributes.includes("receive") || !seconds(value.multiplier, 0.1, 0.99) || !seconds(value.durationSeconds, 1, 30) || !seconds(value.cooldownSeconds, 1, 300) || value.stackable !== false) throw new Error("invalid teammate_rant config");
    return { id, validPhases: ["rally"], target: "teammate", multiplier: value.multiplier, durationSeconds: value.durationSeconds, cooldownSeconds: value.cooldownSeconds, affectedAttributes: ["speed", "receive"] };
  }
  if (id === "free_point_out") {
    if (value.target !== "opponent_team" || value.effect !== "force_ball_out" || value.requiresBallInActionRange !== true || value.points !== 1 || value.pointPolicy !== "opponent_once_on_rally_resolution" || value.durationSeconds !== 0 || !seconds(value.cooldownSeconds, 1, 300) || value.endsRally !== true || value.stackable !== false) throw new Error("invalid free_point_out config");
    return { id, validPhases: ["rally"], target: "opponent_team", effect: "force_ball_out", requiresBallInActionRange: true, points: 1, pointPolicy: "opponent_once_on_rally_resolution", durationSeconds: 0, cooldownSeconds: value.cooldownSeconds, endsRally: true };
  }
  if (id === "speed_boost_fixture" && allowDevelopmentFixture) {
    if (value.target !== "self" || value.attribute !== "speed" || !seconds(value.multiplier, 1.01, 2) || !seconds(value.durationSeconds, 1, 10) || !seconds(value.cooldownSeconds, 5, 60)) throw new Error("invalid speed_boost_fixture config");
    return { id, validPhases: ["rally"], target: "self", attribute: "speed", multiplier: value.multiplier, durationSeconds: value.durationSeconds, cooldownSeconds: value.cooldownSeconds };
  }
  if (id === "coffee_break" || id === "butter_fingers" || id === "my_ball") {
    const { target, attribute, min, max } = candidateEffects[id];
    if (value.target !== target || value.attribute !== attribute || value.stackable !== false
      || !seconds(value.multiplier, min, max) || !seconds(value.durationSeconds, 1, 30) || !seconds(value.cooldownSeconds, 1, 300)) {
      throw new Error(`invalid ${id} config`);
    }
    return { id, validPhases: ["rally"], target, attribute, multiplier: value.multiplier,
      durationSeconds: value.durationSeconds, cooldownSeconds: value.cooldownSeconds };
  }
  throw new Error("unknown ability handler");
}
