import { PerspectiveCamera, MathUtils } from "three";

export function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(48, 16 / 9, 0.1, 150);
  camera.position.set(22, 22, 27);
  camera.lookAt(0, 1, 0);
  camera.updateMatrixWorld();
  return camera;
}

export function fitCamera(camera: PerspectiveCamera, width: number, height: number): void {
  camera.aspect = width / height;
  camera.fov = MathUtils.radToDeg(2 * Math.atan(Math.tan(MathUtils.degToRad(24)) * Math.max(1, (16 / 9) / camera.aspect)));
  camera.updateProjectionMatrix();
}
