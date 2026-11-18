'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
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
  KeyRound,
  Coins,
  HeartCrack,
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
import { addWorldCoins, saveWorld, useWorldSave } from '@/lib/joudyWorld';

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
  characterSpriteSrc?: string;
  outfitSpriteSrc?: string;
  shoeSpriteSrc?: string;
  highScore: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
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
  enemyVariant?: number;
  shotCooldown?: number;
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
  enemyCloud: { points: -15, halo: 'rgba(99, 102, 241, 0.34)', fallbackColor: '#6366F1' },
  enemyShot: { points: -10, halo: 'rgba(249, 115, 22, 0.34)', fallbackColor: '#F97316' },
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

function drawEnemyCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  variant: number,
  rotation: number,
  elapsed: number,
) {
  const palettes = [
    { body: '#64748B', light: '#CBD5E1', dark: '#1E293B', eye: '#F8FAFC' },
    { body: '#7C3AED', light: '#DDD6FE', dark: '#3B0764', eye: '#FFF7ED' },
    { body: '#0F766E', light: '#99F6E4', dark: '#134E4A', eye: '#F0FDFA' },
  ];
  const palette = palettes[variant % palettes.length];
  const pulse = 1 + Math.sin(elapsed * 5 + variant) * 0.035;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation * 0.18);
  ctx.scale(pulse, 1 / pulse);
  ctx.shadowColor = palette.dark;
  ctx.shadowBlur = 13;
  ctx.shadowOffsetY = 4;
  const gradient = ctx.createLinearGradient(0, -radius, 0, radius);
  gradient.addColorStop(0, palette.light);
  gradient.addColorStop(0.48, palette.body);
  gradient.addColorStop(1, palette.dark);
  ctx.fillStyle = gradient;
  ctx.strokeStyle = palette.dark;
  ctx.lineWidth = Math.max(2.5, radius * 0.09);
  ctx.beginPath();
  ctx.moveTo(-radius * 0.76, radius * 0.34);
  ctx.bezierCurveTo(-radius * 1.02, radius * 0.03, -radius * 0.78, -radius * 0.48, -radius * 0.38, -radius * 0.43);
  ctx.bezierCurveTo(-radius * 0.20, -radius * 1.03, radius * 0.46, -radius * 0.91, radius * 0.53, -radius * 0.34);
  ctx.bezierCurveTo(radius * 1.02, -radius * 0.31, radius * 1.02, radius * 0.36, radius * 0.58, radius * 0.47);
  ctx.lineTo(-radius * 0.52, radius * 0.47);
  ctx.bezierCurveTo(-radius * 0.72, radius * 0.48, -radius * 0.84, radius * 0.42, -radius * 0.76, radius * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (variant === 1) {
    ctx.fillStyle = '#C4B5FD';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.44, -radius * 0.42);
    ctx.lineTo(-radius * 0.58, -radius * 0.92);
    ctx.lineTo(-radius * 0.12, -radius * 0.58);
    ctx.closePath();
    ctx.moveTo(radius * 0.22, -radius * 0.58);
    ctx.lineTo(radius * 0.57, -radius * 0.92);
    ctx.lineTo(radius * 0.54, -radius * 0.35);
    ctx.closePath();
    ctx.fill();
  } else if (variant === 2) {
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = Math.max(2, radius * 0.07);
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.58);
    ctx.lineTo(radius * 0.05, -radius * 0.94);
    ctx.stroke();
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.arc(radius * 0.05, -radius * 0.96, radius * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = palette.eye;
  ctx.beginPath();
  ctx.ellipse(-radius * 0.23, radius * 0.02, radius * 0.105, radius * 0.15, -0.12, 0, Math.PI * 2);
  ctx.ellipse(radius * 0.25, radius * 0.02, radius * 0.105, radius * 0.15, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(-radius * 0.20, radius * 0.045, radius * 0.055, 0, Math.PI * 2);
  ctx.arc(radius * 0.28, radius * 0.045, radius * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = palette.dark;
  ctx.lineWidth = Math.max(2, radius * 0.065);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-radius * 0.39, -radius * 0.18);
  ctx.lineTo(-radius * 0.12, -radius * 0.12);
  ctx.moveTo(radius * 0.12, -radius * 0.12);
  ctx.lineTo(radius * 0.4, -radius * 0.18);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(radius * 0.04, radius * 0.30, radius * 0.16, 0.12, Math.PI - 0.12);
  ctx.stroke();
  ctx.restore();
}

function drawEnemyShot(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, rotation: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(249, 115, 22, 0.85)';
  ctx.shadowBlur = 15;
  drawStarShape(ctx, x, y, radius * 1.15, '#F97316', 1, rotation);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFF7ED';
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export default function GameArena({
  levelConfig,
  realImageSrc,
  animeImageSrc,
  characterSpriteSrc,
  outfitSpriteSrc,
  shoeSpriteSrc,
  highScore,
  soundEnabled,
  onToggleSound,
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
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const isPausedRef = useRef(false);
  const isGameOverRef = useRef(false);
  const victoryFiredRef = useRef(false);
  const pointerTargetXRef = useRef<number | null>(null);
  const pointerTargetYRef = useRef<number | null>(null);
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
  const reviveRequestRef = useRef(false);
  const reviveCountRef = useRef(worldSave.reviveCountsByLevel[levelConfig.level] ?? 0);

  const spriteRef = useRef<HTMLImageElement | null>(null);
  const outfitSpriteRef = useRef<HTMLImageElement | null>(null);
  const shoeSpriteRef = useRef<HTMLImageElement | null>(null);
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

    const activeSpriteSrc = characterSpriteSrc || animeImageSrc;
    const rawFallback = new window.Image();
    rawFallback.onload = () => {
      if (active && !spriteRef.current) spriteRef.current = rawFallback;
    };
    rawFallback.src = activeSpriteSrc;

    loadTransparentSprite(activeSpriteSrc)
      .then(({ image }) => {
        if (active) spriteRef.current = image;
      })
      .catch(() => {
        if (active) spriteRef.current = rawFallback;
      });

    outfitSpriteRef.current = null;
    if (outfitSpriteSrc) {
      const outfitImage = new window.Image();
      outfitImage.onload = () => { if (active) outfitSpriteRef.current = outfitImage; };
      outfitImage.src = outfitSpriteSrc;
    }

    shoeSpriteRef.current = null;
    if (shoeSpriteSrc) {
      const shoeImage = new window.Image();
      shoeImage.onload = () => { if (active) shoeSpriteRef.current = shoeImage; };
      shoeImage.src = shoeSpriteSrc;
    }

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
  }, [animeImageSrc, characterSpriteSrc, outfitSpriteSrc, shoeSpriteSrc, levelConfig.bgImage]);

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
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const resetRun = useCallback(() => {
    scoreRef.current = 0;
    heartsRef.current = MAX_HEARTS;
    countsRef.current = { cats: 0, roses: 0, chocolates: 0, obstaclesHit: 0 };
    comboRef.current = 0;
    comboTimerRef.current = 0;
    magnetTimerRef.current = 0;
    reviveRequestRef.current = false;
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
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    startTimeRef.current = Date.now();

    let width = container.clientWidth || 720;
    let height = container.clientHeight || 480;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const updateCanvasSize = () => {
      width = Math.max(300, container.clientWidth);
      height = Math.max(320, container.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };
    updateCanvasSize();

    const ro = new ResizeObserver(updateCanvasSize);
    ro.observe(container);

    const player = {
      x: width / 2,
      vx: 0,
      size: Math.min(174, Math.max(124, width * 0.184)),
      y: height * 0.72,
      vy: 0,
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
      let enemyVariant: number | undefined;
      const enemyAlreadyPresent = entities.some((entity) => entity.kind === 'enemyCloud');
      // Rare cloud-monsters appear one at a time, so the field never becomes crowded.
      if (totalElapsed > 7 && !enemyAlreadyPresent && Math.random() < 0.045) {
        kind = 'enemyCloud';
        enemyVariant = Math.floor(Math.random() * 3);
      } else if (roll < 0.012) {
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
      const radius = (kind === 'obstacle' || kind === 'enemyCloud' ? 31 : kind === 'enemyShot' ? 15 : kind === 'magnet' ? 28 : kind === 'blueKey' ? 22 : 27) * 0.9;
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
                  : kind === 'enemyCloud'
                    ? 185
                    : 270;

      const x = radius + 16 + Math.random() * Math.max(40, width - (radius + 16) * 2);
      const hasZigzag = Math.random() < (kind === 'enemyCloud' ? 0.72 : 0.45);

      entities.push({
        id: nextEntityId++,
        kind,
        baseX: x,
        x,
        y: -radius - 12,
        vy: (baseSpeed + Math.random() * 55) * levelConfig.speedMultiplier,
        vx: (Math.random() - 0.5) * (30 + levelConfig.windStrength),
        zigzagAmp: hasZigzag ? (kind === 'obstacle' || kind === 'enemyCloud' ? 34 : 58) + Math.random() * 24 : 0,
        zigzagFreq: 2.2 + Math.random() * 1.6,
        zigzagPhase: Math.random() * Math.PI * 2,
        radius,
        rotation: 0,
        vr: (Math.random() - 0.5) * 2.1,
        points: cfg.points,
        enemyVariant,
        shotCooldown: enemyVariant === 2 ? 1.15 + Math.random() * 0.45 : undefined,
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
        const normalPlayerSize = Math.min(194, Math.max(138, width * 0.205));
        player.size = normalPlayerSize;

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

        // Free-flight touch movement: drag anywhere to steer horizontally and vertically.
        const maxSpeed = 920 * characterSpeedBonus;
        if (pointerTargetXRef.current !== null) {
          const dx = pointerTargetXRef.current - player.x;
          player.vx += (Math.max(-maxSpeed, Math.min(maxSpeed, dx * 12)) - player.vx) * Math.min(1, dt * 12);
        } else {
          player.vx *= Math.pow(0.0008, dt);
        }
        const targetY = pointerTargetYRef.current ?? player.y;
        const dy = targetY - player.y;
        player.vy += (Math.max(-maxSpeed * 0.78, Math.min(maxSpeed * 0.78, dy * 12)) - player.vy) * Math.min(1, dt * 12);
        const halfPlayer = player.size * 0.42;
        player.x = Math.max(halfPlayer, Math.min(width - halfPlayer, player.x + player.vx * dt));
        player.y = Math.max(player.size * 0.52, Math.min(height - player.size * 0.48, player.y + player.vy * dt));

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
        const playerCenterY = player.y;
        const catchRadiusX = player.size * 0.46;
        const catchRadiusY = player.size * 0.46;
        const magnetActive = magnetTimerRef.current > 0;

        const surviving: FallingEntity[] = [];
        const spawnedProjectiles: FallingEntity[] = [];
        for (const item of entities) {
          item.y += item.vy * dt;
          item.baseX += item.vx * dt;
          item.rotation += item.vr * dt;

          // The teal cloud variant periodically releases a small falling star.
          if (item.kind === 'enemyCloud' && item.enemyVariant === 2 && item.shotCooldown !== undefined) {
            item.shotCooldown -= dt;
            if (item.shotCooldown <= 0 && entities.filter((entity) => entity.kind === 'enemyShot').length + spawnedProjectiles.length < 2) {
              const shotX = Math.max(16, Math.min(width - 16, item.x + (Math.random() - 0.5) * 20));
              spawnedProjectiles.push({
                id: nextEntityId++, kind: 'enemyShot', baseX: shotX, x: shotX, y: item.y + item.radius * 0.72,
                vy: (310 + Math.random() * 42) * levelConfig.speedMultiplier,
                vx: item.vx * 0.18, zigzagAmp: 0, zigzagFreq: 0, zigzagPhase: 0,
                radius: 13, rotation: Math.random(), vr: (Math.random() - 0.5) * 3, points: -10,
              });
              item.shotCooldown = 1.45 + Math.random() * 0.5;
            }
          }

          if (item.baseX < item.radius + 10) {
            item.baseX = item.radius + 10;
            item.vx = Math.abs(item.vx);
          } else if (item.baseX > width - item.radius - 10) {
            item.baseX = width - item.radius - 10;
            item.vx = -Math.abs(item.vx);
          }

          const isHazard = item.kind === 'obstacle' || item.kind === 'enemyCloud' || item.kind === 'enemyShot';
          if (magnetActive && !isHazard && item.kind !== 'magnet') {
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

            if (isHazard) {
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
                player.bubbleText = item.kind === 'enemyShot' ? 'نجمة مشاكسة! ✨' : item.kind === 'enemyCloud' ? 'سحابة مشاكسة! ☁️' : 'أوه لا! ⚡';
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
            } else if (item.kind === 'cat' || item.kind === 'rose' || item.kind === 'chocolate') {
              comboRef.current += 1;
              comboTimerRef.current = COMBO_WINDOW_SEC;
              const multiplier = getComboMultiplier(comboRef.current);
              const earned = Math.round(item.points * multiplier);
              const nextScore = scoreRef.current + earned;
              scoreRef.current = nextScore;

              if (item.kind === 'cat') countsRef.current.cats += 1;
              if (item.kind === 'rose') countsRef.current.roses += 1;
              if (item.kind === 'chocolate') { countsRef.current.chocolates += 1; addWorldCoins(5); }
              if (item.kind === 'rose') addWorldCoins(8);
              if (item.kind === 'cat') addWorldCoins(12);

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
        entities = surviving.concat(spawnedProjectiles);

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

      // 1. Cinematic biome backdrop with restrained saturation and deeper contrast
      if (bgRef.current && bgRef.current.complete && bgRef.current.naturalWidth > 0) {
        const img = bgRef.current;
        ctx.filter = 'saturate(0.78) contrast(1.12) brightness(0.86)';
        const scale = Math.max(width / img.width, height / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const parallaxX = (player.x / Math.max(1, width) - 0.5) * -22;
        const drawX = (width - drawW) / 2 + parallaxX;
        const drawY = (height - drawH) / 2;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.filter = 'none';

        const cinematicShade = ctx.createLinearGradient(0, 0, 0, height);
        cinematicShade.addColorStop(0, 'rgba(10, 18, 30, 0.10)');
        cinematicShade.addColorStop(1, 'rgba(10, 18, 30, 0.28)');
        ctx.fillStyle = cinematicShade;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = levelConfig.tintOverlay;
        ctx.fillRect(0, 0, width, height);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, levelConfig.isNight ? '#1E1B4B' : '#FCE7F3');
        grad.addColorStop(1, levelConfig.isNight ? '#312E81' : '#DCFCE7');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Camera zoom-out: keep portrait screen orientation while showing a wider-feeling play field.
      // The backdrop stays full-bleed; gameplay objects are framed slightly farther away.
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(0.90, 0.90);
      ctx.translate(-width / 2, -height / 2);

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

        if (item.kind === 'enemyCloud') {
          ctx.save();
          ctx.fillStyle = cfg.halo;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius + 9, 0, Math.PI * 2);
          ctx.fill();
          drawEnemyCloud(ctx, item.x, item.y, item.radius * 1.15, item.enemyVariant ?? 0, item.rotation, totalElapsed);
          ctx.restore();
          continue;
        }
        if (item.kind === 'enemyShot') {
          drawEnemyShot(ctx, item.x, item.y, item.radius, item.rotation);
          continue;
        }

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
      const basePlayerY = player.y;
      const runHop = isMoving ? Math.abs(Math.sin(player.bouncePhase)) * 9 : 0;
      const idleBreathY = isMoving ? 0 : Math.sin(player.bouncePhase) * 3;
      const catchJump = Math.sin(player.catchBounce * Math.PI) * 20;
      const manualJump = 0;
      const hurtOffset = Math.sin(player.hurtShake * Math.PI * 6) * 8 * player.hurtShake;
      const tilt = (player.vx / 620) * 0.16;

      const drawPlayerX = player.x + hurtOffset;
      const drawPlayerY = basePlayerY - catchJump - runHop + idleBreathY;

      // Ground Contact Shadow glued directly underneath Joudy
      const heightRatio = Math.min(0.88, Math.max(0, (height - 13 - player.y) / Math.max(1, height - 13)));
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
          const outfit = outfitSpriteRef.current;
          if (outfit && outfit.complete && outfit.naturalWidth > 0) {
            ctx.drawImage(outfit, -drawW / 2, -drawH / 2, drawW, drawH);
          }
          const shoes = shoeSpriteRef.current;
          if (shoes && shoes.complete && shoes.naturalWidth > 0) {
            ctx.drawImage(shoes, -drawW / 2, -drawH / 2, drawW, drawH);
          }
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

      ctx.restore(); // camera zoom-out transform
      ctx.restore(); // frame transform
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [levelConfig, characterFilter, characterSpeedBonus, characterShieldBonus]);

  const updateTouchTarget = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerTargetXRef.current = e.clientX - rect.left;
    pointerTargetYRef.current = e.clientY - rect.top;
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPaused || isGameOver) return;
    dragPointerIdRef.current = e.pointerId;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* Pointer capture is optional */ }
    updateTouchTarget(e);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPaused || isGameOver || dragPointerIdRef.current !== e.pointerId) return;
    updateTouchTarget(e);
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragPointerIdRef.current === e.pointerId) dragPointerIdRef.current = null;
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

  }, [worldSave, levelConfig.level]);

  const progressPct = Math.min(100, Math.round((score / levelConfig.targetScore) * 100));
  const displayedHighScore = Math.max(highScore, score);
  const comboMultiplier = getComboMultiplier(combo);

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="relative left-1/2 w-screen max-w-none -translate-x-1/2 px-0 py-0 flex flex-col gap-1.5 h-[100dvh] max-h-none min-h-[520px]"
    >
      {/* Compact, responsive HUD: separate rows on phones prevent overlap. */}
      <header className="absolute left-2 right-2 top-2 z-30 grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-slate-950/85 px-2.5 py-2 shadow-[0_12px_32px_rgba(0,0,0,.35)] backdrop-blur-xl sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {realImageSrc && (
            <div className="relative hidden h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-amber-300/50 bg-slate-800 shadow sm:block">
              <Image src={realImageSrc} alt="جودي" fill sizes="40px" referrerPolicy="no-referrer" className="object-cover object-center" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <div className="flex min-w-0 items-center gap-2 font-bold text-white">
                <span className="hidden max-w-[110px] truncate text-[11px] text-slate-300 sm:inline">{levelConfig.worldName}</span>
                <span className="whitespace-nowrap text-sm font-black tabular-nums text-rose-200 sm:text-base">{score} / {levelConfig.targetScore}</span>
                {combo >= 2 && (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold tabular-nums text-amber-200"><Flame className="h-3.5 w-3.5 fill-amber-400 text-amber-300" />×{comboMultiplier}</span>
                )}
                {magnetSecondsLeft > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-sky-200"><Magnet className="h-3.5 w-3.5" />{magnetSecondsLeft}ث</span>
                )}
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-slate-300 sm:text-xs"><Trophy className="h-3.5 w-3.5 text-amber-300" />{displayedHighScore}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-rose-400 to-pink-500 shadow-[0_0_10px_rgba(244,63,94,.35)] transition-all duration-200" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-1.5 sm:justify-end sm:gap-2">
          <div className="inline-flex h-9 min-w-[64px] items-center justify-center gap-1 rounded-xl border border-amber-300/30 bg-gradient-to-b from-amber-300/20 to-amber-500/10 px-1.5 text-[11px] font-black tabular-nums text-amber-100 shadow-inner sm:min-w-[76px] sm:gap-1.5 sm:px-2 sm:text-xs" title="عملاتك الذهبية">
            <Coins className="h-4 w-4 shrink-0 text-amber-300" />{worldSave.coins.toLocaleString('en-US')}
          </div>
          <div className="inline-flex h-9 min-w-[50px] items-center justify-center gap-1 rounded-xl border border-sky-300/30 bg-gradient-to-b from-sky-300/20 to-blue-500/10 px-1.5 text-[11px] font-black tabular-nums text-sky-100 shadow-inner sm:min-w-[58px] sm:gap-1.5 sm:px-2 sm:text-xs" title="المفاتيح الزرقاء">
            <KeyRound className="h-4 w-4 shrink-0 text-sky-300" />{worldSave.blueKeys}
          </div>
          <button type="button" onClick={onToggleSound} aria-label={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-200/25 bg-cyan-400/10 text-cyan-100 shadow-sm transition hover:bg-cyan-300/20 sm:h-10 sm:w-10">
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button type="button" onClick={() => setIsPaused((p) => !p)} aria-label={isPaused ? 'استئناف اللعب' : 'إيقاف مؤقت'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-200/25 bg-amber-400/10 text-amber-100 shadow-sm transition hover:bg-amber-300/20 sm:h-10 sm:w-10">
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button type="button" onClick={onExitToMap} aria-label="العودة لخريطة المستويات" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-200/25 bg-violet-400/10 text-violet-100 shadow-sm transition hover:bg-violet-300/20 sm:h-10 sm:w-10">
            <MapIcon className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Full-width 2D flight arena — touch and drag to move in every direction */}
      <div
        ref={stageRef}
        className={`absolute inset-0 rounded-none overflow-hidden border-0 shadow-none select-none touch-none ${
          levelConfig.worldId === 2
            ? 'border-emerald-300/90 bg-emerald-50'
            : levelConfig.isNight
              ? 'border-indigo-300/80 bg-indigo-950'
              : 'border-rose-200/90 bg-pink-50'
        }`}
      >
        {/* Detached in-game HUD: level and lives sit on the play screen, not in the top bar. */}
        <div
          className="pointer-events-none absolute left-3 top-[6.9rem] z-40 text-sm font-black tracking-wide text-white drop-shadow-[0_2px_6px_rgba(0,0,0,1)] sm:left-5 sm:top-[5.25rem] sm:text-base"
          aria-label={`المستوى ${levelConfig.level}`}
        >
          المستوى {levelConfig.level}
        </div>
        <div
          className="pointer-events-none absolute right-3 top-[6.82rem] z-40 inline-flex items-center gap-1.5 sm:right-5 sm:top-[5.2rem]"
          aria-label={`قلوب الحياة: ${hearts} من ${MAX_HEARTS}`}
        >
          {[1, 2, 3].map((idx) => (
            <span key={idx} className="relative inline-flex h-6 w-6 items-center justify-center">
              <Heart className={`h-[22px] w-[22px] drop-shadow-[0_2px_4px_rgba(0,0,0,.7)] ${idx <= hearts ? 'fill-rose-500 text-rose-50' : 'fill-slate-500/70 text-slate-100/80'}`} strokeWidth={2.4} />
              {idx <= hearts && <span className="pointer-events-none absolute left-[7px] top-[5px] h-1.5 w-1.5 rounded-full bg-white/80 blur-[.2px]" />}
            </span>
          ))}
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
          className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
        />

        {/* Framer Motion Biome Atmosphere Layer */}
        {!isPaused && !isGameOver && (
          <WorldAtmosphereOverlay worldId={levelConfig.worldId} variant="arena" />
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

        {/* Professional game-over panel with a clear revive / retry choice. */}
        {isGameOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 250, damping: 22 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-b from-[#18283d] via-[#111e31] to-[#0b1423] p-5 text-center shadow-[0_24px_80px_rgba(0,0,0,.6)] sm:p-6"
            >
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/80 to-transparent" />
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-200/25 bg-gradient-to-br from-rose-500/25 to-pink-500/10 text-rose-200 shadow-[0_0_30px_rgba(244,63,94,.18)]">
                <HeartCrack className="h-8 w-8" strokeWidth={1.8} />
              </div>
              <p className="mb-1 text-[10px] font-black tracking-[.22em] text-rose-200/70">نهاية الجولة</p>
              <h3 className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>نفدت قلوبكِ</h3>
              <p className="mx-auto mt-2 max-w-[290px] text-sm leading-relaxed text-slate-300">انتهت محاولاتكِ في المستوى {levelConfig.level}. حافظي على تقدمكِ وجرّبي من جديد.</p>

              <div className="my-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
                  <span className="block text-[10px] font-bold text-slate-400">النقاط</span>
                  <strong className="mt-0.5 block text-xl font-black tabular-nums text-amber-200">{score.toLocaleString('en-US')}</strong>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
                  <span className="block text-[10px] font-bold text-slate-400">الهدف</span>
                  <strong className="mt-0.5 block text-xl font-black tabular-nums text-cyan-200">{levelConfig.targetScore.toLocaleString('en-US')}</strong>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {worldSave.blueKeys >= 2 ** reviveCountRef.current && (
                  <button type="button" onClick={handleRevive} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-sky-200/30 bg-gradient-to-l from-sky-500 to-blue-600 px-4 py-3 font-black text-white shadow-[0_10px_24px_rgba(37,99,235,.28)] transition hover:brightness-110">
                    <KeyRound className="h-5 w-5" />
                    <span>استخدمي مفاتيح للمتابعة</span>
                    <span className="rounded-lg bg-white/15 px-2 py-1 text-xs tabular-nums">{(2 ** reviveCountRef.current).toLocaleString('en-US')}</span>
                  </button>
                )}
                <button type="button" onClick={resetRun} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-rose-500 via-pink-500 to-fuchsia-600 px-4 py-3 font-black text-white shadow-[0_10px_24px_rgba(225,29,72,.25)] transition hover:brightness-110">
                  <RotateCcw className="h-4 w-4" /> إعادة المحاولة
                </button>
                <button type="button" onClick={onExitToMap} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10">
                  <MapIcon className="h-4 w-4" /> العودة إلى خريطة المراحل
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

    </motion.section>
  );
}
