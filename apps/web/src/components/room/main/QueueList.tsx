'use client'

import { useState, useRef } from 'react'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { cn } from '@/lib/utils'
import type { QueueTrack, Avatar as AvatarType } from '@/types'

interface QueueListProps {
  tracks: QueueTrack[]
  currentQueueId: string | null
  canReorder: boolean
  canVote: boolean
  myVotes: string[]
  onReorder: (queueId: string, newPos: number) => void
  onRemove: (queueId: string) => void
  onVote: (queueId: string) => void
  onAvatarTap: (participantId: string) => void
}

export function QueueList({
  tracks,
  currentQueueId,
  canReorder,
  canVote,
  myVotes,
  onReorder,
  onRemove,
  onVote,
  onAvatarTap,
}: QueueListProps) {
  if (tracks.length === 0) {
    return (
      <EmptyState
        message="아직 아무 곡도 없어 — 첫 번째로 넣어볼래?"
        avatarColor="purple"
        actionLabel="곡 추가하기"
      />
    )
  }

  return (
    <div className="flex flex-col gap-1 py-2">
      {tracks.map((track, idx) => (
        <QueueTrackItem
          key={track.queueId}
          track={track}
          index={idx}
          isPlaying={track.queueId === currentQueueId}
          canReorder={canReorder}
          canRemove={true} // 권한 체크는 서버에서
          canVote={canVote}
          hasVoted={myVotes.includes(track.queueId)}
          onRemove={() => onRemove(track.queueId)}
          onVote={() => onVote(track.queueId)}
          onAvatarTap={() => onAvatarTap(track.addedBy.participantId)}
        />
      ))}
    </div>
  )
}

interface QueueTrackItemProps {
  track: QueueTrack
  index: number
  isPlaying: boolean
  canReorder: boolean
  canRemove: boolean
  canVote: boolean
  hasVoted: boolean
  onRemove: () => void
  onVote: () => void
  onAvatarTap: () => void
}

function QueueTrackItem({
  track,
  isPlaying,
  canReorder,
  canRemove,
  canVote,
  hasVoted,
  onRemove,
  onVote,
  onAvatarTap,
}: QueueTrackItemProps) {
  const [swipeX, setSwipeX] = useState(0)
  const startXRef = useRef(0)
  const isUnavailable = track.status === 'unavailable'

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = startXRef.current - e.touches[0].clientX
    if (diff > 0) setSwipeX(Math.min(diff, 72))
  }

  const handleTouchEnd = () => {
    if (swipeX > 40) {
      setSwipeX(72) // 삭제 버튼 고정
    } else {
      setSwipeX(0)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-btn">
      {/* 삭제 버튼 (스와이프 뒤) */}
      {canRemove && (
        <div
          className="absolute right-0 top-0 bottom-0 w-16 bg-error
                     flex items-center justify-center rounded-r-btn"
        >
          <button onClick={onRemove} className="text-white text-caption font-medium">
            삭제
          </button>
        </div>
      )}

      {/* 트랙 아이템 */}
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-surface)] rounded-btn',
          'transition-transform touch-pan-y',
          isUnavailable && 'opacity-45'
        )}
        style={{ transform: `translateX(-${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 재생 중 인디케이터 */}
        {isPlaying && (
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0 animate-pulse" />
        )}

        {/* 썸네일 */}
        {track.thumbnailUrl ? (
          <img
            src={track.thumbnailUrl}
            alt={track.title}
            className="w-9 h-9 rounded-thumb object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-thumb bg-[var(--bg-input)] flex-shrink-0" />
        )}

        {/* 곡 정보 */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-body1 truncate',
            isPlaying ? 'text-purple-600' : 'text-[var(--text-primary)]'
          )}>
            {track.title}
          </p>
          <p className="text-caption text-[var(--text-secondary)] truncate">
            {track.artist}
          </p>
          {track.message && (
            <p className="text-micro text-[var(--text-tertiary)] truncate">
              "{track.message}"
            </p>
          )}
          {isUnavailable && (
            <span className="inline-block px-1.5 py-0.5 bg-error/10 text-error
                             text-micro rounded-badge mt-0.5">
              재생 불가
            </span>
          )}
        </div>

        {/* 신청자 아바타 */}
        <button onClick={onAvatarTap}>
          <Avatar
            color={track.addedBy.avatar as AvatarType}
            size="sm"
            isHost={track.addedBy.isHost}
          />
        </button>

        {/* 투표 버튼 */}
        {canVote && !isUnavailable && (
          <button
            onClick={onVote}
            className={cn(
              'flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-btn',
              'text-micro transition-colors active:scale-95',
              hasVoted
                ? 'text-purple-600 bg-purple-100'
                : 'text-[var(--text-tertiary)] bg-[var(--bg-input)]'
            )}
          >
            <VoteIcon />
            <span>{track.voteCount}</span>
          </button>
        )}

        {/* 드래그 핸들 */}
        {canReorder && !isUnavailable && (
          <div className="text-[var(--text-placeholder)] cursor-grab active:cursor-grabbing pl-1">
            <DragIcon />
          </div>
        )}
      </div>
    </div>
  )
}

function VoteIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 2l4 6H2l4-6z" fill="currentColor"/>
    </svg>
  )
}

function DragIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="4" y="4" width="8" height="1.5" rx=".75" fill="currentColor"/>
      <rect x="4" y="7.25" width="8" height="1.5" rx=".75" fill="currentColor"/>
      <rect x="4" y="10.5" width="8" height="1.5" rx=".75" fill="currentColor"/>
    </svg>
  )
}
