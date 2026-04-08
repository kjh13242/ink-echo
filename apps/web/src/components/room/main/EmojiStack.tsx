'use client'

import { useReactionStore } from '@/store/reactionStore'
import { cn } from '@/lib/utils'
import type { Emoji } from '@/types'

interface EmojiStackProps {
  inline?: boolean
  onReact: (emoji: Emoji) => void
  onCancel: (emoji: Emoji) => void
}

export function EmojiStack({ inline = false, onReact, onCancel }: EmojiStackProps) {
  const stack = useReactionStore((s) => s.stack)

  if (stack.length === 0) return null

  const positionClass = inline
    ? 'absolute inset-x-0 top-0 z-10 px-4 py-2 flex gap-2 flex-wrap pointer-events-none'
    : 'fixed top-[52px] left-0 right-0 z-20 px-4 py-2 flex gap-2 flex-wrap pointer-events-none'

  return (
    <div className={positionClass}
         style={inline ? undefined : { maxWidth: 430, margin: '0 auto' }}>
      {stack.map(({ emoji, count, myReacted }) => (
        <button
          key={emoji}
          onClick={() => myReacted ? onCancel(emoji as Emoji) : onReact(emoji as Emoji)}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] pointer-events-auto',
            'border transition-all active:scale-95',
            myReacted
              ? 'border-purple-400/60 bg-[rgba(168,158,245,0.2)] text-white backdrop-blur-sm'
              : 'border-white/10 bg-[rgba(0,0,0,0.5)] text-white/70 backdrop-blur-sm'
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
