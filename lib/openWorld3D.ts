'use client';

import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import {
  DEFAULT_MAKEUP_STATE,
  OUTFIT_CATALOG,
  SHOP_KITTENS,
  STREET_CATS,
  WORLD_BUILDINGS,
  WORLD_COINS,
  WORLD_FOUNTAINS,
  WORLD_HEIGHT,
  WORLD_LAKE,
  WORLD_ROADS,
  WORLD_TREES,
  WORLD_WIDTH,
  type MakeupState,
  type OutfitId,
  type OwnedPetState,
  type StreetCatDef,
  type WorldBuilding,
  type WorldNpcDef,
} from './openWorldData';

export const WORLD_3D_SCALE = 1 / 12; // 4800x3600 -> 400x300 3D world units

export function world2DTo3D(wx: number, wy: number): { x: number; z: number } {
  return {
    x: (wx - WORLD_WIDTH / 2) * WORLD_3D_SCALE,
    z: (wy - WORLD_HEIGHT / 2) * WORLD_3D_SCALE,
  };
}

export function size2DTo3D(val: number): number {
  return val * WORLD_3D_SCALE;
}

const imageLoadCache = new Map<string, Promise<HTMLImageElement>>();

function loadCachedImage(imageSrc: string): Promise<HTMLImageElement> {
  const existing = imageLoadCache.get(imageSrc);
  if (existing) return existing;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = (err) => reject(err);
    el.src = imageSrc;
  });
  imageLoadCache.set(imageSrc, promise);
  return promise;
}

function createAnimeFaceTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#F2C9B6';
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const eyeY = h * 0.52;
    const eyeOffsetX = 36;

    [-1, 1].forEach((side) => {
      const ex = cx + side * eyeOffsetX;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, 15, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#65A30D';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY + 2, 10.5, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY + 3, 5, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex - 4, eyeY - 4, 3.8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = '#BE123C';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, eyeY + 32, 11, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates Joudy's real uploaded face UV texture AND paints live authentic makeup
 * directly onto her eyelids, lashline, cheeks, nose highlight, and lips!
 */
export async function createRealFaceTexture(
  imageSrc: string,
  makeup: MakeupState = DEFAULT_MAKEUP_STATE,
): Promise<THREE.CanvasTexture> {
  const img = await loadCachedImage(imageSrc);

  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#E8BAA4';
    ctx.fillRect(0, 0, w, h);

    const patchW = 160;
    const patchH = 180;
    const patch = document.createElement('canvas');
    patch.width = patchW;
    patch.height = patchH;
    const pCtx = patch.getContext('2d');

    if (pCtx) {
      const sx = img.width * 0.21;
      const sy = img.height * 0.14;
      const sw = img.width * 0.5;
      const sh = img.height * 0.5;

      pCtx.drawImage(img, sx, sy, sw, sh, 0, 0, patchW, patchH);

      // 1. Live Eyeshadow above both eyes
      if (makeup.eyeshadowColor) {
        pCtx.save();
        pCtx.globalCompositeOperation = 'multiply';
        pCtx.globalAlpha = 0.62;
        [
          { x: 51, y: 42, rx: 18, ry: 9 },
          { x: 99, y: 44, rx: 18, ry: 9 },
        ].forEach((eye) => {
          const grad = pCtx.createRadialGradient(eye.x, eye.y, 2, eye.x, eye.y, eye.rx);
          grad.addColorStop(0, makeup.eyeshadowColor!);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          pCtx.fillStyle = grad;
          pCtx.beginPath();
          pCtx.ellipse(eye.x, eye.y, eye.rx, eye.ry, 0, 0, Math.PI * 2);
          pCtx.fill();
        });
        pCtx.restore();

        // Subtle shimmer over eyelid
        pCtx.save();
        pCtx.globalAlpha = 0.32;
        pCtx.fillStyle = '#FFFFFF';
        [51, 99].forEach((ex, idx) => {
          pCtx.beginPath();
          pCtx.ellipse(ex, idx === 0 ? 44 : 46, 8, 3.5, 0, 0, Math.PI * 2);
          pCtx.fill();
        });
        pCtx.restore();
      }

      // 2. Winged Eyeliner
      if (makeup.eyeliner) {
        pCtx.save();
        pCtx.strokeStyle = '#0F172A';
        pCtx.lineWidth = 2.6;
        pCtx.lineCap = 'round';
        // Left eye wing
        pCtx.beginPath();
        pCtx.moveTo(64, 49);
        pCtx.quadraticCurveTo(51, 43, 35, 47);
        pCtx.lineTo(29, 43);
        pCtx.stroke();
        // Right eye wing
        pCtx.beginPath();
        pCtx.moveTo(85, 50);
        pCtx.quadraticCurveTo(99, 44, 115, 49);
        pCtx.lineTo(121, 45);
        pCtx.stroke();
        pCtx.restore();
      }

      // 3. Soft Cheek Blush
      if (makeup.blushColor) {
        pCtx.save();
        pCtx.globalCompositeOperation = 'source-over';
        pCtx.globalAlpha = 0.56;
        [
          { x: 40, y: 76, r: 22 },
          { x: 112, y: 76, r: 22 },
        ].forEach((c) => {
          const grad = pCtx.createRadialGradient(c.x, c.y, 3, c.x, c.y, c.r);
          grad.addColorStop(0, makeup.blushColor!);
          grad.addColorStop(0.55, makeup.blushColor!);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          pCtx.fillStyle = grad;
          pCtx.beginPath();
          pCtx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          pCtx.fill();
        });
        pCtx.restore();
      }

      // 4. Radiant Nose & Cheek Highlighter
      if (makeup.highlighter) {
        pCtx.save();
        pCtx.globalAlpha = 0.55;
        const nGrad = pCtx.createLinearGradient(69, 54, 69, 76);
        nGrad.addColorStop(0, 'rgba(255,250,235,0)');
        nGrad.addColorStop(0.5, 'rgba(255,252,240,0.95)');
        nGrad.addColorStop(1, 'rgba(255,250,235,0)');
        pCtx.fillStyle = nGrad;
        pCtx.beginPath();
        pCtx.ellipse(69, 65, 4.5, 13, 0.08, 0, Math.PI * 2);
        pCtx.fill();

        [39, 113].forEach((cx) => {
          const cg = pCtx.createRadialGradient(cx, 66, 1, cx, 66, 12);
          cg.addColorStop(0, 'rgba(255,253,242,0.92)');
          cg.addColorStop(1, 'rgba(255,253,242,0)');
          pCtx.fillStyle = cg;
          pCtx.beginPath();
          pCtx.arc(cx, 66, 12, 0, Math.PI * 2);
          pCtx.fill();
        });
        pCtx.restore();
      }

      // 5. Cheek Glitter Stars
      if (makeup.cheekGlitter) {
        pCtx.save();
        pCtx.fillStyle = '#FEF08A';
        [
          [34, 66, 2.3],
          [42, 72, 1.8],
          [29, 75, 1.6],
          [116, 66, 2.3],
          [108, 72, 1.8],
          [120, 75, 1.6],
        ].forEach(([gx, gy, gr]) => {
          pCtx.beginPath();
          pCtx.arc(gx, gy, gr, 0, Math.PI * 2);
          pCtx.fill();
        });
        pCtx.restore();
      }

      // 6. Real Glossy Lipstick on Lips
      if (makeup.lipColor) {
        pCtx.save();
        pCtx.globalCompositeOperation = 'source-over';
        pCtx.globalAlpha = 0.78;
        pCtx.fillStyle = makeup.lipColor;
        pCtx.beginPath();
        // Upper lip bow
        pCtx.moveTo(56, 102);
        pCtx.quadraticCurveTo(64, 96, 70, 99);
        pCtx.quadraticCurveTo(76, 96, 84, 102);
        // Lower lip curve
        pCtx.quadraticCurveTo(77, 112, 70, 112);
        pCtx.quadraticCurveTo(63, 112, 56, 102);
        pCtx.closePath();
        pCtx.fill();

        // Lip gloss highlight reflection
        pCtx.globalAlpha = 0.45;
        pCtx.fillStyle = '#FFFFFF';
        pCtx.beginPath();
        pCtx.ellipse(70, 107, 6.5, 2.1, 0, 0, Math.PI * 2);
        pCtx.fill();
        pCtx.restore();
      }

      // Soft feathered edge mask so photo melts smoothly into the 3D head
      pCtx.globalCompositeOperation = 'destination-in';
      const maskGrad = pCtx.createRadialGradient(
        patchW * 0.5,
        patchH * 0.5,
        patchW * 0.24,
        patchW * 0.5,
        patchH * 0.5,
        patchW * 0.5,
      );
      maskGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      maskGrad.addColorStop(0.68, 'rgba(255, 255, 255, 0.94)');
      maskGrad.addColorStop(0.88, 'rgba(255, 255, 255, 0.35)');
      maskGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      pCtx.fillStyle = maskGrad;
      pCtx.fillRect(0, 0, patchW, patchH);

      ctx.drawImage(patch, w * 0.5 - patchW * 0.44, h * 0.5 - patchH * 0.46, patchW * 0.88, patchH * 0.92);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createGrassMeadowTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#84CC16';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 65; i++) {
      const px = (i * 97) % size;
      const py = (i * 151) % size;
      const r = 18 + (i % 4) * 10;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(163, 230, 53, 0.35)' : 'rgba(101, 163, 13, 0.24)';
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 160; i++) {
      const gx = (i * 73 + 17) % size;
      const gy = (i * 119 + 29) % size;
      ctx.strokeStyle = '#65A30D';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx - 3, gy - 8);
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + 3, gy - 7);
      ctx.stroke();

      if (i % 13 === 0) {
        ctx.fillStyle = i % 26 === 0 ? '#FEF08A' : '#FFFFFF';
        ctx.beginPath();
        ctx.arc(gx + 6, gy - 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(60, 60);
  return tex;
}

function createMarbleTileTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFF5F7';
    ctx.fillRect(0, 0, size, size);
    const tile = 64;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#FFF1F2' : '#FFE4E6';
        ctx.fillRect(x * tile + 2, y * tile + 2, tile - 4, tile - 4);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 6);
  return tex;
}

function createRoadAsphaltTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 240; i++) {
      const rx = (i * 53) % size;
      const ry = (i * 89) % size;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.12)';
      ctx.fillRect(rx, ry, 3, 3);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  return tex;
}

function createWoodParquetTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#D97706';
    ctx.fillRect(0, 0, size, size);
    const plankH = 32;
    for (let y = 0; y < 8; y++) {
      ctx.fillStyle = y % 2 === 0 ? '#E7B98A' : '#DEB082';
      ctx.fillRect(0, y * plankH + 1, size, plankH - 2);
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.25)';
      ctx.lineWidth = 2;
      const splitX = (y * 91) % size;
      ctx.beginPath();
      ctx.moveTo(splitX, y * plankH);
      ctx.lineTo(splitX, (y + 1) * plankH);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 8);
  return tex;
}

export function createArabicLabelSprite(
  text: string,
  options: {
    bg?: string;
    border?: string;
    textColor?: string;
    fontSize?: number;
    scaleX?: number;
    scaleY?: number;
  } = {},
): THREE.Sprite {
  const {
    bg = 'rgba(255, 255, 255, 0.94)',
    border = '#FB7185',
    textColor = '#881337',
    fontSize = 30,
    scaleX = 3.8,
    scaleY = 0.95,
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = `800 ${fontSize}px Cairo, sans-serif`;
    const metrics = ctx.measureText(text);
    const boxW = Math.min(488, Math.max(150, metrics.width + 52));
    const boxH = 74;
    const bx = (512 - boxW) / 2;
    const by = (128 - boxH) / 2;

    ctx.fillStyle = bg;
    ctx.strokeStyle = border;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 36);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 66);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scaleX, scaleY, 1);
  return sprite;
}

function createSoftShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
    grad.addColorStop(0, 'rgba(45, 24, 36, 0.42)');
    grad.addColorStop(1, 'rgba(45, 24, 36, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildGoldenCrown(scale = 1): THREE.Group {
  const crown = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.75,
    roughness: 0.2,
  });
  const rubyMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    roughness: 0.2,
    metalness: 0.15,
    emissive: 0x881337,
    emissiveIntensity: 0.28,
  });

  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.15, 16), goldMat);
  crown.add(band);

  for (let i = 0; i < 5; i++) {
    const ang = (Math.PI * 2 * i) / 5;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), goldMat);
    spike.position.set(Math.cos(ang) * 0.23, 0.16, Math.sin(ang) * 0.23);
    crown.add(spike);

    if (i === 0 || i === 2) {
      const gem = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), rubyMat);
      gem.position.set(Math.cos(ang) * 0.27, 0.02, Math.sin(ang) * 0.27);
      crown.add(gem);
    }
  }
  crown.scale.setScalar(scale);
  return crown;
}

export interface CatMeshRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  tail: THREE.Mesh;
  crown: THREE.Group;
  furMat: THREE.MeshStandardMaterial;
  collarMat: THREE.MeshStandardMaterial;
}

/**
 * Builds an adorable multi-part 3D cat (stray street cat, shop kitten, or growing owned kingdom pet).
 */
export function buildCuteCatMesh3D(
  furColor: string,
  collarColor: string | null = null,
  earInnerColor = '#FDA4AF',
): CatMeshRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const furMat = new THREE.MeshStandardMaterial({ color: furColor, roughness: 0.72 });
  const earInnerMat = new THREE.MeshStandardMaterial({ color: earInnerColor, roughness: 0.65 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.4 });
  const collarMat = new THREE.MeshStandardMaterial({
    color: collarColor ?? '#F43F5E',
    roughness: 0.35,
    metalness: 0.25,
  });

  // Torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.42, 6, 12), furMat);
  torso.rotation.x = Math.PI / 2;
  torso.position.set(0, 0.38, 0);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // 4 Paws
  const pawGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.26, 8);
  [
    [-0.14, 0.14, 0.18],
    [0.14, 0.14, 0.18],
    [-0.14, 0.14, -0.18],
    [0.14, 0.14, -0.18],
  ].forEach(([px, py, pz]) => {
    const paw = new THREE.Mesh(pawGeo, furMat);
    paw.position.set(px, py, pz);
    bodyGroup.add(paw);
  });

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 14, 14), furMat);
  head.position.set(0, 0.65, 0.32);
  head.castShadow = true;
  bodyGroup.add(head);

  // Ears + Pink Inner Triangles
  const earGeo = new THREE.ConeGeometry(0.11, 0.22, 4);
  const innerEarGeo = new THREE.ConeGeometry(0.06, 0.14, 4);
  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(earGeo, furMat);
    ear.position.set(side * 0.16, 0.94, 0.32);
    ear.rotation.z = -side * 0.16;
    const inner = new THREE.Mesh(innerEarGeo, earInnerMat);
    inner.position.set(side * 0.16, 0.93, 0.36);
    inner.rotation.z = -side * 0.16;
    bodyGroup.add(ear, inner);
  });

  // Cute Eyes + Pink Nose
  [-0.1, 0.1].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.044, 8, 8), eyeMat);
    eye.position.set(ex, 0.68, 0.58);
    bodyGroup.add(eye);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), noseMat);
  nose.position.set(0, 0.6, 0.61);
  bodyGroup.add(nose);

  // Cute Tail
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.36, 4, 8), furMat);
  tail.position.set(0, 0.56, -0.36);
  tail.rotation.x = -0.65;
  bodyGroup.add(tail);

  // Optional Collar (hidden for street cats, visible for owned/shop cats!)
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.04, 8, 16), collarMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.49, 0.22);
  collar.visible = Boolean(collarColor);
  bodyGroup.add(collar);

  // Tiny Royal Crown (unlocks when owned cat grows to stage 3!)
  const crown = buildGoldenCrown(0.42);
  crown.position.set(0, 1.0, 0.32);
  crown.visible = false;
  bodyGroup.add(crown);

  return { root, bodyGroup, tail, crown, furMat, collarMat };
}

function buildChibiAnimeHead(initialFaceTex: THREE.Texture): {
  headGroup: THREE.Group;
  faceMat: THREE.MeshStandardMaterial;
} {
  const headGroup = new THREE.Group();

  const faceMat = new THREE.MeshStandardMaterial({
    map: initialFaceTex,
    roughness: 0.54,
    metalness: 0.02,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x5c2d16,
    roughness: 0.65,
  });
  const veilMat = new THREE.MeshStandardMaterial({
    color: 0xA9BDA5,
    roughness: 0.52,
  });
  const veilTrimMat = new THREE.MeshStandardMaterial({
    color: 0xD7C49A,
    roughness: 0.35,
    metalness: 0.3,
  });

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.56, 32, 24), faceMat);
  headMesh.rotation.y = -Math.PI / 2;
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  const lockGeo = new THREE.CapsuleGeometry(0.095, 0.44, 6, 10);
  const leftCurl = new THREE.Mesh(lockGeo, hairMat);
  leftCurl.position.set(-0.46, -0.1, 0.27);
  leftCurl.rotation.set(0.14, 0, 0.2);

  const rightCurl = new THREE.Mesh(lockGeo, hairMat);
  rightCurl.position.set(0.46, -0.1, 0.27);
  rightCurl.rotation.set(0.14, 0, -0.2);

  const bangsLeft = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.2, 4, 8), hairMat);
  bangsLeft.position.set(-0.22, 0.42, 0.36);
  bangsLeft.rotation.set(0.45, 0, 0.5);

  const bangsRight = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.2, 4, 8), hairMat);
  bangsRight.position.set(0.22, 0.42, 0.36);
  bangsRight.rotation.set(0.45, 0, -0.5);
  headGroup.add(leftCurl, rightCurl, bangsLeft, bangsRight);

  const hoodCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.61, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.62),
    veilMat,
  );
  hoodCap.rotation.x = -0.36;
  hoodCap.position.set(0, 0.06, -0.06);
  hoodCap.castShadow = true;
  headGroup.add(hoodCap);

  const backDrape = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.68, 0.72, 18, 1, false, Math.PI * 0.28, Math.PI * 1.44),
    veilMat,
  );
  backDrape.position.set(0, -0.26, -0.06);
  headGroup.add(backDrape);

  const neckShawl = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.14, 10, 22), veilMat);
  neckShawl.rotation.x = Math.PI / 2;
  neckShawl.position.set(0, -0.52, 0.02);
  headGroup.add(neckShawl);

  const hoodTrim = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.032, 8, 28), veilTrimMat);
  hoodTrim.rotation.x = 0.28;
  hoodTrim.position.set(0, 0.08, 0.19);
  headGroup.add(hoodTrim);


  return { headGroup, faceMat };
}

export interface PrincessJoudyRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  faceMat: THREE.MeshStandardMaterial;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  bouquetGroup: THREE.Group;
  carriedCatGroup: THREE.Group;
  setOutfit: (outfitId: OutfitId) => void;
  setCarriedCat: (cat: StreetCatDef | null) => void;
}

export function buildPrincessJoudy3D(shadowTex?: THREE.Texture): PrincessJoudyRig {
  const root = new THREE.Group();
  const sTex = shadowTex ?? createSoftShadowTexture();
  const faceTex = createAnimeFaceTexture();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.2),
    new THREE.MeshBasicMaterial({ map: sTex, transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  root.add(shadow);

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe8baa4, roughness: 0.62 });
  const gownMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.45 });
  const ruffleMat = new THREE.MeshStandardMaterial({ color: 0xffe4e6, roughness: 0.5 });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.68,
    roughness: 0.24,
  });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x9f1239, roughness: 0.4 });
  const jacketMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    roughness: 0.24,
    metalness: 0.16,
    clearcoat: 0.75,
  });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.72 });
  const sleeveMat = new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.5 });

  // Articulated Legs / Boots / Jeans
  const legGeo = new THREE.CapsuleGeometry(0.145, 0.52, 6, 10);
  const leftLeg = new THREE.Mesh(legGeo, shoeMat);
  leftLeg.position.set(-0.21, 0.42, 0);
  leftLeg.castShadow = true;
  bodyGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, shoeMat);
  rightLeg.position.set(0.21, 0.42, 0);
  rightLeg.castShadow = true;
  bodyGroup.add(rightLeg);

  // === GOWN OUTFIT GROUP ===
  const gownGroup = new THREE.Group();
  bodyGroup.add(gownGroup);

  const skirtPoints = [
    new THREE.Vector2(0.01, 0.25),
    new THREE.Vector2(0.78, 0.28),
    new THREE.Vector2(0.64, 0.72),
    new THREE.Vector2(0.4, 1.15),
    new THREE.Vector2(0.32, 1.45),
    new THREE.Vector2(0.37, 1.8),
    new THREE.Vector2(0.01, 1.84),
  ];
  const skirt = new THREE.Mesh(new THREE.LatheGeometry(skirtPoints, 24), gownMat);
  skirt.castShadow = true;
  gownGroup.add(skirt);

  const skirtRuffle = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.075, 8, 24), ruffleMat);
  skirtRuffle.rotation.x = Math.PI / 2;
  skirtRuffle.position.y = 0.32;
  gownGroup.add(skirtRuffle);

  const sash = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.055, 8, 24), trimMat);
  sash.rotation.x = Math.PI / 2;
  sash.position.y = 1.24;
  gownGroup.add(sash);

  // === CASUAL / LEATHER JACKET + PANTS GROUP ===
  const jacketGroup = new THREE.Group();
  jacketGroup.visible = false;
  bodyGroup.add(jacketGroup);

  const teeShirt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.35, 0.78, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
  );
  teeShirt.position.y = 1.38;
  jacketGroup.add(teeShirt);

  const jacketShell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.37, 0.4, 0.74, 16, 1, false, Math.PI * 0.16, Math.PI * 1.68),
    jacketMat,
  );
  jacketShell.position.y = 1.39;
  jacketShell.rotation.y = Math.PI;
  jacketShell.castShadow = true;
  jacketGroup.add(jacketShell);

  // Glossy Biker Collar + Silver Zipper Accent
  const jacketCollar = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.065, 8, 16), jacketMat);
  jacketCollar.rotation.x = Math.PI / 2;
  jacketCollar.position.y = 1.75;
  const zipper = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.65, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 }),
  );
  zipper.position.set(0.14, 1.38, 0.35);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 8, 18), trimMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.99;
  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.32, 16), pantsMat);
  hips.position.y = 0.84;
  jacketGroup.add(jacketCollar, zipper, belt, hips);

  const buildArm = (side: number) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.44, 1.72, 0);

    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), ruffleMat);
    armPivot.add(puff);

    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.26, 6, 8), sleeveMat);
    sleeve.position.y = -0.2;
    armPivot.add(sleeve);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), skinMat);
    hand.position.y = -0.4;
    armPivot.add(hand);
    return armPivot;
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);
  bodyGroup.add(leftArm, rightArm);

  // Rose Bouquet in right hand
  const bouquetGroup = new THREE.Group();
  bouquetGroup.position.set(0, -0.44, 0.22);
  bouquetGroup.visible = false;
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.34, 8),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 }),
  );
  leaves.rotation.x = Math.PI;
  bouquetGroup.add(leaves);
  const roseMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.35 });
  [
    [0, 0.14, 0],
    [-0.12, 0.1, 0.08],
    [0.12, 0.1, 0.08],
  ].forEach(([rx, ry, rz]) => {
    const rose = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), roseMat);
    rose.position.set(rx, ry, rz);
    bouquetGroup.add(rose);
  });
  rightArm.add(bouquetGroup);

  // Cute Carried Street Cat cradled cozily in Joudy's arms!
  const carriedCatRig = buildCuteCatMesh3D('#FB923C', null);
  const carriedCatGroup = carriedCatRig.root;
  carriedCatGroup.scale.setScalar(0.68);
  carriedCatGroup.position.set(0, 1.24, 0.56);
  carriedCatGroup.rotation.y = Math.PI / 2;
  carriedCatGroup.visible = false;
  bodyGroup.add(carriedCatGroup);

  const { headGroup, faceMat } = buildChibiAnimeHead(faceTex);
  headGroup.position.set(0, 2.38, 0);
  bodyGroup.add(headGroup);

  const nameplate = createArabicLabelSprite('جودي', {
    bg: 'rgba(255, 255, 255, 0.96)',
    border: '#F43F5E',
    textColor: '#9F1239',
    scaleX: 3.3,
    scaleY: 0.82,
  });
  nameplate.position.set(0, 3.65, 0);
  root.add(nameplate);

  const setOutfit = (outfitId: OutfitId) => {
    const def = OUTFIT_CATALOG.find((o) => o.id === outfitId) ?? OUTFIT_CATALOG[0];
    if (def.category === 'dress') {
      gownGroup.visible = true;
      jacketGroup.visible = false;
      gownMat.color.set(def.primaryHex);
      ruffleMat.color.set(def.secondaryHex);
      trimMat.color.set(def.accentHex);
      sleeveMat.color.set(def.secondaryHex);
      shoeMat.color.set(def.primaryHex);
      leftLeg.material = shoeMat;
      rightLeg.material = shoeMat;
    } else {
      gownGroup.visible = false;
      jacketGroup.visible = true;
      jacketMat.color.set(def.primaryHex);
      jacketMat.clearcoat = def.id === 'leather_jacket' ? 0.92 : 0.15;
      jacketMat.roughness = def.id === 'leather_jacket' ? 0.22 : 0.65;
      pantsMat.color.set(def.secondaryHex);
      trimMat.color.set(def.accentHex);
      sleeveMat.color.set(def.primaryHex);
      ruffleMat.color.set(def.primaryHex);
      leftLeg.material = pantsMat;
      rightLeg.material = pantsMat;
    }
  };

  const setCarriedCat = (cat: StreetCatDef | null) => {
    if (!cat) {
      carriedCatGroup.visible = false;
      return;
    }
    carriedCatRig.furMat.color.set(cat.furColor);
    carriedCatGroup.visible = true;
  };

  return {
    root,
    bodyGroup,
    headGroup,
    faceMat,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    bouquetGroup,
    carriedCatGroup,
    setOutfit,
    setCarriedCat,
  };
}

export interface PrincessCarRig {
  root: THREE.Group;
  wheels: THREE.Mesh[];
  driverGroup: THREE.Group;
  driverFaceMat: THREE.MeshStandardMaterial;
  driverBouquet: THREE.Group;
  steeringWheel: THREE.Mesh;
  setOutfit: (outfitId: OutfitId) => void;
}

export function buildPrincessCar3D(shadowTex?: THREE.Texture): PrincessCarRig {
  const root = new THREE.Group();
  const sTex = shadowTex ?? createSoftShadowTexture();
  const faceTex = createAnimeFaceTexture();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 5.6),
    new THREE.MeshBasicMaterial({ map: sTex, transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  root.add(shadow);

  const pinkPaint = new THREE.MeshPhysicalMaterial({
    color: 0x202830,
    roughness: 0.28,
    metalness: 0.35,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });
  const blushTrim = new THREE.MeshPhysicalMaterial({
    color: 0xE4B82F,
    roughness: 0.3,
    clearcoat: 0.8,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.84,
    roughness: 0.16,
  });
  const creamSeat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.72 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.62,
    roughness: 0.08,
    metalness: 0.25,
  });

  const lowerHull = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.7, 4.65), pinkPaint);
  lowerHull.position.set(0, 0.68, 0);
  lowerHull.castShadow = true;
  root.add(lowerHull);

  const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 1.9), blushTrim);
  leftDoor.position.set(-1.08, 1.05, -0.1);
  const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 1.9), blushTrim);
  rightDoor.position.set(1.08, 1.05, -0.1);
  root.add(leftDoor, rightDoor);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.26, 1.65), pinkPaint);
  hood.position.set(0, 1.06, 1.42);
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.28, 1.1), pinkPaint);
  trunk.position.set(0, 1.08, -1.65);
  root.add(hood, trunk);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 1.6), goldMat);
  stripe.position.set(0, 1.2, 1.42);
  const taxiSignBase = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.32, 0.48), blushTrim);
  taxiSignBase.position.set(0, 1.95, -0.22);
  const taxiSignTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.38), goldMat);
  taxiSignTop.position.set(0, 2.17, -0.22);
  root.add(stripe, taxiSignBase, taxiSignTop);

  const cabinFloor = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.24, 1.8), creamSeat);
  cabinFloor.position.set(0, 1.04, -0.2);
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.62, 0.28), creamSeat);
  seatBack.position.set(0, 1.4, -0.88);
  const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 18), goldMat);
  steeringWheel.position.set(0, 1.38, 0.42);
  steeringWheel.rotation.x = 0.45;
  root.add(cabinFloor, seatBack, steeringWheel);

  [-1.22, 1.22].forEach((mx) => {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.12), goldMat);
    mirror.position.set(mx, 1.26, 0.66);
    root.add(mirror);
  });

  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.2, 0.22), goldMat);
  frontBumper.position.set(0, 0.44, 2.34);
  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.2, 0.22), goldMat);
  rearBumper.position.set(0, 0.44, -2.34);
  root.add(frontBumper, rearBumper);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.68, 0.08), glassMat);
  windshield.position.set(0, 1.45, 0.68);
  windshield.rotation.x = -0.42;
  root.add(windshield);

  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 0.78,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xbe123c,
    emissive: 0xf43f5e,
    emissiveIntensity: 0.55,
  });
  [-0.78, 0.78].forEach((lx) => {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), headMat);
    hl.position.set(lx, 0.78, 2.3);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.17, 0.08), tailMat);
    tl.position.set(lx, 0.78, -2.33);
    root.add(hl, tl);
  });

  const wheels: THREE.Mesh[] = [];
  [
    [-1.14, 0.44, 1.45],
    [1.14, 0.44, 1.45],
    [-1.14, 0.44, -1.45],
    [1.14, 0.44, -1.45],
  ].forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.3, 18), tireMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, wy, wz);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.32, 12), goldMat);
    wheel.add(rim);
    root.add(wheel);
    wheels.push(wheel);
  });

  const driverGroup = new THREE.Group();
  driverGroup.position.set(0, 1.25, -0.22);
  driverGroup.visible = false;
  root.add(driverGroup);

  const driverTorsoMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.45 });
  const driverTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.36, 0.65, 14), driverTorsoMat);
  driverTorso.position.y = 0.25;
  driverGroup.add(driverTorso);

  const dArmMat = new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.5 });
  [-0.32, 0.32].forEach((ax) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.36, 4, 8), dArmMat);
    arm.position.set(ax * 0.85, 0.42, 0.3);
    arm.rotation.x = Math.PI * 0.42;
    driverGroup.add(arm);
  });

  const { headGroup: driverHead, faceMat: driverFaceMat } = buildChibiAnimeHead(faceTex);
  driverHead.scale.setScalar(0.86);
  driverHead.position.set(0, 0.96, 0);
  driverGroup.add(driverHead);

  const driverName = createArabicLabelSprite('جودي', {
    bg: 'rgba(255, 255, 255, 0.96)',
    border: '#F43F5E',
    textColor: '#9F1239',
    scaleX: 3.3,
    scaleY: 0.82,
  });
  driverName.position.set(0, 2.2, 0);
  driverGroup.add(driverName);

  const driverBouquet = new THREE.Group();
  driverBouquet.position.set(0.55, 0.35, 0.25);
  driverBouquet.visible = false;
  const dRose = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xe11d48 }),
  );
  driverBouquet.add(dRose);
  driverGroup.add(driverBouquet);

  const setOutfit = (outfitId: OutfitId) => {
    const def = OUTFIT_CATALOG.find((o) => o.id === outfitId) ?? OUTFIT_CATALOG[0];
    driverTorsoMat.color.set(def.primaryHex);
    dArmMat.color.set(def.category === 'dress' ? def.secondaryHex : def.primaryHex);
  };

  return { root, wheels, driverGroup, driverFaceMat, driverBouquet, steeringWheel, setOutfit };
}

export interface NpcRig3D {
  def: WorldNpcDef;
  root: THREE.Group;
  bodyGroup: THREE.Group;
  questMarker: THREE.Sprite;
  phase: number;
}

export function buildNpc3D(def: WorldNpcDef, shadowTex?: THREE.Texture): NpcRig3D {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);
  const sTex = shadowTex ?? createSoftShadowTexture();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 1.7),
    new THREE.MeshBasicMaterial({ map: sTex, transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  root.add(shadow);

  if (def.id === 'cat') {
    const catMesh = buildCuteCatMesh3D('#FDBA74', '#F43F5E');
    catMesh.root.scale.setScalar(1.2);
    bodyGroup.add(catMesh.root);
  } else {
    const outfitMat = new THREE.MeshStandardMaterial({ color: def.outfitColor, roughness: 0.55 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde2d2, roughness: 0.65 });
    const hairMat = new THREE.MeshStandardMaterial({ color: def.hairColor, roughness: 0.75 });
    const accentMat = new THREE.MeshStandardMaterial({
      color: def.accentColor,
      roughness: 0.3,
      metalness: 0.35,
    });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.54, 1.4, 14), outfitMat);
    torso.position.y = 0.75;
    torso.castShadow = true;
    bodyGroup.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), skinMat);
    head.position.y = 1.78;
    bodyGroup.add(head);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    [-0.14, 0.14].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMat);
      eye.position.set(ex, 1.8, 0.34);
      bodyGroup.add(eye);
    });

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.41, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
      hairMat,
    );
    hair.position.set(0, 1.82, -0.04);
    bodyGroup.add(hair);

    if (def.id === 'guard') {
      const helmet = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.45, 12), accentMat);
      helmet.position.y = 2.24;
      const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.08, 16), accentMat);
      shield.rotation.x = Math.PI / 2;
      shield.position.set(-0.55, 1.05, 0.2);
      bodyGroup.add(helmet, shield);
    } else if (def.id === 'florist') {
      const basket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.18, 0.25, 10),
        new THREE.MeshStandardMaterial({ color: 0xb45309 }),
      );
      basket.position.set(0.45, 0.95, 0.25);
      const roses = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), accentMat);
      roses.position.set(0.45, 1.15, 0.25);
      bodyGroup.add(basket, roses);
    } else if (def.id === 'shopkeeper') {
      const apron = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.9, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }),
      );
      apron.position.set(0, 0.7, 0.44);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.22, 12), accentMat);
      cap.position.y = 2.15;
      bodyGroup.add(apron, cap);
    } else {
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 8, 16), accentMat);
      bow.rotation.x = Math.PI / 2;
      bow.position.y = 2.2;
      bodyGroup.add(bow);
    }
  }

  const label = createArabicLabelSprite(`${def.emoji} ${def.name}`, {
    bg: 'rgba(255, 255, 255, 0.92)',
    border: '#CBD5E1',
    textColor: '#1E293B',
    scaleX: 3.5,
    scaleY: 0.84,
  });
  label.position.set(0, def.id === 'cat' ? 1.65 : 2.95, 0);
  root.add(label);

  const questMarker = createArabicLabelSprite('!', {
    bg: '#FACC15',
    border: '#92400E',
    textColor: '#78350F',
    fontSize: 44,
    scaleX: 1.0,
    scaleY: 1.0,
  });
  questMarker.position.set(0, def.id === 'cat' ? 2.45 : 3.8, 0);
  questMarker.visible = false;
  root.add(questMarker);

  const startPos = world2DTo3D(def.homeX, def.homeY);
  root.position.set(startPos.x, 0, startPos.z);

  return { def, root, bodyGroup, questMarker, phase: Math.random() * Math.PI * 2 };
}

export interface StreetCatRig3D {
  def: StreetCatDef;
  rig: CatMeshRig;
  phase: number;
  pickedUp: boolean;
}

export interface CoinMesh3D {
  id: number;
  wx: number;
  wy: number;
  mesh: THREE.Group;
  collected: boolean;
  respawnTimer: number;
}

export const INTERIOR_HALF_W = 31.5;
export const INTERIOR_HALF_D = 24.5;
export const SECOND_FLOOR_Y = 8.4;

/**
 * Computes exact walkable floor height inside the ultra-spacious 2-story Royal Palace & Villas:
 * - Ground floor: y = 0
 * - Grand Staircase (x in [18.0..27.0], z in [-8.0..11.0]): smoothly ramps 0 -> 8.4
 * - 2nd Floor Mezzanine (z <= -8.0): y = 8.4
 */
export function getInteriorFloorY(building: WorldBuilding, x: number, z: number): number {
  if (!building.hasSecondFloor) return 0;
  if (z <= -8.0) return SECOND_FLOOR_Y;
  if (x >= 17.8 && x <= 27.2 && z > -8.0 && z <= 11.2) {
    const t = Math.max(0, Math.min(1, (11.0 - z) / 19.0));
    return t * SECOND_FLOOR_Y;
  }
  return 0;
}

/**
 * Resolves interior room walls, staircase opening, and 2nd-floor balcony railing guardrails cleanly.
 */
export function resolveInteriorMovement(
  building: WorldBuilding,
  curX: number,
  curZ: number,
  curY: number,
  nextX: number,
  nextZ: number,
): { x: number; z: number; y: number } {
  let x = Math.max(-INTERIOR_HALF_W, Math.min(INTERIOR_HALF_W, nextX));
  let z = Math.max(-INTERIOR_HALF_D, Math.min(INTERIOR_HALF_D, nextZ));

  const isResidential =
    building.kind === 'palace' ||
    building.kind === 'villa' ||
    building.kind === 'house_pink' ||
    building.kind === 'house_mint' ||
    building.kind === 'house_sky';
  if (isResidential) {
    for (const dividerX of [-13.5, 8.0]) {
      const crossed = (curX < dividerX && x >= dividerX) || (curX > dividerX && x <= dividerX);
      const insidePartitionArea = z <= -8.0;
      const insideDoorway = z >= -20.5 && z <= -15.5;
      if (crossed && insidePartitionArea && !insideDoorway) x = curX;
    }
  }

  if (building.hasSecondFloor) {
    const wasOnSecondFloor = curY >= SECOND_FLOOR_Y * 0.55;
    const onStairBand = x >= 17.8 && x <= 27.2 && z >= -9.2 && z <= 11.2;

    if (wasOnSecondFloor && !onStairBand && z > -8.1) {
      // Balcony guardrail prevents accidentally walking off the 2nd floor edge!
      z = -8.1;
    }

    // Prevent walking sideways onto elevated staircase mid-flight from ground floor
    if (!wasOnSecondFloor && curZ < 9.5 && curZ > -8.0 && curX < 17.6 && x >= 17.6) {
      x = 17.55;
    }
  }

  const y = getInteriorFloorY(building, x, z);
  return { x, z, y };
}

export interface InteriorStage3D {
  root: THREE.Group;
  secondFloorGroup: THREE.Group;
  beautyStudioGroup: THREE.Group;
  bedroomGroup: THREE.Group;
  palaceThroneGroup: THREE.Group;
  loungeGroup: THREE.Group;
  cafeGroup: THREE.Group;
  boutiqueGroup: THREE.Group;
  petShopGroup: THREE.Group;
  petCornerGroup: THREE.Group;
  observatoryGroup: THREE.Group;
  ownedPetRig: CatMeshRig;
  shopDisplayKittens: CatMeshRig[];
  mirrorReflector: Reflector;
  bedPosition3D: THREE.Vector3;
  vanityChair3D: THREE.Vector3;
  wardrobe3D: THREE.Vector3;
  throneChair3D: THREE.Vector3;
  sofaSeat3D: THREE.Vector3;
  telescope3D: THREE.Vector3;
  cafeCounter3D: THREE.Vector3;
  petShopCounter3D: THREE.Vector3;
  petCare3D: THREE.Vector3;
  exitDoor3D: THREE.Vector3;
  syncOwnedPetVisual: (pet: OwnedPetState | null) => void;
  configureForBuilding: (building: WorldBuilding) => void;
  cleanup: () => void;
}

export function buildInteriorStage3D(
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean,
): InteriorStage3D {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const root = new THREE.Group();
  root.visible = false;

  const woodTex = track(createWoodParquetTexture());
  woodTex.anisotropy = maxAniso;

  const roomW = 68;
  const roomD = 54;
  const wallH = 22.0;

  // Expansive Ground Floor
  const floor = new THREE.Mesh(
    track(new THREE.BoxGeometry(roomW, 0.3, roomD)),
    track(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.56 })),
  );
  floor.position.y = -0.15;
  floor.receiveShadow = true;
  root.add(floor);

  // Grand Central Chandelier Carpet + Red Runner
  const rugOuter = new THREE.Mesh(
    track(new THREE.CylinderGeometry(11.5, 11.5, 0.05, 40)),
    track(new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.85 })),
  );
  rugOuter.position.set(0, 0.025, 3.0);
  const rugInner = new THREE.Mesh(
    track(new THREE.CylinderGeometry(8.6, 8.6, 0.06, 40)),
    track(new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.82 })),
  );
  rugInner.position.set(0, 0.032, 3.0);
  const redRunner = new THREE.Mesh(
    track(new THREE.BoxGeometry(5.6, 0.04, 24.0)),
    track(new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.78 })),
  );
  redRunner.position.set(0, 0.022, 13.5);
  root.add(rugOuter, rugInner, redRunner);

  const wallMat = track(new THREE.MeshStandardMaterial({ color: 0xfff8fa, roughness: 0.72 }));
  const wainscotMat = track(new THREE.MeshStandardMaterial({ color: 0xfce7f3, roughness: 0.6 }));
  const goldMat = track(
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.75, roughness: 0.22 }),
  );
  const glassMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      emissive: 0x7dd3fc,
      emissiveIntensity: 0.45,
      roughness: 0.1,
    }),
  );

  // Spacious Room Perimeter Walls
  const backWall = new THREE.Mesh(track(new THREE.BoxGeometry(roomW, wallH, 0.6)), wallMat);
  backWall.position.set(0, wallH / 2, -roomD / 2);
  const leftWall = new THREE.Mesh(track(new THREE.BoxGeometry(0.6, wallH, roomD)), wallMat);
  leftWall.position.set(-roomW / 2, wallH / 2, 0);
  const rightWall = new THREE.Mesh(track(new THREE.BoxGeometry(0.6, wallH, roomD)), wallMat);
  rightWall.position.set(roomW / 2, wallH / 2, 0);
  const frontWall = new THREE.Mesh(track(new THREE.BoxGeometry(roomW, wallH, 0.6)), wallMat);
  frontWall.position.set(0, wallH / 2, roomD / 2);
  root.add(backWall, leftWall, rightWall, frontWall);

  const ceiling = new THREE.Mesh(track(new THREE.BoxGeometry(roomW, 0.3, roomD)), wainscotMat);
  ceiling.position.y = wallH;
  root.add(ceiling);

  // High-Vault Interior Lighting
  const interiorLight = new THREE.PointLight(0xfffbeb, 1.5, 86, 1.1);
  interiorLight.position.set(0, wallH - 3.5, 0);
  const mirrorLight = new THREE.PointLight(0xfff1f2, 1.1, 36, 1.2);
  mirrorLight.position.set(0, SECOND_FLOOR_Y + 5.2, -19.0);
  root.add(interiorLight, mirrorLight);

  // Grand Chandelier
  const chandelier = new THREE.Group();
  chandelier.position.set(0, wallH - 1.8, 2.0);
  const chain = new THREE.Mesh(track(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 8)), goldMat);
  chain.position.y = 0.9;
  const ring = new THREE.Mesh(track(new THREE.TorusGeometry(3.1, 0.12, 8, 32)), goldMat);
  ring.rotation.x = Math.PI / 2;
  chandelier.add(chain, ring);
  const bulbMat = track(
    new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xfde047, emissiveIntensity: 0.92 }),
  );
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI * 2 * i) / 10;
    const bulb = new THREE.Mesh(track(new THREE.SphereGeometry(0.28, 10, 10)), bulbMat);
    bulb.position.set(Math.cos(ang) * 3.1, 0.28, Math.sin(ang) * 3.1);
    chandelier.add(bulb);
  }
  root.add(chandelier);

  // Tall Arched Windows on Left & Right Walls
  [-12.0, 2.0, 14.0].forEach((wz) => {
    [-roomW / 2 + 0.38, roomW / 2 - 0.38].forEach((wx) => {
      const frame = new THREE.Mesh(track(new THREE.BoxGeometry(0.28, 7.2, 4.4)), goldMat);
      frame.position.set(wx, 10.6, wz);
      const pane = new THREE.Mesh(track(new THREE.BoxGeometry(0.32, 6.4, 3.7)), glassMat);
      pane.position.set(wx, 10.6, wz);
      root.add(frame, pane);
    });
  });

  // Grand Exit Double Door
  const exitDoor3D = new THREE.Vector3(0, 0, roomD / 2 - 2.2);
  const exitDoorMesh = new THREE.Mesh(
    track(new THREE.BoxGeometry(5.2, 6.0, 0.45)),
    track(new THREE.MeshStandardMaterial({ color: 0x9f1239, roughness: 0.45 })),
  );
  exitDoorMesh.position.set(0, 3.0, roomD / 2 - 0.38);
  const exitFrame = new THREE.Mesh(track(new THREE.BoxGeometry(5.9, 6.4, 0.32)), goldMat);
  exitFrame.position.set(0, 3.2, roomD / 2 - 0.28);
  const exitSign = createArabicLabelSprite('باب الخروج 🚪', {
    bg: 'rgba(255, 255, 255, 0.96)',
    border: '#F43F5E',
    textColor: '#881337',
    scaleX: 4.0,
    scaleY: 0.95,
  });
  exitSign.position.set(0, 7.1, roomD / 2 - 0.8);
  root.add(exitFrame, exitDoorMesh, exitSign);

  // === GRAND 2ND FLOOR & WIDE WALKABLE STAIRCASE ===
  const secondFloorGroup = new THREE.Group();
  root.add(secondFloorGroup);

  const deckMat = track(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.5 }));
  const carpetMat = track(new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.7 }));

  // 2nd Floor Deck (z: -27.0 to -8.0, width 67.2)
  const deck = new THREE.Mesh(track(new THREE.BoxGeometry(67.2, 0.42, 19.0)), deckMat);
  deck.position.set(0, SECOND_FLOOR_Y - 0.21, -17.5);
  deck.receiveShadow = true;
  secondFloorGroup.add(deck);

  // Gold Balcony Railing along z = -8.05 (leaving wide opening at x: 17.8..27.2 for staircase landing!)
  const leftRailBar = new THREE.Mesh(track(new THREE.BoxGeometry(51.4, 0.2, 0.2)), goldMat);
  leftRailBar.position.set(-7.9, SECOND_FLOOR_Y + 1.25, -8.05);
  secondFloorGroup.add(leftRailBar);
  for (let rx = -32.2; rx <= 17.2; rx += 3.2) {
    const post = new THREE.Mesh(track(new THREE.CylinderGeometry(0.09, 0.09, 1.3, 8)), goldMat);
    post.position.set(rx, SECOND_FLOOR_Y + 0.65, -8.05);
    secondFloorGroup.add(post);
  }
  const rightRailBar = new THREE.Mesh(track(new THREE.BoxGeometry(6.0, 0.2, 0.2)), goldMat);
  rightRailBar.position.set(30.4, SECOND_FLOOR_Y + 1.25, -8.05);
  secondFloorGroup.add(rightRailBar);

  // Staircase Treads (18 wide steps rising smoothly from z = +11 -> z = -8, y = 0 -> 8.4)
  const stepCount = 18;
  for (let i = 0; i < stepCount; i++) {
    const t = (i + 0.5) / stepCount;
    const sy = t * SECOND_FLOOR_Y;
    const sz = 11.0 - t * 19.0;
    const step = new THREE.Mesh(track(new THREE.BoxGeometry(9.0, 0.46, 1.15)), wainscotMat);
    step.position.set(22.5, sy - 0.23, sz);
    const runner = new THREE.Mesh(track(new THREE.BoxGeometry(5.8, 0.49, 1.15)), carpetMat);
    runner.position.set(22.5, sy - 0.22, sz);
    secondFloorGroup.add(step, runner);
  }

  // Sloped Golden Stair Handrails
  [18.1, 26.9].forEach((hx) => {
    const rail = new THREE.Mesh(track(new THREE.CylinderGeometry(0.1, 0.1, 20.8, 8)), goldMat);
    rail.position.set(hx, SECOND_FLOOR_Y / 2 + 1.2, 1.5);
    rail.rotation.x = Math.atan2(19.0, SECOND_FLOOR_Y);
    secondFloorGroup.add(rail);
  });

  const stairSign = createArabicLabelSprite('سلم الدور الثاني 🪜✨', {
    bg: 'rgba(255, 255, 255, 0.95)',
    border: '#F59E0B',
    textColor: '#881337',
    scaleX: 4.2,
    scaleY: 0.95,
  });
  stairSign.position.set(22.5, 3.0, 12.0);
  secondFloorGroup.add(stairSign);

  // === ROYAL MAKEUP STUDIO + REAL-TIME MIRROR (Reflector) + WARDROBE CLOSET ===
  const beautyStudioGroup = new THREE.Group();
  root.add(beautyStudioGroup);

  const vanityChair3D = new THREE.Vector3(0, 0, -19.2);
  const wardrobe3D = new THREE.Vector3(-10.8, 0, -23.4);

  // Giant Ornate Gold Mirror Frame + LIVE Real-Time Reflector Mirror
  const mirrorW = 7.8;
  const mirrorH = 5.4;
  const mirrorFrame = new THREE.Mesh(
    track(new THREE.BoxGeometry(mirrorW + 0.75, mirrorH + 0.75, 0.3)),
    goldMat,
  );
  mirrorFrame.position.set(0, 4.15, -24.75);
  beautyStudioGroup.add(mirrorFrame);

  const mirrorGeo = track(new THREE.PlaneGeometry(mirrorW, mirrorH));
  const mirrorReflector = new Reflector(mirrorGeo, {
    clipBias: 0.003,
    textureWidth: isSoftwareGl ? 384 : 768,
    textureHeight: isSoftwareGl ? 384 : 768,
    color: 0xf4eff2,
    multisample: isSoftwareGl ? 0 : 2,
  });
  mirrorReflector.position.set(0, 4.15, -24.55);
  beautyStudioGroup.add(mirrorReflector);

  // Spacious Vanity Table + Makeup Props
  const vanityTableMat = track(new THREE.MeshStandardMaterial({ color: 0xfff1f2, roughness: 0.35 }));
  const vanityTop = new THREE.Mesh(track(new THREE.BoxGeometry(8.2, 0.25, 2.2)), vanityTableMat);
  vanityTop.position.set(0, 1.38, -23.45);
  const vanityLegL = new THREE.Mesh(track(new THREE.BoxGeometry(0.45, 1.32, 1.8)), goldMat);
  vanityLegL.position.set(-3.7, 0.66, -23.45);
  const vanityLegR = new THREE.Mesh(track(new THREE.BoxGeometry(0.45, 1.32, 1.8)), goldMat);
  vanityLegR.position.set(3.7, 0.66, -23.45);
  beautyStudioGroup.add(vanityTop, vanityLegL, vanityLegR);

  [0xe11d48, 0xec4899, 0xa855f7].forEach((col, i) => {
    const lipBase = new THREE.Mesh(track(new THREE.CylinderGeometry(0.11, 0.11, 0.32, 10)), goldMat);
    lipBase.position.set(-2.0 + i * 0.5, 1.66, -23.0);
    const lipTip = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 10)),
      track(new THREE.MeshStandardMaterial({ color: col, roughness: 0.25 })),
    );
    lipTip.position.set(-2.0 + i * 0.5, 1.88, -23.0);
    beautyStudioGroup.add(lipBase, lipTip);
  });
  const perfumeBottle = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.3, 12, 12)),
    track(new THREE.MeshPhysicalMaterial({ color: 0xfbcfe8, roughness: 0.1, clearcoat: 1 })),
  );
  perfumeBottle.position.set(2.2, 1.75, -23.0);
  beautyStudioGroup.add(perfumeBottle);

  // Plush Velvet Vanity Chair positioned comfortably at z = -19.2 so front camera fits unobstructed!
  const chairMat = track(new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.65 }));
  const chairSeat = new THREE.Mesh(track(new THREE.CylinderGeometry(0.95, 0.9, 0.34, 18)), chairMat);
  chairSeat.position.set(0, 0.85, -19.2);
  const chairPost = new THREE.Mesh(track(new THREE.CylinderGeometry(0.18, 0.48, 0.8, 12)), goldMat);
  chairPost.position.set(0, 0.4, -19.2);
  const chairBack = new THREE.Mesh(track(new THREE.BoxGeometry(1.5, 0.9, 0.24)), chairMat);
  chairBack.position.set(0, 1.38, -18.35);
  beautyStudioGroup.add(chairSeat, chairPost, chairBack);

  const mirrorSign = createArabicLabelSprite('تسريحة المكياج والمرآة 💄🪞', {
    bg: 'rgba(255, 255, 255, 0.96)',
    border: '#EC4899',
    textColor: '#9D174D',
    scaleX: 4.3,
    scaleY: 0.95,
  });
  mirrorSign.position.set(0, 7.6, -23.8);
  beautyStudioGroup.add(mirrorSign);

  // Royal Wardrobe Closet
  const closetWood = track(new THREE.MeshStandardMaterial({ color: 0xfdf2f8, roughness: 0.45 }));
  const closetBody = new THREE.Mesh(track(new THREE.BoxGeometry(5.2, 6.2, 2.2)), closetWood);
  closetBody.position.set(-10.8, 3.1, -24.0);
  const closetTrim = new THREE.Mesh(track(new THREE.BoxGeometry(5.4, 0.4, 2.35)), goldMat);
  closetTrim.position.set(-10.8, 6.3, -24.0);
  const closetDoorLine = new THREE.Mesh(track(new THREE.BoxGeometry(0.12, 5.4, 0.1)), goldMat);
  closetDoorLine.position.set(-10.8, 3.1, -22.88);
  const wardrobeSign = createArabicLabelSprite('خزانة الفساتين والجاكيت 👗🧥', {
    bg: 'rgba(255, 255, 255, 0.96)',
    border: '#A855F7',
    textColor: '#6B21A8',
    scaleX: 4.3,
    scaleY: 0.92,
  });
  wardrobeSign.position.set(-10.8, 7.2, -23.2);
  beautyStudioGroup.add(closetBody, closetTrim, closetDoorLine, wardrobeSign);

  // === ROYAL BEDROOM SUITE (Spacious Left Wing) ===
  const bedroomGroup = new THREE.Group();
  root.add(bedroomGroup);
  const bedPosition3D = new THREE.Vector3(-22.5, 0, -17.5);

  const bedGroup = new THREE.Group();
  bedGroup.position.copy(bedPosition3D);
  const woodBedMat = track(new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 }));
  const mattressMat = track(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }));
  const blanketMat = track(new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.72 }));
  const pillowMat = track(new THREE.MeshStandardMaterial({ color: 0xfce7f3, roughness: 0.75 }));

  const bedFrame = new THREE.Mesh(track(new THREE.BoxGeometry(5.4, 0.72, 6.6)), woodBedMat);
  bedFrame.position.y = 0.36;
  const headboard = new THREE.Mesh(track(new THREE.BoxGeometry(5.6, 3.2, 0.4)), woodBedMat);
  headboard.position.set(0, 1.6, -3.2);
  const bedCrown = buildGoldenCrown(0.9);
  bedCrown.position.set(0, 3.45, -3.2);

  const mattress = new THREE.Mesh(track(new THREE.BoxGeometry(4.9, 0.58, 6.0)), mattressMat);
  mattress.position.set(0, 0.95, 0.05);
  const blanket = new THREE.Mesh(track(new THREE.BoxGeometry(5.0, 0.36, 3.9)), blanketMat);
  blanket.position.set(0, 1.12, 1.1);

  [-1.15, 1.15].forEach((px) => {
    const pillow = new THREE.Mesh(track(new THREE.BoxGeometry(1.7, 0.38, 1.1)), pillowMat);
    pillow.position.set(px, 1.36, -2.05);
    pillow.rotation.x = 0.18;
    bedGroup.add(pillow);
  });

  const bedSign = createArabicLabelSprite('السرير الملكي 🛏️', {
    bg: 'rgba(255, 255, 255, 0.95)',
    border: '#FBBF24',
    textColor: '#9F1239',
    scaleX: 3.8,
    scaleY: 0.9,
  });
  bedSign.position.set(0, 4.4, -1.0);
  bedGroup.add(bedFrame, headboard, bedCrown, mattress, blanket, bedSign);
  bedroomGroup.add(bedGroup);

  // === OWNED PET CARE CORNER (Generous Right-Rear 2nd Floor Wing) ===
  const petCornerGroup = new THREE.Group();
  petCornerGroup.position.set(13.5, SECOND_FLOOR_Y, -18.5);
  root.add(petCornerGroup);

  const petCare3D = new THREE.Vector3(13.5, SECOND_FLOOR_Y, -18.5);

  const petMat = new THREE.Mesh(
    track(new THREE.CylinderGeometry(2.8, 2.9, 0.2, 24)),
    track(new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.8 })),
  );
  petMat.position.set(0, 0.1, 0);
  petCornerGroup.add(petMat);

  const foodBowl = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.6, 0.7, 0.3, 16)),
    track(new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.4 })),
  );
  foodBowl.position.set(-1.55, 0.19, 1.45);
  const kibble = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.4, 10, 8)),
    track(new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 })),
  );
  kibble.scale.set(1, 0.42, 1);
  kibble.position.set(-1.55, 0.32, 1.45);
  petCornerGroup.add(foodBowl, kibble);

  const waterBowl = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.6, 0.7, 0.3, 16)),
    track(new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.35 })),
  );
  waterBowl.position.set(1.55, 0.19, 1.45);
  const waterTop = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 16)),
    track(new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.1, clearcoat: 1 })),
  );
  waterTop.position.set(1.55, 0.32, 1.45);
  petCornerGroup.add(waterBowl, waterTop);

  const petCornerSign = createArabicLabelSprite('ركن رعاية قطتكِ 🐱🍲💧', {
    bg: 'rgba(255, 255, 255, 0.96)',
    border: '#F59E0B',
    textColor: '#92400E',
    scaleX: 4.2,
    scaleY: 0.92,
  });
  petCornerSign.position.set(0, 3.4, 0);
  petCornerGroup.add(petCornerSign);

  const ownedPetRig = buildCuteCatMesh3D('#FDBA74', '#F43F5E');
  ownedPetRig.root.position.set(0, 0.18, -0.35);
  ownedPetRig.root.visible = false;
  petCornerGroup.add(ownedPetRig.root);

  // === GROUND FLOOR SITTABLE ROYAL PRINCESS THRONE ===
  const throneChair3D = new THREE.Vector3(0, 0, -2.0);
  const palaceThroneGroup = new THREE.Group();
  root.add(palaceThroneGroup);

  const dais = new THREE.Mesh(track(new THREE.BoxGeometry(9.2, 0.55, 6.2)), blanketMat);
  dais.position.set(0, 0.275, -2.4);
  const throneSeat = new THREE.Mesh(track(new THREE.BoxGeometry(3.1, 1.1, 2.4)), goldMat);
  throneSeat.position.set(0, 1.0, -2.1);
  const throneBack = new THREE.Mesh(track(new THREE.BoxGeometry(3.1, 4.2, 0.48)), goldMat);
  throneBack.position.set(0, 2.95, -3.15);
  const throneCushion = new THREE.Mesh(track(new THREE.BoxGeometry(2.5, 0.35, 2.0)), blanketMat);
  throneCushion.position.set(0, 1.65, -2.05);
  [-1.55, 1.55].forEach((ax) => {
    const armrest = new THREE.Mesh(track(new THREE.BoxGeometry(0.36, 1.15, 2.2)), goldMat);
    armrest.position.set(ax, 1.85, -2.15);
    palaceThroneGroup.add(armrest);
  });
  const throneCrown = buildGoldenCrown(1.25);
  throneCrown.position.set(0, 5.45, -3.15);
  const throneSign = createArabicLabelSprite('عرش الأميرة جودي — اضغطي للجلوس 👑🪑', {
    bg: 'rgba(255, 255, 255, 0.96)',
    border: '#F59E0B',
    textColor: '#881337',
    scaleX: 5.0,
    scaleY: 0.98,
  });
  throneSign.position.set(0, 6.65, -2.6);
  palaceThroneGroup.add(dais, throneSeat, throneBack, throneCushion, throneCrown, throneSign);

  // === ROYAL VELVET LOUNGE SOFA (Sittable cozy spot on left ground wing!) ===
  const sofaSeat3D = new THREE.Vector3(-19.0, 0, 7.5);
  const loungeGroup = new THREE.Group();
  root.add(loungeGroup);
  const sofaMat = track(new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.68 }));
  const sofaBase = new THREE.Mesh(track(new THREE.BoxGeometry(5.2, 0.95, 2.3)), sofaMat);
  sofaBase.position.set(-19.0, 0.48, 7.5);
  const sofaBack = new THREE.Mesh(track(new THREE.BoxGeometry(5.2, 1.9, 0.45)), sofaMat);
  sofaBack.position.set(-19.0, 1.35, 6.48);
  [-21.45, -16.55].forEach((sx) => {
    const arm = new THREE.Mesh(track(new THREE.BoxGeometry(0.45, 1.45, 2.3)), goldMat);
    arm.position.set(sx, 0.85, 7.5);
    loungeGroup.add(arm);
  });
  const teaTable = new THREE.Mesh(
    track(new THREE.CylinderGeometry(1.5, 1.5, 0.85, 18)),
    track(new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.3 })),
  );
  teaTable.position.set(-19.0, 0.425, 10.6);
  const sofaSign = createArabicLabelSprite('أريكة الاستراحة الملكية 🛋️', {
    bg: 'rgba(255, 255, 255, 0.94)',
    border: '#F472B6',
    textColor: '#881337',
    scaleX: 4.0,
    scaleY: 0.9,
  });
  sofaSign.position.set(-19.0, 3.2, 7.5);
  loungeGroup.add(sofaBase, sofaBack, teaTable, sofaSign);

  // === ROYAL OBSERVATORY ROOM (Starlight Telescope & Saturn Planet!) ===
  const observatoryGroup = new THREE.Group();
  root.add(observatoryGroup);
  const telescope3D = new THREE.Vector3(0, 0, -10.5);

  const starRug = new THREE.Mesh(
    track(new THREE.CylinderGeometry(9.0, 9.0, 0.08, 32)),
    track(new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.7 })),
  );
  starRug.position.set(0, 0.04, -10.5);
  observatoryGroup.add(starRug);

  const tripod = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.18, 1.1, 2.6, 6)),
    goldMat,
  );
  tripod.position.set(0, 1.3, -10.8);
  const scopeTube = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.32, 0.48, 3.8, 16)),
    track(new THREE.MeshStandardMaterial({ color: 0x4f46e5, metalness: 0.65, roughness: 0.2 })),
  );
  scopeTube.position.set(0, 2.85, -11.3);
  scopeTube.rotation.x = Math.PI * 0.34;
  const scopeRim = new THREE.Mesh(track(new THREE.TorusGeometry(0.49, 0.08, 8, 18)), goldMat);
  scopeRim.position.set(0, 3.7, -12.8);
  scopeRim.rotation.x = -Math.PI * 0.16;

  // Floating Golden Planet & Moons above!
  const planet = new THREE.Mesh(
    track(new THREE.SphereGeometry(2.1, 20, 20)),
    track(new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 0.45 })),
  );
  planet.position.set(0, 11.2, -14.0);
  const planetRing = new THREE.Mesh(track(new THREE.TorusGeometry(3.4, 0.22, 8, 28)), goldMat);
  planetRing.position.copy(planet.position);
  planetRing.rotation.set(1.1, 0.3, 0.2);

  const obsSign = createArabicLabelSprite('التلسكوب السحري — انظري للنجوم 🔭✨', {
    bg: 'rgba(255, 255, 255, 0.96)',
    border: '#6366F1',
    textColor: '#312E81',
    scaleX: 4.8,
    scaleY: 0.96,
  });
  obsSign.position.set(0, 5.2, -10.8);
  observatoryGroup.add(tripod, scopeTube, scopeRim, planet, planetRing, obsSign);

  // === PRINCESS CAFÉ & BAKERY ===
  const cafeGroup = new THREE.Group();
  root.add(cafeGroup);
  const cafeCounter3D = new THREE.Vector3(0, 0, -5.2);

  const counter = new THREE.Mesh(
    track(new THREE.BoxGeometry(15.5, 2.1, 2.6)),
    track(new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.5 })),
  );
  counter.position.set(0, 1.05, -7.2);
  const counterTop = new THREE.Mesh(
    track(new THREE.BoxGeometry(16.0, 0.26, 2.9)),
    track(new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.35 })),
  );
  counterTop.position.set(0, 2.22, -7.2);
  const cakeCase = new THREE.Mesh(track(new THREE.BoxGeometry(4.4, 1.3, 1.8)), glassMat);
  cakeCase.position.set(-3.2, 2.95, -7.1);
  const cafeSign = createArabicLabelSprite('ركن القهوة والحلويات ☕', {
    bg: 'rgba(255, 255, 255, 0.96)',
    border: '#EC4899',
    textColor: '#9F1239',
    scaleX: 4.4,
    scaleY: 0.95,
  });
  cafeSign.position.set(0, 4.7, -6.9);
  cafeGroup.add(counter, counterTop, cakeCase, cafeSign);

  [
    [-12.0, 1.0],
    [12.0, 1.0],
    [-12.0, 9.5],
    [12.0, 9.5],
  ].forEach(([tx, tz]) => {
    const tbl = new THREE.Mesh(track(new THREE.CylinderGeometry(1.4, 1.4, 1.35, 14)), counterTop.material);
    tbl.position.set(tx, 0.675, tz);
    cafeGroup.add(tbl);
  });

  // === KITTY BOUTIQUE / GIFTS ===
  const boutiqueGroup = new THREE.Group();
  root.add(boutiqueGroup);
  const giftColors = [0xf43f5e, 0xa855f7, 0xfbbf24, 0x34d399];
  [-12.0, -4.0, 4.0, 12.0].forEach((sx, idx) => {
    const shelf = new THREE.Mesh(
      track(new THREE.BoxGeometry(4.2, 4.5, 1.8)),
      track(new THREE.MeshStandardMaterial({ color: 0xfdf4ff, roughness: 0.5 })),
    );
    shelf.position.set(sx, 2.25, -10.5);
    const gift = new THREE.Mesh(
      track(new THREE.BoxGeometry(1.3, 1.3, 1.3)),
      track(new THREE.MeshStandardMaterial({ color: giftColors[idx % giftColors.length], roughness: 0.3 })),
    );
    gift.position.set(sx, 5.15, -10.5);
    boutiqueGroup.add(shelf, gift);
  });

  // === PET SHOP INTERIOR (Animated Kittens Showcase + Counter) ===
  const petShopGroup = new THREE.Group();
  root.add(petShopGroup);
  const petShopCounter3D = new THREE.Vector3(0, 0, -4.5);

  const shopCounter = new THREE.Mesh(
    track(new THREE.BoxGeometry(13.5, 2.0, 2.4)),
    track(new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 })),
  );
  shopCounter.position.set(0, 1.0, -6.2);
  const shopTop = new THREE.Mesh(
    track(new THREE.BoxGeometry(14.0, 0.25, 2.7)),
    track(new THREE.MeshStandardMaterial({ color: 0xfff7ed, roughness: 0.3 })),
  );
  shopTop.position.set(0, 2.12, -6.2);
  const shopSign = createArabicLabelSprite('متجر القطط 🐾', {
    bg: 'rgba(255, 255, 255, 0.96)',
    border: '#F97316',
    textColor: '#9A3412',
    scaleX: 5.0,
    scaleY: 0.98,
  });
  shopSign.position.set(0, 4.9, -6.2);
  petShopGroup.add(shopCounter, shopTop, shopSign);

  const shopDisplayKittens: CatMeshRig[] = SHOP_KITTENS.map((k, idx) => {
    const px = -15.0 + idx * 10.0;
    const pz = -13.5;
    const pedestal = new THREE.Mesh(
      track(new THREE.BoxGeometry(4.8, 1.4, 3.8)),
      track(new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 })),
    );
    pedestal.position.set(px, 0.7, pz);
    const kit = buildCuteCatMesh3D(k.furColor, k.collarColor);
    kit.root.position.set(px, 1.45, pz);
    kit.root.scale.setScalar(1.08);
    const kLabel = createArabicLabelSprite(`${k.name} (${k.price} 🪙)`, {
      bg: 'rgba(255, 255, 255, 0.94)',
      border: '#F97316',
      textColor: '#9A3412',
      scaleX: 3.6,
      scaleY: 0.85,
    });
    kLabel.position.set(px, 3.2, pz);
    petShopGroup.add(pedestal, kit.root, kLabel);
    return kit;
  });

  const syncOwnedPetVisual = (pet: OwnedPetState | null) => {
    if (!pet) {
      ownedPetRig.root.visible = false;
      return;
    }
    ownedPetRig.root.visible = true;
    ownedPetRig.furMat.color.set(pet.furColor);
    ownedPetRig.collarMat.color.set(pet.collarColor);
    const growthScale = pet.stage === 1 ? 0.65 : pet.stage === 2 ? 0.96 : 1.32;
    ownedPetRig.root.scale.setScalar(growthScale);
    ownedPetRig.crown.visible = pet.stage >= 3;
  };

  // Residential interiors have separate room zones instead of one repeated empty hall.
  const residentialRoomsGroup = new THREE.Group();
  root.add(residentialRoomsGroup);
  const roomDividerMat = track(new THREE.MeshStandardMaterial({ color: 0xf8e7ed, roughness: 0.72 }));
  const roomTrimMat = track(new THREE.MeshStandardMaterial({ color: 0xd6a94f, metalness: 0.42, roughness: 0.34 }));
  const addResidentialFloorPlan = (height: number) => {
    const floorPlan = new THREE.Group();
    floorPlan.position.y = height;
    for (const dividerX of [-13.5, 8.0]) {
      // Each divider contains a wide doorway so the player can move between rooms.
      const wallPieces = [
        { centerZ: -22.25, depth: 3.5 },
        { centerZ: -11.8, depth: 7.4 },
      ];
      wallPieces.forEach(({ centerZ, depth }) => {
        const panel = new THREE.Mesh(track(new THREE.BoxGeometry(0.34, 6.5, depth)), roomDividerMat);
        panel.position.set(dividerX, 3.25, centerZ);
        floorPlan.add(panel);
        const top = new THREE.Mesh(track(new THREE.BoxGeometry(0.5, 0.22, depth + 0.12)), roomTrimMat);
        top.position.set(dividerX, 6.52, centerZ);
        floorPlan.add(top);
      });
      [-20.5, -15.5].forEach((doorZ) => {
        const post = new THREE.Mesh(track(new THREE.BoxGeometry(0.46, 5.8, 0.46)), roomTrimMat);
        post.position.set(dividerX, 2.9, doorZ);
        floorPlan.add(post);
      });
      const lintel = new THREE.Mesh(track(new THREE.BoxGeometry(0.55, 0.38, 5.0)), roomTrimMat);
      lintel.position.set(dividerX, 5.95, -18.0);
      floorPlan.add(lintel);
    }
    residentialRoomsGroup.add(floorPlan);
    return floorPlan;
  };
  const groundRoomPlan = addResidentialFloorPlan(0);
  const upperRoomPlan = addResidentialFloorPlan(SECOND_FLOOR_Y);

  const roomSignGroups = new Map<string, THREE.Group>();
  const roomNamesByHome: Record<string, [string, string, string, string]> = {
    royal_palace: ['جناح النوم الملكي', 'غرفة الإطلالات', 'جناح رعاية القطط', 'الردهة الملكية'],
    princess_villa: ['غرفة النوم', 'غرفة الملابس', 'غرفة الرعاية', 'صالة الضيوف'],
    villa_east: ['جناح الشوكولاتة', 'غرفة الملابس', 'ركن الاسترخاء', 'مكتبة المنزل'],
    villa_west: ['غرفة الياسمين', 'مرآة الزينة', 'ركن القراءة', 'صالة الزهور'],
    house_sugar: ['غرفة النوم الوردية', 'خزانة الملابس', 'جلسة النافذة', 'غرفة الموسيقى'],
    house_pearl: ['غرفة اللؤلؤ', 'ركن الدراسة', 'جلسة هادئة', 'صالة الضيوف'],
    house_emerald: ['غرفة الزمرد', 'مكتبة صغيرة', 'ركن رعاية القطة', 'صالة العائلة'],
    house_sunset: ['غرفة الغروب', 'ركن الملابس', 'جلسة الشرفة', 'صالة دافئة'],
  };
  Object.entries(roomNamesByHome).forEach(([buildingId, roomNames]) => {
    const group = new THREE.Group();
    const positions = [
      [-22.5, 5.6, -13.0],
      [0, 5.6, -13.0],
      [13.5, 5.6, -13.0],
      [-19.0, 4.0, 10.8],
    ] as const;
    roomNames.forEach((label, index) => {
      const sprite = createArabicLabelSprite(label, {
        bg: 'rgba(255,255,255,0.94)',
        border: '#D6A94F',
        textColor: '#3F2A34',
        scaleX: 3.6,
        scaleY: 0.82,
      });
      sprite.position.set(positions[index][0], positions[index][1], positions[index][2]);
      group.add(sprite);
    });
    group.visible = false;
    roomSignGroups.set(buildingId, group);
    root.add(group);
  });

  const interiorThemes: Record<string, {
    wall: number; floor: number; trim: number; accent: number; light: number; furniture: number;
  }> = {
    royal_palace: { wall: 0xfff6f8, floor: 0xffe4ec, trim: 0xfce7f3, accent: 0xbe123c, light: 0xfff1d2, furniture: 0xf43f5e },
    princess_villa: { wall: 0xfff1f5, floor: 0xfce7f3, trim: 0xfbcfe8, accent: 0xdb2777, light: 0xffe4ed, furniture: 0xec4899 },
    villa_east: { wall: 0xf0fdf4, floor: 0xd1fae5, trim: 0xa7f3d0, accent: 0x047857, light: 0xffedcf, furniture: 0x92400e },
    villa_west: { wall: 0xfff5f7, floor: 0xffe4e6, trim: 0xfda4af, accent: 0xbe185d, light: 0xffe7ec, furniture: 0xfb7185 },
    house_sugar: { wall: 0xfff7ed, floor: 0xfce7f3, trim: 0xfbcfe8, accent: 0xdb2777, light: 0xffead9, furniture: 0xf9a8d4 },
    house_pearl: { wall: 0xf0f9ff, floor: 0xdbeafe, trim: 0xbae6fd, accent: 0x0369a1, light: 0xe0f2fe, furniture: 0x38bdf8 },
    house_emerald: { wall: 0xecfdf5, floor: 0xd1fae5, trim: 0xa7f3d0, accent: 0x047857, light: 0xe0f2e9, furniture: 0x059669 },
    house_sunset: { wall: 0xfffbeb, floor: 0xfef3c7, trim: 0xfcd34d, accent: 0xb45309, light: 0xffe4b8, furniture: 0xf59e0b },
  };

  const configureForBuilding = (building: WorldBuilding) => {
    const floorY = building.hasSecondFloor ? SECOND_FLOOR_Y : 0;
    const theme = interiorThemes[building.id] ?? interiorThemes.royal_palace;

    secondFloorGroup.visible = Boolean(building.hasSecondFloor);
    beautyStudioGroup.visible = Boolean(building.hasMakeup || building.hasWardrobe);
    const beautyY = building.kind === 'salon' || building.kind === 'boutique' ? 0 : floorY;
    beautyStudioGroup.position.set(0, beautyY, 0);

    vanityChair3D.set(0, beautyY, -19.2);
    wardrobe3D.set(-10.8, beautyY, -23.4);

    bedroomGroup.visible = building.hasBed;
    bedroomGroup.position.set(0, floorY, 0);
    bedPosition3D.set(-22.5, floorY, -17.5);

    petCornerGroup.visible = Boolean(building.hasPetCorner);
    petCornerGroup.position.set(13.5, floorY, -18.5);
    petCare3D.set(13.5, floorY, -18.5);

    // Re-colour the room surfaces and furniture for each residence so houses do not share one look.
    roomDividerMat.color.setHex(theme.wall);
    roomTrimMat.color.setHex(theme.trim);
    (floor.material as THREE.MeshStandardMaterial).color.setHex(theme.floor);
    deckMat.color.setHex(theme.floor);
    wallMat.color.setHex(theme.wall);
    wainscotMat.color.setHex(theme.trim);
    carpetMat.color.setHex(theme.accent);
    vanityTableMat.color.setHex(theme.wall);
    chairMat.color.setHex(theme.furniture);
    closetWood.color.setHex(theme.wall);
    blanketMat.color.setHex(theme.furniture);
    sofaMat.color.setHex(theme.furniture);
    interiorLight.color.setHex(theme.light);
    mirrorLight.color.setHex(theme.light);

    const isResidence =
      building.kind === 'palace' ||
      building.kind === 'villa' ||
      building.kind === 'house_pink' ||
      building.kind === 'house_mint' ||
      building.kind === 'house_sky';
    residentialRoomsGroup.visible = isResidence;
    groundRoomPlan.visible = isResidence;
    upperRoomPlan.visible = isResidence && Boolean(building.hasSecondFloor);
    roomSignGroups.forEach((group, buildingId) => {
      group.visible = isResidence && building.id === buildingId;
    });

    palaceThroneGroup.visible = building.kind === 'palace';
    loungeGroup.visible =
      building.kind === 'palace' ||
      building.kind === 'villa' ||
      building.kind === 'house_pink' ||
      building.kind === 'house_mint' ||
      building.kind === 'house_sky';
    cafeGroup.visible = building.kind === 'cafe' || building.kind === 'bakery';
    boutiqueGroup.visible = building.kind === 'boutique';
    petShopGroup.visible = building.kind === 'pet_shop';
    observatoryGroup.visible = Boolean(building.hasObservatory);
  };

  return {
    root,
    secondFloorGroup,
    beautyStudioGroup,
    bedroomGroup,
    palaceThroneGroup,
    loungeGroup,
    cafeGroup,
    boutiqueGroup,
    petShopGroup,
    petCornerGroup,
    observatoryGroup,
    ownedPetRig,
    shopDisplayKittens,
    mirrorReflector,
    bedPosition3D,
    vanityChair3D,
    wardrobe3D,
    throneChair3D,
    sofaSeat3D,
    telescope3D,
    cafeCounter3D,
    petShopCounter3D,
    petCare3D,
    exitDoor3D,
    syncOwnedPetVisual,
    configureForBuilding,
    cleanup: () => {
      mirrorReflector.dispose();
      disposables.forEach((d) => d.dispose());
    },
  };
}

export function buildWorldEnvironment3D(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean,
): {
  exteriorRoot: THREE.Group;
  fountainWaterMeshes: THREE.Mesh[];
  beaconGroup: THREE.Group;
  coinMeshes: CoinMesh3D[];
  streetCatRigs: StreetCatRig3D[];
  clouds: THREE.Group[];
  cleanup: () => void;
} {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const exteriorRoot = new THREE.Group();
  scene.add(exteriorRoot);

  // 1. Neutral city terrain — paved urban ground rather than a fantasy meadow.
  const groundGeo = track(new THREE.PlaneGeometry(1080, 1080));
  const groundMat = track(new THREE.MeshStandardMaterial({ color: 0x969892, roughness: 0.96 }));
  const cityGround = new THREE.Mesh(groundGeo, groundMat);
  cityGround.rotation.x = -Math.PI / 2;
  cityGround.position.y = -0.18;
  cityGround.receiveShadow = true;
  exteriorRoot.add(cityGround);

  // Distant low skyline silhouettes frame this compact playable Alexandria district.
  const skylineMat = track(new THREE.MeshStandardMaterial({ color: 0x9BAAB0, roughness: 0.88 }));
  for (let i = 0; i < 26; i++) {
    const width = 8 + (i % 4) * 3;
    const height = 14 + ((i * 7) % 18);
    const depth = 8 + (i % 3) * 2;
    const building = new THREE.Mesh(track(new THREE.BoxGeometry(width, height, depth)), skylineMat);
    const side = i % 2 === 0 ? -1 : 1;
    building.position.set(side * (225 + (i % 5) * 9), height / 2 - 0.2, -120 + i * 9.1);
    exteriorRoot.add(building);
  }

  // Floating 3D Clouds
  const clouds: THREE.Group[] = [];
  const cloudMat = track(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }));
  const puffGeoCloud = track(new THREE.SphereGeometry(4.2, 10, 10));
  for (let i = 0; i < 12; i++) {
    const cg = new THREE.Group();
    const c1 = new THREE.Mesh(puffGeoCloud, cloudMat);
    const c2 = new THREE.Mesh(puffGeoCloud, cloudMat);
    c2.position.set(3.8, -0.5, 0.6);
    c2.scale.setScalar(0.8);
    const c3 = new THREE.Mesh(puffGeoCloud, cloudMat);
    c3.position.set(-3.5, -0.4, -0.5);
    c3.scale.setScalar(0.85);
    cg.add(c1, c2, c3);
    cg.position.set(-200 + i * 38, 54 + (i % 3) * 9, -150 + ((i * 59) % 280));
    exteriorRoot.add(cg);
    clouds.push(cg);
  }

  // 2. Mediterranean waterfront, sandy strip, promenade and low stone sea wall.
  const seaMat = track(new THREE.MeshPhysicalMaterial({ color: 0x1686B2, roughness: 0.17, metalness: 0.06, clearcoat: 0.88, clearcoatRoughness: 0.12 }));
  const sea = new THREE.Mesh(track(new THREE.PlaneGeometry(520, 116)), seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -0.22, -169);
  exteriorRoot.add(sea);

  const beachMat = track(new THREE.MeshStandardMaterial({ color: 0xD7C39A, roughness: 0.96 }));
  const beach = new THREE.Mesh(track(new THREE.PlaneGeometry(430, 13)), beachMat);
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(0, -0.02, -111.2);
  exteriorRoot.add(beach);

  const seawallMat = track(new THREE.MeshStandardMaterial({ color: 0xB6B2A8, roughness: 0.82 }));
  const seaWall = new THREE.Mesh(track(new THREE.BoxGeometry(430, 1.35, 1.35)), seawallMat);
  seaWall.position.set(0, 0.7, -104.5);
  exteriorRoot.add(seaWall);
  const promenadeMat = track(new THREE.MeshStandardMaterial({ color: 0xC5C3B9, roughness: 0.9 }));
  const promenade = new THREE.Mesh(track(new THREE.BoxGeometry(430, 0.16, 7.4)), promenadeMat);
  promenade.position.set(0, 0.05, -99.9);
  promenade.receiveShadow = true;
  exteriorRoot.add(promenade);

  // Mediterranean tetrapods and natural rocks along the shore.
  const rockMat = track(new THREE.MeshStandardMaterial({ color: 0x777C7B, roughness: 0.98, flatShading: true }));
  const tetrapodMat = track(new THREE.MeshStandardMaterial({ color: 0xA2A5A1, roughness: 0.94, flatShading: true }));
  for (let i = 0; i < 46; i++) {
    const x = -210 + i * 9.2;
    const z = -109.5 - (i % 3) * 2.4;
    const rock = new THREE.Mesh(track(new THREE.DodecahedronGeometry(1.4 + (i % 3) * 0.32, 0)), rockMat);
    rock.position.set(x, -0.15, z);
    rock.rotation.set(i * 0.32, i * 0.7, i * 0.18);
    exteriorRoot.add(rock);
    if (i % 2 === 0) {
      const tetrapod = new THREE.Group();
      const core = new THREE.Mesh(track(new THREE.BoxGeometry(0.9, 0.9, 0.9)), tetrapodMat);
      tetrapod.add(core);
      [[1.15,0,0],[-1.15,0,0],[0,1.15,0],[0,-1.15,0],[0,0,1.15],[0,0,-1.15]].forEach(([tx,ty,tz]) => {
        const arm = new THREE.Mesh(track(new THREE.BoxGeometry(0.85,0.85,0.85)), tetrapodMat);
        arm.position.set(tx,ty,tz);
        arm.rotation.set(0.35,0.45,0.25);
        tetrapod.add(arm);
      });
      tetrapod.position.set(x + 2.8, -0.4, z + 2.1);
      tetrapod.rotation.y = i * 0.43;
      tetrapod.scale.setScalar(0.72 + (i % 3) * 0.12);
      exteriorRoot.add(tetrapod);
    }
  }

  // Small fishing harbour with wooden boats at the Bahary end.
  const harbourWater = new THREE.Mesh(track(new THREE.BoxGeometry(38, 0.2, 16)), seaMat);
  harbourWater.position.set(-166, -0.04, -91);
  exteriorRoot.add(harbourWater);
  const boatPaint = track(new THREE.MeshStandardMaterial({ color: 0x8D4A2F, roughness: 0.78 }));
  const boatBlue = track(new THREE.MeshStandardMaterial({ color: 0x2B718B, roughness: 0.68 }));
  for (let i = 0; i < 5; i++) {
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(track(new THREE.BoxGeometry(2.1, 0.65, 8.2)), i % 2 ? boatBlue : boatPaint);
    hull.position.y = 0.25;
    boat.add(hull);
    const gunwale = new THREE.Mesh(track(new THREE.BoxGeometry(2.25, 0.2, 8.4)), track(new THREE.MeshStandardMaterial({ color: 0xE7D9B9, roughness: 0.8 })));
    gunwale.position.y = 0.62;
    boat.add(gunwale);
    const mast = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08,0.1,5.4,8)), track(new THREE.MeshStandardMaterial({ color: 0x76563B })));
    mast.position.set(0,3.2,-0.6);
    boat.add(mast);
    const sail = new THREE.Mesh(track(new THREE.PlaneGeometry(2.4,2.7)), track(new THREE.MeshStandardMaterial({ color: i%2 ? 0xF1E6D2 : 0xD9E6E6, side: THREE.DoubleSide, roughness: 0.9 })));
    sail.position.set(0,3.25,-0.55);
    boat.add(sail);
    boat.position.set(-178 + i*5.4,0,-91 + (i%2)*5.2);
    boat.rotation.y = -0.18 + i*0.13;
    exteriorRoot.add(boat);
  }

  // 4. Paved Asphalt Roads, Sidewalks, Dashes & Zebra Crosswalks
  const asphaltTex = track(createRoadAsphaltTexture());
  asphaltTex.anisotropy = maxAniso;
  const roadMat = track(new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.84 }));
  const sidewalkMat = track(new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.68 }));
  const dashMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));

  WORLD_ROADS.forEach((r, idx) => {
    const pos = world2DTo3D(r.x + r.w / 2, r.y + r.h / 2);
    const rw = size2DTo3D(r.w);
    const rd = size2DTo3D(r.h);
    const yOff = 0.04 + idx * 0.002;

    const sidewalk = new THREE.Mesh(track(new THREE.BoxGeometry(rw + 2.0, 0.08, rd + 2.0)), sidewalkMat);
    sidewalk.position.set(pos.x, yOff - 0.01, pos.z);
    sidewalk.receiveShadow = true;
    exteriorRoot.add(sidewalk);

    const road = new THREE.Mesh(track(new THREE.BoxGeometry(rw, 0.09, rd)), roadMat);
    road.position.set(pos.x, yOff, pos.z);
    road.receiveShadow = true;
    exteriorRoot.add(road);

    const isHorizontal = rw > rd;
    const span = isHorizontal ? rw : rd;
    const count = Math.floor(span / 4.8);
    for (let i = 0; i < count; i++) {
      const offset = -span / 2 + 2.4 + i * 4.8;
      const dash = new THREE.Mesh(
        track(new THREE.BoxGeometry(isHorizontal ? 2.2 : 0.28, 0.1, isHorizontal ? 0.28 : 2.2)),
        dashMat,
      );
      dash.position.set(
        pos.x + (isHorizontal ? offset : 0),
        yOff + 0.015,
        pos.z + (isHorizontal ? 0 : offset),
      );
      exteriorRoot.add(dash);
    }
    if (idx === 0 && isHorizontal) {
      // Six visible lane separators (three per direction) and a raised central median.
      [-0.36, -0.24, -0.12, 0.12, 0.24, 0.36].forEach((fraction) => {
        const laneLine = new THREE.Mesh(track(new THREE.BoxGeometry(rw, 0.055, 0.055)), dashMat);
        laneLine.position.set(pos.x, yOff + 0.035, pos.z + rd * fraction);
        exteriorRoot.add(laneLine);
      });
      const median = new THREE.Mesh(track(new THREE.BoxGeometry(rw, 0.28, 1.1)), track(new THREE.MeshStandardMaterial({ color: 0xB7B7A8, roughness: 0.8 })));
      median.position.set(pos.x, yOff + 0.1, pos.z);
      exteriorRoot.add(median);

      // Alexandria Corniche centre reservation: palms and paired lanterns.
      const palmTrunkMat = track(new THREE.MeshStandardMaterial({ color: 0x8B6543, roughness: 0.94 }));
      const palmLeafMat = track(new THREE.MeshStandardMaterial({ color: 0x28734C, roughness: 0.82, side: THREE.DoubleSide }));
      const lampPoleMat = track(new THREE.MeshStandardMaterial({ color: 0x59636A, metalness: 0.55, roughness: 0.42 }));
      const lampGlowMat = track(new THREE.MeshStandardMaterial({ color: 0xF7E7A2, emissive: 0xD6A94C, emissiveIntensity: 0.22, roughness: 0.3 }));

      // Palm trees are spaced along the median, with two-sided lantern poles in between.
      for (let i = 0; i < 15; i++) {
        const palm = new THREE.Group();
        const trunk = new THREE.Mesh(track(new THREE.CylinderGeometry(0.22, 0.38, 6.6, 8)), palmTrunkMat);
        trunk.position.y = 3.3;
        trunk.rotation.z = -0.035;
        palm.add(trunk);
        for (let leaf = 0; leaf < 9; leaf++) {
          const angle = (leaf / 9) * Math.PI * 2;
          const frond = new THREE.Mesh(track(new THREE.SphereGeometry(1, 8, 6)), palmLeafMat);
          frond.scale.set(0.25, 1.85, 0.42);
          frond.position.set(Math.sin(angle) * 0.9, 6.15, Math.cos(angle) * 0.9);
          frond.rotation.z = 1.05;
          frond.rotation.y = angle;
          palm.add(frond);
        }
        palm.position.set(pos.x - rw * 0.46 + i * (rw * 0.92 / 14), yOff, pos.z);
        exteriorRoot.add(palm);
      }

      for (let i = 0; i < 8; i++) {
        const lamp = new THREE.Group();
        const pole = new THREE.Mesh(track(new THREE.CylinderGeometry(0.12, 0.2, 7.2, 8)), lampPoleMat);
        pole.position.y = 3.6;
        const crossArm = new THREE.Mesh(track(new THREE.BoxGeometry(3.3, 0.12, 0.12)), lampPoleMat);
        crossArm.position.set(0, 7.0, 0);
        lamp.add(pole, crossArm);
        for (const side of [-1, 1]) {
          const lampHead = new THREE.Mesh(track(new THREE.BoxGeometry(0.85, 0.22, 0.42)), lampGlowMat);
          lampHead.position.set(side * 1.4, 6.82, 0);
          lamp.add(lampHead);
        }
        lamp.position.set(pos.x - rw * 0.43 + i * (rw * 0.86 / 7), yOff, pos.z);
        exteriorRoot.add(lamp);
      }
    }
  });

  [
    [2400, 888],
    [2400, 1408],
    [2935, 1408],
    [1930, 1408],
    [875, 888],
  ].forEach(([cx, cy]) => {
    const cp = world2DTo3D(cx, cy);
    for (let s = -3; s <= 3; s++) {
      const st = new THREE.Mesh(track(new THREE.BoxGeometry(0.65, 0.11, 4.4)), dashMat);
      st.position.set(cp.x + s * 1.35, 0.06, cp.z);
      exteriorRoot.add(st);
    }
  });

  // 5. Recognisable Alexandria landmarks — built as original low-poly 3D scenery.
  const addLandmarkBox = (wx: number, wy: number, width: number, height: number, depth: number, color: number, baseY = 0) => {
    const p = world2DTo3D(wx, wy);
    const mesh = new THREE.Mesh(track(new THREE.BoxGeometry(width, height, depth)), track(new THREE.MeshStandardMaterial({ color, roughness: 0.82 })));
    mesh.position.set(p.x, baseY + height / 2, p.z);
    mesh.castShadow = !isSoftwareGl;
    mesh.receiveShadow = true;
    exteriorRoot.add(mesh);
    return mesh;
  };
  const addWorldLabel = (label: string, wx: number, wy: number, color = '#1F2937') => {
    const p = world2DTo3D(wx, wy);
    const sign = createArabicLabelSprite(label, { bg: 'rgba(250,248,240,0.94)', border: '#A68D6D', textColor: color, scaleX: 8.4, scaleY: 1.65 });
    sign.position.set(p.x, 12.5, p.z);
    exteriorRoot.add(sign);
  };

  // Qaitbay Citadel: square limestone fortress, corner towers and crenellations.
  const qaitbay = new THREE.Group();
  const qaitbayPos = world2DTo3D(500, 440);
  qaitbay.position.set(qaitbayPos.x, 0, qaitbayPos.z);
  const fortStone = track(new THREE.MeshStandardMaterial({ color: 0xC7B697, roughness: 0.95 }));
  const fortTrim = track(new THREE.MeshStandardMaterial({ color: 0x9B896B, roughness: 0.9 }));
  const fortBase = new THREE.Mesh(track(new THREE.BoxGeometry(25, 7, 23)), fortStone);
  fortBase.position.y = 3.5;
  qaitbay.add(fortBase);
  const fortKeep = new THREE.Mesh(track(new THREE.BoxGeometry(12, 11, 12)), fortStone);
  fortKeep.position.y = 12.5;
  qaitbay.add(fortKeep);
  for (const [x,z] of [[-10,-9],[10,-9],[-10,9],[10,9]]) {
    const tower = new THREE.Mesh(track(new THREE.CylinderGeometry(2.6,2.9,12,10)), fortStone);
    tower.position.set(x,9,z);
    qaitbay.add(tower);
    const roof = new THREE.Mesh(track(new THREE.ConeGeometry(2.6,3.0,10)), fortTrim);
    roof.position.set(x,16.2,z);
    qaitbay.add(roof);
  }
  for (let x=-11; x<=11; x+=2.1) {
    const merlon = new THREE.Mesh(track(new THREE.BoxGeometry(0.95,1.35,1.0)), fortTrim);
    merlon.position.set(x,7.3,11.3); qaitbay.add(merlon);
  }
  qaitbay.position.y = 0;
  exteriorRoot.add(qaitbay);
  addWorldLabel('قلعة قايتباي · بحري', 500, 395, '#5D4733');

  // Mansheya Square and the Unknown Soldier memorial column.
  const squarePos = world2DTo3D(1240, 1050);
  const square = new THREE.Mesh(track(new THREE.BoxGeometry(28,0.16,21)), track(new THREE.MeshStandardMaterial({ color:0xB9B5A8, roughness:0.88 })));
  square.position.set(squarePos.x,0.08,squarePos.z); exteriorRoot.add(square);
  addLandmarkBox(1240,1050,1.6,7.5,1.6,0x8E8B80);
  const memorialTop = new THREE.Mesh(track(new THREE.SphereGeometry(1.4,12,10)), track(new THREE.MeshStandardMaterial({ color:0x9B9586, roughness:0.88 })));
  memorialTop.position.set(squarePos.x,8.3,squarePos.z); exteriorRoot.add(memorialTop);
  addWorldLabel('ميدان المنشية · الجندي المجهول',1240,1000);

  // Bibliotheca Alexandrina: circular, inclined disc with etched roof rings.
  const libraryPos = world2DTo3D(2070, 1050);
  const library = new THREE.Group();
  library.position.set(libraryPos.x,0,libraryPos.z);
  const libBody = new THREE.Mesh(track(new THREE.CylinderGeometry(10.5,17.5,9.4,48,1,false)), track(new THREE.MeshStandardMaterial({ color:0xB9B4A8, roughness:0.55, metalness:0.08 })));
  libBody.rotation.z = -0.17; libBody.position.y=5.2; library.add(libBody);
  const libRoof = new THREE.Mesh(track(new THREE.CylinderGeometry(10.1,17.0,0.5,48)), track(new THREE.MeshStandardMaterial({ color:0x8C9697, roughness:0.7 })));
  libRoof.rotation.z=-0.17; libRoof.position.y=10.0; library.add(libRoof);
  for (let i=0;i<20;i++) {
    const etch = new THREE.Mesh(track(new THREE.BoxGeometry(0.14,0.08,24)), track(new THREE.MeshStandardMaterial({ color:0x707D7D, roughness:0.8 })));
    etch.position.set(-9.5+i*1.0,10.32,0); etch.rotation.z=-0.17; library.add(etch);
  }
  exteriorRoot.add(library);
  addWorldLabel('مكتبة الإسكندرية · الشاطبي',2070,990);

  // Stanley Bridge with four small royal-style towers crossing the coastal inlet.
  const bridgePos = world2DTo3D(3010, 430);
  const bridgeDeck = new THREE.Mesh(track(new THREE.BoxGeometry(53,1.2,5.2)), track(new THREE.MeshStandardMaterial({ color:0xD5D1C6, roughness:0.72 })));
  bridgeDeck.position.set(bridgePos.x,5.2,bridgePos.z); exteriorRoot.add(bridgeDeck);
  const archGeo = track(new THREE.CylinderGeometry(0.32,0.32,53,12));
  const bridgePillarMat = track(new THREE.MeshStandardMaterial({ color:0xD8D1BF, roughness:0.78 }));
  for (const xOff of [-21,-7,7,21]) {
    const pillar = new THREE.Mesh(track(new THREE.BoxGeometry(1.3,8,1.3)), bridgePillarMat);
    pillar.position.set(bridgePos.x+xOff,9.6,bridgePos.z); exteriorRoot.add(pillar);
    const cap = new THREE.Mesh(track(new THREE.ConeGeometry(1.25,1.5,4)), track(new THREE.MeshStandardMaterial({ color:0xBCA77F, roughness:0.7 })));
    cap.position.set(bridgePos.x+xOff,14.2,bridgePos.z); exteriorRoot.add(cap);
  }
  const arch = new THREE.Mesh(archGeo,bridgePillarMat); arch.position.set(bridgePos.x,7.8,bridgePos.z-0.4); arch.rotation.z=Math.PI/2; exteriorRoot.add(arch);
  addWorldLabel('كوبري ستانلي · جليم',3010,385);

  // Montaza palace garden gate and coastal park markers.
  const montazaPos = world2DTo3D(4380, 2760);
  const gateMat = track(new THREE.MeshStandardMaterial({ color:0xD6C5A4, roughness:0.8 }));
  const gate = new THREE.Group();
  gate.position.set(montazaPos.x,0,montazaPos.z);
  const gateTop = new THREE.Mesh(track(new THREE.BoxGeometry(24,1.5,1.4)),gateMat); gateTop.position.y=8; gate.add(gateTop);
  for (const xo of [-10,-3.3,3.3,10]) {
    const column = new THREE.Mesh(track(new THREE.CylinderGeometry(0.65,0.85,8,12)),gateMat); column.position.set(xo,4,0); gate.add(column);
    const cap = new THREE.Mesh(track(new THREE.BoxGeometry(1.8,0.7,1.8)),gateMat); cap.position.set(xo,8.3,0); gate.add(cap);
  }
  exteriorRoot.add(gate);
  addWorldLabel('حدائق وقصور المنتزه',4380,2710);

  // San Stefano's paired high-rise towers are also emphasised above the city blocks.
  [ -9, 9 ].forEach((offset, i) => {
    const p = world2DTo3D(3635, 1050);
    const tower = new THREE.Mesh(track(new THREE.BoxGeometry(8.5,34-i*2,8.5)), track(new THREE.MeshStandardMaterial({ color:0xB6C8CC, roughness:0.32, metalness:0.12 })));
    tower.position.set(p.x+offset,17-i,p.z);
    exteriorRoot.add(tower);
    for (let floor=0; floor<12; floor++) {
      const balcony = new THREE.Mesh(track(new THREE.BoxGeometry(8.7,0.18,8.7)), track(new THREE.MeshStandardMaterial({ color:0x87999D, roughness:0.45 })));
      balcony.position.set(p.x+offset,2.8+floor*2.55,p.z); exteriorRoot.add(balcony);
    }
  });
  addWorldLabel('سان ستيفانو · سيدي بشر',3635,990);

  // Road vehicles: black/yellow taxis, blue-striped white microbuses and parked cars.
  const addCityCar = (wx: number, wy: number, bodyColor: number, stripeColor?: number, rotation = 0) => {
    const group = new THREE.Group();
    const bodyMat = track(new THREE.MeshStandardMaterial({ color:bodyColor, roughness:0.42, metalness:0.16 }));
    const glassMat = track(new THREE.MeshStandardMaterial({ color:0x25485A, roughness:0.18, metalness:0.25, transparent:true, opacity:0.78 }));
    const tireMat = track(new THREE.MeshStandardMaterial({ color:0x171B20, roughness:0.92 }));
    const body = new THREE.Mesh(track(new THREE.BoxGeometry(2.35,0.75,4.9)),bodyMat); body.position.y=0.78; group.add(body);
    const cabin = new THREE.Mesh(track(new THREE.BoxGeometry(1.9,0.95,2.3)),bodyMat); cabin.position.set(0,1.55,-0.2); group.add(cabin);
    const glass = new THREE.Mesh(track(new THREE.BoxGeometry(1.76,0.68,2.12)),glassMat); glass.position.set(0,1.56,-0.16); group.add(glass);
    if (stripeColor !== undefined) {
      const stripe = new THREE.Mesh(track(new THREE.BoxGeometry(2.38,0.18,4.85)),track(new THREE.MeshStandardMaterial({ color:stripeColor, roughness:0.5 })));
      stripe.position.y=0.99; group.add(stripe);
    }
    for (const x of [-1.15,1.15]) for (const z of [-1.55,1.55]) {
      const wheel = new THREE.Mesh(track(new THREE.CylinderGeometry(0.48,0.48,0.28,12)),tireMat);
      wheel.rotation.z=Math.PI/2; wheel.position.set(x,0.5,z); group.add(wheel);
    }
    const p=world2DTo3D(wx,wy); group.position.set(p.x,0,p.z); group.rotation.y=rotation;
    exteriorRoot.add(group);
  };
  addCityCar(890,620,0x15191E,0xE1B62B,0);
  addCityCar(1790,620,0xF5F1E7,0x266FA0,0);
  addCityCar(2510,620,0x20252B,0xE2B52A,0);
  addCityCar(3920,620,0xF2F0E8,0x2C78A8,0);
  addCityCar(1220,1570,0xD7D8D4,0x336A8C,Math.PI/2);
  addCityCar(2280,2190,0x39464D,undefined,Math.PI/2);
  addCityCar(3350,1570,0xF4F0E4,0x246C9B,Math.PI/2);
  addCityCar(4210,2310,0x1B2024,0xE1B62B,Math.PI/2);

  // Tram tracks and a blue/yellow two-carriage Raml tram.
  const tramCenter = world2DTo3D(1515,2200);
  const railMat = track(new THREE.MeshStandardMaterial({ color:0x545D63, metalness:0.7, roughness:0.35 }));
  for (const offset of [-0.85,0.85]) {
    const rail = new THREE.Mesh(track(new THREE.BoxGeometry(0.16,0.14,206)),railMat);
    rail.position.set(tramCenter.x+offset,0.1,tramCenter.z); exteriorRoot.add(rail);
  }
  const sleeperMat = track(new THREE.MeshStandardMaterial({ color:0x756B5D, roughness:0.9 }));
  for (let i=0;i<60;i++) {
    const sleeper = new THREE.Mesh(track(new THREE.BoxGeometry(2.5,0.13,0.5)),sleeperMat);
    sleeper.position.set(tramCenter.x,0.04,tramCenter.z-101+i*3.4); exteriorRoot.add(sleeper);
  }
  const tramBodyMat = track(new THREE.MeshStandardMaterial({ color:0xF2C84B, roughness:0.5 }));
  const tramGlassMat = track(new THREE.MeshStandardMaterial({ color:0x25485A, roughness:0.18, metalness:0.25, transparent:true, opacity:0.78 }));
  const tramBlueMat = track(new THREE.MeshStandardMaterial({ color:0x1E5E86, roughness:0.45 }));
  for (let car=0;car<2;car++) {
    const tram = new THREE.Group();
    // Two stacked passenger decks evoke the historic double-decker Raml tram.
    const base = new THREE.Mesh(track(new THREE.BoxGeometry(3.0,3.25,8.2)),tramBodyMat); base.position.y=1.78; tram.add(base);
    const blueBand = new THREE.Mesh(track(new THREE.BoxGeometry(3.05,0.46,8.25)),tramBlueMat); blueBand.position.y=1.55; tram.add(blueBand);
    for (let wi=0;wi<5;wi++) {
      for (const side of [-1,1]) {
        for (const deckY of [0.95,2.42]) {
          const window = new THREE.Mesh(track(new THREE.BoxGeometry(0.09,0.72,0.95)),tramGlassMat);
          window.position.set(side*1.53,deckY,-3.2+wi*1.55); tram.add(window);
        }
      }
    }
    tram.position.set(tramCenter.x,0,tramCenter.z-4.4+car*9.2);
    tram.rotation.y=Math.PI/2;
    exteriorRoot.add(tram);
  }
  addWorldLabel('خط ترام الرمل',1515,2110);

  // Small pavement kiosks and food carts.
  const addVendorCart = (wx:number,wy:number,accent:number) => {
    const p=world2DTo3D(wx,wy); const cart=new THREE.Group();
    const wood=track(new THREE.MeshStandardMaterial({ color:0x8B5E3C, roughness:0.85 }));
    const cartWheelMat=track(new THREE.MeshStandardMaterial({ color:0x171B20, roughness:0.92 }));
    const top=track(new THREE.MeshStandardMaterial({ color:accent, roughness:0.6 }));
    const base=new THREE.Mesh(track(new THREE.BoxGeometry(2.7,1.25,1.65)),wood); base.position.y=0.85; cart.add(base);
    const canopy=new THREE.Mesh(track(new THREE.BoxGeometry(3.2,0.2,2.0)),top); canopy.position.y=1.9; cart.add(canopy);
    for (const x of [-1,1]) { const wheel=new THREE.Mesh(track(new THREE.CylinderGeometry(0.38,0.38,0.16,12)),cartWheelMat); wheel.rotation.z=Math.PI/2; wheel.position.set(x,0.42,0.6); cart.add(wheel); }
    cart.position.set(p.x,0,p.z); exteriorRoot.add(cart);
  };
  addVendorCart(1090,990,0xE0B849);
  addVendorCart(2820,950,0xE87C52);
  addVendorCart(4110,1850,0x68A8C2);
  addVendorCart(650,2320,0xB94B3F);

  // 5. Low garden flower beds kept inside the Montaza park area.
  const flowerCount = 48;
  const bushGeo = track(new THREE.DodecahedronGeometry(0.55, 1));
  const bushMat = track(new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.82 }));
  const bloomGeo = track(new THREE.DodecahedronGeometry(0.28, 0));
  const bloomMat = track(new THREE.MeshStandardMaterial({ roughness: 0.55 }));

  const bushes = new THREE.InstancedMesh(bushGeo, bushMat, flowerCount);
  const blooms = new THREE.InstancedMesh(bloomGeo, bloomMat, flowerCount);
  const dummy = new THREE.Object3D();
  const bloomColors = [
    new THREE.Color(0xe8d9b7),
    new THREE.Color(0xd9c28e),
    new THREE.Color(0xd9a7a5),
    new THREE.Color(0xc8d4c0),
  ];

  for (let i = 0; i < flowerCount; i++) {
    const wx = 3900 + (i % 8) * 92;
    const wy = 2700 + Math.floor(i / 8) * 34;
    const p = world2DTo3D(wx, wy);
    const s = 0.85 + (i % 3) * 0.22;

    dummy.position.set(p.x, 0.35, p.z);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    bushes.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, 0.78, p.z);
    dummy.scale.setScalar(s * 0.95);
    dummy.updateMatrix();
    blooms.setMatrixAt(i, dummy.matrix);
    blooms.setColorAt(i, bloomColors[i % bloomColors.length]);
  }
  bushes.computeBoundingSphere();
  blooms.computeBoundingSphere();
  exteriorRoot.add(bushes, blooms);

  // 6. Golden Street Lamps
  const lampPostGeo = track(new THREE.CylinderGeometry(0.12, 0.17, 4.4, 8));
  const lampPostMat = track(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 }),
  );
  const lampBulbGeo = track(new THREE.SphereGeometry(0.38, 10, 10));
  const lampBulbMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 0.82,
    }),
  );

  [
    [1200, 665],
    [2900, 665],
    [3580, 665],
    [1200, 1385],
    [2900, 1385],
    [3580, 1385],
    [1200, 2105],
    [2900, 2105],
    [2240, 960],
    [2560, 960],
  ].forEach(([lx, ly]) => {
    const p = world2DTo3D(lx, ly);
    const post = new THREE.Mesh(lampPostGeo, lampPostMat);
    post.position.set(p.x, 2.2, p.z);
    const bulb = new THREE.Mesh(lampBulbGeo, lampBulbMat);
    bulb.position.set(p.x, 4.55, p.z);
    exteriorRoot.add(post, bulb);
  });

  // 7. 16 Multi-Part Buildings with Doors & Glowing Portals
  const windowGlassMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      emissive: 0x7dd3fc,
      emissiveIntensity: 0.25,
      roughness: 0.15,
    }),
  );
  const portalMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    }),
  );

  for (const b of WORLD_BUILDINGS) {
    const pos = world2DTo3D(b.x + b.w / 2, b.y + b.h / 2);
    const bw = size2DTo3D(b.w);
    const bd = size2DTo3D(b.h);
    const bh = b.height ?? (
      b.kind === 'palace' ? 13.0 : b.kind === 'observatory' ? 10.6 : b.kind === 'flower_stand' ? 4.8 : b.hasSecondFloor ? 9.6 : 7.4
    );

    const bGroup = new THREE.Group();
    bGroup.position.set(pos.x, 0, pos.z);

    const wallMat = track(new THREE.MeshStandardMaterial({ color: b.wallColor, roughness: 0.7 }));
    const roofMat = track(new THREE.MeshStandardMaterial({ color: b.roofColor, roughness: 0.42 }));
    const trimMat = track(
      new THREE.MeshStandardMaterial({ color: b.trimColor, roughness: 0.3, metalness: 0.38 }),
    );

    const walls = new THREE.Mesh(track(new THREE.BoxGeometry(bw, bh, bd)), wallMat);
    walls.position.y = bh / 2;
    walls.castShadow = !isSoftwareGl;
    walls.receiveShadow = true;
    bGroup.add(walls);

    const cornice = new THREE.Mesh(track(new THREE.BoxGeometry(bw + 0.9, 0.55, bd + 0.9)), trimMat);
    cornice.position.y = bh + 0.2;
    const roof = new THREE.Mesh(track(new THREE.BoxGeometry(bw + 1.4, 1.35, bd + 1.4)), roofMat);
    roof.position.y = bh + 0.98;
    roof.castShadow = !isSoftwareGl;
    bGroup.add(cornice, roof);

    const door = new THREE.Mesh(
      track(new THREE.BoxGeometry(b.kind === 'palace' ? 4.8 : 2.8, 4.1, 0.42)),
      track(new THREE.MeshStandardMaterial({ color: b.kind === 'palace' ? 0x9f1239 : 0x78350f })),
    );
    door.position.set(0, 2.05, bd / 2 + 0.12);
    bGroup.add(door);

    if (b.enterable) {
      const matGlow = new THREE.Mesh(track(new THREE.RingGeometry(1.15, 1.75, 24)), portalMat);
      matGlow.rotation.x = -Math.PI / 2;
      matGlow.position.set(0, 0.08, bd / 2 + 1.9);
      bGroup.add(matGlow);
    }

    const winCount = b.kind === 'palace' ? 4 : 2;
    const floors = Math.max(2, Math.floor(bh / 3.2));
    const windowsPerFloor = Math.max(2, Math.min(7, Math.floor(bw / 3.6)));
    for (let floor = 0; floor < floors; floor++) {
      for (let wi = 0; wi < windowsPerFloor; wi++) {
        const wx = -bw / 2 + ((wi + 0.5) * bw) / windowsPerFloor;
        const wy = 1.9 + floor * 3.0;
        const winFrame = new THREE.Mesh(track(new THREE.BoxGeometry(1.25, 1.65, 0.24)), trimMat);
        winFrame.position.set(wx, wy, bd / 2 + 0.08);
        const winGlass = new THREE.Mesh(track(new THREE.BoxGeometry(0.98, 1.38, 0.27)), windowGlassMat);
        winGlass.position.set(wx, wy, bd / 2 + 0.1);
        bGroup.add(winFrame, winGlass);
        // Thin iron balcony rails evoke the old European façades in the centre.
        if (bh < 20 && b.kind !== 'palace') {
          const rail = new THREE.Mesh(track(new THREE.BoxGeometry(1.55,0.1,0.48)),trimMat);
          rail.position.set(wx,wy-0.95,bd/2+0.42); bGroup.add(rail);
        }
      }
    }

    if (b.kind === 'palace') {
      const towerOffsets = [
        [-bw / 2 + 1.6, -bd / 2 + 1.6],
        [bw / 2 - 1.6, -bd / 2 + 1.6],
        [-bw / 2 + 1.6, bd / 2 - 1.6],
        [bw / 2 - 1.6, bd / 2 - 1.6],
      ];
      for (const [tx, tz] of towerOffsets) {
        const tower = new THREE.Mesh(
          track(new THREE.CylinderGeometry(1.85, 2.1, bh + 3.8, 14)),
          wallMat,
        );
        tower.position.set(tx, (bh + 3.8) / 2, tz);
        const spire = new THREE.Mesh(track(new THREE.ConeGeometry(2.3, 4.4, 14)), trimMat);
        spire.position.set(tx, bh + 5.7, tz);
        bGroup.add(tower, spire);
      }
      const centerDome = new THREE.Mesh(
        track(new THREE.SphereGeometry(5.5, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2)),
        trimMat,
      );
      centerDome.position.set(0, bh + 1.5, 0);
      bGroup.add(centerDome);
    } else if (b.kind === 'cafe' || b.kind === 'bakery' || b.kind === 'pet_shop' || b.kind === 'salon') {
      for (let ai = 0; ai < 6; ai++) {
        const aw = new THREE.Mesh(
          track(new THREE.BoxGeometry(bw / 6, 0.25, 2.2)),
          track(
            new THREE.MeshStandardMaterial({
              color: ai % 2 === 0 ? 0xffffff : b.roofColor,
              roughness: 0.6,
            }),
          ),
        );
        aw.position.set(-bw / 2 + (ai + 0.5) * (bw / 6), 4.7, bd / 2 + 1.0);
        aw.rotation.x = 0.25;
        bGroup.add(aw);
      }
    } else if (b.kind === 'observatory') {
      const obsDome = new THREE.Mesh(
        track(new THREE.SphereGeometry(4.4, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2)),
        trimMat,
      );
      obsDome.position.set(0, bh + 1.5, 0);
      bGroup.add(obsDome);
    }

    const sign = createArabicLabelSprite(b.name, {
      bg: 'rgba(255, 255, 255, 0.94)',
      border: '#A68D6D',
      textColor: '#374151',
      scaleX: 8.2,
      scaleY: 1.85,
    });
    sign.position.set(0, bh + (b.kind === 'palace' ? 8.8 : 4.2), 0);
    bGroup.add(sign);

    exteriorRoot.add(bGroup);
  }

  // 8. Fountains
  const fountainWaterMeshes: THREE.Mesh[] = [];
  for (const f of WORLD_FOUNTAINS) {
    const fPos = world2DTo3D(f.x, f.y);
    const fr = size2DTo3D(f.radius);

    const basin = new THREE.Mesh(
      track(new THREE.CylinderGeometry(fr, fr + 0.4, 1.1, 24)),
      track(new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 })),
    );
    basin.position.set(fPos.x, 0.55, fPos.z);
    exteriorRoot.add(basin);

    const water = new THREE.Mesh(
      track(new THREE.CylinderGeometry(fr - 0.5, fr - 0.5, 0.9, 24)),
      track(new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15 })),
    );
    water.position.set(fPos.x, 0.72, fPos.z);
    exteriorRoot.add(water);
    fountainWaterMeshes.push(water);

    const spire = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.45, 0.85, 2.5, 12)),
      track(new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 })),
    );
    spire.position.set(fPos.x, 1.6, fPos.z);
    exteriorRoot.add(spire);
  }

  // 9. Stylized Trees
  const trunkGeo = track(new THREE.CylinderGeometry(0.44, 0.76, 3.8, 8));
  const trunkMat = track(new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }));
  const puffGeo = track(new THREE.IcosahedronGeometry(2.15, 1));
  const puffMat = track(new THREE.MeshStandardMaterial({ roughness: 0.72, flatShading: true }));

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, WORLD_TREES.length);
  const puffs = new THREE.InstancedMesh(puffGeo, puffMat, WORLD_TREES.length * 3);
  puffs.castShadow = !isSoftwareGl;

  const sakuraPalette = [new THREE.Color(0xf9a8d4), new THREE.Color(0xfbcfe8), new THREE.Color(0xf472b6)];
  const emeraldPalette = [new THREE.Color(0x10b981), new THREE.Color(0x34d399), new THREE.Color(0x059669)];
  const cypressPalette = [new THREE.Color(0x059669), new THREE.Color(0x10b981), new THREE.Color(0x047857)];

  WORLD_TREES.forEach((t, i) => {
    const pos = world2DTo3D(t.x, t.y);
    const s = size2DTo3D(t.radius) / 2.6;

    dummy.position.set(pos.x, 1.9, pos.z);
    dummy.scale.set(s * 0.85, 1, s * 0.85);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);

    const palette =
      t.kind === 'sakura' ? sakuraPalette : t.kind === 'cypress' ? cypressPalette : emeraldPalette;

    const clusterOffsets =
      t.kind === 'cypress'
        ? [
            [0, 3.9, 0, 1.05],
            [0, 5.5, 0, 0.82],
            [0, 6.8, 0, 0.56],
          ]
        : [
            [-1.15 * s, 4.2, 0.65 * s, 0.92],
            [1.15 * s, 4.3, -0.55 * s, 0.9],
            [0, 5.3, 0, 1.15],
          ];

    clusterOffsets.forEach(([ox, oy, oz, cScale], ci) => {
      const idx = i * 3 + ci;
      dummy.position.set(pos.x + ox, oy, pos.z + oz);
      dummy.scale.setScalar(s * cScale);
      dummy.updateMatrix();
      puffs.setMatrixAt(idx, dummy.matrix);
      puffs.setColorAt(idx, palette[ci % palette.length]);
    });
  });
  trunks.computeBoundingSphere();
  puffs.computeBoundingSphere();
  exteriorRoot.add(trunks, puffs);

  // 10. Roaming Stray Street Cats (Pick up & carry only!)
  const streetCatRigs: StreetCatRig3D[] = STREET_CATS.map((def, idx) => {
    const rig = buildCuteCatMesh3D(def.furColor, null, def.earInnerColor);
    const label = createArabicLabelSprite(`🐱 ${def.name}`, {
      bg: 'rgba(255, 255, 255, 0.92)',
      border: '#FDBA74',
      textColor: '#9A3412',
      scaleX: 3.1,
      scaleY: 0.72,
    });
    label.position.set(0, 1.5, 0);
    rig.root.add(label);

    const startP = world2DTo3D(def.homeX, def.homeY);
    rig.root.position.set(startP.x, 0, startP.z);
    exteriorRoot.add(rig.root);

    return {
      def,
      rig,
      phase: idx * 1.1,
      pickedUp: false,
    };
  });

  // 11. 36 Collectible Rotating Golden Coins
  const coinGeo = track(new THREE.CylinderGeometry(0.6, 0.6, 0.16, 16));
  const coinMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.8,
      roughness: 0.18,
      emissive: 0xca8a04,
      emissiveIntensity: 0.25,
    }),
  );
  const coinMeshes: CoinMesh3D[] = WORLD_COINS.map((c) => {
    const p = world2DTo3D(c.x, c.y);
    const g = new THREE.Group();
    const disc = new THREE.Mesh(coinGeo, coinMat);
    disc.rotation.x = Math.PI / 2;
    g.add(disc);
    g.position.set(p.x, 1.15, p.z);
    exteriorRoot.add(g);
    return {
      id: c.id,
      wx: c.x,
      wy: c.y,
      mesh: g,
      collected: false,
      respawnTimer: 0,
    };
  });

  // 12. Glowing Golden Quest Beacon Pillar
  const beaconGroup = new THREE.Group();
  const beaconBeam = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.95, 1.4, 24, 16, 1, true)),
    track(
      new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    ),
  );
  beaconBeam.position.y = 12;
  const beaconRing = new THREE.Mesh(
    track(new THREE.TorusGeometry(2.0, 0.14, 8, 28)),
    track(new THREE.MeshBasicMaterial({ color: 0xfde047 })),
  );
  beaconRing.rotation.x = Math.PI / 2;
  beaconRing.position.y = 0.25;
  beaconGroup.add(beaconBeam, beaconRing);
  exteriorRoot.add(beaconGroup);

  return {
    exteriorRoot,
    fountainWaterMeshes,
    beaconGroup,
    coinMeshes,
    streetCatRigs,
    clouds,
    cleanup: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
