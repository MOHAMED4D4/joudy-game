'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Trophy, Lock, Check, Coins, KeyRound, Heart, ArrowRight } from 'lucide-react';
import { loadWorldSave, saveWorld, useWorldSave } from '@/lib/joudyWorld';
import type { JoudyGameProgress } from '@/lib/storage';

type Achievement = { id: string; title: string; detail: string; icon: string; unlocked: boolean; tier: string };
type RewardsPage = 'shop' | 'awards';
const MAX_EXTRA_HEARTS = 3;

export default function RewardsHub({ progress, page, onBack }: { progress: JoudyGameProgress; page: RewardsPage; onBack: () => void }) {
  const save = useWorldSave();
  const [notice, setNotice] = useState('');
  const achievements = useMemo<Achievement[]>(() => {
    const completed = Object.keys(progress.completedLevels).length;
    const chocolates = save.totalChocolates ?? 0;
    const score = save.totalScore ?? 0;
    const perfect = save.perfectRuns ?? 0;
    const defeated = save.totalBosses ?? 0;
    const stars = Object.values(progress.completedLevels).reduce((sum, record) => sum + record.stars, 0);
    const threeStarLevels = Object.values(progress.completedLevels).filter((record) => record.stars === 3).length;
    const highScores = Object.values(progress.completedLevels).filter((record) => record.bestScore >= 1000).length;
    const defs: Omit<Achievement, 'unlocked'>[] = [
      {id:'levels-1',title:'أول خطوة',detail:'أكمل أول مرحلة',icon:'👟',tier:'البدايات'},
      {id:'choco-25',title:'حلوى البداية',detail:'اجمع 25 قطعة شوكولاتة',icon:'🍫',tier:'البدايات'},
      {id:'score-5k',title:'جامع النقاط',detail:'حقق 5,000 نقطة إجمالية',icon:'⭐',tier:'البدايات'},
      {id:'levels-5',title:'مغامر ناشئ',detail:'أكمل 5 مراحل',icon:'🧭',tier:'التقدم'},
      {id:'choco-100',title:'عاشق الشوكولاتة',detail:'اجمع 100 قطعة شوكولاتة',icon:'🍬',tier:'التقدم'},
      {id:'stars-10',title:'عين على النجوم',detail:'اجمع 10 نجوم مراحل',icon:'🌟',tier:'التقدم'},
      {id:'score-25k',title:'صياد النقاط',detail:'حقق 25,000 نقطة إجمالية',icon:'💫',tier:'التقدم'},
      {id:'levels-10',title:'رحّالة',detail:'أكمل 10 مراحل',icon:'🗺️',tier:'التقدم'},
      {id:'perfect-1',title:'قلب من حديد',detail:'أكمل مرحلة دون أي اصطدام',icon:'❤️',tier:'المهارة'},
      {id:'three-star-3',title:'ثلاث نجوم',detail:'احصل على 3 نجوم في 3 مراحل',icon:'🌠',tier:'المهارة'},
      {id:'choco-300',title:'كنز الحلوى',detail:'اجمع 300 قطعة شوكولاتة',icon:'🍭',tier:'المهارة'},
      {id:'boss-1',title:'مواجهة الزعيم',detail:'اهزم أول زعيم',icon:'⚔️',tier:'المهارة'},
      {id:'levels-15',title:'حامي المدينة',detail:'أكمل الفصل الأول حتى المرحلة 15',icon:'🛡️',tier:'المهارة'},
      {id:'bosses-3',title:'صياد الزعماء',detail:'اهزم 3 زعماء',icon:'👑',tier:'المهارة'},
      {id:'score-100k',title:'أسطورة النقاط',detail:'حقق 100,000 نقطة إجمالية',icon:'🏅',tier:'الخبراء'},
      {id:'perfect-5',title:'مراوغ أسطوري',detail:'أكمل 5 مراحل دون اصطدام',icon:'💎',tier:'الخبراء'},
      {id:'stars-30',title:'جامع النجوم',detail:'اجمع 30 نجمة مراحل',icon:'🌌',tier:'الخبراء'},
      {id:'three-star-10',title:'لا يخطئ',detail:'احصل على 3 نجوم في 10 مراحل',icon:'🎯',tier:'الخبراء'},
      {id:'choco-750',title:'مصنع الشوكولاتة',detail:'اجمع 750 قطعة شوكولاتة',icon:'🍩',tier:'الخبراء'},
      {id:'levels-20',title:'سيد المغامرة',detail:'أكمل 20 مرحلة',icon:'🧗',tier:'الخبراء'},
      {id:'highscore-5',title:'صاحب الأرقام',detail:'حقق 1,000 نقطة أو أكثر في 5 مراحل مختلفة',icon:'📈',tier:'الخبراء'},
      {id:'bosses-5',title:'كابوس الزعماء',detail:'اهزم 5 زعماء',icon:'🐉',tier:'الخبراء'},
      {id:'perfect-10',title:'لم تُمس',detail:'أكمل 10 مراحل دون اصطدام',icon:'🪽',tier:'أسطوري'},
      {id:'score-250k',title:'مليون؟ ليس بعد!',detail:'حقق 250,000 نقطة إجمالية',icon:'🚀',tier:'أسطوري'},
      {id:'stars-60',title:'سماء مرصعة',detail:'اجمع 60 نجمة مراحل',icon:'🌃',tier:'أسطوري'},
      {id:'three-star-20',title:'الكمال المطلق',detail:'احصل على 3 نجوم في 20 مرحلة',icon:'🏆',tier:'أسطوري'},
      {id:'choco-1500',title:'إمبراطورية الحلوى',detail:'اجمع 1,500 قطعة شوكولاتة',icon:'🍬',tier:'أسطوري'},
      {id:'levels-25',title:'أسطورة العالم',detail:'أكمل 25 مرحلة',icon:'🌍',tier:'أسطوري'},
      {id:'bosses-6',title:'قاهر العمالقة',detail:'اهزم الزعماء الستة',icon:'👹',tier:'أسطوري'},
      {id:'all-stars',title:'كل نجمة في مكانها',detail:'اجمع 90 نجمة من كل المراحل',icon:'✨',tier:'أسطوري'},
      {id:'final',title:'أسطورة جودي',detail:'أكمل المستوى 30',icon:'👑',tier:'أسطوري'},
      {id:'score-500k',title:'الرقم المستحيل',detail:'حقق 500,000 نقطة إجمالية',icon:'💠',tier:'أسطوري'},
    ];
    const unlock: Record<string, boolean> = {
      'levels-1':completed>=1,'choco-25':chocolates>=25,'score-5k':score>=5000,
      'levels-5':completed>=5,'choco-100':chocolates>=100,'stars-10':stars>=10,'score-25k':score>=25000,'levels-10':completed>=10,
      'perfect-1':perfect>=1,'three-star-3':threeStarLevels>=3,'choco-300':chocolates>=300,'boss-1':defeated>=1,'levels-15':Boolean(progress.completedLevels[15]),
      'bosses-3':defeated>=3,'score-100k':score>=100000,'perfect-5':perfect>=5,'stars-30':stars>=30,'three-star-10':threeStarLevels>=10,
      'choco-750':chocolates>=750,'levels-20':completed>=20,'highscore-5':highScores>=5,'bosses-5':defeated>=5,'perfect-10':perfect>=10,
      'score-250k':score>=250000,'stars-60':stars>=60,'three-star-20':threeStarLevels>=20,'choco-1500':chocolates>=1500,
      'levels-25':completed>=25,'bosses-6':defeated>=6,'all-stars':stars>=90,'final':Boolean(progress.completedLevels[30]),'score-500k':score>=500000,
    };
    return defs.map((item) => ({...item,unlocked:Boolean(unlock[item.id])}));
  }, [progress.completedLevels, save.totalChocolates, save.totalScore, save.perfectRuns, save.totalBosses]);

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
      return { ...current, coins: current.coins - price, blueKeys: kind === 'key' ? current.blueKeys + 1 : current.blueKeys, extraHearts: kind === 'heart' ? current.extraHearts + 1 : current.extraHearts };
    });
    setNotice(purchased ? (kind === 'key' ? 'تم شراء المفتاح الأزرق وإضافته للمخزون!' : 'تم شراء قلب إضافي! سيظهر بجانب القلوب الأساسية في المحاولة القادمة.') : 'تعذر إتمام الشراء؛ راجع رصيدك.');
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const grouped = ['البدايات','التقدم','المهارة','الخبراء','أسطوري'];
  const isShop = page === 'shop';
  return <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#101b2b]/95 p-4 text-slate-100 shadow-xl sm:p-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl border ${isShop?'border-cyan-200/20 bg-cyan-300/10 text-cyan-200':'border-amber-200/20 bg-amber-300/10 text-amber-200'}`}>{isShop?<ShoppingBag className="h-6 w-6"/>:<Trophy className="h-6 w-6"/>}</div>
        <div><p className="text-[10px] font-black tracking-[.2em] text-cyan-200">JOUDY · {isShop?'SHOP':'ACHIEVEMENTS'}</p><h2 className="text-2xl font-black text-white">{isShop?'المتجر':'الإنجازات'}</h2><p className="text-xs text-slate-400">{isShop?'مشترياتك ومخزونك':'مرتبة من الأسهل للأصعب'}</p></div>
      </div>
      <div className="flex items-center gap-3">
        {!isShop && <span className="rounded-xl border border-amber-200/20 bg-amber-300/10 px-3 py-2 text-xs font-black text-amber-100">{unlockedCount} / {achievements.length} مكتمل</span>}
        <div className="flex items-center gap-2 rounded-xl border border-amber-200/20 bg-amber-300/10 px-3 py-2 text-sm font-black text-amber-100"><Coins className="h-4 w-4"/>{save.coins.toLocaleString('ar-EG')}</div>
      </div>
    </div>
    <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10"><ArrowRight className="h-4 w-4"/> رجوع للخريطة</button>
    {isShop ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-2xl border border-blue-200/20 bg-gradient-to-br from-blue-950/70 to-slate-900 p-5"><div className="mb-3 flex items-center justify-between"><KeyRound className="h-8 w-8 text-sky-300"/><span className="text-3xl">🔑</span></div><h3 className="font-black text-white">المفتاح الأزرق</h3><p className="mt-2 min-h-10 text-xs leading-6 text-slate-300">مفتاح إضافي يُضاف إلى مخزونك لاستخدامه داخل اللعبة.</p><p className="my-4 text-sm font-black text-amber-200">350 عملة</p><button onClick={()=>buy('key')} className="w-full rounded-xl bg-gradient-to-l from-sky-500 to-blue-700 px-4 py-3 text-sm font-black text-white shadow-lg">شراء مفتاح</button><p className="mt-3 text-center text-xs text-slate-400">في المخزون: {save.blueKeys}</p></div>
      <div className="rounded-2xl border border-sky-200/25 bg-gradient-to-br from-indigo-950/80 via-blue-950/70 to-slate-900 p-5"><div className="mb-3 flex items-center justify-between"><Heart className="h-8 w-8 fill-sky-400 text-cyan-100 drop-shadow-[0_0_10px_rgba(56,189,248,.65)]"/><span className="text-3xl">💠</span></div><h3 className="font-black text-white">قلب إضافي</h3><p className="mt-2 min-h-10 text-xs leading-6 text-slate-300">قلب احتياطي أزرق يظهر بجانب القلوب الأساسية. تستخدم حتى 3 قلوب إضافية في كل محاولة، والباقي يظل في المخزون.</p><p className="my-4 text-sm font-black text-amber-200">300 عملة</p><button onClick={()=>buy('heart')} className="w-full rounded-xl bg-gradient-to-l from-cyan-500 to-blue-700 px-4 py-3 text-sm font-black text-white shadow-lg">شراء قلب إضافي</button><div className="mt-3 flex items-center justify-center gap-1.5">{Array.from({length:MAX_EXTRA_HEARTS},(_,i)=><Heart key={i} className={`h-5 w-5 ${i<Math.min(MAX_EXTRA_HEARTS,save.extraHearts)?'fill-sky-400 text-cyan-100':'fill-slate-700 text-slate-500'}`}/>)}</div><p className="mt-1 text-center text-xs text-slate-400">في المخزون: {save.extraHearts} قلب</p></div>
    </div> : <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] text-slate-400">إجمالي الإنجازات</p><p className="mt-1 text-xl font-black text-white">{achievements.length}</p></div><div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] text-slate-400">المكتملة</p><p className="mt-1 text-xl font-black text-emerald-300">{unlockedCount}</p></div><div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] text-slate-400">المتبقية</p><p className="mt-1 text-xl font-black text-amber-200">{achievements.length-unlockedCount}</p></div><div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] text-slate-400">نسبة الإنجاز</p><p className="mt-1 text-xl font-black text-cyan-200">{Math.round(unlockedCount/achievements.length*100)}%</p></div></div>
      {grouped.map((tier,index)=><div key={tier}><div className="mb-3 flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-300/10 text-xs font-black text-amber-200">{index+1}</span><h3 className="text-sm font-black text-white">{tier}</h3><span className="h-px flex-1 bg-white/10"/></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{achievements.filter(a=>a.tier===tier).map((a,i)=><motion.div key={a.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.2,delay:Math.min(i*.025,.15)}} className={`relative flex min-h-36 flex-col items-center justify-center overflow-hidden rounded-xl border p-3 text-center ${a.unlocked?'border-amber-200/30 bg-gradient-to-br from-amber-300/15 to-orange-500/5':'border-white/10 bg-slate-950/55'}`}><div className={`mb-2 grid h-11 w-11 place-items-center rounded-xl text-2xl ${a.unlocked?'border border-amber-200/20 bg-amber-300/10':'border border-white/5 bg-black/50 grayscale'}`}>{a.unlocked?a.icon:'🔒'}</div><h4 className={`text-[11px] font-black leading-5 ${a.unlocked?'text-amber-100':'text-slate-300'}`}>{a.title}</h4><p className="mt-1 text-[10px] leading-4 text-slate-400">{a.detail}</p><span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black ${a.unlocked?'bg-emerald-400/10 text-emerald-200':'bg-black/30 text-slate-500'}`}>{a.unlocked?<><Check className="h-3 w-3"/> مكتمل</>:<><Lock className="h-3 w-3"/> مقفول</>}</span></motion.div>)}</div></div>)}
    </div>}
    {notice && <p role="status" className="mt-4 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center text-xs font-bold text-cyan-100">{notice}</p>}
  </section>;
}
