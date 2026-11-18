'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  ArrowRight,
  BedDouble,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Coffee,
  Coins,
  Compass,
  Crown,
  DoorOpen,
  Droplets,
  Eye,
  Fish,
  Flame,
  Heart,
  Map as MapIcon,
  MessageCircle,
  Moon,
  Palette,
  Shirt,
  ShoppingBag,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
  ZoomIn,
} from 'lucide-react';
import VirtualJoystick, { type JoystickVector } from './VirtualJoystick';
import {
  BLUSH_SHADES,
  DEFAULT_MAKEUP_STATE,
  EYESHADOW_SHADES,
  getNpcDialogue,
  getQuestObjective,
  INITIAL_CAR_POSE,
  INITIAL_PLAYER_POSE,
  LIPSTICK_SHADES,
  OUTFIT_CATALOG,
  QUEST_LOG_LIST,
  SHOP_KITTENS,
  TOTAL_QUEST_COUNT,
  WORLD_BUILDINGS,
  WORLD_COINS,
  WORLD_FOUNTAINS,
  WORLD_HEIGHT,
  WORLD_LAKE,
  WORLD_NPCS,
  WORLD_ROADS,
  WORLD_TREES,
  WORLD_WIDTH,
  type DialogueLine,
  type MakeupState,
  type OutfitId,
  type OwnedPetState,
  type QuestStage,
  type ShopKittenDef,
  type StreetCatDef,
  type WorldBuilding,
  type WorldNpcDef,
} from '@/lib/openWorldData';
import {
  buildInteriorStage3D,
  buildNpc3D,
  buildPrincessCar3D,
  buildPrincessJoudy3D,
  buildWorldEnvironment3D,
  createRealFaceTexture,
  INTERIOR_HALF_D,
  INTERIOR_HALF_W,
  resolveInteriorMovement,
  SECOND_FLOOR_Y,
  WORLD_3D_SCALE,
  world2DTo3D,
  type NpcRig3D,
} from '@/lib/openWorld3D';
import { soundEngine } from '@/lib/soundEffects';

interface OpenWorldArenaProps {
  realImageSrc: string;
  animeImageSrc: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExitToHub: () => void;
  bonusCoins?: number;
}

interface ActiveDialogueState {
  npc: WorldNpcDef;
  lines: DialogueLine[];
  lineIndex: number;
  pendingNextStage?: QuestStage;
  rewardCoins?: number;
  triggersCoronation?: boolean;
  triggersGameCompletion?: boolean;
  openPetShopAfter?: boolean;
}

interface ExhaustParticle3D {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

type HoldControlKey = 'gas' | 'brake' | 'steerLeft' | 'steerRight' | 'walkLeft' | 'walkRight';

const _camDesiredPos = new THREE.Vector3();
const _camDesiredLook = new THREE.Vector3();
const _camCurrentLook = new THREE.Vector3();

function normalizeAngle(a: number): number {
  let res = a;
  while (res > Math.PI) res -= Math.PI * 2;
  while (res < -Math.PI) res += Math.PI * 2;
  return res;
}

function resolveCircleAabb(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): { x: number; y: number } {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= r * r) return { x: cx, y: cy };

  if (distSq > 0.0001) {
    const dist = Math.sqrt(distSq);
    const push = r - dist;
    return {
      x: cx + (dx / dist) * push,
      y: cy + (dy / dist) * push,
    };
  }

  const left = cx - rx;
  const right = rx + rw - cx;
  const top = cy - ry;
  const bottom = ry + rh - cy;
  const minEdge = Math.min(left, right, top, bottom);
  if (minEdge === left) return { x: rx - r, y: cy };
  if (minEdge === right) return { x: rx + rw + r, y: cy };
  if (minEdge === top) return { x: cx, y: ry - r };
  return { x: cx, y: ry + rh + r };
}

function resolveWorldCollisions(
  x: number,
  y: number,
  radius: number,
): { x: number; y: number } {
  let nx = Math.max(radius + 32, Math.min(WORLD_WIDTH - radius - 32, x));
  let ny = Math.max(radius + 32, Math.min(WORLD_HEIGHT - radius - 32, y));

  for (const b of WORLD_BUILDINGS) {
    const resolved = resolveCircleAabb(nx, ny, radius, b.x, b.y, b.w, b.h);
    nx = resolved.x;
    ny = resolved.y;
  }

  for (const f of WORLD_FOUNTAINS) {
    const dx = nx - f.x;
    const dy = ny - f.y;
    const minDist = radius + f.radius;
    const d = Math.hypot(dx, dy);
    if (d < minDist && d > 0.001) {
      nx = f.x + (dx / d) * minDist;
      ny = f.y + (dy / d) * minDist;
    }
  }

  for (const t of WORLD_TREES) {
    const dx = nx - t.x;
    const dy = ny - t.y;
    const trunkRadius = t.radius * 0.42;
    const minDist = radius + trunkRadius;
    const d = Math.hypot(dx, dy);
    if (d < minDist && d > 0.001) {
      nx = t.x + (dx / d) * minDist;
      ny = t.y + (dy / d) * minDist;
    }
  }

  const ldx = (nx - WORLD_LAKE.cx) / (WORLD_LAKE.rx + radius);
  const ldy = (ny - WORLD_LAKE.cy) / (WORLD_LAKE.ry + radius);
  const normDist = Math.hypot(ldx, ldy);
  if (normDist < 1 && normDist > 0.001) {
    nx = WORLD_LAKE.cx + (ldx / normDist) * (WORLD_LAKE.rx + radius);
    ny = WORLD_LAKE.cy + (ldy / normDist) * (WORLD_LAKE.ry + radius);
  }

  return { x: nx, y: ny };
}

function renderKingdomMap(
  ctx: CanvasRenderingContext2D,
  mw: number,
  mh: number,
  focus2DX: number,
  focus2DY: number,
  focusAngle2D: number,
  carX: number,
  carY: number,
  questStage: QuestStage,
  targetX: number,
  targetY: number,
  collectedCoinIds: Set<number>,
  detailed: boolean,
) {
  const sx = mw / WORLD_WIDTH;
  const sy = mh / WORLD_HEIGHT;

  ctx.fillStyle = '#D9F99D';
  ctx.fillRect(0, 0, mw, mh);

  ctx.fillStyle = '#86EFAC';
  ctx.fillRect(3000 * sx, 2880 * sy, 1450 * sx, 620 * sy);

  // Starlight Lake
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.ellipse(
    WORLD_LAKE.cx * sx,
    WORLD_LAKE.cy * sy,
    (WORLD_LAKE.rx + 28) * sx,
    (WORLD_LAKE.ry + 24) * sy,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.fillStyle = '#38BDF8';
  ctx.beginPath();
  ctx.ellipse(
    WORLD_LAKE.cx * sx,
    WORLD_LAKE.cy * sy,
    WORLD_LAKE.rx * sx,
    WORLD_LAKE.ry * sy,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Royal Plaza
  ctx.fillStyle = '#FFE4E6';
  ctx.fillRect(1880 * sx, 450 * sy, 1040 * sx, 250 * sy);

  // Roads
  for (const r of WORLD_ROADS) {
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect((r.x - 16) * sx, (r.y - 16) * sy, (r.w + 32) * sx, (r.h + 32) * sy);
  }
  for (const r of WORLD_ROADS) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy);

    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = detailed ? 1.4 : 0.75;
    ctx.setLineDash(detailed ? [6, 6] : [3, 3]);
    ctx.beginPath();
    if (r.w > r.h) {
      ctx.moveTo(r.x * sx, (r.y + r.h / 2) * sy);
      ctx.lineTo((r.x + r.w) * sx, (r.y + r.h / 2) * sy);
    } else {
      ctx.moveTo((r.x + r.w / 2) * sx, r.y * sy);
      ctx.lineTo((r.x + r.w / 2) * sx, (r.y + r.h) * sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  for (const f of WORLD_FOUNTAINS) {
    ctx.fillStyle = '#7DD3FC';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(f.x * sx, f.y * sy, Math.max(2.5, f.radius * sx), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = '#16A34A';
  for (const t of WORLD_TREES) {
    ctx.beginPath();
    ctx.arc(t.x * sx, t.y * sy, Math.max(detailed ? 3.5 : 1.5, t.radius * 0.42 * sx), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#FACC15';
  for (const c of WORLD_COINS) {
    if (collectedCoinIds.has(c.id)) continue;
    ctx.beginPath();
    ctx.arc(c.x * sx, c.y * sy, detailed ? 3.2 : 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const b of WORLD_BUILDINGS) {
    ctx.fillStyle = b.roofColor;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = detailed ? 1.4 : 0.7;
    ctx.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
    ctx.strokeRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);

    if (b.enterable) {
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(b.doorX * sx, b.doorY * sy, detailed ? 3.6 : 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    if (detailed) {
      ctx.font = '700 10px Cairo, sans-serif';
      ctx.fillStyle = '#1E293B';
      ctx.textAlign = 'center';
      ctx.fillText(b.name, (b.x + b.w / 2) * sx, Math.max(12, b.y * sy - 4));
    }
  }

  if (questStage < 8) {
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(targetX * sx, targetY * sy, detailed ? 7 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = '#EC4899';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.fillRect(
    carX * sx - (detailed ? 5 : 2.5),
    carY * sy - (detailed ? 5 : 2.5),
    detailed ? 10 : 5,
    detailed ? 10 : 5,
  );
  ctx.strokeRect(
    carX * sx - (detailed ? 5 : 2.5),
    carY * sy - (detailed ? 5 : 2.5),
    detailed ? 10 : 5,
    detailed ? 10 : 5,
  );

  const px = focus2DX * sx;
  const py = focus2DY * sy;
  const sz = detailed ? 8.5 : 5;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(focusAngle2D);
  ctx.fillStyle = '#E11D48';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sz, 0);
  ctx.lineTo(-sz * 0.75, -sz * 0.68);
  ctx.lineTo(-sz * 0.4, 0);
  ctx.lineTo(-sz * 0.75, sz * 0.68);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export default function OpenWorldArena({
  realImageSrc,
  soundEnabled,
  onToggleSound,
  onExitToHub,
  bonusCoins = 0,
}: OpenWorldArenaProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<HTMLCanvasElement>(null);
  const fullMapRef = useRef<HTMLCanvasElement>(null);

  const [questStage, setQuestStage] = useState<QuestStage>(0);
  const [isInCar, setIsInCar] = useState(false);
  const [nearCar, setNearCar] = useState(false);
  const [nearbyNpc, setNearbyNpc] = useState<WorldNpcDef | null>(null);
  const [nearbyStreetCat, setNearbyStreetCat] = useState<StreetCatDef | null>(null);
  const [carriedStreetCat, setCarriedStreetCat] = useState<StreetCatDef | null>(null);
  const [nearbyDoorBuilding, setNearbyDoorBuilding] = useState<WorldBuilding | null>(null);
  const [insideBuilding, setInsideBuilding] = useState<WorldBuilding | null>(null);
  const [interiorFloorNum, setInteriorFloorNum] = useState<1 | 2>(1);

  const [nearExitDoor, setNearExitDoor] = useState(false);
  const [nearBed, setNearBed] = useState(false);
  const [nearVanityMirror, setNearVanityMirror] = useState(false);
  const [nearWardrobe, setNearWardrobe] = useState(false);
  const [nearThrone, setNearThrone] = useState(false);
  const [nearSofa, setNearSofa] = useState(false);
  const [nearTelescope, setNearTelescope] = useState(false);
  const [nearPetCorner, setNearPetCorner] = useState(false);
  const [nearPetShopCounter, setNearPetShopCounter] = useState(false);
  const [nearCafeCounter, setNearCafeCounter] = useState(false);

  const [isSittingAtMirror, setIsSittingAtMirror] = useState(false);
  const [mirrorCameraMode, setMirrorCameraMode] = useState<'face' | 'mirror'>('face');
  const [makeupTab, setMakeupTab] = useState<'lip' | 'blush' | 'eye' | 'glam'>('lip');
  const [makeupBrushPosition, setMakeupBrushPosition] = useState<{ x: number; y: number } | null>(null);
  const [makeupBrushActive, setMakeupBrushActive] = useState(false);
  const [sittingSpot, setSittingSpot] = useState<'throne' | 'sofa' | null>(null);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isStargazing, setIsStargazing] = useState(false);
  const [turboActive, setTurboActive] = useState(false);

  const [energy, setEnergy] = useState(100);
  const [coinsCount, setCoinsCount] = useState(30 + bonusCoins);
  const [makeupState, setMakeupState] = useState<MakeupState>(DEFAULT_MAKEUP_STATE);
  const [outfitId, setOutfitId] = useState<OutfitId>('royal_pink');
  const [ownedPet, setOwnedPet] = useState<OwnedPetState | null>(null);

  const [showWardrobeModal, setShowWardrobeModal] = useState(false);
  const [showPetShopModal, setShowPetShopModal] = useState(false);
  const [showQuestLogModal, setShowQuestLogModal] = useState(false);
  const [showCoronationModal, setShowCoronationModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showFullMap, setShowFullMap] = useState(false);
  const [dialogue, setDialogue] = useState<ActiveDialogueState | null>(null);
  const [distanceToGoalMeters, setDistanceToGoalMeters] = useState(0);
  const [webglFallback, setWebglFallback] = useState(false);

  const [hudToast, setHudToast] = useState<string | null>(
    'أهلاً بكِ في مملكة جودي الكبرى! تحدّثي مع الحارس الملكي للبدء 👑✨',
  );
  const toastTimeoutRef = useRef<number | null>(null);

  // Visual press states for driving pedals & steering/walking arrows
  const [gasPressed, setGasPressed] = useState(false);
  const [brakePressed, setBrakePressed] = useState(false);
  const [steerLeftPressed, setSteerLeftPressed] = useState(false);
  const [steerRightPressed, setSteerRightPressed] = useState(false);
  const [walkLeftPressed, setWalkLeftPressed] = useState(false);
  const [walkRightPressed, setWalkRightPressed] = useState(false);

  const questStageRef = useRef<QuestStage>(0);
  const isInCarRef = useRef(false);
  const insideBuildingRef = useRef<WorldBuilding | null>(null);
  const isSleepingRef = useRef(false);
  const isSittingAtMirrorRef = useRef(false);
  const mirrorCameraModeRef = useRef<'face' | 'mirror'>('face');
  const sittingSpotRef = useRef<'throne' | 'sofa' | null>(null);
  const isStargazingRef = useRef(false);
  const showWardrobeRef = useRef(false);
  const turboTimerRef = useRef(0);
  const makeupAnimTimerRef = useRef(0);
  const petBounceTimerRef = useRef(0);

  const energyRef = useRef(100);
  const coinsRef = useRef(30 + bonusCoins);
  const collectedCoinIdsRef = useRef<Set<number>>(new Set());
  const carriedStreetCatRef = useRef<StreetCatDef | null>(null);
  const ownedPetRef = useRef<OwnedPetState | null>(null);
  const didApplyMakeupRef = useRef(false);
  const didChangeOutfitRef = useRef(false);
  const didCarryStreetCatRef = useRef(false);

  const joystickRef = useRef<JoystickVector>({ x: 0, y: 0, magnitude: 0 });
  const keysRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const holdControlsRef = useRef<Record<HoldControlKey, boolean>>({
    gas: false,
    brake: false,
    steerLeft: false,
    steerRight: false,
    walkLeft: false,
    walkRight: false,
  });

  const cameraYawRef = useRef(0);
  const dragLookRef = useRef<{ pointerId: number | null; lastX: number }>({
    pointerId: null,
    lastX: 0,
  });

  const playerStateRef = useRef({
    x: INITIAL_PLAYER_POSE.x,
    y: INITIAL_PLAYER_POSE.y,
    angle2D: INITIAL_PLAYER_POSE.angle,
    walkPhase: 0,
    isMoving: false,
  });

  const interiorStateRef = useRef({
    x: 0,
    y: 0,
    z: 20.5,
    angle2D: -Math.PI / 2,
    walkPhase: 0,
    isMoving: false,
  });

  const carStateRef = useRef({
    x: INITIAL_CAR_POSE.x,
    y: INITIAL_CAR_POSE.y,
    angle2D: INITIAL_CAR_POSE.angle,
    speed: 0,
  });

  // 3D Live Hook Refs so React UI updates talk seamlessly to existing Three.js scene
  const configureInteriorSceneRef = useRef<((b: WorldBuilding | null) => void) | null>(null);
  const applyFaceTextureRef = useRef<((m: MakeupState) => void) | null>(null);
  const applyOutfit3DRef = useRef<((id: OutfitId) => void) | null>(null);
  const applyCarriedCat3DRef = useRef<((cat: StreetCatDef | null) => void) | null>(null);
  const syncOwnedPet3DRef = useRef<((pet: OwnedPetState | null) => void) | null>(null);
  const pickupStreetCatActionRef = useRef<((cat: StreetCatDef | null) => void) | null>(null);

  const triggerTopNotification = useCallback((message: string) => {
    setHudToast(message);
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setHudToast(null);
      toastTimeoutRef.current = null;
    }, 30000);
  }, []);

  // Auto-hide initial notification after 30 seconds
  useEffect(() => {
    toastTimeoutRef.current = window.setTimeout(() => {
      setHudToast(null);
      toastTimeoutRef.current = null;
    }, 30000);
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const awardCoins = useCallback((amount: number) => {
    coinsRef.current += amount;
    setCoinsCount(coinsRef.current);
  }, []);

  const uiLockedRef = useRef(false);
  useEffect(() => {
    uiLockedRef.current =
      Boolean(dialogue) ||
      showCoronationModal ||
      showCompletionModal ||
      isSleeping ||
      isStargazing ||
      Boolean(sittingSpot) ||
      showFullMap ||
      showWardrobeModal ||
      showPetShopModal ||
      showQuestLogModal;
    if (uiLockedRef.current) {
      soundEngine.stopCarEngineSound();
    }
  }, [
    dialogue,
    isSleeping,
    isStargazing,
    showCompletionModal,
    showCoronationModal,
    showFullMap,
    showPetShopModal,
    showQuestLogModal,
    showWardrobeModal,
    sittingSpot,
  ]);

  useEffect(() => {
    questStageRef.current = questStage;
  }, [questStage]);

  useEffect(() => {
    isInCarRef.current = isInCar;
  }, [isInCar]);

  useEffect(() => {
    insideBuildingRef.current = insideBuilding;
  }, [insideBuilding]);

  useEffect(() => {
    isSleepingRef.current = isSleeping;
  }, [isSleeping]);

  useEffect(() => {
    isSittingAtMirrorRef.current = isSittingAtMirror;
  }, [isSittingAtMirror]);

  useEffect(() => {
    mirrorCameraModeRef.current = mirrorCameraMode;
  }, [mirrorCameraMode]);

  useEffect(() => {
    sittingSpotRef.current = sittingSpot;
  }, [sittingSpot]);

  useEffect(() => {
    isStargazingRef.current = isStargazing;
  }, [isStargazing]);

  useEffect(() => {
    showWardrobeRef.current = showWardrobeModal;
  }, [showWardrobeModal]);

  useEffect(() => {
    ownedPetRef.current = ownedPet;
    syncOwnedPet3DRef.current?.(ownedPet);
  }, [ownedPet]);

  useEffect(() => {
    applyFaceTextureRef.current?.(makeupState);
  }, [makeupState]);

  useEffect(() => {
    applyOutfit3DRef.current?.(outfitId);
  }, [outfitId]);

  useEffect(() => {
    if (soundEnabled) {
      soundEngine.startBackgroundMusic();
    } else {
      soundEngine.stopBackgroundMusic();
      soundEngine.stopCarEngineSound();
    }
    return () => {
      soundEngine.stopBackgroundMusic();
      soundEngine.stopCarEngineSound();
    };
  }, [soundEnabled]);

  // Passive Pet Hunger/Thirst & Growth Tick over time!
  const hasOwnedPet = ownedPet !== null;
  useEffect(() => {
    if (!hasOwnedPet) return;
    const timer = window.setInterval(() => {
      setOwnedPet((prev) => {
        if (!prev) return null;
        const hunger = Math.max(15, prev.hunger - 1);
        const thirst = Math.max(15, prev.thirst - 1);
        const wellFed = hunger >= 45 && thirst >= 45;
        const nextXp = wellFed ? prev.growthXp + 4 : prev.growthXp + 1;
        const nextStage: 1 | 2 | 3 = nextXp >= 200 ? 3 : nextXp >= 90 ? 2 : 1;

        if (nextStage > prev.stage) {
          soundEngine.playQuestComplete();
          soundEngine.playCatMeow(nextStage);
          triggerTopNotification(
            nextStage === 2
              ? `قطتكِ ${prev.name} كبرت وأصبحت قطة يافعة نشيطة! 🐱✨`
              : `قطتكِ ${prev.name} كبرت تماماً وأصبحت قطة ملكية بتاج ذهبي! 👑🐱`,
          );
          if (questStageRef.current === 8) {
            questStageRef.current = 9;
            setQuestStage(9);
            awardCoins(100);
            triggerTopNotification(
              'أتممتِ رعاية قطتكِ حتى كبرت (+100 عملة)! زُوري مرصد النجوم الملكي بالجنوب 🔭✨',
            );
          }
        }

        return {
          ...prev,
          hunger,
          thirst,
          growthXp: nextXp,
          stage: nextStage,
        };
      });
    }, 4500);
    return () => window.clearInterval(timer);
  }, [awardCoins, hasOwnedPet, triggerTopNotification]);

  const checkBeautyQuestProgress = useCallback(() => {
    if (questStageRef.current === 4 && didApplyMakeupRef.current && didChangeOutfitRef.current) {
      questStageRef.current = 5;
      setQuestStage(5);
      awardCoins(75);
      soundEngine.playQuestComplete();
      triggerTopNotification(
        'إطلالة ملكية رائعة (+75 عملة)! ✨ الآن زُوري مقهى الأميرات السحري لاحتساء قهوة ملكية ☕',
      );
    }
  }, [awardCoins, triggerTopNotification]);

  const handleUpdateMakeup = useCallback(
    (updater: (prev: MakeupState) => MakeupState, label?: string) => {
      setMakeupState((prev) => updater(prev));
      makeupAnimTimerRef.current = 0.75;
      setMakeupBrushActive(true);
      window.setTimeout(() => setMakeupBrushActive(false), 900);
      soundEngine.playMakeupSparkle();
      didApplyMakeupRef.current = true;
      if (label) {
        triggerTopNotification(`وضعتِ ${label}! شاهدي التغيير الواضح على وجهكِ 💄✨`);
      }
      checkBeautyQuestProgress();
    },
    [checkBeautyQuestProgress, triggerTopNotification],
  );

  const handleSelectOutfit = useCallback(
    (newId: OutfitId) => {
      setOutfitId(newId);
      soundEngine.playOutfitChange();
      didChangeOutfitRef.current = true;
      const opt = OUTFIT_CATALOG.find((o) => o.id === newId);
      if (opt) {
        triggerTopNotification(`ارتديتِ الآن: ${opt.name} ${opt.badge}`);
      }
      checkBeautyQuestProgress();
    },
    [checkBeautyQuestProgress, triggerTopNotification],
  );

  const handleJoystickChange = useCallback((vec: JoystickVector) => {
    joystickRef.current = vec;
  }, []);

  const handleActivateTurbo = useCallback(() => {
    if (!isInCarRef.current || turboTimerRef.current > 0) return;
    turboTimerRef.current = 3.2;
    setTurboActive(true);
    soundEngine.playTurboBoost();
    triggerTopNotification('تم تفعيل شاحن التيربو السريع ⚡🚗!');
    window.setTimeout(() => {
      setTurboActive(false);
    }, 3200);
  }, [triggerTopNotification]);

  const handleEnterOrExitCar = useCallback(() => {
    if (uiLockedRef.current || insideBuildingRef.current) return;

    if (!isInCarRef.current) {
      if (carriedStreetCatRef.current) {
        triggerTopNotification('أنزلي القطة التي تحملينها أولاً قبل ركوب السيارة 🐱');
        return;
      }
      isInCarRef.current = true;
      setIsInCar(true);
      playerStateRef.current.x = carStateRef.current.x;
      playerStateRef.current.y = carStateRef.current.y;
      soundEngine.playCarEnter();
      triggerTopNotification('ركبتِ السيارة الملكية! استخدمي دواسة البنزين والفرامل أو التيربو للقيادة 🚗');
    } else {
      const car = carStateRef.current;
      car.speed = 0;
      turboTimerRef.current = 0;
      setTurboActive(false);
      holdControlsRef.current.gas = false;
      holdControlsRef.current.brake = false;
      holdControlsRef.current.steerLeft = false;
      holdControlsRef.current.steerRight = false;
      setGasPressed(false);
      setBrakePressed(false);
      setSteerLeftPressed(false);
      setSteerRightPressed(false);
      soundEngine.playCarExit();

      const candidate = {
        x: car.x + Math.cos(car.angle2D - Math.PI / 2) * 62,
        y: car.y + Math.sin(car.angle2D - Math.PI / 2) * 62,
      };
      const safePos = resolveWorldCollisions(candidate.x, candidate.y, 20);
      playerStateRef.current.x = safePos.x;
      playerStateRef.current.y = safePos.y;
      playerStateRef.current.angle2D = car.angle2D;
      isInCarRef.current = false;
      setIsInCar(false);
    }
  }, [triggerTopNotification]);

  const handleEnterBuilding = useCallback(
    (building: WorldBuilding) => {
      if (uiLockedRef.current || isInCarRef.current || !building.enterable) return;
      soundEngine.playDialoguePop();
      interiorStateRef.current = {
        x: 0,
        y: 0,
        z: 20.5,
        angle2D: -Math.PI / 2,
        walkPhase: 0,
        isMoving: false,
      };
      cameraYawRef.current = 0;
      insideBuildingRef.current = building;
      setInsideBuilding(building);
      setInteriorFloorNum(1);
      setIsSittingAtMirror(false);
      setSittingSpot(null);
      setIsStargazing(false);
      setNearbyDoorBuilding(null);
      setNearbyNpc(null);
      configureInteriorSceneRef.current?.(building);

      if (building.kind === 'palace' || building.kind === 'villa') {
        triggerTopNotification(
          `أهلاً بكِ في ${building.name} الواسع! يمكنكِ الجلوس على العرش والأريكة أو الصعود للدور الثاني 👑🪜`,
        );
      } else if (building.kind === 'pet_shop') {
        triggerTopNotification('مرحباً بكِ في متجر القطط. اقتربي من المنضدة لاختيار قطة.');
      } else if (building.kind === 'salon') {
        triggerTopNotification('أهلاً بكِ في صالون المكياج والأزياء 💄👗 اجلسي أمام المرآة الحقيقية!');
      } else if (building.hasObservatory) {
        triggerTopNotification('أهلاً بكِ في مرصد النجوم الملكي 🔭 اقتربي من التلسكوب لرؤية النجوم!');
      } else {
        triggerTopNotification(`أهلاً بكِ داخل ${building.name} ✨`);
      }
    },
    [triggerTopNotification],
  );

  const handleExitBuilding = useCallback(() => {
    const b = insideBuildingRef.current;
    if (!b || isSleepingRef.current) return;
    soundEngine.playDialoguePop();
    insideBuildingRef.current = null;
    setInsideBuilding(null);
    setIsSittingAtMirror(false);
    isSittingAtMirrorRef.current = false;
    setSittingSpot(null);
    sittingSpotRef.current = null;
    setIsStargazing(false);
    isStargazingRef.current = false;
    setNearExitDoor(false);
    setNearBed(false);
    setNearVanityMirror(false);
    setNearWardrobe(false);
    setNearThrone(false);
    setNearSofa(false);
    setNearTelescope(false);
    setNearPetCorner(false);
    setNearPetShopCounter(false);
    setNearCafeCounter(false);
    configureInteriorSceneRef.current?.(null);

    const safeOut = resolveWorldCollisions(b.doorX, b.doorY + 28, 20);
    playerStateRef.current.x = safeOut.x;
    playerStateRef.current.y = safeOut.y;
    playerStateRef.current.angle2D = Math.PI / 2;
    cameraYawRef.current = Math.PI;
  }, []);

  const handleToggleSitAtMirror = useCallback(() => {
    if (!insideBuildingRef.current?.hasMakeup) return;
    soundEngine.playDialoguePop();
    if (!isSittingAtMirrorRef.current) {
      isSittingAtMirrorRef.current = true;
      setIsSittingAtMirror(true);
      setMirrorCameraMode('face');
      mirrorCameraModeRef.current = 'face';
      const chairY = insideBuildingRef.current.hasSecondFloor ? SECOND_FLOOR_Y : 0;
      interiorStateRef.current.x = 0;
      interiorStateRef.current.y = chairY;
      interiorStateRef.current.z = -19.2;
      triggerTopNotification('جلستِ أمام التسريحة! وجهكِ واضح تماماً لتختاري المكياج والمرآة 💄🪞');
    } else {
      isSittingAtMirrorRef.current = false;
      setIsSittingAtMirror(false);
      interiorStateRef.current.z = -15.5;
    }
  }, [triggerTopNotification]);

  const handleSitOnSeat = useCallback(
    (spot: 'throne' | 'sofa' | null) => {
      soundEngine.playDialoguePop();
      if (!spot) {
        sittingSpotRef.current = null;
        setSittingSpot(null);
        return;
      }
      sittingSpotRef.current = spot;
      setSittingSpot(spot);
      if (spot === 'throne') {
        interiorStateRef.current.x = 0;
        interiorStateRef.current.y = 0;
        interiorStateRef.current.z = -2.0;
        if (questStageRef.current === 3) {
          questStageRef.current = 4;
          setQuestStage(4);
          awardCoins(45);
          soundEngine.playQuestComplete();
          triggerTopNotification(
            'جلوس ملكي مهيب على العرش (+45 عملة)! 👑🪑 الآن اصعدي للدور الثاني للمكياج والأزياء 💄👗',
          );
        } else {
          triggerTopNotification('أهلاً بجلالتكِ على عرش الأميرة جودي الملكي! 👑✨');
        }
      } else {
        interiorStateRef.current.x = -19.0;
        interiorStateRef.current.y = 0;
        interiorStateRef.current.z = 7.5;
        triggerTopNotification('جلستِ باستمتاع على الأريكة الملكية المريحة 🛋️💖');
      }
    },
    [awardCoins, triggerTopNotification],
  );

  const handleToggleTelescope = useCallback(() => {
    soundEngine.playTelescopeSparkle();
    if (!isStargazingRef.current) {
      isStargazingRef.current = true;
      setIsStargazing(true);
      if (questStageRef.current === 9) {
        questStageRef.current = 10;
        setQuestStage(10);
        awardCoins(70);
        soundEngine.playQuestComplete();
        triggerTopNotification(
          'اكتشفتِ كوكب الأميرة جودي المتألق (+70 عملة)! 🔭🌟 عُودي لصديقة القصر ليلى لتختيم اللعبة 🏆',
        );
      } else {
        triggerTopNotification('تنظرين الآن إلى النجوم والكواكب الساحرة بالتلسكوب 🔭✨');
      }
    } else {
      isStargazingRef.current = false;
      setIsStargazing(false);
    }
  }, [awardCoins, triggerTopNotification]);

  const handlePickOrDropStreetCat = useCallback(() => {
    if (isInCarRef.current || insideBuildingRef.current) return;
    if (carriedStreetCatRef.current) {
      carriedStreetCatRef.current = null;
      setCarriedStreetCat(null);
      applyCarriedCat3DRef.current?.(null);
      pickupStreetCatActionRef.current?.(null);
      soundEngine.playDialoguePop();
      triggerTopNotification('أنزلتِ القطة بلطف لتلعب في الحديقة 🐾');
      return;
    }
    if (nearbyStreetCat) {
      carriedStreetCatRef.current = nearbyStreetCat;
      setCarriedStreetCat(nearbyStreetCat);
      applyCarriedCat3DRef.current?.(nearbyStreetCat);
      pickupStreetCatActionRef.current?.(nearbyStreetCat);
      soundEngine.playCatMeow(1);
      didCarryStreetCatRef.current = true;
      triggerTopNotification(
        `حملتِ ${nearbyStreetCat.name} 🤗🐱 (قطط الشوارع للحمل فقط؛ لامتلاك قطة اشترِي من متجر القطط!)`,
      );
    }
  }, [nearbyStreetCat, triggerTopNotification]);

  const handleBuyShopKitten = useCallback(
    (kitten: ShopKittenDef) => {
      if (coinsRef.current < kitten.price) {
        triggerTopNotification(
          `تحتاجين ${kitten.price - coinsRef.current} عملة إضافية لشراء ${kitten.name}! اجمعي العملات من الشوارع 🪙`,
        );
        return;
      }

      coinsRef.current -= kitten.price;
      setCoinsCount(coinsRef.current);

      const newPet: OwnedPetState = {
        kittenId: kitten.id,
        name: kitten.name,
        furColor: kitten.furColor,
        collarColor: kitten.collarColor,
        hunger: 60,
        thirst: 60,
        happiness: 95,
        growthXp: 10,
        stage: 1,
      };
      ownedPetRef.current = newPet;
      setOwnedPet(newPet);
      syncOwnedPet3DRef.current?.(newPet);
      setShowPetShopModal(false);

      soundEngine.playVictoryFanfare();
      soundEngine.playCatMeow(1);

      if (questStageRef.current <= 7) {
        questStageRef.current = 8;
        setQuestStage(8);
        awardCoins(50);
        triggerTopNotification(
          `مبروك شراء ${kitten.name}! وصلت الآن إلى مملكتكِ (القصر - الدور الثاني)! عُودي لإطعامها وسقايتها 🏠🐱`,
        );
      } else {
        triggerTopNotification(`مبروك شراء ${kitten.name}! وصلت فوراً إلى مملكتكِ في القصر 👑🐱`);
      }
    },
    [awardCoins, triggerTopNotification],
  );

  const handleCareOwnedPet = useCallback(
    (action: 'feed' | 'water' | 'play') => {
      const cur = ownedPetRef.current;
      if (!cur) return;
      petBounceTimerRef.current = 1.0;

      if (action === 'feed') soundEngine.playPetFeed();
      else if (action === 'water') soundEngine.playPetDrink();
      else soundEngine.playCatMeow(cur.stage);

      setOwnedPet((prev) => {
        if (!prev) return null;
        const hunger = action === 'feed' ? Math.min(100, prev.hunger + 38) : prev.hunger;
        const thirst = action === 'water' ? Math.min(100, prev.thirst + 38) : prev.thirst;
        const happiness = Math.min(100, prev.happiness + (action === 'play' ? 28 : 12));
        const xpGain = action === 'feed' ? 32 : action === 'water' ? 30 : 24;
        const nextXp = prev.growthXp + xpGain;
        const nextStage: 1 | 2 | 3 = nextXp >= 200 ? 3 : nextXp >= 90 ? 2 : 1;

        if (nextStage > prev.stage) {
          soundEngine.playQuestComplete();
          triggerTopNotification(
            nextStage === 2
              ? `رائع! قطتكِ ${prev.name} كبرت وأصبحت قطة يافعة! 🐱✨`
              : `مذهل! قطتكِ ${prev.name} كبرت تماماً وارتدت التاج الملكي! 👑🐱`,
          );
          if (questStageRef.current === 8) {
            questStageRef.current = 9;
            setQuestStage(9);
            awardCoins(100);
            triggerTopNotification(
              'قطتكِ كبرت برعايتكِ (+100 عملة)! زُوري مرصد النجوم الملكي لاستكشاف الفضاء! 🔭',
            );
          }
        } else {
          triggerTopNotification(
            action === 'feed'
              ? `أطعمتِ ${prev.name} سمكاً لذيذاً 🐟`
              : action === 'water'
                ? `سقيتِ ${prev.name} ماءً نقياً 💧`
                : `لاعبتِ ${prev.name} وهي سعيدة جداً! 💕`,
          );
        }

        return { ...prev, hunger, thirst, happiness, growthXp: nextXp, stage: nextStage };
      });
    },
    [awardCoins, triggerTopNotification],
  );

  const handleSleepOnBed = useCallback(() => {
    if (!insideBuildingRef.current?.hasBed || isSleepingRef.current) return;
    soundEngine.playSleepLullaby();
    isSleepingRef.current = true;
    setIsSleeping(true);
    energyRef.current = 100;
    setEnergy(100);
  }, []);

  const handleWakeUp = useCallback(() => {
    isSleepingRef.current = false;
    setIsSleeping(false);
    soundEngine.playQuestComplete();
    const floorY = insideBuildingRef.current?.hasSecondFloor ? SECOND_FLOOR_Y : 0;
    interiorStateRef.current.x = -17.0;
    interiorStateRef.current.y = floorY;
    interiorStateRef.current.z = -15.5;
    triggerTopNotification('صباح الخير يا أميرة جودي! تم شحن طاقتكِ 100% ☀️💖');
  }, [triggerTopNotification]);

  const handleDrinkCafeCoffee = useCallback(() => {
    soundEngine.playCoinCollect();
    energyRef.current = 100;
    setEnergy(100);
    if (questStageRef.current === 5) {
      questStageRef.current = 6;
      setQuestStage(6);
      awardCoins(50);
      soundEngine.playQuestComplete();
      triggerTopNotification(
        'استعدتِ نشاطكِ بعد زيارة المقهى (+50 عملة). يمكنكِ الآن زيارة متجر القطط.',
      );
    } else {
      triggerTopNotification('احتسيتِ قهوة وحلوى ملكية لذيذة! طاقتكِ الآن 100% ☕✨');
    }
  }, [awardCoins, triggerTopNotification]);

  const handleStartDialogue = useCallback(
    (targetNpc?: WorldNpcDef) => {
      const npc = targetNpc ?? nearbyNpc;
      if (!npc || uiLockedRef.current || insideBuildingRef.current) return;

      carStateRef.current.speed = 0;
      soundEngine.playDialoguePop();

      const res = getNpcDialogue(npc.id, questStageRef.current, {
        hasCarriedCat: Boolean(carriedStreetCatRef.current) || didCarryStreetCatRef.current,
        hasOwnedCat: Boolean(ownedPetRef.current),
        coins: coinsRef.current,
      });

      setDialogue({
        npc,
        lines: res.lines,
        lineIndex: 0,
        pendingNextStage: res.nextStage,
        rewardCoins: res.rewardCoins,
        triggersCoronation: res.triggersCoronation,
        triggersGameCompletion: res.triggersGameCompletion,
        openPetShopAfter: res.openPetShopAfter,
      });
    },
    [nearbyNpc],
  );

  const handleAdvanceDialogue = useCallback(() => {
    if (!dialogue) return;
    soundEngine.playDialoguePop();

    if (dialogue.lineIndex + 1 < dialogue.lines.length) {
      setDialogue({
        ...dialogue,
        lineIndex: dialogue.lineIndex + 1,
      });
      return;
    }

    const {
      pendingNextStage,
      rewardCoins,
      triggersCoronation,
      triggersGameCompletion,
      openPetShopAfter,
    } = dialogue;
    setDialogue(null);

    if (rewardCoins) {
      awardCoins(rewardCoins);
    }

    if (pendingNextStage !== undefined) {
      questStageRef.current = pendingNextStage;
      setQuestStage(pendingNextStage);
      if (triggersGameCompletion) {
        soundEngine.playVictoryFanfare();
        setShowCompletionModal(true);
        triggerTopNotification('مبروك تختيم لعبة عالم الأميرة جودي بالكامل! 🏆👑🎉');
      } else if (triggersCoronation) {
        soundEngine.playVictoryFanfare();
        setShowCoronationModal(true);
        triggerTopNotification('مبروك تتويجك يا أميرة جودي! 👑🎉 الآن جربي المرآة والمكياج!');
      } else {
        soundEngine.playQuestComplete();
        const obj = getQuestObjective(pendingNextStage, isInCarRef.current);
        triggerTopNotification(`${obj.stepLabel}: ${obj.title}`);
      }
    } else if (openPetShopAfter) {
      setShowPetShopModal(true);
    }
  }, [awardCoins, dialogue, triggerTopNotification]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = true;
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = true;
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
      else if (e.key === 'm' || e.key === 'M') {
        if (!dialogue && !showCoronationModal && !showCompletionModal && !isSleeping) {
          setShowFullMap((prev) => !prev);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (dialogue) {
          e.preventDefault();
          handleAdvanceDialogue();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = false;
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = false;
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
    };

    const onBlur = () => {
      keysRef.current = { up: false, down: false, left: false, right: false };
      holdControlsRef.current = {
        gas: false,
        brake: false,
        steerLeft: false,
        steerRight: false,
        walkLeft: false,
        walkRight: false,
      };
      setGasPressed(false);
      setBrakePressed(false);
      setSteerLeftPressed(false);
      setSteerRightPressed(false);
      setWalkLeftPressed(false);
      setWalkRightPressed(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [dialogue, handleAdvanceDialogue, isSleeping, showCompletionModal, showCoronationModal]);

  // Render Full Map Canvas
  useEffect(() => {
    if (!showFullMap) return;
    const canvas = fullMapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const focus2DX = isInCarRef.current ? carStateRef.current.x : playerStateRef.current.x;
    const focus2DY = isInCarRef.current ? carStateRef.current.y : playerStateRef.current.y;
    const focusAngle = isInCarRef.current
      ? carStateRef.current.angle2D
      : playerStateRef.current.angle2D;
    const activeObj = getQuestObjective(questStageRef.current, isInCarRef.current);

    renderKingdomMap(
      ctx,
      canvas.width,
      canvas.height,
      focus2DX,
      focus2DY,
      focusAngle,
      carStateRef.current.x,
      carStateRef.current.y,
      questStageRef.current,
      activeObj.targetX,
      activeObj.targetY,
      collectedCoinIdsRef.current,
      true,
    );
  }, [showFullMap]);

  // Main 3D WebGL Scene Loop
  useEffect(() => {
    const mount = canvasMountRef.current;
    const container = stageRef.current;
    if (!mount || !container) return;

    const isSoftwareGl = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      queueMicrotask(() => setWebglFallback(true));
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = Math.max(300, container.clientWidth);
    const height = Math.max(300, container.clientHeight);
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFallback(true);
    };
    const onContextRestored = () => {
      setWebglFallback(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdbeafe);
    scene.fog = new THREE.Fog(0xdbeafe, 95, 290);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x86efac, 0.92);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.38);
    sunLight.position.set(60, 95, 70);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 300;
    const dShadow = 135;
    sunLight.shadow.camera.left = -dShadow;
    sunLight.shadow.camera.right = dShadow;
    sunLight.shadow.camera.top = dShadow;
    sunLight.shadow.camera.bottom = -dShadow;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.25, 420);
    const startP3D = world2DTo3D(playerStateRef.current.x, playerStateRef.current.y);
    camera.position.set(startP3D.x + 1.1, 4.4, startP3D.z + 9.2);
    _camCurrentLook.set(startP3D.x, 2.2, startP3D.z - 5.5);
    camera.lookAt(_camCurrentLook);

    const env = buildWorldEnvironment3D(scene, renderer, isSoftwareGl);
    const interior = buildInteriorStage3D(renderer, isSoftwareGl);
    scene.add(interior.root);

    configureInteriorSceneRef.current = (building: WorldBuilding | null) => {
      if (building) {
        env.exteriorRoot.visible = false;
        interior.root.visible = true;
        interior.configureForBuilding(building);
        interior.syncOwnedPetVisual(ownedPetRef.current);
        scene.background = new THREE.Color(0xfff1f2);
        scene.fog = new THREE.Fog(0xfff1f2, 36, 95);
      } else {
        interior.root.visible = false;
        env.exteriorRoot.visible = true;
        scene.background = new THREE.Color(0xdbeafe);
        scene.fog = new THREE.Fog(0xdbeafe, 95, 290);
      }
    };

    let disposed = false;
    let activeFaceTex: THREE.Texture | null = null;

    const joudyRig = buildPrincessJoudy3D();
    joudyRig.root.position.set(startP3D.x, 0, startP3D.z);
    joudyRig.bodyGroup.rotation.y = Math.PI / 2 - playerStateRef.current.angle2D;
    scene.add(joudyRig.root);

    const carRig = buildPrincessCar3D();
    const carP3D = world2DTo3D(carStateRef.current.x, carStateRef.current.y);
    carRig.root.position.set(carP3D.x, 0, carP3D.z);
    carRig.root.rotation.y = Math.PI / 2 - carStateRef.current.angle2D;
    env.exteriorRoot.add(carRig.root);

    const npcRigs: NpcRig3D[] = WORLD_NPCS.map((def) => {
      const rig = buildNpc3D(def);
      env.exteriorRoot.add(rig.root);
      return rig;
    });

    const applyFaceWithMakeup = (m: MakeupState) => {
      createRealFaceTexture(realImageSrc, m)
        .then((tex) => {
          if (disposed) {
            tex.dispose();
            return;
          }
          const prev = activeFaceTex;
          activeFaceTex = tex;
          const oldWalkTex = joudyRig.faceMat.map;
          const oldCarTex = carRig.driverFaceMat.map;

          joudyRig.faceMat.map = tex;
          joudyRig.faceMat.needsUpdate = true;
          carRig.driverFaceMat.map = tex;
          carRig.driverFaceMat.needsUpdate = true;

          if (oldWalkTex && oldWalkTex !== prev) oldWalkTex.dispose();
          if (oldCarTex && oldCarTex !== prev && oldCarTex !== oldWalkTex) oldCarTex.dispose();
          if (prev && prev !== tex) prev.dispose();
        })
        .catch(() => {
          // Fallback anime face stays intact
        });
    };

    applyFaceTextureRef.current = applyFaceWithMakeup;
    applyOutfit3DRef.current = (id: OutfitId) => {
      joudyRig.setOutfit(id);
      carRig.setOutfit(id);
    };
    applyCarriedCat3DRef.current = (cat: StreetCatDef | null) => {
      joudyRig.setCarriedCat(cat);
    };
    syncOwnedPet3DRef.current = (pet: OwnedPetState | null) => {
      interior.syncOwnedPetVisual(pet);
    };
    pickupStreetCatActionRef.current = (pickedDef: StreetCatDef | null) => {
      env.streetCatRigs.forEach((sc) => {
        sc.pickedUp = Boolean(pickedDef && sc.def.id === pickedDef.id);
        sc.rig.root.visible = !sc.pickedUp;
      });
    };

    // Initial face texture load
    applyFaceWithMakeup(DEFAULT_MAKEUP_STATE);

    const puffGeo = new THREE.SphereGeometry(0.28, 8, 8);
    const puffMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.72,
    });
    let exhaustParticles: ExhaustParticle3D[] = [];
    let exhaustTimer = 0;

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(300, container.clientWidth);
      const h = Math.max(300, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    let hudSyncTimer = 0;
    let lastNearCar = false;
    let lastNpcId: string | null = null;
    let lastStreetCatId: string | null = null;
    let lastDoorId: string | null = null;
    let lastFloorNum: 1 | 2 = 1;
    let lastNearExit = false;
    let lastNearBed = false;
    let lastNearMirror = false;
    let lastNearWardrobe = false;
    let lastNearThrone = false;
    let lastNearSofa = false;
    let lastNearTelescope = false;
    let lastNearPetCorner = false;
    let lastNearPetShopCounter = false;
    let lastNearCafe = false;
    let lastDistMeters = -1;
    let totalTime = 0;
    let lastTime = performance.now();
    let frameId = 0;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.045, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      totalTime += dt;

      if (makeupAnimTimerRef.current > 0) {
        makeupAnimTimerRef.current = Math.max(0, makeupAnimTimerRef.current - dt);
      }
      if (petBounceTimerRef.current > 0) {
        petBounceTimerRef.current = Math.max(0, petBounceTimerRef.current - dt);
      }

      const activeBuilding = insideBuildingRef.current;

      // 1. Exterior Actors: NPCs, Street Cats, Clouds
      if (!activeBuilding) {
        for (const npc of npcRigs) {
          if (!uiLockedRef.current) {
            npc.phase += dt * npc.def.patrolSpeed;
          }
          const wx = npc.def.homeX + Math.cos(npc.phase) * npc.def.patrolRadiusX;
          const wy = npc.def.homeY + Math.sin(npc.phase * 1.3) * npc.def.patrolRadiusY;
          const p3d = world2DTo3D(wx, wy);

          const dx = p3d.x - npc.root.position.x;
          const dz = p3d.z - npc.root.position.z;
          if (Math.hypot(dx, dz) > 0.002) {
            npc.bodyGroup.rotation.y = Math.atan2(dx, dz);
          }
          npc.root.position.set(p3d.x, 0, p3d.z);

          const isTarget =
            (questStageRef.current === 0 && npc.def.id === 'guard') ||
            (questStageRef.current === 1 && npc.def.id === 'florist') ||
            ((questStageRef.current === 2 || questStageRef.current === 10) &&
              npc.def.id === 'bestie') ||
            ((questStageRef.current === 6 || questStageRef.current === 7) &&
              npc.def.id === 'shopkeeper');
          npc.questMarker.visible = isTarget;
          if (isTarget) {
            npc.questMarker.position.y =
              (npc.def.id === 'cat' ? 2.45 : 3.85) + Math.sin(totalTime * 5) * 0.22;
          }
        }

        // Roaming Street Cats
        for (const sc of env.streetCatRigs) {
          if (sc.pickedUp) continue;
          sc.phase += dt * 0.72;
          const wx = sc.def.homeX + Math.cos(sc.phase) * sc.def.patrolRadius;
          const wy = sc.def.homeY + Math.sin(sc.phase * 1.15) * (sc.def.patrolRadius * 0.65);
          const p3d = world2DTo3D(wx, wy);
          const dx = p3d.x - sc.rig.root.position.x;
          const dz = p3d.z - sc.rig.root.position.z;
          if (Math.hypot(dx, dz) > 0.001) {
            sc.rig.bodyGroup.rotation.y = Math.atan2(dx, dz);
          }
          sc.rig.root.position.set(p3d.x, 0, p3d.z);
          sc.rig.tail.rotation.z = Math.sin(totalTime * 6 + sc.phase) * 0.35;
        }

        for (const cg of env.clouds) {
          cg.position.x += dt * 1.4;
          if (cg.position.x > 240) cg.position.x = -240;
        }
      } else {
        // Animate Pet Shop Display Kittens + Owned Pet Cat inside Palace/Villa!
        interior.shopDisplayKittens.forEach((kit, idx) => {
          kit.tail.rotation.z = Math.sin(totalTime * 6 + idx) * 0.35;
          kit.bodyGroup.position.y = Math.abs(Math.sin(totalTime * 3 + idx)) * 0.14;
        });
        if (ownedPetRef.current) {
          interior.ownedPetRig.tail.rotation.z = Math.sin(totalTime * 6.5) * 0.38;
          const bounce =
            petBounceTimerRef.current > 0
              ? Math.abs(Math.sin(totalTime * 14)) * 0.42
              : Math.abs(Math.sin(totalTime * 2.5)) * 0.06;
          interior.ownedPetRig.bodyGroup.position.y = bounce;
          interior.ownedPetRig.bodyGroup.rotation.y = Math.sin(totalTime * 0.9) * 0.45;
        }
      }

      // 2. Player Movement Physics
      if (!uiLockedRef.current && !isSittingAtMirrorRef.current) {
        if (activeBuilding) {
          let inX = joystickRef.current.x;
          let inY = joystickRef.current.y;
          if (keysRef.current.left || holdControlsRef.current.walkLeft) inX -= 1;
          if (keysRef.current.right || holdControlsRef.current.walkRight) inX += 1;
          if (keysRef.current.up) inY -= 1;
          if (keysRef.current.down) inY += 1;

          const len = Math.hypot(inX, inY);
          if (len > 1) {
            inX /= len;
            inY /= len;
          }
          const mag = Math.min(1, len);

          const cosYaw = Math.cos(cameraYawRef.current);
          const sinYaw = Math.sin(cameraYawRef.current);
          const moveX = inX * cosYaw - inY * sinYaw;
          const moveZ = inX * sinYaw + inY * cosYaw;

          const ip = interiorStateRef.current;
          if (mag > 0.08) {
            const targetAng = Math.atan2(moveZ, moveX);
            ip.angle2D += normalizeAngle(targetAng - ip.angle2D) * Math.min(1, dt * 15);
            const speed = 13.5;
            const resolved = resolveInteriorMovement(
              activeBuilding,
              ip.x,
              ip.z,
              ip.y,
              ip.x + moveX * speed * dt,
              ip.z + moveZ * speed * dt,
            );
            ip.x = resolved.x;
            ip.z = resolved.z;
            ip.y = resolved.y;
            ip.walkPhase += dt * (8 + mag * 5);
            ip.isMoving = true;
          } else {
            ip.walkPhase += dt * 2.2;
            ip.isMoving = false;
          }
        } else if (isInCarRef.current) {
          const car = carStateRef.current;
          if (turboTimerRef.current > 0) {
            turboTimerRef.current = Math.max(0, turboTimerRef.current - dt);
          }
          const isBoost = turboTimerRef.current > 0;
          const maxForwardSpeed = isBoost ? 780 : 540;
          const maxReverseSpeed = -195;

          const gasActive = holdControlsRef.current.gas || keysRef.current.up || isBoost;
          const brakeActive = holdControlsRef.current.brake || keysRef.current.down;
          const steerLeft = holdControlsRef.current.steerLeft || keysRef.current.left;
          const steerRight = holdControlsRef.current.steerRight || keysRef.current.right;
          let steerInput = (steerRight ? 1 : 0) - (steerLeft ? 1 : 0);
          if (Math.abs(joystickRef.current.x) > 0.15) {
            steerInput += joystickRef.current.x;
          }
          steerInput = Math.max(-1, Math.min(1, steerInput));

          if (gasActive) {
            car.speed += (maxForwardSpeed - car.speed) * Math.min(1, dt * 3.6);
          } else if (brakeActive) {
            if (car.speed > 18) {
              car.speed = Math.max(0, car.speed - 640 * dt);
            } else {
              car.speed += (maxReverseSpeed - car.speed) * Math.min(1, dt * 4.0);
            }
          } else {
            car.speed *= Math.pow(0.24, dt);
            if (Math.abs(car.speed) < 3) car.speed = 0;
          }

          if (Math.abs(steerInput) > 0.04) {
            const turnRate = 2.45;
            const speedDir = car.speed < -10 ? -1 : 1;
            const turnStrength = Math.abs(car.speed) > 12 ? 1 : 0.45;
            car.angle2D = normalizeAngle(
              car.angle2D + steerInput * turnRate * speedDir * turnStrength * dt,
            );
          }

          carRig.steeringWheel.rotation.z = -steerInput * 0.65;

          const rawX = car.x + Math.cos(car.angle2D) * car.speed * dt;
          const rawY = car.y + Math.sin(car.angle2D) * car.speed * dt;
          const resolved = resolveWorldCollisions(rawX, rawY, 34);
          car.x = resolved.x;
          car.y = resolved.y;

          playerStateRef.current.x = car.x;
          playerStateRef.current.y = car.y;
          playerStateRef.current.angle2D = car.angle2D;

          const desiredCamYaw = normalizeAngle(car.angle2D + Math.PI / 2);
          cameraYawRef.current +=
            normalizeAngle(desiredCamYaw - cameraYawRef.current) * Math.min(1, dt * 3.2);

          soundEngine.updateCarEngineSound(Math.abs(car.speed) / maxForwardSpeed, true);

          if (Math.abs(car.speed) > 55) {
            exhaustTimer += dt;
            if (exhaustTimer >= 0.055) {
              exhaustTimer = 0;
              const carPos = carRig.root.position;
              const yaw3D = carRig.root.rotation.y;
              const puff = new THREE.Mesh(puffGeo, puffMat);
              puff.position.set(
                carPos.x - Math.sin(yaw3D) * 2.25 + (Math.random() - 0.5) * 0.4,
                0.55,
                carPos.z - Math.cos(yaw3D) * 2.25 + (Math.random() - 0.5) * 0.4,
              );
              env.exteriorRoot.add(puff);
              exhaustParticles.push({
                mesh: puff,
                vx: -Math.sin(yaw3D) * 1.4,
                vy: 1.2 + Math.random() * 0.6,
                vz: -Math.cos(yaw3D) * 1.4,
                life: 0,
                maxLife: 0.55,
              });
            }
          }
        } else {
          let inX = joystickRef.current.x;
          let inY = joystickRef.current.y;
          if (keysRef.current.left || holdControlsRef.current.walkLeft) inX -= 1;
          if (keysRef.current.right || holdControlsRef.current.walkRight) inX += 1;
          if (keysRef.current.up) inY -= 1;
          if (keysRef.current.down) inY += 1;

          const inLen = Math.hypot(inX, inY);
          if (inLen > 1) {
            inX /= inLen;
            inY /= inLen;
          }
          const activeMag = Math.min(1, inLen);

          const cosYaw = Math.cos(cameraYawRef.current);
          const sinYaw = Math.sin(cameraYawRef.current);
          const worldDirX = inX * cosYaw - inY * sinYaw;
          const worldDirY = inX * sinYaw + inY * cosYaw;

          const p = playerStateRef.current;
          const walkSpeed = 255;
          if (activeMag > 0.08) {
            const targetAngle2D = Math.atan2(worldDirY, worldDirX);
            const diff = normalizeAngle(targetAngle2D - p.angle2D);
            p.angle2D += diff * Math.min(1, dt * 15);
            const rawX = p.x + worldDirX * walkSpeed * dt;
            const rawY = p.y + worldDirY * walkSpeed * dt;
            const resolved = resolveWorldCollisions(rawX, rawY, 20);
            p.x = resolved.x;
            p.y = resolved.y;
            p.walkPhase += dt * (8 + activeMag * 6);
            p.isMoving = true;

            energyRef.current = Math.max(15, energyRef.current - dt * 0.35);

            if (Math.abs(inX) > 0.35 && Math.abs(inY) < 0.7 && dragLookRef.current.pointerId === null) {
              cameraYawRef.current += inX * dt * 1.15;
            }
          } else {
            p.walkPhase += dt * 2.2;
            p.isMoving = false;
          }
        }
      }

      // 3. Collectible Golden Coins Outdoors (+15 coins each!)
      if (!activeBuilding) {
        const cx2D = isInCarRef.current ? carStateRef.current.x : playerStateRef.current.x;
        const cy2D = isInCarRef.current ? carStateRef.current.y : playerStateRef.current.y;
        const pickDist = isInCarRef.current ? 60 : 44;

        for (const coin of env.coinMeshes) {
          if (coin.collected) {
            coin.respawnTimer -= dt;
            if (coin.respawnTimer <= 0) {
              coin.collected = false;
              coin.mesh.visible = true;
              collectedCoinIdsRef.current.delete(coin.id);
            }
            continue;
          }
          coin.mesh.rotation.y += dt * 3.0;
          coin.mesh.position.y = 1.15 + Math.sin(totalTime * 3.5 + coin.id) * 0.18;

          if (Math.hypot(cx2D - coin.wx, cy2D - coin.wy) <= pickDist) {
            coin.collected = true;
            coin.respawnTimer = 40;
            coin.mesh.visible = false;
            collectedCoinIdsRef.current.add(coin.id);
            coinsRef.current += 15;
            setCoinsCount(coinsRef.current);
            soundEngine.playCoinCollect();
          }
        }
      }

      exhaustParticles = exhaustParticles.filter((ep) => {
        ep.life += dt;
        ep.mesh.position.x += ep.vx * dt;
        ep.mesh.position.y += ep.vy * dt;
        ep.mesh.position.z += ep.vz * dt;
        const t = ep.life / ep.maxLife;
        ep.mesh.scale.setScalar(1 + t * 1.8);
        if (ep.life >= ep.maxLife) {
          env.exteriorRoot.remove(ep.mesh);
          return false;
        }
        return true;
      });

      // 4. Sync 3D Princess Joudy & Car
      let focus3DX = 0;
      let focus3DY = 0;
      let focus3DZ = 0;

      if (activeBuilding) {
        joudyRig.root.visible = true;
        if (isSleepingRef.current) {
          joudyRig.root.position.set(
            interior.bedPosition3D.x,
            interior.bedPosition3D.y + 1.56,
            interior.bedPosition3D.z - 0.55,
          );
          joudyRig.bodyGroup.rotation.set(-Math.PI / 2, 0, 0);
          joudyRig.leftLeg.rotation.x = 0;
          joudyRig.rightLeg.rotation.x = 0;
          joudyRig.leftArm.rotation.x = 0;
          joudyRig.rightArm.rotation.x = 0;
          focus3DX = interior.bedPosition3D.x;
          focus3DY = interior.bedPosition3D.y;
          focus3DZ = interior.bedPosition3D.z;
        } else if (sittingSpotRef.current === 'throne') {
          joudyRig.root.position.set(interior.throneChair3D.x, 1.48, interior.throneChair3D.z);
          joudyRig.bodyGroup.rotation.set(0, 0, 0);
          joudyRig.leftLeg.rotation.x = -0.98;
          joudyRig.rightLeg.rotation.x = -0.98;
          joudyRig.leftArm.rotation.x = -0.55;
          joudyRig.rightArm.rotation.x = -0.55;
          joudyRig.rightArm.rotation.z = 0;
          joudyRig.headGroup.rotation.y = Math.sin(totalTime * 1.1) * 0.08;
          joudyRig.headGroup.rotation.z = 0;
          focus3DX = interior.throneChair3D.x;
          focus3DY = 0.8;
          focus3DZ = interior.throneChair3D.z;
        } else if (sittingSpotRef.current === 'sofa') {
          joudyRig.root.position.set(interior.sofaSeat3D.x, 0.72, interior.sofaSeat3D.z);
          joudyRig.bodyGroup.rotation.set(0, 0, 0);
          joudyRig.leftLeg.rotation.x = -0.98;
          joudyRig.rightLeg.rotation.x = -0.98;
          joudyRig.leftArm.rotation.x = -0.45;
          joudyRig.rightArm.rotation.x = -0.45;
          joudyRig.rightArm.rotation.z = 0;
          joudyRig.headGroup.rotation.y = Math.sin(totalTime * 1.1) * 0.08;
          joudyRig.headGroup.rotation.z = 0;
          focus3DX = interior.sofaSeat3D.x;
          focus3DY = 0.4;
          focus3DZ = interior.sofaSeat3D.z;
        } else if (isSittingAtMirrorRef.current) {
          // Seated cozily on the Velvet Vanity Chair facing the live Reflector Mirror (-Z)!
          const cy = interior.vanityChair3D.y;
          joudyRig.root.position.set(
            interior.vanityChair3D.x,
            cy + 0.54,
            interior.vanityChair3D.z,
          );
          joudyRig.bodyGroup.rotation.set(0, Math.PI, 0);
          joudyRig.leftLeg.rotation.x = -0.95;
          joudyRig.rightLeg.rotation.x = -0.95;

          if (makeupAnimTimerRef.current > 0) {
            joudyRig.rightArm.rotation.x = -1.6 + Math.sin(totalTime * 16) * 0.25;
            joudyRig.rightArm.rotation.z = -0.35;
          } else {
            joudyRig.rightArm.rotation.x = -0.5;
            joudyRig.rightArm.rotation.z = 0;
          }
          joudyRig.leftArm.rotation.x = -0.45;
          joudyRig.headGroup.rotation.z = Math.sin(totalTime * 1.8) * 0.025;
          joudyRig.headGroup.rotation.y = Math.sin(totalTime * 1.2) * 0.05;
          focus3DX = interior.vanityChair3D.x;
          focus3DY = cy;
          focus3DZ = interior.vanityChair3D.z;
        } else {
          const ip = interiorStateRef.current;
          const bobY = ip.isMoving
            ? Math.abs(Math.sin(ip.walkPhase)) * 0.16
            : Math.sin(ip.walkPhase) * 0.04;
          joudyRig.root.position.set(ip.x, ip.y + bobY, ip.z);
          if (showWardrobeRef.current) {
            joudyRig.bodyGroup.rotation.set(0, totalTime * 0.72, 0);
          } else {
            joudyRig.bodyGroup.rotation.set(0, Math.PI / 2 - ip.angle2D, 0);
          }

          const legSwing = ip.isMoving ? Math.sin(ip.walkPhase) * 0.65 : 0;
          joudyRig.leftLeg.rotation.x = legSwing;
          joudyRig.rightLeg.rotation.x = -legSwing;
          if (carriedStreetCatRef.current) {
            joudyRig.leftArm.rotation.x = -0.85;
            joudyRig.rightArm.rotation.x = -0.85;
          } else {
            joudyRig.leftArm.rotation.x = -legSwing * 0.85;
            joudyRig.rightArm.rotation.x = legSwing * 0.85;
          }
          joudyRig.rightArm.rotation.z = 0;
          joudyRig.bouquetGroup.visible = questStageRef.current >= 2 && !carriedStreetCatRef.current;
          joudyRig.headGroup.rotation.z = ip.isMoving
            ? Math.sin(ip.walkPhase) * 0.06
            : Math.sin(totalTime * 2) * 0.025;
          joudyRig.headGroup.rotation.y = ip.isMoving ? Math.sin(ip.walkPhase * 0.5) * 0.06 : 0;
          focus3DX = ip.x;
          focus3DY = ip.y;
          focus3DZ = ip.z;
        }
      } else {
        const focus2DX = isInCarRef.current ? carStateRef.current.x : playerStateRef.current.x;
        const focus2DY = isInCarRef.current ? carStateRef.current.y : playerStateRef.current.y;
        const focus3D = world2DTo3D(focus2DX, focus2DY);
        focus3DX = focus3D.x;
        focus3DY = 0;
        focus3DZ = focus3D.z;

        if (isInCarRef.current) {
          joudyRig.root.visible = false;
          carRig.driverGroup.visible = true;
          carRig.driverBouquet.visible = questStageRef.current >= 2;
          carRig.driverGroup.position.y = 1.25 + Math.sin(totalTime * 6) * 0.02;
        } else {
          joudyRig.root.visible = true;
          carRig.driverGroup.visible = false;
          const p = playerStateRef.current;
          const bobY = p.isMoving
            ? Math.abs(Math.sin(p.walkPhase)) * 0.16
            : Math.sin(p.walkPhase) * 0.04;
          joudyRig.root.position.set(focus3D.x, bobY, focus3D.z);
          if (showWardrobeRef.current) {
            joudyRig.bodyGroup.rotation.set(0, totalTime * 0.72, 0);
          } else {
            joudyRig.bodyGroup.rotation.set(0, Math.PI / 2 - p.angle2D, 0);
          }

          const legSwing = p.isMoving ? Math.sin(p.walkPhase) * 0.65 : 0;
          joudyRig.leftLeg.rotation.x = legSwing;
          joudyRig.rightLeg.rotation.x = -legSwing;
          if (carriedStreetCatRef.current) {
            joudyRig.leftArm.rotation.x = -0.85;
            joudyRig.rightArm.rotation.x = -0.85;
          } else {
            joudyRig.leftArm.rotation.x = -legSwing * 0.85;
            joudyRig.rightArm.rotation.x = legSwing * 0.85;
          }
          joudyRig.rightArm.rotation.z = 0;
          joudyRig.bouquetGroup.visible = questStageRef.current >= 2 && !carriedStreetCatRef.current;
          joudyRig.headGroup.rotation.z = p.isMoving
            ? Math.sin(p.walkPhase) * 0.06
            : Math.sin(totalTime * 2) * 0.025;
          joudyRig.headGroup.rotation.y = p.isMoving ? Math.sin(p.walkPhase * 0.5) * 0.06 : 0;
        }

        const carP3 = world2DTo3D(carStateRef.current.x, carStateRef.current.y);
        carRig.root.position.set(carP3.x, 0, carP3.z);
        carRig.root.rotation.y = Math.PI / 2 - carStateRef.current.angle2D;
        for (const w of carRig.wheels) {
          w.rotation.x += carStateRef.current.speed * dt * 0.05;
        }

        for (const fm of env.fountainWaterMeshes) {
          fm.position.y = 0.72 + Math.sin(totalTime * 3.5) * 0.08;
        }

        const obj = getQuestObjective(questStageRef.current, isInCarRef.current);
        env.beaconGroup.visible = questStageRef.current < TOTAL_QUEST_COUNT;
        if (env.beaconGroup.visible) {
          const bp = world2DTo3D(obj.targetX, obj.targetY);
          env.beaconGroup.position.set(bp.x, 0, bp.z);
          env.beaconGroup.rotation.y += dt * 1.4;
        }
      }

      // 5. Camera Framing (Wardrobe Full Body / Sleep / Throne / Makeup / Stargaze / Clamped Interior / Exterior)
      if (showWardrobeRef.current && !isInCarRef.current) {
        // Full-Body 3D Runway Camera so her entire body from boots to crown is centered and clear!
        _camDesiredPos.set(focus3DX, focus3DY + 2.15, focus3DZ + 5.6);
        _camDesiredLook.set(focus3DX, focus3DY + 1.45, focus3DZ);
      } else if (activeBuilding && isSleepingRef.current) {
        // Cozy Sleep Camera showing Joudy sleeping peacefully on her Royal Bed!
        _camDesiredPos.set(
          interior.bedPosition3D.x + 5.2,
          interior.bedPosition3D.y + 4.4,
          interior.bedPosition3D.z + 5.0,
        );
        _camDesiredLook.set(
          interior.bedPosition3D.x,
          interior.bedPosition3D.y + 1.35,
          interior.bedPosition3D.z - 0.3,
        );
      } else if (activeBuilding && isStargazingRef.current) {
        _camDesiredPos.set(0, 3.2, -7.2);
        _camDesiredLook.set(0, 11.2, -14.0);
      } else if (activeBuilding && sittingSpotRef.current) {
        const seat =
          sittingSpotRef.current === 'throne' ? interior.throneChair3D : interior.sofaSeat3D;
        _camDesiredPos.set(seat.x + 2.1, seat.y + 3.2, seat.z + 6.4);
        _camDesiredLook.set(seat.x, seat.y + 2.1, seat.z);
      } else if (activeBuilding && isSittingAtMirrorRef.current) {
        const my = interior.vanityChair3D.y;
        const cz = interior.vanityChair3D.z;
        if (mirrorCameraModeRef.current === 'face') {
          // Crystal-clear front close-up directly framing Joudy's face while applying makeup!
          _camDesiredPos.set(0.32, my + 2.98, cz - 2.35);
          _camDesiredLook.set(0, my + 2.75, cz);
        } else {
          // Real-Time Reflector Mirror Angle showing Joudy + her live Mirror Reflection!
          _camDesiredPos.set(1.75, my + 3.25, cz + 2.8);
          _camDesiredLook.set(-0.15, my + 3.15, -24.55);
        }
      } else {
        const isUnderBalcony =
          Boolean(activeBuilding?.hasSecondFloor) &&
          focus3DY < 2.0 &&
          interiorStateRef.current.z < -4.0;
        const camDist = activeBuilding ? 7.8 : isInCarRef.current ? 12.2 : 9.2;
        const camHeight = activeBuilding
          ? isUnderBalcony
            ? 3.1
            : 4.1
          : isInCarRef.current
            ? 5.2
            : 4.35;
        const lookAheadDist = activeBuilding ? 3.2 : isInCarRef.current ? 9.5 : 5.5;
        const yaw = cameraYawRef.current;

        let desiredX = focus3DX - Math.sin(yaw) * camDist;
        let desiredY = focus3DY + camHeight;
        let desiredZ = focus3DZ + Math.cos(yaw) * camDist;

        if (activeBuilding) {
          desiredX = Math.max(-INTERIOR_HALF_W + 0.5, Math.min(INTERIOR_HALF_W - 0.5, desiredX));
          desiredZ = Math.max(-INTERIOR_HALF_D + 0.5, Math.min(INTERIOR_HALF_D - 0.5, desiredZ));
          desiredY = Math.max(1.8, Math.min(19.8, desiredY));
        }

        _camDesiredPos.set(desiredX, desiredY, desiredZ);
        _camDesiredLook.set(
          focus3DX + Math.sin(yaw) * lookAheadDist,
          focus3DY + 2.15,
          focus3DZ - Math.cos(yaw) * lookAheadDist,
        );
      }

      const camSmooth = Math.min(1, dt * 8.5);
      camera.position.lerp(_camDesiredPos, camSmooth);
      _camCurrentLook.lerp(_camDesiredLook, camSmooth);
      camera.lookAt(_camCurrentLook);

      // 6. Sync HUD State & Mini-Map
      hudSyncTimer += dt;
      if (hudSyncTimer >= 0.08) {
        hudSyncTimer = 0;
        setEnergy(Math.round(energyRef.current));

        if (activeBuilding) {
          const ip = interiorStateRef.current;
          const floorNow: 1 | 2 =
            activeBuilding.hasSecondFloor && ip.y >= SECOND_FLOOR_Y * 0.55 ? 2 : 1;
          if (floorNow !== lastFloorNum) {
            lastFloorNum = floorNow;
            setInteriorFloorNum(floorNow);
          }

          const dExit = Math.hypot(ip.x - interior.exitDoor3D.x, ip.z - interior.exitDoor3D.z);
          const nExit = dExit <= 4.4 && ip.y < 2.2;
          if (nExit !== lastNearExit) {
            lastNearExit = nExit;
            setNearExitDoor(nExit);
          }

          const dBed =
            activeBuilding.hasBed
              ? Math.hypot(
                  ip.x - interior.bedPosition3D.x,
                  ip.z - interior.bedPosition3D.z,
                ) + Math.abs(ip.y - interior.bedPosition3D.y)
              : 999;
          const nBed = dBed <= 5.4;
          if (nBed !== lastNearBed) {
            lastNearBed = nBed;
            setNearBed(nBed);
          }

          const dMirror =
            activeBuilding.hasMakeup
              ? Math.hypot(ip.x - interior.vanityChair3D.x, ip.z - interior.vanityChair3D.z) +
                Math.abs(ip.y - interior.vanityChair3D.y)
              : 999;
          const nMirror = dMirror <= 4.6;
          if (nMirror !== lastNearMirror) {
            lastNearMirror = nMirror;
            setNearVanityMirror(nMirror);
          }

          const dWardrobe =
            activeBuilding.hasWardrobe
              ? Math.hypot(ip.x - interior.wardrobe3D.x, ip.z - interior.wardrobe3D.z) +
                Math.abs(ip.y - interior.wardrobe3D.y)
              : 999;
          const nWardrobe = dWardrobe <= 4.8;
          if (nWardrobe !== lastNearWardrobe) {
            lastNearWardrobe = nWardrobe;
            setNearWardrobe(nWardrobe);
          }

          const dPet =
            activeBuilding.hasPetCorner && ownedPetRef.current
              ? Math.hypot(ip.x - interior.petCare3D.x, ip.z - interior.petCare3D.z) +
                Math.abs(ip.y - interior.petCare3D.y)
              : 999;
          const nPet = dPet <= 4.8;
          if (nPet !== lastNearPetCorner) {
            lastNearPetCorner = nPet;
            setNearPetCorner(nPet);
          }

          const dThrone =
            activeBuilding.kind === 'palace' && ip.y < 2.2
              ? Math.hypot(ip.x - interior.throneChair3D.x, ip.z - interior.throneChair3D.z)
              : 999;
          const nThrone = dThrone <= 5.4;
          if (nThrone !== lastNearThrone) {
            lastNearThrone = nThrone;
            setNearThrone(nThrone);
          }

          const hasLounge =
            activeBuilding.kind === 'palace' ||
            activeBuilding.kind === 'villa' ||
            activeBuilding.kind === 'house_pink' ||
            activeBuilding.kind === 'house_mint' ||
            activeBuilding.kind === 'house_sky';
          const dSofa =
            hasLounge && ip.y < 2.2
              ? Math.hypot(ip.x - interior.sofaSeat3D.x, ip.z - interior.sofaSeat3D.z)
              : 999;
          const nSofa = dSofa <= 5.2;
          if (nSofa !== lastNearSofa) {
            lastNearSofa = nSofa;
            setNearSofa(nSofa);
          }

          const dScope = activeBuilding.hasObservatory
            ? Math.hypot(ip.x - interior.telescope3D.x, ip.z - interior.telescope3D.z)
            : 999;
          const nScope = dScope <= 5.8;
          if (nScope !== lastNearTelescope) {
            lastNearTelescope = nScope;
            setNearTelescope(nScope);
          }

          const dPetShop = activeBuilding.hasPetShop
            ? Math.hypot(ip.x - interior.petShopCounter3D.x, ip.z - interior.petShopCounter3D.z)
            : 999;
          const nPetShop = dPetShop <= 5.8;
          if (nPetShop !== lastNearPetShopCounter) {
            lastNearPetShopCounter = nPetShop;
            setNearPetShopCounter(nPetShop);
          }

          const dCafe = activeBuilding.hasCafeCounter
            ? Math.hypot(ip.x - interior.cafeCounter3D.x, ip.z - interior.cafeCounter3D.z)
            : 999;
          const nCafe = dCafe <= 5.6;
          if (nCafe !== lastNearCafe) {
            lastNearCafe = nCafe;
            setNearCafeCounter(nCafe);
          }
        } else {
          const focus2DX = isInCarRef.current ? carStateRef.current.x : playerStateRef.current.x;
          const focus2DY = isInCarRef.current ? carStateRef.current.y : playerStateRef.current.y;
          const focusAngle = isInCarRef.current
            ? carStateRef.current.angle2D
            : playerStateRef.current.angle2D;

          const distToCar = Math.hypot(
            focus2DX - carStateRef.current.x,
            focus2DY - carStateRef.current.y,
          );
          const nowNearCar = !isInCarRef.current && distToCar <= 115;
          if (nowNearCar !== lastNearCar) {
            lastNearCar = nowNearCar;
            setNearCar(nowNearCar);
          }

          let closestNpc: WorldNpcDef | null = null;
          let closestDist = 115;
          for (const rig of npcRigs) {
            const npcWx = rig.root.position.x / WORLD_3D_SCALE + WORLD_WIDTH / 2;
            const npcWy = rig.root.position.z / WORLD_3D_SCALE + WORLD_HEIGHT / 2;
            const d = Math.hypot(focus2DX - npcWx, focus2DY - npcWy);
            if (d <= closestDist) {
              closestDist = d;
              closestNpc = rig.def;
            }
          }
          const nextNpcId = closestNpc ? closestNpc.id : null;
          if (nextNpcId !== lastNpcId) {
            lastNpcId = nextNpcId;
            setNearbyNpc(closestNpc);
          }

          // Nearest Street Cat (walk mode only)
          let closestStreetCat: StreetCatDef | null = null;
          if (!isInCarRef.current && !carriedStreetCatRef.current) {
            let bestCatDist = 75;
            for (const sc of env.streetCatRigs) {
              if (sc.pickedUp) continue;
              const cx = sc.rig.root.position.x / WORLD_3D_SCALE + WORLD_WIDTH / 2;
              const cy = sc.rig.root.position.z / WORLD_3D_SCALE + WORLD_HEIGHT / 2;
              const dc = Math.hypot(focus2DX - cx, focus2DY - cy);
              if (dc <= bestCatDist) {
                bestCatDist = dc;
                closestStreetCat = sc.def;
              }
            }
          }
          const nextCatId = closestStreetCat ? closestStreetCat.id : null;
          if (nextCatId !== lastStreetCatId) {
            lastStreetCatId = nextCatId;
            setNearbyStreetCat(closestStreetCat);
          }

          let closestDoor: WorldBuilding | null = null;
          if (!isInCarRef.current) {
            let bestDoorDist = 96;
            for (const b of WORLD_BUILDINGS) {
              if (!b.enterable) continue;
              const dd = Math.hypot(focus2DX - b.doorX, focus2DY - b.doorY);
              if (dd <= bestDoorDist) {
                bestDoorDist = dd;
                closestDoor = b;
              }
            }
          }
          const nextDoorId = closestDoor ? closestDoor.id : null;
          if (nextDoorId !== lastDoorId) {
            lastDoorId = nextDoorId;
            setNearbyDoorBuilding(closestDoor);
          }

          const activeObj = getQuestObjective(questStageRef.current, isInCarRef.current);
          const distGoal = Math.round(
            Math.hypot(activeObj.targetX - focus2DX, activeObj.targetY - focus2DY) / 14,
          );
          if (distGoal !== lastDistMeters) {
            lastDistMeters = distGoal;
            setDistanceToGoalMeters(distGoal);
          }

          const mini = miniMapRef.current;
          const mCtx = mini?.getContext('2d');
          if (mini && mCtx) {
            renderKingdomMap(
              mCtx,
              mini.width,
              mini.height,
              focus2DX,
              focus2DY,
              focusAngle,
              carStateRef.current.x,
              carStateRef.current.y,
              questStageRef.current,
              activeObj.targetX,
              activeObj.targetY,
              collectedCoinIdsRef.current,
              false,
            );
          }
        }
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = window.requestAnimationFrame(tick);
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    frameId = window.requestAnimationFrame(tick);

    return () => {
      disposed = true;
      configureInteriorSceneRef.current = null;
      applyFaceTextureRef.current = null;
      applyOutfit3DRef.current = null;
      applyCarriedCat3DRef.current = null;
      syncOwnedPet3DRef.current = null;
      pickupStreetCatActionRef.current = null;

      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      ro.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      env.cleanup();
      interior.cleanup();
      puffGeo.dispose();
      puffMat.dispose();
      envTarget.dispose();
      if (activeFaceTex) activeFaceTex.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Sprite) {
          obj.material.map?.dispose();
          obj.material.dispose();
          return;
        }
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => {
            const std = m as THREE.MeshStandardMaterial;
            std.map?.dispose();
            m.dispose();
          });
        } else if (mat) {
          const std = mat as THREE.MeshStandardMaterial;
          std.map?.dispose();
          mat.dispose();
        }
      });

      renderer.dispose();
      mount.innerHTML = '';
    };
  }, [realImageSrc]);

  const handleLookPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      dialogue ||
      showCoronationModal ||
      showCompletionModal ||
      isSleeping ||
      showFullMap ||
      showWardrobeModal ||
      showPetShopModal ||
      showQuestLogModal ||
      isSittingAtMirror
    ) {
      return;
    }
    dragLookRef.current = { pointerId: e.pointerId, lastX: e.clientX };
  };

  const handleLookPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSittingAtMirror) {
      const rect = stageRef.current?.getBoundingClientRect();
      if (rect) {
        setMakeupBrushPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      return;
    }
    if (dragLookRef.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragLookRef.current.lastX;
    dragLookRef.current.lastX = e.clientX;
    cameraYawRef.current += dx * 0.0065;
  };

  const handleLookPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragLookRef.current.pointerId === e.pointerId) {
      dragLookRef.current.pointerId = null;
    }
  };

  const bindHoldControl = (
    controlKey: HoldControlKey,
    setVisual: React.Dispatch<React.SetStateAction<boolean>>,
  ) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if unsupported
      }
      holdControlsRef.current[controlKey] = true;
      setVisual(true);
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      holdControlsRef.current[controlKey] = false;
      setVisual(false);
    },
    onPointerCancel: () => {
      holdControlsRef.current[controlKey] = false;
      setVisual(false);
    },
    onLostPointerCapture: () => {
      holdControlsRef.current[controlKey] = false;
      setVisual(false);
    },
  });

  const objective = getQuestObjective(questStage, isInCar);
  const currentDialogueLine = dialogue ? dialogue.lines[dialogue.lineIndex] : null;
  const activeOutfit = OUTFIT_CATALOG.find((o) => o.id === outfitId) ?? OUTFIT_CATALOG[0];

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-4 flex flex-col gap-2.5 h-[calc(100dvh-0.5rem)] max-h-[880px]"
    >
      {/* Top Quest Tracker, Coins, Energy & Navigation Header */}
      <header className="bg-white/95 border border-rose-200/90 rounded-2xl px-3 sm:px-5 py-2.5 shadow-sm flex items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.stopCarEngineSound();
              soundEngine.stopBackgroundMusic();
              onExitToHub();
            }}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl border border-rose-200 bg-[#FFF7FA] hover:bg-rose-100 text-xs sm:text-sm font-bold text-[#2D1824] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowRight className="w-4 h-4 text-rose-600" />
            <span>الرئيسية</span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-extrabold text-rose-600">
              <span className="inline-flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>
                  {insideBuilding
                    ? `${insideBuilding.name}${insideBuilding.hasSecondFloor ? ` (الدور ${interiorFloorNum})` : ''}`
                    : objective.stepLabel}
                </span>
              </span>
              {!insideBuilding && questStage < TOTAL_QUEST_COUNT && (
                <>
                  <span className="text-rose-300" aria-hidden="true">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-700 tabular-nums">
                    <Compass className="w-3.5 h-3.5" />
                    <span>
                      {objective.targetLabel} ({distanceToGoalMeters}م)
                    </span>
                  </span>
                </>
              )}
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#2D1824] truncate">{objective.title}</p>
          </div>
        </div>

        {/* Coins, Energy, Quests, Wardrobe, Map, Sound */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-extrabold tabular-nums bg-amber-50 border border-amber-300 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-sm">
            <span className="inline-flex items-center gap-1 text-amber-800">
              <Coins className="w-4 h-4 text-amber-500" />
              <span>{coinsCount}</span>
              <span className="hidden sm:inline text-[11px]">عملة</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-emerald-700">
              <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-400" />
              <span>{energy}%</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowQuestLogModal(true)}
            aria-label="سجل المهام"
            className="h-10 px-2.5 rounded-xl border border-rose-200 bg-[#FFF7FA] hover:bg-rose-100 text-rose-700 flex items-center gap-1 text-xs font-extrabold transition-colors cursor-pointer"
          >
            <ClipboardList className="w-4 h-4" />
            <span className="hidden md:inline">
              المهام ({Math.min(TOTAL_QUEST_COUNT, questStage)}/{TOTAL_QUEST_COUNT})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowWardrobeModal((prev) => !prev)}
            aria-label="خزانة الملابس"
            className="w-10 h-10 rounded-xl border border-rose-200 bg-[#FFF7FA] hover:bg-rose-100 text-purple-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Shirt className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowFullMap(true)}
            aria-label="عرض الخريطة الكاملة"
            className="w-10 h-10 rounded-xl border border-rose-200 bg-[#FFF7FA] hover:bg-rose-100 text-rose-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <MapIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
            className="w-10 h-10 rounded-xl border border-rose-200 bg-[#FFF7FA] hover:bg-rose-100 text-[#2D1824] flex items-center justify-center transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main 3D Viewport */}
      <div
        ref={stageRef}
        onPointerDown={handleLookPointerDown}
        onPointerMove={handleLookPointerMove}
        onPointerUp={handleLookPointerUp}
        onPointerCancel={handleLookPointerUp}
        onPointerLeave={() => setMakeupBrushPosition(null)}
        className="relative flex-1 min-h-[380px] rounded-3xl overflow-hidden border-2 border-rose-200 bg-[#DBEAFE] shadow-[0_20px_50px_-15px_rgba(225,29,72,0.2)] select-none touch-none"
      >
        <div ref={canvasMountRef} className="w-full h-full" />

        {isSittingAtMirror && makeupBrushPosition && (
          <motion.div
            className="pointer-events-none absolute z-40 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-pink-500/85 text-xl shadow-[0_0_22px_rgba(236,72,153,.7)]"
            animate={makeupBrushActive ? { scale: [1, 1.28, 1], rotate: [0, -18, 12, 0] } : { scale: 1 }}
            transition={{ duration: 0.55 }}
            style={{ left: makeupBrushPosition.x - 20, top: makeupBrushPosition.y - 20 }}
            aria-hidden="true"
          >
            🖌️
          </motion.div>
        )}

        {webglFallback && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#FFF5F8] p-6 text-center gap-3">
            <Crown className="w-12 h-12 text-rose-500" />
            <p className="text-lg font-bold text-[#2D1824]">
              تعذّر تشغيل العرض ثلاثي الأبعاد على هذا المتصفح.
            </p>
            <button
              type="button"
              onClick={onExitToHub}
              className="py-2.5 px-5 rounded-xl bg-rose-500 text-white font-bold text-sm cursor-pointer"
            >
              العودة للشاشة الرئيسية
            </button>
          </div>
        )}

        {/* Non-Overlapping Top HUD Row (Left: MiniMap/Pet/Coins | Center: Toast | Right: Portrait) */}
        <div
          dir="ltr"
          className="absolute top-2.5 inset-x-2.5 sm:top-3 sm:inset-x-3 z-20 flex items-start justify-between gap-2 pointer-events-none"
        >
          {/* Left Flank: MiniMap + Always-Visible Coin Counter or Owned Pet Card */}
          <div className="flex flex-col items-start gap-1.5 shrink-0 pointer-events-auto">
            {!insideBuilding && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setShowFullMap(true)}
                aria-label="تكبير خريطة المملكة"
                className="rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-white/95 cursor-pointer"
              >
                <canvas ref={miniMapRef} width={118} height={86} className="block" />
                <span
                  dir="rtl"
                  className="block text-[10px] font-extrabold text-rose-700 bg-white/95 py-0.5 text-center border-t border-rose-100"
                >
                  خريطة المملكة 🗺️
                </span>
              </button>
            )}

            {insideBuilding?.hasPetCorner && ownedPet && !isSittingAtMirror && (
              <div
                dir="rtl"
                onPointerDown={(e) => e.stopPropagation()}
                className="bg-white/95 border-2 border-amber-300 rounded-2xl px-2.5 py-1.5 shadow-lg space-y-1 max-w-[195px]"
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold text-amber-900">
                  <span>🐱 {ownedPet.name}</span>
                  <span className="text-rose-600">
                    {ownedPet.stage === 1
                      ? 'صغيرة 🐾'
                      : ownedPet.stage === 2
                        ? 'يافعة ✨'
                        : 'ملكية 👑'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                  <div className="text-rose-700">🐟 شبع: {ownedPet.hunger}%</div>
                  <div className="text-sky-700">💧 ارتواء: {ownedPet.thirst}%</div>
                </div>
                <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-amber-500 to-rose-500 transition-all"
                    style={{ width: `${Math.min(100, (ownedPet.growthXp / 200) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div
              dir="rtl"
              className="bg-amber-50/95 border border-amber-300 rounded-xl px-2.5 py-1 shadow-md flex items-center gap-1.5 text-xs font-extrabold text-amber-800"
            >
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span className="tabular-nums">{coinsCount} عملة</span>
            </div>
          </div>

          {/* Center Slot: Auto-Expiring Status Toast (Never overlaps Portrait or MiniMap!) */}
          <div dir="rtl" className="flex-1 flex justify-center min-w-0 px-1 pt-0.5">
            <AnimatePresence>
              {hudToast && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="pointer-events-auto bg-white/95 border border-amber-300 rounded-2xl px-3 py-1.5 shadow-md flex items-center gap-2 max-w-md"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-[11px] sm:text-xs font-bold text-[#2D1824] line-clamp-2 leading-snug">
                    {hudToast}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHudToast(null)}
                    aria-label="إغلاق الإشعار"
                    className="text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Flank: Compact Portrait HUD (Always cleanly separated on the right) */}
          <div
            dir="rtl"
            className="shrink-0 bg-white/95 border-2 border-rose-300 rounded-2xl p-1 sm:p-1.5 shadow-[0_8px_22px_rgba(45,24,36,0.16)] flex items-center gap-1.5 max-w-[168px] sm:max-w-[205px]"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border-2 border-amber-300 bg-rose-50 shrink-0">
              <Image
                src={realImageSrc}
                alt="الأميرة جودي"
                fill
                sizes="44px"
                referrerPolicy="no-referrer"
                className="object-cover object-center"
              />
            </div>
            <div className="hidden sm:block min-w-0 flex-1 text-right pl-1">
              <div className="flex items-center gap-1 text-[10px] font-extrabold text-rose-700">
                <Crown className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
                <span className="truncate">الأميرة جودي</span>
              </div>
              <p className="text-[10px] font-bold text-[#2D1824] leading-tight truncate">
                {carriedStreetCat
                  ? `تحمل: ${carriedStreetCat.name}`
                  : isSittingAtMirror
                    ? 'تضع مكياجاً 💄'
                    : sittingSpot === 'throne'
                      ? 'على العرش الملكي 👑'
                      : `${activeOutfit.badge} ${activeOutfit.name}`}
              </p>
            </div>
          </div>
        </div>

        {/* === SLIM UNOBSTRUCTED MAKEUP STUDIO DOCK (Face always crystal clear!) === */}
        <AnimatePresence>
          {isSittingAtMirror && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-x-3 sm:inset-x-6 bottom-2.5 z-30 bg-white/95 border-2 border-pink-300 rounded-2xl px-3 py-2.5 shadow-2xl max-w-4xl mx-auto space-y-2"
            >
              {/* Row 1: Category Tabs + Camera Mode Switcher + Stand Up */}
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  {[
                    { id: 'lip' as const, label: 'أحمر الشفاه' },
                    { id: 'blush' as const, label: 'أحمر الخدود' },
                    { id: 'eye' as const, label: 'ظلال العيون' },
                    { id: 'glam' as const, label: 'لمسات إضافية' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setMakeupTab(tab.id)}
                      className={`py-1 px-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                        makeupTab === tab.id
                          ? 'bg-pink-600 text-white shadow'
                          : 'bg-pink-50 text-pink-800 hover:bg-pink-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMirrorCameraMode((m) => (m === 'face' ? 'mirror' : 'face'))}
                    className="py-1 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold flex items-center gap-1 cursor-pointer border border-rose-200"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>{mirrorCameraMode === 'face' ? 'عرض المرآة 🪞' : 'عرض الوجه مباشرة 👩'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSittingAtMirror(false);
                      isSittingAtMirrorRef.current = false;
                      setShowWardrobeModal(true);
                    }}
                    className="py-1 px-2.5 rounded-xl bg-purple-600 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <Shirt className="w-3.5 h-3.5" />
                    <span>الملابس</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleSitAtMirror}
                    className="py-1 px-3 rounded-xl bg-slate-900 text-white text-xs font-extrabold cursor-pointer"
                  >
                    قومي 🪑
                  </button>
                </div>
              </div>

              {/* Row 2: Active Swatches Only (Keeps 80% of screen completely open around Joudy's face!) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                {makeupTab === 'lip' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold text-rose-800">أحمر الشفاه:</span>
                    {LIPSTICK_SHADES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          handleUpdateMakeup((p) => ({ ...p, lipColor: s.color }), `أحمر شفاه ${s.label}`)
                        }
                        className={`py-1 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                          makeupState.lipColor === s.color
                            ? 'border-slate-900 bg-rose-100 shadow-sm'
                            : 'border-rose-200 bg-white'
                        }`}
                      >
                        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-rose-100 bg-gradient-to-br from-rose-50 to-rose-200 shadow-sm" aria-hidden="true">
                          <span className="relative h-4 w-2 rounded-t-full rounded-b-sm border border-rose-900/30" style={{ backgroundColor: s.color }}>
                            <span className="absolute -top-1 left-0 h-1.5 w-full rounded-t-full bg-white/90" />
                          </span>
                        </span>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {makeupTab === 'blush' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold text-pink-800">بلاشر الخدود:</span>
                    {BLUSH_SHADES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          handleUpdateMakeup(
                            (p) => ({ ...p, blushColor: s.color }),
                            `أحمر خدود ${s.label}`,
                          )
                        }
                        className={`py-1 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                          makeupState.blushColor === s.color
                            ? 'border-slate-900 bg-pink-100 shadow-sm'
                            : 'border-pink-200 bg-white'
                        }`}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-slate-100 shadow-sm" aria-hidden="true">
                          <span className="h-4 w-4 rounded-full border border-white/80 shadow-inner" style={{ background: `radial-gradient(circle at 35% 30%, #fff 0%, ${s.color} 68%)` }} />
                        </span>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {makeupTab === 'eye' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold text-purple-800">ظلال العيون:</span>
                    {EYESHADOW_SHADES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          handleUpdateMakeup(
                            (p) => ({ ...p, eyeshadowColor: s.color }),
                            `ظلال عيون ${s.label}`,
                          )
                        }
                        className={`py-1 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                          makeupState.eyeshadowColor === s.color
                            ? 'border-slate-900 bg-purple-100 shadow-sm'
                            : 'border-purple-200 bg-white'
                        }`}
                      >
                        <span className="flex h-7 w-8 shrink-0 items-center justify-center gap-0.5 rounded-md border border-violet-200 bg-gradient-to-br from-white to-violet-100 p-1 shadow-sm" aria-hidden="true">
                          <span className="h-3 w-1.5 rounded-sm bg-amber-300" />
                          <span className="h-3 w-1.5 rounded-sm" style={{ backgroundColor: s.color }} />
                          <span className="h-3 w-1.5 rounded-sm bg-fuchsia-300" />
                        </span>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {makeupTab === 'glam' && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateMakeup((p) => ({ ...p, eyeliner: !p.eyeliner }), 'محدد عيون')
                      }
                      className={`py-1 px-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        makeupState.eyeliner
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="flex h-7 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white shadow-sm" aria-hidden="true"><span className="h-1 w-5 -rotate-12 rounded-full bg-slate-900 shadow-sm" /></span>
                      <span>محدد العيون</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateMakeup(
                          (p) => ({ ...p, highlighter: !p.highlighter }),
                          'إضاءة الوجه',
                        )
                      }
                      className={`py-1 px-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        makeupState.highlighter
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <span className="flex h-7 w-8 items-center justify-center rounded-lg border border-amber-200 bg-gradient-to-br from-yellow-50 to-amber-200 shadow-sm" aria-hidden="true"><span className="h-4 w-5 rounded-full border border-amber-400 bg-gradient-to-br from-yellow-100 to-amber-400 shadow-inner" /></span>
                      <span>مسحوق إضاءة الوجه</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateMakeup(
                          (p) => ({ ...p, cheekGlitter: !p.cheekGlitter }),
                          'جليتر نجوم الخدود',
                        )
                      }
                      className={`py-1 px-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        makeupState.cheekGlitter
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'bg-pink-50 text-pink-800 border-pink-200'
                      }`}
                    >
                      <span className="flex h-7 w-8 items-center justify-center rounded-lg border border-pink-200 bg-gradient-to-br from-white to-pink-100 shadow-sm" aria-hidden="true"><span className="h-4 w-4 rounded-full border border-pink-300 bg-[radial-gradient(circle_at_30%_30%,white,#f9a8d4_55%,#be185d)] shadow-inner" /></span>
                      <span>لمعان الخدود</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMakeupState(DEFAULT_MAKEUP_STATE);
                    soundEngine.playDialoguePop();
                    triggerTopNotification('تم مسح المكياج والعودة للإطلالة الطبيعية 🧼');
                  }}
                  className="py-1 px-2.5 rounded-xl text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 cursor-pointer mr-auto"
                >
                  مسح 🧼
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === FLOATING SITTING BAR (Royal Throne & Lounge Sofa) === */}
        <AnimatePresence>
          {sittingSpot && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-x-4 bottom-4 z-30 flex justify-center pointer-events-none"
            >
              <div className="pointer-events-auto bg-white/95 border-2 border-amber-300 rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-500 fill-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold text-[#2D1824]">
                  {sittingSpot === 'throne'
                    ? 'تجلسين الآن على عرش الأميرة جودي الملكي 👑'
                    : 'تجلسين الآن على الأريكة الملكية المريحة 🛋️'}
                </span>
                <button
                  type="button"
                  onClick={() => handleSitOnSeat(null)}
                  className="py-1.5 px-3.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold cursor-pointer whitespace-nowrap"
                >
                  قومي من المقعد 🚶‍♀️
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === FLOATING TELESCOPE STARGAZING BAR (Royal Observatory) === */}
        <AnimatePresence>
          {isStargazing && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-x-4 bottom-4 z-30 flex justify-center pointer-events-none"
            >
              <div className="pointer-events-auto bg-indigo-950/95 border-2 border-amber-300 rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-3 text-white">
                <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold">
                  تشاهدين كوكب الأميرة جودي والنجوم الذهبية عبر التلسكوب السحري 🔭✨
                </span>
                <button
                  type="button"
                  onClick={handleToggleTelescope}
                  className="py-1.5 px-3.5 rounded-xl bg-amber-400 text-indigo-950 text-xs font-extrabold cursor-pointer whitespace-nowrap"
                >
                  إنهاء المشاهدة
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === FLOATING TRANSPARENT SLEEP RIBBON (No dark screen blocker! Clearly see Joudy sleeping!) === */}
        <AnimatePresence>
          {isSleeping && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-x-4 bottom-4 z-30 flex justify-center pointer-events-none"
            >
              <div className="pointer-events-auto bg-white/95 border-2 border-indigo-300 rounded-2xl px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-center gap-3">
                <Moon className="w-5 h-5 text-indigo-600 shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold text-[#2D1824]">
                  نوم هانئ يا أميرة جودي على السرير الملكي 💤 — تم شحن الطاقة 100% ⚡
                </span>
                <button
                  type="button"
                  onClick={handleWakeUp}
                  className="py-1.5 px-4 rounded-xl bg-gradient-to-l from-amber-500 to-rose-500 text-white font-extrabold text-xs sm:text-sm shadow cursor-pointer whitespace-nowrap"
                >
                  استيقظي بنشاط ☀️
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === LIVE 3D FULL-BODY WARDROBE STRIP (Joudy stands tall & unobstructed above it!) === */}
        <AnimatePresence>
          {showWardrobeModal && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-x-3 sm:inset-x-6 bottom-2.5 z-30 bg-white/95 border-2 border-purple-300 rounded-2xl p-3 shadow-2xl max-w-4xl mx-auto space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#2D1824]">
                    اختاري إطلالتكِ وشاهدي جسم جودي بالكامل مباشرة 👗🧥
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWardrobeModal(false)}
                  className="py-1 px-3 rounded-xl bg-slate-900 text-white text-xs font-extrabold cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم ✨</span>
                </button>
              </div>

              <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
                {OUTFIT_CATALOG.map((item) => {
                  const selected = item.id === outfitId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectOutfit(item.id)}
                      className={`shrink-0 w-36 text-right p-2 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-2 ${
                        selected
                          ? 'border-rose-500 bg-rose-50 shadow-sm'
                          : 'border-rose-100 hover:border-rose-300 bg-white'
                      }`}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 border border-white shadow-sm"
                        style={{ backgroundColor: item.primaryHex }}
                      >
                        {item.badge}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-[11px] text-[#2D1824] line-clamp-2 leading-tight">
                          {item.name}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === CONTROLS ZONE: DRIVING vs WALKING === */}
        {!isSittingAtMirror &&
          !sittingSpot &&
          !isSleeping &&
          !isStargazing &&
          !showWardrobeModal &&
          (isInCar ? (
            <>
              {/* Driving Mode Bottom-Left: Steering Arrows (dir="ltr" so LEFT is on Left & RIGHT is on Right!) */}
              <div
                dir="ltr"
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute left-4 bottom-4 sm:left-6 sm:bottom-6 z-20 flex items-center gap-3"
              >
                <button
                  type="button"
                  aria-label="توجيه لليسار"
                  {...bindHoldControl('steerLeft', setSteerLeftPressed)}
                  className={`w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-2xl border-2 border-white flex flex-col items-center justify-center transition-transform cursor-pointer select-none touch-none ${
                    steerLeftPressed
                      ? 'bg-rose-600 text-white scale-92 shadow-inner'
                      : 'bg-white/90 text-[#2D1824] shadow-[0_10px_26px_rgba(45,24,36,0.28)]'
                  }`}
                >
                  <ChevronLeft className="w-8 h-8" />
                  <span className="text-[10px] font-extrabold -mt-1">يسار</span>
                </button>

                <button
                  type="button"
                  aria-label="توجيه لليمين"
                  {...bindHoldControl('steerRight', setSteerRightPressed)}
                  className={`w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-2xl border-2 border-white flex flex-col items-center justify-center transition-transform cursor-pointer select-none touch-none ${
                    steerRightPressed
                      ? 'bg-rose-600 text-white scale-92 shadow-inner'
                      : 'bg-white/90 text-[#2D1824] shadow-[0_10px_26px_rgba(45,24,36,0.28)]'
                  }`}
                >
                  <ChevronRight className="w-8 h-8" />
                  <span className="text-[10px] font-extrabold -mt-1">يمين</span>
                </button>
              </div>

              {/* Driving Mode Bottom-Right: Context Actions + Turbo + Brake & Gas Pedals */}
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute right-4 bottom-4 sm:right-6 sm:bottom-6 z-20 flex flex-col items-end gap-2.5"
              >
                {nearbyNpc && !dialogue && (
                  <button
                    type="button"
                    onClick={() => handleStartDialogue(nearbyNpc)}
                    className="py-2.5 px-4 rounded-2xl bg-gradient-to-l from-amber-500 to-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-lg border-2 border-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>تحدث ({nearbyNpc.name})</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleActivateTurbo}
                    className={`py-2.5 px-3.5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-lg border-2 border-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      turboActive
                        ? 'bg-gradient-to-l from-amber-400 to-orange-500 text-slate-950'
                        : 'bg-gradient-to-l from-rose-500 to-amber-500 text-white'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    <span>{turboActive ? 'تيربو شغّال! ⚡' : 'تيربو ⚡🚗'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEnterOrExitCar}
                    className="py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm shadow-lg border-2 border-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>انزل 🚶‍♀️</span>
                  </button>
                </div>

                <div className="flex items-end gap-3 pt-1">
                  <button
                    type="button"
                    aria-label="دواسة الفرامل"
                    {...bindHoldControl('brake', setBrakePressed)}
                    className={`w-20 h-16 sm:w-24 sm:h-[72px] rounded-2xl border-2 border-white flex flex-col items-center justify-center gap-1 transition-transform cursor-pointer select-none touch-none ${
                      brakePressed
                        ? 'bg-rose-700 text-white scale-95 translate-y-1 shadow-inner'
                        : 'bg-gradient-to-b from-slate-700 to-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.45)]'
                    }`}
                  >
                    <div className="w-12 h-1.5 rounded-full bg-rose-400/90" />
                    <span className="text-xs sm:text-sm font-extrabold">فرامل 🛑</span>
                    <div className="w-12 h-1 rounded-full bg-slate-500" />
                  </button>

                  <button
                    type="button"
                    aria-label="دواسة البنزين"
                    {...bindHoldControl('gas', setGasPressed)}
                    className={`w-16 h-24 sm:w-20 sm:h-28 rounded-2xl border-2 border-white flex flex-col items-center justify-center gap-1.5 transition-transform cursor-pointer select-none touch-none ${
                      gasPressed
                        ? 'bg-emerald-600 text-white scale-95 translate-y-1 shadow-inner'
                        : 'bg-gradient-to-b from-emerald-500 to-teal-700 text-white shadow-[0_12px_28px_rgba(16,185,129,0.5)]'
                    }`}
                  >
                    <div className="w-10 h-1.5 rounded-full bg-emerald-200" />
                    <div className="w-10 h-1.5 rounded-full bg-emerald-200/75" />
                    <span className="text-xs sm:text-sm font-extrabold">بنزين ⚡</span>
                    <div className="w-10 h-1.5 rounded-full bg-emerald-200/75" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Walking Mode Bottom-Left: 360° Joystick */}
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute left-4 bottom-4 sm:left-6 sm:bottom-6 z-20 flex flex-col items-center gap-1"
              >
                <VirtualJoystick
                  onChange={handleJoystickChange}
                  disabled={
                    Boolean(dialogue) ||
                    showCoronationModal ||
                    showCompletionModal ||
                    isSleeping ||
                    showFullMap ||
                    showWardrobeModal ||
                    showPetShopModal ||
                    showQuestLogModal
                  }
                />
              </div>

              {/* Walking Mode Bottom-Right: Rich Context Buttons + Walking Arrows (dir="ltr"!) */}
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute right-4 bottom-4 sm:right-6 sm:bottom-6 z-20 flex flex-col items-end gap-2"
              >
                {nearbyNpc && !insideBuilding && (
                  <button
                    type="button"
                    onClick={() => handleStartDialogue(nearbyNpc)}
                    className="min-h-[44px] py-2 px-4 rounded-2xl bg-gradient-to-l from-amber-500 to-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-lg border-2 border-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>تحدث ({nearbyNpc.name})</span>
                  </button>
                )}

                {carriedStreetCat && !insideBuilding && (
                  <button
                    type="button"
                    onClick={handlePickOrDropStreetCat}
                    className="min-h-[44px] py-2 px-4 rounded-2xl bg-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-lg border-2 border-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>أنزلي {carriedStreetCat.name} 🐾</span>
                  </button>
                )}

                {nearbyStreetCat && !carriedStreetCat && !insideBuilding && (
                  <button
                    type="button"
                    onClick={handlePickOrDropStreetCat}
                    className="min-h-[46px] py-2 px-4 rounded-2xl bg-gradient-to-l from-orange-500 to-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-xl border-2 border-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>احملي {nearbyStreetCat.name} 🤗🐱</span>
                  </button>
                )}

                {nearbyDoorBuilding && !insideBuilding && (
                  <button
                    type="button"
                    onClick={() => handleEnterBuilding(nearbyDoorBuilding)}
                    className="min-h-[46px] py-2 px-5 rounded-2xl bg-gradient-to-l from-emerald-500 to-teal-600 text-white font-extrabold text-xs sm:text-sm shadow-[0_10px_28px_rgba(16,185,129,0.5)] border-2 border-white flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <DoorOpen className="w-4 h-4" />
                    <span>ادخلي {nearbyDoorBuilding.name}</span>
                  </button>
                )}

                {insideBuilding && nearThrone && (
                  <button
                    type="button"
                    onClick={() => handleSitOnSeat('throne')}
                    className="min-h-[46px] py-2 px-5 rounded-2xl bg-gradient-to-l from-amber-500 to-rose-600 text-white font-extrabold text-xs sm:text-sm shadow-xl border-2 border-white flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Crown className="w-4 h-4" />
                    <span>اجلسي على العرش الملكي 👑🪑</span>
                  </button>
                )}

                {insideBuilding && nearSofa && (
                  <button
                    type="button"
                    onClick={() => handleSitOnSeat('sofa')}
                    className="min-h-[46px] py-2 px-5 rounded-2xl bg-gradient-to-l from-pink-500 to-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-xl border-2 border-white flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <span>اجلسي على الأريكة 🛋️</span>
                  </button>
                )}

                {insideBuilding && nearTelescope && (
                  <button
                    type="button"
                    onClick={handleToggleTelescope}
                    className="min-h-[46px] py-2 px-5 rounded-2xl bg-gradient-to-l from-indigo-500 to-purple-600 text-white font-extrabold text-xs sm:text-sm shadow-xl border-2 border-white flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    <span>انظري بالتلسكوب للنجوم 🔭✨</span>
                  </button>
                )}

                {insideBuilding && nearVanityMirror && (
                  <button
                    type="button"
                    onClick={handleToggleSitAtMirror}
                    className="min-h-[46px] py-2 px-5 rounded-2xl bg-gradient-to-l from-pink-500 to-rose-600 text-white font-extrabold text-xs sm:text-sm shadow-xl border-2 border-white flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Palette className="w-4 h-4" />
                    <span>اجلسي على الكرسي وضعي مكياج 💄🪞</span>
                  </button>
                )}

                {insideBuilding && nearWardrobe && (
                  <button
                    type="button"
                    onClick={() => setShowWardrobeModal(true)}
                    className="min-h-[46px] py-2 px-5 rounded-2xl bg-gradient-to-l from-purple-500 to-indigo-600 text-white font-extrabold text-xs sm:text-sm shadow-xl border-2 border-white flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Shirt className="w-4 h-4" />
                    <span>غيّري ملابسكِ (فساتين وجاكيت جلد) 👗🧥</span>
                  </button>
                )}

                {insideBuilding && nearPetCorner && ownedPet && (
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCareOwnedPet('feed')}
                      className="py-2 px-3.5 rounded-2xl bg-rose-600 text-white font-extrabold text-xs shadow-lg border-2 border-white flex items-center gap-1 cursor-pointer"
                    >
                      <Fish className="w-4 h-4" />
                      <span>أطعمي القطة 🐟</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCareOwnedPet('water')}
                      className="py-2 px-3.5 rounded-2xl bg-sky-600 text-white font-extrabold text-xs shadow-lg border-2 border-white flex items-center gap-1 cursor-pointer"
                    >
                      <Droplets className="w-4 h-4" />
                      <span>اسقيها ماء 💧</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCareOwnedPet('play')}
                      className="py-2 px-3.5 rounded-2xl bg-amber-500 text-white font-extrabold text-xs shadow-lg border-2 border-white flex items-center gap-1 cursor-pointer"
                    >
                      <Heart className="w-4 h-4" />
                      <span>لاعبيها 💕</span>
                    </button>
                  </div>
                )}

                {insideBuilding && nearPetShopCounter && (
                  <button
                    type="button"
                    onClick={() => setShowPetShopModal(true)}
                    className="min-h-[46px] py-2 px-5 rounded-2xl bg-gradient-to-l from-orange-500 to-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-xl border-2 border-white flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>تسوّقي لشراء قطة أليفة 🐾🪙</span>
                  </button>
                )}

                {insideBuilding && nearBed && !isSleeping && (
                  <button
                    type="button"
                    onClick={handleSleepOnBed}
                    className="min-h-[46px] py-2 px-5 rounded-2xl bg-gradient-to-l from-indigo-500 to-violet-600 text-white font-extrabold text-xs sm:text-sm shadow-xl border-2 border-white flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <BedDouble className="w-4 h-4" />
                    <span>نامي على السرير الملكي 🛏️💤</span>
                  </button>
                )}

                {insideBuilding && nearCafeCounter && (
                  <button
                    type="button"
                    onClick={handleDrinkCafeCoffee}
                    className="min-h-[46px] py-2 px-5 rounded-2xl bg-gradient-to-l from-amber-500 to-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-xl border-2 border-white flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Coffee className="w-4 h-4" />
                    <span>احتسي قهوة ساخنة ☕</span>
                  </button>
                )}

                {insideBuilding &&
                  (nearExitDoor ||
                    (!nearBed &&
                      !nearVanityMirror &&
                      !nearPetCorner &&
                      !nearThrone &&
                      !nearSofa &&
                      !nearTelescope)) && (
                    <button
                      type="button"
                      onClick={handleExitBuilding}
                      className={`min-h-[44px] py-2 px-4 rounded-2xl font-extrabold text-xs sm:text-sm shadow-lg border-2 border-white flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                        nearExitDoor ? 'bg-rose-600 text-white' : 'bg-slate-800/90 text-white'
                      }`}
                    >
                      <DoorOpen className="w-4 h-4" />
                      <span>اخرجي للخارج 🚪</span>
                    </button>
                  )}

                {nearCar && !insideBuilding && (
                  <button
                    type="button"
                    onClick={handleEnterOrExitCar}
                    className="min-h-[46px] py-2 px-5 rounded-2xl bg-gradient-to-l from-rose-500 to-pink-600 text-white font-extrabold text-xs sm:text-sm shadow-[0_10px_28px_rgba(244,63,94,0.5)] border-2 border-white flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Car className="w-4 h-4" />
                    <span>اركب السيارة 🚗</span>
                  </button>
                )}

                {/* Dedicated Left & Right Walking Arrows (dir="ltr" so LEFT arrow is physically on Left!) */}
                <div dir="ltr" className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    aria-label="المشي لليسار"
                    {...bindHoldControl('walkLeft', setWalkLeftPressed)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-white flex flex-col items-center justify-center transition-transform cursor-pointer select-none touch-none ${
                      walkLeftPressed
                        ? 'bg-rose-500 text-white scale-92 shadow-inner'
                        : 'bg-white/90 text-[#2D1824] shadow-[0_8px_22px_rgba(45,24,36,0.24)]'
                    }`}
                  >
                    <ChevronLeft className="w-7 h-7" />
                    <span className="text-[10px] font-extrabold -mt-1">يسار</span>
                  </button>

                  <button
                    type="button"
                    aria-label="المشي لليمين"
                    {...bindHoldControl('walkRight', setWalkRightPressed)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-white flex flex-col items-center justify-center transition-transform cursor-pointer select-none touch-none ${
                      walkRightPressed
                        ? 'bg-rose-500 text-white scale-92 shadow-inner'
                        : 'bg-white/90 text-[#2D1824] shadow-[0_8px_22px_rgba(45,24,36,0.24)]'
                    }`}
                  >
                    <ChevronRight className="w-7 h-7" />
                    <span className="text-[10px] font-extrabold -mt-1">يمين</span>
                  </button>
                </div>
              </div>
            </>
          ))}



        {/* === PET SHOP MODAL === */}
        <AnimatePresence>
          {showPetShopModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 z-40 bg-[#2D1824]/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="bg-white border-2 border-orange-200 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#2D1824]">
                      متجر القطط — مسؤول المتجر 🐾🐱
                    </h3>
                    <p className="text-xs font-semibold text-[#6A4558]">
                      اختاري قطة من المعروضات، ثم وفّري لها الطعام والماء والرعاية داخل المملكة.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="py-1.5 px-3 rounded-xl bg-amber-100 text-amber-800 text-xs font-extrabold flex items-center gap-1">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span>{coinsCount}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPetShopModal(false)}
                      aria-label="إغلاق متجر القطط"
                      className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SHOP_KITTENS.map((k) => {
                    const canAfford = coinsCount >= k.price;
                    const alreadyOwned = ownedPet?.kittenId === k.id;
                    return (
                      <div
                        key={k.id}
                        className="rounded-2xl border-2 border-orange-100 bg-orange-50/40 p-4 flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-12 h-12 rounded-2xl border-2 border-white shadow flex items-center justify-center text-2xl shrink-0"
                            style={{ backgroundColor: k.furColor }}
                          >
                            🐱
                          </div>
                          <div>
                            <div className="font-extrabold text-sm text-[#2D1824]">{k.name}</div>
                            <div className="text-[11px] font-bold text-orange-700">{k.breed}</div>
                            <p className="text-xs text-[#5C3D4E] mt-1">{k.description}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleBuyShopKitten(k)}
                          disabled={alreadyOwned}
                          className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                            alreadyOwned
                              ? 'bg-emerald-100 text-emerald-800 cursor-default'
                              : canAfford
                                ? 'bg-gradient-to-l from-orange-500 to-rose-500 text-white shadow'
                                : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {alreadyOwned ? (
                            <span>موجودة في مملكتكِ الآن 🏠✅</span>
                          ) : (
                            <>
                              <Coins className="w-4 h-4" />
                              <span>
                                {canAfford
                                  ? `اشترِي الآن بـ ${k.price} عملة`
                                  : `تحتاجين ${k.price} عملة (ناقص ${k.price - coinsCount})`}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === QUEST LOG MODAL (8 Quests Overview) === */}
        <AnimatePresence>
          {showQuestLogModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 z-40 bg-[#2D1824]/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="bg-white border-2 border-rose-200 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-3 my-auto"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-rose-600" />
                    <h3 className="text-lg font-bold text-[#2D1824]">
                      سجل المهام الملكية ({Math.min(TOTAL_QUEST_COUNT, questStage)} / {TOTAL_QUEST_COUNT})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuestLogModal(false)}
                    aria-label="إغلاق المهام"
                    className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-[62vh] overflow-y-auto pr-1">
                  {QUEST_LOG_LIST.map((q) => {
                    const done = questStage > q.stage;
                    const active = questStage === q.stage;
                    return (
                      <div
                        key={q.stage}
                        className={`p-3 rounded-2xl border flex items-start justify-between gap-2 ${
                          done
                            ? 'bg-emerald-50 border-emerald-200'
                            : active
                              ? 'bg-amber-50 border-amber-300 shadow-sm'
                              : 'bg-slate-50 border-slate-200 opacity-75'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs sm:text-sm font-extrabold text-[#2D1824]">
                            {q.stage + 1}. {q.title}
                          </div>
                          <div className="text-[11px] font-semibold text-[#6A4558]">
                            📍 {q.locationHint}
                          </div>
                        </div>
                        <span className="text-xs font-extrabold whitespace-nowrap px-2 py-1 rounded-lg bg-white border border-amber-200 text-amber-700">
                          {done ? 'تمت ✅' : `+${q.rewardCoins} 🪙`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Expandable Kingdom Map */}
        <AnimatePresence>
          {showFullMap && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 z-40 bg-[#2D1824]/70 flex items-center justify-center p-3 sm:p-6"
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="bg-white border-2 border-rose-200 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-rose-600" />
                    <h3 className="text-lg sm:text-xl font-bold text-[#2D1824]">
                      خريطة مملكة الأميرة جودي الكاملة
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFullMap(false)}
                    aria-label="إغلاق الخريطة"
                    className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="rounded-2xl overflow-hidden border-2 border-rose-100 bg-[#D9F99D]">
                  <canvas
                    ref={fullMapRef}
                    width={760}
                    height={570}
                    className="w-full h-auto block"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-bold text-[#5C3D4E]">
                  <span>🔺 موقعكِ واتجاهكِ</span>
                  <span>🩷 السيارة الملكية</span>
                  <span>🟡 بوابة دخول المبنى</span>
                  <span>⭐ هدف المهمة</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dialogue Box */}
        <AnimatePresence>
          {dialogue && currentDialogueLine && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.2 }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-x-3 sm:inset-x-8 bottom-4 z-30"
            >
              <div className="max-w-3xl mx-auto bg-white border-2 border-rose-300 rounded-3xl p-4 sm:p-6 shadow-[0_24px_60px_rgba(45,24,36,0.32)] flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-rose-200 bg-rose-50 shrink-0 flex items-center justify-center">
                  {currentDialogueLine.speakerTone === 'joudy' ? (
                    <Image
                      src={realImageSrc}
                      alt="الأميرة جودي"
                      fill
                      sizes="96px"
                      referrerPolicy="no-referrer"
                      className="object-cover object-center"
                    />
                  ) : (
                    <span className="text-4xl sm:text-5xl" aria-hidden="true">
                      {dialogue.npc.emoji}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-right space-y-2">
                  <div className="flex items-center justify-center sm:justify-between gap-2">
                    <span className="text-sm font-extrabold text-rose-700">
                      {currentDialogueLine.speaker}
                    </span>
                    <span className="text-xs font-semibold text-[#6A4558] tabular-nums">
                      {dialogue.lineIndex + 1} / {dialogue.lines.length}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-[#2D1824] leading-relaxed">
                    {currentDialogueLine.text}
                  </p>
                  <div className="pt-1 flex justify-center sm:justify-end">
                    <button
                      type="button"
                      onClick={handleAdvanceDialogue}
                      className="py-2.5 px-6 rounded-xl bg-gradient-to-l from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm shadow-md cursor-pointer whitespace-nowrap"
                    >
                      {dialogue.lineIndex + 1 < dialogue.lines.length ? 'التالي ←' : 'حسناً ✨'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coronation Modal (Quest 3 Celebration) */}
        <AnimatePresence>
          {showCoronationModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 z-40 bg-[#2D1824]/70 flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.92, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="bg-white border-2 border-amber-300 rounded-3xl max-w-xl w-full p-5 sm:p-8 shadow-2xl text-center space-y-5 my-auto"
              >
                <div className="flex items-center justify-center gap-2 text-amber-600 font-extrabold text-sm">
                  <Crown className="w-5 h-5 fill-amber-400" />
                  <span>حفل التتويج الملكي الكبير</span>
                  <Sparkles className="w-5 h-5" />
                </div>

                <h2
                  className="text-2xl sm:text-4xl font-bold text-[#2D1824] leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  مبروك تتويجك يا أميرة جودي! 👑💐
                </h2>

                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-amber-300 shadow-xl ring-4 ring-rose-200">
                    <Image
                      src={realImageSrc}
                      alt="الأميرة جودي"
                      fill
                      sizes="144px"
                      referrerPolicy="no-referrer"
                      className="object-cover object-center"
                    />
                  </div>
                </div>

                <p className="text-sm sm:text-base font-bold text-[#2D1824] leading-relaxed bg-rose-50 border border-rose-200 rounded-2xl p-4">
                  مبروك تتويجكِ يا أميرة جودي أميرةً للمملكة! 🌟💖 والآن تبدأ باقي مغامراتكِ: اصعدي الدور الثاني بالقصر لتجربة المرآة الحقيقية والمكياج، غيّري ملابسكِ للجاكيت الجلد والفساتين، واذهبي لمسؤول المتجر في متجر القطط لشراء وتربية قطتكِ!
                </p>

                <button
                  type="button"
                  onClick={() => setShowCoronationModal(false)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-l from-rose-500 to-pink-600 text-white font-bold text-base shadow-lg cursor-pointer"
                >
                  متابعة المغامرة والمهام ✨👑
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === GRAND GAME COMPLETION MODAL (تختيم اللعبة 8/8 🏆) === */}
        <AnimatePresence>
          {showCompletionModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute inset-0 z-40 bg-[#2D1824]/75 flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.9, y: 18 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="bg-white border-4 border-amber-400 rounded-3xl max-w-xl w-full p-5 sm:p-8 shadow-2xl text-center space-y-5 my-auto"
              >
                <div className="flex items-center justify-center gap-2 text-amber-600 font-extrabold text-sm">
                  <Trophy className="w-6 h-6 text-amber-500" />
                  <span>
                    إنجاز أسطوري — {TOTAL_QUEST_COUNT} / {TOTAL_QUEST_COUNT} مهام مكتملة
                  </span>
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>

                <h2
                  className="text-2xl sm:text-4xl font-bold text-[#2D1824] leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  مبروك تختيم لعبة عالم الأميرة جودي بالكامل! 🏆👑🎉
                </h2>

                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-amber-400 shadow-xl ring-4 ring-rose-200">
                    <Image
                      src={realImageSrc}
                      alt="الأميرة جودي"
                      fill
                      sizes="144px"
                      referrerPolicy="no-referrer"
                      className="object-cover object-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-xs font-extrabold">
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3">
                    <div className="text-amber-700">🪙 العملات</div>
                    <div className="text-lg text-[#2D1824] mt-0.5">{coinsCount}</div>
                  </div>
                  <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3">
                    <div className="text-rose-700">👗 الإطلالة</div>
                    <div className="text-xs text-[#2D1824] mt-1 truncate">{activeOutfit.name}</div>
                  </div>
                  <div className="rounded-2xl bg-purple-50 border border-purple-200 p-3">
                    <div className="text-purple-700">🐱 القطة</div>
                    <div className="text-xs text-[#2D1824] mt-1 truncate">
                      {ownedPet ? ownedPet.name : 'قطة القصر'}
                    </div>
                  </div>
                </div>

                <p className="text-sm font-bold text-[#5C3D4E] leading-relaxed">
                  حصلتِ على وسام أميرة المملكة والأناقة ورعاية القطط! يمكنكِ الآن اللعب بحرية كاملة في قصركِ، وضع المكياج أمام المرآة، رعاية قطتكِ، والقيادة في كل شوارع المملكة للأبد!
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCompletionModal(false)}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-l from-amber-500 to-rose-500 text-white font-bold text-base shadow-lg cursor-pointer"
                  >
                    استكمال اللعب الحر في المملكة 👑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.stopCarEngineSound();
                      soundEngine.stopBackgroundMusic();
                      onExitToHub();
                    }}
                    className="py-3.5 px-5 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[#2D1824] font-bold text-sm cursor-pointer"
                  >
                    الشاشة الرئيسية
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-xs font-medium text-[#6A4558] shrink-0">
        {isInCar
          ? 'وضع القيادة: أزرار التوجيه يمين/يسار + دواسة البنزين والفرامل · اجمعي العملات 🪙 لشراء قطة من متجر القطط'
          : insideBuilding
            ? insideBuilding.hasSecondFloor
              ? 'أنتِ داخل مبنى من طابقين: اصعدي السلم للدور الثاني للوصول إلى المرآة والمكياج والخزانة وركن القطة 🪜💄'
              : 'تجولي داخل المبنى واكتشفي الكنوز والخدمات ✨'
            : 'اسحبي الشاشة لتدوير الكاميرا · احملي قطط الشوارع 🐱 واشتري قطتكِ من متجر القطط عند مسؤول المتجر 🐾'}
      </p>
    </motion.section>
  );
}
