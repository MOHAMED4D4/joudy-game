'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Trophy, Lock, Check, Coins, KeyRound, Heart, ArrowRight } from 'lucide-react';
import { loadWorldSave, saveWorld, useWorldSave } from '@/lib/joudyWorld';
import type { JoudyGameProgress } from '@/lib/storage';

type Achievement = { id: string; title: string; detail: string; icon: string; unlocked: boolean };
type Section = 'home' | 'shop' | 'awards';
const MAX_EXTRA_HEARTS = 3;

export default function RewardsHub({ progress }: { progress: JoudyGameProgress }) {
  const save = useWorldSave();
  const [notice, setNotice] = useState('');
  const [section, setSection] = useState<Section>('home');
  const achievements = useMemo<Achievement[]>(() => {
    const completed = Object.keys(progress.completedLevels).length;
    const chocolates = save.totalChocolates ?? 0;
    const score = save.totalScore ?? 0;
    const boss15 = Boolean(progress.completedLevels[15]);
    const finalBoss = Boolean(progress.completedLevels[30]);
    const perfect = save.perfectRuns ?? 0;
    const defeated = save.totalBosses ?? 0;
    return [
      { id:'choco-1', title:'بداية حلوة', detail:'اجمع 25 قطعة شوكولاتة', icon:'🍫', unlocked: chocolates >= 25 },
      { id:'choco-2', title:'عاشق الشوكولاتة', detail:'اجمع 100 قطعة شوكولاتة', icon:'🍬', unlocked: chocolates >= 100 },
      { id:'choco-3', title:'كنز الحلوى', detail:'اجمع 300 قطعة شوكولاتة', icon:'🍭', unlocked: chocolates >= 300 },
      { id:'levels-5', title:'مغامر ناشئ', detail:'أكمل 5 مراحل', icon:'🧭', unlocked: completed >= 5 },
      { id:'levels-15', title:'حامي المدينة', detail:'أكمل الفصل الأول', icon:'🛡️', unlocked: boss15 },
      { id:'boss-15', title:'قاتل الزعيم', detail:'اهزم زعيم المستوى 15', icon:'👑', unlocked: boss15 },
      { id:'perfect-1', title:'قلب من حديد', detail:'أكمل مرحلة دون اصطدام', icon:'❤️', unlocked: perfect >= 1 },
      { id:'perfect-5', title:'مراوغ أسطوري', detail:'أكمل 5 مراحل دون اصطدام', icon:'💎', unlocked: perfect >= 5 },
      { id:'score-10k', title:'جامع النجوم', detail:'اجمع 10,000 نقطة إجمالية', icon:'⭐', unlocked: score >= 10000 },
      { id:'score-100k', title:'أسطورة النقاط', detail:'اجمع 100,000 نقطة إجمالية', icon:'🌟', unlocked: score >= 100000 },
      { id:'bosses-3', title:'صياد الزعماء', detail:'اهزم 3 زعماء', icon:'⚔️', unlocked: defeated >= 3 },
      { id:'final', title:'أسطورة جودي', detail:'أكمل المستوى 30', icon:'🏆', unlocked: finalBoss },
    ];
  }, [progress.completedLevels, save.totalChocolates, save.totalScore, save.perfectRuns, save.totalBosses]);

  const openSection = (next: Section) => { setNotice(''); setSection(next); };
  const buy = (kind: 'key' | 'heart') => {
    const price = kind === 'key' ? 350 : 300;
    const latest = loadWorldSave();
    if (latest.coins < price) {
      setNotice(`مش معاك عملات كفاية — ناقصك ${(price - latest.coins).toLocaleString('ar-EG')} عملة.`);
      return;
    }
    let purchased = false;
    saveWorld((current) => {
      if (current.coins < price) return current;
      purchased = true;
      return {
        ...current,
        coins: current.coins - price,
        blueKeys: kind === 'key' ? current.blueKeys + 1 : current.blueKeys,
        extraHearts: kind === 'heart' ? current.extraHearts + 1 : current.extraHearts,
      };
    });
    setNotice(purchased ? (kind === 'key' ? 'تم شراء المفتاح الأزرق وإضافته للمخزون!' : 'تم شراء قلب إضافي! هيظهر بلونه المميز في شاشة اللعب.') : 'تعذر إتمام الشراء؛ راجع رصيدك.');
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const heading = section === 'shop' ? 'المتجر' : section === 'awards' ? 'الإنجازات' : 'مركز المكافآت';

  return <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101b2b]/95 p-4 shadow-xl sm:p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-[10px] font-black tracking-[.2em] text-cyan-200">REWARDS CENTER</p><h2 className="mt-1 text-xl font-black text-white">{heading}</h2></div>
      <div className="flex items-center gap-2 rounded-xl border border-amber-200/20 bg-amber-300/10 px-3 py-2 text-sm font-black text-amber-100"><Coins className="h-4 w-4"/>{save.coins.toLocaleString('ar-EG')}</div>
    </div>

    {section === 'home' && <div className="grid gap-3 sm:grid-cols-2">
      <motion.button type="button" whileHover={{ y: -3 }} whileTap={{ scale: .98 }} onClick={() => openSection('shop')} className="group relative min-h-44 overflow-hidden rounded-2xl border border-cyan-200/25 bg-gradient-to-br from-cyan-950 via-blue-950 to-slate-950 p-5 text-right shadow-lg">
        <div className="absolute -left-5 -top-7 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl"/><div className="relative flex h-full flex-col justify-between gap-5"><div className="flex items-center justify-between"><span className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-200"><ShoppingBag className="h-8 w-8"/></span><span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">تسوق الآن</span></div><div><h3 className="text-2xl font-black text-white">المتجر</h3><p className="mt-1 text-sm text-cyan-100/70">اشتري مفاتيح وقلوب إضافية وساعد جودي في المغامرة</p></div></div>
      </motion.button>
      <motion.button type="button" whileHover={{ y: -3 }} whileTap={{ scale: .98 }} onClick={() => openSection('awards')} className="group relative min-h-44 overflow-hidden rounded-2xl border border-amber-200/25 bg-gradient-to-br from-amber-950 via-orange-950 to-slate-950 p-5 text-right shadow-lg">
        <div className="absolute -left-5 -top-7 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl"/><div className="relative flex h-full flex-col justify-between gap-5"><div className="flex items-center justify-between"><span className="grid h-14 w-14 place-items-center rounded-2xl border border-amber-200/20 bg-amber-300/10 text-amber-200"><Trophy className="h-8 w-8"/></span><span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-100">{unlockedCount} / {achievements.length} مكتمل</span></div><div><h3 className="text-2xl font-black text-white">الإنجازات</h3><p className="mt-1 text-sm text-amber-100/70">اجمع الأوسمة وافتح إنجازات جديدة مع تقدمك</p></div></div>
      </motion.button>
    </div>}

    {section !== 'home' && <>
      <button type="button" onClick={() => openSection('home')} className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"><ArrowRight className="h-4 w-4"/> رجوع للأقسام</button>
      {section === 'shop' ? <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-200/20 bg-gradient-to-br from-blue-950/70 to-slate-900 p-4"><div className="mb-3 flex items-center justify-between"><KeyRound className="h-8 w-8 text-sky-300"/><span className="text-2xl">🔑</span></div><h3 className="font-black text-white">المفتاح الأزرق</h3><p className="mt-1 text-xs text-slate-300">مفتاح إضافي يُضاف إلى مخزونك لاستخدامه داخل اللعبة.</p><p className="my-3 text-sm font-black text-amber-200">350 عملة</p><button onClick={()=>buy('key')} className="w-full rounded-xl bg-gradient-to-l from-sky-500 to-blue-700 px-4 py-3 text-sm font-black text-white shadow-lg">شراء مفتاح</button><p className="mt-2 text-center text-xs text-slate-400">في المخزون: {save.blueKeys}</p></div>
        <div className="rounded-2xl border border-sky-200/25 bg-gradient-to-br from-indigo-950/80 via-blue-950/70 to-slate-900 p-4"><div className="mb-3 flex items-center justify-between"><Heart className="h-8 w-8 fill-sky-400 text-cyan-100 drop-shadow-[0_0_10px_rgba(56,189,248,.65)]"/><span className="text-2xl">💠</span></div><h3 className="font-black text-white">قلب إضافي</h3><p className="mt-1 text-xs text-slate-300">قلب احتياطي بلون أزرق مميز يظهر بجانب القلوب الأساسية ويُستهلك بعد نفادها. تقدر تخزن أي عدد، لكن تستخدم 3 قلوب إضافية كحد أقصى في المحاولة الواحدة.</p><p className="my-3 text-sm font-black text-amber-200">300 عملة</p><button onClick={()=>buy('heart')} className="w-full rounded-xl bg-gradient-to-l from-cyan-500 to-blue-700 px-4 py-3 text-sm font-black text-white shadow-lg">شراء قلب إضافي</button><div className="mt-3 flex items-center justify-center gap-1.5" aria-label={`المخزون: ${save.extraHearts} قلب إضافي`}>{Array.from({length: MAX_EXTRA_HEARTS}, (_, i)=><Heart key={i} className={`h-5 w-5 ${i < save.extraHearts ? 'fill-sky-400 text-cyan-100' : 'fill-slate-700 text-slate-500'}`}/>)}</div><p className="mt-1 text-center text-xs text-slate-400">في المخزون: {save.extraHearts} قلب</p><p className="mt-1 text-center text-[10px] text-cyan-200/70">المتاح للاستخدام في المحاولة: 3 قلوب إضافية كحد أقصى</p></div>
      </div> : <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {achievements.map((a)=> <motion.div key={a.id} initial={{opacity:0,y:8}} animate={a.unlocked?{opacity:1,y:0,scale:[1,1.025,1]}:{opacity:1,y:0,scale:1}} transition={{duration:.4}} className={`relative flex min-h-40 flex-col items-center justify-center overflow-hidden rounded-2xl border p-3 text-center transition sm:min-h-44 ${a.unlocked?'border-amber-200/35 bg-gradient-to-br from-amber-300/15 via-orange-400/10 to-fuchsia-400/10 shadow-[inset_0_0_25px_rgba(251,191,36,.05)]':'border-white/10 bg-slate-950/55 grayscale-[.65]'}`}>
          <div className={`mb-2 grid h-14 w-14 place-items-center rounded-2xl text-3xl ${a.unlocked?'border border-amber-200/20 bg-amber-300/10 shadow-[0_0_22px_rgba(251,191,36,.15)]':'border border-white/5 bg-black/50 brightness-50'}`}>{a.unlocked?a.icon:'🏆'}</div>
          <h3 className={`text-xs font-black leading-5 ${a.unlocked?'text-amber-100':'text-slate-400'}`}>{a.title}</h3><p className="mt-1 text-[10px] leading-4 text-slate-400">{a.detail}</p>
          <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black ${a.unlocked?'bg-emerald-400/10 text-emerald-200':'bg-black/30 text-slate-500'}`}>{a.unlocked?<><Check className="h-3 w-3"/> مكتمل</>:<><Lock className="h-3 w-3"/> مقفول</>}</div>
        </motion.div>)}
      </div>}
    </>}
    {notice && <p role="status" className="mt-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center text-xs font-bold text-cyan-100">{notice}</p>}
  </section>;
}
