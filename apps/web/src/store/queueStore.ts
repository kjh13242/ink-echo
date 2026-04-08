import { create } from 'zustand'
import type { QueueTrack, TrackStatus } from '@/types'

interface QueueState {
  tracks: QueueTrack[]
  currentIndex: number

  // 액션
  setTracks: (tracks: QueueTrack[]) => void
  addTrack: (track: QueueTrack) => void
  removeTrack: (queueId: string) => void
  reorderTrack: (queueId: string, newPosition: number) => void
  updateTrackStatus: (queueId: string, status: TrackStatus) => void
  setCurrentIndex: (index: number) => void
  updateVoteCount: (queueId: string, count: number) => void
  clearQueue: () => void
}

export const useQueueStore = create<QueueState>((set) => ({
  tracks: [],
  currentIndex: 0,

  setTracks: (tracks) =>
    set({ tracks: [...tracks].sort((a, b) => a.position - b.position) }),

  addTrack: (track) =>
    set((state) => ({
      tracks: [...state.tracks, track].sort((a, b) => a.position - b.position),
    })),

  removeTrack: (queueId) =>
    set((state) => ({
      tracks: state.tracks.filter((t) => t.queueId !== queueId),
    })),

  reorderTrack: (queueId, newPosition) =>
    set((state) => {
      const moved = state.tracks.find((t) => t.queueId === queueId)
      if (!moved) return state

      const oldPosition = moved.position
      if (oldPosition === newPosition) return state

      // 서버 DB shifting 로직과 동일하게 적용 (position 값 보존)
      const tracks = state.tracks.map((t) => {
        if (t.queueId === queueId) return { ...t, position: newPosition }
        if (newPosition > oldPosition && t.position > oldPosition && t.position <= newPosition)
          return { ...t, position: t.position - 1 }
        if (newPosition < oldPosition && t.position >= newPosition && t.position < oldPosition)
          return { ...t, position: t.position + 1 }
        return t
      })

      return { tracks: [...tracks].sort((a, b) => a.position - b.position) }
    }),

  updateTrackStatus: (queueId, status) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.queueId === queueId ? { ...t, status } : t
      ),
    })),

  setCurrentIndex: (currentIndex) => set({ currentIndex }),

  updateVoteCount: (queueId, count) =>
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.queueId === queueId ? { ...t, voteCount: count } : t
      ),
    })),

  clearQueue: () => set({ tracks: [], currentIndex: 0 }),
}))
