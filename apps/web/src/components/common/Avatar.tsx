import { cn } from '@/lib/utils'
import type { Avatar as AvatarType } from '@/types'

const AVATAR_COLORS: Record<AvatarType, { body: string; shirt: string }> = {
  purple: { body: '#FFD4A8', shirt: '#7F77DD' },
  green:  { body: '#C8E8D0', shirt: '#1D9E75' },
  yellow: { body: '#FFE4B0', shirt: '#F0A030' },
  pink:   { body: '#F4D8F4', shirt: '#D4537E' },
}

type Size = 'sm' | 'md' | 'lg'

const SIZE_MAP: Record<Size, number> = { sm: 28, md: 36, lg: 52 }

interface AvatarProps {
  color: AvatarType
  size?: Size
  isHost?: boolean
  isMe?: boolean
  showBubble?: string | null
  onClick?: () => void
  className?: string
}

export function Avatar({
  color,
  size = 'md',
  isHost = false,
  isMe = false,
  showBubble,
  onClick,
  className,
}: AvatarProps) {
  const px = SIZE_MAP[size]
  const colors = AVATAR_COLORS[color]
  const eyeColor = '#1A1A2E'

  return (
    <div
      className={cn('relative inline-flex flex-col items-center', className)}
      style={{ width: px }}
    >
      {/* 말풍선 */}
      {showBubble && (
        <div
          className={cn(
            'absolute bottom-full mb-1 px-2 py-1 rounded-btn text-[9px]',
            'bg-[var(--bg-surface)] border border-[var(--border-default)]',
            'text-[var(--text-primary)] whitespace-nowrap max-w-[120px] truncate',
            'shadow-sm'
          )}
        >
          {showBubble}
        </div>
      )}

      {/* 방장 왕관 */}
      {isHost && (
        <span
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px]"
          style={{ lineHeight: 1 }}
        >
          👑
        </span>
      )}

      {/* 픽셀 아바타 SVG */}
      <div
        onClick={onClick}
        className={cn(
          'rounded-full overflow-hidden cursor-pointer',
          isMe && 'ring-2 ring-purple-500 ring-offset-1',
          onClick && 'active:scale-95 transition-transform'
        )}
        style={{ width: px, height: px }}
      >
        <svg
          viewBox="0 0 16 16"
          width={px}
          height={px}
          xmlns="http://www.w3.org/2000/svg"
          style={{ imageRendering: 'pixelated' }}
        >
          {/* 배경 */}
          <rect width="16" height="16" fill={colors.shirt} opacity="0.3" />
          {/* 머리 */}
          <rect x="3" y="3" width="10" height="6" rx="1" fill={colors.body} />
          {/* 눈 왼쪽 */}
          <rect x="5" y="5" width="2" height="2" fill={eyeColor} />
          {/* 눈 오른쪽 */}
          <rect x="9" y="5" width="2" height="2" fill={eyeColor} />
          {/* 입 (웃음) */}
          <rect x="6" y="7" width="1" height="1" fill={eyeColor} />
          <rect x="9" y="7" width="1" height="1" fill={eyeColor} />
          {/* 몸통/셔츠 */}
          <rect x="2" y="10" width="12" height="4" rx="1" fill={colors.shirt} />
          {/* 목 */}
          <rect x="6" y="9" width="4" height="2" fill={colors.body} />
        </svg>
      </div>
    </div>
  )
}
