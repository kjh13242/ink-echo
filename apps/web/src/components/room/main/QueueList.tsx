'use client'

import { useState, useRef } from 'react'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { cn, formatDuration } from '@/lib/utils'
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
  const pendingTracks = tracks.filter((t) => t.status === 'pending')

  return (
    <div className="bg-[#0A0A0A] pb-28">
      {/* 다음 재생 헤더 */}
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium text-[#606080] tracking-wider uppercase">
          다음 재생
        </span>
        {pendingTracks.length > 0 && (
          <span className="text-[11px] text-[#A89EF5]">
            {pendingTracks.length}곡
          </span>
        )}
      </div>

      {pendingTracks.length === 0 ? (
        <div className="px-5 py-6">
          <EmptyState
            message="아직 아무 곡도 없어 — 첫 번째로 넣어볼래?"
            avatarColor="purple"
            actionLabel="곡 추가하기"
          />
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-1">
          {pendingTracks.map((track, idx) => (
            <QueueTrackItem
              key={track.queueId}
              track={track}
              index={idx}
              isNext={idx === 0}
              canReorder={canReorder}
              canVote={canVote}
              hasVoted={myVotes.includes(track.queueId)}
              onRemove={() => onRemove(track.queueId)}
              onVote={() => onVote(track.queueId)}
              onAvatarTap={() => onAvatarTap(track.addedBy.participantId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface QueueTrackItemProps {
  track: QueueTrack
  index: number
  isNext: boolean
  canReorder: boolean
  canVote: boolean
  hasVoted: boolean
  onRemove: () => void
  onVote: () => void
  onAvatarTap: () => void
}

function QueueTrackItem({
  track,
  isNext,
  canReorder,
  canVote,
  hasVoted,
  onRemove,
  onVote,
  onAvatarTap,
}: QueueTrackItemProps) {
  const [removing, setRemoving] = useState(false)
  const isUnavailable = track.status === 'unavailable'

  const handleRemove = () => {
    setRemoving(true)
    setTimeout(() => onRemove(), 220)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
        isNext
          ? 'bg-[rgba(168,158,245,0.08)] border border-[rgba(168,158,245,0.2)]'
          : 'bg-white/[0.03]',
        isUnavailable && 'opacity-45',
        removing && 'opacity-0 translate-x-2'
      )}
    >
      {/* 다음 재생 인디케이터 바 */}
      <div
        className={cn(
          'w-[3px] h-8 rounded-full flex-shrink-0',
          isNext ? 'bg-[#A89EF5]' : 'bg-transparent'
        )}
      />

      {/* 썸네일 */}
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#1E1E2E]">
        {track.thumbnailUrl ? (
          <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 3l7 4-7 4V3z" fill="white" opacity="0.4"/>
            </svg>
          </div>
        )}
      </div>

      {/* 곡 정보 */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-[13px] font-medium truncate',
          isNext ? 'text-[#A89EF5]' : 'text-[#F0EEFF]'
        )}>
          {track.title}
        </p>
        <p className="text-[11px] text-[#606080] truncate mt-0.5">{track.artist}</p>
        {track.message && (
          <p className="text-[10px] text-[#404060] truncate mt-0.5">"{track.message}"</p>
        )}
        {isUnavailable && (
          <span className="inline-block text-[10px] text-error mt-0.5">재생 불가</span>
        )}
      </div>

      {/* 재생 시간 */}
      {track.durationSec > 0 && (
        <span className="text-[11px] text-[#404060] flex-shrink-0">
          {formatDuration(track.durationSec)}
        </span>
      )}

      {/* 신청자 아바타 */}
      <button onClick={onAvatarTap} className="flex-shrink-0">
        <Avatar color={track.addedBy.avatar as AvatarType} size="sm" isHost={track.addedBy.isHost} />
      </button>

      {/* 투표 버튼 */}
      {canVote && !isUnavailable && (
        <button
          onClick={onVote}
          className={cn(
            'flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg flex-shrink-0',
            'text-[10px] transition-colors active:scale-95',
            hasVoted
              ? 'text-[#A89EF5] bg-[rgba(168,158,245,0.15)]'
              : 'text-[#404060] bg-white/[0.05]'
          )}
        >
          <VoteIcon />
          <span>{track.voteCount}</span>
        </button>
      )}

      {/* 드래그 핸들 */}
      {canReorder && !isUnavailable && (
        <div className="text-[#404060] cursor-grab active:cursor-grabbing flex-shrink-0">
          <DragIcon />
        </div>
      )}

      {/* 삭제 버튼 — X 아이콘 */}
      <button
        onClick={handleRemove}
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg
                   bg-[rgba(226,75,74,0.12)] border border-[rgba(226,75,74,0.25)]
                   text-error active:scale-95 transition-transform"
      >
        <XIcon />
      </button>
    </div>
  )
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
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
