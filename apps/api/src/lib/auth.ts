import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '../lib/utils'
import { redis, RedisKey } from '../db/redis'

export async function authenticate(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const auth = req.headers.authorization

  if (!auth?.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      data: null,
      error: { code: 'INVALID_TOKEN', message: '인증이 필요해요' },
    })
  }

  const token = auth.slice(7)
  const payload = verifyToken(token)

  if (!payload) {
    return reply.status(401).send({
      success: false,
      data: null,
      error: { code: 'INVALID_TOKEN', message: '유효하지 않은 토큰이에요' },
    })
  }

  // Redis 세션 유효성 확인
  const session = await redis.hGetAll(RedisKey.session(token))
  if (!session?.participant_id) {
    return reply.status(401).send({
      success: false,
      data: null,
      error: { code: 'TOKEN_EXPIRED', message: '세션이 만료됐어요' },
    })
  }

  // request에 세션 정보 주입
  ;(req as FastifyRequest & { session: typeof payload }).session = payload
}
