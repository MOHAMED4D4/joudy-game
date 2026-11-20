'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
  Crown,
  Home,
  Lock,
  Play,
  Sparkles,
  Star,
  Swords,
  Trophy,
} from 'lucide-react';
import { LEVELS, WORLD_THEMES } from '@/lib/levels';
import type { JoudyGameProgress } from '@/lib/storage';
import WorldAtmosphereOverlay from './WorldAtmosphereOverlay';
import RewardsHub from './RewardsHub';
import { saveWorld, useWorldSave } from '@/lib/joudyWorld';
import { soundEngine } from '@/lib/soundEffects';


type ChapterNumber = 2 | 3 | 4;
type ChapterFlag = 'coastalRegionUnlocked' | 'thirdChapterUnlocked' | 'fourthChapterUnlocked';

function ChapterGateCard({
  chapter, previousChapter, levelsLabel, regionName, description, price, totalScore,
  unlocked, prerequisiteComplete, prerequisiteLabel, notice, onUnlock, onEnter,
}: {
  chapter: ChapterNumber; previousChapter: string; levelsLabel: string; regionName: string;
  description: string; price: number; totalScore: number; unlocked: boolean;
  prerequisiteComplete: boolean; prerequisiteLabel: string; notice: string;
  onUnlock: () => void; onEnter: () => void;
}) {
  const palette = chapter === 2
    ? { edge: 'border-amber-200/25', glow: 'bg-amber-300/10', label: 'text-amber-200/80', icon: 'border-amber-200/35 bg-amber-300/10 text-amber-100', line: 'via-amber-200/50', button: 'from-amber-200 via-yellow-400 to-orange-500', pill: 'border-amber-100/20 text-amber-100' }
    : chapter === 3
      ? { edge: 'border-cyan-200/25', glow: 'bg-cyan-300/10', label: 'text-cyan-200/80', icon: 'border-cyan-200/35 bg-cyan-300/10 text-cyan-100', line: 'via-cyan-200/50', button: 'from-cyan-200 via-sky-400 to-blue-600', pill: 'border-cyan-100/20 text-cyan-100' }
      : { edge: 'border-fuchsia-200/25', glow: 'bg-fuchsia-300/10', label: 'text-fuchsia-200/80', icon: 'border-fuchsia-200/35 bg-fuchsia-300/10 text-fuchsia-100', line: 'via-fuchsia-200/50', button: 'from-rose-300 via-fuchsia-500 to-violet-700', pill: 'border-fuchsia-100/20 text-fuchsia-100' };
  const remaining = Math.max(0, price - totalScore);
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}
      className={`relative my-10 overflow-hidden rounded-[2rem] border ${palette.edge} bg-gradient-to-br from-[#171b31] via-[#10182a] to-[#080e19] p-4 shadow-[0_20px_60px_rgba(0,0,0,.42)] sm:my-14 sm:p-6 ${unlocked ? 'chapter-gate-open' : 'chapter-gate-locked'}`}
      aria-label={`بوابة الفصل ${chapter}`}>
      <div className={`pointer-events-none absolute -left-12 -top-14 h-44 w-44 rounded-full ${palette.glow} blur-3xl`} />
      <div className={`pointer-events-none absolute -right-12 -bottom-16 h-48 w-48 rounded-full ${palette.glow} blur-3xl`} />
      <div className="relative mb-5 flex h-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#090f1a]" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-8 -translate-y-1/2 bg-[#252d3a] shadow-inner" />
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 border-t-2 border-dashed border-amber-100/55" />
        <motion.div
          className={`relative z-10 grid h-14 w-14 place-items-center rounded-full border-[3px] ${palette.icon} bg-[#111a2b] shadow-[0_0_28px_rgba(0,0,0,.7)]`}
          animate={unlocked
            ? { scale: [1, 1.12, 1], rotate: [0, 8, -8, 0], boxShadow: ['0 0 18px rgba(52,211,153,.25)', '0 0 38px rgba(52,211,153,.8)', '0 0 18px rgba(52,211,153,.25)'] }
            : { y: [0, -7, 0], rotate: [0, -12, 12, 0], scale: [1, 1.08, 1], boxShadow: ['0 0 18px rgba(251,191,36,.25)', '0 0 42px rgba(251,191,36,.8)', '0 0 18px rgba(251,191,36,.25)'] }}
          transition={{ duration: unlocked ? 2.4 : 1.55, repeat: Infinity, ease: 'easeInOut' }}
        >
          {unlocked ? <Sparkles className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
        </motion.div>
      </div>
      <div className="relative flex flex-col items-center gap-4 text-center">
        <div className="min-w-0 max-w-3xl">
            <p className={`text-[10px] font-black tracking-[.22em] ${palette.label}`}>نهاية {previousChapter}</p>
            <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">{unlocked ? `${regionName} مفتوحة` : `الفصل ${chapter} ينتظركِ`}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-6 text-slate-300 sm:text-sm">{unlocked ? `تم فتح ${regionName}. ${description}` : `${description} يلزم إنهاء ${prerequisiteLabel} أولاً، ثم فتح البوابة بالنقاط المطلوبة.`}</p>
          </div>
        <div className="relative flex w-full max-w-md shrink-0 flex-col items-center gap-2">
          <div className={`inline-flex items-center gap-2 rounded-full border ${palette.pill} bg-black/25 px-3 py-1.5 text-xs font-black`}>
            <span>⭐</span><span className="tabular-nums">{totalScore.toLocaleString('ar-EG')}</span><span className="opacity-50">/</span><span>{price.toLocaleString('ar-EG')} نقطة</span>
          </div>
          {unlocked ? (
            <button type="button" onClick={onEnter} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-100/35 bg-gradient-to-l from-emerald-300 to-teal-500 px-5 py-3 font-black text-slate-950 shadow-[0_10px_28px_rgba(16,185,129,.2)] transition hover:-translate-y-0.5">
              <Play className="h-4 w-4 fill-current" /> دخول الفصل {chapter}
            </button>
          ) : !prerequisiteComplete ? (
            <button type="button" onClick={onUnlock} className={`flex w-full items-center justify-center gap-2 rounded-2xl border ${palette.edge} bg-white/5 px-5 py-3 font-black text-white transition hover:bg-white/10`}>
              <Lock className="h-4 w-4" /> أكملي {prerequisiteLabel}
            </button>
          ) : remaining === 0 ? (
            <button type="button" onClick={onUnlock} className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l ${palette.button} px-5 py-3 font-black text-slate-950 shadow-[0_10px_30px_rgba(0,0,0,.25)] transition hover:-translate-y-0.5 hover:brightness-110`}>
              <Lock className="h-4 w-4" /> افتحي الفصل {chapter} · {price.toLocaleString('ar-EG')} نقطة
            </button>
          ) : (
            <button type="button" onClick={onUnlock} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200/30 bg-gradient-to-l from-rose-500/90 to-violet-800/90 px-5 py-3 font-black text-white transition hover:brightness-110">
              <Lock className="h-4 w-4" /> تحتاجين {remaining.toLocaleString('ar-EG')} نقطة إضافية
            </button>
          )}
          {notice && <p role="status" className={`max-w-xs text-[11px] font-bold leading-5 ${unlocked ? 'text-emerald-200' : 'text-rose-200'}`}>{notice}</p>}
        </div>
      </div>
      <div className="relative mt-5 flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-transparent" style={{ backgroundImage: `linear-gradient(to right, transparent, ${chapter === 2 ? 'rgba(253,230,138,.55)' : chapter === 3 ? 'rgba(103,232,249,.55)' : 'rgba(232,121,249,.55)'}, transparent)` }} />
        <span className={`rounded-full border ${palette.pill} bg-black/30 px-3 py-1 text-[9px] font-black tracking-[.2em]`}>الفصل {chapter} · {levelsLabel}</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-transparent" style={{ backgroundImage: `linear-gradient(to left, transparent, ${chapter === 2 ? 'rgba(253,230,138,.55)' : chapter === 3 ? 'rgba(103,232,249,.55)' : 'rgba(232,121,249,.55)'}, transparent)` }} />
      </div>
    </motion.div>
  );
}

interface WorldMapScreenProps {
  progress: JoudyGameProgress;
  onSelectLevel: (level: number) => void;
  onBackToHome: () => void;
}

export default function WorldMapScreen({
  progress,
  onSelectLevel,
  onBackToHome,
}: WorldMapScreenProps) {
  const currentLevelRef = useRef<HTMLDivElement | null>(null);
  const worldSave = useWorldSave();
  const [gateNotice, setGateNotice] = useState<{ chapter: ChapterNumber; text: string } | null>(null);
  const [rewardsPage, setRewardsPage] = useState<'map' | 'shop' | 'exchange' | 'awards' | 'wheel'>('map');

  useEffect(() => {
    if (rewardsPage !== 'wheel') return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, [rewardsPage]);
  const chapterSettings: Record<ChapterNumber, { price: number; requiredLevel: number; flag: ChapterFlag; region: string }> = {
    2: { price: 40_000, requiredLevel: 15, flag: 'coastalRegionUnlocked', region: 'مدينة الظلال' },
    3: { price: 65_000, requiredLevel: 20, flag: 'thirdChapterUnlocked', region: 'غابة الكائنات الغريبة' },
    4: { price: 70_000, requiredLevel: 25, flag: 'fourthChapterUnlocked', region: 'قلعة الزعيم الأخير' },
  };

  const unlockChapter = (chapter: ChapterNumber) => {
    const config = chapterSettings[chapter];
    const { requiredLevel, price, flag } = config;
    if (worldSave[flag]) return;
    if (!progress.completedLevels[requiredLevel]) {
      soundEngine.playLocked();
      setGateNotice({ chapter, text: `يجب إكمال المستوى ${requiredLevel} أولاً لفتح هذه البوابة.` });
      return;
    }
    if (worldSave.totalScore < price) {
      soundEngine.playLocked();
      setGateNotice({ chapter, text: `تحتاجين إلى ${(price - worldSave.totalScore).toLocaleString('ar-EG')} نقطة إضافية لفتح ${config.region}.` });
      return;
    }
    let purchased = false;
    const updatedSave = saveWorld((current) => {
      if (current[flag] || current.totalScore < price) return current;
      purchased = true;
      return { ...current, totalScore: current.totalScore - price, [flag]: true };
    });
    if (updatedSave[flag]) {
      if (purchased) soundEngine.playPurchase();
      setGateNotice({ chapter, text: purchased ? `تم فتح ${config.region} بنجاح! أصبحت المستويات ${chapter === 2 ? '16–20' : chapter === 3 ? '21–25' : '26–30'} متاحة.` : 'البوابة مفتوحة بالفعل.' });
    } else {
      setGateNotice({ chapter, text: `تحتاجين إلى ${(price - updatedSave.totalScore).toLocaleString('ar-EG')} نقطة إضافية.` });
    }
  };

  // Restore the older map behavior: when STAGES opens, smoothly bring the
  // currently unlocked level into view; repeat this after progress advances.
  useEffect(() => {
    if (progress.highestUnlockedLevel >= 5 && !worldSave.shieldFreeGranted) {
      saveWorld((current) => current.shieldFreeGranted ? current : { ...current, shieldCharges: current.shieldCharges + 20, shieldFreeGranted: true });
    }
  }, [progress.highestUnlockedLevel, worldSave.shieldFreeGranted]);

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
  const currentLevel = Math.min(30, progress.highestUnlockedLevel);
  const isChapterOpenForLevel = (level: number) =>
    (level >= 1 && level <= 15) ||
    (level >= 16 && level <= 20 && worldSave.coastalRegionUnlocked) ||
    (level >= 21 && level <= 25 && worldSave.thirdChapterUnlocked) ||
    (level >= 26 && level <= 30 && worldSave.fourthChapterUnlocked);
  const quickStartLevel =
    currentLevel >= 16 && !worldSave.coastalRegionUnlocked ? 15 :
    currentLevel >= 21 && !worldSave.thirdChapterUnlocked ? 20 :
    currentLevel >= 26 && !worldSave.fourthChapterUnlocked ? 25 : currentLevel;

  // Vertical wave offsets for the 5 nodes inside each world to create a playful winding cartoon path
  const waveOffsets = [
    'sm:translate-y-5',
    'sm:-translate-y-5',
    'sm:translate-y-3',
    'sm:-translate-y-6',
    'sm:translate-y-2',
  ];

  if (rewardsPage !== 'map') {
    return <div className={rewardsPage === 'wheel' ? 'fixed inset-0 z-[90] h-[100dvh] w-full overflow-hidden px-2 py-2' : 'min-h-dvh w-full px-3 py-5 sm:px-6 sm:py-8'}><RewardsHub progress={progress} page={rewardsPage} onBack={() => setRewardsPage('map')} /></div>;
  }

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
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
          <button type="button" onClick={onBackToHome} className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-cyan-200/20 bg-cyan-300/10 px-4 py-3 text-xs font-black text-cyan-100 shadow-lg transition hover:border-cyan-200/40 hover:bg-cyan-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
            <Home className="h-4 w-4" /> الرئيسية
          </button>
        </div>

      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => setRewardsPage('shop')} className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/20 bg-gradient-to-l from-cyan-950/80 to-blue-950/70 px-5 py-2.5 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:border-cyan-200/40">
          <span className="text-lg">🛒</span> المتجر
        </button>
        <button type="button" onClick={() => setRewardsPage('awards')} className="inline-flex items-center gap-2 rounded-xl border border-amber-200/20 bg-gradient-to-l from-amber-950/70 to-orange-950/60 px-5 py-2.5 text-sm font-black text-amber-100 shadow-md transition hover:-translate-y-0.5 hover:border-amber-200/40">
          <Trophy className="h-5 w-5"/> الإنجازات والتحديات
        </button>
        <button type="button" onClick={() => setRewardsPage('exchange')} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/20 bg-gradient-to-l from-emerald-950/80 to-teal-950/70 px-5 py-2.5 text-sm font-black text-emerald-100 shadow-md transition hover:-translate-y-0.5 hover:border-emerald-200/40">
          <span className="text-lg">🔄</span> تبادل العملات بالنقاط
        </button>
        <button type="button" onClick={() => setRewardsPage('wheel')} className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-200/20 bg-gradient-to-l from-fuchsia-950/80 to-violet-950/70 px-5 py-2.5 text-sm font-black text-fuchsia-100 shadow-md transition hover:-translate-y-0.5 hover:border-fuchsia-200/40">
          <span className="text-lg">🎡</span> عجلة الحظ
        </button>
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
          const worldUnlocked = worldLevels.some((l) => l.level <= currentLevel) && isChapterOpenForLevel(worldLevels[0]?.level ?? 1);
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
                          {world.id <= 3 ? `الفصل الأول · العالم ${world.id} من 3` : `الفصل ${world.id - 2} · العالم ${world.id - 3} من 1`}
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
                      const isLocked = lvl.level > currentLevel || !isChapterOpenForLevel(lvl.level);
                      const isCurrent = lvl.level === quickStartLevel && !isLocked;
                      const isFirstBoss = lvl.level === 15;
                      const isFinalBoss = lvl.level === 30;
                      const isChapterBoss = lvl.level === 20 || lvl.level === 25;
                      const isBossLevel = isFirstBoss || isChapterBoss || isFinalBoss;
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
                            className={`relative flex flex-col items-center justify-center border transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 ${
                              isFirstBoss ? 'h-[104px] w-[104px] rounded-[1.8rem] sm:h-[116px] sm:w-[116px]' : isFinalBoss ? 'h-[110px] w-[110px] rounded-[1.9rem] sm:h-[122px] sm:w-[122px]' : isChapterBoss ? 'h-[92px] w-[92px] rounded-[1.65rem] sm:h-[100px] sm:w-[100px]' : 'h-16 w-16 rounded-2xl sm:h-[74px] sm:w-[74px]'
                            } ${
                              isLocked
                                ? 'border-white/10 bg-slate-950/85 text-slate-600 shadow-inner opacity-75 cursor-not-allowed'
                                : isFirstBoss
                                  ? 'border-amber-100 bg-gradient-to-br from-[#FFF1A8] via-[#F43F5E] to-[#7F1D1D] text-white shadow-[0_0_52px_rgba(244,63,94,.58)] ring-[3px] ring-amber-200/75 hover:brightness-110 animate-glow-breath cursor-pointer scale-[1.04]'
                                  : isFinalBoss
                                    ? 'border-fuchsia-100 bg-gradient-to-br from-[#FDE68A] via-[#7C3AED] to-[#1E1038] text-white shadow-[0_0_58px_rgba(192,38,211,.52)] ring-[3px] ring-fuchsia-200/65 cursor-pointer scale-[1.05]'
                                    : isChapterBoss
                                  ? 'border-cyan-100/70 bg-gradient-to-br from-cyan-300 via-teal-500 to-emerald-700 text-white shadow-[0_0_34px_rgba(34,211,238,.28)] ring-2 ring-cyan-200/40 cursor-pointer hover:brightness-110'
                                : isCurrent
                                      ? 'border-cyan-200 bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.38)] cursor-pointer animate-glow-breath ring-2 ring-cyan-300/40'
                                      : completed
                                        ? 'border-emerald-400/70 bg-slate-800 text-white shadow-md hover:border-cyan-300 cursor-pointer'
                                        : 'border-white/10 bg-slate-900 text-slate-500 cursor-not-allowed opacity-80'
                            }`}
                          >
                            {(isFirstBoss || isChapterBoss) && !isLocked && <Swords className={`mb-0.5 h-4 w-4 ${isFirstBoss ? 'text-amber-100' : 'text-white'}`} />}
                            {isFinalBoss && !isLocked && <Crown className="mb-0.5 h-4 w-4 fill-amber-300 text-amber-200" />}

                            {isLocked ? (
                              <>
                                <Lock className="w-4 h-4 mb-0.5" />
                                <span className="text-xs font-bold tabular-nums">{lvl.level}</span>
                              </>
                            ) : (
                              <>
                                <span className={`${isBossLevel ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} font-extrabold leading-none tabular-nums`}>
                                  {lvl.level}
                                </span>
                                {isBossLevel && <span className="mt-0.5 text-[8px] font-black tracking-widest opacity-90">{isFirstBoss ? 'GRAND BOSS' : isFinalBoss ? 'FINAL BOSS' : 'CHAPTER BOSS'}</span>}
                                <span className="mt-0.5 text-[9px] font-bold tabular-nums opacity-90 sm:text-[10px]">
                                  {lvl.targetScore.toLocaleString('ar-EG')} ن
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
                            <span className={`whitespace-nowrap text-[11px] font-semibold tabular-nums ${isBossLevel ? 'text-amber-200' : 'text-slate-500'}`}>
                              {isFirstBoss ? '⚔ المعركة الكبرى' : isFinalBoss ? '👑 الزعيم الأخير' : isChapterBoss ? '⚔ حارس الفصل' : `هدف ${lvl.targetScore.toLocaleString('ar-EG')}`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {world.id === 3 && (
                <ChapterGateCard
                  chapter={2} previousChapter="الفصل الأول · المستويات 1–15" levelsLabel="المستويات 16–20"
                  regionName="مدينة الظلال" description="استكشفي المدينة من المستوى 16 حتى 20، مع أجواء وخصوم جدد."
                  price={chapterSettings[2].price} totalScore={worldSave.totalScore}
                  unlocked={worldSave.coastalRegionUnlocked} prerequisiteComplete={Boolean(progress.completedLevels[15])}
                  prerequisiteLabel="المستوى 15 والزعيم الأول" notice={gateNotice?.chapter === 2 ? gateNotice.text : ''}
                  onUnlock={() => unlockChapter(2)} onEnter={() => onSelectLevel(16)}
                />
              )}
              {world.id === 4 && (
                <ChapterGateCard
                  chapter={3} previousChapter="الفصل الثاني · المستويات 16–20" levelsLabel="المستويات 21–25"
                  regionName="غابة الكائنات الغريبة" description="ادخلي الغابة الغامضة واكتشفي وحوشاً جديدة بتصميمات مختلفة."
                  price={chapterSettings[3].price} totalScore={worldSave.totalScore}
                  unlocked={worldSave.thirdChapterUnlocked} prerequisiteComplete={Boolean(progress.completedLevels[20])}
                  prerequisiteLabel="المستوى 20" notice={gateNotice?.chapter === 3 ? gateNotice.text : ''}
                  onUnlock={() => unlockChapter(3)} onEnter={() => onSelectLevel(21)}
                />
              )}
              {world.id === 5 && (
                <ChapterGateCard
                  chapter={4} previousChapter="الفصل الثالث · المستويات 21–25" levelsLabel="المستويات 26–30"
                  regionName="قلعة الزعيم الأخير" description="استعدي لخمسة مستويات داخل القلعة، وصولاً إلى المواجهة النهائية."
                  price={chapterSettings[4].price} totalScore={worldSave.totalScore}
                  unlocked={worldSave.fourthChapterUnlocked} prerequisiteComplete={Boolean(progress.completedLevels[25])}
                  prerequisiteLabel="المستوى 25" notice={gateNotice?.chapter === 4 ? gateNotice.text : ''}
                  onUnlock={() => unlockChapter(4)} onEnter={() => onSelectLevel(26)}
                />
              )}

              {/* Winding Dotted Connector Bridge between World Chapters */}
              {hasNextWorld && (
                <div
                  className="flex min-h-24 items-center justify-center px-12 py-7"
                  aria-hidden="true"
                >
                  <svg width="104" height="64" viewBox="0 0 104 64" className="overflow-visible">
                    <path
                      d={
                        isEvenRow
                          ? 'M 28 0 C 8 24, 96 40, 76 64'
                          : 'M 76 0 C 96 24, 8 40, 28 64'
                      }
                      fill="none"
                      stroke="rgba(244, 63, 94, 0.38)"
                      strokeWidth="8"
                      strokeDasharray="9 9"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}

        <div className="relative isolate mt-5 min-h-[180px] overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#050914] shadow-[0_18px_55px_rgba(0,0,0,.5)] sm:min-h-[210px]">
          <Image src="/images/anime-night.jpg" alt="معاينة معتمة للموسم القادم" fill sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover object-center opacity-20 grayscale" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950/90 via-indigo-950/85 to-black/95" />
          <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 25%, #94a3b8 0 1px, transparent 2px), radial-gradient(circle at 75% 65%, #64748b 0 1px, transparent 2px)', backgroundSize: '42px 42px, 58px 58px' }} />
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => (
              <span key={index} className="season-particle" style={{ left: `${7 + ((index * 37) % 88)}%`, top: `${18 + ((index * 23) % 72)}%`, ['--particle-delay' as string]: `${-((index * 0.37) % 5)}s`, ['--particle-duration' as string]: `${3.4 + (index % 5) * 0.55}s` } as React.CSSProperties} />
            ))}
          </div>
          <div className="relative flex min-h-[180px] flex-col items-center justify-center gap-2 px-5 py-7 text-center sm:min-h-[210px]">
            <motion.span animate={{ y: [0, -3, 0], rotate: [-5, 5, -5], scale: [1, 1.04, 1] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-500/30 bg-slate-800/70 text-slate-300 shadow-[0_0_24px_rgba(148,163,184,.15)]"><Lock className="h-6 w-6" /></motion.span>
            <p className="text-[10px] font-black tracking-[.25em] text-slate-500">المستويات 31 – 60</p>
            <h2 className="text-xl font-black text-slate-300 sm:text-2xl">السيزون القادم قريباً</h2>
            <p className="max-w-lg text-xs leading-6 text-slate-500">منطقة جديدة مقفولة حالياً… مغامرات وأعداء وعوالم إضافية قيد التحضير</p>
            <span className="mt-1 rounded-full border border-slate-700/70 bg-black/30 px-3 py-1 text-[10px] font-bold text-slate-500">محتوى قادم · 30 مستوى جديد</span>
          </div>
        </div>
      </div>
    </motion.section>

    {/* يبقى الزر ملازمًا للشاشة حتى أثناء تمرير قائمة المراحل الطويلة */}
    {quickStartLevel >= 1 ? (
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.025, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelectLevel(quickStartLevel)}
          className="pointer-events-auto flex min-w-[min(92vw,360px)] items-center justify-center gap-2 rounded-2xl border border-cyan-100/35 bg-gradient-to-l from-cyan-400 via-sky-500 to-blue-600 px-7 py-4 text-base font-black text-white shadow-[0_12px_38px_rgba(0,0,0,.48)]"
        >
          <Play className="h-5 w-5 fill-white" />
          <span>ابدأ اللعب · المستوى {quickStartLevel}</span>
          <Sparkles className="h-4 w-4" />
        </motion.button>
      </div>
    ) : null}
    </>
  );
}
