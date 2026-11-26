/**
 * Realistic 3D figure (MakeHuman CC0 models, built by scripts/blender/build_humans.py).
 *
 * The exercise poses are the same 2D side-view angles the flat figure uses
 * ([torso, head, far upper arm, far forearm, near upper arm, near forearm, far thigh, far shin,
 * near thigh, near shin, back curve]; 0° points down, 180° up, the body faces screen-right).
 * Each 3D bone is turned the shortest way from its rest pose until it points along the same
 * direction as its 2D segment, so all 1000+ poses work without per-pose data.
 *
 * One WebGL renderer is shared by every figure on screen (browsers allow only a few contexts);
 * a frame is rendered into it and copied onto the caller's 2D canvas. Until the model is loaded,
 * or without WebGL, callers keep drawing the flat figure.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Figure } from './types';
import { skeleton, type FigureModel } from './figure';

type Seg = 'hips' | 'lHand' | 'rHand' | 'spine' | 'spine1' | 'spine2' | 'neck' | 'head' | 'lArm' | 'lFore' | 'rArm' | 'rFore' | 'lThigh' | 'lShin' | 'rThigh' | 'rShin';
const BONES: Record<Seg, string> = {
  hips: 'Hips', lHand: 'LeftHand', rHand: 'RightHand',
  spine: 'Spine', spine1: 'Spine1', spine2: 'Spine2', neck: 'Neck', head: 'Head',
  lArm: 'LeftArm', lFore: 'LeftForeArm', rArm: 'RightArm', rFore: 'RightForeArm',
  lThigh: 'LeftUpLeg', lShin: 'LeftLeg', rThigh: 'RightUpLeg', rShin: 'RightLeg',
};
/** Bone whose head marks where each segment ends (gives the rest direction). */
const CHILD: Record<Seg, string> = {
  hips: 'Spine', lHand: 'LeftHandMiddle1', rHand: 'RightHandMiddle1',
  spine: 'Spine1', spine1: 'Spine2', spine2: 'Neck', neck: 'Head', head: 'Head',
  lArm: 'LeftForeArm', lFore: 'LeftHand', rArm: 'RightForeArm', rFore: 'RightHand',
  lThigh: 'LeftLeg', lShin: 'LeftFoot', rThigh: 'RightLeg', rShin: 'RightFoot',
};
/** Parents before children, so world rotations are up to date when a child is set. */
const ORDER: Seg[] = ['hips', 'spine', 'spine1', 'spine2', 'neck', 'head', 'lArm', 'lFore', 'lHand', 'rArm', 'rFore', 'rHand', 'lThigh', 'lShin', 'rThigh', 'rShin'];

/** 2D angle → 3D direction in model space: forward is +Z, up is +Y (canvas y points down). */
const dir = (deg: number, out = new THREE.Vector3()) => {
  const r = (deg * Math.PI) / 180;
  return out.set(0, -Math.cos(r), Math.sin(r)).normalize();
};

interface Rig {
  root: THREE.Object3D;
  meshes: THREE.SkinnedMesh[];
  bones: Record<string, THREE.Bone>;
  /** World rotation of each bone and its rest direction, in the bind pose. */
  bind: Record<Seg, { q: THREE.Quaternion; d: THREE.Vector3 }>;
}

let renderer: THREE.WebGLRenderer | null = null;
let failed = false;
const scene = new THREE.Scene();
/** Perspective camera like a filmed class: about chest height, looking slightly down. */
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 60);
const rigs = new Map<FigureModel, Rig>();
const loading = new Map<FigureModel, Promise<void>>();
const listeners = new Set<() => void>();

/** Notified when a model finishes loading (thumbnails redraw). */
export function onFigure3DReady(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Small canvas texture: base colour plus fine noise (rubber grain, wood grain). */
function grainTexture(base: [number, number, number], amount: number, streaks = false, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    // wood: long soft stripes along one axis
    const stripe = streaks ? Math.sin(y * 0.35 + Math.sin(y * 0.05) * 4) * 0.5 + Math.sin(y * 1.7) * 0.15 : 0;
    for (let x = 0; x < size; x++) {
      const n = (Math.random() - 0.5) * amount + stripe * amount * 0.8;
      const i = (y * size + x) * 4;
      img.data[i] = Math.max(0, Math.min(255, base[0] + n));
      img.data[i + 1] = Math.max(0, Math.min(255, base[1] + n));
      img.data[i + 2] = Math.max(0, Math.min(255, base[2] + n));
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Radial fade so the floor melts into the app background instead of ending in a hard edge. */
function fadeTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(128, 128, 20, 128, 128, 128);
  grd.addColorStop(0, '#fff');
  grd.addColorStop(0.55, '#bbb');
  grd.addColorStop(1, '#000');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

let key: THREE.DirectionalLight;
const stage = new THREE.Group();

/** Yoga mat 183 × 61 cm, 5 mm thick with rounded corners, muted blue like a studio mat. */
function makeMat() {
  const L = 1.83;
  const W = 0.61;
  const r = 0.03;
  const s = new THREE.Shape();
  s.moveTo(-W / 2 + r, -L / 2);
  s.lineTo(W / 2 - r, -L / 2);
  s.quadraticCurveTo(W / 2, -L / 2, W / 2, -L / 2 + r);
  s.lineTo(W / 2, L / 2 - r);
  s.quadraticCurveTo(W / 2, L / 2, W / 2 - r, L / 2);
  s.lineTo(-W / 2 + r, L / 2);
  s.quadraticCurveTo(-W / 2, L / 2, -W / 2, L / 2 - r);
  s.lineTo(-W / 2, -L / 2 + r);
  s.quadraticCurveTo(-W / 2, -L / 2, -W / 2 + r, -L / 2);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.005, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.002, bevelSegments: 2, curveSegments: 6 });
  geo.rotateX(-Math.PI / 2); // lie flat, length along Z
  const tex = grainTexture([84, 112, 138], 18);
  tex.repeat.set(3, 9);
  const mat = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0 }));
  mat.receiveShadow = true;
  return mat;
}

function setupScene() {
  scene.add(new THREE.HemisphereLight(0xfff4e8, 0x3a3028, 1.1));
  // soft key light from the front-left above, casting the body's shadow on mat and floor
  key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-2.5, 4.5, 2.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  const sc = key.shadow.camera;
  sc.left = sc.bottom = -1.8;
  sc.right = sc.top = 1.8;
  sc.near = 0.5;
  sc.far = 12;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xcfe0ff, 1.1);
  rim.position.set(2, 3, -3);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffe8d0, 0.5);
  fill.position.set(-2, 1, 4);
  scene.add(fill);
  // warm wooden floor fading out into the background, with the mat on it
  const floorTex = grainTexture([150, 108, 72], 26, true);
  floorTex.repeat.set(2, 6);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshStandardMaterial({ map: floorTex, alphaMap: fadeTexture(), transparent: true, roughness: 0.75, depthWrite: false }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.renderOrder = -1;
  const mat = makeMat();
  mat.position.y = 0.0005;
  // soft ambient-occlusion blob right under the body: the eye reads it as "touching the mat"
  const blob = document.createElement('canvas');
  blob.width = blob.height = 128;
  const bg = blob.getContext('2d')!;
  const grd = bg.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)');
  grd.addColorStop(0.5, 'rgba(0,0,0,0.28)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  bg.fillStyle = grd;
  bg.fillRect(0, 0, 128, 128);
  contact.geometry = new THREE.PlaneGeometry(1, 1);
  contact.material = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blob), transparent: true, depthWrite: false });
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.0085; // just above the mat's top face
  contact.renderOrder = 1;
  stage.add(floor, mat, contact);
  scene.add(stage);
  loadPhotoTextures(floor.material as THREE.MeshStandardMaterial, mat.material as THREE.MeshStandardMaterial);
}

/**
 * Photo-scanned CC0 textures from Poly Haven (public/textures, see LICENSE.txt): oak planks for
 * the floor, and the grain (normal + roughness) of a rubber surface for the mat, tinted mat-blue.
 * They replace the generated textures once loaded; until then, or offline, those stay.
 */
function loadPhotoTextures(floorMat: THREE.MeshStandardMaterial, matMat: THREE.MeshStandardMaterial) {
  const base = `${import.meta.env.BASE_URL}textures/`;
  const loader = new THREE.TextureLoader();
  const tex = (name: string, color: boolean, repeat: [number, number], rotate = false) =>
    loader.loadAsync(base + name).then((t) => {
      if (color) t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(...repeat);
      if (rotate) t.rotation = Math.PI / 2; // planks run along the mat
      t.anisotropy = 4;
      return t;
    });
  // floor: 9 m plane, planks about 2 m per texture tile
  Promise.all([tex('oak_diff.jpg', true, [4.5, 4.5], true), tex('oak_nor.jpg', false, [4.5, 4.5], true), tex('oak_rough.jpg', false, [4.5, 4.5], true)])
    .then(([map, normalMap, roughnessMap]) => {
      Object.assign(floorMat, { map, normalMap, roughnessMap, roughness: 1 });
      floorMat.color.set(0xffffff);
      floorMat.needsUpdate = true;
    })
    .catch(() => {});
  // mat: plain studio blue with the photo rubber grain (extrude UVs are in metres: ~25 cm tiles)
  Promise.all([tex('rubber_nor.jpg', false, [4, 4]), tex('rubber_rough.jpg', false, [4, 4])])
    .then(([normalMap, roughnessMap]) => {
      Object.assign(matMat, { map: null, normalMap, roughnessMap, roughness: 1 });
      matMat.normalScale.set(0.55, 0.55);
      matMat.color.set(0x5b7f9f);
      matMat.needsUpdate = true;
    })
    .catch(() => {});
}
const contact = new THREE.Mesh();

function getRenderer(): THREE.WebGLRenderer | null {
  if (renderer || failed) return renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    setupScene();
  } catch {
    failed = true;
  }
  return renderer;
}

const MODEL_URL = (m: FigureModel) => `${import.meta.env.BASE_URL}models/${m}.glb`;

function load(model: FigureModel) {
  if (rigs.has(model) || loading.has(model) || !getRenderer()) return;
  const p = new GLTFLoader()
    .loadAsync(MODEL_URL(model))
    .then((gltf) => {
      const root = gltf.scene;
      const meshes: THREE.SkinnedMesh[] = [];
      const bones: Record<string, THREE.Bone> = {};
      root.traverse((o) => {
        if ((o as THREE.Bone).isBone) bones[o.name.replace(/^mixamorig:?/, '')] = o as THREE.Bone;
        const sm = o as THREE.SkinnedMesh;
        if (sm.isSkinnedMesh) {
          meshes.push(sm);
          sm.frustumCulled = false;
          sm.castShadow = true;
          const mats = Array.isArray(sm.material) ? sm.material : [sm.material];
          for (const m of mats as THREE.MeshStandardMaterial[]) {
            // hair, brows, lashes and the eye's clear cornea: cut-out, never blended (blending breaks depth order)
            if (/eyebrow|eyelash|ponytail|short0|hair|high-poly/i.test(m.name)) {
              m.transparent = false;
              m.alphaTest = 0.4;
              m.depthWrite = true;
            } else {
              m.transparent = false;
              m.alphaTest = 0;
            }
            m.side = THREE.FrontSide;
            if (model === 'male' && /casualsuit/i.test(m.name)) m.color.setRGB(0.55, 0.58, 0.68); // tones the jeans toward track pants
          }
        }
      });
      root.updateMatrixWorld(true);
      const bind = {} as Rig['bind'];
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      for (const s of ORDER) {
        const bone = bones[BONES[s]];
        const child = bones[CHILD[s]];
        if (!bone || !child) throw new Error(`missing bone ${BONES[s]}`);
        bone.getWorldPosition(a);
        // the head has no child joint: use its own up axis
        const d = s === 'head' ? new THREE.Vector3(0, 1, 0).applyQuaternion(bone.getWorldQuaternion(new THREE.Quaternion())) : child.getWorldPosition(b).sub(a).normalize();
        bind[s] = { q: bone.getWorldQuaternion(new THREE.Quaternion()), d: d.clone() };
      }
      rigs.set(model, { root, meshes, bones, bind });
      listeners.forEach((cb) => cb());
    })
    .catch(() => {
      /* stays on the flat figure */
    })
    .finally(() => loading.delete(model));
  loading.set(model, p);
}

/** Starts loading a model ahead of time (e.g. when the settings choose it). */
export const preloadFigure3D = (model: FigureModel) => load(model);
export const figure3DReady = (model: FigureModel) => rigs.has(model);

const tmpQ = new THREE.Quaternion();
const tmpQ2 = new THREE.Quaternion();
const yawQ = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

/**
 * Angle of `a` relative to `b`, kept inside the joint's range [lo, hi] (degrees). The difference
 * is first unwrapped into the 360° window starting at lo, so a joint at exactly ±180° (arms in
 * line overhead) is read as the allowed +180 rather than a forbidden −180; values past hi snap
 * to whichever end is closer.
 */
function within(a: number, b: number, lo: number, hi: number): number {
  const d = ((((a - b - lo) % 360) + 360) % 360) + lo;
  if (d <= hi) return d;
  return d - hi < lo + 360 - d ? hi : lo;
}

/**
 * Keeps a pose inside human joint ranges (degrees, relative to the parent segment):
 * knees and elbows are hinges that bend one way only, the hip cannot fold the torso into the
 * thighs, shoulders and neck have their real limits. Poses facing the camera (movement in the
 * frontal plane) skip the hinge rules, since their bends are seen from the front.
 */
export function humanize(f: Figure, sideways = false): Figure {
  let [torso, head, fua, ffa, nua, nfa, fth, fsh, nth, nsh, curve = 0] = f;
  // hip flexion (thigh forward of the torso line) at most 150°: deeper folds would put the
  // torso inside the legs, so the torso is lifted forward instead
  const torsoDown = torso - 180;
  const flex = Math.max(within(fth, torsoDown, -180, 180), within(nth, torsoDown, -180, 180));
  // with the knees fully bent (child's pose, garland) the thighs tuck under the torso and the
  // hips can fold further than with straight legs
  const kneesBent = Math.min(Math.abs(within(fth, fsh, -180, 180)), Math.abs(within(nth, nsh, -180, 180))) > 110;
  const maxFlex = kneesBent ? 168 : 150;
  if (flex > maxFlex) torso += flex - maxFlex;
  const base = torso - 180;
  const limitThigh = (th: number) => base + within(th, base, -65, maxFlex);
  fth = limitThigh(fth);
  nth = limitThigh(nth);
  // shoulders: from 70° behind the body to just past overhead
  const limitArm = (ua: number) => base + within(ua, base, -70, 190);
  fua = limitArm(fua);
  nua = limitArm(nua);
  // neck: 55° either way from the torso line
  head = torso + within(head, torso, -55, 55);
  if (!sideways) {
    // knee: the shin swings back from the thigh, 0–155°; elbow: forearm swings forward, 0–150°
    const knee = (th: number, sh: number) => th - within(th, sh, -4, 155);
    const elbow = (ua: number, fa: number) => ua + within(fa, ua, -4, 150);
    fsh = knee(fth, fsh);
    nsh = knee(nth, nsh);
    ffa = elbow(fua, ffa);
    nfa = elbow(nua, nfa);
  }
  return [torso, head, fua, ffa, nua, nfa, fth, fsh, nth, nsh, curve];
}

/**
 * Poses the rig. `yaw` turns the whole body about the vertical axis: 0 = side view (body faces
 * screen-right, the default for poses drawn from the side), 90 = body faces the camera, for
 * poses whose arms or legs move out to the sides (warrior II, jumping jacks…).
 */
function pose(rig: Rig, raw: Figure, breath: number, yaw: number) {
  const sideways = yaw > 45;
  let [torso, head, fua, ffa, nua, nfa, fth, fsh, nth, nsh, curve = 0] = humanize(raw, sideways);
  if (sideways) {
    // Drawn from the side, a symmetric pose gives both limbs the same angle (goddess knees,
    // jumping-jack arms). Seen from the front they go one to each side: mirror the far limb.
    // Limbs that already differ (warrior II arms front/back) are left as they are.
    const same = (a: number, b: number) => Math.abs(within(a, b, -180, 180)) < 20;
    if (same(fua, nua) && same(ffa, nfa) && Math.abs(within(nua, 0, -180, 180)) > 8) [fua, ffa] = [-fua, -ffa];
    // legs that simply continue the body line (side plank) stay together
    const inLine = Math.abs(within(nth, torso - 180, -180, 180)) < 25;
    if (!inLine && same(fth, nth) && same(fsh, nsh) && Math.abs(within(nth, 0, -180, 180)) > 8) [fth, fsh] = [-fth, -fsh];
  }
  // Kneeling contact: where the pose puts both knee and foot on the floor (tabletop, child's
  // pose, low lunge back leg), the shin lies flat on the mat, so knee and toes both touch.
  const s2 = skeleton([torso, head, fua, ffa, nua, nfa, fth, fsh, nth, nsh, curve]);
  const floor2D = Math.max(...Object.values(s2).map((p) => p.y));
  const onFloor = (p: { y: number }) => floor2D - p.y < 10;
  if (onFloor(s2.fKnee) && onFloor(s2.fFoot)) fsh = Math.sin((fsh * Math.PI) / 180) < 0 ? -90 : 90;
  if (onFloor(s2.nKnee) && onFloor(s2.nFoot)) nsh = Math.sin((nsh * Math.PI) / 180) < 0 ? -90 : 90;
  // side view sees the right side ("near" = right limbs); facing the camera, the limbs on
  // screen-right are the left ones
  const near = sideways ? { arm: 'lArm', fore: 'lFore', hand: 'lHand', thigh: 'lThigh', shin: 'lShin' } : { arm: 'rArm', fore: 'rFore', hand: 'rHand', thigh: 'rThigh', shin: 'rShin' };
  const far = sideways ? { arm: 'rArm', fore: 'rFore', hand: 'rHand', thigh: 'rThigh', shin: 'rShin' } : { arm: 'lArm', fore: 'lFore', hand: 'lHand', thigh: 'lThigh', shin: 'lShin' };
  // The pelvis follows the trunk and, partly, the thighs: it tips back when lying down, forward
  // in a forward fold. Left upright, its back would stick out and lift a lying body off the mat.
  const thighs = dir(fth).add(dir(nth));
  const pelvisV = dir(torso).multiplyScalar(0.6);
  if (thighs.lengthSq() > 0.01) pelvisV.addScaledVector(thighs.normalize(), -0.4);
  // back to an angle so it can be limited: with the legs straight down (standing folds) the
  // pelvis tilts forward at most 55°, the rest of the fold happens in the spine
  let pelvisAngle = (Math.atan2(pelvisV.z, -pelvisV.y) * 180) / Math.PI;
  const legsDown = Math.abs(within((fth + nth) / 2, 0, -180, 180)) < 35;
  pelvisAngle = 180 + within(pelvisAngle, 180, legsDown ? -55 : -100, 100);
  const pelvis = dir(pelvisAngle);
  const target = {
    hips: pelvis.normalize(),
    spine: dir(torso - curve * 0.6),
    spine1: dir(torso),
    spine2: dir(torso + curve * 0.6 - breath * 2),
    neck: dir((torso + head) / 2),
    head: dir(head),
    [near.arm]: dir(nua), [near.fore]: dir(nfa), [near.hand]: dir(nfa), [far.arm]: dir(fua), [far.fore]: dir(ffa), [far.hand]: dir(ffa),
    [near.thigh]: dir(nth), [near.shin]: dir(nsh), [far.thigh]: dir(fth), [far.shin]: dir(fsh),
  } as Record<Seg, THREE.Vector3>;
  // turn the body, then reset to the bind pose and turn each bone (parents first)
  yawQ.setFromAxisAngle(UP, (-yaw * Math.PI) / 180);
  rig.root.quaternion.copy(yawQ);
  for (const b of Object.values(rig.bones)) b.quaternion.copy((b.userData.rest ??= b.quaternion.clone()) as THREE.Quaternion);
  rig.root.updateMatrixWorld(true);
  const aim = (s: Seg, to: THREE.Vector3) => {
    const bone = rig.bones[BONES[s]];
    const { q, d } = rig.bind[s];
    // bind data was taken with the body unturned: turn it with the body
    const restDir = tmpV.copy(d).applyQuaternion(yawQ);
    const delta = tmpQ.setFromUnitVectors(restDir, to);
    const desired = tmpQ2.copy(delta).multiply(yawQ).multiply(q);
    const parentQ = bone.parent!.getWorldQuaternion(new THREE.Quaternion());
    bone.quaternion.copy(parentQ.invert().multiply(desired));
    bone.updateMatrixWorld(true);
  };
  for (const s of ORDER) aim(s, target[s]);
  const handsDown = onFloor(s2.fHand) || onFloor(s2.nHand);
  const feetDown = onFloor(s2.fFoot) || onFloor(s2.nFoot);
  return { aim, handsDown, feetDown };
}

/**
 * Feet that should stand on the floor (lying with knees bent, bridge, squats) but end up in the
 * air because 3D limb lengths differ from the drawing: bend the knee (two-bone IK) until the
 * ankle sits at shoe height above the floor. The knee keeps bending the way it already bends.
 */
function groundFeet(rig: Rig, floor: number, aim: (s: Seg, to: THREE.Vector3) => void): boolean {
  const B = rig.bones;
  let moved = false;
  for (const side of ['Left', 'Right'] as const) {
    const Hp = wp(B[`${side}UpLeg`]);
    const K = wp(B[`${side}Leg`]);
    const A = wp(B[`${side}Foot`]);
    const T = new THREE.Vector3(A.x, floor + 0.085, A.z);
    // only feet hovering a little: lifted legs (leg raises, kicks) stay as they are
    if (A.y - T.y < 0.03 || A.y - T.y > 0.45) continue;
    const a = Hp.distanceTo(K);
    const b = K.distanceTo(A);
    const toT = T.clone().sub(Hp);
    const dist = Math.min(toT.length(), (a + b) * 0.999);
    const dirHT = toT.normalize();
    const cosA = (a * a + dist * dist - b * b) / (2 * a * dist);
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const pole = K.clone().sub(Hp);
    pole.addScaledVector(dirHT, -pole.dot(dirHT));
    if (pole.lengthSq() < 1e-6) continue;
    pole.normalize();
    const knee = Hp.clone().addScaledVector(dirHT, cosA * a).addScaledVector(pole, sinA * a);
    const ankle = Hp.clone().addScaledVector(dirHT, dist);
    const seg = side === 'Left' ? (['lThigh', 'lShin'] as const) : (['rThigh', 'rShin'] as const);
    aim(seg[0], knee.clone().sub(Hp).normalize());
    aim(seg[1], ankle.sub(knee).normalize());
    moved = true;
  }
  return moved;
}

const wp = (b: THREE.Object3D) => b.getWorldPosition(new THREE.Vector3());

/**
 * Hands that bear weight in the pose (they touch the floor in the 2D drawing: plank, tabletop,
 * downward dog…) must touch the floor in 3D too. The 3D arm is a little shorter relative to the
 * legs than the flat figure's, so the hand would float: a two-bone IK bends the elbow, or
 * straightens the arm, until the wrist sits a palm's thickness above the floor.
 */
function groundHands(rig: Rig, floor: number, aim: (s: Seg, to: THREE.Vector3) => void): boolean {
  const B = rig.bones;
  let moved = false;
  for (const side of ['Left', 'Right'] as const) {
    const S = wp(B[`${side}Arm`]);
    const E = wp(B[`${side}ForeArm`]);
    const H = wp(B[`${side}Hand`]);
    const a = S.distanceTo(E);
    const b = E.distanceTo(H);
    // wrist a few cm above the floor: with the palm laid flat, the palm then rests on it
    const T = new THREE.Vector3(H.x, floor + 0.035, H.z);
    // only hands that should be on the floor: close to it already, or hanging below the shoulder
    if (H.y - T.y > 0.35 || H.y < T.y - 0.01) continue;
    const toT = T.clone().sub(S);
    const dist = Math.min(toT.length(), (a + b) * 0.999);
    const dirST = toT.normalize();
    // elbow angle from the law of cosines; bend in the plane of the current elbow
    const cosA = (a * a + dist * dist - b * b) / (2 * a * dist);
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const pole = E.clone().sub(S);
    pole.addScaledVector(dirST, -pole.dot(dirST));
    if (pole.lengthSq() < 1e-6) pole.set(0, 0, -1);
    pole.normalize();
    const elbow = S.clone().addScaledVector(dirST, cosA * a).addScaledVector(pole, sinA * a);
    const hand = S.clone().addScaledVector(dirST, dist);
    const seg = side === 'Left' ? (['lArm', 'lFore', 'lHand'] as const) : (['rArm', 'rFore', 'rHand'] as const);
    aim(seg[0], elbow.clone().sub(S).normalize());
    const fore = hand.clone().sub(elbow).normalize();
    aim(seg[1], fore);
    // palm flat on the mat, fingers pointing the way the forearm leans (or forward)
    const flat = new THREE.Vector3(fore.x, 0, fore.z);
    if (flat.lengthSq() < 0.01) flat.set(0, 0, 1);
    aim(seg[2], flat.normalize().add(new THREE.Vector3(0, -0.08, 0)).normalize());
    moved = true;
  }
  return moved;
}
const tmpV = new THREE.Vector3();

const box = new THREE.Box3();
const mb = new THREE.Box3();

export interface View3D {
  /** Body turn: 0 = profile (default), 90 = facing the camera (sideways movements). */
  yaw?: number;
  /** Camera orbit around the body in degrees: 0 = straight side view, + = towards the front. */
  orbit?: number;
  /** Camera tilt down in degrees (higher for floor work). */
  elev?: number;
}

/** Per-canvas camera state, so framing glides instead of jumping when the pose changes. */
const smooth = new WeakMap<CanvasRenderingContext2D, { d: number; t: THREE.Vector3 }>();

export function drawFigure3D(ctx: CanvasRenderingContext2D, f: Figure, w: number, h: number, model: FigureModel, breath = 0, floorAt = 0.84, view: View3D = {}): boolean {
  const r = getRenderer();
  const rig = rigs.get(model);
  if (!r || !rig) {
    load(model);
    return false;
  }
  scene.add(rig.root);
  for (const other of rigs.values()) if (other !== rig) scene.remove(other.root);
  const { aim, handsDown, feetDown } = pose(rig, f, breath, view.yaw ?? 0);

  // posed bounds (skinned) in world space
  const measure = () => {
    box.makeEmpty();
    for (const m of rig.meshes) {
      m.computeBoundingBox();
      if (m.boundingBox) box.union(mb.copy(m.boundingBox).applyMatrix4(m.matrixWorld));
    }
  };
  measure();
  // weight-bearing hands reach the real floor (the lowest point of the body), then re-measure
  if (feetDown && groundFeet(rig, box.min.y, aim)) measure();
  if (handsDown && groundHands(rig, box.min.y, aim)) measure();
  // the floor and mat sit under the body, wherever the pose puts it
  const ground = box.min.y;
  contact.scale.set(Math.max(0.5, box.max.x - box.min.x) * 1.1, Math.max(0.5, box.max.z - box.min.z) * 1.1, 1);
  const centre = new THREE.Vector3((box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, (box.min.z + box.max.z) / 2);
  stage.position.set(centre.x, ground, centre.z);
  key.target.position.set(centre.x, ground, centre.z);
  key.position.set(centre.x - 2.5, ground + 4.5, centre.z + 2.2);

  // camera on a sphere around the body: orbit 0 looks along +X (right side, forward = screen-right),
  // elevation tilts it down like a camera on a tripod above chest height
  const a = ((view.orbit ?? 0) * Math.PI) / 180;
  const e = ((view.elev ?? 10) * Math.PI) / 180;
  const fwd = new THREE.Vector3(Math.cos(a) * Math.cos(e), -Math.sin(e), -Math.sin(a) * Math.cos(e));
  const right = new THREE.Vector3().crossVectors(fwd, UP).normalize();
  const up = new THREE.Vector3().crossVectors(right, fwd);

  // The body must fit in the band above the floor line (6%…floorAt of the height) and 86% of the
  // width; the distance that achieves this follows from each corner of its bounding box.
  camera.aspect = w / h;
  const tanV = Math.tan(((camera.fov / 2) * Math.PI) / 180);
  const tanH = tanV * camera.aspect;
  const band = floorAt - 0.06;
  let d = 0;
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const p = tmpV.set(x, y, z).sub(centre);
    const f = p.dot(fwd);
    d = Math.max(d, f + Math.abs(p.dot(right)) / (tanH * 0.86), f + Math.abs(p.dot(up)) / (tanV * band));
  }
  // never closer than for a 1.2 m figure, so compact poses (child's pose) aren't blown up
  d = Math.max(d, 0.6 / (tanV * band) + 0.3);
  const s = smooth.get(ctx);
  if (s && Math.abs(s.d - d) < 3) {
    s.d += (d - s.d) * 0.12;
    s.t.lerp(centre, 0.12);
  } else smooth.set(ctx, { d, t: centre.clone() });
  const st = smooth.get(ctx)!;
  camera.position.copy(st.t).addScaledVector(fwd, -st.d);
  camera.up.copy(UP);
  camera.lookAt(st.t);
  // shift the picture so the body sits in its band, leaving the floor below for subtitles
  const shift = (h * (0.06 + floorAt)) / 2 - h / 2;
  camera.setViewOffset(w, h, 0, -shift, w, h);
  camera.updateProjectionMatrix();

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  const size = r.getSize(new THREE.Vector2());
  if (size.x !== w || size.y !== h || r.getPixelRatio() !== dpr) {
    r.setPixelRatio(dpr);
    r.setSize(w, h, false);
  }
  r.render(scene, camera);
  ctx.drawImage(r.domElement, 0, 0, pw, ph, 0, 0, w, h);
  return true;
}
