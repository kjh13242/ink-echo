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
  const { loadVideo, cueVideo, play, pause } = useYouTubePlayer({
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
        // currentQueueId가 있으면 해당 곡을 playing으로 마킹
        const playQueueId = p.currentQueueId as string | undefined
        const playTrack = playQueueId
          ? tracks.find((t) => t.queueId === playQueueId)
          : tracks.find((t) => t.status === 'playing' || t.status === 'pending')
        if (playTrack) {
          if (playTrack.status !== 'playing') {
            updateTrackStatus(playTrack.queueId, 'playing')
          }
          loadVideo(playTrack.youtubeId, playTrack.durationSec)
          play()
        }
        break
      }

      case 'playback:pause':
        setPlaying(false)
        pause()
        break

      case 'playback:skip': {
        const { skippedQueueId, nextTrack } = p as { skippedQueueId: string; nextTrack: QueueTrack | null }
        // 스킵된 곡을 skipped로 마킹
        if (skippedQueueId) updateTrackStatus(skippedQueueId, 'skipped')
        if (nextTrack) {
          updateTrackStatus(nextTrack.queueId, 'playing')
          setPosition(0)
          loadVideo(nextTrack.youtubeId, nextTrack.durationSec)
          play()
        } else {
          setPlaying(false)
        }
        break
      }

      case 'playback:ad_end':
        setAdDuration(null)
        break

      case 'reaction:add':
        addReaction(p.emoji as Emoji, p.participantId as string)
        break

      case 'reaction:remove':
        removeReaction(p.emoji as Emoji, p.participantId as string)
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

  // 재생 대기 중인 첫 번째 곡 미리 버퍼링 (재생 딜레이 감소)
  useEffect(() => {
    if (isPlaying) return
    const pending = tracks.find((t) => t.status === 'pending')
    if (pending) cueVideo(pending.youtubeId, pending.durationSec)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, isPlaying])

  if (!room || !session) return null

  const playingTrack = tracks.find((t) => t.status === 'playing') ?? null
  const firstPendingTrack = tracks.find((t) => t.status === 'pending') ?? null
  const currentTrack = playingTrack ?? firstPendingTrack
  const isActuallyPlaying = isPlaying && !!playingTrack
  const me = participants.find((p) => p.participantId === session.participantId)
  const others = participants.filter((p) => p.participantId !== session.participantId)

  return (
    <main
      className="bg-[#0A0A0A] flex flex-col relative overflow-hidden"
      style={{ height: 'var(--frame-h, 100svh)' }}
    >

      {/* 상단 바 */}
      <div className="flex-shrink-0">
        <RoomHeader
          roomName={room.name}
          onInvite={() => setShowInvite(true)}
          onSettings={permissions.canManageRoom ? () => setShowSettings(true) : undefined}
          onLeave={async () => {
            try {
              await api.delete(`/api/rooms/${roomId}/participants/me`)
            } finally {
              clearRoom()
              router.push('/')
            }
          }}
          onEndRoom={permissions.canManageRoom ? async () => {
            await api.delete(`/api/rooms/${roomId}`)
          } : undefined}
        />
      </div>

      {/* 전체 스크롤 영역 — NowPlaying + QueueList 연속 스크롤 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* 재생 중인 곡 — 앨범 커버가 화면 절반 차지 */}
        {currentTrack ? (
          <>
            <NowPlaying
              track={currentTrack}
              isPlaying={isActuallyPlaying}
              positionSec={playingTrack ? positionSec : 0}
              canControl={permissions.canPlay}
              canSkip={permissions.canSkip}
              onPlay={async () => {
                if (isActuallyPlaying) {
                  // 일시정지: 즉시 로컬 적용 후 서버 동기화
                  pause()
                  setPlaying(false)
                  api.post(`/api/rooms/${roomId}/playback/pause`).catch(() => {
                    // 실패 시 서버 상태로 복원됨 (WS 재연결)
                    setPlaying(true)
                    play()
                  })
                } else {
                  // 재생: 즉시 로컬 재생 시작 후 서버 동기화
                  if (playingTrack) {
                    // 이미 playing 상태인 곡 재개
                    play()
                    setPlaying(true)
                  } else if (firstPendingTrack) {
                    // pending 곡 → loadVideo로 재생 시작
                    loadVideo(firstPendingTrack.youtubeId, firstPendingTrack.durationSec)
                    play()
                    setPlaying(true)
                  }
                  api.post(`/api/rooms/${roomId}/playback/play`, {
                    position_sec: positionSec,
                  }).catch(() => {
                    setPlaying(false)
                    pause()
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
        ) : (
          /* 큐가 완전히 비어있을 때 */
          <div className="px-6 py-10 flex justify-center">
            <div className="w-full aspect-square max-w-[280px] rounded-[18px]
                            bg-white/[0.03] border border-white/[0.06]
                            flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/[0.06]
                                flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18V5l12-2v13" stroke="#606080" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="6" cy="18" r="3" stroke="#606080" strokeWidth="1.5"/>
                    <circle cx="18" cy="16" r="3" stroke="#606080" strokeWidth="1.5"/>
                  </svg>
                </div>
                <p className="text-[13px] text-[#404060] mb-4">재생할 곡을 추가해보세요</p>
                <button
                  onClick={() => router.push(`/room/${roomId}/add`)}
                  className="active:opacity-75 transition-opacity"
                  style={{
                    height: 36, borderRadius: 10, background: '#7F77DD', color: 'white',
                    fontSize: 13, fontWeight: 500, padding: '0 16px', display: 'inline-flex',
                    alignItems: 'center', gap: 4, fontFamily: 'inherit',
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <line x1="6" y1="1" x2="6" y2="11" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                    <line x1="1" y1="6" x2="11" y2="6" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  곡 추가하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 다음 재생 큐 — NowPlaying 아래 바로 이어짐 */}
        <QueueList
          tracks={tracks}
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

      {/* 개발 모드 연결 상태 인디케이터 */}
      {process.env.NODE_ENV === 'development' && !isConnected && (
        <div className="fixed top-1 right-1 w-2 h-2 bg-error rounded-full" />
      )}
    </main>
  )
}
