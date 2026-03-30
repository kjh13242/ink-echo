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
    <div className="flex flex-col flex-shrink-0" style={{ background: 'rgba(238,236,254,0.6)', borderBottom: '0.5px solid rgba(200,196,240,0.5)' }}>
      {/* 프로그레스 바 (가장 상단에 얇게 배치) */}
      <div className="w-full h-[2px] bg-[rgba(180,176,220,0.3)] overflow-hidden">
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${progress * 100}%`, background: '#7F77DD' }}
        />
      </div>

      <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* 썸네일 */}
        {track.thumbnailUrl ? (
          <img
            src={track.thumbnailUrl}
            alt={track.title}
            style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '0.5px solid rgba(180,176,220,0.4)' }}
          />
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: 6, background: '#E8E5F8', flexShrink: 0, border: '0.5px solid rgba(180,176,220,0.4)' }} />
        )}

        {/* 곡명 + 아티스트 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#2A2660' }} className="truncate">{track.title}</p>
          <p style={{ fontSize: 9, color: '#6B67A0', marginTop: 1 }} className="truncate">
            {track.artist} · {isPlaying ? '재생 중' : '일시정지'}
          </p>
        </div>

        {/* 컨트롤 */}
        <div style={{ display: 'flex', gap: 6 }}>
          {/* 재생/정지 */}
          <button
            onClick={canControl ? onPlay : undefined}
            disabled={!canControl}
            className="disabled:opacity-40 active:opacity-70 transition-opacity"
            style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(127,119,221,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7F77DD' }}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          {/* 스킵 */}
          {canSkip && (
            <button
              onClick={onSkip}
              className="active:opacity-70 transition-opacity"
              style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(127,119,221,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7F77DD' }}
            >
              <SkipIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
      <path d="M2 1.5L8 5L2 8.5V1.5Z" fill="currentColor"/>
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
      <rect x="1" y="1" width="3" height="8" rx="1" fill="currentColor"/>
      <rect x="6" y="1" width="3" height="8" rx="1" fill="currentColor"/>
    </svg>
  )
}

function SkipIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 3L8 7L2.5 11V3Z" fill="currentColor"/>
      <rect x="9.5" y="3" width="2" height="8" rx="1" fill="currentColor"/>
    </svg>
  )
}
