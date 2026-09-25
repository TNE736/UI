/**
 * Flowing background waves for the home page hero.
 *
 * Each layer is one wave period drawn twice side by side (200% wide) and slid
 * left by exactly one period on a loop, so the motion never has a seam.
 * Following the skills: ambient motion is linear, runs on transform only (no
 * layout, no animated blur), is slow enough to read as calm rather than
 * busy, and stops entirely for prefers-reduced-motion.
 */

const PERIOD = 1440; // one wave, in SVG units; the layer is two of these wide
const HEIGHT = 640;

/** A smooth sine wave across two periods, closed to the top or bottom edge. */
function wavePath({
  baseline,
  amplitude,
  phase = 0,
  harmonic = 0,
  closeTo,
}: {
  baseline: number;
  amplitude: number;
  phase?: number;
  /** A second, faster ripple layered on top, for a silkier shape. */
  harmonic?: number;
  closeTo: 'top' | 'bottom' | 'none';
}): string {
  const step = 16;
  const points: string[] = [];
  for (let x = 0; x <= PERIOD * 2; x += step) {
    const t = (x / PERIOD) * Math.PI * 2 + phase;
    const y = baseline + amplitude * Math.sin(t) + harmonic * Math.sin(t * 2 + phase * 1.7);
    points.push(`${x},${y.toFixed(1)}`);
  }
  const line = `M${points.join(' L')}`;
  if (closeTo === 'none') return line;
  const edge = closeTo === 'top' ? 0 : HEIGHT;
  return `${line} L${PERIOD * 2},${edge} L0,${edge} Z`;
}

interface Layer {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  /** Seconds for one full period. Longer = calmer. */
  duration: number;
  reverse?: boolean;
}

const LAYERS: Layer[] = [
  // Top: a wide sage silk and a pale linen ribbon under it.
  { d: wavePath({ baseline: 150, amplitude: 46, harmonic: 14, closeTo: 'top' }), fill: 'url(#wave-sage)', duration: 70 },
  { d: wavePath({ baseline: 120, amplitude: 34, phase: 1.3, harmonic: 10, closeTo: 'top' }), fill: 'url(#wave-linen)', duration: 95, reverse: true },
  // Bottom: a moss haze and a lighter linen fold on top of it.
  { d: wavePath({ baseline: 500, amplitude: 50, phase: 2.2, harmonic: 16, closeTo: 'bottom' }), fill: 'url(#wave-moss)', duration: 80, reverse: true },
  { d: wavePath({ baseline: 540, amplitude: 36, phase: 0.6, harmonic: 12, closeTo: 'bottom' }), fill: 'url(#wave-cream)', duration: 60 },
  // Two fine highlight threads, like light catching fabric.
  { d: wavePath({ baseline: 168, amplitude: 44, phase: 0.2, harmonic: 14, closeTo: 'none' }), stroke: 'rgb(255 255 255 / 0.85)', strokeWidth: 1.5, duration: 70 },
  { d: wavePath({ baseline: 486, amplitude: 48, phase: 2.3, harmonic: 15, closeTo: 'none' }), stroke: 'rgb(255 255 255 / 0.7)', strokeWidth: 1.25, duration: 80, reverse: true },
];

export function Waves() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Gradients defined once, shared by every layer. */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="wave-sage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86a98f" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#cfe0d2" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="wave-linen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e4e6da" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f0f1e9" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="wave-moss" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#5a9474" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#c6d9c9" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="wave-cream" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#e9ecdf" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#f4f5ee" stopOpacity="0.7" />
          </linearGradient>
        </defs>
      </svg>

      {LAYERS.map((layer, index) => (
        <svg
          key={index}
          className={layer.reverse ? 'wave-layer wave-layer-reverse' : 'wave-layer'}
          style={{ animationDuration: `${layer.duration}s` }}
          viewBox={`0 0 ${PERIOD * 2} ${HEIGHT}`}
          preserveAspectRatio="none"
        >
          <path
            d={layer.d}
            fill={layer.fill ?? 'none'}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
            vectorEffect={layer.stroke ? 'non-scaling-stroke' : undefined}
          />
        </svg>
      ))}

      {/* Keep the headline area calm and readable. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,var(--bg)_20%,transparent_75%)]" />
    </div>
  );
}
