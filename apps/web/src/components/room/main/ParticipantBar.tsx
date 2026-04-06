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
  onAddTrack: () => void
  onReact: (emoji: Emoji) => void
  onCancel: (emoji: Emoji) => void
}

export function ParticipantBar({
  participants,
  me,
  onOtherTap,
  onAddTrack,
  onReact,
  onCancel,
}: ParticipantBarProps) {
  const [showEmojiPopup, setShowEmojiPopup] = useState(false)
  const stack = useReactionStore((s) => s.stack)
  const myReactions = stack.filter((r) => r.myReacted).map((r) => r.emoji as Emoji)

  return (
    <>
      <div className="sticky bottom-0 left-0 right-0 z-20 flex-shrink-0"
           style={{
             borderTop: '0.5px solid rgba(255,255,255,0.08)', background: '#111118',
             padding: '8px 14px 14px', display: 'flex', alignItems: 'center', gap: 8
           }}>

        <div className="flex gap-[4px] items-center flex-1 overflow-x-auto scrollbar-hide">
          {/* 내 캐릭터 */}
          <button onClick={() => setShowEmojiPopup(true)} className="flex-shrink-0">
            <Avatar color={me.avatar} size="sm" isHost={me.isHost} isMe />
          </button>

          {/* 구분선 */}
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)', margin: '0 4px' }} className="flex-shrink-0" />

          {/* 다른 참여자들 */}
          {participants.slice(0, 5).map((p) => (
            <button key={p.participantId} onClick={() => onOtherTap(p.participantId)} className="flex-shrink-0">
              <Avatar color={p.avatar} size="sm" isHost={p.isHost} />
            </button>
          ))}
          {participants.length > 5 && (
            <span className="text-caption text-[var(--text-tertiary)] flex-shrink-0 ml-1">
              +{participants.length - 5}
            </span>
          )}

          {/* 빈 슬롯 (총원이 5명 이하일 경우 3개 정도 보이게) */}
          {participants.length < 3 && Array.from({ length: 3 - participants.length }).map((_, i) => (
            <div key={`empty-${i}`} className="flex-shrink-0" style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px dashed rgba(180,176,220,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                <line x1="6" y1="2" x2="6" y2="10" stroke="#C0BCD8" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="2" y1="6" x2="10" y2="6" stroke="#C0BCD8" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
          ))}
        </div>

        {/* 곡 추가 버튼 */}
        <button
          onClick={onAddTrack}
          className="active:opacity-80 transition-opacity flex-shrink-0"
          style={{
            height: 40, borderRadius: 10, background: '#7F77DD', color: 'white',
            fontSize: 13, fontWeight: 500, padding: '0 14px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'inherit'
          }}
        >
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <line x1="6" y1="1" x2="6" y2="11" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            <line x1="1" y1="6" x2="11" y2="6" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          곡 추가하기
        </button>
      </div>

      {/* 이모지 팝업 */}
      {showEmojiPopup && (
        <EmojiPopup
          myReactions={myReactions}
          onReact={onReact}
          onCancel={onCancel}
          onClose={() => setShowEmojiPopup(false)}
        />
      )}
    </>
  )
}

// ─── EmojiPopup ────────────────────────────────────────
interface EmojiPopupProps {
  myReactions: Emoji[]
  onReact: (emoji: Emoji) => void
  onCancel: (emoji: Emoji) => void
  onClose: () => void
}

function EmojiPopup({ myReactions, onReact, onCancel, onClose }: EmojiPopupProps) {
  const stack = useReactionStore((s) => s.stack)

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        className="fixed left-4 right-4 z-40
                   bg-[var(--bg-sheet)] rounded-card border border-[var(--border-default)]
                   p-4 shadow-lg
                   animate-in slide-in-from-bottom-2 duration-200"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}
      >
        <div className="grid grid-cols-4 gap-3">
          {EMOJI_LIST.map((emoji) => {
            const isReacted = myReactions.includes(emoji)
            const stackItem = stack.find((r) => r.emoji === emoji)
            return (
              <button
                key={emoji}
                onClick={() => {
                  if (isReacted) {
                    onCancel(emoji)
                  } else {
                    onReact(emoji)
                  }
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

