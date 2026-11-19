'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Download, Play, Star, Trophy, Sparkles, Lock, ShieldAlert, Swords, Smartphone, X } from 'lucide-react';
import { soundEngine } from '@/lib/soundEffects';
import { getCartoonSvgDataUri, type CartoonSpriteKind } from '@/lib/cartoonSvgSprites';

interface CharacterSelectScreenProps {
  realImageSrc: string;
  highestUnlockedLevel: number;
  onStartAdventure: () => void;
}

const scoring = [
  { icon: '🐈', sprite: 'cat' as CartoonSpriteKind, name: 'جمع القطط', points: '20 نقطة', detail: 'اجمع القطط لزيادة نتيجتك' },
  { icon: '🌹', sprite: 'rose' as CartoonSpriteKind, name: 'جمع الورود', points: '15 نقطة', detail: 'كل وردة تضيف نقاطًا' },
  { icon: '🍫', sprite: 'chocolate' as CartoonSpriteKind, name: 'جمع الشوكولاتة', points: '10 نقاط', detail: 'التقط الشوكولاتة في طريقك' },
  { icon: '🧲', sprite: 'magnet' as CartoonSpriteKind, name: 'المغناطيس', points: 'جذب العناصر', detail: 'يساعدك على جمع العناصر القريبة' },
  { icon: '🌟', sprite: 'doubleScore' as CartoonSpriteKind, name: 'مضاعف النقاط', points: '×2 لمدة 10 ثوانٍ', detail: 'ضاعف نقاط التجميع لفترة مؤقتة' },
  { icon: '⚡', sprite: 'obstacle' as CartoonSpriteKind, name: 'تجنب العوائق', points: 'حركة ومراوغة', detail: 'ابتعد عن الوحوش والمقذوفات' },
  { icon: '❤️', sprite: 'heart' as CartoonSpriteKind, name: 'حافظ على القلوب', points: '3 قلوب حياة', detail: 'لديك عدد محدود من القلوب؛ الاصطدام يقللها' },
];


export default function CharacterSelectScreen({ realImageSrc, highestUnlockedLevel, onStartAdventure }: CharacterSelectScreenProps) {
  const reduceMotion = useReducedMotion();
  const [guidePage, setGuidePage] = useState<'home' | 'scoring' | 'enemies'>('home');
  const [lockedNotice, setLockedNotice] = useState('');
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [installHelp, setInstallHelp] = useState(false);
  useEffect(() => {
    const onInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event); };
    window.addEventListener('beforeinstallprompt', onInstall);
    return () => window.removeEventListener('beforeinstallprompt', onInstall);
  }, []);
  const requestInstall = async () => {
    if (installPrompt && 'prompt' in installPrompt) {
      await (installPrompt as Event & { prompt: () => Promise<void> }).prompt();
      setInstallPrompt(null);
    } else setInstallHelp(true);
  };
  const openGuide = (page: 'scoring' | 'enemies') => { setGuidePage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const backHome = () => { setGuidePage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const enemies: { kind: CartoonSpriteKind; name: string; unlock: number; desc: string }[] = [
    {kind:'obstacle',name:'الغيوم المشاكسة',unlock:1,desc:'عائق بيئي يتطلب الانتباه وتغيير المسار.'},
    {kind:'monster',name:'وحش الرماية',unlock:2,desc:'يطلق مقذوفات باتجاه جودي؛ راقب مسارها.'},
    {kind:'runner',name:'الوحش المطارد',unlock:2,desc:'عدّاء سريع يحاول اللحاق بجودي.'},
    {kind:'fierceMonster',name:'الوحش الشرس',unlock:5,desc:'خصم قوي يتطلب مراوغة دقيقة.'},
    {kind:'exploder',name:'الوحش المتفجر',unlock:5,desc:'يستعد للانفجار؛ ابتعد عند ظهور إشارته.'},
    {kind:'boss',name:'الزعيم الأول',unlock:15,desc:'مواجهة رئيسية في ختام الفصل الأول.'},
    {kind:'projectile',name:'مقذوفات الوحوش',unlock:15,desc:'مقذوفات متحركة يجب تفادي مسارها.'},
    {kind:'shadowHunter',name:'صيّاد الظلال',unlock:16,desc:'صياد متخفٍ في مدينة الظلال.'},
    {kind:'shadowRunner',name:'عدّاء الظلال',unlock:16,desc:'مطارد سريع من عالم الظلال.'},
    {kind:'shadowBrute',name:'وحش الظلال الشرس',unlock:16,desc:'خصم ضخم يتطلب الحفاظ على مسافة.'},
    {kind:'shadowBoss',name:'حارس الظلال',unlock:16,desc:'حارس الفصل الثاني.'},
    {kind:'crystalHunter',name:'صيّاد البلورات',unlock:21,desc:'يطلق مقذوفات في الغابة البلورية.'},
    {kind:'crystalRunner',name:'عدّاء البلورات',unlock:21,desc:'مخلوق سريع يطارد جودي.'},
    {kind:'crystalBrute',name:'الوحش البلوري الضخم',unlock:21,desc:'خصم قوي في عالم البلورات.'},
    {kind:'crystalBoss',name:'حارس الغابة البلوري',unlock:21,desc:'حارس الفصل الثالث.'},
    {kind:'emberHunter',name:'صيّاد اللهب',unlock:26,desc:'يطلق مقذوفات نارية.'},
    {kind:'emberRunner',name:'عدّاء اللهب',unlock:26,desc:'مطارد سريع من القلعة النارية.'},
    {kind:'emberBrute',name:'وحش اللهب الضخم',unlock:26,desc:'خصم ناري بالغ القوة.'},
    {kind:'emberBoss',name:'حارس القلعة النارية',unlock:26,desc:'حارس الفصل الرابع والقلعة النارية.'},
  ];
  const unlockLabel = (level: number) => level === 16 ? 'يفتح في الفصل الثاني' : level === 21 ? 'يفتح في الفصل الثالث' : level === 26 ? 'يفتح في الفصل الرابع' : `يفتح في المستوى ${level}`;

  return (
    <div dir="rtl" className="arcade-hub relative w-full overflow-hidden text-white">
      <style jsx global>{`
        @keyframes joudy-portrait-glow {
          0%, 100% { opacity: .38; transform: scale(.94); filter: blur(24px); }
          50% { opacity: .9; transform: scale(1.08); filter: blur(34px); }
        }
        @keyframes joudy-portrait-sweep {
          0% { transform: translateX(150%) rotate(18deg); opacity: 0; }
          18% { opacity: .56; }
          55%, 100% { transform: translateX(-175%) rotate(18deg); opacity: 0; }
        }
        @keyframes joudy-portrait-twinkle {
          0%, 100% { opacity: .18; transform: scale(.6) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.35) rotate(42deg); }
        }
        @keyframes joudy-portrait-ring {
          0% { transform: scale(.82); opacity: .7; }
          100% { transform: scale(1.18); opacity: 0; }
        }
        @keyframes home-orbit {
          from { transform: rotate(0deg) translateX(132px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(132px) rotate(-360deg); }
        }
        @keyframes info-glint {
          0%, 100% { transform: translateX(150%) skewX(-18deg); opacity: 0; }
          18% { opacity: .45; }
          55% { transform: translateX(-190%) skewX(-18deg); opacity: 0; }
        }
        .joudy-portrait-glow { animation: joudy-portrait-glow 4.8s ease-in-out infinite; }
        .joudy-portrait-sweep { animation: joudy-portrait-sweep 7.5s ease-in-out infinite; }
        .joudy-portrait-twinkle { animation: joudy-portrait-twinkle 2.6s ease-in-out infinite; }
        .joudy-portrait-ring { animation: joudy-portrait-ring 3.8s ease-out infinite; }
        .home-orbit { animation: home-orbit 16s linear infinite; }
        .info-glint { animation: info-glint 5.5s ease-in-out infinite; }
        @keyframes guide-sprite-float { 0%,100% { transform: translateY(0) rotate(-4deg) scale(1); } 50% { transform: translateY(-9px) rotate(4deg) scale(1.06); } }
        @keyframes guide-sprite-glow { 0%,100% { opacity:.28; transform:scale(.82); } 50% { opacity:.75; transform:scale(1.12); } }
        .guide-sprite-float { animation: guide-sprite-float 3.1s ease-in-out infinite; }
        .guide-sprite-glow { animation: guide-sprite-glow 2.6s ease-in-out infinite; }
        @keyframes joudy-title-shine { 0%,100% { text-shadow: 0 0 12px rgba(103,232,249,.25), 0 0 28px rgba(103,232,249,.12); transform: translateY(0); } 50% { text-shadow: 0 0 22px rgba(103,232,249,.75), 0 0 48px rgba(167,139,250,.35); transform: translateY(-2px); } }
        .joudy-title { animation: joudy-title-shine 3.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .joudy-portrait-glow, .joudy-portrait-sweep, .joudy-portrait-twinkle, .joudy-portrait-ring, .home-orbit, .info-glint, .guide-sprite-float, .guide-sprite-glow, .joudy-title { animation: none !important; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_4%,rgba(34,211,238,.16),transparent_38%),linear-gradient(145deg,#071321_0%,#0b1728_48%,#10152a_100%)]" />
        <div className="absolute -right-28 top-28 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -left-24 top-[42%] h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[.12]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px)', backgroundSize: '46px 46px', maskImage: 'linear-gradient(to bottom,black,transparent 72%)' }} />
      </div>

      {/* First screen: only the title, promise and Joudy's portrait. */}
      {guidePage === 'home' && (
      <section className="relative mx-auto flex min-h-[calc(100svh-5.25rem)] w-full max-w-6xl flex-col px-4 pb-8 pt-7 sm:px-7 sm:pt-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, ease: [0.2, 0.75, 0.25, 1] }}
          className="relative z-10 mx-auto mb-4 max-w-3xl text-center sm:mb-6"
        >
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/[.07] px-4 py-1.5 text-[10px] font-black tracking-[.22em] text-cyan-200 sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" /> ARCADE WORLD <span className="h-1 w-1 rounded-full bg-cyan-200" /> 30 STAGES
          </p>
          <h1 className="joudy-title mb-2 text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">جودي</h1>
          <p className="text-lg font-black text-cyan-100 sm:text-2xl">مغامرة التجميع السريعة</p>
          <p className="mx-auto mt-3 max-w-2xl text-xs font-medium leading-7 text-slate-300 sm:mt-4 sm:text-base sm:leading-8">
            اجمع العناصر، تفادَ العوائق، وحقق أعلى نتيجة. افتح المراحل التالية واصنع سجلك الخاص.
          </p>
        </motion.div>

        <div className="relative mx-auto flex w-full max-w-5xl flex-1 items-center justify-center">
          <div className="absolute left-1/2 top-1/2 h-[min(77vw,620px)] w-[min(77vw,620px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/[.07] blur-3xl" />
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 58, scale: 0.78, rotate: 2, filter: 'blur(16px)' }}
            animate={{ opacity: 1, y: reduceMotion ? 0 : [0, -7, 0], scale: 1, rotate: 0, filter: 'blur(0px)' }}
            transition={{ opacity: { duration: 1, delay: 0.15 }, scale: { duration: 1.05, delay: 0.12, type: 'spring', stiffness: 90, damping: 17 }, rotate: { duration: .9, delay: .12 }, y: { duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }, filter: { duration: .85, delay: .15 } }}
            className="relative isolate h-[min(57svh,590px)] min-h-[320px] w-full max-w-[760px] overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_40%,rgba(61,111,142,.48),rgba(18,35,55,.84)_57%,rgba(7,17,30,.96))] shadow-[0_30px_100px_rgba(0,0,0,.55),0_0_65px_rgba(34,211,238,.12)] sm:h-[min(63svh,650px)] sm:rounded-[2.6rem]"
          >
            <div className="absolute inset-0 opacity-45" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
            <div className="absolute left-1/2 top-[47%] z-[1] aspect-square w-[min(68%,430px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100/30 shadow-[0_0_65px_rgba(103,232,249,.15),inset_0_0_50px_rgba(103,232,249,.08)]" />
            <div className="joudy-portrait-glow absolute left-1/2 top-[45%] z-[1] h-[62%] w-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/35" />
            <div className="joudy-portrait-ring absolute left-1/2 top-[46%] z-[2] aspect-square w-[min(75%,490px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100/55" />
            <div className="joudy-portrait-ring absolute left-1/2 top-[46%] z-[2] aspect-square w-[min(75%,490px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-200/35 [animation-delay:1.9s]" />
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: .84, y: 38 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.15, delay: .25, type: 'spring', stiffness: 72, damping: 18 }}
              className="absolute inset-0 z-10"
            >
              <Image src={realImageSrc} alt="صورة جودي" fill priority sizes="(max-width: 1024px) 100vw, 760px" className="object-contain object-center drop-shadow-[0_22px_36px_rgba(0,0,0,.55)]" />
              <div className="joudy-portrait-sweep pointer-events-none absolute inset-y-0 left-[-25%] z-10 w-[30%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/35 to-transparent blur-md" />
            </motion.div>
            {[
              { left: '13%', top: '22%', delay: '0s', size: '18px' },
              { left: '82%', top: '16%', delay: '.7s', size: '14px' },
              { left: '86%', top: '61%', delay: '1.3s', size: '20px' },
              { left: '10%', top: '72%', delay: '1.8s', size: '13px' },
              { left: '25%', top: '43%', delay: '2.2s', size: '11px' },
              { left: '72%', top: '82%', delay: '.3s', size: '15px' },
            ].map((spark, index) => (
              <span key={index} className="joudy-portrait-twinkle pointer-events-none absolute z-[12] text-cyan-100 drop-shadow-[0_0_12px_rgba(165,243,252,.95)]" style={{ left: spark.left, top: spark.top, fontSize: spark.size, animationDelay: spark.delay }}>✦</span>
            ))}
            <motion.div animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: 'linear' }} className="pointer-events-none absolute left-1/2 top-[45%] z-[4] h-[min(75%,490px)] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cyan-100/15">
              <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 text-cyan-100 drop-shadow-[0_0_10px_rgba(103,232,249,.9)]">✦</span>
            </motion.div>
            <div className="absolute inset-x-0 bottom-0 z-[13] h-28 bg-gradient-to-t from-[#071321]/90 via-[#071321]/25 to-transparent" />
            <div className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-2 rounded-xl border border-cyan-100/25 bg-slate-950/55 px-3 py-2 text-[11px] font-bold text-white shadow-[0_0_24px_rgba(34,211,238,.18)] backdrop-blur-xl sm:bottom-6 sm:right-6 sm:text-xs">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.9)]" /> الشخصية الرئيسية · جودي
            </div>
            <div className="absolute bottom-4 left-4 z-20 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-[10px] font-bold text-cyan-100 backdrop-blur-xl sm:bottom-6 sm:left-6 sm:text-xs">
              <Star className="ml-1 inline h-3.5 w-3.5 fill-cyan-200 text-cyan-200" /> مغامرة من 30 مرحلة
            </div>
          </motion.div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-400 sm:mt-4 sm:text-xs">
          <span className="h-1 w-1 rounded-full bg-cyan-300" /> مرّر لأسفل لاكتشاف نظام اللعب <span className="animate-bounce text-cyan-200">↓</span>
        </div>
      </section>
      )}

      {guidePage === 'home' ? (
        <motion.section key="home-guides" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={{duration:.42}} className="relative mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 pb-32 pt-5 sm:px-7 sm:pt-8">
          <button type="button" onClick={() => openGuide('scoring')} className="group relative overflow-hidden rounded-[1.8rem] border border-amber-200/20 bg-gradient-to-br from-[#392b18] via-[#201b20] to-[#111827] p-5 text-right shadow-[0_18px_55px_rgba(0,0,0,.35)] transition hover:-translate-y-1 hover:border-amber-200/50 sm:p-7">
            <span className="absolute -left-8 -top-10 h-40 w-40 rounded-full bg-amber-300/15 blur-3xl"/><span className="relative flex items-center justify-between"><span className="grid h-14 w-14 place-items-center rounded-2xl border border-amber-200/25 bg-amber-200/10 text-amber-100"><Trophy className="h-7 w-7"/></span><ArrowRight className="h-5 w-5 rotate-180 text-amber-100/60"/></span>
            <span className="relative mt-5 block text-[10px] font-black tracking-[.2em] text-amber-200/70">ARCADE SCORING SYSTEM</span><span className="relative mt-1 block text-xl font-black text-white sm:text-2xl">دليل نظام النقاط والتحدي</span><span className="relative mt-2 block text-xs leading-6 text-amber-50/65">مرجع احترافي لقواعد احتساب النقاط، وآليات التحدي، والأدوات المؤثرة في كل مرحلة.</span>
          </button>
          <button type="button" onClick={() => openGuide('enemies')} className="group relative overflow-hidden rounded-[1.8rem] border border-fuchsia-200/20 bg-gradient-to-br from-[#291d43] via-[#191a32] to-[#101827] p-5 text-right shadow-[0_18px_55px_rgba(0,0,0,.35)] transition hover:-translate-y-1 hover:border-fuchsia-200/50 sm:p-7">
            <span className="absolute -left-8 -top-10 h-40 w-40 rounded-full bg-fuchsia-400/15 blur-3xl"/><span className="relative flex items-center justify-between"><span className="grid h-14 w-14 place-items-center rounded-2xl border border-fuchsia-200/25 bg-fuchsia-200/10 text-fuchsia-100"><Swords className="h-7 w-7"/></span><ArrowRight className="h-5 w-5 rotate-180 text-fuchsia-100/60"/></span>
            <span className="relative mt-5 block text-[10px] font-black tracking-[.2em] text-fuchsia-200/70">ENEMIES & BOSSES DATABASE</span><span className="relative mt-1 block text-xl font-black text-white sm:text-2xl">دليل الوحوش</span><span className="relative mt-2 block text-xs leading-6 text-fuchsia-50/65">اكتشف الخصوم والزعماء، ومستويات ظهورهم، ومتطلبات فتحهم عبر فصول المغامرة.</span>
          </button>
          <div className="sm:col-span-2"><button type="button" onClick={requestInstall} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-cyan-200/20 bg-gradient-to-l from-cyan-300/15 to-blue-500/10 p-4 text-right shadow-lg transition hover:border-cyan-200/45"><span className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl border border-cyan-100/20 bg-cyan-200/10 text-cyan-100"><Download className="h-6 w-6"/></span><span><span className="block text-sm font-black text-white">ثبّت جودي على جهازك</span><span className="mt-1 block text-[10px] text-slate-300">أضف اللعبة إلى الشاشة الرئيسية كتطبيق ويب</span></span></span><Smartphone className="h-5 w-5 text-cyan-100"/></button>
          {installHelp && <div className="mt-2 rounded-xl border border-cyan-100/15 bg-slate-950/70 p-3 text-xs leading-6 text-cyan-50"><button onClick={()=>setInstallHelp(false)} className="float-left p-1 text-white/60" aria-label="إغلاق"><X className="h-4 w-4"/></button><b>للتثبيت:</b> على Android افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». على iPhone افتح المشاركة ثم «إضافة إلى الشاشة الرئيسية».</div>}</div>
        </motion.section>
      ) : (
        <motion.section key={guidePage} initial={{opacity:0,y:24,scale:.985}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-14}} transition={{duration:.48}} className="relative mx-auto min-h-[75svh] w-full max-w-6xl px-4 pb-32 pt-7 sm:px-7 sm:pt-10">
          <button type="button" onClick={backHome} className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-4 py-2.5 text-xs font-black text-white"><ArrowRight className="h-4 w-4"/> العودة للصفحة الرئيسية</button>
          {guidePage === 'scoring' ? <div className="rounded-[2rem] border border-amber-200/20 bg-gradient-to-br from-[#241d18] via-[#171b27] to-[#111827] p-5 shadow-2xl sm:p-8">
            <div className="mb-7 flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-300/10 text-amber-200"><Trophy className="h-7 w-7"/></span><div><p className="text-[10px] font-black tracking-[.22em] text-amber-200/70">THE SCORING CODE</p><h2 className="text-2xl font-black text-white sm:text-4xl">دليل نظام النقاط والتحدي</h2><p className="mt-2 text-xs leading-6 text-amber-50/65">مرجعك لفهم قواعد التجميع والمراوغة واحتساب النتائج داخل كل مرحلة.</p></div></div>
            <div className="mb-5 grid grid-cols-3 gap-2">{[{title:'عدد المراحل',value:'30'},{title:'نمط اللعب',value:'تحدي الأركيد'},{title:'التقدم',value:'تدريجي'}].map(item=><div key={item.title} className="rounded-xl border border-amber-100/10 bg-black/20 p-3 text-center"><p className="text-[10px] text-amber-50/55">{item.title}</p><p className="mt-1 text-sm font-black text-amber-100">{item.value}</p></div>)}</div>
            <p className="mb-4 rounded-xl border border-amber-200/10 bg-amber-200/[.05] p-3 text-xs leading-6 text-amber-50/75">تُحتسب النقاط أثناء المرحلة من خلال جمع العناصر وتفادي المخاطر. القيم التالية هي القيم المعتمدة في منطق اللعبة الحالي.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{scoring.map((item,index)=><motion.div key={item.name} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:index*.055}} className="rounded-2xl border border-amber-100/10 bg-white/[.045] p-4"><img src={getCartoonSvgDataUri(item.sprite)} alt="" className="guide-sprite-float mb-3 h-14 w-14 object-contain"/><h3 className="text-sm font-black text-white">{item.name}</h3><p className="mt-2 text-sm font-black text-amber-200">{item.points}</p><p className="mt-1 text-[10px] leading-5 text-slate-300">{item.detail}</p></motion.div>)}</div>
            <div className="mt-5 rounded-2xl border border-rose-200/15 bg-rose-400/[.06] p-4 text-xs leading-7 text-rose-50/85"><b>إدارة المخاطر:</b> تبدأ المرحلة بثلاثة قلوب. الاصطدام بالعوائق والوحوش يقلل القلوب المتاحة؛ حافظ عليها حتى نهاية التحدي. المغناطيس يجذب العناصر القريبة، ومضاعف النقاط يضاعف حصيلة التجميع لمدة محدودة.</div>
          </div> : <div className="rounded-[2rem] border border-fuchsia-200/20 bg-gradient-to-br from-[#211a39] via-[#171a30] to-[#101827] p-5 shadow-2xl sm:p-8">
            <div className="mb-7 flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-fuchsia-300/10 text-fuchsia-200"><Swords className="h-7 w-7"/></span><div><p className="text-[10px] font-black tracking-[.22em] text-fuchsia-200/70">ENEMY INTELLIGENCE</p><h2 className="text-2xl font-black text-white sm:text-4xl">دليل الوحوش والزعماء</h2><p className="mt-2 text-xs leading-6 text-fuchsia-50/65">قاعدة بيانات الخصوم: أول ظهور، الفصل، وحالة الاكتشاف وفق تقدمك الحالي.</p></div></div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-fuchsia-100/10 bg-black/20 p-3"><span className="text-xs font-bold text-fuchsia-50/75">مستوى تقدمك الحالي</span><span className="rounded-lg bg-fuchsia-200/10 px-3 py-1.5 text-xs font-black text-fuchsia-100">المستوى {highestUnlockedLevel} من 30</span></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{enemies.map((enemy,index)=>{const unlocked=highestUnlockedLevel>=enemy.unlock;return <motion.button type="button" key={enemy.kind} initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:index*.035}} onClick={()=>{if(!unlocked){soundEngine.playLocked();setLockedNotice(unlockLabel(enemy.unlock));window.setTimeout(()=>setLockedNotice(''),2400);}else{setLockedNotice(`${enemy.name} · تم اكتشافه`);window.setTimeout(()=>setLockedNotice(''),1800);}}} className={`relative overflow-hidden rounded-2xl border p-3 text-center transition hover:-translate-y-1 ${unlocked?'border-emerald-200/15 bg-emerald-300/[.045]':'border-rose-200/15 bg-slate-950/35'}`}><div className="relative mx-auto mb-2 grid h-24 w-24 place-items-center rounded-2xl border border-white/10 bg-white/[.045]"><img src={getCartoonSvgDataUri(enemy.kind)} alt={enemy.name} className={`guide-sprite-float h-20 w-20 object-contain ${unlocked?'':'grayscale opacity-50'}`} style={{animationDelay:`${index*.12}s`}}/>{!unlocked&&<span className="absolute inset-0 grid place-items-center rounded-2xl bg-black/35"><Lock className="h-8 w-8 animate-pulse text-rose-200 drop-shadow-lg"/></span>}</div><h3 className="text-xs font-black text-white">{enemy.name}</h3><p className="mt-1 text-[10px] leading-5 text-slate-300">{enemy.desc}</p><p className="mt-2 text-[10px] font-black text-fuchsia-200">أول ظهور: المستوى {enemy.unlock}</p><span className={`mt-2 inline-flex rounded-lg px-2.5 py-1.5 text-[10px] font-black ${unlocked?'bg-emerald-300/10 text-emerald-200':'bg-rose-300/10 text-rose-200'}`}>{unlocked?'تم الاكتشاف':unlockLabel(enemy.unlock)}</span></motion.button>})}</div>
            {lockedNotice && <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className={`mt-5 rounded-xl border p-3 text-center text-sm font-black ${lockedNotice.startsWith('يفتح') ? 'border-rose-300/25 bg-rose-500/10 text-rose-200' : 'border-emerald-300/25 bg-emerald-500/10 text-emerald-200'}`} role="status">{lockedNotice}</motion.div>}
            <p className="mt-5 flex items-center justify-center gap-2 text-[10px] text-fuchsia-100/55"><ShieldAlert className="h-4 w-4"/> يتم فتح الدليل تلقائيًا وفق أعلى مستوى مفتوح في ملف تقدمك.</p>
          </div>}
        </motion.section>
      )}

      {guidePage === 'home' && <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-3 pb-[env(safe-area-inset-bottom)]">
        <motion.button type="button" whileHover={{ scale: 1.015, y: -2 }} whileTap={{ scale: .98 }} onClick={onStartAdventure} className="pointer-events-auto flex w-full max-w-2xl items-center justify-between rounded-2xl border border-cyan-100/35 bg-gradient-to-l from-cyan-300 via-cyan-400 to-blue-500 px-5 py-4 text-right text-base font-black text-[#071321] shadow-[0_12px_40px_rgba(0,0,0,.5),0_0_28px_rgba(34,211,238,.16)] backdrop-blur transition">
          <span className="flex items-center gap-3"><Play className="h-5 w-5 fill-current" /> ابدأ اللعب</span>
          <span className="text-xl" aria-hidden="true">←</span>
        </motion.button>
      </div>}
    </div>
  );
}
