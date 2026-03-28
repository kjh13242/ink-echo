import type { FastifyInstance } from 'fastify'
import { createHash } from 'crypto'
import { redis, RedisKey, TTL } from '../db/redis'
import { ok, fail } from '../lib/utils'

const MOOD_SEED_QUERIES: Record<string, string> = {
  late_drive:  '새벽 드라이브 감성 플레이리스트',
  energy:      '에너지 충전 신나는 노래',
  party:       '파티 분위기 신나는 팝',
  focus:       '집중 로파이 음악',
  daytime:     '기분 좋은 낮 팝송',
  emotional:   '감성 발라드 저녁',
}

export async function searchRoutes(app: FastifyInstance) {

  // ── GET /api/search/tracks — 유튜브 검색 ─────────────
  app.get('/search/tracks', async (req, reply) => {
    const { q, limit = '10', page_token } = req.query as {
      q?: string
      limit?: string
      page_token?: string
    }

    if (!q?.trim()) {
      return reply.status(400).send(fail('VALIDATION_ERROR', '검색어를 입력해주세요'))
    }

    const queryText = q.trim()
    const maxResults = Math.min(parseInt(limit), 20)

    // 캐시 확인
    const cacheKey = createHash('sha256')
      .update(`${queryText}:${maxResults}`)
      .digest('hex')
      .slice(0, 16)

    const cached = await redis.get(RedisKey.ytSearch(cacheKey))
    if (cached && !page_token) {
      return reply.send(ok(JSON.parse(cached)))
    }

    // YouTube Data API 호출
    const ytKey = process.env.YOUTUBE_API_KEY
    if (!ytKey) {
      return reply.status(503).send(fail('YOUTUBE_API_ERROR', 'YouTube API 키가 설정되지 않았어요'))
    }

    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      videoCategoryId: '10', // Music
      q: queryText,
      maxResults: String(maxResults),
      key: ytKey,
      ...(page_token ? { pageToken: page_token } : {}),
    })

    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    )

    if (!ytRes.ok) {
      return reply.status(503).send(fail('YOUTUBE_API_ERROR', 'YouTube 검색에 실패했어요'))
    }

    const ytData = await ytRes.json() as any

    // 영상 길이 조회 (videos API)
    const videoIds = ytData.items
      .map((item: { id: { videoId: string } }) => item.id.videoId)
      .join(',')

    const detailRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status&id=${videoIds}&key=${ytKey}`
    )
    const detailData = await detailRes.json() as any

    const durationMap: Record<string, number> = {}
    const availabilityMap: Record<string, boolean> = {}

    for (const v of detailData.items ?? []) {
      // ISO 8601 duration → 초
      const dur = v.contentDetails?.duration ?? 'PT0S'
      const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      if (match) {
        const h = parseInt(match[1] ?? '0')
        const m = parseInt(match[2] ?? '0')
        const s = parseInt(match[3] ?? '0')
        durationMap[v.id] = h * 3600 + m * 60 + s
      }
      availabilityMap[v.id] = v.status?.embeddable === true
    }

    const tracks = ytData.items.map((item: {
      id: { videoId: string }
      snippet: {
        title: string
        channelTitle: string
        thumbnails: { medium: { url: string } }
      }
    }) => ({
      youtubeId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? '',
      durationSec: durationMap[item.id.videoId] ?? 0,
      isAvailable: availabilityMap[item.id.videoId] ?? true,
    }))

    const result = {
      tracks,
      nextPageToken: ytData.nextPageToken ?? null,
    }

    // 캐시 저장 (1시간)
    if (!page_token) {
      await redis.setEx(RedisKey.ytSearch(cacheKey), TTL.ytSearch, JSON.stringify(result))
    }

    return reply.send(ok(result))
  })

  // ── GET /api/search/recommendations ──────────────────
  app.get('/search/recommendations', async (req, reply) => {
    const { mood, limit = '10' } = req.query as {
      room_id?: string
      mood?: string
      limit?: string
    }

    const moodKey = mood && MOOD_SEED_QUERIES[mood] ? mood : 'daytime'
    const searchQuery = MOOD_SEED_QUERIES[moodKey]
    const maxResults = Math.min(parseInt(limit), 20)

    const cacheKey = createHash('sha256')
      .update(`rec:${moodKey}:${maxResults}`)
      .digest('hex')
      .slice(0, 16)

    const cached = await redis.get(RedisKey.ytSearch(cacheKey))
    if (cached) {
      return reply.send(ok(JSON.parse(cached)))
    }

    const ytKey = process.env.YOUTUBE_API_KEY
    if (!ytKey) {
      return reply.status(503).send(fail('YOUTUBE_API_ERROR', 'YouTube API 키가 설정되지 않았어요'))
    }

    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      videoCategoryId: '10',
      q: searchQuery,
      maxResults: String(maxResults),
      order: 'viewCount',
      key: ytKey,
    })

    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    )

    if (!ytRes.ok) {
      return reply.status(503).send(fail('YOUTUBE_API_ERROR', '추천 곡을 불러오지 못했어요'))
    }

    const ytData = await ytRes.json() as any
    const tracks = ytData.items?.map((item: {
      id: { videoId: string }
      snippet: {
        title: string
        channelTitle: string
        thumbnails: { medium: { url: string } }
      }
    }) => ({
      youtubeId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? '',
      durationSec: 0,
      isAvailable: true,
    })) ?? []

    const result = { tracks, mood: moodKey }
    await redis.setEx(RedisKey.ytSearch(cacheKey), TTL.ytSearch, JSON.stringify(result))

    return reply.send(ok(result))
  })
}
