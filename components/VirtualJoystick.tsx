'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface JoystickVector {
  x: number;
  y: number;
  magnitude: number;
}

interface VirtualJoystickProps {
  onChange: (vector: JoystickVector) => void;
  disabled?: boolean;
}

const OUTER_RADIUS = 56;
const KNOB_MAX_TRAVEL = 36;

export default function VirtualJoystick({ onChange, disabled = false }: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const resetStick = useCallback(() => {
    pointerIdRef.current = null;
    setIsActive(false);
    setKnobOffset({ x: 0, y: 0 });
    onChange({ x: 0, y: 0, magnitude: 0 });
  }, [onChange]);

  useEffect(() => {
    if (disabled) {
      pointerIdRef.current = null;
      onChange({ x: 0, y: 0, magnitude: 0 });
    }
  }, [disabled, onChange]);

  useEffect(() => {
    const onBlur = () => resetStick();
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [resetStick]);

  const updateFromClientPos = useCallback(
    (clientX: number, clientY: number) => {
      const el = baseRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const rawDx = clientX - centerX;
      const rawDy = clientY - centerY;
      const dist = Math.hypot(rawDx, rawDy);

      if (dist < 2) {
        setKnobOffset({ x: 0, y: 0 });
        onChange({ x: 0, y: 0, magnitude: 0 });
        return;
      }

      const clampedDist = Math.min(KNOB_MAX_TRAVEL, dist);
      const nx = rawDx / dist;
      const ny = rawDy / dist;
      const ox = nx * clampedDist;
      const oy = ny * clampedDist;
      const magnitude = clampedDist / KNOB_MAX_TRAVEL;

      setKnobOffset({ x: ox, y: oy });
      onChange({
        x: nx * magnitude,
        y: ny * magnitude,
        magnitude,
      });
    },
    [onChange],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    pointerIdRef.current = e.pointerId;
    setIsActive(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unsupported
    }
    updateFromClientPos(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || pointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    updateFromClientPos(e.clientX, e.clientY);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current === e.pointerId) {
      resetStick();
    }
  };

  const effectiveIsActive = disabled ? false : isActive;
  const effectiveKnobOffset = disabled ? { x: 0, y: 0 } : knobOffset;

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="عصا التحكم في الحركة"
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
      style={{ width: OUTER_RADIUS * 2, height: OUTER_RADIUS * 2 }}
      className={`relative rounded-full border-2 flex items-center justify-center touch-none select-none transition-colors ${
        disabled ? 'opacity-40 pointer-events-none' : 'cursor-grab active:cursor-grabbing'
      } ${
        effectiveIsActive
          ? 'bg-rose-500/35 border-rose-300 shadow-[0_0_26px_rgba(244,63,94,0.45)]'
          : 'bg-white/75 border-white shadow-[0_10px_28px_rgba(45,24,36,0.2)]'
      }`}
    >
      {/* Subtle 4-Direction Crosshair Markers */}
      <span className="absolute top-2 text-[10px] font-extrabold text-rose-700/75 pointer-events-none">
        ▲
      </span>
      <span className="absolute bottom-2 text-[10px] font-extrabold text-rose-700/75 pointer-events-none">
        ▼
      </span>
      <span className="absolute left-2.5 text-[10px] font-extrabold text-rose-700/75 pointer-events-none">
        ◀
      </span>
      <span className="absolute right-2.5 text-[10px] font-extrabold text-rose-700/75 pointer-events-none">
        ▶
      </span>

      {/* Inner Ring Track */}
      <div className="w-16 h-16 rounded-full border border-rose-300/60 pointer-events-none" />

      {/* Draggable Analog Thumb Knob */}
      <div
        style={{
          transform: `translate3d(${effectiveKnobOffset.x}px, ${effectiveKnobOffset.y}px, 0)`,
        }}
        className={`absolute w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center pointer-events-none transition-shadow ${
          effectiveIsActive
            ? 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-[0_4px_16px_rgba(244,63,94,0.65)]'
            : 'bg-gradient-to-br from-rose-400 to-pink-500'
        }`}
      >
        <div className="w-4 h-4 rounded-full bg-white/45" />
      </div>
    </div>
  );
}
