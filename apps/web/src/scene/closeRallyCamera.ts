import { MathUtils, Matrix4, Quaternion, Vector3, type PerspectiveCamera } from "three";
import type { CourtInsets, Position } from "../game/presentation.js";

export interface CloseCameraProfile {
  readonly setback: number;
  readonly height: number;
}

const profile017: CloseCameraProfile = { setback: 5.8, height: 3.2 };
const worldUp = new Vector3(0, 1, 0);

export class CloseRallyCamera {
  private team: "A" | "B" | undefined;
  private readonly eye = new Vector3();
  private readonly desiredEye = new Vector3();
  private readonly target = new Vector3();
  private readonly desiredRotation = new Quaternion();
  private readonly aimMatrix = new Matrix4();
  private readonly point = new Vector3();
  private readonly backward = new Vector3();
  private distance = 0;

  constructor(private readonly profile = profile017) {}

  reset() {
    this.team = undefined;
    this.distance = 0;
  }

  update(camera: PerspectiveCamera, player: Position, ball: Position, team: "A" | "B", dt: number,
    width: number, height: number, insets: CourtInsets) {
    const direction = team === "A" ? 1 : -1;
    const firstFrame = this.team !== team;
    this.team = team;
    const elapsed = MathUtils.clamp(dt, 0, .1);
    // Track airborne balls a little beyond the lines, then let the existing arrow take over.
    const trackBall = Math.abs(ball.x) <= 6.5 && Math.abs(ball.z) <= 11;
    const ballX = trackBall ? ball.x : 0;
    const ballY = trackBall ? ball.y : 1.4;
    const ballAhead = trackBall ? (ball.z - player.z) * direction : 0;

    this.desiredEye.set(player.x, this.profile.height, player.z - direction * this.profile.setback);
    this.eye.lerp(this.desiredEye, firstFrame ? 1 : 1 - Math.exp(-8 * elapsed));
    this.target.set(
      MathUtils.lerp(player.x, ballX, .35),
      1.25 + .4 * MathUtils.clamp(ballY - 1.25, -1, 8),
      player.z + direction * MathUtils.clamp(2.8 + .5 * ballAhead, 2.2, 11),
    );
    this.aimMatrix.lookAt(this.eye, this.target, worldUp);
    this.desiredRotation.setFromRotationMatrix(this.aimMatrix);
    if (firstFrame) camera.quaternion.copy(this.desiredRotation);
    else camera.quaternion.rotateTowards(this.desiredRotation, Math.min(
      camera.quaternion.angleTo(this.desiredRotation) * (1 - Math.exp(-7 * elapsed)),
      1.4 * elapsed,
    ));

    camera.position.copy(this.eye);
    camera.updateMatrixWorld();
    const required = this.requiredDistance(camera, player, ball, trackBall, width, height, insets, 16);
    // Open immediately at the safe edge. Use a larger margin and an eased return to avoid oscillation.
    if (firstFrame || required > this.distance) this.distance = required;
    else if (this.requiredDistance(camera, player, ball, trackBall, width, height, insets, 26) < this.distance) {
      this.distance = Math.max(required, this.distance * Math.exp(-2.5 * elapsed));
    }
    this.backward.set(0, 0, 1).applyQuaternion(camera.quaternion);
    camera.position.addScaledVector(this.backward, this.distance);
    camera.updateMatrixWorld();
  }

  private requiredDistance(camera: PerspectiveCamera, player: Position, ball: Position, trackBall: boolean,
    width: number, height: number, insets: CourtInsets, padding: number) {
    const usableHeight = Math.max(1, height - insets.top - insets.bottom);
    const projection = camera.projectionMatrix.elements;
    const horizontal = (width - 2 * Math.min(padding, width / 4)) / (width * projection[0]!);
    const vertical = (usableHeight - 2 * Math.min(padding, usableHeight / 4)) / (height * projection[5]!);

    let distance = this.fitPoint(camera, player.x, player.y + .28, player.z, .36, horizontal, vertical);
    distance = Math.max(distance, this.fitPoint(camera, player.x, player.y + 1.58, player.z, .36, horizontal, vertical));
    if (trackBall) {
      // Pixel padding covers the minimum render size. The radius covers the world-sized outline.
      distance = Math.max(distance, this.fitPoint(camera, ball.x, ball.y, ball.z, .13, horizontal, vertical));
      distance = Math.max(distance, this.fitPoint(camera,
        MathUtils.clamp(ball.x, -4.5, 4.5), 0, MathUtils.clamp(ball.z, -9, 9), .36, horizontal, vertical));
    }
    return Math.max(0, distance);
  }

  private fitPoint(camera: PerspectiveCamera, x: number, y: number, z: number, radius: number, horizontal: number, vertical: number) {
    this.point.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
    // Moving the eye along its backward axis only increases depth, leaving view-space x and y unchanged.
    return this.point.z + radius + Math.max(camera.near, (Math.abs(this.point.x) + radius) / horizontal,
      (Math.abs(this.point.y) + radius) / vertical);
  }
}
