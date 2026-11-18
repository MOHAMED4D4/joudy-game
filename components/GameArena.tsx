'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
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
  Zap,
  Waves,
  KeyRound,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEffects';
import { loadTransparentSprite } from '@/lib/spriteUtils';
import {
  loadCartoonSvgSprites,
  type CartoonSpriteKind,
  type CartoonSpriteMap,
} from '@/lib/cartoonSvgSprites';
import type { LevelConfig } from '@/lib/levels';
import WorldAtmosphereOverlay from './WorldAtmosphereOverlay';
import VirtualJoystick, { type JoystickVector } from './VirtualJoystick';
import { saveWorld, useWorldSave, type ControlMode } from '@/lib/joudyWorld';

export interface GameRunStats {
  level: number;
  score: number;
  cats: number;
  roses: number;
  chocolates: number;
  obstaclesHit: number;
  elapsedSeconds: number;
}

interface GameArenaProps {
  levelConfig: LevelConfig;
  realImageSrc?: string;
  animeImageSrc: string;
  highScore: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  controlMode: ControlMode;
  characterFilter?: string;
  characterSpeedBonus?: number;
  characterShieldBonus?: number;
  onHighScoreUpdate: (score: number) => void;
  onExitToMap: () => void;
  onVictory: (stats: GameRunStats) => void;
}

interface FallingEntity {
  id: number;
  kind: CartoonSpriteKind;
  baseX: number;
  x: number;
  y: number;
  vy: number;
  vx: number;
  zigzagAmp: number;
  zigzagFreq: number;
  zigzagPhase: number;
  radius: number;
  rotation: number;
  vr: number;
  points: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: 'circle' | 'heart' | 'star';
  gravity: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
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

const ITEM_CONFIG: Record<
  CartoonSpriteKind,
  { points: number; halo: string; fallbackColor: string }
> = {
  cat: { points: 20, halo: 'rgba(251, 191, 36, 0.35)', fallbackColor: '#FDE68A' },
  rose: { points: 15, halo: 'rgba(244, 63, 94, 0.35)', fallbackColor: '#FDA4AF' },
  chocolate: { points: 10, halo: 'rgba(217, 119, 6, 0.32)', fallbackColor: '#D97706' },
  magnet: { points: 0, halo: 'rgba(56, 189, 248, 0.42)', fallbackColor: '#38BDF8' },
  blueKey: { points: 0, halo: 'rgba(59, 130, 246, 0.55)', fallbackColor: '#3B82F6' },
  obstacle: { points: -15, halo: 'rgba(71, 85, 105, 0.48)', fallbackColor: '#475569' },
};

function drawStarShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha: number,
  rot = 0,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHeartShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.35);
  ctx.bezierCurveTo(-size * 0.55, -size * 0.15, -size * 0.5, -size * 0.7, 0, -size * 0.25);
  ctx.bezierCurveTo(size * 0.5, -size * 0.7, size * 0.55, -size * 0.15, 0, size * 0.35);
  ctx.fill();
  ctx.restore();
}

export default function GameArena({
  levelConfig,
  realImageSrc,
  animeImageSrc,
  highScore,
  soundEnabled,
  onToggleSound,
  controlMode,
  characterFilter = 'none',
  characterSpeedBonus = 1,
  characterShieldBonus = 0,
  onHighScoreUpdate,
  onExitToMap,
  onVictory,
}: GameArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const worldSave = useWorldSave();

  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [counts, setCounts] = useState({ cats: 0, roses: 0, chocolates: 0, obstaclesHit: 0 });
  const [combo, setCombo] = useState(0);
  const [magnetSecondsLeft, setMagnetSecondsLeft] = useState(0);
  const [activeControl, setActiveControl] = useState<'left' | 'right' | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [dashActive, setDashActive] = useState(false);
  const [jumpActive, setJumpActive] = useState(false);
  const [slideActive, setSlideActive] = useState(false);

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
  const shakeRef = useRef(0);
  const resetSignalRef = useRef(0);
  const dashTimerRef = useRef(0);
  const jumpTimerRef = useRef(0);
  const slideTimerRef = useRef(0);
  const reviveRequestRef = useRef(false);
  const reviveCountRef = useRef(worldSave.reviveCountsByLevel[levelConfig.level] ?? 0);

  const spriteRef = useRef<HTMLImageElement | null>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const cartoonSpritesRef = useRef<CartoonSpriteMap>({});

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

  // Load Joudy's clean Chibi Anime Heroine sprite, cartoon SVG sprites & world backdrop
  useEffect(() => {
    let active = true;

    const rawFallback = new window.Image();
    rawFallback.onload = () => {
      if (active && !spriteRef.current) {
        spriteRef.current = rawFallback;
      }
    };
    rawFallback.src = animeImageSrc;

    loadTransparentSprite(animeImageSrc)
      .then(({ image }) => {
        if (active) spriteRef.current = image;
      })
      .catch(() => {
        if (active) spriteRef.current = rawFallback;
      });

    const cancelSvgLoad = loadCartoonSvgSprites((map) => {
      if (active) cartoonSpritesRef.current = map;
    });

    const bg = new window.Image();
    bg.onload = () => {
      if (active) bgRef.current = bg;
    };
    bg.src = levelConfig.bgImage;

    return () => {
      active = false;
      cancelSvgLoad();
    };
  }, [animeImageSrc, levelConfig.bgImage]);

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
    dashTimerRef.current = 0;
    jumpTimerRef.current = 0;
    slideTimerRef.current = 0;
    reviveRequestRef.current = false;
    setDashActive(false);
    setSlideActive(false);
    victoryFiredRef.current = false;
    isGameOverRef.current = false;
    shakeRef.current = 0;
    startTimeRef.current = Date.now();
    resetSignalRef.current += 1;
    setScore(0);
    setHearts(MAX_HEARTS);
    setCounts({ cats: 0, roses: 0, chocolates: 0, obstaclesHit: 0 });
    setCombo(0);
    setMagnetSecondsLeft(0);
    setIsGameOver(false);
    setIsPaused(false);
  }, []);

  // Main 60FPS 2D Canvas Arcade Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = stageRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    startTimeRef.current = Date.now();

    let width = container.clientWidth || 720;
    let height = container.clientHeight || 480;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const updateCanvasSize = () => {
      width = Math.max(300, container.clientWidth);
      height = Math.max(320, container.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };
    updateCanvasSize();

    const ro = new ResizeObserver(updateCanvasSize);
    ro.observe(container);

    const player = {
      x: width / 2,
      vx: 0,
      size: Math.min(138, Math.max(96, width * 0.145)),
      bouncePhase: 0,
      catchBounce: 0,
      hurtShake: 0,
      invulnTimer: 0,
      happyTimer: 0,
      bubbleText: '',
      bubbleTone: 'good' as 'good' | 'bad' | 'magnet',
      bubbleTimer: 0,
    };

    let entities: FallingEntity[] = [];
    let particles: Particle[] = [];
    let popups: FloatingText[] = [];
    let nextEntityId = 1;
    let spawnAccumulator = 0;
    let trailAccumulator = 0;
    let magnetHudTick = 0;
    let lastResetCount = resetSignalRef.current;

    const ambientItems = Array.from({ length: 22 }, (_, i) => ({
      x: (i * 97) % Math.max(400, width),
      y: (i * 61) % Math.max(400, height),
      size: 3 + (i % 4) * 2,
      vx: levelConfig.particleMode === 'petals' ? -14 + (i % 5) * 6 : (i % 3) * 5 - 5,
      vy:
        levelConfig.particleMode === 'stars'
          ? 0
          : levelConfig.particleMode === 'fireflies'
            ? -8 - (i % 4) * 4
            : 20 + (i % 5) * 8,
      rot: i * 0.7,
      vr: ((i % 2) * 2 - 1) * 1.1,
      phase: i * 0.9,
    }));

    const spawnEntity = () => {
      const magnetAlreadyPresent =
        magnetTimerRef.current > 0 || entities.some((e) => e.kind === 'magnet');

      const roll = Math.random();
      let kind: CartoonSpriteKind = 'chocolate';
      if (roll < 0.012) {
        kind = 'blueKey';
      } else if (roll < levelConfig.obstacleChance + 0.012) {
        kind = 'obstacle';
      } else if (!magnetAlreadyPresent && Math.random() < 0.08) {
        kind = 'magnet';
      } else {
        const goodRoll = Math.random();
        if (goodRoll < 0.28) kind = 'cat';
        else if (goodRoll < 0.64) kind = 'rose';
        else kind = 'chocolate';
      }

      const cfg = ITEM_CONFIG[kind];
      const radius = kind === 'obstacle' ? 30 : kind === 'magnet' ? 28 : kind === 'blueKey' ? 22 : 27;
      const baseSpeed =
        kind === 'cat'
          ? 245
          : kind === 'rose'
            ? 220
            : kind === 'chocolate'
              ? 198
              : kind === 'magnet'
                ? 190
                : kind === 'blueKey'
                  ? 165
                  : 270;

      const x = radius + 16 + Math.random() * Math.max(40, width - (radius + 16) * 2);
      const hasZigzag = Math.random() < 0.45;

      entities.push({
        id: nextEntityId++,
        kind,
        baseX: x,
        x,
        y: -radius - 12,
        vy: (baseSpeed + Math.random() * 55) * levelConfig.speedMultiplier,
        vx: (Math.random() - 0.5) * (30 + levelConfig.windStrength),
        zigzagAmp: hasZigzag ? (kind === 'obstacle' ? 42 : 58) + Math.random() * 28 : 0,
        zigzagFreq: 2.2 + Math.random() * 1.6,
        zigzagPhase: Math.random() * Math.PI * 2,
        radius,
        rotation: 0,
        vr: (Math.random() - 0.5) * 2.1,
        points: cfg.points,
      });
    };

    const spawnBurst = (x: number, y: number, kind: CartoonSpriteKind) => {
      const palette =
        kind === 'cat'
          ? ['#FBBF24', '#FDE047', '#FB7185']
          : kind === 'rose'
            ? ['#F43F5E', '#FDA4AF', '#FFFFFF']
            : kind === 'chocolate'
              ? ['#D97706', '#FBBF24', '#F472B6']
              : kind === 'magnet'
                ? ['#38BDF8', '#06B6D4', '#FDE047']
                : ['#94A3B8', '#64748B', '#FACC15'];

      for (let i = 0; i < 14; i++) {
        const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.25;
        const speed = 75 + Math.random() * 145;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 40,
          life: 0,
          maxLife: 0.5 + Math.random() * 0.3,
          size: 5 + Math.random() * 5,
          color: palette[i % palette.length],
          shape: kind === 'obstacle' ? 'circle' : i % 2 === 0 ? 'star' : 'heart',
          gravity: 210,
        });
      }
    };

    const spawnRunningStars = (px: number, py: number, vx: number) => {
      const dirSign = vx >= 0 ? -1 : 1;
      const colors = ['#FDE047', '#F9A8D4', '#6EE7B7', '#FFFFFF'];
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: px + dirSign * (18 + Math.random() * 16),
          y: py + (Math.random() - 0.3) * 18,
          vx: dirSign * (45 + Math.random() * 55),
          vy: -30 - Math.random() * 45,
          life: 0,
          maxLife: 0.45 + Math.random() * 0.15,
          size: i === 0 ? 7.5 : 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: i === 0 ? 'star' : 'circle',
          gravity: 40,
        });
      }
    };

    let lastTime = performance.now();
    let rafId = 0;
    let totalElapsed = 0;

    const step = (now: number) => {
      const dt = Math.min(0.045, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      if (lastResetCount !== resetSignalRef.current) {
        lastResetCount = resetSignalRef.current;
        entities = [];
        particles = [];
        popups = [];
        player.x = width / 2;
        player.vx = 0;
        player.catchBounce = 0;
        player.hurtShake = 0;
        player.invulnTimer = 0;
        player.happyTimer = 0;
        player.bubbleTimer = 0;
      }

      if (reviveRequestRef.current) {
        reviveRequestRef.current = false;
        isGameOverRef.current = false;
        player.invulnTimer = 3;
        player.hurtShake = 0;
        player.bubbleText = 'رجعنا للمغامرة! 💙';
        player.bubbleTone = 'magnet';
        player.bubbleTimer = 1.6;
      }

      if (!isPausedRef.current && !victoryFiredRef.current && !isGameOverRef.current) {
        totalElapsed += dt;
        const normalPlayerSize = Math.min(138, Math.max(96, width * 0.145));
        if (dashTimerRef.current > 0) dashTimerRef.current = Math.max(0, dashTimerRef.current - dt);
        if (jumpTimerRef.current > 0) jumpTimerRef.current = Math.max(0, jumpTimerRef.current - dt);
        if (slideTimerRef.current > 0) slideTimerRef.current = Math.max(0, slideTimerRef.current - dt);
        player.size = slideTimerRef.current > 0 ? normalPlayerSize * 0.76 : normalPlayerSize;

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

        if (player.invulnTimer > 0) player.invulnTimer = Math.max(0, player.invulnTimer - dt);
        if (player.happyTimer > 0) player.happyTimer = Math.max(0, player.happyTimer - dt);
        if (player.bubbleTimer > 0) player.bubbleTimer = Math.max(0, player.bubbleTimer - dt);

        // Smooth Horizontal Player Physics
        const maxSpeed = (dashTimerRef.current > 0 ? 930 : 620) * characterSpeedBonus;
        let moveDir = 0;
        if (keysRef.current.left) moveDir -= 1;
        if (keysRef.current.right) moveDir += 1;

        if (moveDir !== 0) {
          player.vx += (moveDir * maxSpeed - player.vx) * Math.min(1, dt * 15);
        } else if (pointerTargetXRef.current !== null) {
          const dx = pointerTargetXRef.current - player.x;
          if (Math.abs(dx) > 4) {
            player.vx = Math.max(-maxSpeed * 1.3, Math.min(maxSpeed * 1.3, dx * 12));
          } else {
            player.vx *= Math.pow(0.001, dt);
          }
        } else {
          player.vx *= Math.pow(0.0008, dt);
        }

        const halfPlayer = player.size * 0.42;
        player.x = Math.max(halfPlayer, Math.min(width - halfPlayer, player.x + player.vx * dt));

        // Lively bounce & star trail while moving
        const speedNorm = Math.min(1, Math.abs(player.vx) / 220);
        player.bouncePhase += dt * (3.2 + speedNorm * 9.5);
        if (player.catchBounce > 0) player.catchBounce = Math.max(0, player.catchBounce - dt * 3.5);
        if (player.hurtShake > 0) player.hurtShake = Math.max(0, player.hurtShake - dt * 3.2);
        if (shakeRef.current > 0) shakeRef.current = Math.max(0, shakeRef.current - dt * 28);

        if (Math.abs(player.vx) > 95) {
          trailAccumulator += dt;
          if (trailAccumulator >= 0.07) {
            trailAccumulator = 0;
            spawnRunningStars(player.x, height - 28, player.vx);
          }
        }

        // Spawn Falling Items
        spawnAccumulator += dt;
        if (spawnAccumulator >= levelConfig.spawnIntervalSec) {
          spawnAccumulator = 0;
          spawnEntity();
        }

        // Update Falling Items, Magnet Pull & Collisions
        const activeJumpHeight = jumpTimerRef.current > 0 ? Math.sin((jumpTimerRef.current / 0.68) * Math.PI) * 104 : 0;
        const playerCenterY = height - player.size * 0.5 - 16 - activeJumpHeight;
        const catchRadiusX = player.size * 0.46;
        const catchRadiusY = player.size * 0.46;
        const magnetActive = magnetTimerRef.current > 0;

        const surviving: FallingEntity[] = [];
        for (const item of entities) {
          item.y += item.vy * dt;
          item.baseX += item.vx * dt;
          item.rotation += item.vr * dt;

          if (item.baseX < item.radius + 10) {
            item.baseX = item.radius + 10;
            item.vx = Math.abs(item.vx);
          } else if (item.baseX > width - item.radius - 10) {
            item.baseX = width - item.radius - 10;
            item.vx = -Math.abs(item.vx);
          }

          if (magnetActive && item.kind !== 'obstacle' && item.kind !== 'magnet') {
            const dxPull = player.x - item.x;
            const dyPull = playerCenterY - item.y;
            const dist = Math.hypot(dxPull, dyPull);
            if (dist < Math.max(width * 0.65, 360)) {
              const pullSpeed = 520;
              const stepX = (dxPull / Math.max(10, dist)) * pullSpeed * dt;
              const stepY = (dyPull / Math.max(10, dist)) * pullSpeed * 0.72 * dt;
              item.baseX += stepX;
              item.x += stepX;
              item.y += stepY;
            } else {
              const zig =
                item.zigzagAmp > 0
                  ? Math.sin(totalElapsed * item.zigzagFreq + item.zigzagPhase) * item.zigzagAmp
                  : 0;
              item.x = Math.max(item.radius, Math.min(width - item.radius, item.baseX + zig));
            }
          } else {
            const zig =
              item.zigzagAmp > 0
                ? Math.sin(totalElapsed * item.zigzagFreq + item.zigzagPhase) * item.zigzagAmp
                : 0;
            item.x = Math.max(item.radius, Math.min(width - item.radius, item.baseX + zig));
          }

          const hitX = Math.abs(item.x - player.x) < catchRadiusX + item.radius * 0.55;
          const hitY = Math.abs(item.y - playerCenterY) < catchRadiusY + item.radius * 0.55;

          if (hitX && hitY) {
            spawnBurst(item.x, item.y, item.kind);

            if (item.kind === 'obstacle') {
              if (player.invulnTimer <= 0) {
                const nextScore = Math.max(0, scoreRef.current + item.points);
                scoreRef.current = nextScore;
                comboRef.current = 0;
                comboTimerRef.current = 0;
                countsRef.current.obstaclesHit += 1;
                heartsRef.current = Math.max(0, heartsRef.current - 1);
                player.invulnTimer = 1.15 + characterShieldBonus;
                player.hurtShake = 1;
                player.happyTimer = 0;
                player.bubbleText = 'أوه لا! ⚡';
                player.bubbleTone = 'bad';
                player.bubbleTimer = 1.3;
                shakeRef.current = 11;

                soundEngine.playObstacleHit();
                popups.push({
                  x: item.x,
                  y: item.y - 12,
                  text: '-1 ❤️',
                  color: '#E11D48',
                  life: 0,
                  maxLife: 0.9,
                });

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
            } else if (item.kind === 'blueKey') {
              saveWorld((current) => ({ ...current, blueKeys: current.blueKeys + 1 }));
              player.catchBounce = 1;
              player.happyTimer = 1.1;
              player.bubbleText = 'مفتاح أزرق نادر! 🔑';
              player.bubbleTone = 'magnet';
              player.bubbleTimer = 1.5;
              soundEngine.playMagnetCollect();
              popups.push({ x: item.x, y: item.y - 12, text: '+1 مفتاح أزرق', color: '#2563EB', life: 0, maxLife: 1.1 });
            } else if (item.kind === 'magnet') {
              magnetTimerRef.current = MAGNET_DURATION_SEC;
              setMagnetSecondsLeft(Math.ceil(MAGNET_DURATION_SEC));
              player.catchBounce = 1;
              player.happyTimer = 0.95;
              player.bubbleText = 'مغناطيس سحري! 🧲';
              player.bubbleTone = 'magnet';
              player.bubbleTimer = 1.35;
              shakeRef.current = Math.max(shakeRef.current, 4.5);
              soundEngine.playMagnetCollect();
              popups.push({
                x: item.x,
                y: item.y - 12,
                text: 'جذب سحري! 🧲',
                color: '#0284C7',
                life: 0,
                maxLife: 0.95,
              });
            } else {
              comboRef.current += 1;
              comboTimerRef.current = COMBO_WINDOW_SEC;
              const multiplier = getComboMultiplier(comboRef.current);
              const earned = Math.round(item.points * multiplier);
              const nextScore = scoreRef.current + earned;
              scoreRef.current = nextScore;

              if (item.kind === 'cat') countsRef.current.cats += 1;
              if (item.kind === 'rose') countsRef.current.roses += 1;
              if (item.kind === 'chocolate') countsRef.current.chocolates += 1;

              player.catchBounce = 1;
              player.happyTimer = 0.85;

              const quotePool =
                item.kind === 'cat'
                  ? CAT_QUOTES
                  : item.kind === 'rose'
                    ? ROSE_QUOTES
                    : CHOCO_QUOTES;
              player.bubbleText = quotePool[Math.floor(Math.random() * quotePool.length)];
              player.bubbleTone = 'good';
              player.bubbleTimer = 1.15;

              shakeRef.current = Math.max(shakeRef.current, item.kind === 'cat' ? 4.5 : 2.5);
              soundEngine.playCollect(item.kind, comboRef.current);
              callbacksRef.current.onHighScoreUpdate(nextScore);

              popups.push({
                x: item.x,
                y: item.y - 12,
                text: `+${earned}${multiplier > 1 ? ` (×${multiplier})` : ''}`,
                color:
                  item.kind === 'cat'
                    ? '#D97706'
                    : item.kind === 'rose'
                      ? '#E11D48'
                      : '#78350F',
                life: 0,
                maxLife: 0.85,
              });

              setScore(scoreRef.current);
              setCombo(comboRef.current);
              setCounts({ ...countsRef.current });

              const totalCollected = countsRef.current.cats + countsRef.current.roses + countsRef.current.chocolates;
              if (totalCollected > 0 && totalCollected % 10 === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                const shout = new SpeechSynthesisUtterance('جودي!');
                shout.lang = 'ar-EG'; shout.pitch = 1.2; shout.rate = 0.9;
                const voices = window.speechSynthesis.getVoices();
                const female = voices.find((voice) => /female|woman|zira|samantha|aria|salma|laila/i.test(voice.name)) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('ar'));
                if (female) shout.voice = female;
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(shout);
              }

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

          if (item.y < height + 56) {
            surviving.push(item);
          }
        }
        entities = surviving;

        particles = particles.filter((p) => {
          p.life += dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += p.gravity * dt;
          return p.life < p.maxLife;
        });

        popups = popups.filter((pop) => {
          pop.life += dt;
          pop.y -= 52 * dt;
          return pop.life < pop.maxLife;
        });

        for (const amb of ambientItems) {
          amb.x += amb.vx * dt;
          amb.y += amb.vy * dt;
          amb.rot += amb.vr * dt;
          amb.phase += dt * 3;
          if (amb.y > height + 15) {
            amb.y = -15;
            amb.x = Math.random() * width;
          } else if (amb.y < -15) {
            amb.y = height + 15;
            amb.x = Math.random() * width;
          }
          if (amb.x < -15) amb.x = width + 15;
          if (amb.x > width + 15) amb.x = -15;
        }
      }

      // === RENDER 2D ARCADE STAGE ===
      ctx.save();
      ctx.scale(dpr, dpr);

      if (shakeRef.current > 0.2) {
        const sx = (Math.random() - 0.5) * shakeRef.current * 1.8;
        const sy = (Math.random() - 0.5) * shakeRef.current * 1.4;
        ctx.translate(sx, sy);
      }

      // 1. Anime Biome Backdrop with Parallax
      if (bgRef.current && bgRef.current.complete && bgRef.current.naturalWidth > 0) {
        const img = bgRef.current;
        const scale = Math.max(width / img.width, height / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const parallaxX = (player.x / Math.max(1, width) - 0.5) * -22;
        const drawX = (width - drawW) / 2 + parallaxX;
        const drawY = (height - drawH) / 2;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        ctx.fillStyle = levelConfig.tintOverlay;
        ctx.fillRect(0, 0, width, height);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, levelConfig.isNight ? '#1E1B4B' : '#FCE7F3');
        grad.addColorStop(1, levelConfig.isNight ? '#312E81' : '#DCFCE7');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Soft Grass / Pathway Floor Strip at Bottom
      const floorGrad = ctx.createLinearGradient(0, height - 36, 0, height);
      floorGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      floorGrad.addColorStop(
        1,
        levelConfig.isNight ? 'rgba(30, 27, 75, 0.55)' : 'rgba(255, 241, 242, 0.72)',
      );
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, height - 36, width, 36);

      // 2. Ambient World Particles
      for (const amb of ambientItems) {
        ctx.save();
        if (levelConfig.particleMode === 'stars') {
          const twinkle = 0.45 + 0.55 * Math.sin(amb.phase);
          ctx.globalAlpha = twinkle;
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          ctx.arc(amb.x, amb.y, amb.size * 0.65, 0, Math.PI * 2);
          ctx.fill();
        } else if (levelConfig.particleMode === 'fireflies') {
          const glow = 0.4 + 0.6 * Math.sin(amb.phase);
          ctx.globalAlpha = glow;
          ctx.fillStyle = '#A7F3D0';
          ctx.beginPath();
          ctx.arc(amb.x, amb.y, amb.size * 0.65, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.translate(amb.x, amb.y);
          ctx.rotate(amb.rot);
          ctx.fillStyle = 'rgba(251, 182, 206, 0.78)';
          ctx.beginPath();
          ctx.ellipse(0, 0, amb.size, amb.size * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. Crisp Cartoon SVG Falling Collectibles & Storm Clouds
      for (const item of entities) {
        const cfg = ITEM_CONFIG[item.kind];
        const svgImg = cartoonSpritesRef.current[item.kind];

        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation * 0.45);

        // Soft glowing halo behind item
        ctx.fillStyle = cfg.halo;
        ctx.beginPath();
        ctx.arc(0, 0, item.radius + 7, 0, Math.PI * 2);
        ctx.fill();

        if (svgImg && svgImg.complete && svgImg.naturalWidth > 0) {
          const drawSize = item.radius * 2.15;
          ctx.drawImage(svgImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        } else {
          ctx.fillStyle = cfg.fallbackColor;
          ctx.beginPath();
          ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // 4. Player Character — Crisp Animated Anime Sprite of Joudy
      const isMoving = Math.abs(player.vx) > 25;
      const basePlayerY = height - player.size * 0.5 - 16;
      const runHop = isMoving ? Math.abs(Math.sin(player.bouncePhase)) * 9 : 0;
      const idleBreathY = isMoving ? 0 : Math.sin(player.bouncePhase) * 3;
      const catchJump = Math.sin(player.catchBounce * Math.PI) * 20;
      const manualJump = jumpTimerRef.current > 0 ? Math.sin((jumpTimerRef.current / 0.68) * Math.PI) * 104 : 0;
      const hurtOffset = Math.sin(player.hurtShake * Math.PI * 6) * 8 * player.hurtShake;
      const tilt = (player.vx / 620) * 0.16;

      const drawPlayerX = player.x + hurtOffset;
      const drawPlayerY = basePlayerY - manualJump - catchJump - runHop + idleBreathY;

      // Ground Contact Shadow glued directly underneath Joudy
      const heightRatio = Math.min(0.82, (manualJump + catchJump + runHop) / 150);
      ctx.save();
      ctx.fillStyle = levelConfig.isNight ? 'rgba(15, 23, 42, 0.5)' : 'rgba(136, 19, 55, 0.24)';
      ctx.beginPath();
      ctx.ellipse(
        drawPlayerX,
        height - 13,
        player.size * 0.36 * (1 - heightRatio * 0.3),
        8 * (1 - heightRatio * 0.3),
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();

      // Magic Magnet Glowing Cyan Aura around Joudy
      if (magnetTimerRef.current > 0) {
        ctx.save();
        ctx.translate(drawPlayerX, drawPlayerY);
        const pulse = 1 + Math.sin(totalElapsed * 9) * 0.08;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, player.size * 0.56 * pulse, totalElapsed * 2.5, totalElapsed * 2.5 + Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Blue revive protection aura (three-second grace period after spending a key)
      if (player.invulnTimer > 1.4) {
        ctx.save();
        ctx.translate(drawPlayerX, drawPlayerY);
        const shieldPulse = 1 + Math.sin(totalElapsed * 12) * 0.045;
        ctx.strokeStyle = 'rgba(59,130,246,.9)';
        ctx.fillStyle = 'rgba(96,165,250,.11)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, player.size * 0.58 * shieldPulse, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }

      // Draw Joudy Anime Sprite (with invulnerability blink when recently hit)
      const isVisible = player.invulnTimer <= 0 || Math.floor(player.invulnTimer * 16) % 2 === 0;
      if (isVisible) {
        ctx.save();
        ctx.translate(drawPlayerX, drawPlayerY);
        ctx.rotate(tilt);

        // Breathing & Squash-Stretch
        const breathScaleY = isMoving
          ? 1 + (Math.abs(Math.sin(player.bouncePhase)) - 0.5) * 0.06
          : 1 + Math.sin(player.bouncePhase) * 0.03;
        const breathScaleX = 1 - (breathScaleY - 1) * 0.55;
        ctx.scale(breathScaleX, breathScaleY);

        // Soft Radiant Backdrop Aura
        const auraGrad = ctx.createRadialGradient(
          0,
          0,
          player.size * 0.12,
          0,
          0,
          player.size * 0.64,
        );
        auraGrad.addColorStop(
          0,
          levelConfig.isNight ? 'rgba(196, 181, 253, 0.5)' : 'rgba(167, 243, 208, 0.48)',
        );
        auraGrad.addColorStop(0.6, 'rgba(253, 164, 175, 0.28)');
        auraGrad.addColorStop(1, 'rgba(253, 164, 175, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, player.size * 0.64, 0, Math.PI * 2);
        ctx.fill();

        if (spriteRef.current && spriteRef.current.complete && spriteRef.current.naturalWidth > 0) {
          const sImg = spriteRef.current;
          const aspect = sImg.width / Math.max(1, sImg.height);
          const drawH = player.size;
          const drawW = drawH * aspect;
          ctx.filter = characterFilter || 'none';
          ctx.drawImage(sImg, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.filter = 'none';
        } else {
          ctx.fillStyle = '#FB7185';
          ctx.beginPath();
          ctx.arc(0, 0, player.size * 0.36, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cute Happy Hearts/Stars or Shocked Dizzy Reaction right beside her head
        if (player.hurtShake > 0.1 || player.invulnTimer > 0.45) {
          ctx.font = '800 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💫', -player.size * 0.36, -player.size * 0.34);
          ctx.fillText('⚡', player.size * 0.36, -player.size * 0.34);
        } else if (player.happyTimer > 0) {
          drawHeartShape(
            ctx,
            -player.size * 0.36,
            -player.size * 0.36,
            15,
            '#F43F5E',
            Math.min(1, player.happyTimer * 2),
          );
          drawStarShape(
            ctx,
            player.size * 0.38,
            -player.size * 0.36,
            9,
            '#FBBF24',
            Math.min(1, player.happyTimer * 2),
            totalElapsed * 4,
          );
        }

        ctx.restore();
      }

      // Cute Cartoon Speech Bubble directly above Joudy's head
      if (player.bubbleTimer > 0 && player.bubbleText) {
        ctx.save();
        const bubbleAlpha = Math.min(1, player.bubbleTimer * 2.5);
        ctx.globalAlpha = bubbleAlpha;
        ctx.font = '800 14px var(--font-cairo), sans-serif';
        const textWidth = ctx.measureText(player.bubbleText).width;
        const padX = 14;
        const boxW = textWidth + padX * 2;
        const boxH = 30;
        const bx = Math.max(boxW / 2 + 8, Math.min(width - boxW / 2 - 8, drawPlayerX));
        const by = Math.max(24, drawPlayerY - player.size * 0.62 - 14);

        ctx.fillStyle =
          player.bubbleTone === 'bad'
            ? '#1E293B'
            : player.bubbleTone === 'magnet'
              ? '#0284C7'
              : '#FFFFFF';
        ctx.strokeStyle =
          player.bubbleTone === 'bad'
            ? '#FACC15'
            : player.bubbleTone === 'magnet'
              ? '#BAE6FD'
              : '#FB7185';
        ctx.lineWidth = 2.2;

        ctx.beginPath();
        ctx.roundRect(bx - boxW / 2, by - boxH / 2, boxW, boxH, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = player.bubbleTone === 'good' ? '#BE123C' : '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.bubbleText, bx, by + 1);
        ctx.restore();
      }

      // 5. Burst Particles & Running Star Trail
      for (const p of particles) {
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        if (p.shape === 'heart') {
          drawHeartShape(ctx, p.x, p.y, p.size * 1.4, p.color, alpha);
        } else if (p.shape === 'star') {
          drawStarShape(ctx, p.x, p.y, p.size, p.color, alpha, p.life * 8);
        } else {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 6. Floating Score Popups
      for (const pop of popups) {
        const alpha = Math.max(0, 1 - pop.life / pop.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '800 18px var(--font-cairo), sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.strokeText(pop.text, pop.x, pop.y);
        ctx.fillStyle = pop.color;
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      }

      ctx.restore();
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [levelConfig, characterFilter, characterSpeedBonus, characterShieldBonus]);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPaused || isGameOver) return;
    dragPointerIdRef.current = e.pointerId;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerTargetXRef.current = e.clientX - rect.left;
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPaused || isGameOver) return;
    if (dragPointerIdRef.current !== e.pointerId && e.buttons === 0 && e.pointerType === 'mouse') {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    pointerTargetXRef.current = e.clientX - rect.left;
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragPointerIdRef.current === e.pointerId) {
      dragPointerIdRef.current = null;
    }
  };

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

  const handleRevive = useCallback(() => {
    const price = 2 ** reviveCountRef.current;
    const current = worldSave;
    if (current.blueKeys < price) return;
    saveWorld((latest) => ({ ...latest, blueKeys: Math.max(0, latest.blueKeys - price), reviveCountsByLevel: { ...latest.reviveCountsByLevel, [levelConfig.level]: reviveCountRef.current + 1 } }));
    reviveCountRef.current += 1;
    heartsRef.current = 1;
    setHearts(1);
    reviveRequestRef.current = true;
    isGameOverRef.current = false;
    setIsGameOver(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const shout = new SpeechSynthesisUtterance('جودي!');
      shout.lang = 'ar-EG'; shout.pitch = 1.2; shout.rate = 0.9;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(shout);
    }
  }, [worldSave, levelConfig.level]);

  const handleJoystickChange = useCallback((vector: JoystickVector) => {
    keysRef.current.left = vector.x < -0.18;
    keysRef.current.right = vector.x > 0.18;
    pointerTargetXRef.current = null;
    if (keysRef.current.left && !keysRef.current.right) setActiveControl('left');
    else if (keysRef.current.right && !keysRef.current.left) setActiveControl('right');
    else setActiveControl(null);
  }, []);

  const triggerDash = useCallback(() => {
    if (isPausedRef.current || isGameOverRef.current || dashTimerRef.current > 0) return;
    dashTimerRef.current = 0.65;
    setDashActive(true);
    window.setTimeout(() => setDashActive(false), 680);
  }, []);

  const triggerJump = useCallback(() => {
    if (isPausedRef.current || isGameOverRef.current || jumpTimerRef.current > 0.1) return;
    jumpTimerRef.current = 0.68;
    setJumpActive(true);
    window.setTimeout(() => setJumpActive(false), 700);
  }, []);

  const triggerSlide = useCallback(() => {
    if (isPausedRef.current || isGameOverRef.current || slideTimerRef.current > 0) return;
    slideTimerRef.current = 1.35;
    setSlideActive(true);
    window.setTimeout(() => setSlideActive(false), 1380);
  }, []);

  const progressPct = Math.min(100, Math.round((score / levelConfig.targetScore) * 100));
  const displayedHighScore = Math.max(highScore, score);
  const comboMultiplier = getComboMultiplier(combo);

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-none mx-auto px-1 sm:px-2 py-1 flex flex-col gap-2 h-[100dvh] max-h-none min-h-[520px]"
    >
      {/* Compact Top Arcade HUD */}
      <header className="bg-slate-950/75 backdrop-blur-xl border border-white/10 rounded-2xl px-3 sm:px-5 py-2.5 shadow-sm flex items-center justify-between gap-3 shrink-0">
        {realImageSrc && (
          <div className="hidden sm:block relative w-11 h-11 rounded-xl overflow-hidden border-2 border-amber-300 bg-rose-50 shrink-0 shadow-xs">
            <Image
              src={realImageSrc}
              alt="جودي"
              fill
              sizes="44px"
              referrerPolicy="no-referrer"
              className="object-cover object-center"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs sm:text-sm mb-1.5">
            <div className="flex items-center gap-2 font-bold text-[#2D1824] whitespace-nowrap">
              <span className="text-rose-700">المستوى {levelConfig.level}</span>
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

              {/* 3 Health Lives */}
              <div
                className="inline-flex items-center gap-0.5 mr-1"
                aria-label={`قلوب الحياة: ${hearts} من ${MAX_HEARTS}`}
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

              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-1 text-xs font-extrabold text-blue-100" title="المفاتيح الزرقاء"><KeyRound className="h-3.5 w-3.5" />{worldSave.blueKeys}</span>
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

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
            className="w-10 h-10 rounded-xl border border-cyan-200/25 bg-cyan-500/15 hover:bg-cyan-400/25 text-cyan-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            aria-label={isPaused ? 'استئناف اللعب' : 'إيقاف مؤقت'}
            className="w-10 h-10 rounded-xl border border-amber-200/25 bg-amber-500/15 hover:bg-amber-400/25 text-amber-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onExitToMap}
            aria-label="العودة لخريطة المستويات"
            className="w-10 h-10 rounded-xl border border-violet-200/25 bg-violet-500/15 hover:bg-violet-400/25 text-violet-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <MapIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main 2D Canvas Playfield + Circular Translucent Touch D-Pad */}
      <div
        ref={stageRef}
        className={`relative flex-1 min-h-[360px] rounded-none sm:rounded-2xl overflow-hidden border-0 shadow-none sm:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] select-none touch-none ${
          levelConfig.worldId === 2
            ? 'border-emerald-300/90 bg-emerald-50'
            : levelConfig.isNight
              ? 'border-indigo-300/80 bg-indigo-950'
              : 'border-rose-200/90 bg-pink-50'
        }`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        />

        {/* Framer Motion Biome Atmosphere Layer */}
        {!isPaused && !isGameOver && (
          <WorldAtmosphereOverlay worldId={levelConfig.worldId} variant="arena" />
        )}

        {/* Controls: user-selectable classic arrows or analog joystick */}
        {!isPaused && !isGameOver && (
          <>
            {controlMode === 'joystick' ? (
              <div className="absolute bottom-3 left-3 z-20">
                <VirtualJoystick onChange={handleJoystickChange} disabled={isPaused || isGameOver} />
              </div>
            ) : (
              <>
                <button type="button" aria-label="التحرك لليسار" onContextMenu={(e) => e.preventDefault()} onPointerDown={(e) => handleTouchPress('left', e)} onPointerUp={(e) => handleTouchRelease('left', e)} onPointerCancel={(e) => handleTouchRelease('left', e)} onLostPointerCapture={(e) => handleTouchRelease('left', e)} className={`absolute left-3 bottom-3 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-white/30 text-white backdrop-blur-md transition ${activeControl === 'left' ? 'scale-90 bg-cyan-400/80' : 'bg-slate-950/35 hover:bg-slate-950/55'}`}><ChevronLeft className="h-8 w-8" /></button>
                <button type="button" aria-label="التحرك لليمين" onContextMenu={(e) => e.preventDefault()} onPointerDown={(e) => handleTouchPress('right', e)} onPointerUp={(e) => handleTouchRelease('right', e)} onPointerCancel={(e) => handleTouchRelease('right', e)} onLostPointerCapture={(e) => handleTouchRelease('right', e)} className={`absolute right-3 bottom-3 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-white/30 text-white backdrop-blur-md transition ${activeControl === 'right' ? 'scale-90 bg-cyan-400/80' : 'bg-slate-950/35 hover:bg-slate-950/55'}`}><ChevronRight className="h-8 w-8" /></button>
              </>
            )}
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              <button type="button" onClick={triggerJump} disabled={jumpActive} title="قفزة لتفادي العقبات" className={`flex h-11 items-center gap-1.5 rounded-full border border-white/25 px-3 text-xs font-black text-white shadow-lg backdrop-blur ${jumpActive ? 'bg-amber-400/65' : 'bg-slate-950/45 hover:bg-amber-500/40'}`}><span aria-hidden="true">↟</span> قفز</button>
              <button type="button" onClick={triggerDash} disabled={dashActive} title="اندفاع سريع" className={`flex h-11 items-center gap-1.5 rounded-full border border-white/25 px-3 text-xs font-black text-white shadow-lg backdrop-blur ${dashActive ? 'bg-cyan-400/65' : 'bg-slate-950/45 hover:bg-cyan-500/40'}`}><Zap className="h-4 w-4" /> اندفاع</button>
              <button type="button" onClick={triggerSlide} disabled={slideActive} title="انزلاق مؤقت لتقليل مساحة الاصطدام" className={`flex h-11 items-center gap-1.5 rounded-full border border-white/25 px-3 text-xs font-black text-white shadow-lg backdrop-blur ${slideActive ? 'bg-violet-400/65' : 'bg-slate-950/45 hover:bg-violet-500/40'}`}><Waves className="h-4 w-4" /> انزلاق</button>
            </div>
          </>
        )}

        {/* Pause Overlay */}
        {isPaused && !isGameOver && (
          <div className="absolute inset-0 z-30 bg-[#2D1824]/45 backdrop-blur-xs flex items-center justify-center p-4">
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
                  خريطة المستويات
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over (3 Hearts Depleted) Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 z-30 bg-[#1B1018]/65 backdrop-blur-xs flex items-center justify-center p-4">
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
                الغيوم المشاكسة كانت أسرع في المستوى {levelConfig.level}! جمعتِ{' '}
                <span className="font-bold text-rose-600 tabular-nums">{score}</span> نقطة من{' '}
                <span className="font-bold tabular-nums">{levelConfig.targetScore}</span>. حاولي مرة أخرى!
              </p>
              <div className="flex flex-col gap-2.5 pt-1">
                {worldSave.blueKeys >= 2 ** reviveCountRef.current && (
                  <button type="button" onClick={handleRevive} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-black text-white shadow-lg transition hover:bg-blue-500">
                    <KeyRound className="h-4 w-4" /> استمر بمفتاح أزرق ({2 ** reviveCountRef.current})
                  </button>
                )}
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

    </motion.section>
  );
}
