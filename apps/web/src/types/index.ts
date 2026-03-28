// ─── 아바타 ───────────────────────────────────────────────
export type Avatar = 'purple' | 'green' | 'yellow' | 'pink'

// ─── 참여자 ───────────────────────────────────────────────
export interface Participant {
  participantId: string   // pt_ 접두사
  nickname: string
  avatar: Avatar
  isHost: boolean
  joinOrder: number
}

// ─── 큐 트랙 ──────────────────────────────────────────────
export type TrackStatus =
  | 'pending'
  | 'playing'
  | 'played'
  | 'skipped'
  | 'removed'
  | 'unavailable'

export interface QueueTrack {
  queueId: string         // qk_ 접두사
  position: number
  youtubeId: string
  title: string
  artist: string
  thumbnailUrl: string
  durationSec: number
  message: string | null
  addedBy: Participant
  voteCount: number
  status: TrackStatus
}

// 검색 결과 (큐 추가 전)
export interface SearchTrack {
  youtubeId: string
  title: string
  artist: string
  thumbnailUrl: string
  durationSec: number
  isAvailable: boolean
}

// ─── 방 ───────────────────────────────────────────────────
export type RoomStatus = 'active' | 'ended'
export type PermissionTarget = 'all' | 'host_only'
export type VoteThresholdType = 'absolute' | 'ratio'

export interface RoomSettings {
  playbackControl: PermissionTarget
  skipControl: PermissionTarget | 'vote'
  queueReorder: PermissionTarget
  trackAdd: PermissionTarget
  voteMode: boolean
  voteThresholdType: VoteThresholdType
  voteThresholdValue: number  // absolute: N(정수), ratio: 0.0~1.0
}

export interface Room {
  roomId: string          // rm_ 접두사
  code: string            // WHALE42
  name: string
  status: RoomStatus
  settings: RoomSettings
  plan: 'free' | 'pro'
  inviteUrl: string
}

// ─── 재생 상태 ────────────────────────────────────────────
export interface PlaybackState {
  isPlaying: boolean
  currentQueueId: string | null
  positionSec: number
  updatedAt: number       // Unix ms
}

// ─── 이모지 ───────────────────────────────────────────────
export type Emoji = '🔥' | '💜' | '👍' | '😭' | '🎉' | '✨' | '🙌' | '😮'

export const EMOJI_LIST: Emoji[] = ['🔥', '💜', '👍', '😭', '🎉', '✨', '🙌', '😮']

export interface ReactionStack {
  emoji: Emoji
  count: number
  myReacted: boolean
}

// ─── 세션 ─────────────────────────────────────────────────
export interface Session {
  sessionToken: string
  participantId: string
  roomId: string
  isHost: boolean
}

// ─── 에코 카드 ────────────────────────────────────────────
export interface EchoTrack {
  queueId: string
  youtubeId: string
  title: string
  artist: string
  addedByNickname: string
  message: string | null
  playOrder: number
  status: 'played' | 'skipped' | 'unavailable'
  reactionCount: number
  topEmoji: Emoji | null
  isEncore: boolean
}

export interface EchoCard {
  echoCardId: string      // ec_ 접두사
  roomId: string
  roomName: string
  hostNickname: string
  startedAt: string
  endedAt: string
  durationMin: number
  trackCount: number
  participantCount: number
  totalReactions: number
  encoreCount: number
  shareImageUrl: string | null
  topTracks: EchoTrack[]
  participants: Participant[]
}

// ─── API 공통 응답 ────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: {
    code: string
    message: string
  } | null
}

// ─── WebSocket 이벤트 ─────────────────────────────────────
export type WSEventType =
  | 'connected'
  | 'queue:add'
  | 'queue:remove'
  | 'queue:reorder'
  | 'queue:unavailable'
  | 'queue:exhausted'
  | 'playback:play'
  | 'playback:pause'
  | 'playback:skip'
  | 'playback:end'
  | 'playback:ad_start'
  | 'playback:ad_end'
  | 'reaction:add'
  | 'reaction:remove'
  | 'encore:update'
  | 'encore:trigger'
  | 'vote:update'
  | 'vote:skip'
  | 'participant:join'
  | 'participant:leave'
  | 'host:transfer'
  | 'room:full'
  | 'room:end'

export interface WSEvent {
  type: WSEventType
  payload: unknown
}
