'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/common/Button'
import { Avatar } from '@/components/common/Avatar'
import { api, setToken } from '@/lib/api'
import { useRoomStore } from '@/store/roomStore'
import { generateRoomName, generateNickname } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'
import type { Avatar as AvatarType, Room, Participant, Session } from '@/types'

const AVATARS: AvatarType[] = ['purple', 'green', 'yellow', 'pink']

export default function CreatePage() {
  const router = useRouter()
  const { setRoom, setSession, addParticipant } = useRoomStore()
  const showToast = useToastStore((s) => s.showToast)

  const [roomName, setRoomName] = useState(generateRoomName)
  const [nickname, setNickname] = useState(generateNickname)
  const [avatar, setAvatar] = useState<AvatarType>('purple')
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshName = async () => {
    setIsRefreshing(true)
    try {
      // 서버에서 이름 가져오기 (실패 시 로컬 생성)
      setRoomName(generateRoomName())
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCreate = async () => {
    setIsLoading(true)
    try {
      const data = await api.post<{
        roomId: string
        roomCode: string
        name: string
        inviteUrl: string
        sessionToken: string
        host: { participantId: string; nickname: string; avatar: string; isHost: boolean }
      }>('/api/rooms', {
        name: roomName || undefined,
        host_nickname: nickname || undefined,
        host_avatar: avatar,
      })

      // 토큰 저장
      setToken(data.sessionToken)

      // Store 업데이트
      const room: Room = {
        roomId: data.roomId,
        code: data.roomCode,
        name: data.name,
        status: 'active',
        settings: {
          playbackControl: 'all',
          skipControl: 'all',
          queueReorder: 'all',
          trackAdd: 'all',
          voteMode: false,
          voteThresholdType: 'ratio',
          voteThresholdValue: 0.5,
        },
        plan: 'free',
        inviteUrl: data.inviteUrl,
      }

      const session: Session = {
        sessionToken: data.sessionToken,
        participantId: data.host.participantId,
        roomId: data.roomId,
        isHost: true,
      }

      const participant: Participant = {
        participantId: data.host.participantId,
        nickname: data.host.nickname,
        avatar: data.host.avatar as AvatarType,
        isHost: true,
        joinOrder: 1,
      }

      setRoom(room)
      setSession(session)
      addParticipant(participant)

      router.push(`/room/${data.roomId}`)
    } catch (err) {
      showToast({ type: 'error', message: '방 생성에 실패했어요' })
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="dot-grid bg-[var(--bg-base)] min-h-screen flex flex-col px-5 pt-12 pb-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-display text-[var(--text-primary)] mb-1">방 만들기</h1>
        <p className="text-caption text-[var(--text-secondary)]">
          10초 안에 방을 만들고 친구를 불러요
        </p>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        {/* 방 이름 */}
        <div>
          <label className="text-caption text-[var(--text-secondary)] block mb-2">방 이름</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={30}
              placeholder="방 이름을 입력해주세요"
              className="flex-1 h-10 px-3 rounded-btn bg-[var(--bg-input)] border border-[var(--border-default)]
                         text-body1 text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]
                         focus:outline-none focus:border-[var(--border-focus)] focus:bg-[var(--bg-input-focus)]
                         transition-colors"
            />
            <button
              onClick={handleRefreshName}
              disabled={isRefreshing}
              className="w-10 h-10 rounded-btn bg-[var(--bg-input)] border border-[var(--border-default)]
                         flex items-center justify-center text-purple-400
                         active:opacity-60 disabled:opacity-40"
            >
              <RefreshIcon className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          <p className="text-micro text-[var(--text-placeholder)] mt-1 text-right">
            {roomName.length}/30
          </p>
        </div>

        {/* 아바타 선택 */}
        <div>
          <label className="text-caption text-[var(--text-secondary)] block mb-3">내 캐릭터</label>
          <div className="flex gap-4">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className="relative"
              >
                <Avatar
                  color={a}
                  size="lg"
                  isMe={avatar === a}
                />
                {avatar === a && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2
                                  w-1.5 h-1.5 bg-purple-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 닉네임 */}
        <div>
          <label className="text-caption text-[var(--text-secondary)] block mb-2">
            닉네임 <span className="text-[var(--text-placeholder)]">(선택)</span>
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={10}
            placeholder={nickname}
            className="w-full h-10 px-3 rounded-btn bg-[var(--bg-input)] border border-[var(--border-default)]
                       text-body1 text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]
                       focus:outline-none focus:border-[var(--border-focus)] focus:bg-[var(--bg-input-focus)]
                       transition-colors"
          />
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="mt-8">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          onClick={handleCreate}
        >
          방 만들고 바로 입장
        </Button>
      </div>
    </main>
  )
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.65 2.35A8 8 0 1 0 14 8h-1.5A6.5 6.5 0 1 1 8 1.5a6.5 6.5 0 0 1 4.5 1.83V1h1.5v4H10v-1.5h2.06A6.47 6.47 0 0 0 8 2a6.5 6.5 0 0 0 0 13A6.5 6.5 0 0 0 13.65 2.35z"
        fill="currentColor"
      />
    </svg>
  )
}
