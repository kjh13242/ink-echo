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
    <div className="bg-[#0A0A0A]">

      {/* 앨범 커버 */}
      <div style={{ padding: '20px 28px 12px' }}>
        <div
          className="w-full overflow-hidden relative"
          style={{
            aspectRatio: '1',
            borderRadius: 16,
            background: 'linear-gradient(135deg, #2A2660 0%, #534AB7 50%, #A89EF5 100%)',
          }}
        >
          {track.thumbnailUrl ? (
            <img
              src={track.thumbnailUrl}
              alt={track.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <svg className="absolute opacity-30" width="64" height="64" viewBox="0 0 64 64" fill="none"
                   style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="2"/>
                <circle cx="32" cy="32" r="8" fill="white"/>
                <path d="M44 16l4 16-4 16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full flex items-center justify-center"
                     style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.12)' }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M10 7l12 7-12 7V7z" fill="white"/>
                  </svg>
                </div>
              </div>
            </>
          )}

          {/* 신청자 아바타 — 우하단 */}
          <button
            onClick={() => onAvatarTap?.(track.addedBy.participantId)}
            className="absolute active:opacity-70"
            style={{ bottom: 10, right: 10 }}
          >
            <div className="rounded-full" style={{ outline: '2px solid rgba(255,255,255,0.25)' }}>
              <Avatar
                color={track.addedBy.avatar as AvatarType}
                size="sm"
                isHost={track.addedBy.isHost}
              />
            </div>
          </button>
        </div>
      </div>

      {/* 곡명 + 아티스트 + 하트 */}
      <div style={{ padding: '0 28px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 20, fontWeight: 500, color: '#F0EEFF', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {track.title}
          </p>
          <p style={{ fontSize: 14, color: '#A89EF5', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {track.artist}
          </p>
          {track.message && (
            <p style={{ fontSize: 11, color: '#606080', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              &ldquo;{track.message}&rdquo;
            </p>
          )}
        </div>
        <button className="active:scale-95 transition-transform" style={{ padding: 4, marginTop: 2, flexShrink: 0 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 18.5S3 13.5 3 8a4 4 0 0 1 8-1h0a4 4 0 0 1 8 1c0 5.5-8 10.5-8 10.5z"
              stroke="#A89EF5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* 프로그레스 바 */}
      <div style={{ padding: '8px 28px 4px' }}>
        <div
          style={{ height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: '#A89EF5',
              borderRadius: 2,
              transition: 'width 1s linear',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: '#606080' }}>{formatDuration(positionSec)}</span>
          <span style={{ fontSize: 11, color: '#606080' }}>{formatDuration(track.durationSec)}</span>
        </div>
      </div>

      {/* 재생 컨트롤 */}
      <div style={{ padding: '8px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>

        {/* 재생/정지 */}
        <button
          onClick={canControl ? onPlay : undefined}
          disabled={!canControl}
          className="active:opacity-80 disabled:opacity-40 transition-opacity flex items-center justify-center"
          style={{ width: 56, height: 56, borderRadius: '50%', background: '#A89EF5', border: 'none', cursor: canControl ? 'pointer' : 'default', flexShrink: 0 }}
        >
          {isPlaying ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="5" y="4" width="4" height="14" rx="1.5" fill="#0A0A0A"/>
              <rect x="13" y="4" width="4" height="14" rx="1.5" fill="#0A0A0A"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M7 5l12 6.5L7 18V5z" fill="#0A0A0A"/>
            </svg>
          )}
        </button>

        {/* 스킵 */}
        <button
          onClick={canSkip ? onSkip : undefined}
          disabled={!canSkip}
          className="active:opacity-60 disabled:opacity-30 transition-opacity"
          style={{ padding: 8, color: '#A0A0C0', background: 'none', border: 'none', cursor: canSkip ? 'pointer' : 'default' }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M6 7l9 7-9 7V7z" fill="currentColor"/>
            <rect x="18" y="7" width="3" height="14" rx="1.5" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* 구분선 */}
      <div style={{ margin: '0 20px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }} />
    </div>
  )
}
