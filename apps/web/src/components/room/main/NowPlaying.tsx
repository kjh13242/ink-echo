'use client'

import { Avatar } from '@/components/common/Avatar'
import { formatDuration, cn } from '@/lib/utils'
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
    <div className="bg-[#0A0A0A] pt-3 pb-2">

      {/* 앨범 커버 — 화면 상단 절반 차지 */}
      <div className="px-6 pb-4">
        <div className="w-full aspect-square rounded-[18px] overflow-hidden
                        bg-gradient-to-br from-[#2A2660] via-[#534AB7] to-[#A89EF5]
                        flex items-center justify-center relative">
          {track.thumbnailUrl ? (
            <img
              src={track.thumbnailUrl}
              alt={track.title}
              className="w-full h-full object-cover"
            />
          ) : (
            /* 썸네일 없을 때 기본 앨범아트 */
            <div className="flex flex-col items-center gap-3 opacity-40">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="2"/>
                <circle cx="32" cy="32" r="8" fill="white"/>
                <path d="M44 16l4 16-4 16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          )}

          {/* 신청자 아바타 — 앨범 커버 우하단 */}
          <button
            onClick={() => onAvatarTap?.(track.addedBy.participantId)}
            className="absolute bottom-3 right-3 active:opacity-70"
          >
            <div className="rounded-full ring-2 ring-white/30">
              <Avatar
                color={track.addedBy.avatar as AvatarType}
                size="sm"
                isHost={track.addedBy.isHost}
              />
            </div>
          </button>
        </div>
      </div>

      {/* 곡명 + 아티스트 */}
      <div className="px-6 pb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[20px] font-medium text-[#F0EEFF] truncate leading-tight">
            {track.title}
          </p>
          <p className="text-[14px] text-[#A89EF5] truncate mt-0.5">
            {track.artist}
          </p>
          {track.message && (
            <p className="text-[11px] text-[#606080] truncate mt-1">
              "{track.message}"
            </p>
          )}
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="px-6 pb-3">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#A89EF5] rounded-full transition-all duration-1000"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] text-[#606080]">{formatDuration(positionSec)}</span>
          <span className="text-[11px] text-[#606080]">{formatDuration(track.durationSec)}</span>
        </div>
      </div>

      {/* 재생 컨트롤 */}
      <div className="px-5 pb-4 flex items-center justify-between">
        {/* 셔플 (장식용) */}
        <button className="p-2 text-[#606080] active:opacity-60">
          <ShuffleIcon />
        </button>

        {/* 이전 (장식용) */}
        <button className="p-2 text-[#A0A0C0] active:opacity-60">
          <PrevIcon />
        </button>

        {/* 재생/정지 — 메인 버튼 */}
        <button
          onClick={canControl ? onPlay : undefined}
          disabled={!canControl}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center',
            'bg-[#A89EF5] text-[#0A0A0A]',
            'disabled:opacity-40 active:opacity-80 transition-opacity'
          )}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* 스킵 */}
        <button
          onClick={canSkip ? onSkip : undefined}
          disabled={!canSkip}
          className="p-2 text-[#A0A0C0] disabled:opacity-30 active:opacity-60"
        >
          <SkipIcon />
        </button>

        {/* 큐 (장식용) */}
        <button className="p-2 text-[#606080] active:opacity-60">
          <QueueIcon />
        </button>
      </div>

      {/* 구분선 */}
      <div className="mx-5 border-t border-white/[0.06]" />
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M7 5l12 6.5L7 18V5z" fill="currentColor"/>
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="5" y="4" width="4" height="14" rx="1.5" fill="currentColor"/>
      <rect x="13" y="4" width="4" height="14" rx="1.5" fill="currentColor"/>
    </svg>
  )
}

function SkipIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M6 7l9 7-9 7V7z" fill="currentColor"/>
      <rect x="18" y="7" width="3" height="14" rx="1.5" fill="currentColor"/>
    </svg>
  )
}

function PrevIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M22 7l-9 7 9 7V7z" fill="currentColor"/>
      <rect x="7" y="7" width="3" height="14" rx="1.5" fill="currentColor"/>
    </svg>
  )
}

function ShuffleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 10c0-2.8 2.2-5 5-5h6M17 10c0 2.8-2.2 5-5 5H6"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 7l2-2-2-2M8 15l-2 2 2 2"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function QueueIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 6h14M3 10h10M3 14h7"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
