'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { api, setToken, ApiError } from '@/lib/api'
import { useRoomStore } from '@/store/roomStore'
import { generateNickname } from '@/lib/utils'
import type { Avatar as AvatarType, Room, Participant, Session } from '@/types'

const AVATARS = [
  { id: 'purple' as AvatarType, bg: '#EEEDFE', body: '#FFD4A8', shirt: '#7F77DD', label: '보라' },
  { id: 'green'  as AvatarType, bg: '#E1F5EE', body: '#C8E8D0', shirt: '#1D9E75', label: '초록' },
  { id: 'yellow' as AvatarType, bg: '#FFF8E8', body: '#FDECC8', shirt: '#F0A030', label: '노랑' },
  { id: 'pink'   as AvatarType, bg: '#FBF0FB', body: '#F4D8F4', shirt: '#D4537E', label: '분홍' },
]

export default function JoinByLinkPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const code = (params.code as string).toUpperCase()
  const isFull = searchParams.get('full') === '1'

  const { setRoom, setSession, setParticipants } = useRoomStore()

  const [roomName, setRoomName] = useState<string | null>(null)
  const [nickname, setNickname] = useState(() => generateNickname())
  const [avatar, setAvatar] = useState<AvatarType>('purple')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)

  useEffect(() => {
    if (isFull) return
    api.get<{ roomId: string; name: string; isActive: boolean; isFull: boolean }>(`/api/rooms/${code}`)
      .then((data) => {
        if (!data.isActive) { setError('이미 종료된 방이에요'); return }
        if (data.isFull) { setError('방이 꽉 찼어요'); return }
        setRoomName(data.name)
        setRoomId(data.roomId)
      })
      .catch(() => setError('존재하지 않는 방이에요'))
  }, [code, isFull])

  const handleJoin = async () => {
    if (!roomId) return
    setIsLoading(true)
    try {
      const data = await api.post<{
        sessionToken: string
        participant: { participantId: string; nickname: string; avatar: string; isHost: boolean }
        room: Room
        participants: Participant[]
      }>(`/api/rooms/${roomId}/join`, { nickname: nickname || undefined, avatar })

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
      if (err instanceof ApiError && err.code === 'ROOM_FULL') {
        setError('방이 꽉 찼어요')
      } else {
        setError('입장에 실패했어요')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 방 꽉 참
  if (isFull || error === '방이 꽉 찼어요') {
    return (
      <div className="bg-[var(--bg-surface)] flex flex-col items-center justify-center px-5"
           style={{ minHeight: 'var(--frame-h, 100svh)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6, textAlign: 'center' }}>방이 꽉 찼어요</div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
          무료 방은 최대 10명까지 입장할 수 있어요<br />방장이 Pro로 업그레이드하면 더 많이 들어올 수 있어요
        </div>
        <button
          onClick={() => router.push('/')}
          className="flex items-center justify-center active:opacity-75"
          style={{
            width: '100%', maxWidth: 280, height: 44, borderRadius: 14,
            background: 'var(--color-cta)', color: 'var(--color-cta-text)',
            fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
          }}
        >
          돌아가기
        </button>
      </div>
    )
  }

  // 에러
  if (error) {
    return (
      <div className="bg-[var(--bg-surface)] flex flex-col items-center justify-center px-5"
           style={{ minHeight: 'var(--frame-h, 100svh)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>😕</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6, textAlign: 'center' }}>{error}</div>
        <button
          onClick={() => router.push('/')}
          style={{
            marginTop: 16, height: 40, borderRadius: 12, padding: '0 20px',
            border: '0.5px solid var(--border-default)',
            background: 'transparent', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'inherit',
          }}
        >
          돌아가기
        </button>
      </div>
    )
  }

  // 로딩
  if (!roomName) {
    return (
      <div className="bg-[var(--bg-surface)] flex items-center justify-center"
           style={{ minHeight: 'var(--frame-h, 100svh)' }}>
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
             style={{ borderColor: 'var(--color-cta)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

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
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>초대받은 방</span>
      </div>

      {/* 바디 */}
      <div className="flex-1 flex flex-col" style={{ padding: '20px 16px 80px' }}>
        {/* 방 이름 표시 */}
        <div style={{
          marginBottom: 24, padding: '12px 14px', borderRadius: 12,
          background: 'var(--bg-input)', border: '0.5px solid var(--border-default)',
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 3 }}>입장할 방</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{roomName}</div>
        </div>

        {/* 아바타 */}
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontFamily: 'inherit' }}>내 캐릭터</div>
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
              <span style={{
                fontSize: 12, fontFamily: 'inherit',
                color: avatar === a.id ? 'var(--color-cta)' : 'var(--text-tertiary)',
                fontWeight: avatar === a.id ? 500 : 400,
              }}>
                {a.label}
              </span>
            </div>
          ))}
        </div>

        {/* 닉네임 */}
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 5, marginTop: 16, fontFamily: 'inherit' }}>
          닉네임 <span style={{ color: 'var(--text-placeholder)' }}>(선택)</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 10))}
            maxLength={10}
            placeholder="방에서 불릴 이름"
            className="w-full outline-none transition-colors"
            style={{
              height: 38, borderRadius: 10,
              border: '0.5px solid var(--border-default)',
              background: 'var(--bg-input)',
              fontSize: 14, color: 'var(--text-primary)',
              fontFamily: 'inherit',
              paddingLeft: 11, paddingRight: 34,
              caretColor: 'var(--color-cta)',
              colorScheme: 'light',
              WebkitAppearance: 'none',
              appearance: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--border-focus)'
              e.target.style.background = 'var(--bg-input-focus)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-default)'
              e.target.style.background = 'var(--bg-input)'
            }}
          />
          <span className="absolute pointer-events-none"
                style={{ right: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#C0BCD8' }}>
            {nickname.length}/10
          </span>
        </div>
      </div>

      {/* 입장 버튼 */}
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
          disabled={isLoading}
          className="w-full flex items-center justify-center active:scale-[0.98] disabled:opacity-50 transition-all font-medium"
          style={{
            height: 44, borderRadius: 14,
            background: 'var(--color-cta)',
            color: 'var(--color-cta-text)',
            fontSize: 14, fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(127, 119, 221, 0.3)',
          }}
        >
          {isLoading ? '입장 중...' : '입장하기'}
        </button>
      </div>
    </div>
  )
}
