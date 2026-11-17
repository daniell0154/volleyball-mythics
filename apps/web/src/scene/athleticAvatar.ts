import * as THREE from "three";
import { appearance } from "./avatar.js";

/** Local coordinates in metres. Each joint owns the limb below it. No physics. */
export function createAthleticAvatar(assetKey: string, team: "A" | "B"): THREE.Group {
  const look = appearance(assetKey);
  const root = new THREE.Group();
  root.userData = { assetKey, gender: look.gender, modelVersion: "athletic-v2" };
  const material = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: .82 });
  const skin = material(look.skin), hair = material(look.hair);
  const jersey = material(team === "A" ? "#154c8a" : "#b94338");
  const shorts = material("#202b43"), accent = material(look.accent);
  const white = material("#ecece6"), ink = material("#182033");
  function joint(parent: THREE.Object3D, name: string, x: number, y: number, z = 0) {
    const group = new THREE.Group(); group.name = name; group.position.set(x,y,z); parent.add(group); return group;
  }
  function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z = 0) {
    const part = new THREE.Mesh(geometry, mat); part.position.set(x,y,z); parent.add(part); return part;
  }
  function oval(parent: THREE.Object3D, mat: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
    const part = mesh(parent, new THREE.SphereGeometry(1,12,8),mat,x,y,z); part.scale.set(sx,sy,sz); return part;
  }
  function limb(parent: THREE.Object3D, mat: THREE.Material, length: number, top: number, bottom: number) {
    mesh(parent,new THREE.CylinderGeometry(top,bottom,length,10),mat,0,-length/2);
    oval(parent,mat,0,0,0,top,top,top);
  }
  const hips = joint(root,"hips",0,.96);
  oval(hips,shorts,0,-.035,0,.255,.15,.15);
  const spine = joint(hips,"spine",0,.08);
  const torso = mesh(spine,new THREE.CylinderGeometry(.30,.21,.43,10),jersey,0,.215);
  torso.scale.z=.58;
  const trim = mesh(spine,new THREE.CylinderGeometry(.215,.215,.035,10),accent,0,.015); trim.scale.z=.6;
  const neck = joint(spine,"neck",0,.48);
  mesh(neck,new THREE.CylinderGeometry(.065,.075,.10,10),skin,0,.035);
  const head = joint(neck,"head",0,.17);
  oval(head,skin,0,.035,0,.135,.175,.125);
  oval(head,hair,0,.155,-.012,.14,.065 + look.hairStyle*.012,.13);
  if (look.hairStyle === 2 || look.gender === "female") oval(head,hair,0,.06,-.11,.12,look.gender === "female" ? .19 : .10,.055);
  for (const s of [-1,1]) {
    oval(head,skin,s*.135,.035,0,.025,.045,.025);
    oval(head,ink,s*.052,.055,.117,.015,.018,.009);
    const brow=mesh(head,new THREE.BoxGeometry(.042,.009,.012),hair,s*.052,.095,.112); brow.rotation.z=s*-.1;
  }
  oval(head,skin,0,.018,.13,.024,.032,.028);
  mesh(head,new THREE.BoxGeometry(.046,.008,.008),ink,0,-.045,.119);
  for (const [side,s] of [["left",-1],["right",1]] as const) {
    const shoulder=joint(spine,side+"Shoulder",s*.30,.40);
    shoulder.rotation.z=s*.09;
    limb(shoulder,skin,.27,.095,.072);
    const elbow=joint(shoulder,side+"Elbow",0,-.27);
    elbow.rotation.x=-.10;
    limb(elbow,skin,.25,.073,.047);
    const wrist=joint(elbow,side+"Wrist",0,-.25);
    oval(wrist,skin,0,-.055,.006,.050,.075,.034);
    oval(wrist,skin,-s*.045,-.035,.015,.022,.038,.022);
    const hip=joint(hips,side+"Hip",s*.145,-.07);
    limb(hip,shorts,.31,.128,.105);
    const knee=joint(hip,side+"Knee",0,-.31);
    limb(knee,skin,.46,.080,.047);
    const ankle=joint(knee,side+"Ankle",0,-.46);
    mesh(ankle,new THREE.CylinderGeometry(.052,.055,.075,10),white,0,-.005);
    oval(ankle,accent,0,-.045,.045,.078,.080,.15);
    oval(ankle,white,0,-.095,.045,.080,.025,.153);
  }
  root.scale.setScalar(look.height);
  root.rotation.y=team==="A"?0:Math.PI;
  return root;
}
