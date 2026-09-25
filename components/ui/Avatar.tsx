import { cn, initials } from '@/lib/format';

/** Deterministic hue per name, so the same person always gets the same colour. */
function hue(name: string): number {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const h = hue(name);
  return (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center rounded-full font-semibold', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        color: '#fff',
        background: `linear-gradient(135deg, hsl(${h} 78% 62%), hsl(${(h + 45) % 360} 72% 52%))`,
        boxShadow: `0 4px 10px -4px hsl(${h} 70% 45% / 0.6)`,
      }}
    >
      {initials(name)}
    </span>
  );
}
