import type { BallConfig } from "../simulation/ball.js";
import type { CharacterAttributes } from "@volleyball-mythics/protocol";

export interface GameRulesConfig {
  readonly version: number;
  readonly fixedDeltaSeconds: number;
  readonly gravity: number;
  readonly ballRadius: number;
  readonly netHeight: number;
  readonly netHalfWidth: number;
  readonly netRestitution: number;
  readonly courtWidth: number;
  readonly courtLength: number;
  readonly athleteSpeedMin: number;
  readonly athleteSpeedMax: number;
  readonly jumpVelocityMin: number;
  readonly jumpVelocityMax: number;
  readonly serveTimeoutSeconds: number;
  readonly countdownSeconds: number;
  readonly pointDelaySeconds: number;
}

export const DEFAULT_RULES: GameRulesConfig = Object.freeze({
  version: 1,
  fixedDeltaSeconds: 1 / 60,
  gravity: 9.81,
  ballRadius: 0.11,
  netHeight: 2.43,
  netHalfWidth: 4.5,
  netRestitution: 0.45,
  courtWidth: 9,
  courtLength: 18,
  athleteSpeedMin: 2,
  athleteSpeedMax: 8,
  jumpVelocityMin: 4,
  jumpVelocityMax: 9,
  serveTimeoutSeconds: 8,
  countdownSeconds: 3,
  pointDelaySeconds: 2,
});

export function validateRulesConfig(config: GameRulesConfig): GameRulesConfig {
  for (const [key, value] of Object.entries(config)) {
    if (!Number.isFinite(value)) throw new Error(`${key} must be finite`);
  }
  if (!Number.isInteger(config.version) || config.version < 1) throw new Error("version must be a positive integer");
  if (config.fixedDeltaSeconds <= 0 || config.fixedDeltaSeconds > 1 / 30) throw new Error("fixed step must be in (0, 1/30]");
  if (config.gravity <= 0 || config.ballRadius <= 0 || config.netHeight <= 0 || config.netHalfWidth <= 0) throw new Error("geometry and gravity must be positive");
  if (config.netRestitution < 0 || config.netRestitution > 1) throw new Error("netRestitution must be in [0, 1]");
  if (config.courtWidth !== 9 || config.courtLength !== 18) throw new Error("court dimensions must match rules v1 (9 x 18 m)");
  if (config.athleteSpeedMin <= 0 || config.athleteSpeedMax < config.athleteSpeedMin) throw new Error("invalid athlete speed bounds");
  if (config.jumpVelocityMin <= 0 || config.jumpVelocityMax < config.jumpVelocityMin) throw new Error("invalid jump bounds");
  if (config.serveTimeoutSeconds !== 8 || config.countdownSeconds < 0 || config.pointDelaySeconds < 0) throw new Error("invalid match timing rules");
  return config;
}

export function ballConfigFromRules(config: GameRulesConfig): BallConfig {
  validateRulesConfig(config);
  return {
    fixedDeltaSeconds: config.fixedDeltaSeconds,
    gravity: config.gravity,
    radius: config.ballRadius,
    netHeight: config.netHeight,
    netHalfWidth: config.netHalfWidth,
    netRestitution: config.netRestitution,
  };
}

export function validateCharacterAttributes(attributes: CharacterAttributes): CharacterAttributes {
  const values = Object.values(attributes);
  if (values.length !== 7 || values.some((value) => !Number.isInteger(value) || value < 1 || value > 100)) {
    throw new Error("all seven character attributes must be integers in [1, 100]");
  }
  return attributes;
}

export function overallFromAttributes(attributes: CharacterAttributes): number {
  validateCharacterAttributes(attributes);
  return Math.round(Object.values(attributes).reduce((sum, value) => sum + value, 0) / 7);
}
