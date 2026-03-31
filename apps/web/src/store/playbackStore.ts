import { create } from 'zustand'
import type { PlaybackState } from '@/types'

interface PlaybackStoreState {
  isPlaying: boolean
  positionSec: number
  adDurationSec: number | null

  // 액션
  setPlaying: (isPlaying: boolean) => void
  setPosition: (positionSec: number) => void
  syncFromServer: (state: PlaybackState) => void
  setAdDuration: (sec: number | null) => void
  clearPlayback: () => void
}

export const usePlaybackStore = create<PlaybackStoreState>((set) => ({
  isPlaying: false,
  positionSec: 0,
  adDurationSec: null,

  setPlaying: (isPlaying) => set({ isPlaying }),

  setPosition: (positionSec) => set({ positionSec }),

  // 재연결 시 서버 상태로 전체 덮어씀 (서버 우선 원칙)
  syncFromServer: (state) => {
    // 서버 타임스탬프 기준으로 현재 위치 보정
    const elapsedSec = state.isPlaying
      ? Math.max(0, Math.floor((Date.now() - state.updatedAt) / 1000))
      : 0
    set({
      isPlaying: state.isPlaying,
      positionSec: state.positionSec + elapsedSec,
    })
  },

  setAdDuration: (adDurationSec) => set({ adDurationSec }),

  clearPlayback: () =>
    set({ isPlaying: false, positionSec: 0, adDurationSec: null }),
}))
