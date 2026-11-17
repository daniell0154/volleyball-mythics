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
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { setError(true); return; }
    const scene = new THREE.Scene();
    let avatar: THREE.Group;
    try { avatar = createPresentationAvatar(assetKey, team); } catch { renderer.dispose(); renderer.forceContextLoss(); setError(true); return; }
    setError(false); avatar.rotation.y = -0.25; scene.add(avatar);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x35536a, 3));
    const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(2, 4, 3); scene.add(light);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30); camera.position.set(1.3, 1.5, 3.5); camera.lookAt(0, 1, 0);
    const target=host.current;target.append(renderer.domElement);
    const resize=()=>{const width=target.clientWidth,height=target.clientHeight;if(!width||!height)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);renderer.render(scene,camera);};
    const observer=new ResizeObserver(resize);observer.observe(target);resize();
    return () => { observer.disconnect();disposeAvatar(avatar); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); };
  }, [assetKey, team]);
  return <div>{error && <p role="status">Modelo 3D indisponível. A ficha e a navegação continuam disponíveis.</p>}<div className="preview-host" ref={host} aria-label="Visual do personagem selecionado" /></div>;
}
