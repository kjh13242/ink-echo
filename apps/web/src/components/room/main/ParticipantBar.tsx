'use client'

import { useState } from 'react'
import { Avatar } from '@/components/common/Avatar'
import { cn } from '@/lib/utils'
import { EMOJI_LIST } from '@/types'
import { useReactionStore } from '@/store/reactionStore'
import type { Participant, Emoji } from '@/types'

interface ParticipantBarProps {
  participants: Participant[]
  me: Participant
  onOtherTap: (participantId: string) => void
  onMeTap: () => void
  onAddTrack: () => void
}

export function ParticipantBar({
  participants,
  me,
  onOtherTap,
  onMeTap,
  onAddTrack,
}: ParticipantBarProps) {
  const [showEmojiPopup, setShowEmojiPopup] = useState(false)
  const stack = useReactionStore((s) => s.stack)
  const myReactions = stack.filter((r) => r.myReacted).map((r) => r.emoji as Emoji)

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto
                      flex items-center gap-3 px-4 py-3
                      bg-[var(--bg-surface)] border-t border-[var(--border-default)]
                      backdrop-blur-sm z-20">

        {/* 다른 참여자들 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {participants.slice(0, 5).map((p) => (
            <button key={p.participantId} onClick={() => onOtherTap(p.participantId)}>
              <Avatar color={p.avatar} size="sm" isHost={p.isHost} />
            </button>
          ))}
          {participants.length > 5 && (
            <span className="text-caption text-[var(--text-tertiary)]">
              +{participants.length - 5}
            </span>
          )}
        </div>

        {/* 구분선 */}
        <div className="w-px h-6 bg-[var(--border-default)]" />

        {/* 내 캐릭터 */}
        <button onClick={() => setShowEmojiPopup(true)}>
          <Avatar color={me.avatar} size="md" isHost={me.isHost} isMe />
        </button>

        {/* 곡 추가 버튼 */}
        <button
          onClick={onAddTrack}
          className="flex items-center gap-1.5 px-3 h-9 rounded-btn
                     bg-[var(--color-cta)] text-[var(--color-cta-text)]
                     text-body1 font-medium active:opacity-80"
        >
          <PlusIcon />
          <span>곡 추가하기</span>
        </button>
      </div>

      {/* 이모지 팝업 */}
      {showEmojiPopup && (
        <EmojiPopup
          myReactions={myReactions}
          onClose={() => setShowEmojiPopup(false)}
        />
      )}
    </>
  )
}

// ─── EmojiPopup ────────────────────────────────────────
interface EmojiPopupProps {
  myReactions: Emoji[]
  onClose: () => void
}

function EmojiPopup({ myReactions, onClose }: EmojiPopupProps) {
  const stack = useReactionStore((s) => s.stack)

  return (
    <>
      {/* 배경 */}
      <div
        className="fixed inset-0 z-30"
        onClick={onClose}
      />

      {/* 팝업 */}
      <div className="fixed bottom-20 left-4 right-4 max-w-[430px] mx-auto z-40
                      bg-[var(--bg-sheet)] rounded-card border border-[var(--border-default)]
                      p-4 shadow-lg
                      animate-in slide-in-from-bottom-2 duration-200">
        <div className="grid grid-cols-4 gap-3">
          {EMOJI_LIST.map((emoji) => {
            const isReacted = myReactions.includes(emoji)
            const stackItem = stack.find((r) => r.emoji === emoji)

            return (
              <button
                key={emoji}
                onClick={() => {
                  // 선택 시 팝업 닫힘
                  onClose()
                }}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 rounded-btn',
                  'transition-all active:scale-90',
                  isReacted
                    ? 'bg-purple-100 border-2 border-purple-400'
                    : 'bg-[var(--bg-input)] border border-[var(--border-default)]'
                )}
              >
                <span className="text-[22px] leading-none">{emoji}</span>
                {stackItem && (
                  <span className="text-micro text-[var(--text-tertiary)]">
                    {stackItem.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
