'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import * as THREE from 'three';
import {
  ArrowLeft,
  Crown,
  Gift,
  Heart,
  Map as MapIcon,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react';
import type { LevelConfig } from '@/lib/levels';
import { computeLevelStars } from '@/lib/storage';
import { loadTransparentSprite } from '@/lib/spriteUtils';
import { createStudioRenderer, scheduleSoftwareFrame } from '@/lib/threeUtils';
import type { GameRunStats } from './GameArena3D';

interface VictoryScreen3DProps {
  levelConfig: LevelConfig;
  realImageSrc: string;
  animeImageSrc: string;
  stats: GameRunStats;
  highScore: number;
  isNewHighScore: boolean;
  onNextLevel: () => void;
  onPlayAgain: () => void;
  onOpenWorldMap: () => void;
}

const GRAND_3D_VICTORY_MESSAGE =
  'ألف مبروك يا جودي ختمتي اللعبة الـ 3D! 🏆✨ إنتي بطلة حقيقية.. شكراً لإنك ألطف زميلة في الدنيا!';

export default function VictoryScreen3D({
  levelConfig,
  realImageSrc,
  animeImageSrc,
  stats,
  highScore,
  isNewHighScore,
  onNextLevel,
  onPlayAgain,
  onOpenWorldMap,
}: VictoryScreen3DProps) {
  const fxMountRef = useRef<HTMLDivElement>(null);
  const [giftOpened, setGiftOpened] = useState(false);
  const [transparentAnimeSrc, setTransparentAnimeSrc] = useState(animeImageSrc);

  const isGrandFinale = levelConfig.level === 30;
  const starsEarned = computeLevelStars(stats.obstaclesHit);

  useEffect(() => {
    let active = true;
    loadTransparentSprite(animeImageSrc)
      .then(({ dataUrl }) => {
        if (active) setTransparentAnimeSrc(dataUrl);
      })
      .catch(() => {
        if (active) setTransparentAnimeSrc(animeImageSrc);
      });
    return () => {
      active = false;
    };
  }, [animeImageSrc]);

  // 3D Fireworks + 3D Confetti & Floating Gems Background Stage
  useEffect(() => {
    const container = fxMountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const studio = createStudioRenderer(container, { alpha: true, shadows: false });
    const { renderer, isSoftwareGl, envMap } = studio;

    const scene = new THREE.Scene();
    scene.environment = envMap;

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 2, 12);

    const hemi = new THREE.HemisphereLight(0xfde68a, 0xf43f5e, 1.2);
    scene.add(hemi);

    const colors = [0xf43f5e, 0xfbbf24, 0x10b981, 0xa855f7, 0xec4899, 0x38bdf8];
    const confettiGeo = new THREE.BoxGeometry(0.18, 0.08, 0.02);
    const sparkGeo = new THREE.OctahedronGeometry(0.11, 0);

    interface ConfettiPiece {
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      rx: number;
      ry: number;
    }
    const confettiCount = isGrandFinale ? 65 : 40;
    const confetti: ConfettiPiece[] = [];
    for (let i = 0; i < confettiCount; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        emissive: colors[i % colors.length],
        emissiveIntensity: 0.35,
        roughness: 0.3,
      });
      const mesh = new THREE.Mesh(confettiGeo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 16,
        Math.random() * 12 - 2,
        (Math.random() - 0.5) * 6,
      );
      scene.add(mesh);
      confetti.push({
        mesh,
        vx: (Math.random() - 0.5) * 1.4,
        vy: -1.6 - Math.random() * 1.8,
        rx: (Math.random() - 0.5) * 5,
        ry: (Math.random() - 0.5) * 5,
      });
    }

    interface Firework3D {
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      life: number;
      maxLife: number;
    }
    let fireworks: Firework3D[] = [];
    let fwTimer = 0;

    const launch3DFirework = () => {
      const ox = (Math.random() - 0.5) * 10;
      const oy = 1.5 + Math.random() * 4.5;
      const oz = -2 - Math.random() * 4;
      const baseColor = colors[Math.floor(Math.random() * colors.length)];
      const count = isGrandFinale ? 28 : 18;
      for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: baseColor,
          emissive: baseColor,
          emissiveIntensity: 0.9,
          roughness: 0.2,
        });
        const m = new THREE.Mesh(sparkGeo, mat);
        m.position.set(ox, oy, oz);
        scene.add(m);

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 2.8 + Math.random() * 3.8;
        fireworks.push({
          mesh: m,
          vx: Math.sin(phi) * Math.cos(theta) * speed,
          vy: Math.cos(phi) * speed + 1.2,
          vz: Math.sin(phi) * Math.sin(theta) * speed,
          life: 0,
          maxLife: 1.0 + Math.random() * 0.45,
        });
      }
    };

    launch3DFirework();
    if (isGrandFinale) launch3DFirework();

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

      const dt = Math.min(0.05, clock.getDelta());

      fwTimer += dt;
      if (fwTimer > (isGrandFinale ? 0.85 : 1.45)) {
        fwTimer = 0;
        launch3DFirework();
      }

      for (const c of confetti) {
        c.mesh.position.x += c.vx * dt;
        c.mesh.position.y += c.vy * dt;
        c.mesh.rotation.x += c.rx * dt;
        c.mesh.rotation.y += c.ry * dt;
        if (c.mesh.position.y < -6) {
          c.mesh.position.y = 8;
          c.mesh.position.x = (Math.random() - 0.5) * 16;
        }
      }

      const nextFw: Firework3D[] = [];
      for (const f of fireworks) {
        f.life += dt;
        if (f.life >= f.maxLife) {
          scene.remove(f.mesh);
          (f.mesh.material as THREE.Material).dispose();
          continue;
        }
        f.mesh.position.x += f.vx * dt;
        f.mesh.position.y += f.vy * dt;
        f.mesh.position.z += f.vz * dt;
        f.vy -= 4.2 * dt;
        f.mesh.scale.setScalar(Math.max(0.01, 1 - f.life / f.maxLife));
        nextFw.push(f);
      }
      fireworks = nextFw;

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
      confetti.forEach((c) => (c.mesh.material as THREE.Material).dispose());
      fireworks.forEach((f) => (f.mesh.material as THREE.Material).dispose());
      confettiGeo.dispose();
      sparkGeo.dispose();
      studio.dispose();
    };
  }, [isGrandFinale]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4 py-6 overflow-hidden"
    >
      {/* 3D Fireworks & Confetti WebGL Stage */}
      <div
        ref={fxMountRef}
        className="fixed inset-0 pointer-events-none z-10"
        aria-hidden="true"
      />

      <div className="relative z-20 w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-5"
        >
          <div className="inline-flex items-center gap-2 text-amber-700 font-bold text-sm mb-1.5">
            {isGrandFinale ? (
              <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
            ) : (
              <Trophy className="w-4 h-4 text-amber-500" />
            )}
            <span>
              {isGrandFinale
                ? 'التتويج الأسطوري — اجتزتِ كل المستويات الـ 30!'
                : `اكتمل المستوى ${levelConfig.level} بنجاح!`}
            </span>
          </div>
          <h1
            className="text-3xl sm:text-5xl font-bold text-[#2D1824] leading-tight"
            style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
          >
            {isGrandFinale
              ? 'ألف مبروك يا جودي ختمتي اللعبة الـ 3D! 🏆✨'
              : 'مبروك يا أجمل جودي في العالم! كسبتي المرحلة 🎉✨'}
          </h1>
        </motion.div>

        {/* Celebration Card (Solid translucent white, no backdrop-blur over WebGL) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="bg-white/95 border-2 border-rose-300 rounded-3xl shadow-[0_24px_60px_-15px_rgba(225,29,72,0.28)] p-5 sm:p-8 ring-4 ring-emerald-50/80"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Real Photo + Anime Companion Pair */}
            <div className="md:col-span-5 flex items-center justify-center gap-3 sm:gap-4">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-[3px] border-white shadow-lg ring-2 ring-rose-300 shrink-0">
                <Image
                  src={realImageSrc}
                  alt="صورة جودي الحقيقية"
                  fill
                  sizes="160px"
                  referrerPolicy="no-referrer"
                  className="object-cover object-center"
                />
              </div>
              <div className="relative w-32 h-36 sm:w-40 sm:h-44 shrink-0 animate-float-slow">
                <Image
                  src={transparentAnimeSrc}
                  alt="شخصية جودي الأنمي"
                  fill
                  sizes="160px"
                  referrerPolicy="no-referrer"
                  className="object-contain drop-shadow-[0_12px_20px_rgba(45,24,36,0.22)]"
                />
              </div>
            </div>

            <div className="md:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 bg-gradient-to-l from-rose-500 to-pink-500 text-white font-bold text-sm px-4 py-1.5 rounded-2xl shadow-sm">
                  <Heart className="w-4 h-4 fill-white" />
                  <span>جودي — بطلة الأنمي الأسطورية</span>
                </div>

                <div className="flex items-center gap-1" aria-label={`${starsEarned} من 3 نجوم`}>
                  {[1, 2, 3].map((idx) => (
                    <Star
                      key={idx}
                      className={`w-6 h-6 ${
                        idx <= starsEarned
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-base sm:text-xl font-bold text-[#2D1824] leading-relaxed">
                {isGrandFinale
                  ? GRAND_3D_VICTORY_MESSAGE
                  : `رائعة يا جودي! أنهيتِ المستوى ${levelConfig.level} (${levelConfig.worldName}) وحققتِ ${stats.score} نقطة في العالم الـ 3D!`}
              </p>

              <div className="pt-3 border-t border-rose-100 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-semibold text-[#6A4558] tabular-nums">
                <span className="text-rose-700 font-extrabold">النقاط: {stats.score}</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 font-bold">
                  الرقم القياسي لجودي: {highScore}
                  {isNewHighScore ? ' (جديد!)' : ''}
                </span>
                <span aria-hidden="true">·</span>
                <span>🐱 {stats.cats} · 🌹 {stats.roses} · 🍫 {stats.chocolates}</span>
              </div>
            </div>
          </div>

          {/* Dedicated Secret Gift / Special Message Box */}
          <div className="mt-6 pt-5 border-t border-rose-100">
            {!giftOpened ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setGiftOpened(true)}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-l from-amber-50 via-rose-50 to-emerald-50 border border-amber-300/80 text-[#2D1824] font-bold text-sm sm:text-base hover:border-rose-400 transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer"
              >
                <Gift className="w-5 h-5 text-rose-500" />
                <span>فتح الهدية السرية / رسالة خاصة لـ جودي 🎁</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28 }}
                className="rounded-2xl bg-gradient-to-br from-[#FFF6F9] via-[#FFFDF7] to-[#F2FAF6] border border-rose-200 p-4 sm:p-5 text-center space-y-2"
              >
                <div className="text-xs font-extrabold text-rose-600 flex items-center justify-center gap-1.5">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>رسالة سرية خاصة إلى جودي</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-[#2D1824] leading-relaxed">
                  {isGrandFinale
                    ? 'أكملتِ الرحلة بجدارة يا جودي. شكراً لمشاركتكِ، ونتمنى لكِ دوام النجاح والتقدم.'
                    : levelConfig.secretNote}
                </p>
              </motion.div>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {!isGrandFinale ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={onNextLevel}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-l from-rose-500 via-pink-500 to-rose-600 text-white font-bold text-base sm:text-lg shadow-[0_10px_28px_-6px_rgba(244,63,94,0.5)] flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>المستوى التالي ({levelConfig.level + 1})</span>
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={onOpenWorldMap}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-l from-amber-500 via-rose-500 to-pink-600 text-white font-bold text-base sm:text-lg shadow-[0_10px_28px_-6px_rgba(244,63,94,0.5)] flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Crown className="w-5 h-5" />
                <span>استعراض خريطة الأبطال</span>
              </motion.button>
            )}

            <button
              type="button"
              onClick={onOpenWorldMap}
              className="py-3.5 px-5 rounded-2xl border border-rose-200 bg-[#FFF7FA] hover:bg-rose-100/70 text-[#2D1824] font-bold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <MapIcon className="w-4 h-4 text-rose-600" />
              <span>خريطة المستويات</span>
            </button>

            <button
              type="button"
              onClick={onPlayAgain}
              className="py-3.5 px-5 rounded-2xl border border-rose-200 bg-white hover:bg-rose-50 text-[#2D1824] font-bold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>إعادة المستوى</span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
