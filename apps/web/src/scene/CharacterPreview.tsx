import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { disposeAvatar } from "./avatar.js";
import { appearance, editAppearance, HAIR_STYLES } from "./avatarAppearance.js";
import { createPresentationAvatar } from "./avatarManifest.js";

type HairStyle = keyof typeof HAIR_STYLES;
export type HairThumbnails = Partial<Record<HairStyle, string>>;
type Surface = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  avatar?: THREE.Group;
  draw: () => void;
  resize: () => void;
};

function lightPreview(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x35536a, 3));
  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(2, 4, 3);
  scene.add(light);
}

export function CharacterPreview({ assetKey, team, interactive = false, summary, galleryKey, onGallery }: {
  assetKey: string;
  team: "A" | "B";
  interactive?: boolean;
  summary?: string;
  galleryKey?: string;
  onGallery?: (images: HairThumbnails) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const surface = useRef<Surface | null>(null);
  const angle = useRef(-0.25);
  const drag = useRef<{ pointerId: number; x: number } | null>(null);
  const [error, setError] = useState(false);

  function rotate(value: number) {
    angle.current = value;
    const view = surface.current;
    if (!view?.avatar) return;
    view.avatar.rotation.y = value;
    view.draw();
  }

  useEffect(() => {
    const target = host.current;
    if (!target) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setError(true);
      return;
    }

    const scene = new THREE.Scene();
    lightPreview(scene);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30);
    camera.position.set(interactive ? 0 : 1.3, 1.5, interactive ? 4.1 : 3.5);
    camera.lookAt(0, 1, 0);
    const draw = () => renderer.render(scene, camera);
    const resize = () => {
      const width = target.clientWidth, height = target.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      if (interactive) {
        camera.position.z = Math.max(4.1, 2.8 / camera.aspect);
        camera.lookAt(0, 1, 0);
      }
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      draw();
    };
    target.append(renderer.domElement);
    const view: Surface = { renderer, scene, draw, resize };
    surface.current = view;
    const observer = new ResizeObserver(resize);
    observer.observe(target);
    resize();
    return () => {
      observer.disconnect();
      if (view.avatar) disposeAvatar(view.avatar);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      surface.current = null;
    };
  }, [interactive]);

  useEffect(() => {
    const view = surface.current;
    if (!view) return;
    if (view.avatar) {
      view.scene.remove(view.avatar);
      disposeAvatar(view.avatar);
      delete view.avatar;
    }
    try {
      const avatar = createPresentationAvatar(assetKey, team);
      avatar.rotation.y = angle.current;
      view.avatar = avatar;
      view.scene.add(avatar);
      setError(false);
    } catch {
      setError(true);
    }
    view.draw();
  }, [assetKey, team, interactive]);

  useEffect(() => {
    const view = surface.current;
    if (!galleryKey || !onGallery) return;
    if (!view) { onGallery({}); return; }

    const scene = new THREE.Scene();
    lightPreview(scene);
    const camera = new THREE.PerspectiveCamera(27, 112 / 96, 0.1, 10);
    const y = appearance(galleryKey).height * 1.78;
    camera.position.set(1.1, y + .07, .58);
    camera.lookAt(0, y, 0);
    const images: HairThumbnails = {};
    try {
      view.renderer.setSize(112, 96, false);
      for (const style of Object.keys(HAIR_STYLES) as HairStyle[]) {
        const avatar = createPresentationAvatar(editAppearance(galleryKey, { hairId: style }), team);
        avatar.rotation.y = 0;
        scene.add(avatar);
        try {
          view.renderer.render(scene, camera);
          images[style] = view.renderer.domElement.toDataURL();
        } finally {
          scene.remove(avatar);
          disposeAvatar(avatar);
        }
      }
      onGallery(images);
    } catch {
      onGallery({});
    } finally {
      view.resize();
    }
  }, [galleryKey, onGallery, team, interactive]);

  return <div className={interactive ? "avatar-preview-interactive" : undefined}>
    {error && <p role="status">Modelo 3D indisponível. {summary ?? "A ficha e a navegação continuam disponíveis."}</p>}
    <div className="preview-host" ref={host} hidden={error}
      aria-label={interactive ? "Prévia do atleta. Use as setas para girar e Home para voltar à frente." : "Visual do personagem selecionado"}
      role={interactive ? "region" : undefined} tabIndex={interactive && !error ? 0 : undefined}
      onKeyDown={interactive ? event => {
        if (event.key === "ArrowLeft") rotate(angle.current - Math.PI / 8);
        else if (event.key === "ArrowRight") rotate(angle.current + Math.PI / 8);
        else if (event.key === "Home") rotate(0);
        else return;
        event.preventDefault();
      } : undefined}
      onPointerDown={interactive ? event => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { pointerId: event.pointerId, x: event.clientX };
      } : undefined}
      onPointerMove={interactive ? event => {
        const previous = drag.current;
        if (previous?.pointerId !== event.pointerId) return;
        rotate(angle.current + (event.clientX - previous.x) * .015);
        previous.x = event.clientX;
      } : undefined}
      onLostPointerCapture={() => { drag.current = null; }}
    />
    {interactive && !error && <>
      <div className="admin-preview-actions">
        <button type="button" onClick={() => rotate(angle.current - Math.PI / 8)}>Girar à esquerda</button>
        <button type="button" onClick={() => rotate(0)}>Frente</button>
        <button type="button" onClick={() => rotate(angle.current + Math.PI / 8)}>Girar à direita</button>
      </div>
      <p className="helper">Arraste para girar. As cores do uniforme variam com o time.</p>
    </>}
  </div>;
}
