'use client'

import { useState, useRef, useCallback } from 'react'
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
  onAddTrack?: () => void
  compact?: boolean
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
  onAddTrack,
  compact = false,
}: QueueListProps) {
  // currentQueueId가 pending 트랙(NowPlaying에 표시 중)이면 큐에서 제외 — 중복 방지
  const pendingTracks = tracks.filter(
    (t) => t.status === 'pending' && t.queueId !== currentQueueId
  )

  // ── 드래그 상태 ───────────────────────────────────────
  const [dragIndex, setDragIndex] = useState<number | null>(null)  // 원본 인덱스
  const [hoverIndex, setHoverIndex] = useState<number | null>(null) // 현재 드롭 위치
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  // 드래그 중 화면에 보이는 순서 (시각적 미리보기)
  const orderedTracks = (() => {
    if (dragIndex === null || hoverIndex === null || dragIndex === hoverIndex)
      return pendingTracks
    const arr = [...pendingTracks]
    const [moved] = arr.splice(dragIndex, 1)
    arr.splice(hoverIndex, 0, moved)
    return arr
  })()

  // clientY를 받아서 몇 번째 슬롯 위에 있는지 계산
  const getHoverIdx = useCallback((clientY: number) => {
    const items = itemRefs.current
    for (let i = 0; i < items.length; i++) {
      const el = items[i]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) return i
    }
    return Math.max(0, items.length - 1)
  }, [])

  const startDrag = useCallback((idx: number) => {
    setDragIndex(idx)
    setHoverIndex(idx)
  }, [])

  const moveDrag = useCallback((clientY: number) => {
    if (dragIndex === null) return
    setHoverIndex(getHoverIdx(clientY))
  }, [dragIndex, getHoverIdx])

  const endDrag = useCallback(() => {
    if (dragIndex !== null && hoverIndex !== null && dragIndex !== hoverIndex) {
      const draggedQueueId = pendingTracks[dragIndex].queueId
      const targetPosition  = pendingTracks[hoverIndex].position
      onReorder(draggedQueueId, targetPosition)
    }
    setDragIndex(null)
    setHoverIndex(null)
  }, [dragIndex, hoverIndex, pendingTracks, onReorder])

  return (
    <div className={cn("bg-[#0A0A0A]", compact ? "pb-4" : "pb-28")}>
      {/* 다음 재생 헤더 */}
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#606080] tracking-wider uppercase">
          다음 재생
        </span>
        {pendingTracks.length > 0 && (
          <span className="text-[13px] text-[#A89EF5]">
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
            onAction={onAddTrack}
          />
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-1 select-none">
          {orderedTracks.map((track, visualIdx) => {
            // 원본 배열에서 이 트랙이 몇 번째였는지 (드래그 상태 판단용)
            const origIdx = pendingTracks.findIndex((t) => t.queueId === track.queueId)
            const isDragging = dragIndex !== null && origIdx === dragIndex

            return (
              <div
                key={track.queueId}
                ref={(el) => { itemRefs.current[visualIdx] = el }}
              >
                <QueueTrackItem
                  track={track}
                  index={visualIdx}
                  isNext={visualIdx === 0 && dragIndex === null}
                  isDragging={isDragging}
                  isDropTarget={hoverIndex === visualIdx && dragIndex !== null && !isDragging}
                  canReorder={canReorder}
                  canVote={canVote}
                  hasVoted={myVotes.includes(track.queueId)}
                  onRemove={() => onRemove(track.queueId)}
                  onVote={() => onVote(track.queueId)}
                  onAvatarTap={() => onAvatarTap(track.addedBy.participantId)}
                  onDragHandlePointerDown={startDrag}
                  onDragHandlePointerMove={moveDrag}
                  onDragHandlePointerUp={endDrag}
                  origIdx={origIdx}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface QueueTrackItemProps {
  track: QueueTrack
  index: number
  isNext: boolean
  isDragging: boolean
  isDropTarget: boolean
  canReorder: boolean
  canVote: boolean
  hasVoted: boolean
  onRemove: () => void
  onVote: () => void
  onAvatarTap: () => void
  onDragHandlePointerDown: (idx: number) => void
  onDragHandlePointerMove: (clientY: number) => void
  onDragHandlePointerUp: () => void
  origIdx: number
}

function QueueTrackItem({
  track,
  isNext,
  isDragging,
  isDropTarget,
  canReorder,
  canVote,
  hasVoted,
  origIdx,
  onRemove,
  onVote,
  onAvatarTap,
  onDragHandlePointerDown,
  onDragHandlePointerMove,
  onDragHandlePointerUp,
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
        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
        isNext && !isDragging
          ? 'bg-[rgba(168,158,245,0.08)] border border-[rgba(168,158,245,0.2)]'
          : 'bg-white/[0.03]',
        isUnavailable && 'opacity-45',
        removing && 'opacity-0 translate-x-2',
        isDragging && 'opacity-40 scale-[0.98]',
        isDropTarget && 'ring-1 ring-[#A89EF5]/40 bg-[rgba(168,158,245,0.05)]',
      )}
    >
      {/* 다음 재생 인디케이터 바 */}
      <div
        className={cn(
          'w-[3px] h-8 rounded-full flex-shrink-0',
          isNext && !isDragging ? 'bg-[#A89EF5]' : 'bg-transparent'
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
          'text-[14px] font-medium truncate',
          isNext && !isDragging ? 'text-[#A89EF5]' : 'text-[#F0EEFF]'
        )}>
          {track.title}
        </p>
        <p className="text-[13px] text-[#606080] truncate mt-0.5">{track.artist}</p>
        {track.message && (
          <p className="text-[12px] text-[#404060] truncate mt-0.5">"{track.message}"</p>
        )}
        {isUnavailable && (
          <span className="inline-block text-[12px] text-error mt-0.5">재생 불가</span>
        )}
      </div>

      {/* 재생 시간 */}
      {track.durationSec > 0 && (
        <span className="text-[13px] text-[#404060] flex-shrink-0">
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
            'text-[12px] transition-colors active:scale-95',
            hasVoted
              ? 'text-[#A89EF5] bg-[rgba(168,158,245,0.15)]'
              : 'text-[#404060] bg-white/[0.05]'
          )}
        >
          <VoteIcon />
          <span>{track.voteCount}</span>
        </button>
      )}

      {/* 드래그 핸들 — pointer events로 터치/마우스 모두 처리 */}
      {canReorder && !isUnavailable && (
        <div
          className="text-[#505070] cursor-grab active:cursor-grabbing flex-shrink-0
                     w-[44px] h-[44px] flex items-center justify-center -mr-2 touch-none"
          onPointerDown={(e) => {
            e.preventDefault()
            e.currentTarget.setPointerCapture(e.pointerId)
            onDragHandlePointerDown(origIdx)
          }}
          onPointerMove={(e) => {
            onDragHandlePointerMove(e.clientY)
          }}
          onPointerUp={onDragHandlePointerUp}
          onPointerCancel={onDragHandlePointerUp}
        >
          <DragIcon />
        </div>
      )}

      {/* 삭제 버튼 — 터치 타겟 44px */}
      <button
        onClick={handleRemove}
        className="flex-shrink-0 w-[44px] h-[44px] flex items-center justify-center active:scale-95 transition-transform -mr-2"
      >
        <span className="w-7 h-7 flex items-center justify-center rounded-lg
                         bg-[rgba(226,75,74,0.12)] border border-[rgba(226,75,74,0.25)]
                         text-error">
          <XIcon />
        </span>
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
      <circle cx="5.5" cy="4.5" r="1.2" fill="currentColor"/>
      <circle cx="5.5" cy="8" r="1.2" fill="currentColor"/>
      <circle cx="5.5" cy="11.5" r="1.2" fill="currentColor"/>
      <circle cx="10.5" cy="4.5" r="1.2" fill="currentColor"/>
      <circle cx="10.5" cy="8" r="1.2" fill="currentColor"/>
      <circle cx="10.5" cy="11.5" r="1.2" fill="currentColor"/>
    </svg>
  )
}
