'use client'

import { useState } from 'react'
import { BottomSheet } from '@/components/common/BottomSheet'
import { Button } from '@/components/common/Button'

interface RoomHeaderProps {
  roomName: string
  onInvite: () => void
  onSettings?: () => void
  onLeave: () => void
  onEndRoom?: () => void
}

export function RoomHeader({
  roomName,
  onInvite,
  onSettings,
  onLeave,
  onEndRoom,
}: RoomHeaderProps) {
  const [showMore, setShowMore] = useState(false)
  const [endConfirm, setEndConfirm] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  return (
    <>
      <header className="flex items-center gap-2 px-4 py-3 bg-[rgba(200,196,244,0.5)] backdrop-blur-sm sticky top-0 z-10">
        {/* 방 이름 */}
        <h1 className="flex-1 text-body1 font-medium text-[var(--text-primary)] truncate">
          {roomName}
        </h1>

        {/* 사람 추가 */}
        <button
          onClick={onInvite}
          className="w-8 h-8 flex items-center justify-center rounded-full
                     bg-[var(--bg-surface)] border border-[var(--border-default)]
                     text-[var(--text-secondary)] active:opacity-60"
        >
          <PersonAddIcon />
        </button>

        {/* 더보기 */}
        <button
          onClick={() => setShowMore(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full
                     bg-[var(--bg-surface)] border border-[var(--border-default)]
                     text-[var(--text-secondary)] active:opacity-60"
        >
          <MoreIcon />
        </button>
      </header>

      {/* 더보기 바텀시트 */}
      <BottomSheet isOpen={showMore} onClose={() => setShowMore(false)}>
        <div className="px-4 pb-8 flex flex-col gap-1">
          {onSettings && (
            <MoreItem
              label="방 설정"
              onClick={() => { setShowMore(false); onSettings() }}
            />
          )}
          <MoreItem
            label="방 나가기"
            onClick={() => { setShowMore(false); onLeave() }}
          />
          {onEndRoom && (
            <MoreItem
              label="방 종료"
              danger
              onClick={() => { setShowMore(false); setEndConfirm(true) }}
            />
          )}
        </div>
      </BottomSheet>

      {/* 방 종료 확인 모달 */}
      {endConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setEndConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-[300px] bg-[var(--bg-sheet)] rounded-card p-5 shadow-xl">
            <h2 className="text-h2 text-[var(--text-primary)] mb-2">방을 종료할까요?</h2>
            <p className="text-caption text-[var(--text-secondary)] mb-5">
              종료하면 모든 참여자가 나가고 오늘의 에코를 볼 수 있어요
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setEndConfirm(false)}
              >
                계속 듣기
              </Button>
              <Button
                variant="danger"
                fullWidth
                isLoading={isEnding}
                onClick={async () => {
                  setIsEnding(true)
                  try {
                    await onEndRoom?.()
                  } finally {
                    setIsEnding(false)
                    setEndConfirm(false)
                  }
                }}
              >
                종료
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MoreItem({
  label,
  danger = false,
  onClick,
}: {
  label: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2 py-3 rounded-btn text-body1
                  active:bg-[var(--bg-input)] transition-colors
                  ${danger ? 'text-error' : 'text-[var(--text-primary)]'}`}
    >
      {label}
    </button>
  )
}

function PersonAddIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="currentColor" opacity=".7"/>
      <path d="M2 14c0-3.314 2.686-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M13 11v4M11 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="3.5" r="1.2" fill="currentColor"/>
      <circle cx="8" cy="8"   r="1.2" fill="currentColor"/>
      <circle cx="8" cy="12.5" r="1.2" fill="currentColor"/>
    </svg>
  )
}
