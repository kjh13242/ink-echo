'use client'

import { useEffect, useCallback, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRoomStore } from '@/store/roomStore'
import { useQueueStore } from '@/store/queueStore'
import { usePlaybackStore } from '@/store/playbackStore'
import { useReactionStore } from '@/store/reactionStore'
import { useToastStore } from '@/store/toastStore'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { useRoomPermission } from '@/hooks/useRoomPermission'
import { api } from '@/lib/api'
import type { WSEvent, QueueTrack, Participant, Emoji } from '@/types'

import { RoomHeader } from '@/components/room/main/RoomHeader'
import { NowPlaying } from '@/components/room/main/NowPlaying'
import { EmojiStack } from '@/components/room/main/EmojiStack'
import { QueueList } from '@/components/room/main/QueueList'
import { ParticipantBar } from '@/components/room/main/ParticipantBar'
import { RoomSettingsSheet } from '@/components/room/main/RoomSettingsSheet'
import { InviteSheet } from '@/components/invite/InviteSheet'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const { room, session, participants, addParticipant, removeParticipant,
          transferHost, updateSettings, clearRoom } = useRoomStore()
  const { tracks, setTracks, addTrack, removeTrack, reorderTrack,
          updateTrackStatus, setCurrentIndex, updateVoteCount } = useQueueStore()
  const { isPlaying, positionSec, setPlaying, setPosition, syncFromServer,
          setAdDuration, clearPlayback } = usePlaybackStore()
  const { addReaction, removeReaction, setMyParticipantId, clearStack } = useReactionStore()
  const showToast = useToastStore((s) => s.showToast)
  const permissions = useRoomPermission()

  const [showInvite, setShowInvite] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [participantTracksId, setParticipantTracksId] = useState<string | null>(null)
  const [showEmojiPopup, setShowEmojiPopup] = useState(false)
  const [myVotes, setMyVotes] = useState<string[]>([])

  // 세션 없으면 랜딩으로
  useEffect(() => {
    if (!session) router.replace('/')
    if (session) setMyParticipantId(session.participantId)
  }, [session, router, setMyParticipantId])

  // YouTube 플레이어
  const { loadVideo, play, pause } = useYouTubePlayer({
    containerId: 'yt-player',
    onEnded: async () => {
      try {
        await api.post(`/api/rooms/${roomId}/queue/skip`)
      } catch { /* 무시 */ }
    },
    onError: async (code) => {
      if (code === 101 || code === 150) {
        const currentTrack = tracks.find((t) => t.status === 'playing')
        if (currentTrack) {
          updateTrackStatus(currentTrack.queueId, 'unavailable')
          showToast({ type: 'info', message: '재생 불가 곡이에요. 자동으로 넘어갈게요' })
          await api.post(`/api/rooms/${roomId}/queue/skip`)
        }
      }
    },
    onAdStart: () => {
      setAdDuration(30)
      showToast({ type: 'info', message: '광고가 끝나면 음악이 이어져요' })
    },
  })

  // WebSocket 이벤트 핸들러
  const handleWSEvent = useCallback((event: WSEvent) => {
    const p = event.payload as Record<string, unknown>

    switch (event.type) {
      case 'connected': {
        const payload = p as {
          queue: QueueTrack[]
          participants: Participant[]
          playback: { is_playing: string; current_queue_id: string; position_sec: string; updated_at: string }
        }
        setTracks(payload.queue ?? [])
        // 재연결 시 서버 상태 복원
        syncFromServer({
          isPlaying: payload.playback?.is_playing === 'true',
          currentQueueId: payload.playback?.current_queue_id || null,
          positionSec: parseInt(payload.playback?.position_sec || '0'),
          updatedAt: parseInt(payload.playback?.updated_at || '0'),
        })
        break
      }

      case 'queue:add':
        addTrack(p as unknown as QueueTrack)
        break

      case 'queue:remove':
        removeTrack(p.queueId as string)
        break

      case 'queue:reorder':
        reorderTrack(p.queueId as string, p.newPosition as number)
        break

      case 'queue:unavailable':
        updateTrackStatus(p.queueId as string, 'unavailable')
        break

      case 'playback:play': {
        setPlaying(true)
        const currentTrack = tracks.find((t) => t.status === 'playing')
        if (currentTrack) {
          loadVideo(currentTrack.youtubeId, currentTrack.durationSec)
          play()
        }
        break
      }

      case 'playback:pause':
        setPlaying(false)
        pause()
        break

      case 'playback:skip': {
        const { nextTrack } = p as { skippedQueueId: string; nextTrack: QueueTrack | null }
        if (nextTrack) {
          updateTrackStatus(nextTrack.queueId, 'playing')
          setPlaying(true)
          loadVideo(nextTrack.youtubeId, nextTrack.durationSec)
          play()
        }
        break
      }

      case 'playback:ad_end':
        setAdDuration(null)
        break

      case 'reaction:add':
        addReaction(p.emoji as unknown as Emoji, p.participantId as string)
        break

      case 'reaction:remove':
        removeReaction(p.emoji as unknown as Emoji, p.participantId as string)
        break

      case 'vote:update':
        updateVoteCount(p.queueId as string, p.voteCount as number)
        break

      case 'participant:join':
        addParticipant(p as unknown as Participant)
        break

      case 'participant:leave':
        removeParticipant(p.participantId as string)
        break

      case 'host:transfer':
        transferHost(p.newHostId as string)
        break

      case 'info':
        showToast({ type: 'info', message: p.message as string })
        break

      case 'room:settings_update':
        updateSettings(p as unknown as Parameters<typeof updateSettings>[0])
        break

      case 'room:end':
        clearRoom()
        clearPlayback()
        clearStack()
        router.push(`/echo/${p.echoCardId}`)
        break
    }
  }, [tracks, isPlaying, loadVideo, play, pause, addTrack, removeTrack,
      reorderTrack, updateTrackStatus, setPlaying, setAdDuration, setTracks,
      syncFromServer, addReaction, removeReaction, updateVoteCount,
      addParticipant, removeParticipant, transferHost, updateSettings,
      clearRoom, clearPlayback, clearStack, router, showToast])

  // WebSocket 연결
  const { isConnected } = useWebSocket({
    roomId,
    token: session?.sessionToken ?? '',
    onEvent: handleWSEvent,
    enabled: !!session,
  })

  // 로컬 프로그레스 타이머
  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      setPosition(positionSec + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isPlaying, positionSec, setPosition])

  if (!room || !session) return null

  const currentTrack = tracks.find((t) => t.status === 'playing') ?? null
  const me = participants.find((p) => p.participantId === session.participantId)
  const others = participants.filter((p) => p.participantId !== session.participantId)
  const pendingTracks = tracks.filter((t) => t.status === 'pending')

  return (
    <main className="bg-[var(--bg-base)] min-h-screen flex flex-col max-w-[430px] mx-auto">
      {/* 상단 바 */}
      <RoomHeader
        roomName={room.name}
        onInvite={() => setShowInvite(true)}
        onSettings={permissions.canManageRoom ? () => setShowSettings(true) : undefined}
        onLeave={async () => {
          await api.delete(`/api/rooms/${roomId}/participants/me`)
          clearRoom()
          router.push('/')
        }}
        onEndRoom={permissions.canManageRoom ? async () => {
          await api.delete(`/api/rooms/${roomId}`)
        } : undefined}
      />

      {/* 재생 영역 */}
      {currentTrack ? (
        <>
          <NowPlaying
            track={currentTrack}
            isPlaying={isPlaying}
            positionSec={positionSec}
            canControl={permissions.canPlay}
            canSkip={permissions.canSkip}
            onPlay={async () => {
              if (isPlaying) {
                await api.post(`/api/rooms/${roomId}/playback/pause`)
              } else {
                await api.post(`/api/rooms/${roomId}/playback/play`, {
                  position_sec: positionSec,
                })
              }
            }}
            onSkip={async () => {
              await api.post(`/api/rooms/${roomId}/queue/skip`)
            }}
          />
          <EmojiStack
            onReact={async (emoji) => {
              await api.post(`/api/rooms/${roomId}/reactions`, { emoji })
            }}
            onCancel={async (emoji) => {
              await api.delete(`/api/rooms/${roomId}/reactions/${encodeURIComponent(emoji)}`)
            }}
          />
        </>
      ) : pendingTracks.length > 0 && permissions.canPlay ? (
        <div className="px-4 py-4 bg-[var(--bg-surface)] border-b border-[var(--border-default)]
                        flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-body1 text-[var(--text-primary)] truncate">
              {pendingTracks[0].title}
            </p>
            <p className="text-caption text-[var(--text-secondary)]">
              {pendingTracks.length}곡 대기 중
            </p>
          </div>
          <button
            onClick={async () => {
              await api.post(`/api/rooms/${roomId}/queue/skip`)
            }}
            className="flex-shrink-0 ml-3 w-10 h-10 flex items-center justify-center
                       rounded-full bg-purple-500 text-white active:opacity-70 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 2l9 5-9 5V2z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      ) : null}

      {/* 플레이리스트 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-24">
        <QueueList
          tracks={pendingTracks}
          currentQueueId={currentTrack?.queueId ?? null}
          canReorder={permissions.canReorder}
          canVote={room.settings.voteMode}
          myVotes={myVotes}
          onReorder={async (queueId, newPos) => {
            await api.put(`/api/rooms/${roomId}/queue/reorder`, {
              queue_id: queueId,
              new_position: newPos,
            })
          }}
          onRemove={async (queueId) => {
            await api.delete(`/api/rooms/${roomId}/queue/${queueId}`)
          }}
          onVote={async (queueId) => {
            const hasVoted = myVotes.includes(queueId)
            setMyVotes(prev =>
              hasVoted ? prev.filter(id => id !== queueId) : [...prev, queueId]
            )
            await api.post(`/api/rooms/${roomId}/votes`, {
              queue_id: queueId,
              action: hasVoted ? 'cancel' : 'up',
            })
          }}
          onAvatarTap={(participantId) => setParticipantTracksId(participantId)}
        />
      </div>

      {/* 하단 캐릭터 존 */}
      {me && (
        <ParticipantBar
          participants={others}
          me={me}
          onOtherTap={(id) => setParticipantTracksId(id)}
          onMeTap={() => setShowEmojiPopup(true)}
          onAddTrack={() => router.push(`/room/${roomId}/add`)}
          onReact={async (emoji) => {
            await api.post(`/api/rooms/${roomId}/reactions`, { emoji })
          }}
          onCancel={async (emoji) => {
            await api.delete(`/api/rooms/${roomId}/reactions/${encodeURIComponent(emoji)}`)
          }}
        />
      )}

      {/* 초대 시트 */}
      <InviteSheet
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        room={room}
        participants={participants}
      />

      {/* 방 설정 시트 */}
      {showSettings && (
        <RoomSettingsSheet
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={room.settings}
          onSave={async (updated) => {
            await api.put(`/api/rooms/${roomId}/settings`, updated)
          }}
        />
      )}

      {/* 연결 상태 인디케이터 (개발 모드) */}
      {process.env.NODE_ENV === 'development' && !isConnected && (
        <div className="fixed top-1 right-1 w-2 h-2 bg-error rounded-full" />
      )}
    </main>
  )
}
