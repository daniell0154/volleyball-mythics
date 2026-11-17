import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { disposeAvatar } from "./avatar.js";
import { createPresentationAvatar } from "./avatarManifest.js";
export function CharacterPreview({ assetKey, team }: { assetKey: string; team: "A" | "B" }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch { setError(true); return; }
    const scene = new THREE.Scene(); scene.background = new THREE.Color("#183449");
    let avatar: THREE.Group;
    try { avatar = createPresentationAvatar(assetKey, team); } catch { renderer.dispose(); renderer.forceContextLoss(); setError(true); return; }
    setError(false); avatar.rotation.y = -0.25; scene.add(avatar);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x35536a, 3));
    const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(2, 4, 3); scene.add(light);
    const camera = new THREE.PerspectiveCamera(38, 220 / 260, 0.1, 30); camera.position.set(1.3, 1.5, 3.5); camera.lookAt(0, 1, 0);
    renderer.setSize(220, 260); host.current.append(renderer.domElement); renderer.render(scene, camera);
    return () => { disposeAvatar(avatar); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); };
  }, [assetKey, team]);
  return <div>{error && <p>Prévia indisponível</p>}<div ref={host} aria-label="Visual do personagem selecionado" /></div>;
}
