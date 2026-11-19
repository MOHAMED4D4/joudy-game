'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { Heart, Play, Star, Trophy, Zap, Gamepad2, Magnet, Sparkles, Lock, ShieldAlert } from 'lucide-react';
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

const reveal = {
  hidden: { opacity: 0, y: 42, scale: 0.94, filter: 'blur(9px)' },
  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
};

export default function CharacterSelectScreen({ realImageSrc, highestUnlockedLevel, onStartAdventure }: CharacterSelectScreenProps) {
  const reduceMotion = useReducedMotion();

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
        @media (prefers-reduced-motion: reduce) {
          .joudy-portrait-glow, .joudy-portrait-sweep, .joudy-portrait-twinkle, .joudy-portrait-ring, .home-orbit, .info-glint, .guide-sprite-float, .guide-sprite-glow { animation: none !important; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_4%,rgba(34,211,238,.16),transparent_38%),linear-gradient(145deg,#071321_0%,#0b1728_48%,#10152a_100%)]" />
        <div className="absolute -right-28 top-28 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -left-24 top-[42%] h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[.12]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px)', backgroundSize: '46px 46px', maskImage: 'linear-gradient(to bottom,black,transparent 72%)' }} />
      </div>

      {/* First screen: only the title, promise and Joudy's portrait. */}
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
          <h1 className="text-3xl font-black leading-tight tracking-tight text-white drop-shadow-[0_4px_24px_rgba(34,211,238,.16)] sm:text-5xl lg:text-6xl">
            مغامرة التجميع السريعة
          </h1>
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

      {/* Scroll reveal: information assembles into view only when the player reaches it. */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.18 }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } } }}
        className="relative mx-auto w-full max-w-6xl scroll-mt-6 px-4 pb-32 pt-8 sm:px-7 sm:pt-14"
      >
        <motion.div variants={reveal} transition={{ duration: .72, ease: [0.2, 0.75, 0.25, 1] }} className="relative mb-5 overflow-hidden rounded-[2rem] border border-cyan-100/15 bg-gradient-to-br from-[#142b42]/95 via-[#101d31]/95 to-[#18152f]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,.42)] sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/4 h-52 w-52 rounded-full bg-fuchsia-400/10 blur-3xl" />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 text-xs font-black tracking-wider text-cyan-200"><Gamepad2 className="h-4 w-4" /> نمط اللعب</p>
              <h2 className="text-2xl font-black text-white sm:text-4xl">تحدي الأركيد</h2>
              <p className="mt-2 max-w-xl text-xs leading-6 text-slate-300 sm:text-sm">اجمع العناصر، ووازن بين السرعة والمراوغة، واصنع أعلى نتيجة في رحلة جودي.</p>
            </div>
            <div className="rounded-2xl border border-cyan-200/20 bg-cyan-200/10 p-3 text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,.12)]"><Zap className="h-7 w-7" /></div>
          </div>
          <div className="relative z-10 mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { title: 'المراحل', value: '30', tone: 'text-white' },
              { title: 'نظام اللعب', value: 'تحدي', tone: 'text-cyan-100' },
              { title: 'التقدم', value: 'تدريجي', tone: 'text-emerald-300' },
            ].map((item, index) => (
              <motion.div key={item.title} variants={reveal} transition={{ duration: .55, delay: index * .04 }} className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#071321]/55 p-3 text-center shadow-inner sm:p-4">
                <div className="info-glint pointer-events-none absolute inset-y-0 left-[-30%] w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <p className="text-[10px] font-semibold text-slate-400 sm:text-xs">{item.title}</p>
                <p className={`mt-1 text-lg font-black sm:text-2xl ${item.tone}`}>{item.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={reveal} transition={{ duration: .72 }} className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d192a]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,.38)] sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 90% 0%,rgba(34,211,238,.18),transparent 28%),radial-gradient(circle at 0% 100%,rgba(217,70,239,.16),transparent 30%)' }} />
          <div className="relative z-10 mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black tracking-[.2em] text-cyan-300">COLLECT · DODGE · WIN</p>
              <h3 className="mt-1 text-xl font-black text-white sm:text-2xl">نظام النقاط والتحدي</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-1.5 text-[10px] font-bold text-slate-300">داخل كل مرحلة</span>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
            {scoring.map((item, index) => (
              <motion.div
                key={item.name}
                variants={reveal}
                transition={{ duration: .58, delay: index * .055 }}
                whileHover={reduceMotion ? undefined : { y: -5, scale: 1.025 }}
                className="group relative min-h-[132px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.075] to-white/[.025] p-3.5 shadow-[0_10px_30px_rgba(0,0,0,.18)] transition-colors hover:border-cyan-200/30 sm:min-h-[145px] sm:p-4"
              >
                <div className="pointer-events-none absolute -right-7 -top-8 h-20 w-20 rounded-full bg-cyan-300/0 blur-2xl transition-colors group-hover:bg-cyan-300/15" />
                <div className="relative flex items-center gap-2"><span className="relative grid h-12 w-12 shrink-0 place-items-center"><span className="guide-sprite-glow absolute inset-0 rounded-full bg-cyan-300/30 blur-md" /><img src={getCartoonSvgDataUri(item.sprite)} alt="" className="guide-sprite-float relative z-[1] h-11 w-11 object-contain drop-shadow-[0_5px_10px_rgba(0,0,0,.35)]" style={{ animationDelay: `${index * .17}s` }} /></span><span className="text-xs font-black leading-5 text-slate-100 sm:text-sm">{item.name}</span></div>
                <p className="relative mt-3 text-xs font-black text-cyan-200 sm:text-sm">{item.points}</p>
                <p className="relative mt-1 text-[10px] leading-5 text-slate-400 sm:text-xs">{item.detail}</p>
              </motion.div>
            ))}
          </div>
          <motion.div variants={reveal} transition={{ duration: .65 }} className="relative z-10 mt-5 flex flex-col gap-3 rounded-2xl border border-rose-300/15 bg-rose-400/[.055] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-xs leading-6 text-slate-300 sm:text-sm"><Heart className="mt-1 h-4 w-4 shrink-0 fill-rose-400/20 text-rose-400" /> لديك عدد محدود من القلوب؛ الاصطدام بالعوائق يقلل فرصتك في إكمال المرحلة.</p>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-cyan-200/15 bg-cyan-200/[.06] px-3 py-2 text-[11px] font-black text-cyan-100"><Magnet className="h-4 w-4" /> التقط الأدوات واستفد من قدراتها</span>
          </motion.div>
          <div className="relative z-10 mt-7 border-t border-white/10 pt-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-[10px] font-black tracking-[.2em] text-rose-300">ENEMY FIELD GUIDE</p><h3 className="mt-1 text-xl font-black text-white sm:text-2xl">دليل الوحوش والمخلوقات 👾</h3><p className="mt-1 text-xs leading-6 text-slate-400">اكتشفي كل مخلوق، واعرفي أول مرحلة ممكن يظهر فيها. الوحوش المقفولة هتتفتح مع تقدمك.</p></div>
              <span className="rounded-full border border-rose-200/15 bg-rose-300/10 px-3 py-1.5 text-[10px] font-black text-rose-100">المراحل 1–30</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {([
                {kind:'obstacle' as CartoonSpriteKind,name:'الغيوم المشاكسة',unlock:1,desc:'عائق البداية؛ تجنّبيه حتى لا تخسري نقاطًا أو قلوبًا.',where:'من أول مرحلة'},
                {kind:'monster' as CartoonSpriteKind,name:'وحش الرماية',unlock:2,desc:'يطلق مقذوفات ناحية جودي؛ تحركي بعيدًا عن خط النار.',where:'من المرحلة 2'},
                {kind:'runner' as CartoonSpriteKind,name:'الوحش المطارد',unlock:2,desc:'عدّاء سريع يحاول اللحاق بجودي؛ غيري اتجاهك باستمرار.',where:'من المرحلة 2'},
                {kind:'fierceMonster' as CartoonSpriteKind,name:'الوحش الشرس',unlock:5,desc:'أقوى من الوحوش العادية واصطدامه مؤذٍ.',where:'من المرحلة 5'},
                {kind:'exploder' as CartoonSpriteKind,name:'الوحش المتفجر',unlock:5,desc:'يجهز انفجارًا بعد ظهوره؛ ابتعدي عند رؤية الوميض.',where:'من المرحلة 5'},
                {kind:'boss' as CartoonSpriteKind,name:'الزعيم',unlock:15,desc:'خصم ضخم وخطير؛ راقبي هجماته واتركي مساحة للمراوغة.',where:'زعيم الفصل الأول · المرحلة 15'},
                {kind:'projectile' as CartoonSpriteKind,name:'مقذوفات الوحوش',unlock:15,desc:'مقذوفات سريعة تتجه ناحية جودي؛ تابعي مسارها وابتعدي عنها.',where:'تبدأ من مواجهات الزعماء'},
                {kind:'shadowHunter' as CartoonSpriteKind,name:'صيّاد الظلال',unlock:16,desc:'صياد متخفٍ يطلق مقذوفات في مدينة الظلال.',where:'الفصل الثاني · من المرحلة 16'},
                {kind:'shadowRunner' as CartoonSpriteKind,name:'عدّاء الظلال',unlock:16,desc:'سريع ويحاول محاصرة جودي؛ لا تثبتي في مكانك.',where:'الفصل الثاني · من المرحلة 16'},
                {kind:'shadowBrute' as CartoonSpriteKind,name:'وحش الظلال الشرس',unlock:16,desc:'وحش ضخم؛ حافظي على مسافة آمنة.',where:'الفصل الثاني · من المرحلة 16'},
                {kind:'shadowBoss' as CartoonSpriteKind,name:'حارس الظلال',unlock:20,desc:'زعيم الفصل الثاني وهجماته قوية.',where:'زعيم الفصل الثاني · المرحلة 20'},
                {kind:'crystalHunter' as CartoonSpriteKind,name:'صيّاد البلورات',unlock:21,desc:'يطلق مقذوفات وسط الغابة البلورية.',where:'الفصل الثالث · من المرحلة 21'},
                {kind:'crystalRunner' as CartoonSpriteKind,name:'عدّاء البلورات',unlock:21,desc:'مخلوق سريع يطارد جودي.',where:'الفصل الثالث · من المرحلة 21'},
                {kind:'crystalBrute' as CartoonSpriteKind,name:'الوحش البلوري الضخم',unlock:21,desc:'قوي وخطير عند الاصطدام.',where:'الفصل الثالث · من المرحلة 21'},
                {kind:'crystalBoss' as CartoonSpriteKind,name:'حارس الغابة البلوري',unlock:25,desc:'زعيم الفصل الثالث؛ راقبي تحركاته وهجماته.',where:'زعيم الفصل الثالث · المرحلة 25'},
                {kind:'emberHunter' as CartoonSpriteKind,name:'صيّاد اللهب',unlock:26,desc:'يطلق مقذوفات خطيرة من القلعة النارية.',where:'الفصل الرابع · من المرحلة 26'},
                {kind:'emberRunner' as CartoonSpriteKind,name:'عدّاء اللهب',unlock:26,desc:'عدّاء سريع يلاحق جودي.',where:'الفصل الرابع · من المرحلة 26'},
                {kind:'emberBrute' as CartoonSpriteKind,name:'وحش اللهب الضخم',unlock:26,desc:'وحش ناري قوي؛ حافظي على مسافة كبيرة.',where:'الفصل الرابع · من المرحلة 26'},
                {kind:'emberBoss' as CartoonSpriteKind,name:'حارس القلعة النارية',unlock:30,desc:'الزعيم الأخير؛ تفادي هجماته واحتفظي بأدوات الحماية.',where:'الزعيم النهائي · المرحلة 30'},
              ]).map((enemy,index)=> (
                <motion.div key={enemy.kind} variants={reveal} transition={{duration:.5,delay:index*.025}} whileHover={reduceMotion?undefined:{y:-4,scale:1.02}} className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/90 to-slate-950/90 p-3 shadow-lg">
                  <div className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />
                  <div className="relative mx-auto mb-2 grid h-24 w-24 place-items-center rounded-2xl border border-white/10 bg-white/[.045]">
                    <img src={getCartoonSvgDataUri(enemy.kind)} alt={enemy.name} className={`guide-sprite-float h-[82px] w-[82px] object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,.45)] ${highestUnlockedLevel < enemy.unlock ? 'grayscale opacity-35' : ''}`} style={{animationDelay:`${index*.13}s`}} />
                    {highestUnlockedLevel < enemy.unlock && <div className="absolute inset-0 grid place-items-center rounded-2xl bg-slate-950/35 backdrop-blur-[1px]"><span className="grid h-10 w-10 place-items-center rounded-full border border-amber-200/40 bg-slate-950/80 text-amber-200 shadow-[0_0_24px_rgba(251,191,36,.28)]"><Lock className="h-5 w-5" /></span></div>}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl border border-cyan-200/10" />
                  </div>
                  <h4 className="relative text-center text-xs font-black text-white">{enemy.name}</h4>
                  <p className="relative mt-1 text-center text-[10px] font-bold text-cyan-200">{enemy.where}</p>
                  <p className="relative mt-2 min-h-[54px] text-center text-[10px] leading-5 text-slate-400">{enemy.desc}</p>
                  <div className={`relative mt-2 flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-black ${highestUnlockedLevel >= enemy.unlock ? 'border-emerald-200/20 bg-emerald-300/[.07] text-emerald-100' : 'border-amber-200/15 bg-amber-300/[.07] text-amber-100'}`}>{highestUnlockedLevel >= enemy.unlock ? '✓ تم الفتح' : <><Lock className="h-3 w-3" /> يفتح عند المرحلة {enemy.unlock}</>}</div>
                </motion.div>
              ))}
            </div>
            <p className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-500"><ShieldAlert className="h-3.5 w-3.5" /> الوحوش بتتفتح تلقائيًا حسب أعلى مرحلة وصلتِ لها.</p>
          </div>
        </motion.div>

        <motion.div variants={reveal} transition={{ duration: .65 }} className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500"><Trophy className="h-4 w-4 text-amber-300" /><Star className="h-3.5 w-3.5 text-amber-200" /> اجمع النقاط وارفع رقمك القياسي</motion.div>
      </motion.section>

      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-3 pb-[env(safe-area-inset-bottom)]">
        <motion.button type="button" whileHover={{ scale: 1.015, y: -2 }} whileTap={{ scale: .98 }} onClick={onStartAdventure} className="pointer-events-auto flex w-full max-w-2xl items-center justify-between rounded-2xl border border-cyan-100/35 bg-gradient-to-l from-cyan-300 via-cyan-400 to-blue-500 px-5 py-4 text-right text-base font-black text-[#071321] shadow-[0_12px_40px_rgba(0,0,0,.5),0_0_28px_rgba(34,211,238,.16)] backdrop-blur transition">
          <span className="flex items-center gap-3"><Play className="h-5 w-5 fill-current" /> ابدأ اللعب</span>
          <span className="text-xl" aria-hidden="true">←</span>
        </motion.button>
      </div>
    </div>
  );
}
