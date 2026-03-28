'use client'

import { useCallback } from 'react'
import { useReactionStore } from '@/store/reactionStore'
import { useRoomStore } from '@/store/roomStore'
import { useToastStore } from '@/store/toastStore'
import { api } from '@/lib/api'
import type { Emoji } from '@/types'

export function useEmojiReaction() {
  const { addReaction, removeReaction } = useReactionStore()
  const session = useRoomStore((s) => s.session)
  const room = useRoomStore((s) => s.room)
  const showToast = useToastStore((s) => s.showToast)

  const react = useCallback(
    async (emoji: Emoji) => {
      if (!session || !room) return

      // 1. 낙관적 업데이트 — 즉시 UI 반영
      addReaction(emoji, session.participantId)

      try {
        // 2. API 호출
        await api.post(`/api/rooms/${room.roomId}/reactions`, { emoji })
      } catch {
        // 3. 실패 시 롤백
        removeReaction(emoji, session.participantId)
        showToast({ type: 'error', message: '반응을 보내지 못했어요' })
      }
    },
    [session, room, addReaction, removeReaction, showToast]
  )

  const cancel = useCallback(
    async (emoji: Emoji) => {
      if (!session || !room) return

      // 1. 낙관적 업데이트
      removeReaction(emoji, session.participantId)

      try {
        // 2. API 호출 (이모지 URL 인코딩)
        await api.delete(
          `/api/rooms/${room.roomId}/reactions/${encodeURIComponent(emoji)}`
        )
      } catch {
        // 3. 실패 시 롤백
        addReaction(emoji, session.participantId)
        showToast({ type: 'error', message: '반응 취소에 실패했어요' })
      }
    },
    [session, room, addReaction, removeReaction, showToast]
  )

  return { react, cancel }
}
