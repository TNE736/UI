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
        color: `hsl(${h} 70% 72%)`,
        background: `linear-gradient(135deg, hsl(${h} 60% 45% / 0.28), hsl(${(h + 40) % 360} 60% 45% / 0.18))`,
        boxShadow: `inset 0 0 0 1px hsl(${h} 60% 60% / 0.25)`,
      }}
    >
      {initials(name)}
    </span>
  );
}
