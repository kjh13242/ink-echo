'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api, setToken } from '@/lib/api'
import { useRoomStore } from '@/store/roomStore'
import { generateRoomName, generateNickname } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'
import type { Avatar as AvatarType, Room, Participant, Session } from '@/types'

const AVATARS = [
  { id: 'purple' as AvatarType, bg: '#EEEDFE', body: '#FFD4A8', shirt: '#7F77DD', label: '보라' },
  { id: 'green'  as AvatarType, bg: '#E1F5EE', body: '#C8E8D0', shirt: '#1D9E75', label: '초록' },
  { id: 'yellow' as AvatarType, bg: '#FFF8E8', body: '#FDECC8', shirt: '#F0A030', label: '노랑' },
  { id: 'pink'   as AvatarType, bg: '#FBF0FB', body: '#F4D8F4', shirt: '#D4537E', label: '분홍' },
]

export default function CreatePage() {
  const router = useRouter()
  const { setRoom, setSession, addParticipant } = useRoomStore()
  const showToast = useToastStore((s) => s.showToast)

  const [roomName, setRoomName] = useState('')
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState<AvatarType>('purple')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setRoomName(generateRoomName())
    setNickname(generateNickname())
  }, [])

  const handleCreate = async () => {
    setIsLoading(true)
    try {
      const data = await api.post<{
        roomId: string; roomCode: string; name: string; inviteUrl: string
        sessionToken: string
        host: { participantId: string; nickname: string; avatar: string; isHost: boolean }
      }>('/api/rooms', {
        name: roomName || undefined,
        host_nickname: nickname || undefined,
        host_avatar: avatar,
      })

      setToken(data.sessionToken)

      const room: Room = {
        roomId: data.roomId, code: data.roomCode, name: data.name, status: 'active',
        settings: {
          playbackControl: 'all', skipControl: 'all', queueReorder: 'all', trackAdd: 'all',
          voteMode: false, voteThresholdType: 'ratio', voteThresholdValue: 0.5,
        },
        plan: 'free', inviteUrl: data.inviteUrl,
      }
      const session: Session = {
        sessionToken: data.sessionToken,
        participantId: data.host.participantId,
        roomId: data.roomId, isHost: true,
      }
      const participant: Participant = {
        participantId: data.host.participantId,
        nickname: data.host.nickname,
        avatar: data.host.avatar as AvatarType,
        isHost: true, joinOrder: 1,
      }

      setRoom(room)
      setSession(session)
      addParticipant(participant)
      router.push(`/room/${data.roomId}`)
    } catch {
      showToast({ type: 'error', message: '방 생성에 실패했어요' })
    } finally {
      setIsLoading(false)
    }
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
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>방 만들기</span>
      </div>

      {/* 바디 */}
      <div className="flex-1 flex flex-col" style={{ padding: '20px 16px 80px' }}>

        {/* 방 이름 */}
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 5, fontFamily: 'inherit' }}>방 이름</div>
        <div className="relative" style={{ marginBottom: 6 }}>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            maxLength={30}
            placeholder="방 이름을 입력해주세요"
            className="w-full outline-none transition-colors"
            style={{
              height: 44, borderRadius: 12,
              border: '0.5px solid var(--border-default)',
              background: 'var(--bg-input)',
              fontSize: 14, fontWeight: 500,
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              paddingLeft: 12, paddingRight: 36,
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
          <button
            onClick={() => setRoomName(generateRoomName())}
            className="absolute flex items-center justify-center active:scale-[0.85] transition-transform"
            style={{
              right: 10, top: '50%', transform: 'translateY(-50%)',
              width: 20, height: 20, borderRadius: '50%',
              background: 'rgba(180,176,220,0.25)',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <path d="M12 7A5 5 0 1 1 7 2" stroke="var(--text-tertiary)" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M7 2l2-2v4H5l2-2z" fill="var(--text-tertiary)" />
            </svg>
          </button>
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-placeholder)', marginBottom: 20, paddingLeft: 2, fontFamily: 'inherit' }}>
          ↺ 누르면 다른 이름으로 바꿔줘요
        </div>

        {/* 아바타 */}
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8, fontFamily: 'inherit' }}>내 캐릭터</div>
        <div className="flex" style={{ gap: 8, marginBottom: 24 }}>
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
                  width: 40, height: 40, borderRadius: '50%',
                  border: `2px solid ${avatar === a.id ? 'var(--color-cta)' : 'transparent'}`,
                }}
              >
                <svg
                  width="40" height="40" viewBox="0 0 16 16"
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
                      width: 12, height: 12, borderRadius: '50%',
                      background: 'var(--color-cta)',
                      border: '1.5px solid var(--bg-surface)',
                    }}
                  >
                    <svg width="6" height="6" viewBox="0 0 8 8" fill="none">
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

        {/* 닉네임 */}
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 5, fontFamily: 'inherit' }}>
          닉네임 <span style={{ color: 'var(--text-placeholder)' }}>(선택)</span>
        </div>
        <div className="relative" style={{ marginBottom: 24 }}>
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
              fontSize: 12, color: 'var(--text-primary)',
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
          <span
            className="absolute pointer-events-none"
            style={{
              right: 9, top: '50%', transform: 'translateY(-50%)',
              fontSize: 8, color: '#C0BCD8',
            }}
          >
            {nickname.length}/10
          </span>
        </div>

      </div>

      {/* 시작 버튼 — 항상 하단 고정 */}
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
          onClick={handleCreate}
          disabled={isLoading}
          className="w-full flex items-center justify-center active:scale-[0.98] disabled:opacity-50 transition-all"
          style={{
            height: 44, borderRadius: 14,
            background: 'var(--color-cta)',
            color: 'var(--color-cta-text)',
            fontSize: 13, fontWeight: 500,
            fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(127, 119, 221, 0.3)'
          }}
        >
          {isLoading ? '생성 중...' : '방 만들고 바로 입장'}
        </button>
        <div
          style={{
            fontSize: 9, color: 'var(--text-placeholder)',
            textAlign: 'center', marginTop: 6, fontFamily: 'inherit',
          }}
        >
          입장 후 음악, 투표 설정 등을 바꿀 수 있어요
        </div>
      </div>
    </div>
  )
}
