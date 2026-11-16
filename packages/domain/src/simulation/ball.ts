export interface Vec3 { readonly x: number; readonly y: number; readonly z: number }
export interface BallState { readonly position: Vec3; readonly velocity: Vec3; readonly grounded: boolean }
export interface BallConfig {
  readonly fixedDeltaSeconds: number;
  readonly gravity: number;
  readonly radius: number;
  readonly netHeight: number;
  readonly netHalfWidth: number;
  readonly netRestitution: number;
}
export interface BallStep { readonly state: BallState; readonly netHit: boolean; readonly groundedNow: boolean }

function finite(value: number): boolean { return Number.isFinite(value); }
function validateVector(v: Vec3): void {
  if (![v.x, v.y, v.z].every(finite)) throw new Error("ball state must be finite");
}

export function stepBall(state: BallState, config: BallConfig): BallStep {
  validateVector(state.position);
  validateVector(state.velocity);
  if (!(config.fixedDeltaSeconds > 0) || !(config.radius > 0) || !(config.gravity >= 0)) throw new Error("invalid ball simulation config");
  if (state.grounded) return { state, netHit: false, groundedNow: false };

  const dt = config.fixedDeltaSeconds;
  const velocity = { ...state.velocity, y: state.velocity.y - config.gravity * dt };
  const next = {
    x: state.position.x + velocity.x * dt,
    y: state.position.y + velocity.y * dt,
    z: state.position.z + velocity.z * dt,
  };
  const floorY = config.radius;
  const floorCrossed = state.position.y > floorY && next.y <= floorY;
  const floorFraction = floorCrossed ? (state.position.y - floorY) / (state.position.y - next.y) : Infinity;
  const crossedNet = (state.position.z < 0 && next.z >= 0) || (state.position.z > 0 && next.z <= 0);
  const netFraction = crossedNet ? Math.abs(state.position.z) / Math.abs(next.z - state.position.z) : Infinity;
  const atNetY = state.position.y + (next.y - state.position.y) * netFraction;
  const atNetX = state.position.x + (next.x - state.position.x) * netFraction;
  const netCollision = crossedNet && netFraction >= 0 && netFraction <= 1
    && Math.abs(atNetX) <= config.netHalfWidth + config.radius
    && atNetY - config.radius <= config.netHeight;

  if (floorFraction <= 1 && floorFraction <= (netCollision ? netFraction : Infinity)) {
    const fraction = Math.max(0, floorFraction);
    return {
      state: { position: { x: state.position.x + (next.x - state.position.x) * fraction, y: floorY, z: state.position.z + (next.z - state.position.z) * fraction }, velocity, grounded: true },
      netHit: false, groundedNow: true,
    };
  }
  if (netCollision) {
    return {
      state: { position: { x: atNetX, y: atNetY, z: state.position.z < 0 ? -config.radius : config.radius }, velocity: { ...velocity, z: -velocity.z * config.netRestitution }, grounded: false },
      netHit: true, groundedNow: false,
    };
  }
  return { state: { position: next, velocity, grounded: false }, netHit: false, groundedNow: false };
}

export function moveAthlete(position: Vec3, input: { x: number; z: number }, speed: number, dt: number, bounds: { minX: number; maxX: number; minZ: number; maxZ: number }): Vec3 {
  validateVector(position);
  if (![input.x, input.z, speed, dt, bounds.minX, bounds.maxX, bounds.minZ, bounds.maxZ].every(finite) || speed < 0 || dt < 0) {
    throw new Error("movement inputs must be finite and non-negative");
  }
  const length = Math.hypot(input.x, input.z);
  const scale = length > 1 ? 1 / length : 1;
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, position.x + input.x * scale * speed * dt)),
    y: position.y,
    z: Math.max(bounds.minZ, Math.min(bounds.maxZ, position.z + input.z * scale * speed * dt)),
  };
}
