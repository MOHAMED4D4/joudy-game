'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Camera,
  CarFront,
  ChevronRight,
  Crown,
  DoorOpen,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react';

interface RoyalHonorsEventProps {
  portraitSrc: string;
  onBackToHub: () => void;
  onEnterKingdom: () => void;
  onPhotoReward: (amount: number) => void;
}

type EventStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const STAGE_NAMES: Record<EventStage, string> = {
  0: 'الوصول إلى البوابة الملكية',
  1: 'عبور البوابة',
  2: 'استقبال الجمهور',
  3: 'الممر الملكي',
  4: 'العد التنازلي للتكريم',
  5: 'تسليم جائزة التكريم',
  6: 'العودة بالسيارة الرسمية',
  7: 'الوصول إلى المملكة',
  8: 'الدخول إلى القصر',
};

const WAITING_GUESTS = [
  { name: 'ليلى', role: 'منسقة الحفل', mark: '🎀' },
  { name: 'آدم', role: 'مرافق الاستقبال', mark: '🤵' },
  { name: 'نور', role: 'ممثلة الضيوف', mark: '🌟' },
  { name: 'يوسف', role: 'مقدم المراسم', mark: '🎙️' },
];

const BODYGUARDS = [
  { name: 'الحارس الأول', mark: '🛡️' },
  { name: 'الحارس الثاني', mark: '🕴️' },
  { name: 'الحارس الثالث', mark: '🛡️' },
  { name: 'الحارس الرابع', mark: '🕴️' },
];

function AudienceCanvas({ sceneKey }: { sceneKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      // ألف شخصية مرسومة على هيئة صفوف جمهور متفاوتة الحجم لإعطاء عمق بصري.
      const columns = 50;
      const rows = 20;
      const cellW = width / columns;
      const cellH = height / rows;
      const shirts = ['#172554', '#7C2D12', '#9D174D', '#166534', '#334155', '#6B21A8', '#B45309', '#0F766E', '#BE123C'];

      // عند دخول جودي إلى الممر، يتراجع الجمهور ليترك ممراً واضحاً يصل إلى المنصة.
      if (sceneKey === 3) {
        const carpet = ctx.createLinearGradient(width * 0.43, 0, width * 0.57, 0);
        carpet.addColorStop(0, 'rgba(136, 19, 55, 0.05)');
        carpet.addColorStop(0.5, 'rgba(190, 24, 93, 0.72)');
        carpet.addColorStop(1, 'rgba(136, 19, 55, 0.05)');
        ctx.fillStyle = carpet;
        ctx.beginPath();
        ctx.moveTo(width * 0.48, 0);
        ctx.lineTo(width * 0.52, 0);
        ctx.lineTo(width * 0.62, height);
        ctx.lineTo(width * 0.38, height);
        ctx.closePath();
        ctx.fill();
      }

      for (let row = 0; row < rows; row += 1) {
        const depth = (row + 1) / rows;
        const scale = 0.36 + depth * 0.7;
        for (let col = 0; col < columns; col += 1) {
          // إخلاء منتصف الصفوف الأمامية بصرياً لتكوين ممر بين الجمهور.
          if (sceneKey === 3 && row >= 6 && col >= 22 && col <= 27) continue;
          const seed = row * columns + col;
          const jitterX = ((seed * 17) % 9) - 4;
          const jitterY = ((seed * 11) % 7) - 3;
          const x = col * cellW + cellW * 0.5 + jitterX * dpr;
          const y = row * cellH + cellH * 0.53 + jitterY * dpr;
          const headR = Math.max(1.8, 3.2 * scale * dpr);
          const bodyW = Math.max(3.6, 7.4 * scale * dpr);
          const bodyH = Math.max(4.2, 12.5 * scale * dpr);
          const color = shirts[seed % shirts.length];
          const skin = seed % 5 === 0 ? '#C58A68' : seed % 3 === 0 ? '#E2B995' : '#F0C9A7';

          ctx.fillStyle = skin;
          ctx.beginPath();
          ctx.arc(x, y - bodyH * 0.65, headR, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(x - bodyW / 2, y - bodyH * 0.3, bodyW, bodyH, bodyW * 0.32);
          ctx.fill();

          // Raised arms make the front rows read as a cheering audience.
          if ((seed + sceneKey) % 4 !== 0 && row > 8) {
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(1, 1.35 * scale * dpr);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - bodyW * 0.3, y - bodyH * 0.05);
            ctx.lineTo(x - bodyW * 0.72, y - bodyH * 0.62);
            ctx.moveTo(x + bodyW * 0.3, y - bodyH * 0.05);
            ctx.lineTo(x + bodyW * 0.72, y - bodyH * 0.62);
            ctx.stroke();
          }
        }
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [sceneKey]);

  return <canvas ref={canvasRef} className="absolute inset-x-0 bottom-0 h-[38%] w-full opacity-95" aria-label="جمهور الحفل المكوّن من ألف شخص" />;
}

function RoyalGate({ night = false }: { night?: boolean }) {
  return (
    <div className="relative mx-auto h-56 w-64 sm:h-72 sm:w-80">
      <div className="absolute inset-x-4 bottom-0 h-[82%] rounded-t-[9rem] border-[12px] border-amber-300 bg-gradient-to-b from-amber-100/80 to-rose-200/80 shadow-[0_0_50px_rgba(251,191,36,.32)]" />
      <div className="absolute inset-x-11 bottom-0 h-[72%] rounded-t-[7rem] border-x-4 border-t-4 border-amber-600/70 bg-gradient-to-b from-slate-800/10 to-indigo-950/80" />
      <div className="absolute inset-x-0 top-0 flex justify-center">
        <div className="rounded-full border-4 border-amber-300 bg-[#7C173B] px-5 py-2 text-sm font-black tracking-wider text-amber-100 shadow-xl">البوابة الملكية</div>
      </div>
      <div className="absolute bottom-0 left-1/2 h-28 w-1 -translate-x-1/2 bg-amber-200/60 blur-sm" />
      <div className={`absolute inset-0 rounded-t-[9rem] ${night ? 'bg-indigo-400/15' : 'bg-white/25'} pointer-events-none`} />
    </div>
  );
}

function StretchLimo({ moving = false, compact = false }: { moving?: boolean; compact?: boolean }) {
  return (
    <motion.div
      initial={moving ? { x: -430, opacity: 0 } : false}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 1.65, ease: [0.2, 0.75, 0.2, 1] }}
      className={`relative mx-auto ${compact ? 'w-[min(76vw,480px)]' : 'w-[min(92vw,760px)]'}`}
    >
      <div className="absolute -bottom-4 left-[12%] h-7 w-14 rounded-full bg-slate-950 shadow-lg" />
      <div className="absolute -bottom-4 right-[12%] h-7 w-14 rounded-full bg-slate-950 shadow-lg" />
      <div className={`relative ${compact ? 'h-14 rounded-[1.8rem_.9rem_.9rem_1.8rem]' : 'h-24 rounded-[2.6rem_1.2rem_1.2rem_2.6rem] sm:h-32'} border-4 border-slate-300 bg-gradient-to-b from-white via-slate-100 to-slate-400 shadow-[0_22px_28px_rgba(0,0,0,.34)]`}>
        <div className="absolute left-[8%] top-3 h-[50%] w-[13%] rounded-lg border-2 border-slate-500 bg-gradient-to-br from-sky-200 to-slate-700" />
        <div className="absolute left-[24%] top-3 h-[50%] w-[13%] rounded-lg border-2 border-slate-500 bg-gradient-to-br from-sky-200 to-slate-700" />
        <div className="absolute left-[40%] top-3 h-[50%] w-[13%] rounded-lg border-2 border-slate-500 bg-gradient-to-br from-sky-200 to-slate-700" />
        <div className="absolute left-[56%] top-3 h-[50%] w-[13%] rounded-lg border-2 border-slate-500 bg-gradient-to-br from-sky-200 to-slate-700" />
        <div className="absolute left-[72%] top-3 h-[50%] w-[13%] rounded-lg border-2 border-slate-500 bg-gradient-to-br from-sky-200 to-slate-700" />
        <div className="absolute right-[4%] top-1/2 h-8 w-4 -translate-y-1/2 rounded-r-xl bg-amber-100 shadow-inner" />
        <div className="absolute inset-x-[7%] bottom-2 h-1 rounded-full bg-amber-300/90" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-400 bg-white/90 px-3 py-1 text-[10px] font-black text-slate-800 shadow sm:text-xs">مرسيدس ليموزين</div>
      </div>
      {!compact && <p className="mt-5 text-center text-xs font-bold text-white/90">سيارة رسمية ممتدة بطول يقارب 6 أمتار</p>}
    </motion.div>
  );
}

export default function RoyalHonorsEvent({
  portraitSrc,
  onBackToHub,
  onEnterKingdom,
  onPhotoReward,
}: RoyalHonorsEventProps) {
  const [stage, setStage] = useState<EventStage>(0);
  const [countdown, setCountdown] = useState(120);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [coins, setCoins] = useState(0);
  const [showFlash, setShowFlash] = useState(false);

  const audienceScene = (stage >= 2 && stage <= 5) || stage >= 7;
  const nightScene = stage >= 1;

  const advance = useCallback(() => {
    setStage((current) => (Math.min(8, current + 1) as EventStage));
  }, []);

  const takePhoto = useCallback(() => {
    if (photoTaken) return;
    setPhotoTaken(true);
    setCoins((value) => value + 250);
    onPhotoReward(250);
    setShowFlash(true);
    window.setTimeout(() => setShowFlash(false), 500);
  }, [photoTaken, onPhotoReward]);

  useEffect(() => {
    if (stage !== 4) return;
    if (countdown <= 0) {
      setStage(5);
      return;
    }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [stage, countdown]);

  useEffect(() => {
    if (stage !== 5 && stage !== 7 && stage !== 8) return;
    const timer = window.setInterval(() => {
      setShowFlash(true);
      window.setTimeout(() => setShowFlash(false), 180);
    }, 1150);
    return () => window.clearInterval(timer);
  }, [stage]);

  const pageBackground = nightScene
    ? 'from-[#081326] via-[#101B40] to-[#24133E]'
    : 'from-sky-200 via-[#F8EBD9] to-[#F7D8DC]';

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir="rtl"
      className={`relative flex h-[calc(100dvh-1rem)] max-h-[900px] min-h-[620px] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-amber-300/70 bg-gradient-to-b ${pageBackground} shadow-2xl`}
    >
      <div className="relative z-20 flex items-center justify-between gap-3 border-b border-white/15 bg-black/20 px-4 py-3 text-white backdrop-blur-md sm:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[.22em] text-amber-200">المراسم الملكية الرسمية</p>
          <h1 className="truncate text-sm font-black sm:text-lg">رحلة تكريم جودي</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold sm:flex"><Users className="h-3.5 w-3.5" /> ١٬٠٠٠ حاضر</span>
          <span className="rounded-full border border-amber-200/50 bg-amber-300/15 px-3 py-1 text-xs font-bold text-amber-100">{coins} عملة إضافية</span>
          <button onClick={onBackToHub} className="rounded-xl border border-white/20 bg-white/10 p-2 transition hover:bg-white/20" aria-label="العودة إلى القائمة"><ArrowLeft className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 py-5 sm:px-8">
        {nightScene && <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(2px 2px at 12% 18%, #fff 50%, transparent 60%), radial-gradient(1.5px 1.5px at 39% 12%, #fff 50%, transparent 60%), radial-gradient(2px 2px at 72% 21%, #fff 50%, transparent 60%), radial-gradient(1px 1px at 88% 8%, #fff 50%, transparent 60%), radial-gradient(1.5px 1.5px at 57% 31%, #fff 50%, transparent 60%)' }} />}
        {audienceScene && <AudienceCanvas sceneKey={stage} />}

        <div className="relative z-10 mb-4 flex w-full max-w-4xl items-center justify-between gap-2 text-white/85">
          <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[10px] font-bold sm:text-xs">{STAGE_NAMES[stage]}</span>
          <span className="text-[10px] font-semibold sm:text-xs">المشهد {stage + 1} من 9</span>
        </div>

        <AnimatePresence mode="wait">
          {stage === 0 && (
            <motion.div key="gate-day" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="relative z-10 grid w-full max-w-4xl items-center gap-5 rounded-3xl border border-white/40 bg-white/75 p-5 text-center shadow-2xl backdrop-blur-xl sm:grid-cols-2 sm:p-7">
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><Crown className="h-7 w-7" /></div>
                <p className="text-xs font-extrabold text-rose-700">دعوة رسمية</p>
                <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">استعدادات حفل تكريم جودي</h2>
                <p className="text-sm leading-7 text-slate-700">وصلت الدعوة الملكية. أربعة من فريق الاستقبال ينتظرون جودي عند البوابة، والسيارة الرسمية تستعد للدخول إلى ساحة المراسم.</p>
                <div className="grid grid-cols-2 gap-2">
                  {WAITING_GUESTS.map((guest) => <div key={guest.name} className="rounded-xl border border-rose-100 bg-white/85 p-2 text-right"><span className="ml-2 text-xl">{guest.mark}</span><span className="text-xs font-black text-slate-800">{guest.name}</span><p className="mt-0.5 text-[10px] font-semibold text-slate-500">{guest.role}</p></div>)}
                </div>
              </div>
              <div className="space-y-3">
                <RoyalGate />
                <div className="rounded-2xl border border-amber-200 bg-white/80 p-3 text-sm font-bold text-slate-700">الطقس نهاري في العالم الخارجي. عند عبور البوابة تبدأ أجواء الحفل الليلية.</div>
              </div>
              <button onClick={advance} className="sm:col-span-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-rose-700 to-amber-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:brightness-110">التوجه بالسيارة إلى البوابة <ChevronRight className="h-4 w-4" /></button>
            </motion.div>
          )}

          {stage === 1 && (
            <motion.div key="gate-night" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full max-w-4xl text-center text-white">
              <div className="mx-auto mb-2 max-w-lg"><RoyalGate night /></div>
              <StretchLimo moving />
              <h2 className="mt-6 text-2xl font-black text-amber-100 sm:text-3xl">البوابة تفتح… والموكب يدخل</h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-white/80">تعبر جودي بالسيارة الرسمية إلى عالم المراسم. يتبدل المشهد تدريجياً من ضوء النهار إلى ليل المملكة وأضواء الساحة.</p>
              <button onClick={advance} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-amber-300 px-7 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:bg-amber-200">الوصول إلى ساحة الحفل <ChevronRight className="h-4 w-4" /></button>
            </motion.div>
          )}

          {stage === 2 && (
            <motion.div key="crowd-photo" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 w-full max-w-4xl text-center text-white">
              <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full border border-amber-200/40 bg-black/30 px-4 py-2 text-sm font-black text-amber-100"><Users className="h-4 w-4" /> حشد كبير من ألف شخص</div>
              <h2 className="text-3xl font-black sm:text-5xl">«جــــودي! جــــودي!»</h2>
              <p className="mt-2 text-sm font-semibold text-white/85">تنزل جودي من السيارة، فيعلو هتاف الجمهور باسمها. يتقدم أحد المعجبين لالتقاط صورة تذكارية معها وسط التصفيق والكاميرات.</p>
              <div className="mx-auto mt-5 grid max-w-2xl items-center gap-3 rounded-3xl border border-white/20 bg-black/35 p-3 backdrop-blur-md sm:grid-cols-[1fr_auto_1fr] sm:p-4">
                <div className="relative mx-auto h-36 w-32 overflow-hidden rounded-2xl border-2 border-amber-200 shadow-xl sm:h-44 sm:w-40"><Image src={portraitSrc} alt="صورة جودي" fill sizes="160px" className="object-cover object-center" priority /></div>
                <div className="text-2xl font-black text-amber-200">+</div>
                <div className="mx-auto flex h-36 w-32 flex-col items-center justify-center rounded-2xl border-2 border-white/60 bg-gradient-to-b from-sky-200 to-indigo-200 text-slate-900 shadow-xl sm:h-44 sm:w-40"><div className="relative mb-2 h-16 w-16 rounded-full border-4 border-white/80 bg-[#D7A17E] shadow-lg"><div className="absolute left-2 top-5 h-1.5 w-1.5 rounded-full bg-slate-800"/><div className="absolute right-2 top-5 h-1.5 w-1.5 rounded-full bg-slate-800"/><div className="absolute bottom-3 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-rose-700"/><div className="absolute -top-1 left-1/2 h-5 w-14 -translate-x-1/2 rounded-t-full bg-slate-800"/></div><div className="h-7 w-16 rounded-t-2xl bg-indigo-700"/><span className="mt-1 text-[10px] font-black">أحد المعجبين</span><span className="text-[9px] font-semibold">صورة تذكارية مشتركة</span></div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button onClick={takePhoto} disabled={photoTaken} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-xl disabled:bg-emerald-200"><Camera className="h-4 w-4" />{photoTaken ? 'تم التقاط الصورة' : 'التقاط الصورة التذكارية'}</button>
                {photoTaken && <span className="rounded-full border border-emerald-200/50 bg-emerald-400/20 px-4 py-2 text-sm font-black text-emerald-100">+250 عملة</span>}
              </div>
              {photoTaken && <button onClick={advance} className="mt-4 rounded-2xl bg-rose-600 px-7 py-3 text-sm font-black text-white shadow-lg">متابعة إلى الممر الملكي</button>}
            </motion.div>
          )}

          {stage === 3 && (
            <motion.div key="red-carpet" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 w-full max-w-4xl text-center text-white">
              <div className="mx-auto mb-4 flex items-center justify-center gap-2 text-amber-200"><Sparkles className="h-5 w-5" /><span className="text-xs font-black tracking-widest">الممر الملكي</span><Sparkles className="h-5 w-5" /></div>
              <div className="relative mx-auto flex h-48 max-w-xl items-end justify-center overflow-hidden rounded-[2rem] border border-amber-200/40 bg-gradient-to-b from-indigo-950 to-rose-950 shadow-2xl">
                <div className="absolute inset-x-[38%] bottom-0 h-full border-x-4 border-amber-300/60 bg-gradient-to-b from-rose-600/30 via-rose-700/80 to-rose-950" />
                <div className="absolute bottom-0 h-3/4 w-[24%] bg-gradient-to-b from-rose-400 via-red-700 to-red-950 shadow-[0_0_38px_rgba(244,63,94,.5)]" />
                <div className="absolute inset-x-0 bottom-0 flex justify-around text-2xl text-amber-200"><span>✦</span><span>✧</span><span>✦</span><span>✧</span><span>✦</span></div>
                <div className="relative z-10 mb-4 flex h-28 w-24 items-center justify-center rounded-t-full border-2 border-amber-200 bg-white/10 text-6xl shadow-xl">👑</div>
              </div>
              <h2 className="mt-5 text-2xl font-black sm:text-4xl">يفسح الجمهور الطريق لجودي</h2>
              <p className="mt-2 text-sm leading-7 text-white/80">يتراجع الحضور إلى جانبي الممر، وتبقى الصفوف أمام المسرح مفتوحة. تتقدم جودي نحو المنصة وسط التصفيق والهتاف.</p>
              <button onClick={advance} className="mt-5 rounded-2xl bg-amber-300 px-7 py-3 text-sm font-black text-slate-950 shadow-lg">الصعود إلى المسرح</button>
            </motion.div>
          )}

          {stage === 4 && (
            <motion.div key="countdown" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full max-w-3xl rounded-3xl border border-amber-200/50 bg-black/45 p-6 text-center text-white shadow-2xl backdrop-blur-xl sm:p-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300 text-slate-900"><Trophy className="h-8 w-8" /></div>
              <p className="mt-4 text-xs font-black tracking-[.3em] text-amber-200">لحظة التكريم تقترب</p>
              <h2 className="mt-2 text-2xl font-black sm:text-4xl">استعدوا لتسليم الجائزة</h2>
              <div className="mx-auto mt-5 flex h-28 w-52 items-center justify-center rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-100 to-yellow-500 text-5xl font-black tabular-nums text-amber-950 shadow-[0_0_45px_rgba(251,191,36,.3)]">{String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}</div>
              <p className="mt-4 text-sm text-white/80">الجمهور في أماكنه، والكاميرات موجهة إلى المسرح.</p>
              <button onClick={() => setStage(5)} className="mt-5 rounded-xl border border-white/25 bg-white/10 px-5 py-2 text-xs font-bold text-white transition hover:bg-white/20">تجاوز الانتظار ومتابعة المراسم</button>
            </motion.div>
          )}

          {stage === 5 && (
            <motion.div key="award" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 w-full max-w-4xl text-center text-white">
              <div className="relative mx-auto mb-4 flex h-36 w-36 items-center justify-center rounded-full border-4 border-amber-200 bg-gradient-to-br from-yellow-100 to-amber-500 shadow-[0_0_65px_rgba(251,191,36,.5)]"><Trophy className="h-20 w-20 text-amber-900" /><Star className="absolute -right-3 top-2 h-8 w-8 fill-amber-200 text-amber-200" /></div>
              <div className="mx-auto mb-3 w-fit rounded-full border border-amber-200/50 bg-black/35 px-5 py-2 text-sm font-black text-amber-100">شاشة التكريم الرسمية</div>
              <h2 className="text-3xl font-black sm:text-5xl">تكريم جودي</h2>
              <p className="mt-2 text-sm leading-7 text-white/85">يصعد مقدم الحفل إلى المسرح، ويقدم الكأس إلى جودي. تُضاء المنصة وتلتقط الكاميرات لحظة استلام الجائزة، مع ومضات تصوير متتابعة.</p>
              <div className="mx-auto mb-3 flex max-w-lg items-center justify-center gap-3 rounded-2xl border border-amber-200/30 bg-black/30 p-3 text-right backdrop-blur"><span className="text-4xl">🤵🏻</span><div><p className="text-xs font-black text-amber-200">مقدم الحفل</p><p className="text-[10px] text-white/80">يسلّم جودي كأس التميّز أمام عدسات المصورين</p></div><Trophy className="h-9 w-9 text-amber-300" /></div>
              <div className="mx-auto mt-5 flex max-w-lg items-center justify-center gap-3 rounded-2xl border border-white/20 bg-black/35 p-3 backdrop-blur"><div className="relative h-20 w-16 overflow-hidden rounded-xl border-2 border-amber-200"><Image src={portraitSrc} alt="جودي أثناء التكريم" fill sizes="64px" className="object-cover" /></div><div className="text-right"><p className="text-xs font-bold text-amber-200">صاحبة التكريم</p><p className="text-xl font-black">جودي</p><p className="text-[10px] text-white/70">الجائزة الملكية للتميّز</p></div><Trophy className="mr-auto h-12 w-12 text-amber-300" /></div>
              <button onClick={advance} className="mt-5 rounded-2xl bg-amber-300 px-7 py-3 text-sm font-black text-slate-950 shadow-lg">استلام الكأس والتوجه إلى السيارة</button>
            </motion.div>
          )}

          {stage === 6 && (
            <motion.div key="return-car" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 w-full max-w-4xl text-center text-white">
              <div className="mx-auto mb-4 w-fit rounded-full border border-amber-200/40 bg-black/30 px-4 py-2 text-xs font-black text-amber-100">موكب العودة الرسمي</div>
              <h2 className="mb-2 text-2xl font-black sm:text-4xl">السيارة تنتظر جودي أمام المسرح</h2>
              <StretchLimo />
              <div className="mx-auto mt-5 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">{BODYGUARDS.map((guard) => <div key={guard.name} className="rounded-xl border border-white/20 bg-black/30 p-2"><span className="text-2xl">{guard.mark}</span><p className="mt-1 text-[10px] font-bold text-white">{guard.name}</p></div>)}</div>
              <div className="mx-auto mt-3 w-fit rounded-xl border border-white/20 bg-black/30 px-4 py-2 text-xs font-bold text-white/85">🤵 سائق رسمي يقود السيارة إلى المملكة</div>
              <p className="mt-2 text-xs text-white/75">يرافق جودي أربعة حراس أمن داخل السيارة طوال طريق العودة.</p>
              <button onClick={advance} className="mt-5 rounded-2xl bg-amber-300 px-7 py-3 text-sm font-black text-slate-950 shadow-lg">الانطلاق عبر الطريق الطويل</button>
            </motion.div>
          )}

          {stage === 7 && (
            <motion.div key="night-kingdom" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 w-full max-w-4xl text-center text-white">
              <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full border border-amber-200/40 bg-black/30 px-4 py-2 text-xs font-black text-amber-100"><CarFront className="h-4 w-4" /> الطريق إلى المملكة</div>
              <div className="relative mx-auto h-40 max-w-3xl overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-800 shadow-2xl">
                <div className="absolute inset-x-0 bottom-0 h-16 bg-slate-950" />
                <div className="absolute bottom-7 left-0 right-0 h-1 border-t-2 border-dashed border-amber-200/80" />
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden"><motion.div animate={{ x: ['-28%', '28%'] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} className="w-full"><StretchLimo compact /></motion.div></div>
                <div className="absolute right-5 top-4 text-xl text-amber-100">✦　✧　　 ✦</div>
                <div className="absolute left-5 top-8 text-lg text-amber-100">✧　　 ✦</div>
              </div>
              <h2 className="mt-5 text-2xl font-black sm:text-4xl">وصلت جودي إلى مملكتها</h2>
              <p className="mt-2 text-sm leading-7 text-white/80">بعد رحلة طويلة على طريق مضاء تحت سماء الليل، تظهر بوابة المملكة. الجمهور نفسه ينتظر في الساحة، وتبدأ الكاميرات في التقاط الصور من جديد.</p>
              <div className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-2">{BODYGUARDS.map((guard) => <span key={guard.name} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold">{guard.mark} {guard.name}</span>)}</div>
              <button onClick={advance} className="mt-5 rounded-2xl bg-amber-300 px-7 py-3 text-sm font-black text-slate-950 shadow-lg">النزول من السيارة ودخول القصر</button>
            </motion.div>
          )}

          {stage === 8 && (
            <motion.div key="palace-end" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 w-full max-w-4xl rounded-3xl border border-amber-200/50 bg-black/40 p-5 text-center text-white shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-300 text-amber-950"><DoorOpen className="h-9 w-9" /></div>
              <h2 className="text-3xl font-black text-amber-100 sm:text-4xl">عودة جودي إلى القصر الملكي</h2>
              <div className="mx-auto mt-5 grid max-w-2xl items-center gap-4 sm:grid-cols-[140px_1fr]">
                <div className="relative mx-auto h-40 w-32 overflow-hidden rounded-2xl border-2 border-amber-200 shadow-2xl"><Image src={portraitSrc} alt="جودي بعد التكريم" fill sizes="128px" className="object-cover" /></div>
                <div className="text-right text-sm leading-8 text-white/85"><p>يتقدم الحراس الأربعة لتأمين المدخل، ثم يرافقون جودي عبر الساحة حتى أبواب القصر.</p><p className="mt-2 font-black text-amber-200">تنتهي المراسم بدخول جودي إلى القصر، فيما تستمر أضواء التصوير خارج البوابة.</p></div>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button onClick={onEnterKingdom} className="rounded-2xl bg-gradient-to-l from-amber-300 to-yellow-500 px-6 py-3 text-sm font-black text-slate-950 shadow-lg">استكشاف المملكة</button>
                <button onClick={onBackToHub} className="rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20">القائمة الرئيسية</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {showFlash && <div className="pointer-events-none absolute inset-0 z-30 bg-white/85" />}
        {audienceScene && <div className="pointer-events-none absolute bottom-[36%] left-0 right-0 z-[1] flex justify-center gap-4 text-amber-100/90"><span className="animate-bounce text-xl">👏</span><span className="text-sm font-black tracking-[.3em]">جــــودي</span><span className="animate-bounce text-xl">👏</span></div>}
      </div>

      <footer className="relative z-20 flex items-center justify-between gap-3 border-t border-white/15 bg-black/25 px-4 py-2.5 text-white/75 backdrop-blur-md sm:px-6">
        <span className="truncate text-[10px] font-semibold sm:text-xs">{STAGE_NAMES[stage]}</span>
        <div className="flex items-center gap-1.5">{Array.from({ length: 9 }, (_, index) => <span key={index} className={`h-1.5 rounded-full transition-all ${index === stage ? 'w-7 bg-amber-300' : index < stage ? 'w-3 bg-emerald-300' : 'w-3 bg-white/25'}`} />)}</div>
      </footer>
    </motion.section>
  );
}
