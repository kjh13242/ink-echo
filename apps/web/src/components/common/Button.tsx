import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'kakao'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-[var(--color-cta)] text-[var(--color-cta-text)] font-medium active:opacity-80',
  secondary:
    'bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] active:opacity-70',
  ghost:
    'bg-transparent text-[var(--text-secondary)] active:opacity-70',
  danger:
    'bg-error text-white font-medium active:opacity-80',
  kakao:
    'bg-kakao text-[#1A1A1A] font-medium active:opacity-80',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-[10px] rounded-btn',
  md: 'h-[38px] px-4 text-[11px] rounded-btn',
  lg: 'h-11 px-5 text-[13px] rounded-btn-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <button
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center transition-opacity',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-1.5">
          <Spinner />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
    >
      <circle
        cx="7"
        cy="7"
        r="5"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="2"
      />
      <path
        d="M7 2a5 5 0 0 1 5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
