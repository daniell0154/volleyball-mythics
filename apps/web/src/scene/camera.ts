import { PerspectiveCamera, MathUtils } from "three";
import { Vector3 } from "three";

export function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(48, 16 / 9, 0.1, 150);
  camera.position.set(22, 22, 27);
  camera.lookAt(0, 1, 0);
  camera.updateMatrixWorld();
  return camera;
}
export function followCamera(camera: PerspectiveCamera, player: { x: number; y: number; z: number }, team: "A" | "B", dt: number): void {
  const direction = team === "A" ? 1 : -1;
  const desired = new Vector3(player.x, player.y + 3.2, player.z - direction * 5.8);
  const target = new Vector3(player.x, player.y + 1.35, player.z + direction * 5);
  const blend = camera.userData.following ? 1 - Math.exp(-Math.min(dt, 0.1) * 10) : 1;
  camera.position.lerp(desired, blend);
  const current: Vector3 = camera.userData.followTarget ?? target.clone(); current.lerp(target, blend);
  camera.userData.followTarget = current; camera.userData.following = true;
  camera.fov = 65; camera.updateProjectionMatrix(); camera.lookAt(current);
}

export function fitCamera(camera: PerspectiveCamera, width: number, height: number): void {
  camera.aspect = width / height;
  camera.fov = MathUtils.radToDeg(2 * Math.atan(Math.tan(MathUtils.degToRad(24)) * Math.max(1, (16 / 9) / camera.aspect)));
  camera.updateProjectionMatrix();
}

export function fitStableCamera(camera:PerspectiveCamera,team:"A"|"B",width:number,height:number):void{
  camera.position.set(0,22,team==="A"?-25:25);camera.lookAt(0,1,0);
  camera.userData.following=false;fitCamera(camera,width,height);camera.updateMatrixWorld();
}
