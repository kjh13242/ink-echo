import type { FastifyInstance } from 'fastify'
import { query, withTransaction } from '../db/client'
import { redis, RedisKey } from '../db/redis'
import { authenticate } from '../lib/auth'
import { generateId, ok, fail, toQueueTrack } from '../lib/utils'
import { broadcast } from '../websocket/broadcaster'

type AuthRequest = { session: { participantId: string; roomId: string; isHost: boolean } }

export async function queueRoutes(app: FastifyInstance) {

  // ── GET /api/rooms/:id/queue ──────────────────────────
  app.get('/rooms/:id/queue', { preHandler: authenticate }, async (req, reply) => {
    const { id: roomId } = req.params as { id: string }

    const rows = await query(
      `SELECT qt.*, p.nickname, p.avatar, p.is_host
       FROM queue_tracks qt
       JOIN participants p ON p.id = qt.added_by
       WHERE qt.room_id = $1 AND qt.status IN ('pending','playing')
       ORDER BY qt.position`,
      [roomId]
    )

    const pbRaw = await redis.hGetAll(RedisKey.playback(roomId))

    return reply.send(ok({
      currentIndex: parseInt(pbRaw.current_queue_id ? '0' : '0'),
      tracks: rows.rows,
    }))
  })

  // ── POST /api/rooms/:id/queue — 곡 추가 ──────────────
  app.post('/rooms/:id/queue', { preHandler: authenticate }, async (req, reply) => {
    const { id: roomId } = req.params as { id: string }
    const session = (req as typeof req & AuthRequest).session
    const body = req.body as {
      tracks: Array<{
        youtube_id: string
        message?: string
        title?: string
        artist?: string
        thumbnail_url?: string
        duration_sec?: number
      }>
    }

    if (!body.tracks?.length || body.tracks.length > 10) {
      return reply.status(400).send(fail('VALIDATION_ERROR', '1~10곡만 추가할 수 있어요'))
    }

    // 현재 최대 position 조회
    const maxPosRow = await query(
      `SELECT COALESCE(MAX(position), -1) as max_pos
       FROM queue_tracks WHERE room_id = $1 AND status IN ('pending','playing')`,
      [roomId]
    )
    let nextPos = parseInt(maxPosRow.rows[0].max_pos) + 1

    const added = []
    const failed = []

    for (const track of body.tracks) {
      try {
        const queueId = generateId('queue')
        await query(
          `INSERT INTO queue_tracks
             (id, room_id, added_by, youtube_id, title, artist,
              thumbnail_url, duration_sec, message, position)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            queueId, roomId, session.participantId,
            track.youtube_id,
            track.title ?? '',
            track.artist ?? '',
            track.thumbnail_url ?? '',
            track.duration_sec ?? 0,
            track.message ?? null,
            nextPos,
          ]
        )

        const inserted = await query(
          `SELECT qt.*, p.nickname, p.avatar
           FROM queue_tracks qt
           JOIN participants p ON p.id = qt.added_by
           WHERE qt.id = $1`,
          [queueId]
        )

        added.push(inserted.rows[0])

        // WebSocket 브로드캐스트
        broadcast(roomId, {
          type: 'queue:add',
          payload: toQueueTrack(inserted.rows[0]),
        })

        nextPos++
      } catch {
        failed.push({ youtubeId: track.youtube_id, reason: 'INSERT_FAILED' })
      }
    }

    return reply.status(201).send(ok({ added, failed }))
  })

  // ── PUT /api/rooms/:id/queue/reorder ─────────────────
  app.put('/rooms/:id/queue/reorder', { preHandler: authenticate }, async (req, reply) => {
    const { id: roomId } = req.params as { id: string }
    const body = req.body as { queue_id: string; new_position: number }

    const trackRow = await query(
      `SELECT * FROM queue_tracks WHERE id = $1 AND room_id = $2`,
      [body.queue_id, roomId]
    )
    if (!trackRow.rows[0]) {
      return reply.status(404).send(fail('QUEUE_NOT_FOUND', '곡을 찾을 수 없어요'))
    }

    const oldPos = trackRow.rows[0].position
    const newPos = body.new_position

    // 위치 재조정
    await withTransaction(async (client) => {
      if (newPos > oldPos) {
        await client.query(
          `UPDATE queue_tracks
           SET position = position - 1
           WHERE room_id = $1 AND position > $2 AND position <= $3
             AND status IN ('pending','playing')`,
          [roomId, oldPos, newPos]
        )
      } else {
        await client.query(
          `UPDATE queue_tracks
           SET position = position + 1
           WHERE room_id = $1 AND position >= $2 AND position < $3
             AND status IN ('pending','playing')`,
          [roomId, newPos, oldPos]
        )
      }
      await client.query(
        `UPDATE queue_tracks SET position = $1 WHERE id = $2`,
        [newPos, body.queue_id]
      )
    })

    broadcast(roomId, {
      type: 'queue:reorder',
      payload: { queueId: body.queue_id, newPosition: newPos },
    })

    return reply.send(ok({ queueId: body.queue_id, newPosition: newPos }))
  })

  // ── DELETE /api/rooms/:id/queue/:queueId ─────────────
  app.delete('/rooms/:id/queue/:queueId', { preHandler: authenticate }, async (req, reply) => {
    const { id: roomId, queueId } = req.params as { id: string; queueId: string }
    const session = (req as typeof req & AuthRequest).session

    const trackRow = await query(
      `SELECT * FROM queue_tracks WHERE id = $1 AND room_id = $2`,
      [queueId, roomId]
    )
    const track = trackRow.rows[0]
    if (!track) {
      return reply.status(404).send(fail('QUEUE_NOT_FOUND', '곡을 찾을 수 없어요'))
    }

    // 본인 추가곡 또는 방장만 삭제 가능
    if (track.added_by !== session.participantId && !session.isHost) {
      return reply.status(403).send(fail('HOST_ONLY', '본인이 추가한 곡만 삭제할 수 있어요'))
    }

    await query(
      `UPDATE queue_tracks SET status = 'removed' WHERE id = $1`,
      [queueId]
    )

    broadcast(roomId, {
      type: 'queue:remove',
      payload: { queueId },
    })

    return reply.send(ok({ queueId }))
  })

  // ── POST /api/rooms/:id/queue/skip ───────────────────
  app.post('/rooms/:id/queue/skip', { preHandler: authenticate }, async (req, reply) => {
    const { id: roomId } = req.params as { id: string }

    // 현재 재생 중인 곡 상태 업데이트
    const pbRaw = await redis.hGetAll(RedisKey.playback(roomId))
    const currentQueueId = pbRaw.current_queue_id

    if (currentQueueId) {
      await query(
        `UPDATE queue_tracks SET status = 'skipped', ended_at = NOW()
         WHERE id = $1`,
        [currentQueueId]
      )
    }

    // 다음 곡 조회
    const nextRow = await query(
      `SELECT qt.*, p.nickname, p.avatar
       FROM queue_tracks qt
       JOIN participants p ON p.id = qt.added_by
       WHERE qt.room_id = $1 AND qt.status = 'pending'
       ORDER BY qt.position ASC LIMIT 1`,
      [roomId]
    )

    const nextTrack = nextRow.rows[0] || null

    if (nextTrack) {
      await query(
        `UPDATE queue_tracks SET status = 'playing', played_at = NOW()
         WHERE id = $1`,
        [nextTrack.id]
      )
      await redis.hSet(RedisKey.playback(roomId), {
        current_queue_id: nextTrack.id,
        position_sec: '0',
        is_playing: 'true',
        updated_at: String(Date.now()),
      })
    }

    broadcast(roomId, {
      type: 'playback:skip',
      payload: {
        skippedQueueId: currentQueueId,
        nextTrack: nextTrack ? toQueueTrack(nextTrack) : null,
      },
    })

    return reply.send(ok({ nextTrack }))
  })

  // ── GET /api/rooms/:id/playback/state ────────────────
  app.get('/rooms/:id/playback/state', { preHandler: authenticate }, async (req, reply) => {
    const { id: roomId } = req.params as { id: string }
    const pbRaw = await redis.hGetAll(RedisKey.playback(roomId))

    return reply.send(ok({
      isPlaying: pbRaw.is_playing === 'true',
      currentQueueId: pbRaw.current_queue_id || null,
      positionSec: parseInt(pbRaw.position_sec || '0'),
      updatedAt: parseInt(pbRaw.updated_at || '0'),
    }))
  })

  // ── POST /api/rooms/:id/playback/play ────────────────
  app.post('/rooms/:id/playback/play', { preHandler: authenticate }, async (req, reply) => {
    const { id: roomId } = req.params as { id: string }
    const body = req.body as { position_sec?: number }

    await redis.hSet(RedisKey.playback(roomId), {
      is_playing: 'true',
      position_sec: String(body.position_sec ?? 0),
      updated_at: String(Date.now()),
    })

    broadcast(roomId, {
      type: 'playback:play',
      payload: { positionSec: body.position_sec ?? 0, timestamp: Date.now() },
    })

    return reply.send(ok(null))
  })

  // ── POST /api/rooms/:id/playback/pause ───────────────
  app.post('/rooms/:id/playback/pause', { preHandler: authenticate }, async (req, reply) => {
    const { id: roomId } = req.params as { id: string }

    const pbRaw = await redis.hGetAll(RedisKey.playback(roomId))
    await redis.hSet(RedisKey.playback(roomId), {
      is_playing: 'false',
      updated_at: String(Date.now()),
    })

    broadcast(roomId, {
      type: 'playback:pause',
      payload: { positionSec: parseInt(pbRaw.position_sec || '0') },
    })

    return reply.send(ok(null))
  })
}
