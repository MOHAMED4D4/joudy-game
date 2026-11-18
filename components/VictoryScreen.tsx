'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Crown,
  Gift,
  Heart,
  Map as MapIcon,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react';
import { loadTransparentSprite } from '@/lib/spriteUtils';
import { GRAND_VICTORY_MESSAGE, type LevelConfig } from '@/lib/levels';
import { computeLevelStars } from '@/lib/storage';
import type { GameRunStats } from './GameArena';

interface VictoryScreenProps {
  levelConfig: LevelConfig;
  realImageSrc: string;
  animeImageSrc: string;
  stats: GameRunStats;
  highScore: number;
  isNewHighScore: boolean;
  onNextLevel: () => void;
  onPlayAgain: () => void;
  onOpenWorldMap: () => void;
}

export default function VictoryScreen({
  levelConfig,
  realImageSrc,
  animeImageSrc,
  stats,
  highScore,
  isNewHighScore,
  onNextLevel,
  onPlayAgain,
  onOpenWorldMap,
}: VictoryScreenProps) {
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const [transparentAnimeSrc, setTransparentAnimeSrc] = useState<string>(animeImageSrc);
  const [giftOpened, setGiftOpened] = useState(false);

  const isGrandFinale = levelConfig.level === 30;
  const starsEarned = computeLevelStars(stats.obstaclesHit);

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

  // Celebratory Confetti + Hearts + Sakura Petals + Fireworks (Grand Finale!)
  useEffect(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#F43F5E', '#EC4899', '#FBBF24', '#10B981', '#8B5CF6', '#FB7185'];
    const pieceCount = isGrandFinale ? 110 : 75;

    const pieces = Array.from({ length: pieceCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight - window.innerHeight,
      vx: (Math.random() - 0.5) * 70,
      vy: 90 + Math.random() * 120,
      size: 6 + Math.random() * 7,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 4.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      kind: Math.random() < 0.35 ? 'heart' : Math.random() < 0.65 ? 'petal' : 'rect',
    }));

    interface FireworkSpark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      size: number;
    }
    let sparks: FireworkSpark[] = [];
    let fireworkTimer = 0;

    const spawnFirework = () => {
      const fx = window.innerWidth * (0.15 + Math.random() * 0.7);
      const fy = window.innerHeight * (0.12 + Math.random() * 0.38);
      const baseColor = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 34; i++) {
        const angle = (Math.PI * 2 * i) / 34 + Math.random() * 0.15;
        const speed = 90 + Math.random() * 170;
        sparks.push({
          x: fx,
          y: fy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 0.9 + Math.random() * 0.4,
          color: baseColor,
          size: 2.5 + Math.random() * 2.5,
        });
      }
    };

    if (isGrandFinale) {
      spawnFirework();
      spawnFirework();
    }

    let last = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isGrandFinale) {
        fireworkTimer += dt;
        if (fireworkTimer > 0.75) {
          fireworkTimer = 0;
          spawnFirework();
        }
      }

      for (const p of pieces) {
        p.x += p.vx * dt + Math.sin(now * 0.002 + p.y * 0.01) * 18 * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;

        if (p.y > canvas.height + 24) {
          p.y = -24;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;

        if (p.kind === 'heart') {
          const s = p.size * 0.6;
          ctx.beginPath();
          ctx.moveTo(0, s);
          ctx.bezierCurveTo(-s * 1.6, -s * 0.2, -s * 0.8, -s * 1.5, 0, -s * 0.5);
          ctx.bezierCurveTo(s * 0.8, -s * 1.5, s * 1.6, -s * 0.2, 0, s);
          ctx.fill();
        } else if (p.kind === 'petal') {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.7, p.size * 0.38, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size * 0.6, -p.size * 0.35, p.size * 1.2, p.size * 0.7);
        }
        ctx.restore();
      }

      sparks = sparks.filter((s) => {
        s.life += dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 120 * dt;
        const alpha = Math.max(0, 1 - s.life / s.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return s.life < s.maxLife;
      });

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [isGrandFinale]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4 py-6 overflow-hidden"
    >
      {/* Confetti, Hearts, Petals & Fireworks Overlay */}
      <canvas
        ref={confettiCanvasRef}
        className="fixed inset-0 pointer-events-none z-10"
        aria-hidden="true"
      />

      <div className="relative z-20 w-full max-w-4xl mx-auto">
        {/* Victory Headline */}
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-5"
        >
          <div className="inline-flex items-center gap-2 text-cyan-300 font-bold text-sm mb-1.5">
            {isGrandFinale ? (
              <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
            ) : (
              <Trophy className="w-4 h-4 text-amber-500" />
            )}
            <span>
              {isGrandFinale
                ? 'التتويج الأسطوري — اجتزتِ كل المستويات الـ 30!'
                : `اكتمل المستوى ${levelConfig.level} بنجاح!`}
            </span>
          </div>
          <h1
            className="text-3xl sm:text-5xl font-bold text-white leading-tight"
            style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
          >
            {isGrandFinale
              ? 'اكتملت المغامرة'
              : 'تم اجتياز المرحلة'}
          </h1>
        </motion.div>

        {/* Visual Novel Celebration Window with Real Portrait + Anime Chibi Side-by-Side */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="bg-[#101b2b]/95 backdrop-blur-md border border-white/10 rounded-3xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.55)] p-5 sm:p-8 text-slate-100"
        >
          {/* Side-by-Side Character Showcase + VN Text */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Real Photo + Anime Companion Pair */}
            <div className="md:col-span-5 flex items-center justify-center gap-3 sm:gap-4">
              {/* Real Photo */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-[3px] border-white shadow-lg ring-2 ring-rose-300 shrink-0">
                <Image
                  src={realImageSrc}
                  alt="صورة جودي الحقيقية"
                  fill
                  sizes="160px"
                  referrerPolicy="no-referrer"
                  className="object-cover object-center"
                />
              </div>

              {/* Anime Chibi */}
              <div className="relative w-32 h-36 sm:w-40 sm:h-44 shrink-0 animate-float-slow">
                <div className="absolute inset-2 rounded-full bg-gradient-to-t from-emerald-200/50 via-rose-200/45 to-amber-200/40 blur-lg" />
                <Image
                  src={transparentAnimeSrc}
                  alt="شخصية جودي الأنمي"
                  fill
                  sizes="160px"
                  referrerPolicy="no-referrer"
                  className="relative object-contain drop-shadow-[0_12px_20px_rgba(45,24,36,0.22)]"
                />
              </div>
            </div>

            {/* Visual Novel Dialogue Box Content */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 bg-gradient-to-l from-rose-500 to-pink-500 text-white font-bold text-sm px-4 py-1.5 rounded-2xl shadow-sm">
                  <Heart className="w-4 h-4 fill-white" />
                  <span>جودي</span>
                </div>

                {/* Stars Earned */}
                <div className="flex items-center gap-1" aria-label={`${starsEarned} من 3 نجوم`}>
                  {[1, 2, 3].map((idx) => (
                    <Star
                      key={idx}
                      className={`w-6 h-6 ${
                        idx <= starsEarned
                          ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Main Message */}
              <p className="text-base sm:text-xl font-bold text-slate-100 leading-relaxed">
                {isGrandFinale
                  ? 'تم إنهاء جميع المستويات الثلاثين.'
                  : `تم إنهاء المستوى ${levelConfig.level} — ${levelConfig.worldName}. النتيجة: ${stats.score} نقطة.`}
              </p>

              {/* Run Summary */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-semibold text-slate-300 tabular-nums">
                <span className="text-rose-700 font-extrabold">النقاط: {stats.score}</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 font-bold">
                  الرقم القياسي لجودي: {highScore}
                  {isNewHighScore ? ' (جديد!)' : ''}
                </span>
                <span aria-hidden="true">·</span>
                <span>🐱 {stats.cats} · 🌹 {stats.roses} · 🍫 {stats.chocolates}</span>
              </div>
            </div>
          </div>

          {/* Dedicated Secret Gift / Special Message Box */}
          <div className="mt-6 pt-5 border-t border-white/10">
            {!giftOpened ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setGiftOpened(true)}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-l from-amber-50 via-rose-50 to-emerald-50 border border-amber-300/80 text-[#2D1824] font-bold text-sm sm:text-base hover:border-rose-400 transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer"
              >
                <Gift className="w-5 h-5 text-rose-500" />
                <span>فتح الهدية السرية / رسالة خاصة لـ جودي 🎁</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28 }}
                className="rounded-2xl bg-gradient-to-br from-[#FFF6F9] via-[#FFFDF7] to-[#F2FAF6] border border-rose-200 p-4 sm:p-5 text-center space-y-2"
              >
                <div className="text-xs font-extrabold text-rose-600 flex items-center justify-center gap-1.5">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>رسالة سرية خاصة إلى جودي</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed">
                  {isGrandFinale
                    ? 'شكراً لكِ يا جودي على مشاركتكِ في هذه الرحلة. نتمنى لكِ استمرار النجاح والتقدم.'
                    : levelConfig.secretNote}
                </p>
              </motion.div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {!isGrandFinale ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={onNextLevel}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-l from-rose-500 via-pink-500 to-rose-600 text-white font-bold text-base sm:text-lg shadow-[0_10px_28px_-6px_rgba(244,63,94,0.5)] hover:shadow-[0_14px_34px_-6px_rgba(244,63,94,0.65)] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>المستوى التالي ({levelConfig.level + 1})</span>
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={onOpenWorldMap}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-l from-amber-500 via-rose-500 to-pink-600 text-white font-bold text-base sm:text-lg shadow-[0_10px_28px_-6px_rgba(244,63,94,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Crown className="w-5 h-5" />
                <span>استعراض خريطة الأبطال (30 / 30)</span>
              </motion.button>
            )}

            <button
              type="button"
              onClick={onOpenWorldMap}
              className="py-3.5 px-5 rounded-2xl border border-rose-200 bg-[#FFF7FA] hover:bg-rose-100/70 text-[#2D1824] font-bold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <MapIcon className="w-4 h-4 text-rose-600" />
              <span>خريطة المستويات</span>
            </button>

            <button
              type="button"
              onClick={onPlayAgain}
              className="py-3.5 px-5 rounded-2xl border border-rose-200 bg-white hover:bg-rose-50 text-[#2D1824] font-bold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>إعادة المستوى</span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
