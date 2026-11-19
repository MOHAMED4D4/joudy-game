'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Award, ShoppingBag, Trophy, Lock, Check, Coins, KeyRound, Heart } from 'lucide-react';
import { loadWorldSave, saveWorld, useWorldSave } from '@/lib/joudyWorld';
import type { JoudyGameProgress } from '@/lib/storage';

type Achievement = { id: string; title: string; detail: string; icon: string; unlocked: boolean };

export default function RewardsHub({ progress }: { progress: JoudyGameProgress }) {
  const save = useWorldSave();
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState<'shop' | 'awards'>('shop');
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

  const buy = (kind: 'key' | 'heart') => {
    const price = kind === 'key' ? 350 : 300;
    const latest = loadWorldSave();
    if (latest.coins < price) {
      setNotice(`مش معاك عملات كفاية — ناقصك ${(price - latest.coins).toLocaleString('ar-EG')} عملة.`);
      return;
    }
    saveWorld((current) => ({
      ...current,
      coins: current.coins - price,
      blueKeys: kind === 'key' ? current.blueKeys + 1 : current.blueKeys,
      extraHearts: kind === 'heart' ? (current.extraHearts ?? 0) + 1 : current.extraHearts ?? 0,
    }));
    setNotice(kind === 'key' ? 'تم شراء مفتاح أزرق وإضافته للمخزون!' : 'تم شراء قلب إضافي وإضافته للمخزون!');
  };

  return <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101b2b]/95 p-4 shadow-xl sm:p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-[10px] font-black tracking-[.2em] text-cyan-200">REWARDS CENTER</p><h2 className="mt-1 text-xl font-black text-white">المتجر والإنجازات</h2></div>
      <div className="flex items-center gap-2 rounded-xl border border-amber-200/20 bg-amber-300/10 px-3 py-2 text-sm font-black text-amber-100"><Coins className="h-4 w-4"/>{save.coins.toLocaleString('ar-EG')}</div>
    </div>
    <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-black/20 p-1">
      <button onClick={()=>{setTab('shop');setNotice('');}} className={`rounded-lg px-3 py-2.5 text-sm font-black ${tab==='shop'?'bg-cyan-300 text-slate-950':'text-slate-300'}`}><ShoppingBag className="ml-1 inline h-4 w-4"/> المتجر</button>
      <button onClick={()=>{setTab('awards');setNotice('');}} className={`rounded-lg px-3 py-2.5 text-sm font-black ${tab==='awards'?'bg-amber-300 text-slate-950':'text-slate-300'}`}><Award className="ml-1 inline h-4 w-4"/> الإنجازات ({achievements.filter(a=>a.unlocked).length}/{achievements.length})</button>
    </div>
    {tab==='shop' ? <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-blue-200/20 bg-gradient-to-br from-blue-950/70 to-slate-900 p-4"><div className="mb-3 flex items-center justify-between"><KeyRound className="h-8 w-8 text-sky-300"/><span className="text-2xl">🔑</span></div><h3 className="font-black text-white">المفتاح الأزرق</h3><p className="mt-1 text-xs text-slate-300">مفتاح إضافي يُضاف إلى مخزونك لاستخدامه داخل اللعبة.</p><p className="my-3 text-sm font-black text-amber-200">350 عملة</p><button onClick={()=>buy('key')} className="w-full rounded-xl bg-gradient-to-l from-sky-500 to-blue-700 px-4 py-3 text-sm font-black text-white shadow-lg">شراء مفتاح</button><p className="mt-2 text-center text-xs text-slate-400">في المخزون: {save.blueKeys}</p></div>
      <div className="rounded-2xl border border-rose-200/20 bg-gradient-to-br from-rose-950/70 to-slate-900 p-4"><div className="mb-3 flex items-center justify-between"><Heart className="h-8 w-8 fill-rose-400 text-rose-300"/><span className="text-2xl">❤️</span></div><h3 className="font-black text-white">قلب إضافي</h3><p className="mt-1 text-xs text-slate-300">قلب إضافي يُضاف إلى مخزونك لاستخدامه في محاولات اللعب.</p><p className="my-3 text-sm font-black text-amber-200">300 عملة</p><button onClick={()=>buy('heart')} className="w-full rounded-xl bg-gradient-to-l from-rose-500 to-pink-700 px-4 py-3 text-sm font-black text-white shadow-lg">شراء قلب</button><p className="mt-2 text-center text-xs text-slate-400">في المخزون: {save.extraHearts ?? 0}</p></div>
    </div> : <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {achievements.map((a)=> <motion.div key={a.id} initial={{opacity:0,y:8}} animate={a.unlocked?{opacity:1,y:0,scale:[1,1.035,1]}:{opacity:1,y:0,scale:1}} transition={{duration:.45}} className={`relative overflow-hidden rounded-2xl border p-3 transition ${a.unlocked?'border-amber-200/35 bg-gradient-to-br from-amber-300/15 to-fuchsia-400/10':'border-white/10 bg-black/35 grayscale'}`}>
        <div className="flex items-center gap-3"><div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl ${a.unlocked?'bg-amber-300/15 shadow-[0_0_22px_rgba(251,191,36,.2)]':'bg-black/70 brightness-0'}`}>{a.unlocked?a.icon:'🏆'}</div><div className="min-w-0 flex-1"><h3 className={`text-sm font-black ${a.unlocked?'text-amber-100':'text-slate-500'}`}>{a.title}</h3><p className="mt-1 text-[11px] leading-5 text-slate-400">{a.detail}</p></div>{a.unlocked?<Check className="h-5 w-5 text-emerald-300"/>:<Lock className="h-4 w-4 text-slate-600"/>}</div>
      </motion.div>)}
    </div>}
    {notice && <p role="status" className="mt-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center text-xs font-bold text-cyan-100">{notice}</p>}
  </section>;
}
