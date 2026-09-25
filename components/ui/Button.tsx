import { cn } from '@/lib/format';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[image:var(--grad-brand)] text-on-accent shadow-glow hover:brightness-110',
  secondary: 'border border-line bg-white text-fg shadow-card hover:border-accent/40 hover:text-accent',
  ghost: 'text-muted hover:bg-accent-soft hover:text-accent',
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
        'press inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium',
        'transition-[background-color,color,filter,box-shadow] duration-150 ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-45',
        size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm',
        VARIANTS[variant],
        className
      )}
      {...rest}
    />
  );
}
