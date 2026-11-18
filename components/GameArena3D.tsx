'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import * as THREE from 'three';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Heart,
  Magnet,
  Map as MapIcon,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { LevelConfig } from '@/lib/levels';
import { soundEngine } from '@/lib/soundEffects';
import {
  createContactShadowTexture,
  createMeadowGroundTexture,
  createStudioRenderer,
  scheduleSoftwareFrame,
} from '@/lib/threeUtils';
import {
  createCat3D,
  createChocolate3D,
  createFluffyCloud3D,
  createJoudy3DChibi,
  createMagnet3D,
  createRose3D,
  createStormCloud3D,
} from '@/lib/threeModels';

export interface GameRunStats {
  level: number;
  score: number;
  cats: number;
  roses: number;
  chocolates: number;
  obstaclesHit: number;
  elapsedSeconds: number;
}

interface GameArena3DProps {
  levelConfig: LevelConfig;
  animeImageSrc: string;
  highScore: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onHighScoreUpdate: (score: number) => void;
  onExitToMap: () => void;
  onVictory: (stats: GameRunStats) => void;
}

type FallingKind = 'cat' | 'rose' | 'chocolate' | 'magnet' | 'obstacle';

interface WorldPalette {
  skyHex: number;
  fogHex: number;
  groundPrimary: string;
  groundSecondary: string;
  keyColor: number;
  keyIntensity: number;
  hemiSky: number;
  hemiGround: number;
  cloudTint: number;
  treeFoliage: number;
}

function getWorldPalette(worldId: number): WorldPalette {
  switch (worldId) {
    case 1:
      return {
        skyHex: 0xfce7f3,
        fogHex: 0xfce7f3,
        groundPrimary: '#86efac',
        groundSecondary: '#4ade80',
        keyColor: 0xfff5e4,
        keyIntensity: 1.85,
        hemiSky: 0xfbcfe8,
        hemiGround: 0x4d7c0f,
        cloudTint: 0xffffff,
        treeFoliage: 0xf9a8d4,
      };
    case 2:
      return {
        skyHex: 0xd1fae5,
        fogHex: 0xd1fae5,
        groundPrimary: '#6ee7b7',
        groundSecondary: '#34d399',
        keyColor: 0xfef9c3,
        keyIntensity: 1.75,
        hemiSky: 0xa7f3d0,
        hemiGround: 0x065f46,
        cloudTint: 0xecfdf5,
        treeFoliage: 0x10b981,
      };
    case 3:
      return {
        skyHex: 0xfef3c7,
        fogHex: 0xfef3c7,
        groundPrimary: '#bef264',
        groundSecondary: '#fde047',
        keyColor: 0xfde68a,
        keyIntensity: 1.95,
        hemiSky: 0xfef08a,
        hemiGround: 0x854d0e,
        cloudTint: 0xfffbeb,
        treeFoliage: 0xfbda9a,
      };
    case 4:
      return {
        skyHex: 0xfecdd3,
        fogHex: 0xfda4af,
        groundPrimary: '#86efac',
        groundSecondary: '#fda4af',
        keyColor: 0xfb923c,
        keyIntensity: 1.85,
        hemiSky: 0xfda4af,
        hemiGround: 0x701a75,
        cloudTint: 0xffe4e6,
        treeFoliage: 0xf472b6,
      };
    case 5:
      return {
        skyHex: 0x2e1a47,
        fogHex: 0x3b2667,
        groundPrimary: '#4c1d95',
        groundSecondary: '#6d28d9',
        keyColor: 0xe9d5ff,
        keyIntensity: 1.6,
        hemiSky: 0xc4b5fd,
        hemiGround: 0x1e1b4b,
        cloudTint: 0xddd6fe,
        treeFoliage: 0xa78bfa,
      };
    default:
      return {
        skyHex: 0x0f172a,
        fogHex: 0x1e1b4b,
        groundPrimary: '#1e293b',
        groundSecondary: '#312e81',
        keyColor: 0xe0e7ff,
        keyIntensity: 1.65,
        hemiSky: 0x818cf8,
        hemiGround: 0x0f172a,
        cloudTint: 0x475569,
        treeFoliage: 0x6366f1,
      };
  }
}

function getComboMultiplier(combo: number): number {
  if (combo >= 10) return 3;
  if (combo >= 6) return 2;
  if (combo >= 3) return 1.5;
  return 1;
}

const COMBO_WINDOW_SEC = 3.2;
const MAGNET_DURATION_SEC = 6.5;
const MAX_HEARTS = 3;

const CAT_QUOTES = ['قطة تستحق الرعاية 🐱', 'صوت خرخرة هادئ', 'رفيقة صغيرة للمغامرة'];
const ROSE_QUOTES = ['تحفة! 🌹', 'يا جمالها! ✨', 'أجمل وردة! 🌹'];
const CHOCO_QUOTES = ['يميي! 🍫', 'طعمها خيال! 🍫', 'شوكولاتة! 💖'];

// Pre-allocated math helpers (zero GC inside tick)
const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const _hitPoint = new THREE.Vector3();
const _playPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _dummy = new THREE.Object3D();
const _headWorld = new THREE.Vector3();

export default function GameArena3D({
  levelConfig,
  highScore,
  soundEnabled,
  onToggleSound,
  onHighScoreUpdate,
  onExitToMap,
  onVictory,
}: GameArena3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const bubbleDomRef = useRef<HTMLDivElement>(null);

  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [counts, setCounts] = useState({ cats: 0, roses: 0, chocolates: 0, obstaclesHit: 0 });
  const [combo, setCombo] = useState(0);
  const [magnetSecondsLeft, setMagnetSecondsLeft] = useState(0);
  const [activeControl, setActiveControl] = useState<'left' | 'right' | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<{
    id: number;
    text: string;
    tone: 'good' | 'bad' | 'magnet';
  } | null>(null);

  const isPausedRef = useRef(false);
  const isGameOverRef = useRef(false);
  const victoryFiredRef = useRef(false);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const pointerTargetXRef = useRef<number | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const heartsRef = useRef(MAX_HEARTS);
  const countsRef = useRef({ cats: 0, roses: 0, chocolates: 0, obstaclesHit: 0 });
  const comboRef = useRef(0);
  const comboTimerRef = useRef(0);
  const magnetTimerRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const resetSignalRef = useRef(0);

  const callbacksRef = useRef({ onHighScoreUpdate, onVictory });
  useEffect(() => {
    callbacksRef.current = { onHighScoreUpdate, onVictory };
  }, [onHighScoreUpdate, onVictory]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isGameOverRef.current = isGameOver;
  }, [isGameOver]);

  useEffect(() => {
    if (soundEnabled && !isPaused && !isGameOver) {
      soundEngine.startBackgroundMusic();
    } else {
      soundEngine.stopBackgroundMusic();
    }
    return () => {
      soundEngine.stopBackgroundMusic();
    };
  }, [soundEnabled, isPaused, isGameOver]);

  useEffect(() => {
    const syncActiveControl = () => {
      if (keysRef.current.left && !keysRef.current.right) setActiveControl('left');
      else if (keysRef.current.right && !keysRef.current.left) setActiveControl('right');
      else setActiveControl(null);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isGameOverRef.current) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
        pointerTargetXRef.current = null;
        syncActiveControl();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
        pointerTargetXRef.current = null;
        syncActiveControl();
      } else if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
        syncActiveControl();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
        syncActiveControl();
      }
    };

    const onWindowBlur = () => {
      keysRef.current.left = false;
      keysRef.current.right = false;
      setActiveControl(null);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, []);

  const resetRun = useCallback(() => {
    scoreRef.current = 0;
    heartsRef.current = MAX_HEARTS;
    countsRef.current = { cats: 0, roses: 0, chocolates: 0, obstaclesHit: 0 };
    comboRef.current = 0;
    comboTimerRef.current = 0;
    magnetTimerRef.current = 0;
    victoryFiredRef.current = false;
    isGameOverRef.current = false;
    startTimeRef.current = Date.now();
    resetSignalRef.current += 1;
    setScore(0);
    setHearts(MAX_HEARTS);
    setCounts({ cats: 0, roses: 0, chocolates: 0, obstaclesHit: 0 });
    setCombo(0);
    setMagnetSecondsLeft(0);
    setSpeechBubble(null);
    setIsGameOver(false);
    setIsPaused(false);
  }, []);

  // Initialize Three.js 3D Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    startTimeRef.current = Date.now();
    const palette = getWorldPalette(levelConfig.worldId);
    const studio = createStudioRenderer(container, { shadows: true });
    const { renderer, isSoftwareGl, envMap } = studio;
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(palette.skyHex);
    scene.fog = new THREE.FogExp2(palette.fogHex, 0.022);
    scene.environment = envMap;

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 120);
    const baseCamPos = new THREE.Vector3(0, 3.55, 11.4);
    camera.position.copy(baseCamPos);
    camera.lookAt(0, 2.2, 0);

    // 3-Point Warm/Cool Lighting Rig
    const hemiLight = new THREE.HemisphereLight(palette.hemiSky, palette.hemiGround, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(palette.keyColor, palette.keyIntensity);
    keyLight.position.set(6, 12, 8);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -10;
      keyLight.shadow.camera.right = 10;
      keyLight.shadow.camera.top = 10;
      keyLight.shadow.camera.bottom = -10;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 35;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xfda4af, 0.6);
    rimLight.position.set(-6, 5, -7);
    scene.add(rimLight);

    // Expansive Meadow Ground extending to horizon fog
    const groundTex = createMeadowGroundTexture(
      palette.groundPrimary,
      palette.groundSecondary,
      maxAniso,
    );
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({
        map: groundTex,
        roughness: 0.9,
        metalness: 0.02,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Pastel Pathway Strip (Top surface sits at exact Y = 0.08)
    const pathStrip = new THREE.Mesh(
      new THREE.BoxGeometry(11.8, 0.08, 2.6),
      new THREE.MeshStandardMaterial({
        color: levelConfig.isNight ? 0x4338ca : 0xfff1f2,
        roughness: 0.78,
        metalness: 0.04,
      }),
    );
    pathStrip.position.set(0, 0.04, 0);
    pathStrip.receiveShadow = true;
    scene.add(pathStrip);

    // Stylized 3D Blossom / Forest Trees framing outer edges beyond playable zone
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const foliageMat = new THREE.MeshStandardMaterial({
      color: palette.treeFoliage,
      roughness: 0.75,
    });
    const treePositions = [
      [-8.5, 0, -4.5],
      [8.5, 0, -4.5],
      [-11.5, 0, -10],
      [11.5, 0, -10],
      [-7.2, 0, -13],
      [7.2, 0, -13],
    ];
    treePositions.forEach(([tx, ty, tz], i) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.36, 1.8, 10), trunkMat);
      trunk.position.y = 0.9;
      trunk.castShadow = true;
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 1), foliageMat);
      crown.position.y = 2.3;
      crown.scale.setScalar(0.9 + (i % 3) * 0.15);
      crown.castShadow = true;
      tree.add(trunk, crown);
      tree.position.set(tx, ty, tz);
      scene.add(tree);
    });

    // Fluffy Drifting 3D Sky Clouds
    const clouds: Array<{ group: THREE.Group; speed: number; baseY: number }> = [];
    for (let i = 0; i < 6; i++) {
      const cloud = createFluffyCloud3D(palette.cloudTint);
      const cx = -12 + i * 5;
      const cy = 5.4 + (i % 3) * 1.1;
      const cz = -9 - (i % 2) * 5;
      cloud.position.set(cx, cy, cz);
      cloud.scale.setScalar(0.85 + (i % 3) * 0.25);
      scene.add(cloud);
      clouds.push({ group: cloud, speed: 0.28 + (i % 3) * 0.12, baseY: cy });
    }

    // Moon & Twinkling Instanced 3D Stars for Night Worlds (Worlds 5 & 6)
    let starMesh: THREE.InstancedMesh | null = null;
    const starPositions: Array<{ x: number; y: number; z: number; phase: number; s: number }> = [];
    if (levelConfig.isNight) {
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(1.25, 24, 24),
        new THREE.MeshStandardMaterial({
          color: 0xfef9c3,
          emissive: 0xfde047,
          emissiveIntensity: 0.75,
          roughness: 0.3,
        }),
      );
      moon.position.set(-6.5, 8.2, -16);
      scene.add(moon);

      const starGeo = new THREE.OctahedronGeometry(0.11, 0);
      const starMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfef08a,
        emissiveIntensity: 0.9,
      });
      const starCount = 90;
      starMesh = new THREE.InstancedMesh(starGeo, starMat, starCount);
      starMesh.frustumCulled = false;
      for (let i = 0; i < starCount; i++) {
        const sx = Math.sin(i * 19.3) * 0.5 * 34;
        const sy = 2.5 + ((i * 7.1) % 10);
        const sz = -12 - (i % 14);
        const s = 0.6 + (i % 4) * 0.25;
        starPositions.push({ x: sx, y: sy, z: sz, phase: i * 0.7, s });
        _dummy.position.set(sx, sy, sz);
        _dummy.scale.setScalar(s);
        _dummy.updateMatrix();
        starMesh.setMatrixAt(i, _dummy.matrix);
      }
      starMesh.instanceMatrix.needsUpdate = true;
      starMesh.computeBoundingSphere();
      scene.add(starMesh);
    }

    // Real Articulated 3D Chibi Joudy grounded flush at Ground Y = 0.08
    const joudyBundle = createJoudy3DChibi(maxAniso);
    const joudy = joudyBundle.group;
    joudy.scale.setScalar(1.12);
    joudy.position.set(0, 0.08, 0);
    scene.add(joudy);

    // Tight 3D Ground Contact Shadow glued under her boots (y = 0.084)
    const shadowTex = createContactShadowTexture();
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.72,
    });
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.45, 1.45),
      contactShadowMat,
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.084;
    scene.add(contactShadow);

    // Pre-warm shaders on GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Falling 3D Collectibles, Running Trail Dust/Stars & 3D Particle Burst Pools
    interface Active3DItem {
      kind: FallingKind;
      mesh: THREE.Group;
      baseX: number;
      vy: number;
      vx: number;
      zigzagAmp: number;
      zigzagFreq: number;
      zigzagPhase: number;
      rotSpeed: number;
      points: number;
    }
    interface BurstParticle3D {
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      life: number;
      maxLife: number;
      gravity: number;
      spin: number;
    }

    let fallingItems: Active3DItem[] = [];
    let burstParticles: BurstParticle3D[] = [];
    const burstGeo = new THREE.OctahedronGeometry(0.11, 0);
    const dustGeo = new THREE.SphereGeometry(0.085, 8, 8);

    let playerX = 0;
    let playerVx = 0;
    let runPhase = 0;
    let catchJump = 0;
    let hurtShake = 0;
    let hurtTimer = 0;
    let happyTimer = 0;
    let happyMoodType: 'happy_hearts' | 'happy_stars' = 'happy_hearts';
    let invulnTimer = 0;
    let blinkTimer = 2.4;
    let camShake = 0;
    let spawnAcc = 0;
    let trailAcc = 0;
    let magnetHudTick = 0;
    let speechClearTimer = 0;
    let lastResetCount = resetSignalRef.current;

    const showBubble = (text: string, tone: 'good' | 'bad' | 'magnet') => {
      speechClearTimer = 1.45;
      setSpeechBubble({ id: Date.now() + Math.random(), text, tone });
    };

    const spawn3DItem = () => {
      const magnetAlreadyPresent =
        magnetTimerRef.current > 0 || fallingItems.some((it) => it.kind === 'magnet');

      const roll = Math.random();
      let kind: FallingKind = 'chocolate';
      if (roll < levelConfig.obstacleChance) {
        kind = 'obstacle';
      } else if (!magnetAlreadyPresent && Math.random() < 0.08) {
        kind = 'magnet';
      } else {
        const goodRoll = Math.random();
        if (goodRoll < 0.28) kind = 'cat';
        else if (goodRoll < 0.64) kind = 'rose';
        else kind = 'chocolate';
      }

      const mesh =
        kind === 'cat'
          ? createCat3D()
          : kind === 'rose'
            ? createRose3D()
            : kind === 'chocolate'
              ? createChocolate3D()
              : kind === 'magnet'
                ? createMagnet3D()
                : createStormCloud3D();

      const scale = kind === 'obstacle' ? 1.2 : kind === 'magnet' ? 1.18 : 1.05;
      mesh.scale.setScalar(scale);

      const x = (Math.random() - 0.5) * 9.4;
      mesh.position.set(x, 8.4, 0);
      scene.add(mesh);

      const baseFall =
        kind === 'cat'
          ? 3.85
          : kind === 'rose'
            ? 3.55
            : kind === 'chocolate'
              ? 3.25
              : kind === 'magnet'
                ? 3.1
                : 4.35; // Storm clouds fall faster for real challenge
      const points =
        kind === 'cat'
          ? 20
          : kind === 'rose'
            ? 15
            : kind === 'chocolate'
              ? 10
              : kind === 'magnet'
                ? 0
                : -15;

      // ~48% of items weave in a sinusoidal zigzag path
      const hasZigzag = Math.random() < 0.48;
      const zigzagAmp = hasZigzag
        ? (kind === 'obstacle' ? 0.95 : 1.35) + Math.random() * 0.8
        : 0;

      fallingItems.push({
        kind,
        mesh,
        baseX: x,
        vy: (baseFall + Math.random() * 0.85) * levelConfig.speedMultiplier,
        vx: (Math.random() - 0.5) * (0.45 + levelConfig.windStrength * 0.015),
        zigzagAmp,
        zigzagFreq: 2.2 + Math.random() * 1.6,
        zigzagPhase: Math.random() * Math.PI * 2,
        rotSpeed: kind === 'magnet' ? 2.8 : 1.8 + Math.random() * 1.5,
        points,
      });
    };

    const spawn3DBurst = (originX: number, originY: number, kind: FallingKind) => {
      const colors =
        kind === 'cat'
          ? [0xfbbf24, 0xfde047, 0xfb7185]
          : kind === 'rose'
            ? [0xf43f5e, 0xfda4af, 0xffffff]
            : kind === 'chocolate'
              ? [0xf59e0b, 0xfbbf24, 0xf472b6]
              : kind === 'magnet'
                ? [0x38bdf8, 0x06b6d4, 0xfde047]
                : [0x94a3b8, 0x64748b, 0xfacc15];

      for (let i = 0; i < 12; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: colors[i % colors.length],
          emissive: colors[i % colors.length],
          emissiveIntensity: 0.75,
          roughness: 0.2,
        });
        const pMesh = new THREE.Mesh(burstGeo, mat);
        pMesh.position.set(originX, originY, (Math.random() - 0.5) * 0.4);
        scene.add(pMesh);

        const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
        const speed = 2.5 + Math.random() * 3.5;
        burstParticles.push({
          mesh: pMesh,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 1.8,
          vz: (Math.random() - 0.5) * 2.5,
          life: 0,
          maxLife: 0.55 + Math.random() * 0.25,
          gravity: 7.5,
          spin: 6,
        });
      }
    };

    const spawnRunningTrail = (originX: number, vx: number) => {
      const trailColors = [0xfde047, 0xf9a8d4, 0x6ee7b7, 0xffffff];
      const dirSign = vx >= 0 ? -1 : 1;

      for (let i = 0; i < 2; i++) {
        const isStar = i === 0;
        const colorHex = trailColors[Math.floor(Math.random() * trailColors.length)];
        const mat = new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: colorHex,
          emissiveIntensity: isStar ? 0.85 : 0.4,
          roughness: 0.35,
          transparent: true,
          opacity: isStar ? 0.95 : 0.75,
        });
        const mesh = new THREE.Mesh(isStar ? burstGeo : dustGeo, mat);
        mesh.position.set(
          originX + dirSign * (0.28 + Math.random() * 0.22),
          0.14 + Math.random() * 0.2,
          (Math.random() - 0.5) * 0.32,
        );
        scene.add(mesh);

        burstParticles.push({
          mesh,
          vx: dirSign * (1.2 + Math.random() * 1.4),
          vy: 0.6 + Math.random() * 0.9,
          vz: (Math.random() - 0.5) * 0.8,
          life: 0,
          maxLife: isStar ? 0.45 : 0.36,
          gravity: 1.4,
          spin: isStar ? 9 : 2,
        });
      }
    };

    // Smooth Swipe/Drag directly on the 3D viewport
    const updatePointerTarget = (clientX: number, clientY: number) => {
      if (isPausedRef.current || isGameOverRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      _ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_ndc, camera);
      if (_raycaster.ray.intersectPlane(_playPlane, _hitPoint)) {
        pointerTargetXRef.current = THREE.MathUtils.clamp(_hitPoint.x, -5.0, 5.0);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      dragPointerIdRef.current = e.pointerId;
      updatePointerTarget(e.clientX, e.clientY);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (dragPointerIdRef.current !== e.pointerId && e.buttons === 0) return;
      updatePointerTarget(e.clientX, e.clientY);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (dragPointerIdRef.current === e.pointerId) {
        dragPointerIdRef.current = null;
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const ro = new ResizeObserver(() => {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    const clock = new THREE.Clock();
    let frameId = 0;
    const activeTimers: number[] = [];
    let disposed = false;

    const tick = () => {
      if (disposed) return;

      if (lastResetCount !== resetSignalRef.current) {
        lastResetCount = resetSignalRef.current;
        fallingItems.forEach((it) => scene.remove(it.mesh));
        fallingItems = [];
        burstParticles.forEach((bp) => {
          scene.remove(bp.mesh);
          (bp.mesh.material as THREE.Material).dispose();
        });
        burstParticles = [];
        playerX = 0;
        playerVx = 0;
        runPhase = 0;
        catchJump = 0;
        hurtShake = 0;
        hurtTimer = 0;
        happyTimer = 0;
        invulnTimer = 0;
        joudy.visible = true;
        joudyBundle.face.setMood('normal');
      }

      const dt = Math.min(0.05, clock.getDelta());
      const elapsed = clock.elapsedTime;

      // Animate sky clouds & stars
      for (const c of clouds) {
        c.group.position.x += c.speed * dt;
        c.group.position.y = c.baseY + Math.sin(elapsed * 0.7 + c.baseY) * 0.14;
        if (c.group.position.x > 16) c.group.position.x = -16;
      }

      if (starMesh && !prefersReducedMotion) {
        for (let i = 0; i < starPositions.length; i++) {
          const sp = starPositions[i];
          const tw = sp.s * (0.65 + 0.45 * Math.sin(elapsed * 2.5 + sp.phase));
          _dummy.position.set(sp.x, sp.y, sp.z);
          _dummy.scale.setScalar(tw);
          _dummy.rotation.y = elapsed * 0.6 + sp.phase;
          _dummy.updateMatrix();
          starMesh.setMatrixAt(i, _dummy.matrix);
        }
        starMesh.instanceMatrix.needsUpdate = true;
      }

      if (!isPausedRef.current && !victoryFiredRef.current && !isGameOverRef.current) {
        // Timers
        if (comboRef.current > 0) {
          comboTimerRef.current -= dt;
          if (comboTimerRef.current <= 0) {
            comboRef.current = 0;
            comboTimerRef.current = 0;
            setCombo(0);
          }
        }

        if (magnetTimerRef.current > 0) {
          magnetTimerRef.current = Math.max(0, magnetTimerRef.current - dt);
          magnetHudTick += dt;
          if (magnetHudTick >= 0.25 || magnetTimerRef.current === 0) {
            magnetHudTick = 0;
            setMagnetSecondsLeft(Math.ceil(magnetTimerRef.current));
          }
        }

        if (speechClearTimer > 0) {
          speechClearTimer -= dt;
          if (speechClearTimer <= 0) {
            setSpeechBubble(null);
          }
        }

        if (invulnTimer > 0) {
          invulnTimer = Math.max(0, invulnTimer - dt);
          joudy.visible = Math.floor(invulnTimer * 16) % 2 === 0;
        } else {
          joudy.visible = true;
        }

        // Dynamic Facial Mood & Automatic Blinking
        if (hurtTimer > 0) {
          hurtTimer = Math.max(0, hurtTimer - dt);
          joudyBundle.face.setMood('hurt');
        } else if (happyTimer > 0) {
          happyTimer = Math.max(0, happyTimer - dt);
          joudyBundle.face.setMood(happyMoodType);
        } else {
          blinkTimer -= dt;
          if (blinkTimer <= 0) {
            joudyBundle.face.setMood('blink');
            if (blinkTimer <= -0.14) {
              blinkTimer = 2.4 + Math.random() * 1.8;
              joudyBundle.face.setMood('normal');
            }
          } else {
            joudyBundle.face.setMood('normal');
          }
        }

        // 1. Player horizontal physics
        const moveSpeed = 8.4;
        let dir = 0;
        if (keysRef.current.left) dir -= 1;
        if (keysRef.current.right) dir += 1;

        if (dir !== 0) {
          playerVx = THREE.MathUtils.damp(playerVx, dir * moveSpeed, 18, dt);
        } else if (pointerTargetXRef.current !== null) {
          const diff = pointerTargetXRef.current - playerX;
          if (Math.abs(diff) > 0.08) {
            playerVx = THREE.MathUtils.clamp(diff * 12, -moveSpeed * 1.35, moveSpeed * 1.35);
          } else {
            playerVx = THREE.MathUtils.damp(playerVx, 0, 18, dt);
          }
        } else {
          playerVx = THREE.MathUtils.damp(playerVx, 0, 18, dt);
        }

        playerX = THREE.MathUtils.clamp(playerX + playerVx * dt, -5.0, 5.0);

        if (catchJump > 0) catchJump = Math.max(0, catchJump - dt * 3.2);
        if (hurtShake > 0) hurtShake = Math.max(0, hurtShake - dt * 3.2);
        if (camShake > 0) camShake = Math.max(0, camShake - dt * 2.6);

        // 2. Articulated 3D Chibi Running Cycle, Idle Breathing, Grounding & Trail
        const runAmt = Math.min(1, Math.abs(playerVx) / 2.6);
        if (runAmt > 0.05) {
          runPhase += dt * (8 + runAmt * 10);
        }

        const {
          bodyGroup,
          headGroup,
          leftArm,
          rightArm,
          leftLeg,
          rightLeg,
          scarfTail,
          wandStar,
          dizzyGroup,
          magnetAura,
        } = joudy.userData as Record<string, THREE.Object3D>;

        // Real Running Leg & Arm Cycle (or smooth settle to idle)
        const strideSin = Math.sin(runPhase);
        const targetLeftLegX = strideSin * 0.9 * runAmt;
        const targetRightLegX = -strideSin * 0.9 * runAmt;
        if (leftLeg && rightLeg) {
          leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, targetLeftLegX, 16, dt);
          rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, targetRightLegX, 16, dt);
        }

        const cheerRaise = Math.sin(catchJump * Math.PI) * 1.35;
        if (leftArm && rightArm) {
          const targetLeftArmX = -strideSin * 0.78 * runAmt - cheerRaise;
          const targetRightArmX = strideSin * 0.78 * runAmt - cheerRaise;
          leftArm.rotation.x = THREE.MathUtils.damp(leftArm.rotation.x, targetLeftArmX, 16, dt);
          rightArm.rotation.x = THREE.MathUtils.damp(rightArm.rotation.x, targetRightArmX, 16, dt);
        }

        // Body lean, breathing & playful head nod
        const breathWave = Math.sin(elapsed * 3.1);
        if (bodyGroup) {
          bodyGroup.scale.y = 1 + breathWave * 0.025 * (1 - runAmt);
          bodyGroup.rotation.z = THREE.MathUtils.damp(
            bodyGroup.rotation.z,
            -playerVx * 0.022,
            14,
            dt,
          );
          bodyGroup.rotation.x = THREE.MathUtils.damp(bodyGroup.rotation.x, 0.14 * runAmt, 12, dt);
        }

        if (headGroup) {
          headGroup.rotation.z =
            hurtTimer > 0
              ? Math.sin(elapsed * 22) * 0.14
              : Math.sin(elapsed * 2.0) * 0.045 * (1 - runAmt);
          headGroup.rotation.x = happyTimer > 0 ? -0.08 : 0;
        }

        if (scarfTail) {
          scarfTail.rotation.y = Math.sin(elapsed * 8) * 0.25 * runAmt + playerVx * 0.04;
        }
        if (wandStar) {
          wandStar.rotation.y += dt * (2.5 + runAmt * 3);
        }
        if (dizzyGroup) {
          dizzyGroup.visible = hurtTimer > 0;
          if (dizzyGroup.visible) {
            dizzyGroup.rotation.y += dt * 7.5;
          }
        }
        if (magnetAura) {
          magnetAura.visible = magnetTimerRef.current > 0;
          if (magnetAura.visible) {
            magnetAura.rotation.z += dt * 4.5;
            const pulse = 1 + Math.sin(elapsed * 9) * 0.12;
            magnetAura.scale.set(pulse, pulse, 1);
          }
        }

        // Exact Grounding at path top surface (Y = 0.08) + Jump/Running Stride Lift
        const jumpOffset = Math.sin(catchJump * Math.PI) * 0.72;
        const strideLift = Math.abs(strideSin) * 0.16 * runAmt;
        const hurtOffset = Math.sin(hurtShake * Math.PI * 6) * 0.16 * hurtShake;
        const totalLift = jumpOffset + strideLift;

        joudy.position.set(playerX + hurtOffset, 0.08 + totalLift, 0);

        // Turn smoothly toward running direction, return to face camera on idle
        const targetYaw =
          Math.abs(playerVx) > 0.35 ? Math.sign(playerVx) * 0.62 * runAmt : 0;
        joudy.rotation.y = THREE.MathUtils.damp(joudy.rotation.y, targetYaw, 12, dt);

        // Ground Contact Shadow glued directly under Joudy's boots
        contactShadow.position.x = playerX + hurtOffset;
        const heightRatio = Math.min(0.65, totalLift * 0.45);
        const shadowScaleX = (1 - heightRatio * 0.52) * (1 + runAmt * 0.12);
        const shadowScaleZ = 1 - heightRatio * 0.52;
        contactShadow.scale.set(shadowScaleX, shadowScaleZ, 1);
        contactShadowMat.opacity = Math.max(0.32, 0.74 - heightRatio * 0.48);

        // Magic dust & golden stars trailing behind feet while running
        if (!prefersReducedMotion && Math.abs(playerVx) > 1.2) {
          trailAcc += dt;
          if (trailAcc >= 0.065) {
            trailAcc = 0;
            spawnRunningTrail(playerX, playerVx);
          }
        } else {
          trailAcc = 0.04;
        }

        // 3. Spawn 3D Falling Collectibles
        spawnAcc += dt;
        if (spawnAcc >= levelConfig.spawnIntervalSec) {
          spawnAcc = 0;
          spawn3DItem();
        }

        // 4. Update Falling Items (Zigzag + Magnet Pull + Collisions)
        const magnetActive = magnetTimerRef.current > 0;
        const remaining: Active3DItem[] = [];
        for (const item of fallingItems) {
          item.mesh.position.y -= item.vy * dt;
          item.baseX += item.vx * dt;

          if (item.baseX < -4.8 || item.baseX > 4.8) {
            item.vx *= -1;
            item.baseX = THREE.MathUtils.clamp(item.baseX, -4.8, 4.8);
          }

          if (magnetActive && item.kind !== 'obstacle' && item.kind !== 'magnet') {
            const toPlayerX = playerX - item.mesh.position.x;
            const toPlayerY = 1.05 - item.mesh.position.y;
            const dist = Math.hypot(toPlayerX, toPlayerY);
            if (dist < 8.2) {
              const pullStrength = 10.5;
              const pullDx = (toPlayerX / Math.max(0.25, dist)) * pullStrength * dt;
              item.baseX += pullDx;
              item.mesh.position.x += pullDx;
              item.mesh.position.y += (toPlayerY / Math.max(0.25, dist)) * pullStrength * 0.65 * dt;
            }
          } else {
            const zigzagOffset =
              item.zigzagAmp > 0
                ? Math.sin(elapsed * item.zigzagFreq + item.zigzagPhase) * item.zigzagAmp
                : 0;
            item.mesh.position.x = THREE.MathUtils.clamp(item.baseX + zigzagOffset, -5.1, 5.1);
          }

          item.mesh.rotation.y += item.rotSpeed * dt;

          const dx = item.mesh.position.x - playerX;
          const dy = item.mesh.position.y - (1.05 + totalLift);

          if (Math.abs(dx) < 0.96 && Math.abs(dy) < 1.1) {
            spawn3DBurst(item.mesh.position.x, item.mesh.position.y, item.kind);
            scene.remove(item.mesh);

            if (item.kind === 'obstacle') {
              if (invulnTimer <= 0) {
                const nextScore = Math.max(0, scoreRef.current + item.points);
                scoreRef.current = nextScore;
                comboRef.current = 0;
                comboTimerRef.current = 0;
                countsRef.current.obstaclesHit += 1;
                heartsRef.current = Math.max(0, heartsRef.current - 1);
                invulnTimer = 1.05;
                hurtShake = 1;
                hurtTimer = 1.15;
                happyTimer = 0;
                if (!prefersReducedMotion) camShake = 0.28;
                soundEngine.playObstacleHit();
                showBubble('أوه لا! ⚡', 'bad');

                setHearts(heartsRef.current);
                setScore(scoreRef.current);
                setCombo(0);
                setCounts({ ...countsRef.current });

                if (heartsRef.current <= 0) {
                  isGameOverRef.current = true;
                  soundEngine.stopBackgroundMusic();
                  setIsGameOver(true);
                  continue;
                }
              }
            } else if (item.kind === 'magnet') {
              magnetTimerRef.current = MAGNET_DURATION_SEC;
              setMagnetSecondsLeft(Math.ceil(MAGNET_DURATION_SEC));
              catchJump = 1;
              happyMoodType = 'happy_stars';
              happyTimer = 1.0;
              hurtTimer = 0;
              if (!prefersReducedMotion) camShake = Math.max(camShake, 0.1);
              soundEngine.playMagnetCollect();
              showBubble('مغناطيس سحري! 🧲', 'magnet');
            } else {
              comboRef.current += 1;
              comboTimerRef.current = COMBO_WINDOW_SEC;
              const multiplier = getComboMultiplier(comboRef.current);
              const earnedPoints = Math.round(item.points * multiplier);
              const nextScore = scoreRef.current + earnedPoints;
              scoreRef.current = nextScore;
              if (item.kind === 'cat') countsRef.current.cats += 1;
              if (item.kind === 'rose') countsRef.current.roses += 1;
              if (item.kind === 'chocolate') countsRef.current.chocolates += 1;
              catchJump = 1;
              happyMoodType = item.kind === 'chocolate' ? 'happy_stars' : 'happy_hearts';
              happyTimer = 0.95;
              hurtTimer = 0;
              if (!prefersReducedMotion) {
                camShake = Math.max(camShake, item.kind === 'cat' ? 0.1 : 0.05);
              }
              soundEngine.playCollect(item.kind, comboRef.current);
              callbacksRef.current.onHighScoreUpdate(nextScore);

              const quotePool =
                item.kind === 'cat'
                  ? CAT_QUOTES
                  : item.kind === 'rose'
                    ? ROSE_QUOTES
                    : CHOCO_QUOTES;
              const quote = quotePool[Math.floor(Math.random() * quotePool.length)];
              const multLabel = multiplier > 1 ? ` ×${multiplier}` : '';
              showBubble(`${quote} +${earnedPoints}${multLabel}`, 'good');

              setScore(scoreRef.current);
              setCombo(comboRef.current);
              setCounts({ ...countsRef.current });

              if (scoreRef.current >= levelConfig.targetScore && !victoryFiredRef.current) {
                victoryFiredRef.current = true;
                soundEngine.stopBackgroundMusic();
                soundEngine.playVictoryFanfare();
                const elapsedSeconds = Math.max(
                  1,
                  Math.round((Date.now() - startTimeRef.current) / 1000),
                );
                callbacksRef.current.onVictory({
                  level: levelConfig.level,
                  score: scoreRef.current,
                  cats: countsRef.current.cats,
                  roses: countsRef.current.roses,
                  chocolates: countsRef.current.chocolates,
                  obstaclesHit: countsRef.current.obstaclesHit,
                  elapsedSeconds,
                });
              }
            }
            continue;
          }

          if (item.mesh.position.y < -0.5) {
            scene.remove(item.mesh);
            continue;
          }
          remaining.push(item);
        }
        fallingItems = remaining;

        // 5. Update 3D Particle Bursts & Running Trail
        const nextBursts: BurstParticle3D[] = [];
        for (const bp of burstParticles) {
          bp.life += dt;
          if (bp.life >= bp.maxLife) {
            scene.remove(bp.mesh);
            (bp.mesh.material as THREE.Material).dispose();
            continue;
          }
          bp.mesh.position.x += bp.vx * dt;
          bp.mesh.position.y += bp.vy * dt;
          bp.mesh.position.z += bp.vz * dt;
          bp.vy -= bp.gravity * dt;
          bp.mesh.rotation.x += dt * bp.spin;
          bp.mesh.rotation.y += dt * bp.spin;
          const s = Math.max(0.01, 1 - bp.life / bp.maxLife);
          bp.mesh.scale.setScalar(s);
          nextBursts.push(bp);
        }
        burstParticles = nextBursts;
      }

      // Smooth Camera Follow + Screen Shake
      const targetCamX = playerX * 0.14;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 6, dt);
      camera.position.y = baseCamPos.y + (camShake > 0.01 ? (Math.random() - 0.5) * camShake : 0);
      camera.position.z = baseCamPos.z;
      if (camShake > 0.01) {
        camera.position.x += (Math.random() - 0.5) * camShake;
      }
      camera.lookAt(camera.position.x * 0.5, 2.2, 0);

      // Project Joudy's head top into viewport % for Speech Bubble tracking
      if (bubbleDomRef.current) {
        _headWorld.set(joudy.position.x, joudy.position.y + 2.38, 0);
        _headWorld.project(camera);
        const pctX = (_headWorld.x * 0.5 + 0.5) * 100;
        const pctY = (-_headWorld.y * 0.5 + 0.5) * 100;
        bubbleDomRef.current.style.left = `${THREE.MathUtils.clamp(pctX, 16, 84)}%`;
        bubbleDomRef.current.style.top = `${THREE.MathUtils.clamp(pctY, 8, 65)}%`;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        scheduleSoftwareFrame(renderer, tick, (id) => activeTimers.push(id));
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      scheduleSoftwareFrame(renderer, tick, (id) => activeTimers.push(id));
    } else {
      frameId = window.requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      activeTimers.forEach((id) => window.clearTimeout(id));
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      joudyBundle.dispose();
      groundTex.dispose();
      shadowTex.dispose();
      contactShadow.geometry.dispose();
      contactShadowMat.dispose();
      burstGeo.dispose();
      dustGeo.dispose();
      studio.dispose();
    };
  }, [levelConfig]);

  const progressPct = Math.min(100, Math.round((score / levelConfig.targetScore) * 100));
  const displayedHighScore = Math.max(highScore, score);
  const comboMultiplier = getComboMultiplier(combo);

  const handleTouchPress = (side: 'left' | 'right', e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unsupported
    }
    keysRef.current[side] = true;
    pointerTargetXRef.current = null;
    setActiveControl(side);
  };

  const handleTouchRelease = (side: 'left' | 'right', e?: React.PointerEvent<HTMLButtonElement>) => {
    if (e) e.stopPropagation();
    keysRef.current[side] = false;
    if (keysRef.current.left && !keysRef.current.right) setActiveControl('left');
    else if (keysRef.current.right && !keysRef.current.left) setActiveControl('right');
    else setActiveControl(null);
  };

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-2.5 sm:py-4 flex flex-col gap-2.5 h-[calc(100dvh-0.5rem)] max-h-[860px]"
    >
      {/* Top 3D Game HUD */}
      <header className="bg-white/95 border border-rose-200 rounded-2xl px-3 sm:px-5 py-2.5 shadow-sm flex items-center justify-between gap-3 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs sm:text-sm mb-1.5">
            <div className="flex items-center gap-2 font-bold text-[#2D1824] whitespace-nowrap">
              <span className="text-rose-700">المستوى {levelConfig.level} (3D)</span>
              <span className="text-rose-300 hidden sm:inline" aria-hidden="true">
                ·
              </span>
              <span className="text-[#6A4558] text-xs hidden sm:inline truncate max-w-[130px]">
                {levelConfig.worldName}
              </span>
              <span className="text-rose-300" aria-hidden="true">
                ·
              </span>
              <span className="text-rose-600 text-sm sm:text-base font-extrabold tabular-nums">
                {score} / {levelConfig.targetScore}
              </span>

              {/* 3 Hearts Life Meter */}
              <div
                className="inline-flex items-center gap-0.5 mr-1"
                aria-label={`الحياة المتبقية: ${hearts} من ${MAX_HEARTS}`}
              >
                {[1, 2, 3].map((idx) => (
                  <Heart
                    key={idx}
                    className={`w-4 h-4 transition-transform ${
                      idx <= hearts
                        ? 'fill-rose-500 text-rose-600 scale-100'
                        : 'fill-slate-200 text-slate-300 scale-90'
                    }`}
                  />
                ))}
              </div>

              {combo >= 2 && (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-700 tabular-nums">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>×{comboMultiplier}</span>
                </span>
              )}
              {magnetSecondsLeft > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-sky-700 tabular-nums">
                  <Magnet className="w-3.5 h-3.5 text-sky-500" />
                  <span>{magnetSecondsLeft}ث</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 text-xs font-semibold text-[#6A4558] tabular-nums whitespace-nowrap">
              <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>الرقم القياسي: {displayedHighScore}</span>
              </span>
              <span className="hidden lg:inline text-rose-300" aria-hidden="true">
                ·
              </span>
              <span className="hidden lg:inline">
                🐱 {counts.cats} · 🌹 {counts.roses} · 🍫 {counts.chocolates}
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-rose-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-l from-rose-500 via-pink-500 to-amber-400 transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
            className="w-10 h-10 rounded-xl border border-rose-200 bg-[#FFF7FA] hover:bg-rose-100 text-[#2D1824] flex items-center justify-center transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            aria-label={isPaused ? 'استئناف اللعب' : 'إيقاف مؤقت'}
            className="w-10 h-10 rounded-xl border border-rose-200 bg-[#FFF7FA] hover:bg-rose-100 text-[#2D1824] flex items-center justify-center transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onExitToMap}
            aria-label="العودة لخريطة المستويات"
            className="w-10 h-10 rounded-xl border border-rose-200 bg-[#FFF7FA] hover:bg-rose-100 text-[#2D1824] flex items-center justify-center transition-colors cursor-pointer"
          >
            <MapIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Isolated 3D WebGL Viewport + Pro Arcade Floating Neon D-Pad */}
      <div className="relative flex-1 min-h-[360px] rounded-3xl overflow-hidden border-2 border-rose-200 shadow-[0_20px_50px_-15px_rgba(225,29,72,0.2)] bg-[#FFF5F8] select-none touch-none">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Dynamic Speech Bubble following Joudy's 3D Head */}
        <div
          ref={bubbleDomRef}
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
          style={{ left: '50%', top: '42%' }}
        >
          {speechBubble && (
            <motion.div
              key={speechBubble.id}
              initial={{ opacity: 0, y: 10, scale: 0.78 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`relative px-3.5 py-1.5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-lg whitespace-nowrap border-2 ${
                speechBubble.tone === 'bad'
                  ? 'bg-slate-900 text-amber-300 border-amber-400'
                  : speechBubble.tone === 'magnet'
                    ? 'bg-sky-600 text-white border-sky-200'
                    : 'bg-white text-rose-700 border-rose-300'
              }`}
            >
              <span>{speechBubble.text}</span>
              <span
                className={`absolute left-1/2 -translate-x-1/2 -bottom-2 w-3 h-3 rotate-45 border-r-2 border-b-2 ${
                  speechBubble.tone === 'bad'
                    ? 'bg-slate-900 border-amber-400'
                    : speechBubble.tone === 'magnet'
                      ? 'bg-sky-600 border-sky-200'
                      : 'bg-white border-rose-300'
                }`}
              />
            </motion.div>
          )}
        </div>

        {/* Pro Arcade Floating Circular Neon Glassmorphism D-Pad (Bottom-Left & Bottom-Right) */}
        {!isPaused && !isGameOver && (
          <>
            <button
              type="button"
              aria-label="التحرك لليسار"
              onContextMenu={(e) => e.preventDefault()}
              onPointerDown={(e) => handleTouchPress('left', e)}
              onPointerUp={(e) => handleTouchRelease('left', e)}
              onPointerCancel={(e) => handleTouchRelease('left', e)}
              onLostPointerCapture={(e) => handleTouchRelease('left', e)}
              className={`absolute left-4 bottom-4 sm:left-6 sm:bottom-6 z-20 w-16 h-16 sm:w-[74px] sm:h-[74px] rounded-full flex items-center justify-center border-2 transition-all duration-100 select-none touch-none cursor-pointer ${
                activeControl === 'left'
                  ? 'scale-90 bg-gradient-to-b from-rose-500/95 to-pink-600/95 border-cyan-200 text-white shadow-[0_0_32px_rgba(34,211,238,0.85),0_0_16px_rgba(244,63,94,0.8),inset_0_2px_6px_rgba(255,255,255,0.65)]'
                  : 'bg-gradient-to-b from-white/85 via-rose-50/75 to-pink-100/80 border-rose-300/90 text-rose-700 shadow-[0_0_22px_rgba(244,63,94,0.4),inset_0_2px_5px_rgba(255,255,255,0.95)] hover:border-rose-400'
              }`}
            >
              <ChevronLeft className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2.75]" />
            </button>

            <button
              type="button"
              aria-label="التحرك لليمين"
              onContextMenu={(e) => e.preventDefault()}
              onPointerDown={(e) => handleTouchPress('right', e)}
              onPointerUp={(e) => handleTouchRelease('right', e)}
              onPointerCancel={(e) => handleTouchRelease('right', e)}
              onLostPointerCapture={(e) => handleTouchRelease('right', e)}
              className={`absolute right-4 bottom-4 sm:right-6 sm:bottom-6 z-20 w-16 h-16 sm:w-[74px] sm:h-[74px] rounded-full flex items-center justify-center border-2 transition-all duration-100 select-none touch-none cursor-pointer ${
                activeControl === 'right'
                  ? 'scale-90 bg-gradient-to-b from-rose-500/95 to-pink-600/95 border-cyan-200 text-white shadow-[0_0_32px_rgba(34,211,238,0.85),0_0_16px_rgba(244,63,94,0.8),inset_0_2px_6px_rgba(255,255,255,0.65)]'
                  : 'bg-gradient-to-b from-white/85 via-rose-50/75 to-pink-100/80 border-rose-300/90 text-rose-700 shadow-[0_0_22px_rgba(244,63,94,0.4),inset_0_2px_5px_rgba(255,255,255,0.95)] hover:border-rose-400'
              }`}
            >
              <ChevronRight className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2.75]" />
            </button>
          </>
        )}

        {contextLost && (
          <div className="absolute inset-0 z-30 bg-[#FFF5F8]/95 flex flex-col items-center justify-center p-6 text-center">
            <p className="font-bold text-[#2D1824]">جاري إعادة تهيئة المشهد ثلاثي الأبعاد...</p>
          </div>
        )}

        {/* Pause Overlay */}
        {isPaused && !isGameOver && (
          <div className="absolute inset-0 z-30 bg-[#1B1018]/65 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-rose-200 p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-4">
              <h3
                className="text-2xl font-bold text-[#2D1824]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                استراحة سحرية — المستوى {levelConfig.level}
              </h3>
              <p className="text-sm text-[#6A4558]">
                نقاطك الحالية <span className="font-bold text-rose-600 tabular-nums">{score}</span> من{' '}
                <span className="font-bold tabular-nums">{levelConfig.targetScore}</span>.
              </p>
              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPaused(false)}
                  className="w-full py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>استئناف اللعب</span>
                </button>
                <button
                  type="button"
                  onClick={resetRun}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[#2D1824] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة المستوى</span>
                </button>
                <button
                  type="button"
                  onClick={onExitToMap}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-[#6A4558] hover:text-[#2D1824] transition-colors cursor-pointer"
                >
                  خريطة المستويات 2D
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over (3 Hearts Depleted) Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 z-30 bg-[#1B1018]/75 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl border-2 border-rose-300 p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-4"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-100 text-rose-600 mx-auto">
                <Heart className="w-7 h-7" />
              </div>
              <h3
                className="text-2xl font-bold text-[#2D1824]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                انتهت قلوب الحياة! 💔
              </h3>
              <p className="text-sm text-[#6A4558] leading-relaxed">
                الغيوم المشاكسة كانت سريعة جداً في المستوى {levelConfig.level}! جمعتِ{' '}
                <span className="font-bold text-rose-600 tabular-nums">{score}</span> نقطة من{' '}
                <span className="font-bold tabular-nums">{levelConfig.targetScore}</span>. حاولي مرة أخرى يا بطلة!
              </p>
              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={resetRun}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-l from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة المحاولة الآن</span>
                </button>
                <button
                  type="button"
                  onClick={onExitToMap}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[#2D1824] text-sm font-semibold transition-colors cursor-pointer"
                >
                  العودة لخريطة المستويات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Subtle Controls Hint Footer */}
      <p className="text-center text-xs font-medium text-[#6A4558] shrink-0">
        استخدمي الدائرتين بالأسفل أو السحب المباشر على الشاشة أو أسهم الكيبورد · تفادي الغيوم المشاكسة للحفاظ على قلوبك الـ 3!
      </p>
    </motion.section>
  );
}
