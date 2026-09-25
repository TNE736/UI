'use client';

import NumberFlow from '@number-flow/react';

/**
 * Digits roll to the new value instead of snapping (NumberFlow), with tabular
 * figures so nothing shifts. NumberFlow honours prefers-reduced-motion.
 */
export function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  return <NumberFlow value={value} suffix={suffix} className="tabular-nums" />;
}
