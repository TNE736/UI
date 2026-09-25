import { cn } from '@/lib/format';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-on-ink shadow-glow hover:bg-ink-hover',
  secondary: 'border border-line-strong bg-white text-ink hover:border-ink/40',
  ghost: 'text-muted hover:bg-surface-2 hover:text-ink',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
}

/** Press feedback on every button: scale(0.97), 160 ms, strong ease-out. */
export function Button({ variant = 'secondary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        'press inline-flex select-none items-center justify-center gap-2 rounded-full font-medium',
        'transition-[background-color,color,filter,box-shadow] duration-150 ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-45',
        size === 'sm' ? 'h-8 px-3.5 text-[13px]' : 'h-10 px-5 text-sm',
        VARIANTS[variant],
        className
      )}
      {...rest}
    />
  );
}
