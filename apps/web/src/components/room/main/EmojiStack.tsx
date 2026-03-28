'use client'

import { useReactionStore } from '@/store/reactionStore'
import { cn } from '@/lib/utils'
import type { Emoji } from '@/types'

interface EmojiStackProps {
  onReact: (emoji: Emoji) => void
  onCancel: (emoji: Emoji) => void
}

export function EmojiStack({ onReact, onCancel }: EmojiStackProps) {
  const stack = useReactionStore((s) => s.stack)

  if (stack.length === 0) return null

  return (
    <div className="px-4 py-2 flex gap-2 flex-wrap bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
      {stack.map(({ emoji, count, myReacted }) => (
        <button
          key={emoji}
          onClick={() => myReacted ? onCancel(emoji as Emoji) : onReact(emoji as Emoji)}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px]',
            'border transition-all active:scale-95',
            myReacted
              ? 'border-purple-400 bg-purple-100 text-purple-800'
              : 'border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-secondary)]'
          )}
        >
          <span>{emoji}</span>
          <span className="font-medium">{count}</span>
          {myReacted && (
            <span className="w-1 h-1 rounded-full bg-purple-500 ml-0.5" />
          )}
        </button>
      ))}
    </div>
  )
}
