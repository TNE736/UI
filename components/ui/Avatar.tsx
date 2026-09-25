import { cn, initials } from '@/lib/format';

/** A small warm palette, picked deterministically per name. No rainbow. */
const TONES = [
  { bg: '#efe7da', fg: '#6b5a44' },
  { bg: '#f3dfd4', fg: '#8c3f27' },
  { bg: '#e6e2d8', fg: '#4f4b42' },
  { bg: '#e3e8df', fg: '#3f5f47' },
  { bg: '#f1e4cf', fg: '#7a5a22' },
];
function tone(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length]!;
}

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const { bg, fg } = tone(name);
  return (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center rounded-full font-semibold', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        color: fg,
        background: bg,
        boxShadow: 'inset 0 0 0 1px rgb(20 20 19 / 0.06)',
      }}
    >
      {initials(name)}
    </span>
  );
}
