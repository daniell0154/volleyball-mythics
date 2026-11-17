import * as THREE from "three";

export function appearance(assetKey: string) {
  const match = /^procedural:v1:(male|female):([0-9]{1,10})$/.exec(assetKey);
  if (!match || Number(match[2]) > 4294967295) throw new Error("Unknown avatar asset");
  let seed = Number(match[2]) >>> 0;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const pick = (values: string[]) => values[Math.floor(random() * values.length)]!;
  return { gender: match[1]!, skin: pick(["#f1c7a5", "#d8a07b", "#ab714e", "#704931"]), hair: pick(["#261b16", "#543628", "#b48a4b", "#171923"]), accent: pick(["#fbd24c", "#74e6cd", "#ef96c3", "#d6e3fb"]), height: 0.95 + random() * 0.1, hairStyle: Math.floor(random() * 3) };
}

export function createAvatar(assetKey: string, team: "A" | "B"): THREE.Group {
  const look = appearance(assetKey);
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
  box(0.39, 0.1 + look.hairStyle * 0.035, 0.39, look.hair, 0, 1.92, 0);
  if (look.hairStyle === 1) box(0.21, 0.1, 0.37, look.hair, -0.08, 1.99, 0);
  if (look.hairStyle === 2) box(0.37, 0.22, 0.1, look.hair, 0, 1.8, -0.18);
  if (look.gender === "female") box(0.22, 0.42, 0.18, look.hair, 0, 1.65, -0.26);
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
