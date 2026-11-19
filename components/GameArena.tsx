'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
  Flame,
  Heart,
  Magnet,
  DoorOpen,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  KeyRound,
  Sparkles,
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
  heartsRemaining: number;
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
  onGameOver: () => void;
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
  fuseTimer?: number;
  armed?: boolean;
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
const DOUBLE_SCORE_DURATION_SEC = 10;
const MAX_HEARTS = 3;

const CAT_QUOTES = ['قطة تستحق الرعاية 🐱', 'صوت خرخرة هادئ', 'رفيقة صغيرة للمغامرة'];
const ROSE_QUOTES = ['تحفة! 🌹', 'يا جمالها! ✨', 'أجمل وردة! 🌹'];
const CHOCO_QUOTES = ['يميي! 🍫', 'طعمها خيال! 🍫', 'شوكولاتة! 💖'];

const ITEM_CONFIG: Record<
  string,
  { points: number; halo: string; fallbackColor: string }
> = {
  cat: { points: 20, halo: 'rgba(251, 191, 36, 0.35)', fallbackColor: '#FDE68A' },
  rose: { points: 15, halo: 'rgba(244, 63, 94, 0.35)', fallbackColor: '#FDA4AF' },
  chocolate: { points: 10, halo: 'rgba(217, 119, 6, 0.32)', fallbackColor: '#D97706' },
  magnet: { points: 0, halo: 'rgba(56, 189, 248, 0.42)', fallbackColor: '#38BDF8' },
  blueKey: { points: 0, halo: 'rgba(59, 130, 246, 0.55)', fallbackColor: '#3B82F6' },
  coin: { points: 0, halo: 'rgba(250, 204, 21, 0.42)', fallbackColor: '#FACC15' },
  heart: { points: 0, halo: 'rgba(251, 113, 133, 0.58)', fallbackColor: '#F43F5E' },
  doubleScore: { points: 0, halo: 'rgba(251, 191, 36, 0.68)', fallbackColor: '#F59E0B' },
  obstacle: { points: -15, halo: 'rgba(71, 85, 105, 0.48)', fallbackColor: '#475569' },
  monster: { points: -18, halo: 'rgba(45, 212, 191, 0.42)', fallbackColor: '#0F766E' },
  runner: { points: -16, halo: 'rgba(249, 115, 22, 0.46)', fallbackColor: '#EA580C' },
  fierceMonster: { points: -24, halo: 'rgba(244, 63, 94, 0.62)', fallbackColor: '#BE123C' },
  exploder: { points: -26, halo: 'rgba(249, 115, 22, 0.62)', fallbackColor: '#C2410C' },
  boss: { points: -30, halo: 'rgba(244, 63, 94, 0.58)', fallbackColor: '#BE123C' },
  projectile: { points: -12, halo: 'rgba(139, 92, 246, 0.48)', fallbackColor: '#7C3AED' },
};

function isHazardKind(
  kind: CartoonSpriteKind,
): kind is 'obstacle' | 'monster' | 'runner' | 'fierceMonster' | 'exploder' | 'boss' | 'projectile' {
  return kind === 'obstacle' || kind === 'monster' || kind === 'runner' || kind === 'fierceMonster' || kind === 'exploder' || kind === 'boss' || kind === 'projectile';
}

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
  onGameOver,
}: GameArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const worldSave = useWorldSave();
  // From level 5 onward, the camera reveals a larger horizontal and vertical playfield.
  const cameraZoom = levelConfig.level >= 30 ? 0.72 : levelConfig.level >= 15 ? 0.78 : levelConfig.level >= 5 ? 0.84 : 0.90;

  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [counts, setCounts] = useState({ cats: 0, roses: 0, chocolates: 0, obstaclesHit: 0 });
  const [combo, setCombo] = useState(0);
  const [magnetSecondsLeft, setMagnetSecondsLeft] = useState(0);
  const [doubleScoreSecondsLeft, setDoubleScoreSecondsLeft] = useState(0);
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
  const doubleScoreTimerRef = useRef(0);
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

  const callbacksRef = useRef({ onHighScoreUpdate, onVictory, onGameOver });
  useEffect(() => {
    callbacksRef.current = { onHighScoreUpdate, onVictory, onGameOver };
  }, [onHighScoreUpdate, onVictory, onGameOver]);

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
    doubleScoreTimerRef.current = 0;
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
    setDoubleScoreSecondsLeft(0);
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
    let worldWidth = width / cameraZoom;
    let worldHeight = height / cameraZoom;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const updateCanvasSize = () => {
      width = Math.max(300, container.clientWidth);
      height = Math.max(320, container.clientHeight);
      worldWidth = width / cameraZoom;
      worldHeight = height / cameraZoom;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };
    updateCanvasSize();

    const ro = new ResizeObserver(updateCanvasSize);
    ro.observe(container);

    const player = {
      x: worldWidth / 2,
      vx: 0,
      size: Math.min(174, Math.max(124, width * 0.184)),
      y: worldHeight * 0.72,
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
    let doubleScoreHudTick = 0;
    let lastHeartSpawnAt = -999;
    let lightningCooldown = 8 + Math.random() * 5;
    let lightningWarning = 0;
    let lightningFlash = 0;
    let lightningX = worldWidth * 0.5;
    let lastResetCount = resetSignalRef.current;

    const ambientItems = Array.from({ length: 22 }, (_, i) => ({
      x: (i * 97) % Math.max(400, worldWidth),
      y: (i * 61) % Math.max(400, worldHeight),
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
      const scoreBoostAlreadyPresent =
        doubleScoreTimerRef.current > 0 || entities.some((e) => e.kind === 'doubleScore');

      const stageNumber = levelConfig.level;
      const isSecondSeason = stageNumber >= 16;
      const firstSeasonProgress = Math.max(0, Math.min(1, (stageNumber - 2) / 12));
      const secondSeasonProgress = Math.max(0, Math.min(1, (stageNumber - 16) / 13));
      // Hearts are rare at the start, then become a measured comeback tool.
      // Never spawn one while Joudy is already at full health or another heart is falling.
      const heartEligible = heartsRef.current < MAX_HEARTS && !entities.some((entity) => entity.kind === 'heart');
      const heartDelay = stageNumber <= 4
        ? 27 - (stageNumber - 1) * 1.5
        : stageNumber === 5 ? 16
          : stageNumber === 6 ? 13
            : stageNumber < 15 ? 12 - ((stageNumber - 7) / 7) * 5
              : stageNumber === 15 ? 6.5
                : stageNumber === 30 ? 5.5 : 7 - secondSeasonProgress * 1.5;
      const heartSpawnChance = stageNumber <= 4
        ? 0.08
        : stageNumber === 5 ? 0.16
          : stageNumber === 6 ? 0.20
            : stageNumber < 15 ? 0.22 + ((stageNumber - 7) / 7) * 0.08
              : stageNumber === 15 ? 0.32
                : stageNumber === 30 ? 0.34 : 0.28 + secondSeasonProgress * 0.04;
      const heartChance = heartEligible && totalElapsed - lastHeartSpawnAt >= heartDelay ? heartSpawnChance : 0;
      const randomRoll = Math.random();
      const roll = heartChance >= 1 ? 1 : Math.max(0, (randomRoll - heartChance) / (1 - heartChance));
      const heartWasSelected = randomRoll < heartChance;
      // The first stage has only mischievous clouds. From stage 2 onward,
      // hazards grow gradually; stage 15 introduces the stronger red enemies.
      const hazardChance = stageNumber === 1 ? 0.16 : levelConfig.obstacleChance;
      let kind: CartoonSpriteKind = 'chocolate';

      if (heartWasSelected) {
        kind = 'heart';
        lastHeartSpawnAt = totalElapsed;
      } else if (roll < 0.055) {
        kind = 'coin';
      } else if (roll < 0.068) {
        kind = 'blueKey';
      } else if (roll < 0.068 + hazardChance) {
        const enemyRoll = Math.random();
        if (stageNumber === 1) {
          // The opening level contains mischievous clouds only.
          kind = 'obstacle';
        } else if (stageNumber < 5) {
          // Stages 2–4 introduce the archer and the chasing runner.
          kind = enemyRoll < 0.52 ? 'monster' : 'runner';
        } else if (stageNumber < 15) {
          // Stage 5 keeps both starter enemies and introduces the tougher cast.
          if (enemyRoll < 0.16) kind = 'monster';
          else if (enemyRoll < 0.32) kind = 'runner';
          else if (enemyRoll < 0.65) kind = 'fierceMonster';
          else kind = 'exploder';
        } else if (stageNumber === 15) {
          if (enemyRoll < 0.43) kind = 'boss';
          else if (enemyRoll < 0.72) kind = 'fierceMonster';
          else if (enemyRoll < 0.91) kind = 'exploder';
          else kind = 'projectile';
        } else if (stageNumber === 30) {
          if (enemyRoll < 0.34) kind = 'boss';
          else if (enemyRoll < 0.60) kind = 'fierceMonster';
          else if (enemyRoll < 0.79) kind = 'exploder';
          else if (enemyRoll < 0.91) kind = 'runner';
          else kind = 'projectile';
        } else if (isSecondSeason) {
          if (enemyRoll < 0.16) kind = 'monster';
          else if (enemyRoll < 0.34) kind = 'runner';
          else if (enemyRoll < 0.61) kind = 'fierceMonster';
          else if (enemyRoll < 0.84) kind = 'exploder';
          else if (enemyRoll < 0.94) kind = 'boss';
          else kind = 'projectile';
        }
      } else if (!scoreBoostAlreadyPresent && Math.random() < 0.032) {
        kind = 'doubleScore';
      } else if (!magnetAlreadyPresent && Math.random() < 0.06) {
        kind = 'magnet';
      } else {
        const goodRoll = Math.random();
        if (goodRoll < 0.28) kind = 'cat';
        else if (goodRoll < 0.64) kind = 'rose';
        else kind = 'chocolate';
      }

      const cfg = ITEM_CONFIG[kind];
      const radius = (
        kind === 'boss' ? (stageNumber === 30 ? 64 : stageNumber === 15 ? 56 : 44)
          : kind === 'fierceMonster' ? 36
            : kind === 'exploder' ? 33
              : kind === 'monster' ? (stageNumber < 15 ? 24 : 35)
              : kind === 'runner' ? (stageNumber < 15 ? 25 : 30)
                : kind === 'projectile' ? (stageNumber < 15 ? 16 : 21)
                  : kind === 'obstacle' ? 30
                    : kind === 'magnet' ? 28
                      : kind === 'blueKey' ? 22
                        : kind === 'coin' ? 17
                        : kind === 'heart' ? 25
                          : kind === 'doubleScore' ? 26 : 27
      ) * 0.9;
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
                  : kind === 'coin'
                    ? 175
                    : kind === 'heart'
                      ? 182
                      : kind === 'doubleScore'
                        ? 176
                      : kind === 'boss'
                      ? (stageNumber < 16 ? 300 : 335)
                      : kind === 'fierceMonster'
                        ? 305
                        : kind === 'exploder'
                          ? 225
                        : kind === 'runner'
                          ? (stageNumber < 15 ? 175 + firstSeasonProgress * 70 : 270)
                          : kind === 'monster'
                            ? (stageNumber < 15 ? 155 + firstSeasonProgress * 55 : 275)
                            : kind === 'projectile'
                              ? (stageNumber < 15 ? 205 + firstSeasonProgress * 65 : 365)
                              : 245;

      const x = radius + 16 + Math.random() * Math.max(40, worldWidth - (radius + 16) * 2);
      const hasZigzag = kind !== 'runner' && Math.random() < (kind === 'boss' || kind === 'projectile' ? 0.68 : 0.42);

      entities.push({
        id: nextEntityId++,
        kind,
        baseX: x,
        x,
        y: -radius - 12,
        vy: (baseSpeed + Math.random() * (isHazardKind(kind) ? 70 : 55)) * levelConfig.speedMultiplier / cameraZoom,
        vx: (Math.random() - 0.5) * (30 + levelConfig.windStrength),
        zigzagAmp: hasZigzag
          ? (kind === 'boss' ? 35 : isHazardKind(kind) ? 62 : 58) + Math.random() * 26
          : 0,
        zigzagFreq: 2.2 + Math.random() * 1.6,
        zigzagPhase: Math.random() * Math.PI * 2,
        radius,
        rotation: 0,
        vr: (Math.random() - 0.5) * 2.1,
        fuseTimer: kind === 'exploder' ? 0.72 : undefined,
        armed: false,
        points: kind === 'monster' && stageNumber < 15 ? -8
          : kind === 'runner' ? -10
            : kind === 'fierceMonster' ? -22
              : kind === 'exploder' ? -26
                : kind === 'projectile' && stageNumber < 15 ? -6 : cfg.points,
      });

      // Monsters and bosses sometimes launch arrows aimed toward Joudy's
      // current position. Their frequency rises toward the level-15 challenge.
      const canShoot = kind === 'monster' || kind === 'fierceMonster' || kind === 'boss';
      const shootChance = stageNumber < 5
        ? 0.34 + firstSeasonProgress * 0.12
        : stageNumber < 15 ? 0.42 + firstSeasonProgress * 0.18
          : stageNumber === 15 ? 0.58 : stageNumber === 30 ? 0.88 : 0.66 + secondSeasonProgress * 0.12;
      if (canShoot && Math.random() < shootChance) {
        const shotRadius = (stageNumber < 15 ? 17 : stageNumber === 30 ? 26 : 22) * 0.9;
        const shotX = Math.max(shotRadius + 8, Math.min(worldWidth - shotRadius - 8, x + (Math.random() - 0.5) * 34));
        const shotY = -shotRadius - 18;
        const shotSpeed = (stageNumber < 5 ? 230 + firstSeasonProgress * 45 : stageNumber < 15 ? 275 + firstSeasonProgress * 90 : stageNumber === 15 ? 420 : stageNumber === 30 ? 620 : 450) * levelConfig.speedMultiplier / cameraZoom;
        const flightSeconds = Math.max(0.45, (player.y - shotY) / shotSpeed);
        const maxHorizontalSpeed = (stageNumber < 5 ? 170 : stageNumber < 15 ? 230 : stageNumber === 15 ? 310 : stageNumber === 30 ? 480 : 350) / cameraZoom;
        const shotVx = Math.max(-maxHorizontalSpeed, Math.min(maxHorizontalSpeed, (player.x - shotX) / flightSeconds));
        entities.push({
          id: nextEntityId++,
          kind: 'projectile',
          baseX: shotX,
          x: shotX,
          y: shotY,
          vy: shotSpeed,
          vx: shotVx,
          zigzagAmp: 0,
          zigzagFreq: 0,
          zigzagPhase: 0,
          radius: shotRadius,
          rotation: 0,
          vr: 0,
          points: stageNumber < 15 ? -8 : stageNumber === 30 ? -24 : -15,
        });
      }
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
                : kind === 'doubleScore'
                  ? ['#FBBF24', '#FDE68A', '#FFFFFF', '#F59E0B']
                  : kind === 'heart'
                  ? ['#FB7185', '#FDA4AF', '#FFF1F2', '#FDE68A']
                : kind === 'boss' || kind === 'fierceMonster'
                  ? ['#F43F5E', '#FBBF24', '#7C3AED']
                  : kind === 'exploder'
                    ? ['#FB923C', '#FDE68A', '#A855F7']
                  : kind === 'runner'
                    ? ['#F97316', '#FDE68A', '#7C2D12']
                    : kind === 'monster'
                      ? ['#2DD4BF', '#A78BFA', '#FDE047']
                      : kind === 'projectile'
                      ? ['#8B5CF6', '#F97316', '#E0E7FF']
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
          shape: isHazardKind(kind) ? 'circle' : i % 2 === 0 ? 'star' : 'heart',
          gravity: 210,
        });
      }
    };

    const damagePlayer = (impactX: number, impactY: number, scorePenalty: number, message = 'احترس! ⚠️') => {
      if (player.invulnTimer > 0) return;
      scoreRef.current = Math.max(0, scoreRef.current + scorePenalty);
      comboRef.current = 0;
      comboTimerRef.current = 0;
      countsRef.current.obstaclesHit += 1;
      heartsRef.current = Math.max(0, heartsRef.current - 1);
      if (heartsRef.current <= 0 && worldSave.extraHearts > 0) {
        let consumed = false;
        saveWorld((current) => {
          if (current.extraHearts <= 0) return current;
          consumed = true;
          return { ...current, extraHearts: current.extraHearts - 1 };
        });
        if (consumed) {
          heartsRef.current = 1;
          player.bubbleText = 'قلب إضافي أنقذك! ❤️';
        }
      }
      player.invulnTimer = 1.25 + characterShieldBonus;
      player.hurtShake = 1;
      player.happyTimer = 0;
      player.bubbleText = message;
      player.bubbleTone = 'bad';
      player.bubbleTimer = 1.3;
      shakeRef.current = Math.max(shakeRef.current, 11);
      soundEngine.playObstacleHit();
      popups.push({ x: impactX, y: impactY - 12, text: '-1 ❤️', color: '#E11D48', life: 0, maxLife: 0.9 });
      setHearts(heartsRef.current);
      setScore(scoreRef.current);
      setCombo(0);
      setCounts({ ...countsRef.current });
      if (heartsRef.current <= 0 && !isGameOverRef.current) {
        isGameOverRef.current = true;
        soundEngine.stopBackgroundMusic();
        setIsGameOver(true);
        callbacksRef.current.onGameOver();
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
        player.x = worldWidth / 2;
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
        if (doubleScoreTimerRef.current > 0) {
          doubleScoreTimerRef.current = Math.max(0, doubleScoreTimerRef.current - dt);
          doubleScoreHudTick += dt;
          if (doubleScoreHudTick >= 0.25 || doubleScoreTimerRef.current === 0) {
            doubleScoreHudTick = 0;
            setDoubleScoreSecondsLeft(Math.ceil(doubleScoreTimerRef.current));
          }
        }

        if (player.invulnTimer > 0) player.invulnTimer = Math.max(0, player.invulnTimer - dt);
        if (player.happyTimer > 0) player.happyTimer = Math.max(0, player.happyTimer - dt);
        if (player.bubbleTimer > 0) player.bubbleTimer = Math.max(0, player.bubbleTimer - dt);

        // Level 15 winter storm: a visible warning precedes every lightning strike.
        // A strike only removes a heart if Joudy stays close to the marked lane.
        if (levelConfig.weatherMode === 'winter-storm') {
          lightningFlash = Math.max(0, lightningFlash - dt);
          if (lightningWarning > 0) {
            lightningWarning = Math.max(0, lightningWarning - dt);
            if (lightningWarning === 0) {
              lightningFlash = 0.34;
              soundEngine.playThunder();
              if (Math.abs(player.x - lightningX) < 112) {
                damagePlayer(lightningX, player.y - 24, -6, 'ضربة برق! ابتعدي عن الوميض ⚡');
              } else {
                popups.push({ x: lightningX, y: worldHeight - 125, text: 'تفاديتِ البرق!', color: '#BAE6FD', life: 0, maxLife: 0.85 });
              }
            }
          } else {
            lightningCooldown -= dt;
            if (lightningCooldown <= 0) {
              lightningX = worldWidth * (0.12 + Math.random() * 0.76);
              lightningWarning = 1.05;
              lightningCooldown = 10 + Math.random() * 7;
              popups.push({ x: lightningX, y: worldHeight * 0.48, text: '⚡ برق قادم! ابتعدي', color: '#FDE68A', life: 0, maxLife: 1.05 });
            }
          }
        }

        // Free-flight touch movement: drag anywhere to steer horizontally and vertically.
        const maxSpeed = (920 * characterSpeedBonus) / cameraZoom;
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
        player.x = Math.max(halfPlayer, Math.min(worldWidth - halfPlayer, player.x + player.vx * dt));
        player.y = Math.max(player.size * 0.52, Math.min(worldHeight - player.size * 0.48, player.y + player.vy * dt));

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
            spawnRunningStars(player.x, worldHeight - 28, player.vx);
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
        for (const item of entities) {
          item.y += item.vy * dt;
          if (item.kind === 'runner') {
            const chaseLimit = (levelConfig.level < 5
              ? 125
              : levelConfig.level < 15
                ? 180 + Math.max(0, (levelConfig.level - 5) / 9) * 110
                : levelConfig.level === 30 ? 620 : 300) / cameraZoom;
            const chaseSpeed = (player.x - item.baseX) * 1.28;
            item.vx = Math.max(-chaseLimit, Math.min(chaseLimit, chaseSpeed));
          }
          item.baseX += item.vx * dt;
          item.rotation += item.vr * dt;

          if (item.baseX < item.radius + 10) {
            item.baseX = item.radius + 10;
            item.vx = Math.abs(item.vx);
          } else if (item.baseX > worldWidth - item.radius - 10) {
            item.baseX = worldWidth - item.radius - 10;
            item.vx = -Math.abs(item.vx);
          }

          if (magnetActive && !isHazardKind(item.kind) && item.kind !== 'magnet') {
            const dxPull = player.x - item.x;
            const dyPull = playerCenterY - item.y;
            const dist = Math.hypot(dxPull, dyPull);
            if (dist < Math.max(worldWidth * 0.65, 420)) {
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
              item.x = Math.max(item.radius, Math.min(worldWidth - item.radius, item.baseX + zig));
            }
          } else {
            const zig =
              item.zigzagAmp > 0
                ? Math.sin(totalElapsed * item.zigzagFreq + item.zigzagPhase) * item.zigzagAmp
                : 0;
            item.x = Math.max(item.radius, Math.min(worldWidth - item.radius, item.baseX + zig));
          }

          // Bomber monsters telegraph an area blast before detonating.
          // The warning gives Joudy time to dash outside the danger radius.
          if (item.kind === 'exploder') {
            const blastDistance = Math.hypot(item.x - player.x, item.y - playerCenterY);
            if (!item.armed && blastDistance < 230) {
              item.armed = true;
              item.fuseTimer = 0.72;
            }
            if (item.armed) {
              item.fuseTimer = Math.max(0, (item.fuseTimer ?? 0.72) - dt);
              if (item.fuseTimer <= 0) {
                spawnBurst(item.x, item.y, 'exploder');
                for (let spark = 0; spark < 18; spark++) {
                  const angle = (Math.PI * 2 * spark) / 18;
                  const speed = 130 + Math.random() * 190;
                  particles.push({
                    x: item.x,
                    y: item.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0,
                    maxLife: 0.55 + Math.random() * 0.25,
                    size: 6 + Math.random() * 7,
                    color: ['#FB923C', '#FDE68A', '#C084FC'][spark % 3],
                    shape: 'circle',
                    gravity: 95,
                  });
                }
                popups.push({ x: item.x, y: item.y - 24, text: 'انفجار!', color: '#F97316', life: 0, maxLife: 0.9 });
                if (blastDistance < item.radius + 92) damagePlayer(item.x, item.y, item.points, 'انفجار قريب! 💥');
                else {
                  player.bubbleText = 'تفاديتِ الانفجار!';
                  player.bubbleTone = 'good';
                  player.bubbleTimer = 0.9;
                }
                continue;
              }
            }
          }

          const hitX = Math.abs(item.x - player.x) < catchRadiusX + item.radius * 0.55;
          const hitY = Math.abs(item.y - playerCenterY) < catchRadiusY + item.radius * 0.55;

          if (hitX && hitY) {
            spawnBurst(item.x, item.y, item.kind);

            if (isHazardKind(item.kind)) {
              damagePlayer(item.x, item.y, item.points);
            } else if (item.kind === 'coin') {
              addWorldCoins(25);
              player.catchBounce = 1;
              player.happyTimer = 0.7;
              player.bubbleText = '+25 عملة ذهبية';
              player.bubbleTone = 'good';
              player.bubbleTimer = 1;
              popups.push({ x: item.x, y: item.y - 12, text: '+25 🪙', color: '#D97706', life: 0, maxLife: 1 });
            } else if (item.kind === 'blueKey') {
              saveWorld((current) => ({ ...current, blueKeys: current.blueKeys + 1 }));
              player.catchBounce = 1;
              player.happyTimer = 1.1;
              player.bubbleText = 'مفتاح أزرق نادر! 🔑';
              player.bubbleTone = 'magnet';
              player.bubbleTimer = 1.5;
              soundEngine.playMagnetCollect();
              popups.push({ x: item.x, y: item.y - 12, text: '+1 مفتاح أزرق', color: '#2563EB', life: 0, maxLife: 1.1 });
            } else if (item.kind === 'heart') {
              const beforeHearts = heartsRef.current;
              heartsRef.current = Math.min(MAX_HEARTS, beforeHearts + 1);
              setHearts(heartsRef.current);
              player.catchBounce = 1.2;
              player.happyTimer = 1.15;
              player.bubbleText = '+1 قلب حياة! ❤️';
              player.bubbleTone = 'good';
              player.bubbleTimer = 1.35;
              soundEngine.playHeartCollect();
              popups.push({ x: item.x, y: item.y - 12, text: '+1 ❤️ حياة', color: '#FB7185', life: 0, maxLife: 1.15 });
              for (let spark = 0; spark < 12; spark++) {
                const angle = (Math.PI * 2 * spark) / 12;
                particles.push({ x: player.x, y: player.y, vx: Math.cos(angle) * 115, vy: Math.sin(angle) * 115 - 35, life: 0, maxLife: .62, size: 5 + Math.random() * 4, color: ['#FB7185', '#FDE68A', '#FFFFFF'][spark % 3], shape: spark % 2 ? 'heart' : 'star', gravity: 35 });
              }
            } else if (item.kind === 'doubleScore') {
              doubleScoreTimerRef.current = DOUBLE_SCORE_DURATION_SEC;
              setDoubleScoreSecondsLeft(DOUBLE_SCORE_DURATION_SEC);
              player.catchBounce = 1.1;
              player.happyTimer = 1.1;
              player.bubbleText = 'مضاعفة النقاط ×2! ✨';
              player.bubbleTone = 'magnet';
              player.bubbleTimer = 1.45;
              shakeRef.current = Math.max(shakeRef.current, 4.5);
              soundEngine.playMagnetCollect();
              popups.push({ x: item.x, y: item.y - 12, text: 'النقاط ×2 لمدة 10 ثوانٍ!', color: '#FBBF24', life: 0, maxLife: 1.25 });
            } else if (item.kind === 'magnet') {
              magnetTimerRef.current = MAGNET_DURATION_SEC;
              setMagnetSecondsLeft(Math.ceil(MAGNET_DURATION_SEC));
              player.catchBounce = 1;
              player.happyTimer = 0.95;
              player.bubbleText = 'جذب إجباري! 🧲';
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
              const secondSeasonProgress = Math.max(0, Math.min(1, (levelConfig.level - 16) / 13));
              const chapterBonus = levelConfig.level === 30 ? 2.8 : levelConfig.level >= 16 ? 1.5 + secondSeasonProgress * 0.8 : 1;
              const powerupMultiplier = doubleScoreTimerRef.current > 0 ? 2 : 1;
              const earned = Math.round(item.points * multiplier * chapterBonus * powerupMultiplier);
              const nextScore = scoreRef.current + earned;
              scoreRef.current = nextScore;

              if (item.kind === 'cat') countsRef.current.cats += 1;
              if (item.kind === 'rose') countsRef.current.roses += 1;
              if (item.kind === 'chocolate') { countsRef.current.chocolates += 1; addWorldCoins(2); }
              if (item.kind === 'rose') addWorldCoins(3);
              if (item.kind === 'cat') addWorldCoins(5);

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
                  heartsRemaining: heartsRef.current,
                });
              }
            }
            continue;
          }

          if (item.y < worldHeight + 56) {
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
          if (amb.y > worldHeight + 15) {
            amb.y = -15;
            amb.x = Math.random() * worldWidth;
          } else if (amb.y < -15) {
            amb.y = worldHeight + 15;
            amb.x = Math.random() * worldWidth;
          }
          if (amb.x < -15) amb.x = worldWidth + 15;
          if (amb.x > worldWidth + 15) amb.x = -15;
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
        const phaseForLight = (levelConfig.timeOfDayPhase + totalElapsed / (levelConfig.level >= 10 ? 112 : 152)) % 1;
        const daylightForImage = Math.max(0, Math.sin(((phaseForLight - 0.22) / 0.56) * Math.PI));
        ctx.filter = `saturate(0.86) contrast(1.10) brightness(${(0.68 + daylightForImage * 0.38).toFixed(3)})`;
        const scale = Math.max(width / img.width, height / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const parallaxX = (player.x / Math.max(1, worldWidth) - 0.5) * -22;
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

      // A continuous sunrise -> noon -> sunset -> moonlit night cycle.
      // Celestial bodies are drawn first and then naturally hidden by the ridge silhouette.
      const phaseDuration = levelConfig.level >= 10 ? 112 : 152;
      const timePhase = (levelConfig.timeOfDayPhase + totalElapsed / phaseDuration) % 1;
      const daylight = Math.max(0, Math.sin(((timePhase - 0.22) / 0.56) * Math.PI));
      const nightShade = 0.52 * (1 - daylight);
      ctx.fillStyle = `rgba(5, 11, 31, ${nightShade.toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);

      const distanceToSunrise = Math.min(Math.abs(timePhase - 0.22), 1 - Math.abs(timePhase - 0.22));
      const distanceToSunset = Math.min(Math.abs(timePhase - 0.78), 1 - Math.abs(timePhase - 0.78));
      const dawnDuskGlow = Math.max(
        Math.exp(-Math.pow(distanceToSunrise / 0.085, 2)),
        Math.exp(-Math.pow(distanceToSunset / 0.085, 2)),
      );
      if (dawnDuskGlow > 0.01) {
        const twilight = ctx.createLinearGradient(0, height * 0.28, 0, height);
        twilight.addColorStop(0, `rgba(255, 169, 94, ${0.025 + dawnDuskGlow * 0.12})`);
        twilight.addColorStop(1, `rgba(225, 76, 105, ${dawnDuskGlow * 0.2})`);
        ctx.fillStyle = twilight;
        ctx.fillRect(0, 0, width, height);
      }
      if (daylight > 0.01) {
        const daylightWash = ctx.createLinearGradient(0, 0, 0, height);
        daylightWash.addColorStop(0, `rgba(255, 226, 166, ${(daylight * 0.045).toFixed(3)})`);
        daylightWash.addColorStop(1, `rgba(255, 238, 190, ${(daylight * 0.075).toFixed(3)})`);
        ctx.fillStyle = daylightWash;
        ctx.fillRect(0, 0, width, height);
      }

      // Sun emerges from behind the left mountain at dawn and disappears behind
      // the right ridge at dusk. Drawing the ridge afterward creates real occlusion.
      if (timePhase >= 0.19 && timePhase <= 0.81) {
        const sunProgress = Math.max(0, Math.min(1, (timePhase - 0.19) / 0.62));
        const sunX = width * (0.055 + sunProgress * 0.89);
        const sunY = height * (0.755 - Math.sin(Math.PI * sunProgress) * 0.47);
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 86);
        sunGlow.addColorStop(0, 'rgba(255, 249, 213, .96)');
        sunGlow.addColorStop(.18, 'rgba(255, 215, 130, .68)');
        sunGlow.addColorStop(.55, 'rgba(255, 165, 93, .20)');
        sunGlow.addColorStop(1, 'rgba(255, 152, 80, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath(); ctx.arc(sunX, sunY, 86, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255, 238, 190, .96)';
        ctx.beginPath(); ctx.arc(sunX, sunY, 17, 0, Math.PI * 2); ctx.fill();
      }

      // Moon travels in the opposite direction from sunset through the night,
      // rising behind the right ridge and setting behind the left ridge at dawn.
      const moonProgressRaw = timePhase >= 0.72 ? (timePhase - 0.72) / 0.56 : (timePhase + 0.28) / 0.56;
      if (moonProgressRaw >= 0 && moonProgressRaw <= 1) {
        const moonX = width * (0.95 - moonProgressRaw * 0.90);
        const moonY = height * (0.75 - Math.sin(Math.PI * moonProgressRaw) * 0.38);
        ctx.save();
        ctx.shadowColor = 'rgba(191, 219, 254, .95)'; ctx.shadowBlur = 30;
        ctx.fillStyle = 'rgba(232, 240, 255, .97)';
        ctx.beginPath(); ctx.arc(moonX, moonY, 15, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(82, 100, 145, .78)';
        ctx.beginPath(); ctx.arc(moonX + 7, moonY - 6, 13, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // Distant mountain ridges occlude the lower edge of the sun/moon so
      // sunrise and moonrise look as though they come from behind the landscape.
      ctx.save();
      const farMountain = ctx.createLinearGradient(0, height * 0.53, 0, height * 0.88);
      farMountain.addColorStop(0, daylight > 0.35 ? 'rgba(54, 84, 105, .62)' : 'rgba(21, 35, 65, .82)');
      farMountain.addColorStop(1, daylight > 0.35 ? 'rgba(30, 59, 75, .84)' : 'rgba(9, 18, 43, .96)');
      ctx.fillStyle = farMountain;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.79);
      ctx.lineTo(width * 0.09, height * 0.70);
      ctx.lineTo(width * 0.18, height * 0.745);
      ctx.lineTo(width * 0.32, height * 0.595);
      ctx.lineTo(width * 0.43, height * 0.73);
      ctx.lineTo(width * 0.57, height * 0.64);
      ctx.lineTo(width * 0.70, height * 0.755);
      ctx.lineTo(width * 0.84, height * 0.615);
      ctx.lineTo(width, height * 0.73);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath(); ctx.fill();

      const nearMountain = ctx.createLinearGradient(0, height * 0.66, 0, height * 0.94);
      nearMountain.addColorStop(0, daylight > 0.35 ? 'rgba(32, 62, 75, .66)' : 'rgba(10, 20, 45, .88)');
      nearMountain.addColorStop(1, daylight > 0.35 ? 'rgba(16, 42, 51, .88)' : 'rgba(4, 11, 29, .98)');
      ctx.fillStyle = nearMountain;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.83);
      ctx.lineTo(width * 0.14, height * 0.75);
      ctx.lineTo(width * 0.25, height * 0.82);
      ctx.lineTo(width * 0.39, height * 0.69);
      ctx.lineTo(width * 0.53, height * 0.82);
      ctx.lineTo(width * 0.67, height * 0.72);
      ctx.lineTo(width * 0.82, height * 0.83);
      ctx.lineTo(width, height * 0.72);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath(); ctx.fill();
      ctx.restore();

      // Level 15 is a snowy winter night, with layered drifting flakes.
      if (levelConfig.weatherMode === 'winter-storm') {
        ctx.save();
        for (let flake = 0; flake < 72; flake++) {
          const fx = (flake * 137.7 + totalElapsed * (12 + (flake % 7) * 3)) % width;
          const fy = (flake * 83.3 + totalElapsed * (28 + (flake % 5) * 7)) % height;
          ctx.globalAlpha = 0.28 + (flake % 5) * 0.12;
          ctx.fillStyle = '#E0F2FE';
          ctx.beginPath(); ctx.arc(fx, fy, 1.1 + (flake % 3) * 0.65, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }

      // True zoom-out: the simulation runs in a larger virtual arena from level 5 onward.
      // Touch coordinates are converted back to this world-space by cameraZoom.
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(cameraZoom, cameraZoom);
      ctx.translate(-worldWidth / 2, -worldHeight / 2);

      // Soft Grass / Pathway Floor Strip at Bottom
      const floorGrad = ctx.createLinearGradient(0, worldHeight - 36, 0, worldHeight);
      floorGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      floorGrad.addColorStop(
        1,
        daylight < 0.38
          ? `rgba(30, 27, 75, ${(0.24 + (0.38 - daylight) * 0.78).toFixed(3)})`
          : `rgba(255, 241, 242, ${(0.34 + daylight * 0.38).toFixed(3)})`,
      );
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, worldHeight - 36, worldWidth, 36);

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
        ctx.rotate(item.kind === 'projectile' ? Math.atan2(item.vx, item.vy) : item.rotation * 0.45);

        // Soft glowing halo behind item. Bombers carry a pulsing danger ring.
        ctx.fillStyle = cfg.halo;
        ctx.beginPath();
        ctx.arc(0, 0, item.radius + 7, 0, Math.PI * 2);
        ctx.fill();
        if (item.kind === 'exploder') {
          const pulse = 1 + Math.sin(totalElapsed * 8 + item.id) * 0.06;
          ctx.globalAlpha = item.armed ? 0.95 : 0.42;
          ctx.strokeStyle = item.armed ? 'rgba(248, 113, 113, 0.98)' : 'rgba(251, 146, 60, 0.72)';
          ctx.lineWidth = item.armed ? 4 : 2;
          ctx.setLineDash(item.armed ? [8, 5] : [4, 7]);
          ctx.beginPath();
          ctx.arc(0, 0, (item.armed ? item.radius + 92 : item.radius + 25) * pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }

        if (svgImg && svgImg.complete && svgImg.naturalWidth > 0) {
          const drawSize = item.radius * (item.kind === 'projectile' ? 2.15 : isHazardKind(item.kind) ? 2.55 : 2.15);
          ctx.drawImage(svgImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        } else {
          ctx.fillStyle = cfg.fallbackColor;
          ctx.beginPath();
          ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Winter storm lightning has a clearly marked danger lane before the strike.
      if (levelConfig.weatherMode === 'winter-storm') {
        if (lightningWarning > 0) {
          ctx.save();
          const pulse = 0.55 + Math.sin(totalElapsed * 20) * 0.2;
          ctx.globalAlpha = pulse;
          ctx.strokeStyle = '#FDE68A'; ctx.lineWidth = 5; ctx.setLineDash([15, 10]);
          ctx.beginPath(); ctx.moveTo(lightningX, 18); ctx.lineTo(lightningX, worldHeight - 30); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(251, 191, 36, .18)';
          ctx.beginPath(); ctx.ellipse(lightningX, worldHeight - 30, 62, 18, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#FDE68A'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.ellipse(lightningX, worldHeight - 30, 62, 18, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        }
        if (lightningFlash > 0) {
          ctx.save();
          ctx.globalAlpha = Math.min(0.72, lightningFlash * 2.1);
          ctx.fillStyle = '#E0F2FE'; ctx.fillRect(0, 0, worldWidth, worldHeight);
          ctx.globalAlpha = Math.min(1, lightningFlash * 3.2);
          ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 9; ctx.shadowColor = '#7DD3FC'; ctx.shadowBlur = 28;
          ctx.beginPath();
          ctx.moveTo(lightningX, 0);
          ctx.lineTo(lightningX - 18, worldHeight * .22);
          ctx.lineTo(lightningX + 16, worldHeight * .34);
          ctx.lineTo(lightningX - 11, worldHeight * .52);
          ctx.lineTo(lightningX + 8, worldHeight * .71);
          ctx.lineTo(lightningX, worldHeight - 28);
          ctx.stroke();
          ctx.restore();
        }
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
      const heightRatio = Math.min(0.88, Math.max(0, (worldHeight - 13 - player.y) / Math.max(1, worldHeight - 13)));
      ctx.save();
      ctx.fillStyle = daylight < 0.38 ? 'rgba(15, 23, 42, 0.5)' : 'rgba(136, 19, 55, 0.24)';
      ctx.beginPath();
      ctx.ellipse(
        drawPlayerX,
        worldHeight - 13,
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

      // Golden rotating aura while the temporary score-doubling token is active.
      if (doubleScoreTimerRef.current > 0) {
        ctx.save();
        ctx.translate(drawPlayerX, drawPlayerY);
        const boostPulse = 1 + Math.sin(totalElapsed * 8) * 0.07;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.92)';
        ctx.lineWidth = 4;
        ctx.setLineDash([7, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, player.size * 0.64 * boostPulse, -totalElapsed * 2.8, -totalElapsed * 2.8 + Math.PI * 2);
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
        const bx = Math.max(boxW / 2 + 8, Math.min(worldWidth - boxW / 2 - 8, drawPlayerX));
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
    pointerTargetXRef.current = (e.clientX - rect.left) / cameraZoom;
    pointerTargetYRef.current = (e.clientY - rect.top) / cameraZoom;
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
      {/* Premium two-row HUD: score, record, wallet and controls each have their own space. */}
      <header className="absolute left-2 right-2 top-2 z-30 flex flex-col gap-2 rounded-[1.35rem] border border-white/15 bg-[#071426]/95 px-2.5 py-2.5 text-white shadow-[0_14px_40px_rgba(0,0,0,.48)] backdrop-blur-2xl sm:left-4 sm:right-4 sm:rounded-[1.6rem] sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {realImageSrc && (
            <div className="relative hidden h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-amber-200/50 bg-slate-900 shadow-lg sm:block">
              <Image src={realImageSrc} alt="جودي" fill sizes="40px" referrerPolicy="no-referrer" className="object-cover object-center" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-4">
              <div className="min-w-0">
                <div className="mb-0.5 flex min-w-0 items-center gap-2">
                  <span className="truncate text-[10px] font-bold text-slate-400 sm:text-xs">{levelConfig.worldName}</span>
                  <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-black sm:text-[10px] ${levelConfig.level === 15 ? 'border-amber-200/50 bg-rose-500/20 text-amber-100' : levelConfig.level === 30 ? 'border-fuchsia-200/50 bg-violet-500/20 text-fuchsia-100' : 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200'}`}>{levelConfig.level === 15 ? 'المعركة الكبرى · 15' : levelConfig.level === 30 ? 'الزعيم الأخير · 30' : `مستوى ${levelConfig.level}`}</span>
                </div>
                <div className="flex min-w-0 items-baseline gap-1.5">
                  <span className="text-base font-black leading-none tabular-nums text-white sm:text-lg">{score.toLocaleString('ar-EG')}</span>
                  <span className="text-[10px] font-semibold text-slate-400 sm:text-xs">/ {levelConfig.targetScore.toLocaleString('ar-EG')} نقطة</span>
                  {combo >= 2 && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-black text-amber-200">
                      <Flame className="h-3 w-3 fill-amber-400 text-amber-400" /> ×{comboMultiplier}
                    </span>
                  )}
                  {magnetSecondsLeft > 0 && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-400/10 px-1.5 py-0.5 text-[10px] font-black text-sky-200">
                      <Magnet className="h-3 w-3" /> {magnetSecondsLeft}ث
                    </span>
                  )}
                  {doubleScoreSecondsLeft > 0 && (
                    <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-300/25 bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-black text-amber-100 shadow-[0_0_12px_rgba(251,191,36,.16)]">
                      <Sparkles className="h-3 w-3" /> ×2 · {doubleScoreSecondsLeft}ث
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0 rounded-xl border border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-orange-500/10 px-2.5 py-1.5 text-right shadow-inner sm:px-3">
                <div className="flex items-center justify-end gap-1 text-[9px] font-bold text-amber-200/80 sm:text-[10px]">
                  <Trophy className="h-3 w-3 text-amber-300" /> الرقم القياسي
                </div>
                <div className="text-xs font-black tabular-nums text-amber-100 sm:text-sm">{displayedHighScore.toLocaleString('ar-EG')}</div>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-slate-800/90 shadow-inner" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="تقدم المستوى">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 shadow-[0_0_12px_rgba(56,189,248,.55)] transition-all duration-200" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex h-9 min-w-0 items-center gap-1 rounded-xl border border-amber-300/25 bg-gradient-to-br from-amber-300/15 to-orange-500/10 px-2 text-[10px] font-black text-amber-100 shadow-inner sm:px-3 sm:text-xs" title="العملات الذهبية" aria-label={`العملات الذهبية: ${worldSave.coins}`}>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-amber-300/15 text-base">🪙</span>
              <span className="tabular-nums">{worldSave.coins.toLocaleString('ar-EG')}</span>
            </span>
            <span className="inline-flex h-9 min-w-0 items-center gap-1 rounded-xl border border-sky-300/25 bg-gradient-to-br from-sky-300/15 to-blue-600/15 px-2 text-[10px] font-black text-sky-100 shadow-inner sm:px-3 sm:text-xs" title="المفاتيح الزرقاء" aria-label={`المفاتيح الزرقاء: ${worldSave.blueKeys}`}>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-sky-200/20 bg-sky-300/15"><KeyRound className="h-[18px] w-[18px] -rotate-45 text-sky-200 drop-shadow-[0_0_5px_rgba(56,189,248,.8)]" /></span>
              <span className="tabular-nums">{worldSave.blueKeys.toLocaleString('ar-EG')}</span>
            </span>
            <span className="hidden text-[10px] font-semibold text-slate-500 md:inline">🐱 {counts.cats} · 🌹 {counts.roses} · 🍫 {counts.chocolates}</span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={onToggleSound} aria-label={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'} title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'} className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-200/25 bg-gradient-to-br from-cyan-400/20 to-sky-700/20 text-cyan-100 shadow-inner transition hover:border-cyan-200/50 hover:bg-cyan-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
              {soundEnabled ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
            </button>
            <button type="button" onClick={() => setIsPaused((p) => !p)} aria-label={isPaused ? 'استئناف اللعب' : 'إيقاف مؤقت'} title={isPaused ? 'استئناف اللعب' : 'إيقاف مؤقت'} className="grid h-9 w-9 place-items-center rounded-xl border border-amber-200/25 bg-gradient-to-br from-amber-400/20 to-orange-700/20 text-amber-100 shadow-inner transition hover:border-amber-200/50 hover:bg-amber-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
              {isPaused ? <Play className="h-[18px] w-[18px] fill-current" /> : <Pause className="h-[18px] w-[18px]" />}
            </button>
            <button type="button" onClick={onExitToMap} aria-label="الخروج إلى خريطة المراحل" title="الخروج إلى خريطة المراحل" className="grid h-9 w-9 place-items-center rounded-xl border border-rose-200/25 bg-gradient-to-br from-rose-400/20 to-violet-700/20 text-rose-100 shadow-inner transition hover:border-rose-200/50 hover:bg-rose-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">
              <DoorOpen className="h-[18px] w-[18px]" />
            </button>
          </div>
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
          className="pointer-events-none absolute left-3 top-[9.5rem] z-40 rounded-full border border-white/20 bg-slate-950/45 px-3 py-1.5 text-xs font-black text-white shadow-lg backdrop-blur-sm drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] sm:left-5 sm:top-[8.25rem] sm:text-sm"
          aria-label={`المستوى ${levelConfig.level}`}
        >
          المستوى {levelConfig.level}
        </div>
        <div
          className="pointer-events-none absolute right-3 top-[9.5rem] z-40 inline-flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/45 px-2.5 py-1.5 shadow-lg backdrop-blur-sm sm:right-5 sm:top-[8.25rem]"
          aria-label={`قلوب الحياة: ${hearts} من ${MAX_HEARTS}`}
        >
          {[1, 2, 3].map((idx) => (
            <Heart
              key={idx}
              className={`h-6 w-6 sm:h-7 sm:w-7 drop-shadow-[0_3px_5px_rgba(0,0,0,.65)] ${
                idx <= hearts
                  ? 'fill-[#ff315d] text-[#ffe4eb] [filter:drop-shadow(0_0_5px_rgba(244,63,94,.65))]'
                  : 'fill-slate-500/70 text-slate-200/80'
              }`}
            />
          ))}
        </div>

        {(levelConfig.level === 15 || levelConfig.level === 30) && (
          <div className={`pointer-events-none absolute left-1/2 top-[9.2rem] z-40 -translate-x-1/2 rounded-full border px-4 py-1.5 text-center text-[10px] font-black shadow-xl backdrop-blur-md sm:top-[8.2rem] sm:text-xs ${levelConfig.level === 15 ? 'border-amber-200/60 bg-gradient-to-r from-rose-950/90 via-red-700/90 to-amber-700/90 text-amber-100 shadow-rose-950/30' : 'border-fuchsia-200/60 bg-gradient-to-r from-slate-950/90 via-violet-800/90 to-rose-900/90 text-fuchsia-100 shadow-violet-950/40'}`}>
            {levelConfig.level === 15 ? '⚔ المعركة الكبرى · زعيم المدينة الأولى' : '👑 المواجهة النهائية · زعيم المستوى 30'}
          </div>
        )}

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
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-b from-[#172943] via-[#101d31] to-[#080f1c] p-6 text-center text-white shadow-[0_28px_90px_rgba(0,0,0,.65)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-cyan-400/15 to-transparent" />
              <div className="relative mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-cyan-200/25 bg-cyan-400/10 text-cyan-100 shadow-[0_0_35px_rgba(34,211,238,.18)]">
                <Pause className="h-8 w-8" />
              </div>
              <h3 className="relative text-2xl font-black tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>استراحة جودي</h3>
              <p className="relative mt-1 text-xs font-bold text-cyan-200">المستوى {levelConfig.level} · {levelConfig.worldName}</p>
              <div className="relative mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div><p className="text-[10px] font-semibold text-slate-400">النقاط الحالية</p><p className="mt-1 text-lg font-black tabular-nums text-white">{score.toLocaleString('ar-EG')}</p></div>
                <div><p className="text-[10px] font-semibold text-slate-400">الهدف</p><p className="mt-1 text-lg font-black tabular-nums text-amber-200">{levelConfig.targetScore.toLocaleString('ar-EG')}</p></div>
              </div>
              <div className="relative mt-4 flex flex-col gap-2.5">
                <button type="button" onClick={() => setIsPaused(false)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-200/30 bg-gradient-to-l from-cyan-400 to-blue-600 px-4 py-3.5 font-black text-white shadow-lg transition hover:brightness-110">
                  <Play className="h-4 w-4 fill-current" /> استئناف المغامرة
                </button>
                <button type="button" onClick={resetRun} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-slate-100 transition hover:bg-white/10">
                  <RotateCcw className="h-4 w-4" /> إعادة المرحلة
                </button>
                <button type="button" onClick={onExitToMap} className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-400 transition hover:bg-white/5 hover:text-white">
                  <DoorOpen className="h-4 w-4" /> الخروج إلى الخريطة
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Game Over (3 Hearts Depleted) Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
            <motion.div
              initial={{ y: 22, scale: 0.94, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
              className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-rose-200/20 bg-gradient-to-b from-[#28172B] via-[#172238] to-[#080F1B] p-5 text-center text-white shadow-[0_28px_90px_rgba(0,0,0,.7)] sm:p-7"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-rose-500/25 via-fuchsia-500/5 to-transparent" />
              <div className="relative mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.4rem] border border-rose-200/30 bg-gradient-to-br from-rose-400/20 to-fuchsia-600/10 text-rose-200 shadow-[0_0_40px_rgba(244,63,94,.25)]">
                <Heart className="h-9 w-9 fill-rose-500/20" />
              </div>
              <h3
                className="relative mt-3 text-2xl font-black tracking-tight text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                انتهت المحاولة
              </h3>
              <p className="relative mx-auto max-w-sm text-sm leading-7 text-slate-300">
                الوحوش كانت أسرع منكِ في المستوى {levelConfig.level}. جمعتِ{' '}
                <span className="font-black tabular-nums text-rose-200">{score.toLocaleString('ar-EG')}</span> من{' '}
                <span className="font-black tabular-nums text-white">{levelConfig.targetScore.toLocaleString('ar-EG')}</span> نقطة.
              </p>
              <div className="relative mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-slate-300">
                <span>المحاولات المتبقية</span><span className="tabular-nums text-rose-200">{hearts} / {MAX_HEARTS} ❤️</span>
              </div>
              <div className="relative mt-4 flex flex-col gap-2.5">
                {worldSave.blueKeys >= 2 ** reviveCountRef.current && (
                  <button type="button" onClick={handleRevive} className="group flex w-full items-center gap-3 rounded-2xl border border-sky-200/30 bg-gradient-to-l from-sky-500/25 via-blue-600/25 to-indigo-600/25 px-4 py-3.5 text-right shadow-[0_12px_30px_rgba(37,99,235,.2)] transition hover:border-sky-200/60 hover:from-sky-400/35 hover:to-indigo-500/35">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-sky-100/25 bg-sky-300/15 text-sky-100 shadow-inner"><KeyRound className="h-7 w-7 -rotate-45 drop-shadow-[0_0_8px_rgba(125,211,252,.8)]" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-black text-white">إنقاذ جودي بمفتاح أزرق</span><span className="mt-0.5 block text-[10px] font-semibold text-sky-100/75">استكملي اللعب بحياة واحدة</span></span>
                    <span className="rounded-lg border border-sky-100/20 bg-sky-100/10 px-2.5 py-1.5 text-xs font-black text-sky-100">× {2 ** reviveCountRef.current}</span>
                  </button>
                )}
                <button type="button" onClick={resetRun} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200/30 bg-gradient-to-l from-rose-500 to-fuchsia-600 px-4 py-3.5 font-black text-white shadow-[0_10px_28px_rgba(225,29,72,.25)] transition hover:brightness-110">
                  <RotateCcw className="h-4 w-4" /> إعادة المحاولة
                </button>
                <button type="button" onClick={onExitToMap} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10">
                  <DoorOpen className="h-4 w-4" /> العودة إلى خريطة المراحل
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

    </motion.section>
  );
}
