'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
  Crown,
  Lock,
  Play,
  Sparkles,
  Star,
  Coins,
} from 'lucide-react';
import { LEVELS, WORLD_THEMES } from '@/lib/levels';
import type { JoudyGameProgress } from '@/lib/storage';
import WorldAtmosphereOverlay from './WorldAtmosphereOverlay';
import WardrobeShopPanel from './WardrobeShopPanel';
import { useWorldSave } from '@/lib/joudyWorld';

interface WorldMapScreenProps {
  progress: JoudyGameProgress;
  realImageSrc: string;
  onSelectLevel: (level: number) => void;
}

export default function WorldMapScreen({
  progress,
  realImageSrc,
  onSelectLevel,
}: WorldMapScreenProps) {
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const worldSave = useWorldSave();
  const currentLevelRef = useRef<HTMLDivElement | null>(null);

  // Restore the older map behavior: when STAGES opens, smoothly bring the
  // currently unlocked level into view; repeat this after progress advances.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      currentLevelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }, 160);

    return () => window.clearTimeout(timer);
  }, [progress.highestUnlockedLevel]);


  const completedCount = Object.keys(progress.completedLevels).length;
  const totalStars = Object.values(progress.completedLevels).reduce(
    (sum, rec) => sum + rec.stars,
    0,
  );
  const currentLevel = progress.highestUnlockedLevel;

  // Vertical wave offsets for the 5 nodes inside each world to create a playful winding cartoon path
  const waveOffsets = [
    'sm:translate-y-5',
    'sm:-translate-y-5',
    'sm:translate-y-3',
    'sm:-translate-y-6',
    'sm:translate-y-2',
  ];

  return (
    <>
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28 }}
      id="stages"
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 pb-32 text-slate-100"
    >
      {/* Map Header & Quick Launch */}
      <div className="bg-[#101b2b]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-[0_20px_55px_rgba(0,0,0,.32)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-rose-300 shadow-sm shrink-0 bg-rose-50">
            <Image
              src={realImageSrc}
              alt="صورة جودي"
              fill
              sizes="64px"
              referrerPolicy="no-referrer"
              className="object-cover object-center"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">مغامرة التجميع السريعة</span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200">تقدم محفوظ</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">اجمع العناصر، تفادَ العوائق، وحقق أعلى نتيجة. افتح المراحل التالية واصنع سجلك الخاص.</p>
            <h1
              className="text-2xl sm:text-3xl font-black text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              STAGES · المراحل
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-slate-300 tabular-nums pt-0.5">
              <span>المكتملة: {completedCount} / 30</span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1 text-amber-300">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{totalStars} / 90</span>
              </span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="text-cyan-300 font-bold">
                الرقم القياسي لجودي: {progress.highScore}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3.5 text-sm font-black text-amber-200">
            <Coins className="h-4 w-4" />
            <span>{worldSave.coins}</span>
          </div>
          <button type="button" onClick={() => setWardrobeOpen(true)} className="rounded-2xl border border-amber-300/30 bg-amber-500/15 px-5 py-3.5 text-sm font-black text-amber-100 hover:bg-amber-500/25">👗 الملابس والأحذية</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#101b2b]/80 p-3"><p className="text-[10px] text-slate-400">التقدم</p><p className="mt-1 text-sm font-black text-emerald-300">محفوظ تلقائيًا</p></div>
        <div className="rounded-xl border border-white/10 bg-[#101b2b]/80 p-3"><p className="text-[10px] text-slate-400">نمط اللعب</p><p className="mt-1 text-sm font-black text-cyan-200">تحدي الأركيد</p></div>
        <div className="rounded-xl border border-white/10 bg-[#101b2b]/80 p-3"><p className="text-[10px] text-slate-400">الشخصية الرئيسية</p><p className="mt-1 text-sm font-black text-rose-200">جودي</p></div>
        <div className="rounded-xl border border-white/10 bg-[#101b2b]/80 p-3"><p className="text-[10px] text-slate-400">نظام التحدي</p><p className="mt-1 text-sm font-black text-amber-200">تقدم تدريجي</p></div>
      </div>

      {/* 6 Worlds Serpentine 2D Cartoon Path */}
      <div className="space-y-0 pb-8">
        {WORLD_THEMES.map((world, worldIdx) => {
          const worldLevels = LEVELS.filter((l) => l.worldId === world.id);
          const isEvenRow = worldIdx % 2 === 1;
          const orderedLevels = [...worldLevels].sort((a, b) => a.level - b.level);
          const worldUnlocked = worldLevels.some((l) => l.level <= currentLevel);
          const hasNextWorld = worldIdx < WORLD_THEMES.length - 1;

          return (
            <React.Fragment key={world.id}>
              <div
                className={`relative rounded-3xl overflow-hidden border border-white/10 bg-[#101b2b]/90 shadow-[0_18px_50px_rgba(0,0,0,.28)]`}
              >
                {/* Animated Framer Motion Biome Atmosphere */}
                <WorldAtmosphereOverlay worldId={world.id} variant="card" />

                {/* Subtle World Landscape Banner Strip */}
                <div className="relative h-24 sm:h-28 w-full overflow-hidden">
                  <Image
                    src={world.bgImage}
                    alt={world.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1024px"
                    referrerPolicy="no-referrer"
                    className={`object-cover object-center ${
                      worldUnlocked ? 'opacity-95' : 'opacity-55 grayscale-[30%]'
                    }`}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: world.isNight
                        ? 'linear-gradient(to top, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.32))'
                        : 'linear-gradient(to top, rgba(45, 24, 36, 0.78), rgba(45, 24, 36, 0.18))',
                    }}
                  />
                  <div className="relative z-10 h-full px-5 sm:px-7 flex flex-col justify-end pb-3.5 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold text-white/85 block">
                          العالم {world.id} من 6
                        </span>
                        <h2
                          className="text-lg sm:text-2xl font-bold leading-snug"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {world.name}
                        </h2>
                      </div>
                      <span className="text-xs font-semibold text-white/90 hidden sm:inline">
                        {world.subtitle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Winding Cartoon Node Path */}
                <div className="relative px-4 sm:px-8 pt-10 pb-8 sm:pt-12 sm:pb-12">
                  {/* Winding Road SVG Track behind nodes on tablet/desktop */}
                  <svg
                    viewBox="0 0 1000 140"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    className="hidden sm:block absolute inset-x-10 top-1/2 -translate-y-1/2 h-28 w-[calc(100%-5rem)] pointer-events-none"
                  >
                    <path
                      d="M 45 85 C 145 130, 200 15, 275 30 C 365 45, 420 110, 500 80 C 580 50, 650 10, 730 30 C 815 50, 880 110, 955 72"
                      fill="none"
                      stroke={world.isNight ? 'rgba(129, 140, 248, 0.22)' : 'rgba(255, 255, 255, 0.92)'}
                      strokeWidth="18"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 45 85 C 145 130, 200 15, 275 30 C 365 45, 420 110, 500 80 C 580 50, 650 10, 730 30 C 815 50, 880 110, 955 72"
                      fill="none"
                      stroke={world.isNight ? 'rgba(165, 180, 252, 0.65)' : 'rgba(244, 63, 94, 0.45)'}
                      strokeWidth="5"
                      strokeDasharray="12 12"
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="relative z-10 grid grid-cols-3 sm:grid-cols-5 gap-y-8 gap-x-3 sm:gap-4 items-center justify-items-center">
                    {orderedLevels.map((lvl, idx) => {
                      const completed = progress.completedLevels[lvl.level];
                      const isCurrent = lvl.level === currentLevel;
                      const isLocked = lvl.level > currentLevel;
                      const isFinalBoss = lvl.level === 30;
                      const waveClass = waveOffsets[idx % waveOffsets.length];

                      return (
                        <div
                          key={lvl.level}
                          ref={isCurrent ? currentLevelRef : undefined}
                          className={`relative flex flex-col items-center gap-1.5 ${waveClass} ${isCurrent ? 'scroll-mt-24' : ''}`}
                        >
                          <motion.button
                            type="button"
                            disabled={isLocked}
                            whileHover={!isLocked ? { scale: 1.09, y: -3 } : undefined}
                            whileTap={!isLocked ? { scale: 0.94 } : undefined}
                            onClick={() => onSelectLevel(lvl.level)}
                            aria-label={
                              isLocked
                                ? `المستوى ${lvl.level} مقفول`
                                : `بدء المستوى ${lvl.level} — الهدف ${lvl.targetScore} نقطة`
                            }
                            className={`relative w-16 h-16 sm:w-[74px] sm:h-[74px] rounded-2xl flex flex-col items-center justify-center transition-all border focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 ${
                              isCurrent
                                ? 'bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-slate-950 border-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.38)] cursor-pointer animate-glow-breath ring-2 ring-cyan-300/40'
                                : completed
                                  ? 'bg-slate-800 text-white border-emerald-400/70 shadow-md hover:border-cyan-300 cursor-pointer'
                                  : 'bg-slate-900 text-slate-500 border-white/10 cursor-not-allowed opacity-80'
                            }`}
                          >
                            {isFinalBoss && !isLocked && (
                              <Crown className="w-4 h-4 text-amber-400 fill-amber-300 -mt-0.5 mb-0.5" />
                            )}

                            {isLocked ? (
                              <>
                                <Lock className="w-4 h-4 mb-0.5" />
                                <span className="text-xs font-bold tabular-nums">{lvl.level}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-lg sm:text-xl font-extrabold leading-none tabular-nums">
                                  {lvl.level}
                                </span>
                                <span className="text-[10px] font-bold opacity-85 tabular-nums mt-0.5">
                                  {lvl.targetScore} ن
                                </span>
                              </>
                            )}
                          </motion.button>

                          {/* Stars or Status Caption */}
                          {completed ? (
                            <div className="flex items-center gap-0.5" aria-label={`${completed.stars} نجوم`}>
                              {[1, 2, 3].map((starIdx) => (
                                <Star
                                  key={starIdx}
                                  className={`w-3.5 h-3.5 ${
                                    starIdx <= completed.stars
                                      ? 'fill-amber-400 text-amber-500'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                          ) : isCurrent ? (
                            <span className="text-xs font-extrabold text-cyan-300 whitespace-nowrap">
                              جودي هنا · العب!
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-500 tabular-nums whitespace-nowrap">
                              {isFinalBoss ? 'النهاية الكبرى' : `هدف ${lvl.targetScore}`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Winding Dotted Connector Bridge between World Chapters */}
              {hasNextWorld && (
                <div
                  className={`flex px-12 sm:px-20 py-1 ${
                    isEvenRow ? 'justify-start' : 'justify-end'
                  }`}
                  aria-hidden="true"
                >
                  <svg width="64" height="36" viewBox="0 0 64 36" className="overflow-visible">
                    <path
                      d={
                        isEvenRow
                          ? 'M 18 0 C 8 14, 52 22, 34 36'
                          : 'M 46 0 C 56 14, 12 22, 30 36'
                      }
                      fill="none"
                      stroke="rgba(244, 63, 94, 0.38)"
                      strokeWidth="5"
                      strokeDasharray="7 7"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </motion.section>

    {/* يبقى الزر ملازمًا للشاشة حتى أثناء تمرير قائمة المراحل الطويلة */}
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-3">
      <motion.button
        type="button"
        whileHover={{ scale: 1.025, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onSelectLevel(currentLevel)}
        className="pointer-events-auto flex min-w-[min(92vw,360px)] items-center justify-center gap-2 rounded-2xl border border-cyan-100/35 bg-gradient-to-l from-cyan-400 via-sky-500 to-blue-600 px-7 py-4 text-base font-black text-white shadow-[0_12px_38px_rgba(0,0,0,.48)]"
      >
        <Play className="h-5 w-5 fill-white" />
        <span>ابدأ اللعب · المستوى {currentLevel}</span>
        <Sparkles className="h-4 w-4" />
      </motion.button>
    </div>
    {wardrobeOpen && <WardrobeShopPanel onClose={() => setWardrobeOpen(false)} />}
    </>
  );
}
