import * as THREE from "three";
import { createCamera, fitCamera, followRallyCamera,fitStableCamera } from "./camera.js";
import {visualBallScale,ballScreenCue} from "./ballVisibility.js";
import { disposeAvatar } from "./avatar.js";
import { createPresentationAvatar } from "./avatarManifest.js";
import { AvatarAnimator } from "./animateAvatar.js";
import type { SceneAdapter, SceneSnapshot } from "../game/presentation.js";

export function createScene(host: HTMLElement, { reserveCueMargin = false } = {}): SceneAdapter {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  host.append(renderer.domElement);
  const originalPosition = host.style.position;
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  const cue=document.createElement("span");cue.setAttribute("aria-hidden","true");cue.dataset.ballCue="true";
  cue.style.cssText="position:absolute;pointer-events:none;width:14px;height:14px;border:2px solid #101820;border-radius:50%;background:#ffe600;box-shadow:0 0 0 2px white;color:#101820;font:bold 18px/20px Arial;text-align:center;transform:translate(-50%,-50%);z-index:1;display:none";host.append(cue);
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
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshBasicMaterial({ color: "#ffe600" }));
  scene.add(ball);
  const outline=new THREE.Mesh(new THREE.SphereGeometry(.11,16,12),new THREE.MeshBasicMaterial({color:"#101820",side:THREE.BackSide}));outline.scale.setScalar(1.18);ball.add(outline);
  const shadow=new THREE.Mesh(new THREE.RingGeometry(.18,.30,32),new THREE.MeshBasicMaterial({color:"#101820",transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide}));shadow.rotation.x=-Math.PI/2;scene.add(shadow);
  const shadowBorder=new THREE.Mesh(new THREE.RingGeometry(.30,.36,32),new THREE.MeshBasicMaterial({color:"#ffffff",transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide}));shadowBorder.rotation.x=-Math.PI/2;scene.add(shadowBorder);
  const marker=new THREE.Group();marker.visible=false;scene.add(marker);
  for(const [inner,outer,color]of [[.40,.47,"#ffffff"],[.47,.51,"#102334"]] as const){
    const ring=new THREE.Mesh(new THREE.RingGeometry(inner,outer,32),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));
    ring.name="local-player-marker";ring.rotation.x=-Math.PI/2;ring.position.y=.025;marker.add(ring);
  }
  const triangle=new THREE.Shape();triangle.moveTo(0,.3);triangle.lineTo(-.16,.64);triangle.lineTo(.16,.64);triangle.closePath();
  const arrow=new THREE.Mesh(new THREE.ShapeGeometry(triangle),new THREE.MeshBasicMaterial({color:"#ffd277",side:THREE.DoubleSide}));arrow.rotation.x=-Math.PI/2;arrow.position.y=.028;marker.add(arrow);
  const labelCanvas=document.createElement("canvas");labelCanvas.width=256;labelCanvas.height=64;
  const labelContext=labelCanvas.getContext("2d");
  let markerTexture:THREE.CanvasTexture|undefined;
  let markerLabel:THREE.Sprite|undefined;
  if(labelContext){labelContext.fillStyle="#102334";labelContext.fillRect(0,0,256,64);labelContext.fillStyle="#ffffff";labelContext.font="bold 42px sans-serif";labelContext.textAlign="center";labelContext.fillText("VOCÊ",128,47);markerTexture=new THREE.CanvasTexture(labelCanvas);markerLabel=new THREE.Sprite(new THREE.SpriteMaterial({map:markerTexture,depthTest:true,depthWrite:false}));markerLabel.scale.set(1.1,.275,1);marker.add(markerLabel);}
  const athletes = new Map<string, { model: THREE.Object3D; assetKey: string; team: string; animator: AvatarAnimator }>();
  let matchId: string | undefined;
  let disposed = false;
  let followId: string | null = null;
  let reducedMotion=false;
  let stableTeam:string|undefined;
  let lastFrame = performance.now();
  const margin = reserveCueMargin ? 16 : 0;
  let viewportWidth = 0;
  let viewportHeight = 0;
  const resize = (width: number, height: number) => {
    if (disposed) return;
    viewportWidth = width;
    viewportHeight = height;
    if (width <= 0 || height <= 0) return;
    fitCamera(camera, width, height, margin);
    renderer.setSize(width, height);
  };
  resize(host.clientWidth, host.clientHeight);
  return {
    update(snapshot: SceneSnapshot) {
      if (disposed || viewportWidth <= 0 || viewportHeight <= 0) return;
      if (matchId !== snapshot.matchId) {
        for (const entry of athletes.values()) { scene.remove(entry.model); disposeAvatar(entry.model); }
        athletes.clear(); matchId = snapshot.matchId;
      }
      const now = performance.now();
      const followed = snapshot.athletes.find((a) => a.id === followId);
      if (followed&&!reducedMotion) followRallyCamera(camera, followed.position,snapshot.ball, followed.team, (now - lastFrame) / 1000);
      if(followed&&reducedMotion&&stableTeam!==followed.team){fitStableCamera(camera,followed.team,viewportWidth,viewportHeight,margin);stableTeam=followed.team;}
      marker.visible=Boolean(followed);
      if(followed){marker.position.set(followed.position.x,0,followed.position.z);marker.rotation.y=followed.team==="A"?0:Math.PI;if(markerLabel)markerLabel.position.y=followed.position.y+2.25;}
      lastFrame = now;
      ball.position.copy(snapshot.ball);
      camera.updateMatrixWorld();ball.scale.setScalar(visualBallScale(camera,snapshot.ball,viewportHeight));
      shadow.position.set(snapshot.ball.x,.035,snapshot.ball.z);shadowBorder.position.copy(shadow.position);
      shadow.material.opacity=Math.max(.25,.75-snapshot.ball.y*.035);shadowBorder.material.opacity=shadow.material.opacity;
      const screen=ballScreenCue(camera,snapshot.ball,viewportWidth,viewportHeight,margin);cue.style.display="block";cue.style.left=screen.x+"px";cue.style.top=screen.y+"px";
      cue.textContent=screen.offscreen?screen.arrow:"";cue.style.width=cue.style.height=screen.offscreen?"24px":"14px";cue.style.borderRadius=screen.offscreen?"6px":"50%";
      cue.title=screen.offscreen?"Bola fora da tela":"Posição atual da bola";
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
          try { model = createPresentationAvatar(assetKey, athlete.team); }
          catch { model = box(0.65, 1.8, 0.65, athlete.team === "A" ? "#154c8a" : "#b94338", 0, 0, 0); model.userData.placeholder = true; }
          scene.add(model); entry = { model, assetKey, team: athlete.team, animator: new AvatarAnimator(model) }; athletes.set(athlete.id, entry);
        }
        entry.model.position.set(athlete.position.x, athlete.position.y + (entry.model.userData.placeholder ? 0.9 : 0), athlete.position.z);
        entry.animator.update(snapshot, athlete);
      }
      renderer.render(scene, camera);
    }, resize(width,height){resize(width,height);stableTeam=undefined;},
    setFollowPlayer(playerId) { followId = playerId; camera.userData.following = false;stableTeam=undefined; },
    setReducedMotion(reduced){reducedMotion=reduced;stableTeam=undefined;camera.userData.following=false;},
    setQuality(quality) { renderer.setPixelRatio(quality === "high" ? Math.min(devicePixelRatio, 2) : 1); resize(host.clientWidth, host.clientHeight); },
    dispose() {
      if (disposed) return;
      disposed = true;
      disposeAvatar(scene);
      markerLabel?.material.dispose();
      markerTexture?.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();cue.remove();host.style.position=originalPosition; scene.clear(); athletes.clear();
    },
  };
}
