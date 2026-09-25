'use client';

import { useEffect, useState } from 'react';
import { AnimatedNumber } from '@/components/ui/Number';

const SIZE = 168;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A single rate as a ring. It draws once when it first appears, then any
 * later change is a transition that retargets smoothly from where it is.
 * (stroke-dashoffset on one small SVG: cheap, and nothing else lays out.)
 */
export function RateRing({ rate, caption }: { rate: number; caption: string }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const clamped = Math.min(Math.max(rate, 0), 1);
  // Show at least a sliver when the rate is tiny but not zero, so it reads as "some".
  const visible = clamped > 0 ? Math.max(clamped, 0.015) : 0;
  const offset = CIRCUMFERENCE * (1 - (drawn ? visible : 0));

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--surface-3)" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-[40px] font-semibold leading-none text-ink">
              <AnimatedNumber value={Math.round(clamped * 1000) / 10} suffix="%" />
            </p>
            <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">rate</p>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-[13.5px] text-muted">{caption}</p>
    </div>
  );
}
