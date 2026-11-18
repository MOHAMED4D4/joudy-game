'use client';

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export interface StudioRendererBundle {
  renderer: THREE.WebGLRenderer;
  isSoftwareGl: boolean;
  envMap: THREE.Texture;
  dispose: () => void;
}

export function createStudioRenderer(
  container: HTMLElement,
  options: { alpha?: boolean; shadows?: boolean } = {},
): StudioRendererBundle {
  const isSoftwareGl = detectSoftwareWebGL();
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    alpha: options.alpha ?? false,
    powerPreference: 'high-performance',
  });

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(
    Math.max(1, container.clientWidth),
    Math.max(1, container.clientHeight),
  );

  if (options.shadows !== false) {
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
  const envMap = envRT.texture;
  roomEnv.dispose();
  pmremGenerator.dispose();

  container.appendChild(renderer.domElement);

  const dispose = () => {
    envRT.dispose();
    envMap.dispose();
    renderer.dispose();
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
  };

  return { renderer, isSoftwareGl, envMap, dispose };
}

export function scheduleSoftwareFrame(
  renderer: THREE.WebGLRenderer,
  cb: () => void,
  registerTimer: (id: number) => void,
) {
  try {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    if (gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          registerTimer(window.setTimeout(poll, 5));
        } else {
          if (sync) gl.deleteSync(sync);
          registerTimer(window.setTimeout(cb, 80));
        }
      };
      registerTimer(window.setTimeout(poll, 5));
      return;
    }
  } catch {
    // Fallback below
  }
  registerTimer(window.setTimeout(cb, 80));
}

export type JoudyFaceMood = 'normal' | 'blink' | 'happy_hearts' | 'happy_stars' | 'hurt';

export interface DynamicJoudyFace {
  texture: THREE.CanvasTexture;
  setMood: (mood: JoudyFaceMood) => void;
  dispose: () => void;
}

function paintJoudyFace(ctx: CanvasRenderingContext2D, mood: JoudyFaceMood) {
  ctx.clearRect(0, 0, 512, 512);

  // Warm fair-peach skin tone matching Joudy's portrait
  ctx.fillStyle = '#FCE1D2';
  ctx.fillRect(0, 0, 512, 512);

  const faceGrad = ctx.createRadialGradient(256, 256, 40, 256, 256, 240);
  faceGrad.addColorStop(0, '#FFE9DC');
  faceGrad.addColorStop(1, '#F2C7B4');
  ctx.fillStyle = faceGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Soft rosy anime blush cheeks (brighter when happy)
  const blushAlpha = mood === 'happy_hearts' || mood === 'happy_stars' ? 0.78 : 0.55;
  const drawBlush = (cx: number, cy: number) => {
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 46);
    g.addColorStop(0, `rgba(244, 114, 138, ${blushAlpha})`);
    g.addColorStop(1, 'rgba(244, 114, 138, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 46, 0, Math.PI * 2);
    ctx.fill();
  };
  drawBlush(170, 294);
  drawBlush(342, 294);

  const drawNormalEye = (cx: number, cy: number, flip: number) => {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 36, 0, 0, Math.PI * 2);
    ctx.fill();

    const irisGrad = ctx.createLinearGradient(0, -28, 0, 28);
    irisGrad.addColorStop(0, '#4E6659');
    irisGrad.addColorStop(0.55, '#789485');
    irisGrad.addColorStop(1, '#A5BEB0');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(0, 2, 23, 27, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1E2924';
    ctx.beginPath();
    ctx.ellipse(0, 3, 11, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-8 * flip, -10, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7 * flip, 10, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2B1B17';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 4, 34, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();

    ctx.strokeStyle = '#6B3E2E';
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(-26, -46);
    ctx.quadraticCurveTo(0, -56, 26, -44);
    ctx.stroke();

    ctx.restore();
  };

  const drawBlinkEye = (cx: number, cy: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#2B1B17';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 12, 30, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    ctx.strokeStyle = '#6B3E2E';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-24, -36);
    ctx.quadraticCurveTo(0, -44, 24, -36);
    ctx.stroke();
    ctx.restore();
  };

  const drawHeartEye = (cx: number, cy: number) => {
    ctx.save();
    ctx.translate(cx, cy + 4);
    ctx.fillStyle = '#F43F5E';
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.bezierCurveTo(-34, -4, -32, -32, 0, -14);
    ctx.bezierCurveTo(32, -32, 34, -4, 0, 22);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-11, -12, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#6B3E2E';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-24, -46);
    ctx.quadraticCurveTo(0, -58, 24, -46);
    ctx.stroke();
    ctx.restore();
  };

  const drawStarEye = (cx: number, cy: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#F59E0B';
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 30 : 13;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-6, -7, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#6B3E2E';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-24, -46);
    ctx.quadraticCurveTo(0, -58, 24, -46);
    ctx.stroke();
    ctx.restore();
  };

  const drawHurtEye = (cx: number, cy: number, side: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 8.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Cute squeezed > < anime hurt eyes
    ctx.beginPath();
    if (side < 0) {
      ctx.moveTo(-20, -18);
      ctx.lineTo(18, 0);
      ctx.lineTo(-20, 18);
    } else {
      ctx.moveTo(20, -18);
      ctx.lineTo(-18, 0);
      ctx.lineTo(20, 18);
    }
    ctx.stroke();

    // Furrowed shocked eyebrow
    ctx.strokeStyle = '#6B3E2E';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-24, -38 + side * 6);
    ctx.lineTo(24, -44 - side * 6);
    ctx.stroke();
    ctx.restore();
  };

  if (mood === 'blink') {
    drawBlinkEye(196, 244);
    drawBlinkEye(316, 244);
  } else if (mood === 'happy_hearts') {
    drawHeartEye(196, 244);
    drawHeartEye(316, 244);
  } else if (mood === 'happy_stars') {
    drawStarEye(196, 244);
    drawStarEye(316, 244);
  } else if (mood === 'hurt') {
    drawHurtEye(196, 246, -1);
    drawHurtEye(316, 246, 1);
  } else {
    drawNormalEye(196, 244, 1);
    drawNormalEye(316, 244, 1);
  }

  // Cute tiny nose shadow
  ctx.fillStyle = 'rgba(205, 140, 120, 0.65)';
  ctx.beginPath();
  ctx.arc(256, 282, 4, 0, Math.PI * 2);
  ctx.fill();

  // Expressive Mouth
  if (mood === 'happy_hearts' || mood === 'happy_stars') {
    // Wide cheerful open anime smile
    ctx.fillStyle = '#D94662';
    ctx.beginPath();
    ctx.moveTo(226, 310);
    ctx.quadraticCurveTo(256, 356, 286, 310);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.ellipse(256, 329, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (mood === 'hurt') {
    // Wavy dizzy/shocked anime mouth + anime sweat drop
    ctx.strokeStyle = '#7F1D1D';
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(228, 322);
    ctx.quadraticCurveTo(242, 310, 256, 322);
    ctx.quadraticCurveTo(270, 334, 284, 322);
    ctx.stroke();

    // Cute anime sweat drop on forehead temple
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(356, 174);
    ctx.quadraticCurveTo(372, 198, 356, 210);
    ctx.quadraticCurveTo(340, 198, 356, 174);
    ctx.fill();
  } else {
    // Sweet natural rose-pink smile
    ctx.fillStyle = '#D96B78';
    ctx.beginPath();
    ctx.moveTo(234, 316);
    ctx.quadraticCurveTo(256, 338, 278, 316);
    ctx.quadraticCurveTo(256, 326, 234, 316);
    ctx.fill();
  }
}

export function createDynamicJoudyFaceTexture(maxAnisotropy = 4): DynamicJoudyFace {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  let currentMood: JoudyFaceMood = 'normal';
  paintJoudyFace(ctx, currentMood);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;

  const setMood = (mood: JoudyFaceMood) => {
    if (mood === currentMood) return;
    currentMood = mood;
    paintJoudyFace(ctx, mood);
    texture.needsUpdate = true;
  };

  const dispose = () => {
    texture.dispose();
  };

  return { texture, setMood, dispose };
}

export function createJoudyFaceTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  return createDynamicJoudyFaceTexture(maxAnisotropy).texture;
}

export function createMarbledHijabTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base soft cream-sage chiffon
  ctx.fillStyle = '#DCE4DC';
  ctx.fillRect(0, 0, 512, 512);

  // Organic sage-green marbled tie-dye swirls matching Joudy's scarf
  const sageColors = [
    'rgba(108, 134, 118, 0.52)',
    'rgba(132, 158, 142, 0.44)',
    'rgba(86, 112, 98, 0.38)',
    'rgba(244, 247, 242, 0.65)',
  ];

  for (let i = 0; i < 65; i++) {
    const x = (Math.sin(i * 4.3) * 0.5 + 0.5) * 512;
    const y = (Math.cos(i * 2.9) * 0.5 + 0.5) * 512;
    const rx = 28 + (i % 7) * 14;
    const ry = 14 + (i % 5) * 9;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((i * 0.65) % Math.PI);
    ctx.fillStyle = sageColors[i % sageColors.length];
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createMeadowGroundTexture(
  primaryHex: string,
  secondaryHex: string,
  maxAnisotropy = 4,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = primaryHex;
  ctx.fillRect(0, 0, 512, 512);

  // Soft painterly patches
  for (let i = 0; i < 90; i++) {
    const x = ((i * 73) % 512);
    const y = ((i * 137) % 512);
    const r = 18 + (i % 6) * 10;
    ctx.fillStyle = secondaryHex;
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(25, 12, 22, 0.5)');
  grad.addColorStop(0.6, 'rgba(25, 12, 22, 0.18)');
  grad.addColorStop(1, 'rgba(25, 12, 22, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createLevelBadgeTexture(
  level: number,
  bgHex: string,
  textHex: string,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle decorative inner ring
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(128, 128, 108, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = textHex;
  ctx.font = '800 108px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(level), 128, 134);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
