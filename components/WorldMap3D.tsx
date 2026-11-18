'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import * as THREE from 'three';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Play,
  Sparkles,
  Star,
} from 'lucide-react';
import { LEVELS, WORLD_THEMES } from '@/lib/levels';
import type { JoudyGameProgress } from '@/lib/storage';
import {
  createLevelBadgeTexture,
  createStudioRenderer,
  scheduleSoftwareFrame,
} from '@/lib/threeUtils';
import { createFluffyCloud3D, createJoudyAnime3DStandee } from '@/lib/threeModels';

interface WorldMap3DProps {
  progress: JoudyGameProgress;
  animeImageSrc: string;
  onSelectLevel: (level: number) => void;
  onBackToCharacter: () => void;
}

const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();
const _dummy = new THREE.Object3D();

function getNodePosition(index0: number): THREE.Vector3 {
  const x = Math.sin(index0 * 0.72) * 3.1;
  const y = Math.sin(index0 * 0.4) * 0.45;
  const z = -index0 * 3.8;
  return new THREE.Vector3(x, y, z);
}

export default function WorldMap3D({
  progress,
  animeImageSrc,
  onSelectLevel,
  onBackToCharacter,
}: WorldMap3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const [lockedToast, setLockedToast] = useState<string | null>(null);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const currentLevel = progress.highestUnlockedLevel;
  const completedCount = Object.keys(progress.completedLevels).length;
  const totalStars = Object.values(progress.completedLevels).reduce(
    (sum, rec) => sum + rec.stars,
    0,
  );

  // Target Z camera focus ref so World quick-jump buttons glide smoothly
  const targetFocusZRef = useRef<number>(getNodePosition(currentLevel - 1).z);
  const onSelectRef = useRef(onSelectLevel);
  useEffect(() => {
    onSelectRef.current = onSelectLevel;
  }, [onSelectLevel]);

  const jumpToWorld = (worldId: number) => {
    const firstLevelInWorld = (worldId - 1) * 5 + 1;
    targetFocusZRef.current = getNodePosition(firstLevelInWorld - 1).z - 3.5;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const studio = createStudioRenderer(container, { shadows: true });
    const { renderer, isSoftwareGl, envMap } = studio;
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    const bgColor = new THREE.Color(0xfce7f3);
    scene.background = bgColor;
    scene.fog = new THREE.FogExp2(0xfce7f3, 0.018);
    scene.environment = envMap;

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 140);

    let currentFocusZ = targetFocusZRef.current;
    camera.position.set(0, 6.2, currentFocusZ + 9.5);
    camera.lookAt(0, 0.4, currentFocusZ - 2.5);

    // Lighting
    const hemi = new THREE.HemisphereLight(0xfbcfe8, 0x3b82f6, 0.9);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff5e4, 1.75);
    sun.position.set(8, 16, 10);
    if (!isSoftwareGl) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
    }
    scene.add(sun);

    // 1. Winding 3D Path Curve (30 Nodes)
    const nodePositions = LEVELS.map((_, i) => getNodePosition(i));
    const curve = new THREE.CatmullRomCurve3(nodePositions);
    const roadGeo = new THREE.TubeGeometry(curve, 180, 0.42, 10, false);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0xfff1f2,
      roughness: 0.65,
      metalness: 0.08,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.scale.set(1.2, 0.25, 1);
    roadMesh.position.y = -0.15;
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // 2. Biome Scenery Islands & Clouds along the 30-level road
    const createdTextures: THREE.Texture[] = [];
    const createdMaterials: THREE.Material[] = [];
    const createdGeometries: THREE.BufferGeometry[] = [roadGeo];

    const starGeo = new THREE.OctahedronGeometry(0.18, 0);
    const crownGeo = new THREE.ConeGeometry(0.32, 0.42, 5);
    createdGeometries.push(starGeo, crownGeo);

    const goldStarMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.55,
      roughness: 0.2,
      metalness: 0.85,
    });
    createdMaterials.push(goldStarMat);

    // Scenery per World (Trees, Clouds, Lanterns)
    WORLD_THEMES.forEach((world, wIdx) => {
      const midNode = nodePositions[wIdx * 5 + 2];
      const islandColor =
        wIdx === 0
          ? 0xa7f3d0
          : wIdx === 1
            ? 0x34d399
            : wIdx === 2
              ? 0xfde68a
              : wIdx === 3
                ? 0xfda4af
                : wIdx === 4
                  ? 0xa78bfa
                  : 0x312e81;

      const islandGeo = new THREE.CylinderGeometry(7.2, 6.2, 0.9, 24);
      const islandMat = new THREE.MeshStandardMaterial({
        color: islandColor,
        roughness: 0.88,
        metalness: 0.04,
      });
      createdGeometries.push(islandGeo);
      createdMaterials.push(islandMat);

      const island = new THREE.Mesh(islandGeo, islandMat);
      island.position.set(0, -0.78, midNode.z);
      island.scale.set(1.15, 1, 1.45);
      island.receiveShadow = true;
      scene.add(island);

      // Decorative Trees flanking the road
      const treeGeo = new THREE.DodecahedronGeometry(0.85, 1);
      const trunkGeo = new THREE.CylinderGeometry(0.16, 0.22, 1.1, 8);
      const treeMat = new THREE.MeshStandardMaterial({
        color: wIdx === 1 ? 0x059669 : wIdx >= 4 ? 0x6366f1 : 0xf472b6,
        roughness: 0.75,
      });
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      createdGeometries.push(treeGeo, trunkGeo);
      createdMaterials.push(treeMat, trunkMat);

      [-1, 1].forEach((side) => {
        const tree = new THREE.Group();
        const tTrunk = new THREE.Mesh(trunkGeo, trunkMat);
        tTrunk.position.y = 0.55;
        const tCrown = new THREE.Mesh(treeGeo, treeMat);
        tCrown.position.y = 1.5;
        tree.add(tTrunk, tCrown);
        tree.position.set(side * 5.2, -0.35, midNode.z + side * 2.5);
        scene.add(tree);
      });

      const cloud = createFluffyCloud3D(wIdx >= 4 ? 0xc4b5fd : 0xffffff);
      cloud.position.set((wIdx % 2 === 0 ? -1 : 1) * 6.4, 4.5, midNode.z - 2);
      scene.add(cloud);
    });

    // Night Stars at far end (Worlds 5 & 6)
    const nightStarGeo = new THREE.OctahedronGeometry(0.14, 0);
    const nightStarMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfde047,
      emissiveIntensity: 0.9,
    });
    createdGeometries.push(nightStarGeo);
    createdMaterials.push(nightStarMat);
    const starField = new THREE.InstancedMesh(nightStarGeo, nightStarMat, 70);
    starField.frustumCulled = false;
    for (let i = 0; i < 70; i++) {
      _dummy.position.set(
        Math.sin(i * 11.7) * 18,
        3.5 + (i % 7) * 1.1,
        -72 - (i * 0.75),
      );
      _dummy.scale.setScalar(0.6 + (i % 4) * 0.25);
      _dummy.updateMatrix();
      starField.setMatrixAt(i, _dummy.matrix);
    }
    starField.instanceMatrix.needsUpdate = true;
    starField.computeBoundingSphere();
    scene.add(starField);

    // 3. 30 Interactive Level Pedestals
    const clickableMeshes: THREE.Object3D[] = [];
    const spinningAccents: THREE.Object3D[] = [];
    let currentPulseRing: THREE.Mesh | null = null;

    const pedBaseGeo = new THREE.CylinderGeometry(0.82, 0.92, 0.34, 24);
    const pedTopGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.08, 24);
    createdGeometries.push(pedBaseGeo, pedTopGeo);

    LEVELS.forEach((lvl, idx) => {
      const pos = nodePositions[idx];
      const completed = progress.completedLevels[lvl.level];
      const isCurrent = lvl.level === currentLevel;
      const isLocked = lvl.level > currentLevel;

      const nodeGroup = new THREE.Group();
      nodeGroup.position.copy(pos);

      const baseColor = isCurrent
        ? 0xf43f5e
        : completed
          ? 0xfbbf24
          : 0x94a3b8;

      const baseMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: isLocked ? 0.85 : 0.32,
        metalness: isLocked ? 0.1 : 0.55,
      });
      createdMaterials.push(baseMat);

      const baseMesh = new THREE.Mesh(pedBaseGeo, baseMat);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      baseMesh.userData = { level: lvl.level, isLocked };
      clickableMeshes.push(baseMesh);
      nodeGroup.add(baseMesh);

      const badgeTex = createLevelBadgeTexture(
        lvl.level,
        isCurrent ? '#F43F5E' : completed ? '#FFFBEB' : '#E2E8F0',
        isCurrent ? '#FFFFFF' : completed ? '#B45309' : '#64748B',
      );
      createdTextures.push(badgeTex);

      const topMat = new THREE.MeshStandardMaterial({
        map: badgeTex,
        roughness: 0.4,
      });
      createdMaterials.push(topMat);

      const topMesh = new THREE.Mesh(pedTopGeo, topMat);
      topMesh.position.y = 0.19;
      topMesh.rotation.y = Math.PI / 2;
      topMesh.userData = { level: lvl.level, isLocked };
      clickableMeshes.push(topMesh);
      nodeGroup.add(topMesh);

      if (isCurrent) {
        const ringGeo = new THREE.TorusGeometry(1.06, 0.06, 10, 32);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0xfde047,
          emissive: 0xfbbf24,
          emissiveIntensity: 0.8,
        });
        createdGeometries.push(ringGeo);
        createdMaterials.push(ringMat);
        currentPulseRing = new THREE.Mesh(ringGeo, ringMat);
        currentPulseRing.rotation.x = Math.PI / 2;
        currentPulseRing.position.y = 0.08;
        nodeGroup.add(currentPulseRing);
      }

      if (completed) {
        for (let s = 0; s < completed.stars; s++) {
          const star = new THREE.Mesh(starGeo, goldStarMat);
          const offset = (s - (completed.stars - 1) / 2) * 0.42;
          star.position.set(offset, 0.65, 0);
          nodeGroup.add(star);
          spinningAccents.push(star);
        }
      }

      if (lvl.level === 30) {
        const crown = new THREE.Mesh(crownGeo, goldStarMat);
        crown.position.set(0, 0.85, 0);
        nodeGroup.add(crown);
        spinningAccents.push(crown);
      }

      scene.add(nodeGroup);
    });

    // 4. Joudy 3D Anime Standee standing on the Current Level Pedestal
    const joudyBundle = createJoudyAnime3DStandee(animeImageSrc, maxAniso);
    const joudy = joudyBundle.group;
    const currentPos = nodePositions[currentLevel - 1];
    joudy.position.set(currentPos.x, currentPos.y + 0.24, currentPos.z);
    joudy.scale.setScalar(0.92);
    scene.add(joudy);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Smooth Drag / Wheel Scrolling along the 3D Path + Raycast Click
    let dragging = false;
    let dragMoved = false;
    let lastY = 0;
    let lastHoverCheck = 0;

    const minZ = nodePositions[29].z;
    const maxZ = nodePositions[0].z;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetFocusZRef.current = THREE.MathUtils.clamp(
        targetFocusZRef.current - e.deltaY * 0.015,
        minZ,
        maxZ,
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      dragMoved = false;
      lastY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragging) {
        const dy = e.clientY - lastY;
        if (Math.abs(dy) > 3) dragMoved = true;
        lastY = e.clientY;
        targetFocusZRef.current = THREE.MathUtils.clamp(
          targetFocusZRef.current + dy * 0.045,
          minZ,
          maxZ,
        );
        return;
      }

      const now = Date.now();
      if (now - lastHoverCheck < 50) return;
      lastHoverCheck = now;

      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_mouse, camera);
      const hits = _raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const { level, isLocked } = hits[0].object.userData as {
          level: number;
          isLocked: boolean;
        };
        setHoveredLevel(level);
        renderer.domElement.style.cursor = isLocked ? 'not-allowed' : 'pointer';
      } else {
        setHoveredLevel(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (dragMoved) return;

      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_mouse, camera);
      const hits = _raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const { level, isLocked } = hits[0].object.userData as {
          level: number;
          isLocked: boolean;
        };
        if (isLocked) {
          setLockedToast(`أكملي المستوى ${currentLevel} لفتح المستوى ${level}!`);
          window.setTimeout(() => setLockedToast(null), 2200);
        } else {
          onSelectRef.current(level);
        }
      }
    };

    const canvasEl = renderer.domElement;
    canvasEl.addEventListener('wheel', onWheel, { passive: false });
    canvasEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const ro = new ResizeObserver(() => {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    const clock = new THREE.Clock();
    const skyTarget = new THREE.Color();
    let frameId = 0;
    const activeTimers: number[] = [];
    let disposed = false;

    const tick = () => {
      if (disposed) return;

      const dt = Math.min(0.05, clock.getDelta());
      const elapsed = clock.elapsedTime;

      currentFocusZ = THREE.MathUtils.damp(currentFocusZ, targetFocusZRef.current, 6.5, dt);
      camera.position.set(0, 6.2, currentFocusZ + 9.5);
      camera.lookAt(0, 0.4, currentFocusZ - 2.5);

      // Smoothly shift sky color as camera flies through the 6 worlds
      const progressAlongMap = THREE.MathUtils.clamp(
        Math.abs(currentFocusZ) / Math.abs(minZ),
        0,
        1,
      );
      if (progressAlongMap < 0.35) {
        skyTarget.setHex(0xfce7f3);
      } else if (progressAlongMap < 0.6) {
        skyTarget.setHex(0xfde68a);
      } else if (progressAlongMap < 0.8) {
        skyTarget.setHex(0x4c1d95);
      } else {
        skyTarget.setHex(0x0f172a);
      }
      bgColor.lerp(skyTarget, Math.min(1, dt * 3));
      (scene.background as THREE.Color).copy(bgColor);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(bgColor);
      }

      // Animate stars, Joudy idle bounce, and pulse ring
      for (const acc of spinningAccents) {
        acc.rotation.y += dt * 1.8;
      }
      if (currentPulseRing) {
        const s = 1 + Math.sin(elapsed * 3.5) * 0.08;
        currentPulseRing.scale.set(s, s, 1);
      }
      joudy.position.y = currentPos.y + 0.24 + Math.sin(elapsed * 3.2) * 0.07;
      joudy.rotation.y = Math.sin(elapsed * 1.5) * 0.22;
      const { orbitGroup } = joudy.userData as Record<string, THREE.Object3D>;
      if (orbitGroup) orbitGroup.rotation.y += dt * 1.8;

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
      canvasEl.removeEventListener('wheel', onWheel);
      canvasEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      joudyBundle.disposeTexture();
      createdTextures.forEach((t) => t.dispose());
      createdMaterials.forEach((m) => m.dispose());
      createdGeometries.forEach((g) => g.dispose());
      studio.dispose();
    };
  }, [currentLevel, progress.completedLevels, animeImageSrc]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-[calc(100dvh-4.2rem)] min-h-[520px] max-w-6xl mx-auto px-3 sm:px-6 pb-4 flex flex-col gap-3"
    >
      {/* Top Minimal Map Bar (Solid crisp surface, zero backdrop-blur) */}
      <div className="bg-white/95 border border-rose-200 rounded-2xl px-4 sm:px-6 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6A4558]">
            <button
              type="button"
              onClick={onBackToCharacter}
              className="inline-flex items-center gap-1 font-bold text-rose-700 hover:text-rose-900 cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>ملف البطلة</span>
            </button>
            <span aria-hidden="true">·</span>
            <span>خريطة 3D تفاعلية (اسحبي أو اختاري أي مرحلة)</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-0.5">
            <h1
              className="text-xl sm:text-2xl font-bold text-[#2D1824]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              خريطة العالم السحري الـ 3D
            </h1>
            <span className="text-xs sm:text-sm font-semibold text-[#6A4558] tabular-nums">
              المكتملة: {completedCount}/30 · ⭐ {totalStars}/90
            </span>
          </div>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectLevel(currentLevel)}
          className="py-2.5 px-5 rounded-2xl bg-gradient-to-l from-rose-500 via-pink-500 to-rose-600 text-white font-bold text-sm sm:text-base shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>العب المستوى {currentLevel}</span>
          <Sparkles className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Full-Height 3D World Map Viewport */}
      <div className="relative flex-1 rounded-3xl overflow-hidden border-2 border-rose-200 shadow-[0_20px_50px_-15px_rgba(225,29,72,0.2)] bg-[#FCE7F3]">
        <div ref={mountRef} className="w-full h-full touch-none" />

        {/* Hovered Level Preview Tag */}
        {hoveredLevel !== null && (
          <div className="pointer-events-none absolute top-4 right-4 bg-white/95 border border-rose-200 rounded-xl px-3.5 py-2 text-xs font-bold text-[#2D1824] shadow-md flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>
              المستوى {hoveredLevel} — {LEVELS[hoveredLevel - 1].worldName} (هدف{' '}
              {LEVELS[hoveredLevel - 1].targetScore} نقطة)
            </span>
          </div>
        )}

        {/* Locked Level Notification */}
        {lockedToast && (
          <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white rounded-xl px-4 py-2 text-xs sm:text-sm font-bold shadow-lg">
            {lockedToast}
          </div>
        )}

        {/* Collapsible Bottom World-Jump Dock */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center max-w-[95%]">
          <button
            type="button"
            onClick={() => setDockCollapsed((c) => !c)}
            className="mb-1.5 px-3 py-1 rounded-t-xl bg-white/95 border border-rose-200 text-[11px] font-bold text-[#6A4558] hover:text-rose-700 flex items-center gap-1 shadow-xs cursor-pointer"
          >
            {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{dockCollapsed ? 'إظهار العوالم' : 'إخفاء الشريط'}</span>
          </button>

          {!dockCollapsed && (
            <div className="bg-white/95 border border-rose-200 rounded-2xl p-1.5 shadow-lg flex items-center gap-1 overflow-x-auto max-w-full">
              {WORLD_THEMES.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => jumpToWorld(w.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#2D1824] hover:bg-rose-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  العالم {w.id} ({(w.id - 1) * 5 + 1}–{w.id * 5})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
