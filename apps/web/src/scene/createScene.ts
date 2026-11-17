import * as THREE from "three";
import { createCamera, fitCamera, followCamera } from "./camera.js";
import { createAvatar, disposeAvatar } from "./avatar.js";
import type { SceneAdapter, SceneSnapshot } from "../game/presentation.js";

export function createScene(host: HTMLElement): SceneAdapter {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#90c9ed");
  const camera = createCamera();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x425a36, 2.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(10, 25, 8); scene.add(sun);
  function box(w: number, h: number, d: number, color: string, x: number, y: number, z: number) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color }));
    mesh.position.set(x, y, z); scene.add(mesh); return mesh;
  }
  box(55, 0.2, 60, "#63805a", 0, -0.25, 0);
  box(13, 0.1, 22, "#db8c58", 0, -0.1, 0);
  box(9, 0.04, 18, "#4b9195", 0, -0.03, 0);
  for (const x of [-4.5, 4.5]) box(0.05, 0.02, 18.05, "#ffffff", x, 0.005, 0);
  for (const z of [-9, -3, 0, 3, 9]) box(9, 0.02, 0.05, "#ffffff", 0, 0.005, z);
  for (const x of [-5, 5]) box(0.12, 2.6, 0.12, "#ebebdf", x, 1.3, 0);
  for (let y = 1.43; y <= 2.44; y += 0.125) box(10, 0.015, 0.015, "#f8f5e4", 0, y, 0);
  for (let x = -5; x <= 5; x += 0.25) box(0.015, 1, 0.015, "#f8f5e4", x, 1.93, 0);
  box(10.2, 0.06, 0.05, "#ffffff", 0, 2.43, 0);
  box(26, 8, 5, "#e6cfac", 0, 4, -19);
  box(27, 0.4, 6, "#6a6673", 0, 8.2, -19);
  for (const y of [2, 5.5]) for (let x = -10; x <= 10; x += 4) box(2, 1.8, 0.05, "#4d7188", x, y, -16.45);
  box(2, 3, 0.1, "#584b44", 0, 1.5, -16.4);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshStandardMaterial({ color: "#fff1bd" }));
  scene.add(ball);
  const athletes = new Map<string, { model: THREE.Object3D; assetKey: string; team: string }>();
  let disposed = false;
  let followId: string | null = null;
  let lastFrame = performance.now();
  const resize = (width: number, height: number) => {
    if (disposed || width <= 0 || height <= 0) return;
    fitCamera(camera, width, height); renderer.setSize(width, height);
  };
  resize(host.clientWidth, host.clientHeight);
  return {
    update(snapshot: SceneSnapshot) {
      if (disposed) return;
      const now = performance.now();
      const followed = snapshot.athletes.find((a) => a.id === followId);
      if (followed) followCamera(camera, followed.position, followed.team, (now - lastFrame) / 1000);
      lastFrame = now;
      ball.position.copy(snapshot.ball);
      const ids = new Set(snapshot.athletes.map((athlete) => athlete.id));
      for (const [id, entry] of athletes) if (!ids.has(id)) {
        scene.remove(entry.model); disposeAvatar(entry.model); athletes.delete(id);
      }
      for (const athlete of snapshot.athletes) {
        const assetKey = athlete.assetKey ?? "";
        let entry = athletes.get(athlete.id);
        if (entry && (entry.assetKey !== assetKey || entry.team !== athlete.team)) { scene.remove(entry.model); disposeAvatar(entry.model); athletes.delete(athlete.id); entry = undefined; }
        if (!entry) {
          let model: THREE.Object3D;
          try { model = createAvatar(assetKey, athlete.team); }
          catch { model = box(0.65, 1.8, 0.65, athlete.team === "A" ? "#154c8a" : "#b94338", 0, 0, 0); model.userData.placeholder = true; }
          scene.add(model); entry = { model, assetKey, team: athlete.team }; athletes.set(athlete.id, entry);
        }
        entry.model.position.set(athlete.position.x, athlete.position.y + (entry.model.userData.placeholder ? 0.9 : 0), athlete.position.z);
      }
      renderer.render(scene, camera);
    }, resize,
    setFollowPlayer(playerId) { followId = playerId; camera.userData.following = false; },
    setQuality(quality) { renderer.setPixelRatio(quality === "high" ? Math.min(devicePixelRatio, 2) : 1); resize(host.clientWidth, host.clientHeight); },
    dispose() {
      if (disposed) return;
      disposed = true;
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
        }
      });
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); scene.clear(); athletes.clear();
    },
  };
}
