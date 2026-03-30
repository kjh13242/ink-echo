'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { WSEvent } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000'
const MAX_RETRIES = 5
const BASE_DELAY_MS = 100

interface UseWebSocketOptions {
  roomId: string
  token: string
  onEvent: (event: WSEvent) => void
  enabled?: boolean
}

export function useWebSocket({
  roomId,
  token,
  onEvent,
  enabled = true,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const onEventRef = useRef(onEvent)
  const [isConnected, setIsConnected] = useState(false)

  // onEvent가 바뀌어도 항상 최신 참조 유지
  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  const connect = useCallback(() => {
    if (!enabled) return

    const url = `${WS_URL}/ws?room_id=${roomId}&token=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      retriesRef.current = 0
    }

    ws.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data)
        onEventRef.current(event)
      } catch {
        console.error('[WS] 메시지 파싱 실패', e.data)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      wsRef.current = null

      // Exponential backoff 재연결
      if (retriesRef.current < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, retriesRef.current)
        retriesRef.current += 1
        setTimeout(connect, delay)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [roomId, token, enabled])

  useEffect(() => {
    if (!enabled) return
    connect()

    return () => {
      retriesRef.current = MAX_RETRIES // 언마운트 시 재연결 중단
      wsRef.current?.close()
    }
  }, [connect, enabled])

  const send = useCallback((type: string, payload?: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }))
    }
  }, [])

  return { isConnected, send }
}
