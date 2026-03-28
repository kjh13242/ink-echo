import { createClient } from 'redis'

export const redis = createClient({
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
})

redis.on('error', (err) => {
  console.error('[Redis] 연결 오류:', err)
})

redis.on('connect', () => {
  console.log('[Redis] 연결 완료')
})

// 앱 시작 시 연결
redis.connect().catch(console.error)

// ── 키 헬퍼 ────────────────────────────────────────────
export const RedisKey = {
  session:     (token: string)   => `session:${token}`,
  playback:    (roomId: string)  => `playback:${roomId}`,
  reactions:   (roomId: string)  => `reactions:${roomId}`,
  wsConns:     (roomId: string)  => `ws:connections:${roomId}`,
  wsConn:      (partId: string)  => `ws:conn:${partId}`,
  vote:        (queueId: string) => `vote:${queueId}`,
  encore:      (queueId: string) => `encore:${queueId}`,
  ytSearch:    (hash: string)    => `yt:search:${hash}`,
  activeCodes: ()                => 'rooms:active_codes',
}

// ── TTL 상수 ────────────────────────────────────────────
export const TTL = {
  session:   60 * 60 * 24,  // 24시간
  ytSearch:  60 * 60,       // 1시간
  wsConn:    30,             // 30초 (heartbeat로 갱신)
  encore:    10,             // 10초 (곡 종료 후 초기화)
}
