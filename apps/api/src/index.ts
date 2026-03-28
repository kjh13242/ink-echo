import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocketPlugin from '@fastify/websocket'
import rateLimit from '@fastify/rate-limit'

import { roomRoutes } from './routes/rooms'
import { queueRoutes } from './routes/queue'
import { searchRoutes } from './routes/search'
import { echoRoutes } from './routes/echo'
import { wsHandler } from './websocket/handler'
import { db } from './db/client'
import { redis } from './db/redis'

const app = Fastify({
  logger: process.env.NODE_ENV === 'development',
})

async function bootstrap() {
  // ── 플러그인 ──────────────────────────────────────────
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  await app.register(websocketPlugin)

  // ── WebSocket ─────────────────────────────────────────
  app.get('/ws', { websocket: true }, wsHandler)

  // ── REST 라우트 ───────────────────────────────────────
  await app.register(roomRoutes,   { prefix: '/api' })
  await app.register(queueRoutes,  { prefix: '/api' })
  await app.register(searchRoutes, { prefix: '/api' })
  await app.register(echoRoutes,   { prefix: '/api' })

  // ── 헬스체크 ─────────────────────────────────────────
  app.get('/health', async () => ({ status: 'ok', ts: Date.now() }))

  // ── 공통 에러 핸들러 ──────────────────────────────────
  app.setErrorHandler((err, _req, reply) => {
    const status = err.statusCode ?? 500
    reply.status(status).send({
      success: false,
      data: null,
      error: {
        code: (err as { code?: string }).code ?? 'INTERNAL_ERROR',
        message: status >= 500 ? '서버 오류가 발생했어요' : err.message,
      },
    })
  })

  // ── 서버 시작 ─────────────────────────────────────────
  const port = Number(process.env.PORT ?? 4000)

  try {
    await db.connect()
    console.log('[DB] PostgreSQL 연결 완료')

    await app.listen({ port, host: '0.0.0.0' })
    console.log(`[Server] http://localhost:${port} 에서 실행 중`)
  } catch (err) {
    console.error('[Server] 시작 실패:', err)
    process.exit(1)
  }
}

bootstrap()
