import type { FastifyInstance } from 'fastify'
import { query, withTransaction } from '../db/client'
import { redis, RedisKey, TTL } from '../db/redis'
import { authenticate } from '../lib/auth'
import {
  generateId,
  generateRoomCode,
  releaseRoomCode,
  signToken,
  ok,
  fail,
  DEFAULT_SETTINGS,
  getSeedYoutubeIds,
} from '../lib/utils'
import { broadcast } from '../websocket/broadcaster'

export async function roomRoutes(app: FastifyInstance) {

  // ── POST /api/rooms — 방 생성 ────────────────────────
  app.post('/rooms', async (req, reply) => {
    const body = req.body as {
      name?: string
      host_nickname?: string
      host_avatar?: string
    }

    const roomId = generateId('room')
    const participantId = generateId('participant')
    const code = await generateRoomCode()

    const name = body.name?.trim() || `에코 방 ${code}`
    const nickname = body.host_nickname?.trim() || '달리는 고래'
    const avatar = body.host_avatar || 'purple'

    await withTransaction(async (client) => {
      // 방 생성
      await client.query(
        `INSERT INTO rooms (id, code, name, host_participant_id, settings)
         VALUES ($1, $2, $3, $4, $5)`,
        [roomId, code, name, participantId, JSON.stringify(DEFAULT_SETTINGS)]
      )

      // 방장 참여자 생성
      await client.query(
        `INSERT INTO participants (id, room_id, nickname, avatar, is_host, join_order)
         VALUES ($1, $2, $3, $4, TRUE, 1)`,
        [participantId, roomId, nickname, avatar]
      )

    })

    // 세션 토큰 발급
    const token = signToken({ participantId, roomId, isHost: true })
    await redis.hSet(RedisKey.session(token), {
      participant_id: participantId,
      room_id: roomId,
      is_host: 'true',
    })
    await redis.expire(RedisKey.session(token), TTL.session)

    // 재생 상태 초기화
    await redis.hSet(RedisKey.playback(roomId), {
      is_playing: 'false',
      current_queue_id: '',
      position_sec: '0',
      updated_at: String(Date.now()),
    })

    const inviteUrl = `${process.env.CORS_ORIGIN}/join/${code}`

    return reply.status(201).send(ok({
      roomId,
      roomCode: code,
      name,
      inviteUrl,
      sessionToken: token,
      host: { participantId, nickname, avatar, isHost: true },
      createdAt: new Date().toISOString(),
    }))
  })

  // ── GET /api/rooms/:code — 방 정보 조회 ─────────────
  app.get('/rooms/:code', async (req, reply) => {
    const { code } = req.params as { code: string }

    const roomRow = await query(
      `SELECT r.*, p.nickname as host_nickname
       FROM rooms r
       LEFT JOIN participants p ON p.id = r.host_participant_id
       WHERE r.code = $1`,
      [code.toUpperCase()]
    )

    if (!roomRow.rows[0]) {
      return reply.status(404).send(fail('ROOM_NOT_FOUND', '방을 찾을 수 없어요'))
    }

    const room = roomRow.rows[0]

    if (room.status === 'ended') {
      return reply.status(403).send(fail('ROOM_EXPIRED', '이미 종료된 방이에요'))
    }

    const countRow = await query(
      `SELECT COUNT(*) as cnt FROM participants
       WHERE room_id = $1 AND status = 'active'`,
      [room.id]
    )

    const participantCount = parseInt(countRow.rows[0].cnt)
    const maxParticipants = room.plan === 'pro' ? 9999 : 10

    const currentTrackRow = await query(
      `SELECT qt.youtube_id, qt.title, qt.artist, p.nickname as added_by_nickname
       FROM queue_tracks qt
       JOIN participants p ON p.id = qt.added_by
       WHERE qt.room_id = $1 AND qt.status = 'playing'
       LIMIT 1`,
      [room.id]
    )

    return reply.send(ok({
      roomId: room.id,
      code: room.code,
      name: room.name,
      participantCount,
      maxParticipants,
      isFull: participantCount >= maxParticipants,
      isActive: room.status === 'active',
      settings: room.settings,
      currentTrack: currentTrackRow.rows[0] || null,
    }))
  })

  // ── POST /api/rooms/:id/join — 방 입장 ───────────────
  app.post('/rooms/:id/join', async (req, reply) => {
    const { id: roomId } = req.params as { id: string }
    const body = req.body as { nickname?: string; avatar?: string }

    // 방 조회
    const roomRow = await query(
      `SELECT * FROM rooms WHERE id = $1`,
      [roomId]
    )
    const room = roomRow.rows[0]
    if (!room) {
      return reply.status(404).send(fail('ROOM_NOT_FOUND', '방을 찾을 수 없어요'))
    }
    if (room.status === 'ended') {
      return reply.status(403).send(fail('ROOM_EXPIRED', '이미 종료된 방이에요'))
    }

    // 인원 확인
    const countRow = await query(
      `SELECT COUNT(*) as cnt FROM participants
       WHERE room_id = $1 AND status = 'active'`,
      [roomId]
    )
    const count = parseInt(countRow.rows[0].cnt)
    const max = room.plan === 'pro' ? 9999 : 10

    if (count >= max) {
      return reply.status(403).send(fail('ROOM_FULL', '방이 꽉 찼어요'))
    }

    // 다음 join_order
    const orderRow = await query(
      `SELECT COALESCE(MAX(join_order), 0) + 1 as next_order
       FROM participants WHERE room_id = $1`,
      [roomId]
    )
    const joinOrder = orderRow.rows[0].next_order

    const participantId = generateId('participant')
    const nickname = body.nickname?.trim() || '익명의 고래'
    const avatar = body.avatar || 'purple'

    await query(
      `INSERT INTO participants (id, room_id, nickname, avatar, is_host, join_order)
       VALUES ($1, $2, $3, $4, FALSE, $5)`,
      [participantId, roomId, nickname, avatar, joinOrder]
    )

    // 세션 발급
    const token = signToken({ participantId, roomId, isHost: false })
    await redis.hSet(RedisKey.session(token), {
      participant_id: participantId,
      room_id: roomId,
      is_host: 'false',
    })
    await redis.expire(RedisKey.session(token), TTL.session)

    // 현재 큐 & 참여자 조회
    const [queueRows, participantRows, playbackRaw] = await Promise.all([
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
      redis.hGetAll(RedisKey.playback(roomId)),
    ])

    return reply.status(201).send(ok({
      sessionToken: token,
      participant: { participantId, nickname, avatar, isHost: false },
      room: {
        roomId: room.id,
        code: room.code,
        name: room.name,
        settings: room.settings,
        plan: room.plan,
        inviteUrl: `${process.env.CORS_ORIGIN}/join/${room.code}`,
      },
      queue: queueRows.rows,
      participants: participantRows.rows,
      playback: playbackRaw,
    }))
  })

  // ── PUT /api/rooms/:id/settings — 방 설정 변경 ───────
  app.put('/rooms/:id/settings', { preHandler: authenticate }, async (req, reply) => {
    const { id: roomId } = req.params as { id: string }
    const session = (req as typeof req & { session: { isHost: boolean } }).session

    if (!session.isHost) {
      return reply.status(403).send(fail('HOST_ONLY', '방장만 설정을 변경할 수 있어요'))
    }

    const body = req.body as Partial<typeof DEFAULT_SETTINGS>

    // 현재 설정 가져와서 병합
    const roomRow = await query(`SELECT settings FROM rooms WHERE id = $1`, [roomId])
    const current = roomRow.rows[0]?.settings ?? DEFAULT_SETTINGS
    const updated = { ...current, ...body }

    await query(
      `UPDATE rooms SET settings = $1 WHERE id = $2`,
      [JSON.stringify(updated), roomId]
    )

    broadcast(roomId, { type: 'room:settings_update', payload: updated })

    return reply.send(ok({ settings: updated }))
  })

  // ── DELETE /api/rooms/:id — 방 종료 ──────────────────
  app.delete('/rooms/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id: roomId } = req.params as { id: string }
    const session = (req as typeof req & { session: { isHost: boolean } }).session

    if (!session.isHost) {
      return reply.status(403).send(fail('HOST_ONLY', '방장만 방을 종료할 수 있어요'))
    }

    const roomRow = await query(`SELECT * FROM rooms WHERE id = $1`, [roomId])
    const room = roomRow.rows[0]
    if (!room) {
      return reply.status(404).send(fail('ROOM_NOT_FOUND', '방을 찾을 수 없어요'))
    }

    // 방 종료
    await query(
      `UPDATE rooms SET status = 'ended', ended_at = NOW(), code = NULL WHERE id = $1`,
      [roomId]
    )

    // 방 코드 반환 (재사용 가능하게)
    if (room.code) await releaseRoomCode(room.code)

    // 에코 카드 생성
    const echoId = generateId('echo')
    const [trackCount, participantCount, totalReactions] = await Promise.all([
      query(`SELECT COUNT(*) as cnt FROM queue_tracks WHERE room_id = $1 AND status IN ('played','skipped')`, [roomId]),
      query(`SELECT COUNT(*) as cnt FROM participants WHERE room_id = $1`, [roomId]),
      query(`SELECT COUNT(*) as cnt FROM reactions WHERE room_id = $1 AND type = 'emoji' AND is_active = TRUE`, [roomId]),
    ])

    await query(
      `INSERT INTO echo_cards
         (id, room_id, room_name, started_at, ended_at,
          duration_min, track_count, participant_count, total_reactions)
       VALUES ($1, $2, $3, $4, NOW(),
          EXTRACT(EPOCH FROM (NOW() - $4)) / 60,
          $5, $6, $7)`,
      [
        echoId, roomId, room.name, room.created_at,
        parseInt(trackCount.rows[0].cnt),
        parseInt(participantCount.rows[0].cnt),
        parseInt(totalReactions.rows[0].cnt),
      ]
    )

    // echo_tracks 복사
    await query(
      `INSERT INTO echo_tracks
         (echo_card_id, queue_id, youtube_id, title, artist,
          added_by_nickname, message, play_order, status, reaction_count)
       SELECT $1, qt.id, qt.youtube_id, qt.title, qt.artist,
              p.nickname, qt.message,
              ROW_NUMBER() OVER (ORDER BY qt.played_at NULLS LAST),
              qt.status, 0
       FROM queue_tracks qt
       JOIN participants p ON p.id = qt.added_by
       WHERE qt.room_id = $2 AND qt.status IN ('played','skipped','unavailable')`,
      [echoId, roomId]
    )

    // Redis 정리
    await Promise.all([
      redis.del(RedisKey.playback(roomId)),
      redis.del(RedisKey.reactions(roomId)),
      redis.del(RedisKey.wsConns(roomId)),
    ])

    broadcast(roomId, { type: 'room:end', payload: { echoCardId: echoId } })

    return reply.send(ok({ echoCardId: echoId, endedAt: new Date().toISOString() }))
  })
}
