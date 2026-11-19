'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { ShoppingBag, Trophy, Lock, Check, Coins, KeyRound, Heart, ArrowRight, Shield, Magnet, Sparkles, Wind, type LucideIcon } from 'lucide-react';
import { loadWorldSave, saveWorld, useWorldSave } from '@/lib/joudyWorld';
import { soundEngine } from '@/lib/soundEffects';
import type { JoudyGameProgress } from '@/lib/storage';

type Achievement = { id: string; title: string; detail: string; icon: string; unlocked: boolean; tier: string; progress: number };
type WheelPrize = {
  label: string;
  kind: 'coins' | 'score' | 'key' | 'magnet' | 'heart' | 'shield';
  amount: number;
  icon: string;
};

const MEDAL_ART: Record<string, string> = {
  'البدايات': '/images/achievements/start.svg',
  'التقدم': '/images/achievements/progress.svg',
  'المهارة': '/images/achievements/skill.svg',
  'الخبراء': '/images/achievements/expert.svg',
  'أسطوري': '/images/achievements/legendary.svg',
};
const TIER_STYLES: Record<string, { border: string; glow: string; chip: string; text: string }> = {
  'البدايات': { border: 'border-rose-200/25', glow: 'from-rose-400/15 to-orange-300/5', chip: 'bg-rose-300/10 text-rose-100', text: 'text-rose-100' },
  'التقدم': { border: 'border-cyan-200/25', glow: 'from-cyan-300/15 to-blue-400/5', chip: 'bg-cyan-300/10 text-cyan-100', text: 'text-cyan-100' },
  'المهارة': { border: 'border-amber-200/25', glow: 'from-amber-300/15 to-orange-400/5', chip: 'bg-amber-300/10 text-amber-100', text: 'text-amber-100' },
  'الخبراء': { border: 'border-blue-200/25', glow: 'from-blue-300/15 to-indigo-400/5', chip: 'bg-blue-300/10 text-blue-100', text: 'text-blue-100' },
  'أسطوري': { border: 'border-violet-200/30', glow: 'from-violet-300/20 to-fuchsia-400/8', chip: 'bg-violet-300/10 text-violet-100', text: 'text-violet-100' },
};
type RewardsPage = 'shop' | 'awards' | 'wheel';
const MAX_EXTRA_HEARTS = 5;

export default function RewardsHub({ progress, page, onBack }: { progress: JoudyGameProgress; page: RewardsPage; onBack: () => void }) {
  const save = useWorldSave();
  const [notice, setNotice] = useState('');
  const [purchasePulse, setPurchasePulse] = useState(false);
  const [activeAchievement, setActiveAchievement] = useState<Achievement | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelRewardPending, setWheelRewardPending] = useState(false);
  const [wheelPrize, setWheelPrize] = useState<WheelPrize | null>(null);
  const [failedShopImages, setFailedShopImages] = useState<Record<string, boolean>>({});
  const achievements = useMemo<Achievement[]>(() => {
    const completed = Object.keys(progress.completedLevels).length;
    const chocolates = save.totalChocolates ?? 0;
    const score = save.totalScore ?? 0;
    const perfect = save.perfectRuns ?? 0;
    const defeated = save.totalBosses ?? 0;
    const stars = Object.values(progress.completedLevels).reduce((sum, record) => sum + record.stars, 0);
    const threeStarLevels = Object.values(progress.completedLevels).filter((record) => record.stars === 3).length;
    const highScores = Object.values(progress.completedLevels).filter((record) => record.bestScore >= 1800).length;
    const defs: Omit<Achievement, 'unlocked' | 'progress'>[] = [
      {id:'levels-1',title:'أول خطوة',detail:'أكمل أول مرحلة',icon:'👟',tier:'البدايات'},
      {id:'choco-25',title:'حلوى البداية',detail:'اجمع 50 قطعة شوكولاتة',icon:'🍫',tier:'البدايات'},
      {id:'score-5k',title:'جامع النقاط',detail:'حقق 10,000 نقطة إجمالية',icon:'⭐',tier:'البدايات'},
      {id:'levels-5',title:'مغامر ناشئ',detail:'أكمل 5 مراحل',icon:'🧭',tier:'التقدم'},
      {id:'choco-100',title:'عاشق الشوكولاتة',detail:'اجمع 200 قطعة شوكولاتة',icon:'🍬',tier:'التقدم'},
      {id:'stars-10',title:'عين على النجوم',detail:'اجمع 20 نجمة مراحل',icon:'🌟',tier:'التقدم'},
      {id:'score-25k',title:'صياد النقاط',detail:'حقق 50,000 نقطة إجمالية',icon:'💫',tier:'التقدم'},
      {id:'levels-10',title:'رحّالة',detail:'أكمل 10 مراحل',icon:'🗺️',tier:'التقدم'},
      {id:'perfect-1',title:'قلب من حديد',detail:'أكمل مرحلتين دون أي اصطدام',icon:'❤️',tier:'المهارة'},
      {id:'three-star-3',title:'ثلاث نجوم',detail:'احصل على 3 نجوم في 5 مراحل',icon:'🌠',tier:'المهارة'},
      {id:'choco-300',title:'كنز الحلوى',detail:'اجمع 600 قطعة شوكولاتة',icon:'🍭',tier:'المهارة'},
      {id:'boss-1',title:'مواجهة الزعيم',detail:'اهزم زعيمين',icon:'⚔️',tier:'المهارة'},
      {id:'levels-15',title:'حامي المدينة',detail:'أكمل الفصل الأول حتى المرحلة 15',icon:'🛡️',tier:'المهارة'},
      {id:'bosses-3',title:'صياد الزعماء',detail:'اهزم 4 زعماء',icon:'👑',tier:'المهارة'},
      {id:'score-100k',title:'أسطورة النقاط',detail:'حقق 200,000 نقطة إجمالية',icon:'🏅',tier:'الخبراء'},
      {id:'perfect-5',title:'مراوغ أسطوري',detail:'أكمل 8 مراحل دون اصطدام',icon:'💎',tier:'الخبراء'},
      {id:'stars-30',title:'جامع النجوم',detail:'اجمع 45 نجمة مراحل',icon:'🌌',tier:'الخبراء'},
      {id:'three-star-10',title:'لا يخطئ',detail:'احصل على 3 نجوم في 15 مرحلة',icon:'🎯',tier:'الخبراء'},
      {id:'choco-750',title:'مصنع الشوكولاتة',detail:'اجمع 1,500 قطعة شوكولاتة',icon:'🍩',tier:'الخبراء'},
      {id:'levels-20',title:'سيد المغامرة',detail:'أكمل 20 مرحلة',icon:'🧗',tier:'الخبراء'},
      {id:'highscore-5',title:'صاحب الأرقام',detail:'حقق 1,800 نقطة أو أكثر في 5 مراحل مختلفة',icon:'📈',tier:'الخبراء'},
      {id:'bosses-5',title:'كابوس الزعماء',detail:'اهزم 5 زعماء',icon:'🐉',tier:'الخبراء'},
      {id:'perfect-10',title:'لم تُمس',detail:'أكمل 15 مرحلة دون اصطدام',icon:'🪽',tier:'أسطوري'},
      {id:'score-250k',title:'مليون؟ ليس بعد!',detail:'حقق 500,000 نقطة إجمالية',icon:'🚀',tier:'أسطوري'},
      {id:'stars-60',title:'سماء مرصعة',detail:'اجمع 80 نجمة مراحل',icon:'🌃',tier:'أسطوري'},
      {id:'three-star-20',title:'الكمال المطلق',detail:'احصل على 3 نجوم في 25 مرحلة',icon:'🏆',tier:'أسطوري'},
      {id:'choco-1500',title:'إمبراطورية الحلوى',detail:'اجمع 3,000 قطعة شوكولاتة',icon:'🍬',tier:'أسطوري'},
      {id:'levels-25',title:'أسطورة العالم',detail:'أكمل 25 مرحلة',icon:'🌍',tier:'أسطوري'},
      {id:'bosses-6',title:'قاهر العمالقة',detail:'اهزم الزعماء الستة',icon:'👹',tier:'أسطوري'},
      {id:'all-stars',title:'كل نجمة في مكانها',detail:'اجمع 90 نجمة من كل المراحل',icon:'✨',tier:'أسطوري'},
      {id:'final',title:'أسطورة جودي',detail:'أكمل المستوى 30',icon:'👑',tier:'أسطوري'},
      {id:'score-500k',title:'الرقم المستحيل',detail:'حقق 1,000,000 نقطة إجمالية',icon:'💠',tier:'أسطوري'},
    ];
    const unlock: Record<string, boolean> = {
      'levels-1':completed>=1,'choco-25':chocolates>=50,'score-5k':score>=10000,
      'levels-5':completed>=5,'choco-100':chocolates>=200,'stars-10':stars>=20,'score-25k':score>=50000,'levels-10':completed>=10,
      'perfect-1':perfect>=2,'three-star-3':threeStarLevels>=5,'choco-300':chocolates>=600,'boss-1':defeated>=2,'levels-15':Boolean(progress.completedLevels[15]),
      'bosses-3':defeated>=4,'score-100k':score>=200000,'perfect-5':perfect>=8,'stars-30':stars>=45,'three-star-10':threeStarLevels>=15,
      'choco-750':chocolates>=1500,'levels-20':completed>=20,'highscore-5':highScores>=5,'bosses-5':defeated>=5,'perfect-10':perfect>=15,
      'score-250k':score>=500000,'stars-60':stars>=80,'three-star-20':threeStarLevels>=25,'choco-1500':chocolates>=3000,
      'levels-25':completed>=25,'bosses-6':defeated>=6,'all-stars':stars>=90,'final':Boolean(progress.completedLevels[30]),'score-500k':score>=1000000,
    };
    const progressValues: Record<string, number> = {
      'levels-1':completed/1,'choco-25':chocolates/50,'score-5k':score/10000,'levels-5':completed/5,'choco-100':chocolates/200,'stars-10':stars/20,'score-25k':score/50000,'levels-10':completed/10,
      'perfect-1':perfect/2,'three-star-3':threeStarLevels/5,'choco-300':chocolates/600,'boss-1':defeated/2,'levels-15':Number(Boolean(progress.completedLevels[15])),'bosses-3':defeated/4,
      'score-100k':score/200000,'perfect-5':perfect/8,'stars-30':stars/45,'three-star-10':threeStarLevels/15,'choco-750':chocolates/1500,'levels-20':completed/20,'highscore-5':highScores/5,'bosses-5':defeated/5,
      'perfect-10':perfect/15,'score-250k':score/500000,'stars-60':stars/80,'three-star-20':threeStarLevels/25,'choco-1500':chocolates/3000,'levels-25':completed/25,'bosses-6':defeated/6,'all-stars':stars/90,'final':Number(Boolean(progress.completedLevels[30])),'score-500k':score/1000000,
    };
    return defs.map((item) => ({...item,unlocked:Boolean(unlock[item.id]),progress:Math.max(0,Math.min(100,Math.round((progressValues[item.id] ?? 0)*100)))}));
  }, [progress.completedLevels, save.totalChocolates, save.totalScore, save.perfectRuns, save.totalBosses]);

  const buyScore = (coinAmount: number) => {
    const latest = loadWorldSave();
    if (latest.coins < coinAmount) {
      soundEngine.playLocked();
      setNotice(`مش معاك عملات كفاية — ناقصك ${(coinAmount - latest.coins).toLocaleString('ar-EG')} عملة.`);
      return;
    }
    let purchased = false;
    saveWorld((current) => {
      if (current.coins < coinAmount) return current;
      purchased = true;
      return { ...current, coins: current.coins - coinAmount, totalScore: current.totalScore + coinAmount * 2 };
    });
    if (purchased) { soundEngine.playPurchase(); setPurchasePulse(true); window.setTimeout(() => setPurchasePulse(false), 900); } else soundEngine.playLocked();
    setNotice(purchased ? `تم تحويل ${coinAmount.toLocaleString('ar-EG')} عملة إلى ${(coinAmount * 2).toLocaleString('ar-EG')} نقطة Score!` : 'تعذر إتمام التحويل؛ راجع رصيدك.');
  };

  const buy = (kind: 'key' | 'heart' | 'shield' | 'magnet' | 'slow') => {
    if (kind === 'shield' && progress.highestUnlockedLevel < 5) { soundEngine.playLocked(); setNotice('الدرع الدائري يفتح عند الوصول إلى المستوى الخامس.'); return; }
    const price = 500;
    const latest = loadWorldSave();
    if (latest.coins < price) {
      soundEngine.playLocked();
      setNotice(`مش معاك عملات كفاية — ناقصك ${(price - latest.coins).toLocaleString('ar-EG')} عملة.`);
      return;
    }
    let purchased = false;
    saveWorld((current) => {
      if (current.coins < price) return current;
      purchased = true;
      return { ...current, coins: current.coins - price, blueKeys: kind === 'key' ? current.blueKeys + 1 : current.blueKeys, extraHearts: kind === 'heart' ? current.extraHearts + 1 : current.extraHearts, shieldCharges: kind === 'shield' ? current.shieldCharges + 1 : current.shieldCharges, magnetCharges: kind === 'magnet' ? current.magnetCharges + 1 : current.magnetCharges, slowMonsterCharges: kind === 'slow' ? current.slowMonsterCharges + 1 : current.slowMonsterCharges };
    });
    if (purchased) { soundEngine.playPurchase(); setPurchasePulse(true); window.setTimeout(() => setPurchasePulse(false), 900); } else soundEngine.playLocked();
    setNotice(purchased ? (kind === 'key' ? 'تم شراء المفتاح الأزرق وإضافته للمخزون!' : kind === 'heart' ? 'تم شراء قلب إضافي! سيظهر أسفل القلوب الأساسية باللون الأزرق.' : kind === 'shield' ? 'تم شراء شحنة درع دائري لمدة دقيقتين!' : kind === 'slow' ? 'تم شراء شحنة إبطاء الوحوش لمدة دقيقة!' : 'تم شراء شحنة مغناطيس وإضافتها إلى أدوات اللعب!') : 'تعذر إتمام الشراء؛ راجع رصيدك.');
  };

  const rewardForAchievement = (achievement: Achievement) => {
    if (achievement.id.startsWith('score-')) return { kind: 'score' as const, amount: achievement.id === 'score-500k' ? 2500 : 750, label: `${achievement.id === 'score-500k' ? '2,500' : '750'} نقطة Score` };
    const tierRewards: Record<string, number> = { 'البدايات': 250, 'التقدم': 500, 'المهارة': 900, 'الخبراء': 1600, 'أسطوري': 2500 };
    const amount = tierRewards[achievement.tier] ?? 1000;
    return { kind: 'coins' as const, amount, label: `${amount.toLocaleString('ar-EG')} عملة` };
  };

  useEffect(() => {
    if (page !== 'awards' || activeAchievement) return;
    const next = achievements.find((a) => a.unlocked && !save.claimedAchievementRewards.includes(a.id));
    if (next) setActiveAchievement(next);
  }, [page, achievements, save.claimedAchievementRewards, activeAchievement]);

  useEffect(() => {
    if (activeAchievement) soundEngine.playAchievementWin();
  }, [activeAchievement]);

  const claimAchievement = () => {
    if (!activeAchievement) return;
    const reward = rewardForAchievement(activeAchievement);
    saveWorld((current) => {
      if (current.claimedAchievementRewards.includes(activeAchievement.id)) return current;
      return { ...current, coins: reward.kind === 'coins' ? current.coins + reward.amount : current.coins,
        totalScore: reward.kind === 'score' ? current.totalScore + reward.amount : current.totalScore,
        claimedAchievementRewards: [...current.claimedAchievementRewards, activeAchievement.id] };
    });
    soundEngine.playPurchase();
    setNotice(`تم استلام ${reward.label} بنجاح!`);
    setActiveAchievement(null);
  };

  const wheelPrizes: WheelPrize[] = [
    { label: '5,000 عملة', kind: 'coins' as const, amount: 5000, icon: '🪙' },
    { label: '2,500 Score', kind: 'score' as const, amount: 2500, icon: '⭐' },
    { label: '5 مفاتيح', kind: 'key' as const, amount: 5, icon: '🔑' },
    { label: '15 مفتاح', kind: 'key' as const, amount: 15, icon: '🗝️' },
    { label: '5 مغناطيس', kind: 'magnet' as const, amount: 5, icon: '🧲' },
    { label: '5 قلوب', kind: 'heart' as const, amount: 5, icon: '💙' },
    { label: '5 دروع', kind: 'shield' as const, amount: 5, icon: '🛡️' },
  ];
  const spinWheel = () => {
    if (wheelSpinning || wheelRewardPending) return;
    const latest = loadWorldSave();
    if (latest.coins < 500) { soundEngine.playLocked(); setNotice('تحتاج إلى 500 عملة على الأقل لتدوير العجلة.'); return; }
    saveWorld((current) => current.coins < 500 ? current : { ...current, coins: current.coins - 500 });
    setNotice('');
    setWheelPrize(null);
    setWheelRewardPending(false);
    setWheelSpinning(true);
    soundEngine.startWheelSpin();

    // Randomize the final angle; the prize is read from the segment under the pointer.
    const currentRotation = ((wheelRotation % 360) + 360) % 360;
    const randomStopAngle = Math.random() * 360;
    const deltaToStop = ((randomStopAngle - currentRotation) % 360 + 360) % 360;
    const extraTurns = 5 + Math.floor(Math.random() * 3);
    setWheelRotation(wheelRotation + extraTurns * 360 + deltaToStop);
  };
  const finishWheelSpin = () => {
    if (!wheelSpinning) return;
    const segment = 360 / wheelPrizes.length;
    const pointerAngleOnWheel = ((-wheelRotation % 360) + 360) % 360;
    const winningIndex = Math.min(wheelPrizes.length - 1, Math.floor(pointerAngleOnWheel / segment));
    const actualPrize = wheelPrizes[winningIndex];
    setWheelPrize(actualPrize);
    setWheelSpinning(false);
    soundEngine.stopWheelSpin();
    setWheelRewardPending(true);
    soundEngine.playWheelWin();
  };

  const claimWheelPrize = () => {
    if (!wheelPrize || !wheelRewardPending) return;
    saveWorld((current) => ({ ...current,
      coins: current.coins + (wheelPrize.kind === 'coins' ? wheelPrize.amount : 0),
      totalScore: current.totalScore + (wheelPrize.kind === 'score' ? wheelPrize.amount : 0),
      blueKeys: current.blueKeys + (wheelPrize.kind === 'key' ? wheelPrize.amount : 0),
      magnetCharges: current.magnetCharges + (wheelPrize.kind === 'magnet' ? wheelPrize.amount : 0),
      extraHearts: current.extraHearts + (wheelPrize.kind === 'heart' ? wheelPrize.amount : 0),
      shieldCharges: current.shieldCharges + (wheelPrize.kind === 'shield' ? wheelPrize.amount : 0),
    }));
    setWheelRewardPending(false);
    setNotice(`تم استلام ${wheelPrize.label} بنجاح!`);
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const grouped = ['البدايات','التقدم','المهارة','الخبراء','أسطوري'];
  const isShop = page === 'shop';
  const isWheel = page === 'wheel';
  const shopProducts: { id: 'key' | 'heart' | 'shield' | 'magnet' | 'slow'; name: string; eyebrow: string; description: string; icon: LucideIcon; artwork: string; image: string; tint: string; stock: number; stockLabel: string; action: string; locked?: boolean }[] = [
    { id: 'key', name: 'المفتاح الأزرق', eyebrow: 'إنقاذ ومواصلة', description: 'احتفظي به في مخزونك لإنقاذ جودي ومتابعة المرحلة بعد نفاد القلوب.', icon: KeyRound, artwork: '🔑', image: '/images/powerups/key.svg', tint: 'from-sky-400/25 via-blue-500/10 to-indigo-500/10', stock: save.blueKeys, stockLabel: 'مفتاح في المخزون', action: 'شراء مفتاح' },
    { id: 'heart', name: 'قلب إضافي', eyebrow: 'فرصة حياة إضافية', description: 'يمنحك فرصة إضافية في المحاولة. يظهر باللون الأزرق أسفل القلوب الحمراء الأساسية.', icon: Heart, artwork: '💠', image: '/images/powerups/heart.svg', tint: 'from-cyan-300/25 via-sky-500/10 to-blue-500/10', stock: save.extraHearts, stockLabel: 'قلب في المخزون', action: 'شراء قلب' },
    { id: 'shield', name: 'الدرع الدائري', eyebrow: 'حماية لمدة دقيقتين', description: 'يحمي جودي من الوحوش لمدة 120 ثانية. فعّليه بلمسة واحدة في اللحظة المناسبة.', icon: Shield, artwork: '🛡️', image: '/images/powerups/shield.svg', tint: 'from-emerald-300/25 via-teal-500/10 to-cyan-500/10', stock: save.shieldCharges, stockLabel: 'شحنة درع', action: progress.highestUnlockedLevel < 5 ? 'يفتح عند المستوى 5' : 'شراء شحنة', locked: progress.highestUnlockedLevel < 5 },
    { id: 'magnet', name: 'المغناطيس', eyebrow: 'جذب العناصر · 6.5 ثوانٍ', description: 'يجذب العناصر القابلة للجمع نحو جودي تلقائيًا. استخدميه من زر المغناطيس بجوار الدرع أثناء اللعب.', icon: Magnet, artwork: '🧲', image: '/images/powerups/magnet.svg', tint: 'from-violet-300/25 via-fuchsia-500/10 to-sky-500/10', stock: save.magnetCharges, stockLabel: 'شحنة مغناطيس', action: 'شراء مغناطيس' },
    { id: 'slow', name: 'مُبطّئ الوحوش', eyebrow: 'إبطاء الوحوش · 60 ثانية', description: 'يقلل سرعة حركة الوحوش ومقذوفاتهم فقط لمدة دقيقة. جودي تظل تجري طبيعيًا، والنقاط والقطط والشوكولاتة لا تتأثر.', icon: Wind, artwork: '🐌', image: '/images/powerups/slow.svg', tint: 'from-lime-300/25 via-emerald-500/10 to-teal-500/10', stock: save.slowMonsterCharges, stockLabel: 'شحنة إبطاء', action: 'شراء مُبطّئ' },
  ];
  return <section className={`relative mx-auto w-full ${isWheel ? 'flex h-full max-w-5xl flex-col overflow-hidden rounded-2xl p-2 sm:p-3' : 'max-w-6xl overflow-hidden rounded-[2rem] p-4 sm:p-6'} border border-cyan-100/10 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,.12),transparent_38%),linear-gradient(145deg,#101c32_0%,#0b1425_54%,#11152c_100%)] text-slate-100 shadow-[0_28px_80px_rgba(0,0,0,.42)]`}>
    <div className={`relative flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 sm:p-3 ${isWheel ? 'mb-2 shrink-0' : 'mb-5'}`}>
      <div className="flex items-center gap-3">
        <div className={`grid h-14 w-14 place-items-center rounded-2xl border shadow-inner ${isShop?'border-cyan-200/25 bg-gradient-to-br from-cyan-300/20 to-blue-700/20 text-cyan-100':'border-amber-200/20 bg-amber-300/10 text-amber-200'}`}>{isShop?<ShoppingBag className="h-7 w-7"/>:isWheel?<span className="text-3xl">🎡</span>:<Trophy className="h-6 w-6"/>}</div>
        <div><p className="text-[10px] font-black tracking-[.22em] text-cyan-200">JOUDY · {isShop?'PREMIUM STORE':isWheel?'LUCKY WHEEL':'ACHIEVEMENTS'}</p><h2 className="text-2xl font-black text-white sm:text-3xl">{isShop?'متجر الأدوات':isWheel?'عجلة الحظ':'الإنجازات'}</h2><p className="text-xs text-slate-400">{isShop?'عزّزي فرصك بأدوات مصممة للمغامرات الصعبة':isWheel?'لفة واحدة قد تغيّر مغامرتك':'مرتبة من الأسهل للأصعب'}</p></div>
      </div>
      <div className="flex items-center gap-3">
        {page === 'awards' && <span className="rounded-xl border border-amber-200/20 bg-amber-300/10 px-3 py-2 text-xs font-black text-amber-100">{unlockedCount} / {achievements.length} مكتمل</span>}
        <div className="flex items-center gap-2 rounded-xl border border-amber-200/20 bg-amber-300/10 px-3 py-2 text-sm font-black text-amber-100"><Coins className="h-4 w-4"/>{save.coins.toLocaleString('ar-EG')}</div>
      </div>
    </div>
    <button type="button" onClick={onBack} className={`inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 ${isWheel ? 'mb-2 self-start text-xs' : 'mb-5 px-4 py-2.5'}`}><ArrowRight className="h-4 w-4"/> رجوع للخريطة</button>
    {notice && <motion.p initial={{opacity:0,y:-8,scale:.98}} animate={{opacity:1,y:0,scale:purchasePulse?1.025:1}} transition={{type:'spring',stiffness:260,damping:18}} role="status" className={`rounded-xl border px-3 py-2 text-xs font-bold ${notice.includes('مش معاك') || notice.includes('تحتاج') || notice.includes('تعذر') || notice.includes('يفتح عند') ? 'border-rose-300/25 bg-rose-500/10 text-rose-200' : 'border-emerald-200/20 bg-emerald-400/10 text-emerald-100'} ${isWheel ? 'mb-1 shrink-0 text-center text-[10px]' : 'mb-4'}`}>{notice}</motion.p>}
    {isWheel ? <div className="mx-auto flex min-h-0 w-full flex-1 flex-col items-center justify-evenly gap-2 overflow-hidden py-1">
      <div className="shrink-0 rounded-xl border border-amber-200/25 bg-gradient-to-br from-amber-300/15 to-orange-500/5 px-5 py-1.5 text-center shadow-lg"><p className="text-xs font-bold text-amber-100">تكلفة اللفة الواحدة</p><p className="mt-1 text-2xl font-black text-white">500 🪙</p></div>
      <div className="relative aspect-square w-[min(58vh,78vw)] max-w-[370px] shrink-0">
        <div className="pointer-events-none absolute left-1/2 top-[-5px] z-30 -translate-x-1/2 drop-shadow-[0_4px_5px_rgba(0,0,0,.7)]"><svg width="42" height="52" viewBox="0 0 42 52"><path d="M21 50 3 5Q21 14 39 5Z" fill="#fff1a8" stroke="#92400e" strokeWidth="3"/><circle cx="21" cy="8" r="5" fill="#f59e0b" stroke="#fff1a8" strokeWidth="2"/></svg></div>
        <motion.div className="relative aspect-square h-full w-full overflow-hidden rounded-full border-[9px] border-[#f8d778] bg-[#18243b] shadow-[0_0_0_5px_#75451f,0_0_45px_rgba(251,191,36,.3)]" animate={{ rotate: wheelRotation }} transition={{ duration: 5.4, ease: [0.12,0.75,0.12,1] }} onAnimationComplete={finishWheelSpin}>
          <svg viewBox="0 0 420 420" className="h-full w-full" role="img" aria-label="عجلة الحظ مقسمة إلى سبع جوائز">
            {wheelPrizes.map((prize,index)=>{ const n=wheelPrizes.length; const a1=(-90+index*360/n)*Math.PI/180; const a2=(-90+(index+1)*360/n)*Math.PI/180; const mid=(a1+a2)/2; const x1=210+190*Math.cos(a1), y1=210+190*Math.sin(a1), x2=210+190*Math.cos(a2), y2=210+190*Math.sin(a2); const tx=210+123*Math.cos(mid), ty=210+123*Math.sin(mid); const colors=['#e7a52d','#2563a8','#0f8790','#7852ad','#bd3976','#27875d','#a85a25']; return <g key={prize.label}><path d={`M210 210 L${x1} ${y1} A190 190 0 0 1 ${x2} ${y2} Z`} fill={colors[index]} stroke="#fff0b8" strokeWidth="3"/><path d={`M210 210 L${x1} ${y1}`} stroke="#fff7d6" strokeOpacity=".65" strokeWidth="2"/><text x={tx} y={ty-8} textAnchor="middle" dominantBaseline="middle" fontSize="30">{prize.icon}</text><text x={tx} y={ty+19} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12" fontWeight="900" stroke="#18243b" strokeWidth=".8" paintOrder="stroke">{prize.label}</text></g>; })}
            <circle cx="210" cy="210" r="43" fill="#17243a" stroke="#ffe8a0" strokeWidth="7"/><circle cx="210" cy="210" r="31" fill="#e8b84d" stroke="#fff4cf" strokeWidth="3"/><text x="210" y="219" textAnchor="middle" fontSize="29">🎡</text>
          </svg>
        </motion.div>
        <div className="pointer-events-none absolute inset-0 z-20 rounded-full border-[3px] border-white/35" />
      </div>
      <button type="button" disabled={wheelSpinning || wheelRewardPending} onClick={spinWheel} className="shrink-0 rounded-xl border border-amber-100/50 bg-gradient-to-l from-amber-300 via-yellow-400 to-orange-500 px-9 py-2.5 text-base font-black text-slate-950 shadow-[0_12px_35px_rgba(245,158,11,.32)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60">{wheelSpinning?'العجلة بتلف...':'🎯 لف العجلة · 500 عملة'}</button>
      <p className="max-w-md shrink-0 text-center text-[10px] leading-4 text-slate-400">كل جائزة لها خانة مستقلة وواضحة. بعد توقف العجلة ستظهر لك نافذة لاستلام الجائزة بنفسك.</p>
      {wheelRewardPending && wheelPrize && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true"><motion.div initial={{opacity:0,scale:.72,y:25}} animate={{opacity:1,scale:1,y:0}} className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-amber-200/45 bg-gradient-to-br from-[#263654] via-[#111c32] to-[#251333] p-6 text-center shadow-[0_30px_100px_rgba(0,0,0,.75)]"><div className="pointer-events-none absolute -left-10 -top-12 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl"/><div className="relative mx-auto mb-3 grid h-24 w-24 place-items-center rounded-full border-2 border-amber-200/50 bg-amber-300/10 text-5xl shadow-[0_0_45px_rgba(251,191,36,.3)]">{wheelPrize.icon}</div><p className="text-[10px] font-black tracking-[.25em] text-amber-200">LUCKY WINNER</p><h3 className="mt-2 text-2xl font-black text-white">مبروك! كسبت 🎉</h3><p className="mt-3 rounded-2xl border border-emerald-200/25 bg-emerald-300/10 px-4 py-4 text-2xl font-black text-emerald-100">{wheelPrize.label}</p><button type="button" onClick={claimWheelPrize} className="mt-5 w-full rounded-xl border border-amber-100/50 bg-gradient-to-l from-amber-300 to-orange-400 px-5 py-3.5 text-sm font-black text-slate-950 shadow-lg">استلام الجائزة ومواصلة اللعب</button></motion.div></div>}
    </div> : isShop ? <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-200/15 bg-gradient-to-r from-cyan-400/[0.08] via-blue-500/[0.06] to-violet-500/[0.08] px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-100"><Sparkles className="h-4 w-4 text-cyan-200"/> تجهيزات المغامرة</div>
        <p className="text-[10px] font-semibold text-slate-400">كل أداة تُضاف مباشرة إلى مخزونك</p>
      </div>
      <section className="rounded-[1.6rem] border border-amber-200/20 bg-gradient-to-br from-amber-300/[0.10] via-[#111b2d] to-cyan-400/[0.06] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div><h3 className="text-lg font-black text-white">تبادل العملات بالنقاط</h3><p className="mt-1 text-[11px] text-slate-400">كل 500 عملة صفراء = 1,000 نقطة Score تضاف لرصيدك فورًا.</p></div>
          <span className="rounded-xl border border-amber-200/20 bg-amber-300/10 px-3 py-2 text-xs font-black text-amber-100">⭐ {save.totalScore.toLocaleString('ar-EG')} نقطة</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[500, 1000, 1500, 2000].map((amount) => <button key={amount} type="button" onClick={() => buyScore(amount)} className="rounded-xl border border-amber-200/20 bg-black/20 px-3 py-3 text-center transition hover:-translate-y-0.5 hover:border-amber-200/50 hover:bg-amber-300/10">
            <span className="block text-sm font-black text-amber-100">{amount.toLocaleString('ar-EG')} 🪙</span><span className="mt-1 block text-[10px] font-bold text-cyan-200">+{(amount * 2).toLocaleString('ar-EG')} ⭐ Score</span>
          </button>)}
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {shopProducts.map((product) => {
          const Icon = product.icon;
          return <article key={product.id} className={`group relative flex min-w-0 flex-col overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0a1425]/90 shadow-[0_16px_38px_rgba(0,0,0,.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-100/25 hover:shadow-[0_22px_48px_rgba(0,0,0,.38)] ${purchasePulse ? 'animate-pulse border-emerald-200/40' : ''}`}>
            <div className={`relative mx-3 mt-3 flex h-36 items-center justify-center overflow-hidden rounded-[1.25rem] border border-white/10 bg-gradient-to-br ${product.tint}`}>
              <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -bottom-14 -left-8 h-40 w-40 rounded-full border border-white/10" />
              <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="relative z-10 h-32 w-44 transition duration-300 group-hover:scale-105">
                {failedShopImages[product.id] ? (
                  <span className="grid h-full w-full place-items-center text-6xl drop-shadow-[0_8px_12px_rgba(0,0,0,.4)]" role="img" aria-label={product.name}>{product.artwork}</span>
                ) : (
                  <img
                    src={product.image}
                    alt={product.name}
                    draggable={false}
                    onError={() => setFailedShopImages((current) => ({ ...current, [product.id]: true }))}
                    className="product-art-float h-full w-full object-contain drop-shadow-[0_12px_16px_rgba(0,0,0,.35)]" style={{ minWidth: "100%", minHeight: "100%" }}
                  />
                )}
                <span className="absolute bottom-0 right-1 grid h-8 w-8 place-items-center rounded-xl border border-white/20 bg-[#111d32] text-lg shadow-lg"><Icon className="h-4 w-4 text-white" strokeWidth={1.8}/></span>
                <span className="sr-only">{product.artwork}</span>
              </div>
              <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[9px] font-black tracking-wide text-white/85 backdrop-blur-sm">{product.eyebrow}</span>
              {product.locked && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-amber-200/20 bg-amber-300/15 px-2 py-1 text-[9px] font-black text-amber-100"><Lock className="h-3 w-3"/> مقفول</span>}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-start justify-between gap-2"><h3 className="text-base font-black text-white">{product.name}</h3><span className="shrink-0 rounded-lg border border-amber-200/20 bg-amber-300/10 px-2 py-1 text-[10px] font-black text-amber-100">500 🪙</span></div>
              <p className="mt-2 min-h-[4.5rem] text-[11px] leading-6 text-slate-400">{product.description}</p>
              <div className="mt-auto pt-3">
                <button type="button" onClick={() => { if (product.locked) { soundEngine.playLocked(); setNotice(`${product.name} يفتح عند الوصول إلى المستوى الخامس.`); } else buy(product.id); }} className="w-full rounded-xl border border-white/10 bg-gradient-to-l from-cyan-500 to-blue-700 px-3 py-3 text-xs font-black text-white shadow-[0_8px_20px_rgba(14,165,233,.18)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-400 disabled:shadow-none">{product.action}</button>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px]"><span className="text-slate-500">المخزون الحالي</span><span className="font-black tabular-nums text-cyan-100">{product.stock.toLocaleString('ar-EG')} · {product.stockLabel}</span></div>
              </div>
            </div>
          </article>;
        })}
      </div>
      <p className="rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-[10px] leading-5 text-slate-500">ملاحظة: الدرع الدائري متاح من المستوى الخامس، وتحصلين على 20 شحنة مجانية عند فتحه لأول مرة. المغناطيس يعمل 6.5 ثانية، ومُبطّئ الوحوش يعمل 60 ثانية.</p>
    </div> : <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] text-slate-400">إجمالي الإنجازات</p><p className="mt-1 text-xl font-black text-white">{achievements.length}</p></div><div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] text-slate-400">المكتملة</p><p className="mt-1 text-xl font-black text-emerald-300">{unlockedCount}</p></div><div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] text-slate-400">المتبقية</p><p className="mt-1 text-xl font-black text-amber-200">{achievements.length-unlockedCount}</p></div><div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] text-slate-400">نسبة الإنجاز</p><p className="mt-1 text-xl font-black text-cyan-200">{Math.round(unlockedCount/achievements.length*100)}%</p></div></div>
      {grouped.map((tier,index)=>{
        const tierStyle = TIER_STYLES[tier];
        const tierAchievements = achievements.filter((a)=>a.tier===tier);
        const tierUnlocked = tierAchievements.filter((a)=>a.unlocked).length;
        return <section key={tier} className="relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#081323]/55 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.04)] sm:p-4">
          <div className="mb-4 flex items-center gap-3">
            <span className={`grid h-9 w-9 place-items-center rounded-xl border ${tierStyle.border} bg-gradient-to-br ${tierStyle.glow} text-sm font-black ${tierStyle.text}`}>{String(index+1).padStart(2,'0')}</span>
            <div className="min-w-0"><h3 className="text-sm font-black text-white">{tier}</h3><p className="mt-0.5 text-[10px] text-slate-500">أوسمة هذا المستوى من التحدي</p></div>
            <span className="mr-auto rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-black tabular-nums text-slate-300">{tierUnlocked} / {tierAchievements.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {tierAchievements.map((a,i)=><motion.article key={a.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.22,delay:Math.min(i*.025,.15)}}
              className={`group relative flex min-h-[190px] flex-col overflow-hidden rounded-[1.35rem] border bg-gradient-to-br ${a.unlocked ? `${tierStyle.border} ${tierStyle.glow}` : 'border-white/8 from-slate-900/95 to-slate-950/95'} p-3 text-center shadow-[0_12px_28px_rgba(0,0,0,.22)] transition duration-300 hover:-translate-y-1 hover:border-white/25`}>
              <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/[.035] blur-2xl" />
              <div className="relative mx-auto mb-2 h-[76px] w-[68px] animate-[rewardBob_3.2s_ease-in-out_infinite] transition duration-300 group-hover:scale-110">
                <Image src={`/images/achievements/badges/${a.id}.svg`} alt={`وسام ${a.title}`} fill sizes="68px" className="object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,.4)]" />
                {!a.unlocked && <span className="absolute inset-x-2 bottom-1 rounded-b-full bg-amber-300/35 transition-all duration-700" style={{ height: `${Math.max(4, a.progress * .58)}%`, clipPath: 'polygon(12% 0,88% 0,100% 100%,0 100%)' }} />}
                <span className={`absolute inset-0 flex items-center justify-center pt-1 text-[23px] drop-shadow-[0_2px_3px_rgba(0,0,0,.7)] ${a.unlocked ? '' : 'grayscale'}`}>{a.unlocked ? '' : '🔒'}</span>
              </div>
              <span className={`relative mx-auto mb-1 rounded-full px-2 py-0.5 text-[8px] font-black ${a.unlocked ? tierStyle.chip : 'bg-white/5 text-slate-500'}`}>{a.unlocked ? 'وسام مكتسب' : 'تحدٍ قادم'}</span>
              <h4 className={`relative text-[11px] font-black leading-5 ${a.unlocked ? tierStyle.text : 'text-slate-300'}`}>{a.title}</h4>
              <p className="relative mt-1 text-[10px] leading-4 text-slate-400">{a.detail}</p>
              <span className={`relative mt-auto inline-flex items-center justify-center gap-1 self-center rounded-full px-2.5 py-1.5 text-[9px] font-black ${a.unlocked?'bg-emerald-300/10 text-emerald-200':'bg-black/30 text-slate-500'}`}>{a.unlocked?<><Check className="h-3 w-3"/> مكتمل</>:<><Lock className="h-3 w-3"/> مقفول</>}</span>
              {a.unlocked && !save.claimedAchievementRewards.includes(a.id) && <button type="button" onClick={() => setActiveAchievement(a)} className="relative mt-2 rounded-lg border border-amber-200/30 bg-gradient-to-l from-amber-300 to-orange-400 px-3 py-2 text-[10px] font-black text-slate-950 shadow-lg">استلام المكافأة 🎁</button>}
              {a.unlocked && save.claimedAchievementRewards.includes(a.id) && <span className="relative mt-2 text-[9px] font-bold text-emerald-300">تم استلام المكافأة ✓</span>}
            </motion.article>)}
          </div>
        </section>;
      })}
    </div>}
    {activeAchievement && (() => { const reward = rewardForAchievement(activeAchievement); return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="achievement-reward-title"><motion.div initial={{ opacity: 0, scale: .75, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-amber-200/40 bg-gradient-to-br from-[#24314b] via-[#111b30] to-[#170f2d] p-6 text-center shadow-[0_30px_100px_rgba(0,0,0,.7)]"><div className="pointer-events-none absolute -left-12 -top-16 h-48 w-48 rounded-full bg-amber-300/15 blur-3xl"/><div className="relative mx-auto mb-3 grid h-24 w-24 place-items-center rounded-full border border-amber-200/40 bg-amber-300/10 text-5xl shadow-[0_0_45px_rgba(251,191,36,.2)]">🏆</div><p className="text-[10px] font-black tracking-[.25em] text-amber-200">ACHIEVEMENT UNLOCKED</p><h3 id="achievement-reward-title" className="mt-2 text-2xl font-black text-white">إنجاز جديد!</h3><p className="mt-2 text-lg font-black text-amber-100">{activeAchievement.title}</p><p className="mt-1 text-xs text-slate-300">{activeAchievement.detail}</p><div className="my-5 rounded-2xl border border-emerald-200/25 bg-emerald-300/10 px-4 py-4"><p className="text-[10px] font-bold text-emerald-200">مكافأتك الجاهزة للاستلام</p><p className="mt-1 text-2xl font-black text-white">{reward.label} {reward.kind === 'coins' ? '🪙' : '⭐'}</p></div><button type="button" onClick={claimAchievement} className="w-full rounded-xl border border-amber-100/40 bg-gradient-to-l from-amber-300 to-orange-400 px-5 py-3.5 text-sm font-black text-slate-950 shadow-lg transition hover:scale-[1.02]">استلام المكافأة ومواصلة اللعب</button></motion.div></div>; })()}
  </section>;
}
