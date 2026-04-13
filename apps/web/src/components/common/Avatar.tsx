import { cn } from '@/lib/utils'
import { LineArtAvatar } from './LineArtAvatars'
import type { Avatar as AvatarType } from '@/types'

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

  return (
    <div
      className={cn('relative inline-flex flex-col items-center', className)}
      style={{ width: px }}
    >
      {/* 말풍선 */}
      {showBubble && (
        <div
          className={cn(
            'absolute bottom-full mb-1 px-2 py-1 rounded-btn text-[13px]',
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
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-[13px]"
          style={{ lineHeight: 1 }}
        >
          👑
        </span>
      )}

      {/* 라인아트 아바타 */}
      <div
        onClick={onClick}
        className={cn(
          'rounded-full overflow-hidden',
          isMe && 'ring-2 ring-purple-400 ring-offset-1 ring-offset-[#0A0A0A]',
          onClick && 'cursor-pointer active:scale-95 transition-transform'
        )}
        style={{ width: px, height: px }}
      >
        <LineArtAvatar id={color} size={px}/>
      </div>
    </div>
  )
}
