'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Crown,
  Lock,
  Play,
  Sparkles,
  Star,
} from 'lucide-react';
import { LEVELS, WORLD_THEMES } from '@/lib/levels';
import type { JoudyGameProgress } from '@/lib/storage';
import { loadTransparentSprite } from '@/lib/spriteUtils';
import WorldAtmosphereOverlay from './WorldAtmosphereOverlay';

interface WorldMapScreenProps {
  progress: JoudyGameProgress;
  realImageSrc: string;
  animeImageSrc: string;
  onSelectLevel: (level: number) => void;
  onBackToCharacter: () => void;
}

export default function WorldMapScreen({
  progress,
  realImageSrc,
  animeImageSrc,
  onSelectLevel,
  onBackToCharacter,
}: WorldMapScreenProps) {
  const [animeBadgeSrc, setAnimeBadgeSrc] = useState(animeImageSrc);

  useEffect(() => {
    let active = true;
    loadTransparentSprite(animeImageSrc)
      .then(({ dataUrl }) => {
        if (active) setAnimeBadgeSrc(dataUrl);
      })
      .catch(() => {
        if (active) setAnimeBadgeSrc(animeImageSrc);
      });
    return () => {
      active = false;
    };
  }, [animeImageSrc]);

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
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28 }}
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5"
    >
      {/* Map Header & Quick Launch */}
      <div className="bg-white/95 backdrop-blur-sm border border-rose-200/90 rounded-3xl p-5 sm:p-6 shadow-[0_16px_40px_-15px_rgba(225,29,72,0.14)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
              <button
                type="button"
                onClick={onBackToCharacter}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>ملف البطلة</span>
              </button>
              <span className="text-rose-300" aria-hidden="true">
                ·
              </span>
              <span className="text-xs font-semibold text-[#6A4558]">
                خريطة المراحل السحرية · أركيد 2D
              </span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[#2D1824]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              مسار مغامرة جودي (30 مستوى)
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-[#5C3D4E] tabular-nums pt-0.5">
              <span>المكتملة: {completedCount} / 30</span>
              <span className="text-rose-300" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{totalStars} / 90</span>
              </span>
              <span className="text-rose-300" aria-hidden="true">
                ·
              </span>
              <span className="text-rose-700 font-bold">
                الرقم القياسي لجودي: {progress.highScore}
              </span>
            </div>
          </div>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectLevel(currentLevel)}
          className="py-3.5 px-6 rounded-2xl bg-gradient-to-l from-rose-500 via-pink-500 to-rose-600 text-white font-bold text-base shadow-[0_10px_28px_-6px_rgba(244,63,94,0.5)] hover:shadow-[0_14px_34px_-6px_rgba(244,63,94,0.65)] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>العب المستوى {currentLevel}</span>
          <Sparkles className="w-4 h-4" />
        </motion.button>
      </div>

      {/* 6 Worlds Serpentine 2D Cartoon Path */}
      <div className="space-y-0 pb-8">
        {WORLD_THEMES.map((world, worldIdx) => {
          const worldLevels = LEVELS.filter((l) => l.worldId === world.id);
          const isEvenRow = worldIdx % 2 === 1;
          const orderedLevels = isEvenRow ? [...worldLevels].reverse() : worldLevels;
          const worldUnlocked = worldLevels.some((l) => l.level <= currentLevel);
          const hasNextWorld = worldIdx < WORLD_THEMES.length - 1;

          return (
            <React.Fragment key={world.id}>
              <div
                className={`relative rounded-3xl overflow-hidden border-2 ${world.borderClass} bg-gradient-to-br ${world.cardBgClass} shadow-sm`}
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
                          className={`relative flex flex-col items-center gap-1.5 ${waveClass}`}
                        >
                          {/* Pulsing Joudy Mini Avatar Floating on Current Level */}
                          {isCurrent && (
                            <motion.div
                              initial={{ y: -4 }}
                              animate={{ y: [-4, -11, -4] }}
                              transition={{ repeat: Infinity, duration: 2.1, ease: 'easeInOut' }}
                              className="absolute -top-11 sm:-top-12 z-20 flex flex-col items-center pointer-events-none"
                            >
                              <div className="relative w-12 h-12 sm:w-14 sm:h-14 overflow-hidden">
                                <Image
                                  src={animeBadgeSrc}
                                  alt="جودي هنا"
                                  fill
                                  sizes="56px"
                                  referrerPolicy="no-referrer"
                                  className="object-contain"
                                />
                              </div>
                            </motion.div>
                          )}

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
                            className={`relative w-16 h-16 sm:w-[74px] sm:h-[74px] rounded-full flex flex-col items-center justify-center transition-all border-[3px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 ${
                              isCurrent
                                ? 'bg-gradient-to-br from-rose-500 via-pink-500 to-amber-400 text-white border-white shadow-[0_0_28px_rgba(244,63,94,0.62)] cursor-pointer animate-glow-breath ring-4 ring-rose-300/60'
                                : completed
                                  ? 'bg-white text-[#2D1824] border-amber-400 shadow-md hover:border-rose-400 cursor-pointer'
                                  : 'bg-slate-100/90 text-slate-400 border-slate-200 cursor-not-allowed opacity-80'
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
                            <span className="text-xs font-extrabold text-rose-600 whitespace-nowrap">
                              جودي هنا · العب!
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400 tabular-nums whitespace-nowrap">
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
  );
}
