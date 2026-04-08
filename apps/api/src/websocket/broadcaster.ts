import type { WebSocket } from 'ws'
import { redis, RedisKey } from '../db/redis'

// 방별 WebSocket 연결 관리 (메모리)
const roomConnections = new Map<string, Map<string, WebSocket>>()

export function registerConnection(
  roomId: string,
  participantId: string,
  ws: WebSocket
) {
  if (!roomConnections.has(roomId)) {
    roomConnections.set(roomId, new Map())
  }
  roomConnections.get(roomId)!.set(participantId, ws)
  redis.sAdd(RedisKey.wsConns(roomId), participantId)
}

export function removeConnection(roomId: string, participantId: string) {
  const room = roomConnections.get(roomId)
  if (room) {
    room.delete(participantId)
    if (room.size === 0) roomConnections.delete(roomId)
  }
  redis.sRem(RedisKey.wsConns(roomId), participantId)
}

// 현재 등록된 WS가 이 인스턴스인지 확인
// (재연결 시 close 이벤트가 늦게 오면 새 연결을 덮어쓰지 않도록)
export function isActiveConnection(
  roomId: string,
  participantId: string,
  ws: WebSocket
): boolean {
  return roomConnections.get(roomId)?.get(participantId) === ws
}

// 방 전체에 이벤트 브로드캐스트
export function broadcast(
  roomId: string,
  event: { type: string; payload?: unknown },
  excludeId?: string
) {
  const room = roomConnections.get(roomId)
  if (!room) return

  const message = JSON.stringify(event)
  room.forEach((ws, participantId) => {
    if (participantId !== excludeId && ws.readyState === ws.OPEN) {
      ws.send(message)
    }
  })
}

// 특정 참여자에게만 전송
export function sendTo(
  roomId: string,
  participantId: string,
  event: { type: string; payload?: unknown }
) {
  const ws = roomConnections.get(roomId)?.get(participantId)
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(event))
  }
}

// 방 연결 수
export function getConnectionCount(roomId: string): number {
  return roomConnections.get(roomId)?.size ?? 0
}
