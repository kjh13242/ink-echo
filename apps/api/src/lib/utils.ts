import { createHmac, randomBytes } from 'crypto'
import { redis, RedisKey } from '../db/redis'

// ── ID 생성 ────────────────────────────────────────────
const PREFIXES = {
  room:        'rm',
  participant: 'pt',
  queue:       'qk',
  echo:        'ec',
  session:     'st',
} as const

export function generateId(type: keyof typeof PREFIXES): string {
  const prefix = PREFIXES[type]
  const random = randomBytes(6).toString('base64url').slice(0, 8)
  return `${prefix}_${random}`
}

// ── 방 코드 생성 (WHALE42 형식) ───────────────────────
const WORD_POOL = [
  'ECHO', 'WAVE', 'DRIFT', 'PULSE', 'GROOVE', 'VIBE', 'FLOW', 'TIDE',
  'GLOW', 'HAZE', 'LUNA', 'NOVA', 'ORBIT', 'PHASE', 'QUEST', 'REALM',
  'SPARK', 'TRAIL', 'ULTRA', 'VAPOR', 'WARP', 'XENON', 'YIELD', 'ZENITH',
  'WHALE', 'CORAL', 'DUNE', 'EMBER', 'FJORD', 'GALE', 'HAVEN', 'ISLE',
  'JADE', 'KARMA', 'LARK', 'MIST', 'NEON', 'OPAL', 'PRISM', 'QUASAR',
  'RUNE', 'SONIC', 'TERRA', 'UMBER', 'VERDE', 'WISP', 'XRAY', 'YARROW',
  'AZURE', 'BLAZE', 'CEDAR', 'DELTA', 'ENVOY', 'FABLE', 'GLINT', 'HELIX',
]

export async function generateRoomCode(): Promise<string> {
  const MAX_ATTEMPTS = 10

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const word = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)]
    const num = 10 + Math.floor(Math.random() * 90)
    const code = `${word}${num}`

    // 활성 코드 중복 확인
    const exists = await redis.sIsMember(RedisKey.activeCodes(), code)
    if (!exists) {
      await redis.sAdd(RedisKey.activeCodes(), code)
      return code
    }
  }

  throw new Error('방 코드 생성 실패: 재시도 초과')
}

export async function releaseRoomCode(code: string) {
  await redis.sRem(RedisKey.activeCodes(), code)
}

// ── Session Token (HMAC 서명) ──────────────────────────
const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me'

export function signToken(payload: {
  participantId: string
  roomId: string
  isHost: boolean
}): string {
  const data = JSON.stringify(payload)
  const encoded = Buffer.from(data).toString('base64url')
  const sig = createHmac('sha256', SECRET).update(encoded).digest('base64url')
  return `${encoded}.${sig}`
}

export function verifyToken(token: string): {
  participantId: string
  roomId: string
  isHost: boolean
} | null {
  try {
    const [encoded, sig] = token.split('.')
    const expected = createHmac('sha256', SECRET)
      .update(encoded)
      .digest('base64url')

    if (sig !== expected) return null

    return JSON.parse(Buffer.from(encoded, 'base64url').toString())
  } catch {
    return null
  }
}

// ── 응답 헬퍼 ─────────────────────────────────────────
export function ok<T>(data: T) {
  return { success: true, data, error: null }
}

export function fail(code: string, message: string) {
  return { success: false, data: null, error: { code, message } }
}

// ── 기본 방 설정 ──────────────────────────────────────
export const DEFAULT_SETTINGS = {
  playbackControl: 'all',
  skipControl: 'all',
  queueReorder: 'all',
  trackAdd: 'all',
  voteMode: false,
  voteThresholdType: 'ratio',
  voteThresholdValue: 0.5,
}

// ── 시간대 기반 시드 곡 유튜브 ID ─────────────────────
// 실제 서비스에서는 YouTube API로 동적 조회
export function getSeedYoutubeIds(): string[] {
  const hour = new Date().getHours()
  if (hour >= 0 && hour < 6) {
    return ['J_ub7Etch2U', 'A_MjCqQoLLA', 'H5v3kku4y6Q'] // 새벽
  } else if (hour < 12) {
    return ['CevxZvSJLk8', '450p7goxZqg', 'fRh_vgS2dFE'] // 아침
  } else if (hour < 18) {
    return ['YQHsXMglC9A', 'g7DsRBNiP8g', 'kffacxfA7G4'] // 낮
  } else {
    return ['JGwWNGJdvx8', 'nfWlot6h_JM', 'hT_nvWreIhg'] // 저녁
  }
}
