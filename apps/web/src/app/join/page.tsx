'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/common/Button'
import { Avatar } from '@/components/common/Avatar'
import { api, setToken } from '@/lib/api'
import { useRoomStore } from '@/store/roomStore'
import { generateNickname } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'
import { ApiError } from '@/lib/api'
import type { Avatar as AvatarType, Room, Participant, Session } from '@/types'

const AVATARS: AvatarType[] = ['purple', 'green', 'yellow', 'pink']

export default function JoinPage() {
  const router = useRouter()
  const { setRoom, setSession, setParticipants } = useRoomStore()
  const showToast = useToastStore((s) => s.showToast)

  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState(generateNickname)
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
      // 방 유효성 확인
      const roomInfo = await api.get<{
        roomId: string
        isFull: boolean
        isActive: boolean
      }>(`/api/rooms/${code}`)

      if (!roomInfo.isActive) {
        setCodeError('이미 종료된 방이에요')
        return
      }

      if (roomInfo.isFull) {
        router.push(`/join/${code}?full=1`)
        return
      }

      // 입장
      const data = await api.post<{
        sessionToken: string
        participant: { participantId: string; nickname: string; avatar: string; isHost: boolean }
        room: Room
        participants: Participant[]
      }>(`/api/rooms/${roomInfo.roomId}/join`, {
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
      if (err instanceof ApiError) {
        if (err.code === 'ROOM_NOT_FOUND') {
          setCodeError('존재하지 않는 코드예요')
        } else if (err.code === 'ROOM_EXPIRED') {
          setCodeError('이미 종료된 방이에요')
        } else if (err.code === 'ROOM_FULL') {
          showToast({ type: 'info', message: '방이 꽉 찼어요' })
        } else {
          showToast({ type: 'error', message: '입장에 실패했어요' })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="dot-grid min-h-screen flex flex-col px-5 pt-12 pb-8">
      <div className="mb-8">
        <h1 className="text-display text-purple-900 mb-1">코드로 입장</h1>
        <p className="text-caption text-purple-400">
          친구에게 받은 코드를 입력해주세요
        </p>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        {/* 코드 입력 */}
        <div>
          <label className="text-caption text-purple-500 block mb-2">방 코드</label>
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="WHALE42"
            autoCapitalize="characters"
            className="w-full h-11 px-3 rounded-btn bg-[var(--bg-input)] border
                       text-[18px] font-[Arial] font-medium tracking-[0.08em]
                       text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]
                       focus:outline-none transition-colors
                       ${codeError
                         ? 'border-error bg-[#FFF5F5]'
                         : 'border-[var(--border-default)] focus:border-[var(--border-focus)] focus:bg-[var(--bg-input-focus)]'
                       }"
          />
          {codeError && (
            <p className="text-caption text-error mt-1">{codeError}</p>
          )}
        </div>

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
            placeholder={nickname}
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
          disabled={!code.trim()}
          onClick={handleJoin}
        >
          입장
        </Button>
      </div>
    </main>
  )
}
