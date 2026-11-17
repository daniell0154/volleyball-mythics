import * as THREE from "three";
import type { SceneAdapter, SceneSnapshot } from "../game/presentation.js";

export function createScene(host: HTMLElement): SceneAdapter {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#90c9ed");
  const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 150);
  camera.position.set(22, 22, 27);
  camera.lookAt(0, 1, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x425a36, 2.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(10, 25, 8); scene.add(sun);
  function box(w: number, h: number, d: number, color: string, x: number, y: number, z: number) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color }));
    mesh.position.set(x, y, z); scene.add(mesh); return mesh;
  }
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshStandardMaterial({ color: "#fff1bd" }));
  scene.add(ball);
  const athletes = new Map<string, THREE.Mesh>();
  let disposed = false;
  const resize = (width: number, height: number) => {
    if (disposed || width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    // Fit the entire play area even in narrow windows.
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(48 / 2)) * Math.max(1, (16 / 9) / camera.aspect)));
    camera.updateProjectionMatrix(); renderer.setSize(width, height);
  };
  resize(host.clientWidth, host.clientHeight);
  return {
    update(snapshot: SceneSnapshot) {
      if (disposed) return;
      ball.position.copy(snapshot.ball);
      const ids = new Set(snapshot.athletes.map((athlete) => athlete.id));
      for (const [id, mesh] of athletes) if (!ids.has(id)) {
        scene.remove(mesh); mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); athletes.delete(id);
      }
      for (const athlete of snapshot.athletes) {
        let mesh = athletes.get(athlete.id);
        if (!mesh) { mesh = box(0.65, 1.8, 0.65, athlete.team === "A" ? "#154c8a" : "#b94338", 0, 0, 0); athletes.set(athlete.id, mesh); }
        mesh.position.set(athlete.position.x, athlete.position.y + 0.9, athlete.position.z);
      }
      renderer.render(scene, camera);
    }, resize,
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
