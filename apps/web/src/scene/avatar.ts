import * as THREE from "three";
import { appearance } from "./avatarAppearance.js";
export { appearance } from "./avatarAppearance.js";

export function createAvatar(assetKey: string, team: "A" | "B", look = appearance(assetKey)): THREE.Group {
  const group = new THREE.Group();
  group.userData.assetKey = assetKey;
  group.userData.gender = look.gender;
  const box = (w: number, h: number, d: number, color: string, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
    mesh.position.set(x, y, z); group.add(mesh); return mesh;
  };
  const jersey = team === "A" ? "#154c8a" : "#b94338";
  const width = look.gender === "male" ? 0.62 : 0.51;
  for (const x of [-0.17, 0.17]) {
    box(0.22, 0.65, 0.24, look.skin, x, 0.4, 0);
    box(0.26, 0.13, 0.4, look.accent, x, 0.065, 0.08);
  }
  box(0.57, 0.28, 0.31, "#202b43", 0, 0.83, 0);
  box(width, 0.6, 0.34, jersey, 0, 1.17, 0);
  box(width, 0.07, 0.355, look.accent, 0, 1.01, 0);
  for (const side of [-1, 1]) {
    box(0.19, 0.5, 0.22, look.skin, side * (width / 2 + 0.1), 1.08, 0);
    box(0.21, 0.18, 0.24, jersey, side * (width / 2 + 0.1), 1.33, 0);
  }
  box(0.14, 0.15, 0.15, look.skin, 0, 1.5, 0);
  box(0.36, 0.38, 0.35, look.skin, 0, 1.73, 0);
  if (look.hairId === "curly") {
    for (const x of [-.13, 0, .13]) for (const z of [-.12, 0, .12]) {
      box(.17, .15, .17, look.hair, x, 1.95, z);
    }
  } else if (look.hairId !== "bald") box(0.39, 0.1 + look.hairStyle * 0.035, 0.39, look.hair, 0, 1.92, 0);
  if (look.hairStyle === 1) box(0.21, 0.1, 0.37, look.hair, -0.08, 1.99, 0);
  if (look.hairStyle === 2) box(0.37, 0.22, 0.1, look.hair, 0, 1.8, -0.18);
  if (look.longHair) box(0.22, 0.42, 0.18, look.hair, 0, 1.65, -0.26);
  for (const x of [-0.09, 0.09]) box(0.045, 0.045, 0.025, "#182033", x, 1.76, 0.18);
  group.scale.setScalar(look.height);
  group.rotation.y = team === "A" ? 0 : Math.PI;
  return group;
}

export function disposeAvatar(group: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}
