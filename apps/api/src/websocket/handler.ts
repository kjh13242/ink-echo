import type { FastifyRequest } from 'fastify'
import type { SocketStream } from '@fastify/websocket'
import { verifyToken } from '../lib/utils'
import { redis, RedisKey, TTL } from '../db/redis'
import { query } from '../db/client'
import {
  registerConnection,
  removeConnection,
  broadcast,
  sendTo,
} from './broadcaster'

export async function wsHandler(
  connection: SocketStream,
  req: FastifyRequest
) {
  const ws = connection.socket
  const url = new URL(req.url, 'http://localhost')
  const roomId = url.searchParams.get('room_id')
  const token  = url.searchParams.get('token')

  // ── 인증 ──────────────────────────────────────────
  if (!roomId || !token) {
    ws.close(4001, 'room_id와 token이 필요해요')
    return
  }

  const payload = verifyToken(token)
  if (!payload || payload.roomId !== roomId) {
    ws.close(4001, '유효하지 않은 토큰이에요')
    return
  }

  const session = await redis.hGetAll(RedisKey.session(token))
  if (!session?.participant_id) {
    ws.close(4001, '세션이 만료됐어요')
    return
  }

  const { participantId, isHost } = payload

  // ── 연결 등록 ──────────────────────────────────────
  registerConnection(roomId, participantId, ws)
  await redis.setEx(RedisKey.wsConn(participantId), TTL.wsConn, JSON.stringify({
    socketId: participantId,
    roomId,
    connectedAt: Date.now(),
  }))

  // ── 연결 완료 — 현재 상태 전송 ───────────────────
  const [playbackRaw, queueRows, participantRows] = await Promise.all([
    redis.hGetAll(RedisKey.playback(roomId)),
    query(
      `SELECT qt.*, p.nickname, p.avatar, p.is_host
       FROM queue_tracks qt
       JOIN participants p ON p.id = qt.added_by
       WHERE qt.room_id = $1 AND qt.status IN ('pending','playing')
       ORDER BY qt.position`,
      [roomId]
    ),
    query(
      `SELECT * FROM participants
       WHERE room_id = $1 AND status = 'active'
       ORDER BY join_order`,
      [roomId]
    ),
  ])

  ws.send(JSON.stringify({
    type: 'connected',
    payload: {
      participantId,
      playback: playbackRaw,
      queue: queueRows.rows,
      participants: participantRows.rows,
    },
  }))

  // 참여자 입장 브로드캐스트
  const meRow = participantRows.rows.find((p) => p.id === participantId)
  if (meRow) {
    broadcast(roomId, {
      type: 'participant:join',
      payload: {
        participantId: meRow.id,
        nickname: meRow.nickname,
        avatar: meRow.avatar,
        isHost: meRow.is_host,
        joinOrder: meRow.join_order,
      },
    }, participantId) // 본인 제외
  }

  // ── 메시지 수신 ────────────────────────────────────
  ws.on('message', async (raw) => {
    try {
      const { type, payload: p } = JSON.parse(raw.toString())

      switch (type) {
        // Heartbeat
        case 'ping': {
          await redis.setEx(RedisKey.wsConn(participantId), TTL.wsConn,
            JSON.stringify({ roomId, connectedAt: Date.now() }))
          ws.send(JSON.stringify({ type: 'pong' }))
          break
        }

        // 재연결 후 서버 상태 요청
        case 'reconnect': {
          const pb = await redis.hGetAll(RedisKey.playback(roomId))
          ws.send(JSON.stringify({ type: 'playback:state', payload: pb }))
          break
        }

        default:
          // 클라이언트가 직접 보내는 이벤트는 기본적으로 REST API 사용
          // WS는 서버 → 클라이언트 브로드캐스트 중심
          break
      }
    } catch {
      // 파싱 오류 무시
    }
  })

  // ── 연결 종료 ──────────────────────────────────────
  ws.on('close', async () => {
    removeConnection(roomId, participantId)
    await redis.del(RedisKey.wsConn(participantId))

    // 참여자 퇴장 처리
    await query(
      `UPDATE participants SET status = 'left', left_at = NOW()
       WHERE id = $1`,
      [participantId]
    )

    // 방장이면 위임
    if (isHost) {
      const nextHost = await query<{ id: string; nickname: string }>(
        `SELECT id, nickname FROM participants
         WHERE room_id = $1 AND status = 'active' AND id != $2
         ORDER BY join_order ASC LIMIT 1`,
        [roomId, participantId]
      )

      if (nextHost.rows.length > 0) {
        const { id: newHostId, nickname } = nextHost.rows[0]
        await query(
          `UPDATE participants SET is_host = (id = $1) WHERE room_id = $2`,
          [newHostId, roomId]
        )
        await query(
          `UPDATE rooms SET host_participant_id = $1 WHERE id = $2`,
          [newHostId, roomId]
        )

        // Redis 세션 업데이트
        const newHostToken = await redis.keys(`session:*`)
        for (const key of newHostToken) {
          const s = await redis.hGetAll(key)
          if (s.participant_id === newHostId) {
            await redis.hSet(key, 'is_host', 'true')
          }
        }

        broadcast(roomId, {
          type: 'host:transfer',
          payload: { newHostId, newHostNickname: nickname },
        })

        sendTo(roomId, newHostId, {
          type: 'info',
          payload: { message: '방장이 됐어요 👑' },
        })
      } else {
        // 남은 참여자 없으면 방 종료
        await query(
          `UPDATE rooms SET status = 'ended', ended_at = NOW(), code = NULL
           WHERE id = $1`,
          [roomId]
        )
      }
    }

    broadcast(roomId, {
      type: 'participant:leave',
      payload: { participantId },
    })
  })

  ws.on('error', () => {
    removeConnection(roomId, participantId)
  })
}
