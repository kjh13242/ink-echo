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
            <div
              className="flex items-center justify-between mb-[16px] w-full"
              style={{
                background: '#EEEDFE', borderRadius: 12, padding: '10px 14px',
                border: '0.5px solid rgba(175,169,236,0.5)'
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 500, color: '#3C3489', letterSpacing: '0.12em', fontFamily: "'Apple SD Gothic Neo', monospace" }}>
                {room.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="active:opacity-70 transition-opacity"
                style={{ fontSize: 13, color: '#7F77DD', padding: '4px 8px', border: '0.5px solid rgba(127,119,221,0.4)', borderRadius: 8 }}
              >
                복사
              </button>
            </div>

            {/* 공유 버튼 */}
            <div className="flex flex-col mb-[16px]">
              <button
                onClick={handleKakao}
                className="w-full h-[42px] mb-[8px] flex items-center justify-center gap-[8px] active:scale-[0.98] transition-all"
                style={{ borderRadius: 12, background: '#FEE500', fontFamily: 'inherit' }}
              >
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#3A1D1D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="11" viewBox="0 0 12 11" fill="none">
                    <ellipse cx="6" cy="5" rx="5.5" ry="4.5" fill="#FEE500"/>
                    <path d="M3 5.5C3 4 4.3 2.8 6 2.8s3 1.2 3 2.7S7.7 8.2 6 8.2c-.3 0-.6 0-.9-.1L3.8 9l.3-1.3C3.3 7.1 3 6.4 3 5.5z" fill="#3A1D1D"/>
                  </svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#3A1D1D' }}>카카오톡으로 초대하기</span>
              </button>

              <div className="flex gap-[8px]">
                <ShareBtn label="QR 코드" icon={<QRIcon />} onClick={() => setShowQR(true)} />
                <ShareBtn label="링크 복사" icon={<LinkIcon />} onClick={handleCopyLink} />
                <ShareBtn label="더보기" icon={<MoreIcon />} onClick={handleMore} />
              </div>
            </div>

            {/* 참여자 현황 */}
            <div className="mb-[16px]">
              <p style={{ fontSize: 13, color: '#9490C0', marginBottom: 6, letterSpacing: '0.03em' }}>
                지금 방에 있는 사람 ({participants.length}명)
              </p>
              <div className="flex gap-[8px] flex-wrap items-center">
                {participants.map((p) => (
                  <div key={p.participantId} className="flex flex-col items-center gap-[2px]">
                    <Avatar color={p.avatar} size="sm" isHost={p.isHost} />
                    <p style={{ fontSize: 12, color: '#9490C0' }} className="max-w-[40px] truncate text-center">
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
      className="flex-1 flex items-center justify-center gap-[5px] h-[38px] active:scale-[0.98] transition-transform"
      style={{
        borderRadius: 10, border: '0.5px solid rgba(180,176,220,0.6)',
        background: '#F4F2FF', fontFamily: 'inherit'
      }}
    >
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(210,206,248,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#7F77DD' }}>
        {icon}
      </div>
      <span style={{ fontSize: 13, color: '#4A4680' }}>{label}</span>
    </button>
  )
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function QRIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
      <circle cx="11" cy="3" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="3" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="4.8" y1="6.1" x2="9.2" y2="3.9" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="4.8" y1="7.9" x2="9.2" y2="10.1" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4 7h6M7 4v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
