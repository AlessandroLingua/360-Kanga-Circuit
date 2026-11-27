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

type Seg = 'hips' | 'lHand' | 'rHand' | 'lFoot' | 'rFoot' | 'spine' | 'spine1' | 'spine2' | 'neck' | 'head' | 'lArm' | 'lFore' | 'rArm' | 'rFore' | 'lThigh' | 'lShin' | 'rThigh' | 'rShin';
const BONES: Record<Seg, string> = {
  hips: 'Hips', lHand: 'LeftHand', rHand: 'RightHand', lFoot: 'LeftFoot', rFoot: 'RightFoot',
  spine: 'Spine', spine1: 'Spine1', spine2: 'Spine2', neck: 'Neck', head: 'Head',
  lArm: 'LeftArm', lFore: 'LeftForeArm', rArm: 'RightArm', rFore: 'RightForeArm',
  lThigh: 'LeftUpLeg', lShin: 'LeftLeg', rThigh: 'RightUpLeg', rShin: 'RightLeg',
};
/** Bone whose head marks where each segment ends (gives the rest direction). */
const CHILD: Record<Seg, string> = {
  hips: 'Spine', lHand: 'LeftHandMiddle1', rHand: 'RightHandMiddle1', lFoot: 'LeftToeBase', rFoot: 'RightToeBase',
  spine: 'Spine1', spine1: 'Spine2', spine2: 'Neck', neck: 'Head', head: 'Head',
  lArm: 'LeftForeArm', lFore: 'LeftHand', rArm: 'RightForeArm', rFore: 'RightHand',
  lThigh: 'LeftLeg', lShin: 'LeftFoot', rThigh: 'RightLeg', rShin: 'RightFoot',
};
/** Parents before children, so world rotations are up to date when a child is set. */
const ORDER: Seg[] = ['hips', 'spine', 'spine1', 'spine2', 'neck', 'head', 'lArm', 'lFore', 'lHand', 'rArm', 'rFore', 'rHand', 'lThigh', 'lShin', 'lFoot', 'rThigh', 'rShin', 'rFoot'];

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
  /** Sampled skin vertices of each contact region (feet, knees, hands, pelvis, back, head). */
  contactVerts: { mesh: THREE.SkinnedMesh; verts: Partial<Record<Region, number[]>> }[];
}

type Region = 'lFoot' | 'rFoot' | 'lKnee' | 'rKnee' | 'lHand' | 'rHand' | 'hips' | 'back' | 'head';
const REGION_BONES: Record<Region, RegExp> = {
  lFoot: /^Left(Foot|ToeBase)$/, rFoot: /^Right(Foot|ToeBase)$/,
  lKnee: /^LeftLeg$/, rKnee: /^RightLeg$/,
  lHand: /^LeftHand/, rHand: /^RightHand/,
  hips: /^Hips$/, back: /^Spine/, head: /^Head$|^Neck$/,
};

/** Groups the skin, clothes and shoes vertices by the bone that moves them most (every 3rd vertex). */
function contactVertices(meshes: THREE.SkinnedMesh[]): Rig['contactVerts'] {
  const out: Rig['contactVerts'] = [];
  for (const m of meshes) {
    if (!/body|base|shoes|suit/i.test(m.name)) continue;
    const idx = m.geometry.attributes.skinIndex;
    const wts = m.geometry.attributes.skinWeight;
    const names = m.skeleton.bones.map((b) => b.name.replace(/^mixamorig:?/, ''));
    const verts: Partial<Record<Region, number[]>> = {};
    for (let i = 0; i < idx.count; i += 3) {
      let best = 0;
      let bone = 0;
      for (let k = 0; k < 4; k++) if (wts.getComponent(i, k) > best) [best, bone] = [wts.getComponent(i, k), idx.getComponent(i, k)];
      const region = (Object.keys(REGION_BONES) as Region[]).find((r) => REGION_BONES[r].test(names[bone]));
      if (region) (verts[region] ??= []).push(i);
    }
    out.push({ mesh: m, verts });
  }
  return out;
}

const cv = new THREE.Vector3();
/** Lowest point (world y) of each requested region, measured on the posed skin. */
function regionMin(rig: Rig, regions: Region[]): Record<Region, number> {
  const out = {} as Record<Region, number>;
  for (const r of regions) out[r] = Infinity;
  for (const { mesh, verts } of rig.contactVerts) {
    mesh.updateMatrixWorld();
    for (const r of regions) {
      const list = verts[r];
      if (!list) continue;
      for (const i of list) {
        mesh.getVertexPosition(i, cv);
        cv.applyMatrix4(mesh.matrixWorld);
        if (cv.y < out[r]) out[r] = cv.y;
      }
    }
  }
  return out;
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
const wall = new THREE.Mesh();

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
  // a painted wall for exercises that lean on one (wall sit); placed behind the back when needed
  wall.geometry = new THREE.BoxGeometry(2.6, 2.6, 0.08);
  wall.material = new THREE.MeshStandardMaterial({ color: 0xd8d2c8, roughness: 0.95 });
  wall.receiveShadow = true;
  wall.visible = false;
  scene.add(wall);
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
      rigs.set(model, { root, meshes, bones, bind, contactVerts: contactVertices(meshes) });
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
const rollQ = new THREE.Quaternion();
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
function pose(rig: Rig, raw: Figure, breath: number, yaw: number, fixed?: { supports: Supports; seat: boolean; lying: boolean; headDown: boolean }) {
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
  // the shin rises ~9° towards the foot: the shoe sole would otherwise hold the knee off the mat
  if (onFloor(s2.fKnee) && onFloor(s2.fFoot)) fsh = Math.sin((fsh * Math.PI) / 180) < 0 ? -99 : 99;
  if (onFloor(s2.nKnee) && onFloor(s2.nFoot)) nsh = Math.sin((nsh * Math.PI) / 180) < 0 ? -99 : 99;
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
  // Lying on the side (clam, side kick…): figures with a 13th value are drawn as if lying on the
  // back, seen from above, so the hips and knees can bend forward; the top (left) leg then opens
  // by figure[11] degrees, and the whole body rolls onto its right side by figure[12] × 90°.
  // Sideways opening of the legs, which a side-view drawing cannot show: figure[13] turns both
  // thighs out to their own side (cross-legged and bound-angle knees, a V with the legs up, a wide
  // straddle), figure[14] the shins (negative = in towards the other side, as when the shins cross).
  const thighOut = raw[13] ?? 0;
  const shinOut = raw[14] ?? 0;
  // figure[19], figure[20]: extra opening of the far (left) leg only — a leg crossed over the other,
  // ankle on the opposite knee (figure four): thigh turned out, shin across (negative)
  const crossThigh = raw[19] ?? 0;
  const crossShin = raw[20] ?? 0;
  if (!sideways && (thighOut || shinOut || crossThigh || crossShin)) {
    const spread = (seg: Seg, side: 1 | -1, deg: number) => {
      if (!deg) return;
      const v = target[seg];
      const axis = new THREE.Vector3().crossVectors(v, new THREE.Vector3(side, 0, 0));
      if (axis.lengthSq() < 1e-6) return;
      target[seg] = v.clone().applyAxisAngle(axis.normalize(), (deg * Math.PI) / 180);
    };
    // side view: the near (right) leg is on the -x side, the far (left) leg on +x
    spread(near.thigh as Seg, -1, thighOut);
    spread(far.thigh as Seg, 1, thighOut);
    spread(near.shin as Seg, -1, shinOut);
    spread(far.shin as Seg, 1, shinOut);
    spread(far.thigh as Seg, 1, crossThigh);
    spread(far.shin as Seg, 1, crossShin);
  }
  // figure[15]: both legs turned over to one side about the body's long axis (knees dropping
  // to the floor in a supine twist); figure[16]: both arms opened out to their own side (a T)
  const legsSide = raw[15] ?? 0;
  const armsOut = raw[16] ?? 0;
  if (!sideways && legsSide) {
    const along = dir(torso).normalize();
    for (const sg of [near.thigh, near.shin, far.thigh, far.shin] as Seg[]) target[sg] = target[sg].clone().applyAxisAngle(along, (legsSide * Math.PI) / 180);
  }
  // figure[21]: the forearms' own opening when it differs (elbows out, hands in: hands on the hips
  // or behind the head); by default they follow the upper arms
  const foreOut = raw[21] ?? armsOut;
  if (!sideways && (armsOut || foreOut)) {
    const spreadArm = (seg: Seg, side: 1 | -1, deg = armsOut) => {
      if (!deg) return;
      const v = target[seg];
      const axis = new THREE.Vector3().crossVectors(v, new THREE.Vector3(side, 0, 0));
      if (axis.lengthSq() > 1e-6) target[seg] = v.clone().applyAxisAngle(axis.normalize(), (deg * Math.PI) / 180);
    };
    spreadArm(near.arm as Seg, -1);
    spreadArm(near.fore as Seg, -1, foreOut);
    spreadArm(near.hand as Seg, -1, foreOut);
    spreadArm(far.arm as Seg, 1);
    spreadArm(far.fore as Seg, 1, foreOut);
    spreadArm(far.hand as Seg, 1, foreOut);
  }
  // Facing the camera the drawing is the frontal plane, so knees can open sideways but not come
  // forward: for sitting cross-legged facing the camera (seated side bend, mermaid) figure[13] turns
  // the thighs and figure[14] the shins towards the front of the body, about the vertical axis.
  if (sideways && (thighOut || shinOut)) {
    const front = new THREE.Vector3(0, 0, 1).applyAxisAngle(UP, (-yaw * Math.PI) / 180);
    const ahead = (seg: Seg, deg: number) => {
      if (!deg) return;
      const r = (deg * Math.PI) / 180;
      const v = target[seg];
      const s = v.clone().applyAxisAngle(UP, r).dot(front) >= v.clone().applyAxisAngle(UP, -r).dot(front) ? r : -r;
      target[seg] = v.clone().applyAxisAngle(UP, s);
    };
    ahead(near.thigh as Seg, thighOut);
    ahead(far.thigh as Seg, thighOut);
    ahead(near.shin as Seg, shinOut);
    ahead(far.shin as Seg, shinOut);
  }
  const roll = raw[12] ?? 0;
  if (roll > 0) {
    const abd = ((raw[11] ?? 0) * Math.PI) / 180;
    if (abd) {
      const Z = new THREE.Vector3(0, 0, 1);
      const out = (v: THREE.Vector3) => v.clone().applyAxisAngle(Z, -abd).x >= v.clone().applyAxisAngle(Z, abd).x;
      const s = out(target[far.thigh as Seg]) ? -abd : abd;
      target[far.thigh as Seg] = target[far.thigh as Seg].clone().applyAxisAngle(Z, s);
      target[far.shin as Seg] = target[far.shin as Seg].clone().applyAxisAngle(Z, s);
    }
    rollQ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), (roll * Math.PI) / 2);
    for (const k of Object.keys(target) as Seg[]) target[k] = target[k].clone().applyQuaternion(rollQ);
  } else rollQ.identity();
  // turn the body, then reset to the bind pose and turn each bone (parents first)
  yawQ.setFromAxisAngle(UP, (-yaw * Math.PI) / 180).multiply(rollQ);
  rig.root.quaternion.copy(yawQ);
  for (const b of Object.values(rig.bones)) b.quaternion.copy((b.userData.rest ??= b.quaternion.clone()) as THREE.Quaternion);
  rig.root.updateMatrixWorld(true);
  const aim = (s: Seg, wanted: THREE.Vector3) => {
    const bone = rig.bones[BONES[s]];
    // hard joint limits, whoever asks (the pose, the floor solver, the hand IK, a transition):
    // a knee or an elbow folds to ~155° at most — past that the shin goes through the thigh
    let to = wanted;
    const LIMB: Partial<Record<Seg, [string, string]>> = { lShin: ['LeftUpLeg', 'LeftLeg'], rShin: ['RightUpLeg', 'RightLeg'], lFore: ['LeftArm', 'LeftForeArm'], rFore: ['RightArm', 'RightForeArm'] };
    const lim = LIMB[s];
    if (lim) {
      const upper = wp(rig.bones[lim[1]]).sub(wp(rig.bones[lim[0]])).normalize();
      const fold = upper.angleTo(wanted);
      const max = (155 * Math.PI) / 180;
      if (fold > max) {
        const axis = new THREE.Vector3().crossVectors(upper, wanted);
        if (axis.lengthSq() > 1e-8) to = upper.clone().applyAxisAngle(axis.normalize(), max);
      }
    }
    const { q, d } = rig.bind[s];
    // bind data was taken with the body unturned: turn it with the body
    const restDir = tmpV.copy(d).applyQuaternion(yawQ);
    const delta = tmpQ.setFromUnitVectors(restDir, to);
    const desired = tmpQ2.copy(delta).multiply(yawQ).multiply(q);
    const parentQ = bone.parent!.getWorldQuaternion(new THREE.Quaternion());
    bone.quaternion.copy(parentQ.invert().multiply(desired));
    bone.updateMatrixWorld(true);
  };
  // figure[22]: the trunk turned about its own axis (+ = chest towards the left), spread over the
  // three spine bones like a real spine (most of it in the thoracic part). It happens before the
  // neck and arms are aimed, so the shoulders turn with the chest and the arms still go where drawn.
  const twist = raw[22] ?? 0;
  for (const s of ORDER) {
    if (target[s]) aim(s, target[s]);
    if (s === 'spine2' && twist) {
      const base = wp(rig.bones.Spine);
      const axis = wp(rig.bones.Neck).sub(base).normalize();
      for (const [name, k] of [['Spine', 0.2], ['Spine1', 0.35], ['Spine2', 0.45]] as const) twistBone(rig.bones[name], axis, twist * k);
    }
  }
  // figure[17]: head turned to look over a shoulder (+ = to the left); figure[18]: head tilted,
  // ear towards a shoulder. Neither is visible in a side drawing; neck and head share the motion.
  const headTurn = raw[17] ?? 0;
  const headTilt = raw[18] ?? 0;
  if (headTurn || headTilt) {
    const turnBone = (bone: THREE.Object3D, axis: THREE.Vector3, deg: number) => {
      if (!deg) return;
      const parentQ = bone.parent!.getWorldQuaternion(new THREE.Quaternion());
      const worldQ = bone.getWorldQuaternion(new THREE.Quaternion());
      const r = new THREE.Quaternion().setFromAxisAngle(axis, (deg * Math.PI) / 180).multiply(worldQ);
      bone.quaternion.copy(parentQ.invert().multiply(r));
      bone.updateMatrixWorld(true);
    };
    const headB = rig.bones[BONES.head];
    const neckB = rig.bones[BONES.neck];
    const up = wp(headB).sub(wp(neckB)).normalize();
    // the body's left-right axis (x in the side drawing), turned with the body
    const side = new THREE.Vector3(1, 0, 0).applyQuaternion(yawQ);
    const face = new THREE.Vector3().crossVectors(side, up).normalize();
    for (const [b, k] of [[neckB, 0.4], [headB, 0.6]] as const) {
      turnBone(b, up, headTurn * k);
      turnBone(b, face, headTilt * k);
    }
  }
  // supports per 3D side: which hands, knees and feet the pose puts on the floor
  // a straight leg stretched out horizontally just above the floor (pigeon, sleeping swan) lies on it
  const flatLeg = (th: number, sh: number, foot: { y: number }) =>
    Math.abs(within(th, sh, -180, 180)) < 20 && Math.abs(Math.abs(within(th, 0, -180, 180)) - 90) < 20 && floor2D - foot.y < 20;
  // a leg pointing down under the body stands on its foot even if the drawing puts the hands lower
  const standingLeg = (th: number, foot: { y: number }) => Math.abs(within(th, 0, -180, 180)) < 35 && floor2D - foot.y < 40;
  // an arm pointing straight down with the hand close to the floor (mountain climbers, the squat of a
  // burpee, dips) is reaching for it: the drawing's limb lengths just leave it a little short
  const reaching = (ua: number, fa: number, hand: { y: number }) =>
    Math.abs(within(ua, 0, -180, 180)) < 40 && Math.abs(within(fa, 0, -180, 180)) < 40 && floor2D - hand.y < 32;
  const nearSide = sideways ? 'Left' : 'Right';
  const farSide = sideways ? 'Right' : 'Left';
  const supports = {
    [nearSide]: { hand: onFloor(s2.nHand) || reaching(nua, nfa, s2.nHand), knee: onFloor(s2.nKnee) && Math.abs(within(nth, nsh, -180, 180)) > 50, foot: onFloor(s2.nFoot) || flatLeg(nth, nsh, s2.nFoot) || standingLeg(nth, s2.nFoot) },
    [farSide]: { hand: onFloor(s2.fHand) || reaching(fua, ffa, s2.fHand), knee: onFloor(s2.fKnee) && Math.abs(within(fth, fsh, -180, 180)) > 50, foot: onFloor(s2.fFoot) || flatLeg(fth, fsh, s2.fFoot) || standingLeg(fth, s2.fFoot) },
  } as Supports;
  // a leg lifted out to the side (fire hydrant) bears no weight, whatever the side drawing says
  if (crossThigh > 30 && Math.abs(within(fth, 0, -180, 180)) < 45) supports[farSide] = { ...supports[farSide], knee: false, foot: false };
  // sitting: the pelvis itself rests on the floor (staff, seated folds, easy seat, boat…)
  // side-lying (turned to the camera): the hip on the floor is part of the support
  const trunkLow = Math.abs(Math.abs(within(torso, 0, -180, 180)) - 90) < 30 && floor2D < 26;
  // side-lying, or lying with legs stretched along the floor (locust, superman): the pelvis rests on it
  // (also with the legs lifted a little off it, as in swimming: thighs out along the body line)
  const thighsOut = [fth, nth].every((th) => Math.abs(Math.abs(within(th, 0, -180, 180)) - 90) < 30);
  // sitting with the knees opened sideways (cross-legged, bound angle): the pelvis is the base, even
  // when the drawing puts the hands lower than the hips
  const openSeat = thighOut > 20 && thighsOut && Math.abs(within(torso, 0, -180, 180)) > 90;
  // pressing up on straight arms with the chest lifted (upward dog): the hips hover, only the hands
  // and the tops of the feet bear weight (cobra keeps the elbows bent and the pelvis down)
  const straightArms = Math.abs(within(nua, nfa, -180, 180)) < 20 && Math.abs(within(nua, 0, -180, 180)) < 40;
  const pressUp = straightArms && (onFloor(s2.nHand) || onFloor(s2.fHand)) && Math.abs(Math.abs(within(torso, 0, -180, 180)) - 90) > 30 && Math.abs(within(torso, 0, -180, 180)) < 160;
  // a plank on the forearms or hands: legs continue the trunk in one line and the arms hold it up
  const plankLine = Math.abs(within(nth, torso - 180, -180, 180)) < 10 && (onFloor(s2.nHand) || onFloor(s2.fHand));
  const seat = !pressUp && !plankLine && (floor2D < 14 || openSeat || (trunkLow && (sideways || thighsOut || flatLeg(fth, fsh, s2.fFoot) || flatLeg(nth, nsh, s2.nFoot))));
  // lying flat: shoulders on the floor with the trunk near horizontal (not bridge or shoulder stand)
  const trunkFlat = Math.abs(Math.abs(within(torso, 0, -180, 180)) - 90) < 30;
  const lying = onFloor(s2.shoulder) && trunkFlat;
  const headDown = onFloor(s2.headC);
  // later solver passes keep the supports read from the original drawing
  // hands only reaching for the floor: they never make the trunk fold to get there
  // (kneeling upright, as in camel; a plank-like or reclined trunk still lowers itself to the hands)
  const upright = Math.abs(within(torso, 180, -180, 180)) < 60 && (onFloor(s2.nKnee) || onFloor(s2.fKnee));
  const reachOnly = upright && ((!onFloor(s2.nHand) && reaching(nua, nfa, s2.nHand)) || (!onFloor(s2.fHand) && reaching(fua, ffa, s2.fHand)));
  if (roll > 0.5) {
    const none = () => ({ hand: false, knee: false, foot: false });
    return { aim, reachOnly: false, supports: fixed?.supports ?? ({ Left: none(), Right: none() } as Supports), seat: true, lying: true, headDown: false };
  }
  return { aim, reachOnly, supports: fixed?.supports ?? supports, seat: fixed?.seat ?? seat, lying: fixed?.lying ?? lying, headDown: fixed?.headDown ?? headDown };
}

type Side = 'Left' | 'Right';
type Supports = Record<Side, { hand: boolean; knee: boolean; foot: boolean }>;
type Aim = (s: Seg, to: THREE.Vector3) => void;

/** Joint centres sit inside the mesh: distance from them to the skin/sole that touches the floor. */
const KNEE_R = 0.055;
const ANKLE_H = 0.085;
const TOE_H = 0.035;

/** Hip joint height above the floor when sitting on the sit bones. */
const SEAT_H = 0.11;
/** Spine2 (upper back) centre height above the floor when lying on the back or front. */
const BACK_H = 0.12;

/**
 * Turns a whole leg (thigh and shin together, knee angle unchanged) about the hip so that its
 * contact point (knee if kneeling, else the sole) lands on the floor.
 */
function swingLeg(rig: Rig, side: Side, sup: Supports[Side], floor: number, aim: Aim) {
  const B = rig.bones;
  const seg = side === 'Left' ? (['lThigh', 'lShin'] as const) : (['rThigh', 'rShin'] as const);
  const Hp = wp(B[side + 'UpLeg']);
  const K = wp(B[side + 'Leg']);
  const A = wp(B[side + 'Foot']);
  const thighDir = K.clone().sub(Hp).normalize();
  const shinDir = A.clone().sub(K).normalize();
  // the point that must touch, and how high its joint centre sits above the skin
  const P = sup.knee ? K : A;
  // how far the joint centre sits above that region's lowest skin point, right now
  // (kneeling: the lowest of knee and foot, so a foot hanging below the knee also ends on the mat)
  const lift = P.y - legContact(rig, side, sup);
  const v = P.clone().sub(Hp);
  const len = v.length();
  const dy = floor + lift - Hp.y;
  if (Math.abs(dy) >= len) return;
  const hz = new THREE.Vector3(v.x, 0, v.z);
  if (hz.lengthSq() < 1e-6) hz.set(0, 0, 1);
  hz.normalize().multiplyScalar(Math.sqrt(len * len - dy * dy));
  const target = hz.add(new THREE.Vector3(0, dy, 0)).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(v.normalize(), target);
  aim(seg[0], thighDir.applyQuaternion(q));
  // kneeling: the shin keeps lying back along the mat instead of turning with the thigh into it
  aim(seg[1], sup.knee ? shinDir : shinDir.applyQuaternion(q));
}

/**
 * Weight-bearing feet lie on the floor instead of following the shin (which would dig the toes
 * into the mat or lift them): standing, the foot points forward along the body; kneeling or lying
 * face down (knee also on the floor), it stretches back with the top of the foot on the mat.
 */
/** The front of the pelvis points at the floor (lying face down). */
function facingDown(rig: Rig) {
  const B = rig.bones;
  const lr = wp(B.LeftUpLeg).sub(wp(B.RightUpLeg));
  const up = wp(B.Spine).sub(wp(B.Hips));
  // …and the legs lie out behind it (not a squat or a fold, where the pelvis also tips forward)
  const thighsFlat = (['Left', 'Right'] as const).every((sd) => Math.abs(wp(B[sd + 'Leg']).sub(wp(B[sd + 'UpLeg'])).normalize().y) < 0.5);
  return thighsFlat && lr.cross(up).normalize().y < -0.5;
}

function placeFeet(rig: Rig, sup: Supports, aim: Aim, yaw: number) {
  const B = rig.bones;
  const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(UP, (-yaw * Math.PI) / 180);
  const prone = facingDown(rig);
  for (const side of ['Left', 'Right'] as const) {
    const seg = side === 'Left' ? 'lFoot' : 'rFoot';
    if (!sup[side].foot) {
      // face down with the legs lifted (superman, swimming): toes pointed back, in line with the shin
      const shin = wp(B[side + 'Foot']).sub(wp(B[side + 'Leg'])).normalize();
      if (prone && Math.abs(shin.y) < 0.7) aim(seg, shin.add(new THREE.Vector3(0, -0.25, 0)).normalize());
      continue;
    }
    if (sup[side].knee) {
      const shin = wp(B[side + 'Foot']).sub(wp(B[side + 'Leg']));
      const back = new THREE.Vector3(shin.x, 0, shin.z);
      if (back.lengthSq() < 1e-6) back.copy(forward).negate();
      aim(seg, back.normalize());
    } else {
      const shin = wp(B[side + 'Foot']).sub(wp(B[side + 'Leg'])).normalize();
      if (Math.abs(shin.y) > 0.6) aim(seg, forward.clone().add(new THREE.Vector3(0, -0.2, 0)).normalize());
      else if (prone) {
        // lying face down (superman, locust, cobra): the top of the foot on the mat, toes back
        aim(seg, new THREE.Vector3(shin.x, 0, shin.z).normalize().add(new THREE.Vector3(0, -0.15, 0)).normalize());
      } else {
        // leg along the floor: the foot stands up from the heel, toes to the ceiling
        aim(seg, new THREE.Vector3(0, 1, 0).addScaledVector(shin, 0.35).normalize());
      }
    }
  }
}

function legContact(rig: Rig, side: Side, sup: Supports[Side]) {
  const p = side === 'Left' ? 'l' : 'r';
  const regions: Region[] = [];
  const B = rig.bones;
  // a straight leg lying along the floor touches it with the calf as well as the heel
  const along = sup.foot && Math.abs(wp(B[side + 'Foot']).sub(wp(B[side + 'UpLeg'])).normalize().y) < 0.5;
  if (sup.knee || along) regions.push((p + 'Knee') as Region);
  if (sup.foot) regions.push((p + 'Foot') as Region);
  const m = regionMin(rig, regions);
  // (the calf is soft: lying on it, it flattens a couple of centimetres so the heel touches too)
  if (along && !sup.knee) m[(p + 'Knee') as Region] += 0.025;
  return Math.min(...regions.map((r) => m[r]));
}

/**
 * Settles the legs that bear weight on one common floor. The floor is set by the support that
 * cannot come lower (a straight standing leg, the front foot of a lunge); supports that end up
 * below it are lifted: a kneeling knee by turning the thigh, a foot by bending the knee (two-bone
 * IK). Without the drawing's exact limb proportions, this is what keeps every support on the mat
 * instead of one touching and the others floating. Returns the floor, or null if no leg supports.
 */
function settleLegs(rig: Rig, sup: Supports, aim: Aim, seat: boolean, lying: boolean, headDown: boolean, forced?: number): number | null {
  const B = rig.bones;
  const sides = (['Left', 'Right'] as const).filter((sd) => sup[sd].knee || sup[sd].foot);
  // the rigid support sets the floor: the pelvis when sitting, else the leg that is lowest-reaching
  // rigid supports that cannot be lowered: the pelvis when sitting, back and head when lying
  const body: number[] = [];
  const bm = regionMin(rig, ['hips', 'back', 'head']);
  if (seat) body.push(bm.hips);
  if (lying) body.push(bm.back);
  if (headDown) body.push(bm.head);
  const bodyFloor = forced ?? (body.length ? Math.max(...body) : null);
  if (!sides.length) return bodyFloor;
  const floor = bodyFloor ?? Math.max(...sides.map((sd) => legContact(rig, sd, sup[sd])));
  for (const side of sides) {
    const gap = legContact(rig, side, sup[side]) - floor;
    if (Math.abs(gap) < 0.008 || (bodyFloor === null && gap > 0)) continue;
    // a straight leg moves as one piece from the hip; it never bends to reach the floor
    const kneeAngle = wp(B[side + 'Leg']).sub(wp(B[side + 'UpLeg'])).normalize().angleTo(wp(B[side + 'Foot']).sub(wp(B[side + 'Leg'])).normalize());
    if (gap > 0 || sup[side].knee || kneeAngle < 0.45) {
      // the whole leg swings about the hip (straight legs when sitting, kneeling thighs)
      swingLeg(rig, side, sup[side], floor, aim);
      continue;
    }
    const seg = side === 'Left' ? (['lThigh', 'lShin'] as const) : (['rThigh', 'rShin'] as const);
    const Hp = wp(B[side + 'UpLeg']);
    const K = wp(B[side + 'Leg']);
    const A = wp(B[side + 'Foot']);
    const a = Hp.distanceTo(K);
    {
      // standing foot: bend the knee until the sole is on the floor
      const b = K.distanceTo(A);
      const footReg = (side === 'Left' ? 'lFoot' : 'rFoot') as Region;
      const T = new THREE.Vector3(A.x, floor + (A.y - regionMin(rig, [footReg])[footReg]), A.z);
      const toT = T.clone().sub(Hp);
      const dist = Math.min(toT.length(), (a + b) * 0.999);
      const dirHT = toT.normalize();
      const cosA = (a * a + dist * dist - b * b) / (2 * a * dist);
      const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
      const pole = K.clone().sub(Hp);
      pole.addScaledVector(dirHT, -pole.dot(dirHT));
      if (pole.lengthSq() < 1e-6) pole.set(0, 0, 1);
      pole.normalize();
      const knee = Hp.clone().addScaledVector(dirHT, cosA * a).addScaledVector(pole, sinA * a);
      aim(seg[0], knee.clone().sub(Hp).normalize());
      aim(seg[1], Hp.clone().addScaledVector(dirHT, dist).sub(knee).normalize());
    }
  }
  return floor;
}

const wp = (b: THREE.Object3D) => b.getWorldPosition(new THREE.Vector3());

/** Turns a bone (and so everything it carries) about a world axis. */
function twistBone(bone: THREE.Object3D, axis: THREE.Vector3, deg: number) {
  if (!deg) return;
  const parentQ = bone.parent!.getWorldQuaternion(new THREE.Quaternion());
  const worldQ = bone.getWorldQuaternion(new THREE.Quaternion());
  const r = new THREE.Quaternion().setFromAxisAngle(axis, (deg * Math.PI) / 180).multiply(worldQ);
  bone.quaternion.copy(parentQ.invert().multiply(r));
  bone.updateMatrixWorld(true);
}

const FINGERS = ['Index', 'Middle', 'Ring', 'Pinky'] as const;
/** How much each phalanx bends when the hand closes: knuckle, middle and end joints. */
const CURL = [62, 95, 60];

/**
 * Wrist and fingers, which the drawings don't describe: figure[23] bends the wrist (+ = back of
 * the hand towards the forearm, as when the fingers are drawn back in a wrist stretch; − = palm
 * towards the forearm), figure[24] closes the fingers from 0 (open, flat) to 1 (fist). A hand that
 * is not given a value rests the way real hands do, softly curled; a hand bearing weight stays flat.
 */
function shapeHands(rig: Rig, f: Figure, sup: Supports) {
  const bend = f[23] ?? 0;
  for (const side of ['Left', 'Right'] as const) {
    const B = rig.bones;
    const hand = B[side + 'Hand'];
    const idx = B[side + 'HandIndex1'];
    const pinky = B[side + 'HandPinky1'];
    if (!hand || !idx || !pinky) continue;
    const flat = sup[side].hand;
    const curl = flat ? 0 : (f[24] ?? 0.22);
    // the knuckle line: across the hand, oriented the same way anatomically for both hands
    const across = () => (side === 'Right' ? wp(B[side + 'HandPinky1']).sub(wp(B[side + 'HandIndex1'])) : wp(B[side + 'HandIndex1']).sub(wp(B[side + 'HandPinky1']))).normalize();
    // (about the knuckle line, a negative turn closes towards the palm)
    if (bend && !flat) twistBone(hand, across(), bend);
    if (!curl) continue;
    for (const fg of FINGERS) {
      for (let j = 1; j <= 3; j++) {
        const bone = B[side + 'Hand' + fg + j];
        if (bone) twistBone(bone, across(), -CURL[j - 1] * curl);
      }
    }
    // the thumb folds in less and towards the palm
    for (let j = 2; j <= 3; j++) {
      const bone = B[side + 'HandThumb' + j];
      if (bone) twistBone(bone, across(), -35 * curl);
    }
  }
}

/**
 * Hands that bear weight in the pose (they touch the floor in the 2D drawing: plank, tabletop,
 * downward dog…) must touch the floor in 3D too. The 3D arm is a little shorter relative to the
 * legs than the flat figure's, so the hand would float: a two-bone IK bends the elbow, or
 * straightens the arm, until the wrist sits a palm's thickness above the floor.
 */
function groundHands(rig: Rig, floor: number, aim: Aim, sup: Supports, tips = true): { moved: boolean; short: number } {
  const B = rig.bones;
  let moved = false;
  let short = 0;
  for (const side of ['Left', 'Right'] as const) {
    if (!sup[side].hand) continue;
    const S = wp(B[`${side}Arm`]);
    const E = wp(B[`${side}ForeArm`]);
    const H = wp(B[`${side}Hand`]);
    const a = S.distanceTo(E);
    const b = E.distanceTo(H);
    // wrist a few cm above the floor: with the palm laid flat, the palm then rests on it
    const handReg = (side === 'Left' ? 'lHand' : 'rHand') as Region;
    // keep the wrist-to-palm offset of a flat hand (about a palm's thickness)
    const T = new THREE.Vector3(H.x, floor + Math.max(0.03, Math.min(0.08, H.y - regionMin(rig, [handReg])[handReg])), H.z);
    // only hands that should be on the floor: close to it already, or hanging below the shoulder
    const toT = T.clone().sub(S);
    const need = toT.length();
    let sideShort = need - (a + b) * 0.97;
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
    aim(seg[2], flat.normalize());
    if (tips && need > (a + b) * 0.999) {
      // too far for a flat palm (half moon, deep folds): the fingertips reach down to the mat,
      // turned just enough that they touch it without going through
      const down = new THREE.Vector3(0, -1, 0);
      const dirAt = (k: number) => flat.clone().multiplyScalar(1 - k).addScaledVector(down, k).normalize();
      const gapAt = (k: number) => {
        aim(seg[2], dirAt(k));
        return regionMin(rig, [handReg])[handReg] - floor;
      };
      let gap = gapAt(0.85);
      if (gap < 0) {
        let lo = 0;
        let hi = 0.85;
        for (let i = 0; i < 6; i++) {
          const k = (lo + hi) / 2;
          if (gapAt(k) < 0) hi = k;
          else lo = k;
        }
        gap = Math.max(0, gapAt(lo));
      }
      sideShort = gap;
    }
    short = Math.max(short, sideShort);
    moved = true;
  }
  return { moved, short };
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
  /** Show a wall right behind the back (wall sit). */
  wall?: boolean;
}

/** How far the back of the body reaches, along the direction it faces away from (world). */
function backMost(rig: Rig, back: THREE.Vector3, regions: Region[] = ['hips', 'back', 'head']) {
  let m = -Infinity;
  for (const { mesh, verts } of rig.contactVerts) {
    for (const r of regions) {
      for (const i of verts[r] ?? []) {
        mesh.getVertexPosition(i, cv);
        cv.applyMatrix4(mesh.matrixWorld);
        m = Math.max(m, cv.dot(back));
      }
    }
  }
  return m;
}

/** Per-canvas camera state, so framing glides instead of jumping when the pose changes. */
const smooth = new WeakMap<CanvasRenderingContext2D, { d: number; t: THREE.Vector3 }>();

/** Posed bounds (skinned) in world space, into `box`. */
function measure(rig: Rig) {
  box.makeEmpty();
  for (const m of rig.meshes) {
    m.computeBoundingBox();
    if (m.boundingBox) box.union(mb.copy(m.boundingBox).applyMatrix4(m.matrixWorld));
  }
}

/**
 * Poses the rig and settles it on the floor: weight-bearing legs share one floor (settleLegs),
 * weight-bearing hands reach it, tipping the torso down if the arms are too short to.
 */
let solvedFloor = 0;
type Solved = { q: THREE.Quaternion[]; root: THREE.Quaternion; floor: number; sup: Supports };
const solvedCache = new Map<string, Solved>();
/** Solving takes a few ms (skin measurements): reps loop through the same poses, so keep them. */
function solve(rig: Rig, f: Figure, breath: number, yaw: number): Supports {
  const key = rig.root.uuid + '|' + yaw.toFixed(0) + '|' + breath.toFixed(1) + '|' + f.map((x) => x.toFixed(0)).join(',');
  const hit = solvedCache.get(key);
  const bones = Object.values(rig.bones);
  if (hit) {
    rig.root.quaternion.copy(hit.root);
    bones.forEach((b, i) => b.quaternion.copy(hit.q[i]));
    rig.root.updateMatrixWorld(true);
    measure(rig);
    solvedFloor = hit.floor;
    return hit.sup;
  }
  const sup = solveNow(rig, f, breath, yaw);
  shapeHands(rig, f, sup);
  if (solvedCache.size > 400) solvedCache.delete(solvedCache.keys().next().value!);
  solvedCache.set(key, { q: bones.map((b) => b.quaternion.clone()), root: rig.root.quaternion.clone(), floor: solvedFloor, sup });
  return sup;
}

function solveNow(rig: Rig, f: Figure, breath: number, yaw: number): Supports {
  let fig = f;
  let fixed: { supports: Supports; seat: boolean; lying: boolean; headDown: boolean } | undefined;
  let lifted = false;
  // hands put down by the solver (not by the drawing) only reach: the trunk never bends for them
  let handsAdded = false;
  for (let pass = 0; ; pass++) {
    const { aim, supports, seat, lying, headDown, reachOnly } = pose(rig, fig, breath, yaw, fixed);
    if (pass === 0 && reachOnly) handsAdded = true;
    fixed ??= { supports, seat, lying, headDown };
    // feet flat first (the floor is measured from the soles), and again after the legs move
    placeFeet(rig, supports, aim, yaw);
    settleLegs(rig, supports, aim, seat, lying, headDown);
    placeFeet(rig, supports, aim, yaw);
    let legFloor = settleLegs(rig, supports, aim, seat, lying, headDown);
    placeFeet(rig, supports, aim, yaw);
    // pelvis, back and head cannot pass through the mat: if one dips below the floor the legs set,
    // the floor comes down to it and the legs settle again on that level
    if (legFloor !== null) {
      const bm = regionMin(rig, ['hips', 'back', 'head']);
      const low = Math.min(bm.hips, bm.back, bm.head);
      // on the feet only (folds, down dog, squats): the trunk straightens rather than the legs lifting
      const standing = !seat && !lying && (supports.Left.foot || supports.Right.foot) && !supports.Left.knee && !supports.Right.knee;
      if (standing && low < legFloor - 0.02 && pass < 6) {
        // standing on the feet (deep folds): the head would go under the mat, so fold a little less
        const up = ((Math.asin(Math.min(1, (legFloor - low) / 0.55)) * 180) / Math.PI) * 1.1;
        const t = fig[0];
        fig = [t > 0 ? t + up : t - up, ...fig.slice(1)] as Figure;
        lifted = true;
        continue;
      }
      if (!standing && low < legFloor - 0.02) {
        legFloor = settleLegs(rig, supports, aim, seat, lying, headDown, low);
        placeFeet(rig, supports, aim, yaw);
      }
    }
    measure(rig);
    // the floor is where the supports were settled; the mesh may dip a few mm into the mat
    // (soles, toes), which reads as contact, rather than lifting every other support off it
    solvedFloor = legFloor ?? box.min.y;
    // a knee or foot the drawing keeps off the floor but that ends up through the mat (plow,
    // pigeon's back leg, a wide jump) rests on it instead: it becomes a support and the legs settle again
    if (pass < 6 && fixed) {
      const lm = regionMin(rig, ['lKnee', 'rKnee', 'lFoot', 'rFoot']);
      let added = false;
      for (const [side, p] of [['Left', 'l'], ['Right', 'r']] as const) {
        const B = rig.bones;
        const bent = wp(B[side + 'Leg']).sub(wp(B[side + 'UpLeg'])).normalize().angleTo(wp(B[side + 'Foot']).sub(wp(B[side + 'Leg'])).normalize()) > 0.87;
        for (const part of ['knee', 'foot'] as const) {
          const reg = (p + (part === 'knee' ? 'Knee' : 'Foot')) as Region;
          // a straight leg lies on calf and heel: it rests on the foot, never on a kneeling knee
          const as = part === 'knee' && !bent ? 'foot' : part;
          // (a kneecap only counts when the knee itself is down there, not a shin standing on its foot)
          const kneeLow = part !== 'knee' || wp(B[side + 'Leg']).y < solvedFloor + 0.1;
          if (kneeLow && !fixed.supports[side][as] && lm[reg] < solvedFloor - 0.02) {
            fixed.supports[side][as] = true;
            added = true;
          }
        }
      }
      if (added) continue;
    }
    if (lying && pass < 3) {
      // the rig's neck lets a lying head drop below the back: raise it until it rests on the mat
      const m = regionMin(rig, ['head']);
      const dip = solvedFloor - m.head;
      if (dip > 0.02) {
        const up = ((Math.asin(Math.min(1, dip / 0.22)) * 180) / Math.PI) * 1.1;
        fig = [fig[0], fig[1] + (within(180, fig[1], -180, 180) >= 0 ? up : -up), ...fig.slice(2)] as Figure;
        continue;
      }
    }
    // hands that are not supports must not go through the mat either: stop them on it
    const hm = regionMin(rig, ['lHand', 'rHand']);
    // an arm hanging down with the hand just off the mat (dips, sitting, a deep squat) leans on it:
    // nobody holds a hand floating a few centimetres above the floor
    if (pass < 6 && fixed && legFloor !== null) {
      let added = false;
      for (const [side, h] of [['Left', hm.lHand], ['Right', hm.rHand]] as const) {
        const hanging = wp(rig.bones[side + 'Arm']).y - wp(rig.bones[side + 'Hand']).y > 0.2;
        if (!fixed.supports[side].hand && hanging && h < solvedFloor + 0.06) {
          fixed.supports[side].hand = true;
          handsAdded = true;
          added = true;
        }
      }
      if (added) continue;
    }
    const stray = {
      Left: { hand: !supports.Left.hand && hm.lHand < solvedFloor - 0.015, knee: false, foot: false },
      Right: { hand: !supports.Right.hand && hm.rHand < solvedFloor - 0.015, knee: false, foot: false },
    };
    if (stray.Left.hand || stray.Right.hand) {
      groundHands(rig, solvedFloor, aim, stray);
      measure(rig);
    }
    if (!supports.Left.hand && !supports.Right.hand) return supports;
    const legless = legFloor === null;
    // hands and feet on the floor with both legs reaching back (down dog, bear): palms stay flat
    // and the feet walk back a little if the arms are short, lowering hips and shoulders
    const t = fig[0];
    const back = (th: number) => within(th, 0, -180, 180) * Math.sign(t) < -10;
    const dogLike = Math.abs(within(t, 0, -180, 180)) < 80 && !seat && !lying && supports.Left.foot && supports.Right.foot && !supports.Left.knee && !supports.Right.knee && back(fig[6]) && back(fig[8]);
    const { moved, short } = groundHands(rig, solvedFloor, aim, supports, !dogLike);
    if (moved) measure(rig);
    // only the hands on the floor (arm balances): the floor is where the palms are
    if (legless) {
      const h = regionMin(rig, ['lHand', 'rHand']);
      solvedFloor = Math.min(supports.Left.hand ? h.lHand : Infinity, supports.Right.hand ? h.rHand : Infinity);
      return supports;
    }
    if (short < 0.01 || pass >= 8 || headDown || lifted || handsAdded) return supports;
    if (dogLike) {
      const th = (Math.abs(within(fig[6], 0, -180, 180)) * Math.PI) / 180;
      const d = Math.min(12, ((short / (0.85 * Math.max(0.35, Math.sin(th)))) * 180) / Math.PI);
      const sg = t > 0 ? -d : d;
      fig = [...fig.slice(0, 6), fig[6] + sg, fig[7] + sg, fig[8] + sg, fig[9] + sg, ...fig.slice(10)] as Figure;
      continue;
    }
    // folding further would put the head on the mat: the hands stay as close as they got
    if (regionMin(rig, ['head']).head < solvedFloor + 0.12) return supports;
    const tip = ((short / 0.45) * 180) / Math.PI;
    // turn the trunk towards the floor (towards 0° = pointing down) to lower the shoulders
    fig = [t > 0 ? t - tip : t + tip, fig[1] + (t > 0 ? -tip : tip), ...fig.slice(2)] as Figure;
  }
}

const REGIONS: Record<string, RegExp> = REGION_BONES;

/**
 * For checks: poses a figure and returns, for each body region, the height of its lowest
 * vertex above the floor (metres). A region that should rest on the mat must be ~0.
 */
export function inspectContacts(f: Figure, model: FigureModel = 'female', yaw = 0): { heights: Record<string, number>; supports: string[] } | null {
  const rig = rigs.get(model);
  if (!rig) return null;
  const sup = solve(rig, f, 0, yaw);
  const ground = solvedFloor;
  const out: Record<string, number> = {};
  const v = new THREE.Vector3();
  for (const m of rig.meshes) {
    if (!/body|base/i.test(m.name) && !/shoes|suit/i.test(m.name)) continue;
    const pos = m.geometry.attributes.position;
    const idx = m.geometry.attributes.skinIndex;
    const wts = m.geometry.attributes.skinWeight;
    for (let i = 0; i < pos.count; i += 2) {
      // region of the bone with the largest weight
      let best = 0;
      let bone = 0;
      for (let k = 0; k < 4; k++) if (wts.getComponent(i, k) > best) [best, bone] = [wts.getComponent(i, k), idx.getComponent(i, k)];
      const name = m.skeleton.bones[bone].name.replace(/^mixamorig:?/, '');
      const region = Object.keys(REGIONS).find((r) => REGIONS[r].test(name));
      if (!region) continue;
      m.getVertexPosition(i, v);
      v.applyMatrix4(m.matrixWorld);
      out[region] = Math.min(out[region] ?? Infinity, v.y - ground);
    }
  }
  for (const k of Object.keys(out)) out[k] = Math.round(out[k] * 100) / 100;
  const supports: string[] = [];
  for (const sd of ['Left', 'Right'] as const) {
    const p = sd === 'Left' ? 'l' : 'r';
    if (sup[sd].hand) supports.push(p + 'Hand');
    if (sup[sd].knee) supports.push(p + 'Knee');
    if (sup[sd].foot) supports.push(p + 'Foot');
  }
  return { heights: out, supports };
}

export function drawFigure3D(ctx: CanvasRenderingContext2D, f: Figure, w: number, h: number, model: FigureModel, breath = 0, floorAt = 0.84, view: View3D = {}): boolean {
  const r = getRenderer();
  const rig = rigs.get(model);
  if (!r || !rig) {
    load(model);
    return false;
  }
  scene.add(rig.root);
  for (const other of rigs.values()) if (other !== rig) scene.remove(other.root);
  solve(rig, f, breath, view.yaw ?? 0);
  // the floor and mat sit under the body, wherever the pose puts it
  const ground = solvedFloor;
  contact.scale.set(Math.max(0.5, box.max.x - box.min.x) * 1.1, Math.max(0.5, box.max.z - box.min.z) * 1.1, 1);
  const centre = new THREE.Vector3((box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, (box.min.z + box.max.z) / 2);
  stage.position.set(centre.x, ground, centre.z);
  key.target.position.set(centre.x, ground, centre.z);
  key.position.set(centre.x - 2.5, ground + 4.5, centre.z + 2.2);
  wall.visible = !!view.wall;
  if (view.wall) {
    // the wall touches what leans on it: the back when sitting against it (wall sit), the backs of
    // the legs when lying with the legs up it (legs up the wall), its face at their furthest point
    const lyingDown = regionMin(rig, ['back']).back - ground < 0.15;
    const back = new THREE.Vector3(0, 0, lyingDown ? 1 : -1).applyAxisAngle(UP, (-(view.yaw ?? 0) * Math.PI) / 180);
    const at = backMost(rig, back, lyingDown ? ['lKnee', 'rKnee', 'lFoot', 'rFoot', 'hips'] : undefined) + 0.04 + 0.002;
    wall.position.set(centre.x, ground + 1.3, centre.z).addScaledVector(back, at - centre.clone().dot(back));
    wall.rotation.y = (-(view.yaw ?? 0) * Math.PI) / 180;
  }

  // camera on a sphere around the body: orbit 0 looks along +X (right side, forward = screen-right),
  // elevation tilts it down like a camera on a tripod above chest height
  // a wall at the feet (legs up the wall) would hide the body from the usual front-side cameras:
  // look from the head side instead
  const wallAtFeet = !!view.wall && regionMin(rig, ['back']).back - ground < 0.15;
  const a = ((wallAtFeet ? -Math.abs(view.orbit ?? 0) - 20 : (view.orbit ?? 0)) * Math.PI) / 180;
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


/**
 * For checks: anatomy of the solved pose. Lists what a real body cannot do: elbows or knees
 * folded past their range, knees bent backwards, the hip stretched far behind the trunk, a hand,
 * foot, elbow or knee inside the trunk. Each entry is a short code with the measured value.
 */
export function inspectAnatomy(f: Figure, model: FigureModel = 'female', yaw = 0): string[] | null {
  const rig = rigs.get(model);
  if (!rig) return null;
  solve(rig, f, 0, yaw);
  const B = rig.bones;
  const out: string[] = [];
  const deg = (r: number) => Math.round((r * 180) / Math.PI);
  const hips = wp(B.Hips);
  const neck = wp(B.Neck);
  const up = neck.clone().sub(hips).normalize();
  const lr = wp(B.LeftUpLeg).sub(wp(B.RightUpLeg)).normalize();
  const front = lr.clone().cross(up).normalize();
  // distance from a point to the trunk axis (hips → neck), and how far along it the point falls
  const toTrunk = (p: THREE.Vector3) => {
    const v = p.clone().sub(hips);
    const len = neck.distanceTo(hips);
    const t = Math.max(0, Math.min(len, v.dot(up)));
    return { d: v.sub(up.clone().multiplyScalar(t)).length(), t: t / len };
  };
  for (const side of ['Left', 'Right'] as const) {
    const s = side[0];
    const sh = wp(B[side + 'Arm']);
    const el = wp(B[side + 'ForeArm']);
    const ha = wp(B[side + 'Hand']);
    const elbow = el.clone().sub(sh).normalize().angleTo(ha.clone().sub(el).normalize());
    if (deg(elbow) > 155) out.push(`${s}Elbow>${deg(elbow)}`);
    const hp = wp(B[side + 'UpLeg']);
    const kn = wp(B[side + 'Leg']);
    const an = wp(B[side + 'Foot']);
    const thigh = kn.clone().sub(hp).normalize();
    const shin = an.clone().sub(kn).normalize();
    const knee = thigh.angleTo(shin);
    if (deg(knee) > 170) out.push(`${s}Knee>${deg(knee)}`);
    // the knee only folds backwards: the shin must not swing towards the front of the thigh
    // the kneecap faces the front of the thigh: perpendicular to it, about the hip's left-right axis
    const kneeFront = thigh.clone().cross(lr).normalize();
    if (deg(knee) > 25 && shin.dot(kneeFront) > 0.5) out.push(`${s}KneeBackwards${shin.dot(kneeFront).toFixed(2)}`);
    // hip extension: thigh behind the trunk line by more than ~50°
    const down = up.clone().negate();
    // measured in the side plane only (a leg opened sideways is not extended)
    const ext = thigh.dot(front) < 0 ? deg(Math.atan2(-thigh.dot(front), thigh.dot(down))) : 0;
    // (past ~150° the thigh runs along the trunk: that is a deep fold, i.e. flexion)
    if (ext > 72 && ext < 150) out.push(`${s}HipExt${ext}`);
    for (const [name, p, lim] of [['Hand', ha, 0.07], ['Elbow', el, 0.08], ['Foot', an, 0.08], ['Knee', kn, 0.09]] as const) {
      const { d, t } = toTrunk(p);
      if (t > 0.08 && t < 0.92 && d < lim) out.push(`${s}${name}InTrunk${d.toFixed(2)}`);
    }
  }
  return out;
}
