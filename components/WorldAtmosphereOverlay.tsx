'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface WorldAtmosphereOverlayProps {
  worldId: number;
  variant?: 'arena' | 'card';
}

// Deterministic pseudo-random helper so particles are pure and hydration-safe
function seeded(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default function WorldAtmosphereOverlay({
  worldId,
  variant = 'arena',
}: WorldAtmosphereOverlayProps) {
  const shouldReduceMotion = useReducedMotion();

  const itemCount = variant === 'arena' ? 16 : 9;

  const particles = useMemo(() => {
    return Array.from({ length: itemCount }, (_, i) => ({
      id: i,
      leftPct: Math.round(seeded(i, worldId * 11 + 1) * 94 + 3),
      topPct: Math.round(seeded(i, worldId * 13 + 2) * 84 + 6),
      duration: 5.5 + seeded(i, worldId * 17 + 3) * 5.5,
      delay: seeded(i, worldId * 19 + 4) * 4,
      driftX: (seeded(i, worldId * 23 + 5) - 0.5) * (variant === 'arena' ? 110 : 55),
      scale: 0.7 + seeded(i, worldId * 29 + 6) * 0.65,
      rotateEnd: (seeded(i, worldId * 31 + 7) > 0.5 ? 1 : -1) * (140 + seeded(i, 9) * 180),
    }));
  }, [itemCount, variant, worldId]);

  const shootingStars = useMemo(() => {
    if (worldId < 5) return [];
    const count = variant === 'arena' ? 3 : 2;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      startLeft: 18 + i * 28,
      startTop: 8 + i * 11,
      delay: i * 3.1 + 0.8,
      repeatDelay: 4.5 + i * 2.2,
    }));
  }, [worldId, variant]);

  if (shouldReduceMotion) {
    return null;
  }

  // World 1: Sunny Morning Sakura Petals & Sun Rays
  if (worldId === 1) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-16 right-10 w-64 h-64 rounded-full bg-amber-200/25 blur-3xl" />
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ y: -24, x: 0, opacity: 0, rotate: 0 }}
            animate={{
              y: variant === 'arena' ? ['0%', '108vh'] : ['0%', '260px'],
              x: [0, p.driftX * 0.5, p.driftX],
              opacity: [0, 0.85, 0.85, 0],
              rotate: p.rotateEnd,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ left: `${p.leftPct}%`, scale: p.scale }}
            className="absolute top-0 w-3.5 h-2.5 rounded-full bg-gradient-to-br from-pink-200 to-rose-300 shadow-[0_0_8px_rgba(244,114,182,0.45)]"
          />
        ))}
      </div>
    );
  }

  // World 2: Enchanted Emerald Forest — Falling Leaves & Glowing Fireflies
  if (worldId === 2) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Dappled Forest Sunbeam Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-200/10 via-transparent to-teal-900/10" />

        {/* Falling Forest Leaves */}
        {particles.slice(0, Math.ceil(itemCount * 0.55)).map((p) => (
          <motion.span
            key={`leaf-${p.id}`}
            initial={{ y: -28, x: 0, opacity: 0, rotate: -20 }}
            animate={{
              y: variant === 'arena' ? ['0%', '105vh'] : ['0%', '260px'],
              x: [0, p.driftX * 0.7, -p.driftX * 0.4, p.driftX * 0.6],
              opacity: [0, 0.9, 0.85, 0],
              rotate: [0, 90, -45, p.rotateEnd],
            }}
            transition={{
              duration: p.duration + 1.2,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ left: `${p.leftPct}%`, scale: p.scale }}
            className="absolute top-0 w-4 h-2.5 rounded-tl-full rounded-br-full bg-gradient-to-br from-emerald-300 via-green-400 to-teal-500 shadow-[0_2px_8px_rgba(16,185,129,0.4)]"
          />
        ))}

        {/* Pulsing Forest Fireflies */}
        {particles.slice(Math.ceil(itemCount * 0.55)).map((p) => (
          <motion.span
            key={`firefly-${p.id}`}
            animate={{
              y: [0, -18, 8, -12, 0],
              x: [0, 14, -10, 8, 0],
              opacity: [0.25, 0.95, 0.4, 1, 0.25],
              scale: [0.85, 1.3, 0.95, 1.2, 0.85],
            }}
            transition={{
              duration: 4.2 + (p.id % 3),
              delay: p.delay * 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ left: `${p.leftPct}%`, top: `${p.topPct}%` }}
            className="absolute w-2.5 h-2.5 rounded-full bg-emerald-200 shadow-[0_0_12px_4px_rgba(110,231,183,0.75)]"
          />
        ))}
      </div>
    );
  }

  // World 3: Golden Cherry Valley — Warm Amber & Blossom Petals
  if (worldId === 3) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-12 left-1/3 w-72 h-72 rounded-full bg-amber-300/20 blur-3xl" />
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ y: -24, x: 0, opacity: 0 }}
            animate={{
              y: variant === 'arena' ? ['0%', '108vh'] : ['0%', '260px'],
              x: [0, p.driftX, p.driftX * 0.4],
              opacity: [0, 0.9, 0.85, 0],
              rotate: p.rotateEnd,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ left: `${p.leftPct}%`, scale: p.scale }}
            className={`absolute top-0 w-3.5 h-2.5 rounded-full ${
              p.id % 2 === 0
                ? 'bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                : 'bg-gradient-to-br from-rose-200 to-pink-300 shadow-[0_0_8px_rgba(251,113,133,0.4)]'
            }`}
          />
        ))}
      </div>
    );
  }

  // World 4: Romantic Rose Sunset — Drifting Dusk Petals & Warm Radiance
  if (worldId === 4) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-rose-400/15 via-amber-300/10 to-transparent" />
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ y: -24, x: 0, opacity: 0 }}
            animate={{
              y: variant === 'arena' ? ['0%', '108vh'] : ['0%', '260px'],
              x: [0, -p.driftX * 0.6, p.driftX * 0.8],
              opacity: [0, 0.85, 0.8, 0],
              rotate: p.rotateEnd,
            }}
            transition={{
              duration: p.duration + 0.8,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ left: `${p.leftPct}%`, scale: p.scale }}
            className="absolute top-0 w-3.5 h-2.5 rounded-tl-full rounded-br-full bg-gradient-to-br from-rose-300 via-pink-400 to-amber-200 shadow-[0_0_10px_rgba(244,63,94,0.45)]"
          />
        ))}
      </div>
    );
  }

  // Worlds 5 & 6: Moonlit Cloud Palace & Starry Midnight Sky — Twinkling Stars + Shooting Stars
  const isDeepNight = worldId === 6;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Subtle Celestial Nebula Glow */}
      <div
        className={`absolute -top-20 right-1/4 w-80 h-80 rounded-full blur-3xl ${
          isDeepNight ? 'bg-indigo-400/20' : 'bg-violet-400/20'
        }`}
      />

      {/* Twinkling Stars */}
      {particles.map((p) => (
        <motion.span
          key={`star-${p.id}`}
          animate={{
            opacity: [0.2, 1, 0.3, 0.95, 0.2],
            scale: [0.75, 1.35, 0.85, 1.25, 0.75],
            rotate: [0, 45, 0],
          }}
          transition={{
            duration: 2.6 + (p.id % 4) * 0.7,
            delay: p.delay * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ left: `${p.leftPct}%`, top: `${p.topPct}%` }}
          className={`absolute rounded-full ${
            p.id % 3 === 0
              ? 'w-2 h-2 bg-amber-200 shadow-[0_0_12px_3px_rgba(253,230,138,0.85)]'
              : 'w-1.5 h-1.5 bg-white shadow-[0_0_10px_2px_rgba(224,231,255,0.8)]'
          }`}
        />
      ))}

      {/* Shooting Stars Streaking Across the Night Sky */}
      {shootingStars.map((s) => (
        <motion.div
          key={`shoot-${s.id}`}
          initial={{ x: 0, y: 0, opacity: 0, scaleX: 0.4 }}
          animate={{
            x: [-20, -180],
            y: [0, 110],
            opacity: [0, 1, 0],
            scaleX: [0.4, 1.15, 0.3],
          }}
          transition={{
            duration: 1.15,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: s.repeatDelay,
            ease: 'easeOut',
          }}
          style={{ left: `${s.startLeft}%`, top: `${s.startTop}%` }}
          className="absolute w-20 h-0.5 -rotate-[32deg] rounded-full bg-gradient-to-r from-white via-amber-200 to-transparent shadow-[0_0_10px_rgba(255,255,255,0.9)]"
        />
      ))}
    </div>
  );
}
