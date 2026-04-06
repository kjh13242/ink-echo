import { Avatar } from './Avatar'
import { Button } from './Button'
import type { Avatar as AvatarType } from '@/types'

interface EmptyStateProps {
  message: string
  avatarColor?: AvatarType
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  message,
  avatarColor = 'purple',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <Avatar
        color={avatarColor}
        size="lg"
        showBubble={message}
      />
      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          className="mt-2"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
