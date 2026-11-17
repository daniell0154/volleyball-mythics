import type * as THREE from "three";
import type { SceneSnapshot, Position } from "../game/presentation.js";
import type { VisualActionKind } from "@volleyball-mythics/protocol";

export const ACTION_POSES: Record<VisualActionKind, { duration: number; joints: Record<string, number> }> = {
  serve: { duration: 30, joints: { rightShoulder: -1.2, rightElbow: -.1, leftShoulder: -.65, spine: -.08 } },
  receive: { duration: 24, joints: { leftShoulder: -1.0, rightShoulder: -1.0, leftElbow: -.02, rightElbow: -.02, spine: .14 } },
  set: { duration: 30, joints: { leftShoulder: -2.5, rightShoulder: -2.5, leftElbow: -.5, rightElbow: -.5, head: -.12 } },
  attack: { duration: 30, joints: { rightShoulder: -1.5, rightElbow: -.06, leftShoulder: -2.3, spine: .15 } },
  block: { duration: 24, joints: { leftShoulder: -3.05, rightShoulder: -3.05, leftElbow: -.04, rightElbow: -.04 } },
  rant: { duration: 54, joints: { rightShoulder: -1.4, rightElbow: -.8, head: .15, spine: .10 } },
  freePoint: { duration: 54, joints: { leftShoulder: -2.3, rightShoulder: -2.3, leftElbow: -1.5, rightElbow: -1.5, head: .30, spine: .18 } },
};

export class AvatarAnimator {
  private joints = new Map<string, { node: THREE.Object3D; x: number; y: number; z: number }>();
  private previous: Position | undefined;
  private tick: number | undefined;
  private gait = 0;
  private movement = 0;
  private landedAt = -Infinity;
  private airborne = false;
  constructor(private model: THREE.Object3D) {
    model.traverse((node) => { if (node.name) this.joints.set(node.name, { node, x: node.rotation.x, y: node.rotation.y, z: node.rotation.z }); });
  }
  update(frame: SceneSnapshot, athlete: SceneSnapshot["athletes"][number]): void {
    if (["disconnectedSuspension","finished","cancelled"].includes(frame.phase)) return;
    const tick = frame.renderTick ?? frame.tick;
    if (this.tick !== undefined && tick <= this.tick) return;
    const dt = this.tick === undefined ? 0 : Math.min(.1, (tick - this.tick) / 60);
    const dx = this.previous ? athlete.position.x - this.previous.x : 0;
    const dz = this.previous ? athlete.position.z - this.previous.z : 0;
    const distance = Math.hypot(dx,dz);
    const teleported = distance > 2;
    const speed = dt > 0 && !teleported ? distance/dt : 0;
    this.movement += (Math.min(1,speed/3) - this.movement) * (1-Math.exp(-dt*14));
    if (!teleported) this.gait += distance * 4;
    if (speed > .1) {
      const angle = Math.atan2(dx,dz);
      const difference = Math.atan2(Math.sin(angle-this.model.rotation.y),Math.cos(angle-this.model.rotation.y));
      this.model.rotation.y += difference*(1-Math.exp(-dt*16));
    }
    const inAir = athlete.position.y > .015;
    if (this.airborne && !inAir) this.landedAt = tick;
    const falling = this.previous && athlete.position.y < this.previous.y;
    const landing = Math.max(0,1-(tick-this.landedAt)/12);
    const swing = Math.sin(this.gait) * .55 * this.movement;
    const targets: Record<string, number> = {
      spine: .07*this.movement + .09*landing,
      leftHip: swing, rightHip: -swing,
      leftKnee: Math.max(0,-swing)*.8 + .30*landing, rightKnee: Math.max(0,swing)*.8 + .30*landing,
      leftShoulder: -swing*.7, rightShoulder: swing*.7,
      leftElbow: -.10-.13*this.movement, rightElbow: -.10-.13*this.movement,
      head: Math.sin(tick/60*2)*.015*(1-this.movement),
    };
    if (inAir) {
      targets.leftHip=-.22;targets.rightHip=-.22;
      targets.leftKnee=falling ? .35 : .65;targets.rightKnee=falling ? .35 : .65;
      targets.leftShoulder=falling ? -.35 : -.8;targets.rightShoulder=falling ? -.35 : -.8;
    }
    // Contact is the start tick, not a locally predicted future hit.
    let action: NonNullable<SceneSnapshot["visualActions"]>[number] | undefined;
    for (const candidate of frame.visualActions ?? []) {
      if (candidate.actorId !== athlete.id || candidate.tick > tick || tick-candidate.tick >= ACTION_POSES[candidate.kind].duration) continue;
      if (!action || candidate.id > action.id) action = candidate;
    }
    const gesture = action ? ACTION_POSES[action.kind] : undefined;
    const progress = action && gesture ? (tick-action.tick)/gesture.duration : 1;
    const weight = 1-progress*progress*(3-2*progress);
    if (action) this.model.rotation.y = action.facing;
    const blend = this.tick === undefined ? 1 : 1-Math.exp(-dt*20);
    for (const [name,joint] of this.joints) {
      const target = targets[name] ?? joint.x;
      const contact = gesture?.joints[name];
      if (contact !== undefined) joint.node.rotation.x = target + (contact-target)*weight;
      else joint.node.rotation.x += (target-joint.node.rotation.x)*blend;
    }
    this.previous={...athlete.position};this.tick=tick;this.airborne=inAir;
  }
}
