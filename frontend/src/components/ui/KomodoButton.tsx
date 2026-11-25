import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

export type KomodoButtonVariant = 'cta' | 'primary' | 'secondary' | 'outline' | 'ghost';

interface KomodoButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: KomodoButtonVariant;
  loading?: boolean;
  wrapLabel?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Botón estándar Komodo con animación motion/react y reglas estrictas anti-overflow.
 */
export const KomodoButton: React.FC<KomodoButtonProps> = ({
  variant = 'cta',
  loading = false,
  wrapLabel = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  type = 'button',
  ...props
}) => {
  const variantClasses: Record<KomodoButtonVariant, string> = {
    cta: 'bg-[#10B981] hover:bg-[#059669] text-white shadow-cta border border-emerald-400/20',
    primary:
      'bg-gradient-to-r from-[#4C1D95] via-[#6D28D9] to-[#7C3AED] hover:brightness-110 text-white shadow-komodo border border-violet-400/25',
    secondary:
      'bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#4C1D95] border border-[#DDD6FE]',
    outline:
      'bg-[#15102B] hover:bg-[#1E1838] text-slate-100 border border-violet-500/30',
    ghost:
      'bg-transparent hover:bg-violet-500/15 text-slate-300 hover:text-white border border-transparent',
  };

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : { scale: 1.02 }}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      className={cn(
        'min-h-10 sm:min-h-11 px-4 py-2.5 inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm leading-tight text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-w-full overflow-hidden',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0 inline-flex items-center">{leftIcon}</span>
      )}
      <span className={cn('min-w-0', wrapLabel ? 'whitespace-normal break-words' : 'truncate')}>
        {children}
      </span>
      {!loading && rightIcon && (
        <span className="shrink-0 inline-flex items-center">{rightIcon}</span>
      )}
    </motion.button>
  );
};
