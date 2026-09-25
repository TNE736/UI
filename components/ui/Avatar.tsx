import { cn, initials } from '@/lib/format';

/** A small linen-and-sage palette, picked deterministically per name. No rainbow. */
const TONES = [
  { bg: '#e3ecdf', fg: '#2f6b4f' },
  { bg: '#ece8dc', fg: '#5d5a4c' },
  { bg: '#dde8e1', fg: '#1e4a36' },
  { bg: '#e8ebe0', fg: '#4a5a3e' },
  { bg: '#e6e4da', fg: '#44483d' },
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
        boxShadow: 'inset 0 0 0 1px rgb(21 32 26 / 0.06)',
      }}
    >
      {initials(name)}
    </span>
  );
}
