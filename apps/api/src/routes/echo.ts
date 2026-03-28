import type { FastifyInstance } from 'fastify'
import { query } from '../db/client'
import { redis, RedisKey, TTL } from '../db/redis'
import { authenticate } from '../lib/auth'
import { ok, fail } from '../lib/utils'
import { broadcast } from '../websocket/broadcaster'

type AuthRequest = { session: { participantId: string; roomId: string } }

export async function echoRoutes(app: FastifyInstance) {

  // ── GET /api/echo-cards/:id ──────────────────────────
  app.get('/echo-cards/:id', async (req, reply) => {
    const { id } = req.params as { id: string }

    const cardRow = await query(
      `SELECT * FROM echo_cards WHERE id = $1`,
      [id]
    )
    if (!cardRow.rows[0]) {
      return reply.status(404).send(fail('NOT_FOUND', '에코 카드를 찾을 수 없어요'))
    }

    const topTracksRow = await query(
      `SELECT * FROM echo_tracks
       WHERE echo_card_id = $1
       ORDER BY reaction_count DESC, play_order ASC
       LIMIT 3`,
      [id]
    )

    const participantsRow = await query(
      `SELECT p.nickname, p.avatar,
              COUNT(qt.id) as track_count
       FROM participants p
       LEFT JOIN queue_tracks qt ON qt.added_by = p.id AND qt.room_id = p.room_id
       WHERE p.room_id = $1
       GROUP BY p.id, p.nickname, p.avatar, p.join_order
       ORDER BY p.join_order`,
      [cardRow.rows[0].room_id]
    )

    return reply.send(ok({
      ...cardRow.rows[0],
      topTracks: topTracksRow.rows,
      participants: participantsRow.rows,
    }))
  })

  // ── POST /api/rooms/:id/reactions — 이모지 추가 ──────
  app.post('/rooms/:id/reactions', { preHandler: authenticate }, async (req, reply) => {
    const { id: roomId } = req.params as { id: string }
    const session = (req as typeof req & AuthRequest).session
    const body = req.body as { emoji: string }

    if (!body.emoji) {
      return reply.status(400).send(fail('VALIDATION_ERROR', '이모지를 선택해주세요'))
    }

    // reactions 테이블에 upsert
    await query(
      `INSERT INTO reactions (room_id, participant_id, type, emoji, is_active)
       VALUES ($1, $2, 'emoji', $3, TRUE)
       ON CONFLICT (room_id, participant_id, emoji)
         WHERE type = 'emoji'
       DO UPDATE SET is_active = TRUE`,
      [roomId, session.participantId, body.emoji]
    )

    // Redis 이모지 스택 업데이트
    const stackRaw = await redis.hGet(RedisKey.reactions(roomId), body.emoji)
    const stack: string[] = stackRaw ? JSON.parse(stackRaw) : []
    if (!stack.includes(session.participantId)) {
      stack.push(session.participantId)
      await redis.hSet(RedisKey.reactions(roomId), body.emoji, JSON.stringify(stack))
    }

    broadcast(roomId, {
      type: 'reaction:add',
      payload: { participantId: session.participantId, emoji: body.emoji },
    })

    return reply.status(201).send(ok(null))
  })

  // ── DELETE /api/rooms/:id/reactions/:emoji — 이모지 취소
  app.delete('/rooms/:id/reactions/:emoji', { preHandler: authenticate }, async (req, reply) => {
    const { id: roomId, emoji } = req.params as { id: string; emoji: string }
    const session = (req as typeof req & AuthRequest).session
    const decodedEmoji = decodeURIComponent(emoji)

    await query(
      `UPDATE reactions SET is_active = FALSE
       WHERE room_id = $1 AND participant_id = $2
         AND emoji = $3 AND type = 'emoji'`,
      [roomId, session.participantId, decodedEmoji]
    )

    // Redis 스택에서 제거
    const stackRaw = await redis.hGet(RedisKey.reactions(roomId), decodedEmoji)
    if (stackRaw) {
      const stack: string[] = JSON.parse(stackRaw)
      const updated = stack.filter((id) => id !== session.participantId)
      if (updated.length > 0) {
        await redis.hSet(RedisKey.reactions(roomId), decodedEmoji, JSON.stringify(updated))
      } else {
        await redis.hDel(RedisKey.reactions(roomId), decodedEmoji)
      }
    }

    broadcast(roomId, {
      type: 'reaction:remove',
      payload: { participantId: session.participantId, emoji: decodedEmoji },
    })

    return reply.send(ok(null))
  })

  // ── POST /api/rooms/:id/votes — 큐 투표 ─────────────
  app.post('/rooms/:id/votes', { preHandler: authenticate }, async (req, reply) => {
    const { id: roomId } = req.params as { id: string }
    const session = (req as typeof req & AuthRequest).session
    const body = req.body as { queue_id: string; action: 'up' | 'cancel' }

    if (body.action === 'up') {
      // Redis Set에 참여자 추가
      await redis.sAdd(RedisKey.vote(body.queue_id), session.participantId)
      await query(
        `UPDATE queue_tracks SET vote_count = vote_count + 1 WHERE id = $1`,
        [body.queue_id]
      )
    } else {
      await redis.sRem(RedisKey.vote(body.queue_id), session.participantId)
      await query(
        `UPDATE queue_tracks SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = $1`,
        [body.queue_id]
      )
    }

    // 현재 투표 수 조회
    const voteCount = await redis.sCard(RedisKey.vote(body.queue_id))

    broadcast(roomId, {
      type: 'vote:update',
      payload: { queueId: body.queue_id, voteCount },
    })

    // 투표 기준 확인
    const roomRow = await query(
      `SELECT settings, id FROM rooms WHERE id = $1`,
      [roomId]
    )
    const settings = roomRow.rows[0]?.settings

    if (settings?.voteMode) {
      const participantCount = await query(
        `SELECT COUNT(*) as cnt FROM participants
         WHERE room_id = $1 AND status = 'active'`,
        [roomId]
      )
      const total = parseInt(participantCount.rows[0].cnt)
      const threshold =
        settings.voteThresholdType === 'ratio'
          ? Math.ceil(total * settings.voteThresholdValue)
          : settings.voteThresholdValue

      if (voteCount >= threshold) {
        // 투표 기준 달성 → 자동 스킵
        await query(
          `UPDATE queue_tracks SET status = 'skipped' WHERE id = $1`,
          [body.queue_id]
        )
        broadcast(roomId, {
          type: 'vote:skip',
          payload: { queueId: body.queue_id },
        })
      }
    }

    return reply.send(ok({ voteCount }))
  })

  // ── POST /api/rooms/:id/encore — 앙코르 투표 ─────────
  app.post('/rooms/:id/encore', { preHandler: authenticate }, async (req, reply) => {
    const { id: roomId } = req.params as { id: string }
    const session = (req as typeof req & AuthRequest).session

    // 현재 재생 중인 곡 ID
    const pbRaw = await redis.hGetAll(RedisKey.playback(roomId))
    const currentQueueId = pbRaw.current_queue_id
    if (!currentQueueId) {
      return reply.status(400).send(fail('VALIDATION_ERROR', '재생 중인 곡이 없어요'))
    }

    const key = RedisKey.encore(currentQueueId)
    const hasVoted = await redis.sIsMember(key, session.participantId)

    if (hasVoted) {
      await redis.sRem(key, session.participantId)
    } else {
      await redis.sAdd(key, session.participantId)
      await redis.expire(key, TTL.encore)
    }

    const encoreCount = await redis.sCard(key)

    // 참여자 수 대비 비율 계산
    const participantRow = await query(
      `SELECT COUNT(*) as cnt FROM participants
       WHERE room_id = $1 AND status = 'active'`,
      [roomId]
    )
    const total = parseInt(participantRow.rows[0].cnt)
    const ratio = total > 0 ? encoreCount / total : 0

    broadcast(roomId, {
      type: 'encore:update',
      payload: { ratio, count: encoreCount, queueId: currentQueueId },
    })

    // 50% 이상이면 앙코르 트리거
    if (ratio >= 0.5) {
      broadcast(roomId, {
        type: 'encore:trigger',
        payload: { queueId: currentQueueId },
      })
    }

    return reply.send(ok({ ratio, count: encoreCount }))
  })
}
