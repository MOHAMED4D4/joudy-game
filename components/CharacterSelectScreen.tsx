'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Crown, Heart, Play, Sparkles, Star } from 'lucide-react';

interface CharacterSelectScreenProps {
  realImageSrc: string;
  onStartAdventure: () => void;
}

export default function CharacterSelectScreen({ realImageSrc, onStartAdventure }: CharacterSelectScreenProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.4 }}
      dir="rtl"
      className="relative mx-auto flex min-h-[100dvh] w-full max-w-6xl items-center px-4 py-8 sm:px-7"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 top-8 h-72 w-72 rounded-full bg-rose-300/25 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-amber-200/25 blur-3xl" />
        <div className="absolute inset-0 opacity-[.16]" style={{ backgroundImage: 'radial-gradient(#9b6a70 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
      </div>

      <div className="relative w-full overflow-hidden rounded-[2rem] border border-rose-200/80 bg-[#fffaf7]/95 shadow-[0_28px_90px_rgba(93,47,64,.18)] backdrop-blur">
        <div className="grid min-h-[620px] lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#f6e8e8] via-[#f9f1e8] to-[#e6eee7] p-6 sm:p-10">
            <div className="absolute h-[78%] w-[78%] rounded-full border border-white/70 bg-white/25 shadow-[0_0_90px_rgba(255,255,255,.8)]" />
            <div className="absolute bottom-8 h-8 w-48 rounded-full bg-[#72534a]/15 blur-xl" />
            <div className="relative h-[min(76vw,520px)] w-full max-w-[490px]">
              <Image src="/images/joudy-original-transparent.png" alt="جودي" fill priority sizes="(max-width: 1024px) 85vw, 490px" className="object-contain drop-shadow-[0_24px_24px_rgba(72,49,43,.2)]" />
            </div>
            <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-black text-rose-800 shadow-sm">
              <Crown className="h-4 w-4 text-amber-600" /> عالم جودي
            </div>
            <div className="absolute bottom-5 left-5 rounded-2xl border border-white/80 bg-white/75 p-3 shadow-md backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-black text-rose-900"><Heart className="h-4 w-4 fill-rose-400 text-rose-500" /> مغامرة مليئة بالمفاجآت</div>
            </div>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700">
              <Sparkles className="h-4 w-4" /> أهلاً بكِ في عالم جودي
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-[#3d2532] sm:text-6xl" style={{ fontFamily: 'var(--font-display)' }}>
              مغامرة جودي <span className="text-rose-600">السحرية</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#765664] sm:text-lg">
              انطلقي مع جودي في مغامرة مليئة بالتحديات والجوائز. اجمعي القطط والورود والشوكولاتة، وتجاوزي العوائق في ثلاثين مرحلة متدرجة.
            </p>
            <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
              {[['30','مرحلة'],['🎁','مكافآت'],['⭐','تحديات']].map(([value,label]) => (
                <div key={label} className="rounded-2xl border border-rose-100 bg-white/80 px-2 py-4 text-center shadow-sm">
                  <div className="text-2xl font-black text-rose-700">{value}</div>
                  <div className="mt-1 text-xs font-bold text-[#8c6a78]">{label}</div>
                </div>
              ))}
            </div>
            <button type="button" onClick={onStartAdventure} className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-rose-600 to-fuchsia-700 px-6 py-4 text-lg font-black text-white shadow-[0_14px_30px_rgba(190,45,100,.25)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(190,45,100,.32)] active:translate-y-0">
              <Play className="h-5 w-5 fill-current" /> ابدأ المغامرة
            </button>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-[#987d88]"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" /> تقدمك محفوظ ويمكنك متابعة اللعب لاحقاً</div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
