'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/common/Button'
import { Avatar } from '@/components/common/Avatar'
import { api, setToken, ApiError } from '@/lib/api'
import { useRoomStore } from '@/store/roomStore'
import { generateNickname } from '@/lib/utils'
import type { Avatar as AvatarType, Room, Participant, Session } from '@/types'

const AVATARS: AvatarType[] = ['purple', 'green', 'yellow', 'pink']

export default function JoinByLinkPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const code = (params.code as string).toUpperCase()
  const isFull = searchParams.get('full') === '1'

  const { setRoom, setSession, setParticipants } = useRoomStore()

  const [roomName, setRoomName] = useState<string | null>(null)
  const [nickname, setNickname] = useState(generateNickname)
  const [avatar, setAvatar] = useState<AvatarType>('purple')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)

  // 방 유효성 확인
  useEffect(() => {
    if (isFull) return

    api.get<{ roomId: string; name: string; isActive: boolean; isFull: boolean }>(
      `/api/rooms/${code}`
    )
      .then((data) => {
        if (!data.isActive) {
          setError('이미 종료된 방이에요')
          return
        }
        if (data.isFull) {
          setError('방이 꽉 찼어요')
          return
        }
        setRoomName(data.name)
        setRoomId(data.roomId)
      })
      .catch(() => {
        setError('존재하지 않는 방이에요')
      })
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
      }>(`/api/rooms/${roomId}/join`, {
        nickname: nickname || undefined,
        avatar,
      })

      setToken(data.sessionToken)

      const session: Session = {
        sessionToken: data.sessionToken,
        participantId: data.participant.participantId,
        roomId: data.room.roomId,
        isHost: false,
      }

      setRoom(data.room)
      setSession(session)
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

  // 에러 화면
  if (error || isFull) {
    return (
      <main className="dot-grid min-h-screen flex flex-col items-center justify-center px-5 gap-6">
        <p className="text-h1 text-purple-900 text-center">
          {isFull ? '방이 꽉 찼어요' : error}
        </p>
        <p className="text-body2 text-[var(--text-secondary)] text-center">
          {isFull ? '무료 방은 최대 10명까지 입장할 수 있어요' : '다시 확인해주세요'}
        </p>
        <Button variant="secondary" onClick={() => router.push('/')}>
          돌아가기
        </Button>
      </main>
    )
  }

  // 로딩 화면
  if (!roomName) {
    return (
      <main className="dot-grid min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="dot-grid min-h-screen flex flex-col px-5 pt-12 pb-8">
      <div className="mb-8">
        <p className="text-caption text-purple-400 mb-1">초대받은 방</p>
        <h1 className="text-display text-purple-900">{roomName}</h1>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        {/* 아바타 */}
        <div>
          <label className="text-caption text-purple-500 block mb-3">내 캐릭터</label>
          <div className="flex gap-4">
            {AVATARS.map((a) => (
              <button key={a} onClick={() => setAvatar(a)} className="relative">
                <Avatar color={a} size="lg" isMe={avatar === a} />
                {avatar === a && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-purple-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 닉네임 */}
        <div>
          <label className="text-caption text-purple-500 block mb-2">
            닉네임 <span className="text-[var(--text-placeholder)]">(선택)</span>
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={10}
            className="w-full h-10 px-3 rounded-btn bg-[var(--bg-input)] border border-[var(--border-default)]
                       text-body1 text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]
                       focus:outline-none focus:border-[var(--border-focus)] focus:bg-[var(--bg-input-focus)]
                       transition-colors"
          />
        </div>
      </div>

      <div className="mt-8">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          onClick={handleJoin}
        >
          입장
        </Button>
      </div>
    </main>
  )
}
