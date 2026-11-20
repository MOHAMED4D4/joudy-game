'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Heart, Play, ShieldCheck, Star, Trophy, Zap } from 'lucide-react';

interface CharacterSelectScreenProps {
  realImageSrc: string;
  onStartAdventure: () => void;
}

const scoring = [
  { icon: '🐈', name: 'جمع القطط', points: '+20 نقطة' },
  { icon: '🌹', name: 'جمع الورود', points: '+15 نقطة' },
  { icon: '🍫', name: 'جمع الشوكولاتة', points: '+10 نقاط' },
  { icon: '🧲', name: 'المغناطيس', points: 'جذب العناصر' },
  { icon: '⚡', name: 'تجنب العوائق', points: 'حافظ على القلوب' },
];

export default function CharacterSelectScreen({ realImageSrc, onStartAdventure }: CharacterSelectScreenProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45 }}
      dir="rtl"
      className="arcade-hub relative mx-auto w-full max-w-6xl px-4 py-7 sm:px-7 sm:py-10"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-[2rem]" aria-hidden="true">
        <div className="hub-orb hub-orb-one" />
        <div className="hub-orb hub-orb-two" />
        <div className="hub-grid" />
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.22em] text-cyan-300">
            <span className="h-px w-7 bg-cyan-300" /> ARCADE / 30 STAGES
          </p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">مغامرة التجميع السريعة</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            اجمع العناصر، تفادَ العوائق، وحقق أعلى نتيجة. افتح المراحل التالية واصنع سجلّك الخاص.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-sm text-slate-200 backdrop-blur">
          <ShieldCheck className="h-4 w-4 text-emerald-300" /> تقدم محفوظ
        </div>
      </div>

      <div className="grid overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101b2b]/90 shadow-[0_30px_90px_rgba(0,0,0,.4)] lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative min-h-[280px] overflow-hidden bg-[radial-gradient(circle_at_50%_40%,#26445c_0%,#17283b_48%,#101a2a_100%)] sm:min-h-[390px]">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)', backgroundSize: '34px 34px' }} />
          <div className="absolute left-8 top-8 h-28 w-28 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute bottom-8 right-8 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" />
          <Image src="/images/joudy-original-transparent.png" alt="جودي" fill priority sizes="(max-width: 1024px) 100vw, 45vw" className="relative z-10 object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,.45)]" />
          <div className="absolute bottom-5 right-5 z-20 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs font-semibold text-white backdrop-blur">الشخصية الرئيسية</div>
        </div>

        <div className="p-5 sm:p-8 lg:p-9">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-widest text-cyan-300">نمط اللعب</p>
              <h2 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">تحدي الأركيد</h2>
            </div>
            <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200"><Zap className="h-6 w-6" /></div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><p className="text-[11px] text-slate-400">المراحل</p><p className="mt-1 text-2xl font-black text-white">30</p></div>
            <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><p className="text-[11px] text-slate-400">نظام اللعب</p><p className="mt-1 text-sm font-bold text-white">تحدي</p></div>
            <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><p className="text-[11px] text-slate-400">التقدم</p><p className="mt-1 text-sm font-bold text-emerald-300">تدريجي</p></div>
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">نظام النقاط والتحدي</h3>
              <span className="text-[11px] text-slate-400">داخل كل مرحلة</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {scoring.map((item) => (
                <div key={item.name} className="rounded-xl border border-white/10 bg-[#0b1421]/70 p-3">
                  <div className="flex items-center gap-2"><span className="text-xl">{item.icon}</span><span className="text-xs font-bold text-slate-200">{item.name}</span></div>
                  <p className="mt-2 text-[11px] font-bold text-cyan-300">{item.points}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs leading-6 text-slate-400"><Heart className="h-3.5 w-3.5 shrink-0 text-rose-400" /> لديك عدد محدود من القلوب؛ الاصطدام بالعوائق يقلل فرصتك في إكمال المرحلة.</p>
          </div>
          <motion.button type="button" whileHover={{ scale: 1.015, y: -2 }} whileTap={{ scale: .98 }} onClick={onStartAdventure} className="mt-7 flex w-full items-center justify-between rounded-2xl bg-gradient-to-l from-cyan-400 to-blue-500 px-5 py-4 text-right text-base font-black text-[#071321] shadow-[0_12px_35px_rgba(34,211,238,.2)] transition">
            <span className="flex items-center gap-3"><Play className="h-5 w-5 fill-current" /> ابدأ اللعب</span>
            <span className="text-xl" aria-hidden="true">←</span>
          </motion.button>
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500"><Trophy className="h-3.5 w-3.5" /><Star className="h-3 w-3" /> اجمع النقاط وارفع رقمك القياسي</div>
        </div>
      </div>
    </motion.section>
  );
}
