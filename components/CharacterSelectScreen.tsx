'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Compass, Crown, Heart, Rocket, Sparkles, Trophy } from 'lucide-react';
import { loadTransparentSprite } from '@/lib/spriteUtils';

interface CharacterSelectScreenProps {
  realImageSrc: string;
  animeImageSrc: string;
  onStartAdventure: () => void;
  onStartOpenWorld: () => void;
  onStartRoyalEvent: () => void;
}

export default function CharacterSelectScreen({
  realImageSrc,
  animeImageSrc,
  onStartAdventure,
  onStartOpenWorld,
  onStartRoyalEvent,
}: CharacterSelectScreenProps) {
  const [realImgFailed, setRealImgFailed] = useState(false);
  const [animeImgFailed, setAnimeImgFailed] = useState(false);
  const [transparentAnimeSrc, setTransparentAnimeSrc] = useState(animeImageSrc);

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

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8"
    >
      {/* Hero Title */}
      <div className="text-center mb-6 sm:mb-8">
        <p className="text-sm font-semibold text-rose-600 mb-1.5 tracking-wide">
          عالم جودي · مغامرات ومراسم ملكية
        </p>
        <h1
          className="text-3xl sm:text-5xl font-bold text-[#2D1824] leading-tight"
          style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
        >
          عالم جودي الملكي
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[#6A4558] max-w-2xl mx-auto leading-relaxed">
          تجربة تفاعلية تجمع بين تحديات الأركيد، واستكشاف المملكة، وقيادة السيارات، وحضور حفل التكريم الرسمي لجودي.
        </p>
      </div>

      {/* Main Character Select Card (Single Elevation) */}
      <div className="bg-white/95 backdrop-blur-sm border border-rose-200/80 rounded-3xl shadow-[0_20px_50px_-15px_rgba(225,29,72,0.16)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Portrait Showcase Column */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#F2F7F4] via-[#FFF4F8] to-[#F9F3EC] p-6 sm:p-8 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-l border-rose-100">
            <div className="relative w-full max-w-[300px] aspect-square">
              {/* Luminous Sage-Rose-Gold Aura Frame */}
              <div className="absolute -inset-1.5 rounded-[28px] bg-gradient-to-tr from-emerald-600/55 via-rose-400 to-amber-300 opacity-90 blur-[2px] animate-glow-breath" />

              <div className="relative w-full h-full rounded-[24px] overflow-hidden border-[3px] border-white bg-rose-50 shadow-inner">
                {!realImgFailed ? (
                  <Image
                    src={realImageSrc}
                    alt="الصورة الحقيقية للبطلة جودي"
                    fill
                    sizes="(max-width: 1024px) 300px, 340px"
                    priority
                    referrerPolicy="no-referrer"
                    onError={() => setRealImgFailed(true)}
                    className="object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-rose-100 to-pink-50 text-rose-700 p-4 text-center">
                    <Heart className="w-12 h-12 mb-2 text-rose-500" />
                    <span className="font-bold text-lg">جودي</span>
                    <span className="text-xs text-rose-500 mt-1">الشخصية الرئيسية</span>
                  </div>
                )}

                {/* Subtle Anime Companion Inset (Transparent Chibi) */}
                <div
                  className="absolute -bottom-1 left-2 w-24 h-24 sm:w-28 sm:h-28 pointer-events-none animate-float-slow"
                  title="شخصية جودي الأنمي"
                >
                  {!animeImgFailed ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={transparentAnimeSrc}
                        alt="شخصية جودي الكرتونية"
                        fill
                        sizes="112px"
                        referrerPolicy="no-referrer"
                        onError={() => setAnimeImgFailed(true)}
                        className="object-contain drop-shadow-[0_8px_14px_rgba(45,24,36,0.32)]"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-rose-500 font-bold text-xl">
                      ✨
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs font-medium text-[#5C4550] text-center">
              شخصية جودي وصورتها الأصلية داخل اللعبة
            </p>
          </div>

          {/* Character Profile & Controls Column */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div>
              {/* Character Header */}
              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-rose-100">
                <div>
                  <span className="text-xs font-semibold text-rose-600 block mb-0.5">
                    ملف الشخصية
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl font-bold text-[#2D1824]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    جودي
                  </h2>
                </div>
                <span className="text-sm font-semibold text-amber-700 tabular-nums">
                  30 مستوى · عالم مفتوح · حفل تكريم
                </span>
              </div>

              {/* Character Metadata List (Clean Unboxed Typography) */}
              <dl className="divide-y divide-rose-100/80 text-sm sm:text-base">
                <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <dt className="font-semibold text-[#6A4558]">الاسم</dt>
                  <dd className="font-bold text-[#2D1824]">جودي</dd>
                </div>
                <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <dt className="font-semibold text-[#6A4558]">الفئة</dt>
                  <dd className="font-bold text-rose-700">الشخصية الرئيسية</dd>
                </div>
                <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <dt className="font-semibold text-[#6A4558]">الأشياء المفضلة</dt>
                  <dd className="font-semibold text-[#2D1824]">
                    القطط 🐱 <span className="text-rose-300 mx-1">·</span> الورد 🌹{' '}
                    <span className="text-rose-300 mx-1">·</span> الشوكولاتة 🍫
                  </dd>
                </div>
              </dl>

              {/* Gameplay Scoring Guide */}
              <div className="mt-4 pt-4 border-t border-rose-100">
                <h3 className="text-xs font-bold text-[#6A4558] mb-3">
                  دليل النقاط والتحدي داخل المراحل
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  <div className="rounded-2xl bg-[#FFF6F8] border border-rose-100 py-2.5 px-2">
                    <div className="text-2xl leading-none mb-1" aria-hidden="true">
                      🐱
                    </div>
                    <div className="text-xs font-bold text-[#2D1824]">قطة</div>
                    <div className="text-xs font-extrabold text-emerald-700 tabular-nums mt-0.5">
                      +20 نقطة
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#FFF6F8] border border-rose-100 py-2.5 px-2">
                    <div className="text-2xl leading-none mb-1" aria-hidden="true">
                      🌹
                    </div>
                    <div className="text-xs font-bold text-[#2D1824]">وردة حمراء</div>
                    <div className="text-xs font-extrabold text-rose-600 tabular-nums mt-0.5">
                      +15 نقطة
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#FFF6F8] border border-rose-100 py-2.5 px-2">
                    <div className="text-2xl leading-none mb-1" aria-hidden="true">
                      🍫
                    </div>
                    <div className="text-xs font-bold text-[#2D1824]">شوكولاتة</div>
                    <div className="text-xs font-extrabold text-amber-700 tabular-nums mt-0.5">
                      +10 نقاط
                    </div>
                  </div>
                  <div className="rounded-2xl bg-sky-50 border border-sky-200/80 py-2.5 px-2">
                    <div className="text-2xl leading-none mb-1" aria-hidden="true">
                      🧲
                    </div>
                    <div className="text-xs font-bold text-sky-900">مغناطيس سحري</div>
                    <div className="text-xs font-extrabold text-sky-700 mt-0.5">
                      جذب تلقائي
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 py-2.5 px-2 col-span-2 sm:col-span-1">
                    <div className="text-2xl leading-none mb-1" aria-hidden="true">
                      ⚡
                    </div>
                    <div className="text-xs font-bold text-slate-800">غيمة مشاكسة</div>
                    <div className="text-xs font-extrabold text-slate-600 tabular-nums mt-0.5">
                      -1 قلب / -15
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dual-Mode Game Hub CTAs */}
            <div className="pt-2 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={onStartAdventure}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-l from-rose-500 via-pink-500 to-rose-600 text-white shadow-[0_12px_30px_-6px_rgba(244,63,94,0.52)] hover:shadow-[0_16px_36px_-6px_rgba(244,63,94,0.68)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center"
                >
                  <span className="flex items-center justify-center gap-2 font-bold text-sm sm:text-base whitespace-nowrap">
                    <Rocket className="w-4 h-4 shrink-0" />
                    <span>مغامرة التجميع السريعة</span>
                    <Sparkles className="w-4 h-4 shrink-0" />
                  </span>
                  <span className="text-[11px] font-semibold text-rose-100 tabular-nums">
                    نمط الأركيد · 30 مستوى
                  </span>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={onStartOpenWorld}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-l from-amber-500 via-rose-500 to-fuchsia-600 text-white shadow-[0_12px_30px_-6px_rgba(217,119,6,0.42)] hover:shadow-[0_16px_36px_-6px_rgba(217,119,6,0.58)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center"
                >
                  <span className="flex items-center justify-center gap-2 font-bold text-sm sm:text-base whitespace-nowrap">
                    <Crown className="w-4 h-4 shrink-0 fill-amber-200" />
                    <span>العالم المفتوح لمملكة جودي</span>
                    <Compass className="w-4 h-4 shrink-0" />
                  </span>
                  <span className="text-[11px] font-semibold text-amber-50">
                    عالم مفتوح · قيادة واستكشاف ومهام
                  </span>
                </motion.button>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onStartRoyalEvent}
                className="w-full rounded-2xl border border-amber-300 bg-gradient-to-l from-slate-900 via-[#4A2148] to-rose-900 px-4 py-3.5 text-white shadow-[0_12px_28px_rgba(30,20,45,.28)] transition-all hover:brightness-110"
              >
                <span className="flex items-center justify-center gap-2 text-sm font-black sm:text-base">
                  <Trophy className="h-4 w-4 text-amber-300" />
                  حفل تكريم جودي الملكي
                  <Sparkles className="h-4 w-4 text-amber-200" />
                </span>
                <span className="mt-1 block text-[11px] font-semibold text-amber-100">بوابة ملكية · جمهور · تصوير · تسليم الكأس · موكب العودة</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
