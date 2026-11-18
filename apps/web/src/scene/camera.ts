import { PerspectiveCamera, MathUtils } from "three";
import { Vector3 } from "three";
import type { CourtInsets } from "../game/presentation.js";

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

export function fitCamera(camera: PerspectiveCamera, width: number, height: number, margin = 0): void {
  camera.aspect = width / height;
  const effectiveWidth = width - 2 * Math.min(margin, width / 8);
  const effectiveHeight = height - 2 * Math.min(margin, height / 8);
  const scale = Math.max(height / effectiveHeight, (16 / 9) * height / effectiveWidth);
  camera.fov = MathUtils.radToDeg(2 * Math.atan(Math.tan(MathUtils.degToRad(24)) * scale));
  camera.updateProjectionMatrix();
}

export function fitCourtViewport(camera: PerspectiveCamera, width: number, height: number, insets: CourtInsets, margin: number): void {
  const usableHeight = Math.max(1, height - insets.top - insets.bottom);
  camera.clearViewOffset();
  fitCamera(camera, width, usableHeight, margin);
  if (insets.top || insets.bottom) camera.setViewOffset(width, usableHeight, 0, -insets.top, width, height);
}

export function fitStableCamera(camera:PerspectiveCamera,team:"A"|"B",width:number,height:number,margin=0,insets:CourtInsets={top:0,bottom:0}):void{
  camera.position.set(0,22,team==="A"?-25:25);camera.lookAt(0,1,0);
  camera.userData.following=false;fitCourtViewport(camera,width,height,insets,margin);camera.updateMatrixWorld();
}

/** Elevated, team-aligned view: court and high arcs stay readable without camera bob. */
export function followRallyCamera(camera:PerspectiveCamera,player:{x:number;y:number;z:number},ball:{x:number;y:number;z:number},team:"A"|"B",dt:number):void{
 const x=MathUtils.clamp((player.x+ball.x)*.1,-.6,.6),z=MathUtils.clamp((player.z+ball.z)*.05,-.5,.5);
 const desired=new Vector3(x,22,z+(team==="A"?-25:25)),target=new Vector3(x,1,z);
 const blend=camera.userData.following?1-Math.exp(-Math.min(dt,.1)*4):1;
 camera.position.lerp(desired,blend);camera.lookAt(target);camera.userData.following=true;camera.updateMatrixWorld();
}
