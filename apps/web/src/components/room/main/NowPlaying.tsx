'use client'

import { Avatar } from '@/components/common/Avatar'
import { formatDuration } from '@/lib/utils'
import type { QueueTrack, Avatar as AvatarType } from '@/types'

interface NowPlayingProps {
  track: QueueTrack
  isPlaying: boolean
  positionSec: number
  canControl: boolean
  canSkip: boolean
  onPlay: () => void
  onSkip: () => void
  onAvatarTap?: (participantId: string) => void
}

export function NowPlaying({
  track,
  isPlaying,
  positionSec,
  canControl,
  canSkip,
  onPlay,
  onSkip,
  onAvatarTap,
}: NowPlayingProps) {
  const progress = track.durationSec > 0
    ? Math.min(positionSec / track.durationSec, 1)
    : 0

  return (
    <div className="px-4 pt-3 pb-2 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
      {/* 트랙 정보 */}
      <div className="flex items-center gap-3 mb-3">
        {/* 신청자 아바타 */}
        <button onClick={() => onAvatarTap?.(track.addedBy.participantId)}>
          <Avatar
            color={track.addedBy.avatar as AvatarType}
            size="sm"
            isHost={track.addedBy.isHost}
          />
        </button>

        {/* 곡명 + 아티스트 */}
        <div className="flex-1 min-w-0">
          <p className="text-body1 text-[var(--text-primary)] truncate">{track.title}</p>
          <p className="text-caption text-[var(--text-secondary)] truncate">{track.artist}</p>
          {track.message && (
            <p className="text-micro text-[var(--text-tertiary)] truncate mt-0.5">
              "{track.message}"
            </p>
          )}
        </div>

        {/* 컨트롤 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 재생/정지 */}
          <button
            onClick={canControl ? onPlay : undefined}
            disabled={!canControl}
            className="w-9 h-9 flex items-center justify-center rounded-full
                       bg-purple-500 text-white
                       disabled:opacity-40 active:opacity-70 transition-opacity"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          {/* 스킵 */}
          <button
            onClick={canSkip ? onSkip : undefined}
            disabled={!canSkip}
            className="w-7 h-7 flex items-center justify-center
                       text-[var(--text-secondary)]
                       disabled:opacity-30 active:opacity-60"
          >
            <SkipIcon />
          </button>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="flex items-center gap-2">
        <span className="text-micro text-[var(--text-tertiary)] w-7 text-right">
          {formatDuration(positionSec)}
        </span>
        <div className="flex-1 h-1 bg-[var(--border-default)] rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-1000"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="text-micro text-[var(--text-tertiary)] w-7">
          {formatDuration(track.durationSec)}
        </span>
      </div>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 2l9 5-9 5V2z" fill="currentColor"/>
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="2.5" y="2" width="3" height="10" rx="1" fill="currentColor"/>
      <rect x="8.5" y="2" width="3" height="10" rx="1" fill="currentColor"/>
    </svg>
  )
}

function SkipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 4l7 5-7 5V4z" fill="currentColor"/>
      <rect x="13" y="4" width="2" height="10" rx="1" fill="currentColor"/>
    </svg>
  )
}
