'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, setToken, ApiError } from '@/lib/api'
import { useRoomStore } from '@/store/roomStore'
import { useToastStore } from '@/store/toastStore'
import type { Avatar as AvatarType, Room, Participant, Session } from '@/types'

const AVATARS = [
  { id: 'purple' as AvatarType, bg: '#EEEDFE', body: '#FFD4A8', shirt: '#7F77DD', label: '보라' },
  { id: 'green'  as AvatarType, bg: '#E1F5EE', body: '#C8E8D0', shirt: '#1D9E75', label: '초록' },
  { id: 'yellow' as AvatarType, bg: '#FFF8E8', body: '#FDECC8', shirt: '#F0A030', label: '노랑' },
  { id: 'pink'   as AvatarType, bg: '#FBF0FB', body: '#F4D8F4', shirt: '#D4537E', label: '분홍' },
]

export default function JoinPage() {
  const router = useRouter()
  const { setRoom, setSession, setParticipants } = useRoomStore()
  const showToast = useToastStore((s) => s.showToast)

  const [code, setCode] = useState('')
  const [avatar, setAvatar] = useState<AvatarType>('purple')
  const [isLoading, setIsLoading] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))
    setCodeError(null)
  }

  const handleJoin = async () => {
    if (!code.trim()) return
    setIsLoading(true)
    setCodeError(null)
    try {
      const roomInfo = await api.get<{ roomId: string; isFull: boolean; isActive: boolean }>(
        `/api/rooms/${code}`
      )
      if (!roomInfo.isActive) { setCodeError('이미 종료된 방이에요'); return }
      if (roomInfo.isFull) { router.push(`/join/${code}?full=1`); return }

      const data = await api.post<{
        sessionToken: string
        participant: { participantId: string; nickname: string; avatar: string; isHost: boolean }
        room: Room
        participants: Participant[]
      }>(`/api/rooms/${roomInfo.roomId}/join`, { avatar })

      setToken(data.sessionToken)
      setRoom(data.room)
      setSession({
        sessionToken: data.sessionToken,
        participantId: data.participant.participantId,
        roomId: data.room.roomId,
        isHost: false,
      } as Session)
      setParticipants(data.participants)
      router.push(`/room/${data.room.roomId}`)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'ROOM_NOT_FOUND') setCodeError('존재하지 않는 코드예요')
        else if (err.code === 'ROOM_EXPIRED') setCodeError('이미 종료된 방이에요')
        else if (err.code === 'ROOM_FULL') showToast({ type: 'info', message: '방이 꽉 찼어요' })
        else showToast({ type: 'error', message: '입장에 실패했어요' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const canJoin = code.trim().length > 0

  return (
    <div className="bg-[var(--bg-surface)] flex flex-col" style={{ minHeight: 'var(--frame-h, 100svh)' }}>
      {/* 상단 바 */}
      <div
        className="flex items-center gap-2 flex-shrink-0 sticky top-0 z-10"
        style={{
          padding: '12px 14px 10px',
          background: 'color-mix(in srgb, var(--bg-surface) 80%, transparent)',
          borderBottom: '0.5px solid var(--border-default)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <button
          onClick={() => router.replace('/')}
          className="flex items-center justify-center flex-shrink-0 active:opacity-50 transition-opacity"
          style={{
            width: 26, height: 26, borderRadius: '50%',
            border: '0.5px solid rgba(160,156,200,0.5)',
            background: 'rgba(255,255,255,0.5)',
          }}
        >
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <path d="M7 1L3 5L7 9" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>코드로 입장</span>
      </div>

      {/* 바디 */}
      <div className="flex-1 flex flex-col justify-center" style={{ padding: '20px 16px 80px' }}>

          {/* 코드 입력 */}
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, fontFamily: 'inherit' }}>방 코드 입력</div>
          <div style={{ marginBottom: 8 }}>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="WHALE42"
              autoCapitalize="characters"
              className="w-full outline-none text-center transition-colors"
              style={{
                height: 52, borderRadius: 12,
                border: `0.5px solid ${codeError ? 'var(--color-error)' : 'var(--border-default)'}`,
                background: codeError ? 'var(--bg-error-subtle)' : 'var(--bg-input)',
                fontSize: 22, fontFamily: 'monospace',
                fontWeight: 500, color: 'var(--text-primary)',
                letterSpacing: '0.1em',
                caretColor: 'var(--color-cta)',
                display: 'block',
                colorScheme: 'light',
                WebkitAppearance: 'none',
                appearance: 'none',
              }}
              onFocus={(e) => {
                if (!codeError) {
                  e.target.style.borderColor = 'var(--border-focus)'
                  e.target.style.background = 'var(--bg-input-focus)'
                }
              }}
              onBlur={(e) => {
                if (!codeError) {
                  e.target.style.borderColor = 'var(--border-default)'
                  e.target.style.background = 'var(--bg-input)'
                }
              }}
            />
          </div>
          {codeError ? (
            <div style={{ fontSize: 9, color: 'var(--text-error)', textAlign: 'center', marginBottom: 20 }}>{codeError}</div>
          ) : (
            <div style={{ fontSize: 9, color: 'var(--text-placeholder)', textAlign: 'center', marginBottom: 20 }}>친구에게 받은 코드를 입력해주세요</div>
          )}

          {/* 아바타 */}
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8, fontFamily: 'inherit' }}>내 캐릭터</div>
          <div className="flex" style={{ gap: 8, marginBottom: 8 }}>
            {AVATARS.map((a) => (
              <div
                key={a.id}
                className="flex flex-col items-center cursor-pointer"
                style={{ gap: 3 }}
                onClick={() => setAvatar(a.id)}
              >
                <div
                  className="relative"
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: `2px solid ${avatar === a.id ? 'var(--color-cta)' : 'transparent'}`,
                  }}
                >
                  <svg
                    width="36" height="36" viewBox="0 0 16 16"
                    style={{ imageRendering: 'pixelated', borderRadius: '50%', display: 'block' }}
                  >
                    <rect width="16" height="16" fill={a.bg} />
                    <rect x="3" y="4" width="10" height="4" fill={a.body} />
                    <rect x="4" y="5" width="2" height="2" fill="#2A2660" />
                    <rect x="10" y="5" width="2" height="2" fill="#2A2660" />
                    <rect x="2" y="10" width="12" height="3" fill={a.shirt} />
                  </svg>
                  {avatar === a.id && (
                    <div
                      className="absolute flex items-center justify-center"
                      style={{
                        bottom: -2, right: -2,
                        width: 11, height: 11, borderRadius: '50%',
                        background: 'var(--color-cta)',
                        border: '1.5px solid var(--bg-surface)',
                      }}
                    >
                      <svg width="5" height="5" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 7, fontFamily: 'inherit',
                    color: avatar === a.id ? 'var(--color-cta)' : 'var(--text-tertiary)',
                    fontWeight: avatar === a.id ? 500 : 400,
                  }}
                >
                  {a.label}
                </span>
              </div>
            ))}
          </div>
      </div>

      {/* 입장 버튼 — 항상 하단 고정 */}
      <div
        className="sticky bottom-0 z-10 flex-shrink-0"
        style={{
          padding: '10px 16px 20px',
          background: 'color-mix(in srgb, var(--bg-surface) 97%, transparent)',
          backdropFilter: 'blur(8px)',
          borderTop: '0.5px solid var(--border-default)',
        }}
      >
        <button
          onClick={handleJoin}
          disabled={!canJoin || isLoading}
          className="w-full flex items-center justify-center active:scale-[0.98] disabled:scale-100 disabled:opacity-50 transition-all font-medium"
          style={{
            height: 44, borderRadius: 14,
            background: canJoin ? 'var(--color-cta)' : 'rgba(180,176,220,0.3)',
            color: canJoin ? 'var(--color-cta-text)' : '#A8A4C8',
            fontSize: 13,
            fontFamily: 'inherit',
            boxShadow: canJoin ? '0 4px 12px rgba(127, 119, 221, 0.3)' : 'none',
          }}
        >
          {isLoading ? '입장 중...' : '입장하기'}
        </button>
      </div>
    </div>
  )
}
