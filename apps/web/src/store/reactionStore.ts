import { create } from 'zustand'
import type { Emoji, ReactionStack } from '@/types'

interface ReactionStoreState {
  stack: ReactionStack[]
  myParticipantId: string | null

  // 액션
  setMyParticipantId: (id: string) => void
  addReaction: (emoji: Emoji, participantId: string) => void
  removeReaction: (emoji: Emoji, participantId: string) => void
  clearStack: () => void
}

export const useReactionStore = create<ReactionStoreState>((set, get) => ({
  stack: [],
  myParticipantId: null,

  setMyParticipantId: (myParticipantId) => set({ myParticipantId }),

  addReaction: (emoji, participantId) =>
    set((state) => {
      const existing = state.stack.find((r) => r.emoji === emoji)
      const isMe = participantId === state.myParticipantId

      if (existing) {
        return {
          stack: state.stack.map((r) =>
            r.emoji === emoji
              ? { ...r, count: r.count + 1, myReacted: isMe ? true : r.myReacted }
              : r
          ),
        }
      }

      return {
        stack: [...state.stack, { emoji, count: 1, myReacted: isMe }],
      }
    }),

  removeReaction: (emoji, participantId) =>
    set((state) => {
      const isMe = participantId === state.myParticipantId
      return {
        stack: state.stack
          .map((r) =>
            r.emoji === emoji
              ? {
                  ...r,
                  count: r.count - 1,
                  myReacted: isMe ? false : r.myReacted,
                }
              : r
          )
          .filter((r) => r.count > 0), // count 0이면 스택에서 제거
      }
    }),

  clearStack: () => set({ stack: [] }),
}))
