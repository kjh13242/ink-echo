'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { BottomSheet } from '@/components/common/BottomSheet'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/common/Button'
import { shareKakao } from '@/lib/kakao'
import { useToastStore } from '@/store/toastStore'
import type { Room, Participant } from '@/types'

interface InviteSheetProps {
  isOpen: boolean
  onClose: () => void
  room: Room
  participants: Participant[]
}

export function InviteSheet({ isOpen, onClose, room, participants }: InviteSheetProps) {
  const [showQR, setShowQR] = useState(false)
  const showToast = useToastStore((s) => s.showToast)

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(room.code)
    showToast({ type: 'success', message: '방 코드가 복사됐어요' })
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(room.inviteUrl)
    showToast({ type: 'success', message: '링크가 복사됐어요' })
  }

  const handleKakao = () => {
    shareKakao({
      roomName: room.name,
      participantCount: participants.length,
      inviteUrl: room.inviteUrl,
    })
  }

  const handleMore = async () => {
    if (navigator.share) {
      await navigator.share({ title: room.name, url: room.inviteUrl })
    } else {
      handleCopyLink()
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={() => { setShowQR(false); onClose() }}>
      <div className="px-4 pb-8">
        {showQR ? (
          // ── QR 뷰 ─────────────────────────────────────
          <>
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setShowQR(false)}
                className="text-[var(--text-secondary)]"
              >
                <BackIcon />
              </button>
              <h2 className="text-h2 text-[var(--text-primary)]">QR 코드</h2>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-card border border-[var(--border-default)]">
                <QRCodeSVG
                  value={room.inviteUrl}
                  size={200}
                  level="M"
                  imageSettings={{
                    src: '/favicon.ico',
                    height: 32,
                    width: 32,
                    excavate: true,
                  }}
                />
              </div>

              <div className="text-center">
                <p className="text-[22px] font-[Arial] font-medium tracking-[0.08em] text-purple-900">
                  {room.code}
                </p>
                <p className="text-caption text-[var(--text-tertiary)] mt-1">
                  QR 스캔 또는 코드 입력으로 입장
                </p>
              </div>
            </div>
          </>
        ) : (
          // ── 메인 초대 화면 ─────────────────────────────
          <>
            <h2 className="text-h2 text-[var(--text-primary)] mb-4">친구 초대하기</h2>

            {/* 방 코드 */}
            <button
              onClick={handleCopyCode}
              className="w-full flex items-center justify-between px-4 py-3 mb-4
                         bg-[var(--bg-input)] rounded-btn border border-[var(--border-default)]
                         active:opacity-70"
            >
              <span className="text-caption text-[var(--text-tertiary)]">방 코드</span>
              <span className="text-[18px] font-[Arial] font-medium tracking-[0.08em] text-purple-900">
                {room.code}
              </span>
              <span className="text-caption text-purple-500">복사</span>
            </button>

            {/* 공유 버튼 */}
            <div className="flex flex-col gap-2 mb-5">
              <Button
                variant="kakao"
                size="lg"
                fullWidth
                onClick={handleKakao}
              >
                카카오톡으로 초대
              </Button>

              <div className="grid grid-cols-3 gap-2">
                <ShareBtn label="QR 코드" icon={<QRIcon />} onClick={() => setShowQR(true)} />
                <ShareBtn label="링크 복사" icon={<LinkIcon />} onClick={handleCopyLink} />
                <ShareBtn label="더보기" icon={<MoreIcon />} onClick={handleMore} />
              </div>
            </div>

            {/* 참여자 현황 */}
            <div>
              <p className="text-caption text-[var(--text-tertiary)] mb-2">
                현재 {participants.length}명 참여 중
              </p>
              <div className="flex gap-2 flex-wrap">
                {participants.map((p) => (
                  <div key={p.participantId} className="flex flex-col items-center gap-1">
                    <Avatar color={p.avatar} size="sm" isHost={p.isHost} />
                    <p className="text-micro text-[var(--text-secondary)] max-w-[40px] truncate text-center">
                      {p.nickname}
                    </p>
                  </div>
                ))}

                {/* 빈 슬롯 */}
                {room.plan === 'free' &&
                  Array.from({ length: Math.max(0, 10 - participants.length) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-dashed
                                 border-[var(--border-default)] flex items-center justify-center"
                    >
                      <span className="text-micro text-[var(--text-placeholder)]">+</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  )
}

function ShareBtn({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 py-3 rounded-btn
                 bg-[var(--bg-input)] border border-[var(--border-default)]
                 text-[var(--text-secondary)] active:opacity-70"
    >
      {icon}
      <span className="text-micro">{label}</span>
    </button>
  )
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function QRIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="4" y="4" width="3" height="3" fill="currentColor"/>
      <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="13" y="4" width="3" height="3" fill="currentColor"/>
      <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="4" y="13" width="3" height="3" fill="currentColor"/>
      <rect x="11" y="11" width="2" height="2" fill="currentColor"/>
      <rect x="15" y="11" width="2" height="2" fill="currentColor"/>
      <rect x="11" y="15" width="2" height="2" fill="currentColor"/>
      <rect x="15" y="15" width="2" height="2" fill="currentColor"/>
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M8 12L12 8M8.5 5.5l1.5-1.5a4 4 0 0 1 5.657 5.657l-1.5 1.5M11.5 14.5l-1.5 1.5a4 4 0 0 1-5.657-5.657l1.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="5" cy="10" r="1.5" fill="currentColor"/>
      <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
    </svg>
  )
}
