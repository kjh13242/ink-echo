'use client'

import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        options: YTPlayerOptions
      ) => YTPlayer
      PlayerState: {
        UNSTARTED: -1
        ENDED: 0
        PLAYING: 1
        PAUSED: 2
        BUFFERING: 3
        CUED: 5
      }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface YTPlayerOptions {
  height: string | number
  width: string | number
  videoId?: string
  playerVars?: Record<string, number | string>
  events?: {
    onReady?: (e: { target: YTPlayer }) => void
    onStateChange?: (e: { data: number }) => void
    onError?: (e: { data: number }) => void
  }
}

interface YTPlayer {
  loadVideoById: (options: { videoId: string; startSeconds?: number }) => void
  playVideo: () => void
  pauseVideo: () => void
  stopVideo: () => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  destroy: () => void
}

interface UseYouTubePlayerOptions {
  containerId: string
  onEnded?: () => void
  onError?: (code: number) => void
  onAdStart?: () => void
}

// YouTube IFrame API 스크립트 로드 (중복 방지)
let apiLoaded = false
let apiReady = false
const readyCallbacks: Array<() => void> = []

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (apiReady) {
      resolve()
      return
    }

    readyCallbacks.push(resolve)

    if (!apiLoaded) {
      apiLoaded = true
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)

      window.onYouTubeIframeAPIReady = () => {
        apiReady = true
        readyCallbacks.forEach((cb) => cb())
        readyCallbacks.length = 0
      }
    }
  })
}

export function useYouTubePlayer({
  containerId,
  onEnded,
  onError,
  onAdStart,
}: UseYouTubePlayerOptions) {
  const playerRef = useRef<YTPlayer | null>(null)
  const expectedEndRef = useRef<number | null>(null)
  const onEndedRef = useRef(onEnded)
  const onErrorRef = useRef(onError)
  const onAdStartRef = useRef(onAdStart)

  useEffect(() => { onEndedRef.current = onEnded }, [onEnded])
  useEffect(() => { onErrorRef.current = onError }, [onError])
  useEffect(() => { onAdStartRef.current = onAdStart }, [onAdStart])

  useEffect(() => {
    let mounted = true

    loadYouTubeAPI().then(() => {
      if (!mounted) return

      playerRef.current = new window.YT.Player(containerId, {
        height: '0',
        width: '0',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onStateChange: (e) => {
            const state = e.data

            // 곡 종료
            if (state === window.YT.PlayerState.ENDED) {
              const now = Date.now()
              // 예상 종료 시각보다 일찍 끝나면 광고 판단
              if (
                expectedEndRef.current !== null &&
                now < expectedEndRef.current - 3000
              ) {
                onAdStartRef.current?.()
              } else {
                onEndedRef.current?.()
              }
            }
          },
          onError: (e) => {
            // 101, 150: 재생 불가 (지역 차단 등)
            onErrorRef.current?.(e.data)
          },
        },
      })
    })

    return () => {
      mounted = false
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [containerId])

  const loadVideo = useCallback((youtubeId: string, durationSec?: number) => {
    if (!playerRef.current) return

    // 예상 종료 시각 계산 (광고 감지용)
    if (durationSec) {
      expectedEndRef.current = Date.now() + durationSec * 1000
    }

    playerRef.current.loadVideoById({ videoId: youtubeId, startSeconds: 0 })
  }, [])

  const play = useCallback(() => {
    playerRef.current?.playVideo()
  }, [])

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo()
  }, [])

  const getCurrentTime = useCallback((): number => {
    return playerRef.current?.getCurrentTime() ?? 0
  }, [])

  return { playerRef, loadVideo, play, pause, getCurrentTime }
}
