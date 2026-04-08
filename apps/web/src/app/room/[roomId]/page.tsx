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
import { BottomSheet } from '@/components/common/BottomSheet'
import { Avatar } from '@/components/common/Avatar'
import { formatDuration } from '@/lib/utils'
import type { Avatar as AvatarType } from '@/types'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const { room, session, participants, setParticipants, addParticipant, removeParticipant,
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
  const [showDesktopMenu, setShowDesktopMenu] = useState(false)
  const [participantTracksId, setParticipantTracksId] = useState<string | null>(null)
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
        // 재연결 시 참여자 목록 서버 기준으로 덮어쓰기 (나간 사람 제거)
        // 서버가 빈 배열을 돌려주는 레이스 케이스에도 현재 사용자는 보존
        if (payload.participants) {
          const list = payload.participants
          const hasSelf = list.some((p) => p.participantId === session?.participantId)
          if (hasSelf) {
            setParticipants(list)
          } else if (list.length > 0) {
            const selfEntry = participants.find((p) => p.participantId === session?.participantId)
            setParticipants(selfEntry ? [selfEntry, ...list.filter((p) => p.participantId !== session?.participantId)] : list)
          }
          // list가 빈 배열이면 setParticipants 호출 안 함 — 기존 목록 유지
        }
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
      setParticipants, addParticipant, removeParticipant, transferHost, updateSettings,
      clearRoom, clearPlayback, clearStack, router, showToast,
      participants, session])

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

  // 재생 대기 중인 첫 번째 곡 미리 버퍼링
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
  const meFromList = participants.find((p) => p.participantId === session.participantId)
  const me = meFromList ?? {
    participantId: session.participantId,
    nickname: '나',
    avatar: 'purple' as const,
    isHost: session.isHost,
    joinOrder: 0,
  }
  const others = participants.filter((p) => p.participantId !== session.participantId)

  // ── 공유 핸들러 (모바일/데스크탑 공용) ───────────────
  const handlePlay = async () => {
    if (isActuallyPlaying) {
      pause()
      setPlaying(false)
      api.post(`/api/rooms/${roomId}/playback/pause`).catch(() => {
        setPlaying(true)
        play()
      })
    } else {
      if (playingTrack) {
        play()
        setPlaying(true)
      } else if (firstPendingTrack) {
        loadVideo(firstPendingTrack.youtubeId, firstPendingTrack.durationSec)
        play()
        setPlaying(true)
      }
      api.post(`/api/rooms/${roomId}/playback/play`, { position_sec: positionSec }).catch(() => {
        setPlaying(false)
        pause()
      })
    }
  }

  const handleSkip = async () => {
    await api.post(`/api/rooms/${roomId}/queue/skip`)
  }

  const handleReorder = async (queueId: string, newPos: number) => {
    await api.put(`/api/rooms/${roomId}/queue/reorder`, { queue_id: queueId, new_position: newPos })
  }

  const handleRemove = async (queueId: string) => {
    await api.delete(`/api/rooms/${roomId}/queue/${queueId}`)
  }

  const handleVote = async (queueId: string) => {
    const hasVoted = myVotes.includes(queueId)
    setMyVotes(prev => hasVoted ? prev.filter(id => id !== queueId) : [...prev, queueId])
    await api.post(`/api/rooms/${roomId}/votes`, { queue_id: queueId, action: hasVoted ? 'cancel' : 'up' })
  }

  const handleReact = async (emoji: Emoji) => {
    await api.post(`/api/rooms/${roomId}/reactions`, { emoji })
  }

  const handleCancel = async (emoji: Emoji) => {
    await api.delete(`/api/rooms/${roomId}/reactions/${encodeURIComponent(emoji)}`)
  }

  const handleLeave = async () => {
    try {
      await api.delete(`/api/rooms/${roomId}/participants/me`)
    } finally {
      clearRoom()
      router.push('/')
    }
  }

  const handleSaveSettings = async (s: Partial<import('@/types').RoomSettings>) => {
    await api.put(`/api/rooms/${roomId}/settings`, s)
  }

  // ── 참여자 신청 곡 시트 데이터 ───────────────────────
  const personForSheet = participantTracksId
    ? participants.find((p) => p.participantId === participantTracksId)
    : null
  const personTracksForSheet = participantTracksId
    ? tracks.filter((t) => t.status === 'pending' && t.addedBy.participantId === participantTracksId)
    : []

  return (
    <>
      {/* ════════════════════════════════════════════════
          모바일 레이아웃 (< lg) — 기존 세로 스크롤
          ════════════════════════════════════════════════ */}
      <main
        className="lg:hidden bg-[#0A0A0A] flex flex-col relative overflow-hidden"
        style={{ height: 'var(--frame-h, 100svh)' }}
      >
        {/* 상단 바 */}
        <div className="flex-shrink-0">
          <RoomHeader
            roomName={room.name}
            onInvite={() => setShowInvite(true)}
            onSettings={permissions.canManageRoom ? () => setShowSettings(true) : undefined}
            onLeave={handleLeave}
            onEndRoom={permissions.canManageRoom ? async () => {
              await api.delete(`/api/rooms/${roomId}`)
            } : undefined}
          />
        </div>

        {/* 전체 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {currentTrack ? (
            <>
              <NowPlaying
                track={currentTrack}
                isPlaying={isActuallyPlaying}
                positionSec={playingTrack ? positionSec : 0}
                isPending={!playingTrack}
                canControl={permissions.canPlay}
                canSkip={permissions.canSkip}
                onPlay={handlePlay}
                onSkip={handleSkip}
              />
            </>
          ) : (
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

          {currentTrack && <QueueList
            tracks={tracks}
            currentQueueId={currentTrack.queueId}
            canReorder={permissions.canReorder}
            canVote={room.settings.voteMode}
            myVotes={myVotes}
            onAddTrack={() => router.push(`/room/${roomId}/add`)}
            onReorder={handleReorder}
            onRemove={handleRemove}
            onVote={handleVote}
            onAvatarTap={(id) => setParticipantTracksId(id)}
          />}
        </div>

        {/* 하단 캐릭터 존 */}
        <ParticipantBar
          participants={others}
          me={me}
          hasCurrentTrack={!!currentTrack}
          onOtherTap={(id) => setParticipantTracksId(id)}
          onAddTrack={() => router.push(`/room/${roomId}/add`)}
          onReact={handleReact}
          onCancel={handleCancel}
        />

        {/* 이모지 반응 — 모바일 전용 (fixed top) */}
        <EmojiStack onReact={handleReact} onCancel={handleCancel} />

        {process.env.NODE_ENV === 'development' && !isConnected && (
          <div className="fixed top-1 right-1 w-2 h-2 bg-error rounded-full" />
        )}
      </main>

      {/* ════════════════════════════════════════════════
          데스크탑 iPad 레이아웃 (≥ lg)
          ════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex min-h-screen items-center justify-center dot-grid"
        style={{ background: '#0d0d1a' }}
      >
        {/* iPad 프레임 */}
        <div
          className="relative"
          style={{
            width: 'min(960px, calc(100vw - 80px))',
            aspectRatio: '4/3',
            background: '#0A0A0A',
            borderRadius: 24,
            border: '7px solid #3a3a3c',
            overflow: 'hidden',
          }}
        >
          {/* 좌측 버튼 장식 */}
          <div style={{
            position: 'absolute', left: -9, top: '50%',
            transform: 'translateY(-50%)',
            width: 4, height: 40,
            background: '#3a3a3c', borderRadius: '2px 0 0 2px',
          }} />
          {/* 우측 버튼 장식 */}
          <div style={{
            position: 'absolute', right: -9, top: '50%',
            transform: 'translateY(-50%)',
            width: 4, height: 60,
            background: '#3a3a3c', borderRadius: '0 2px 2px 0',
          }} />
          {/* 홈바 */}
          <div style={{
            position: 'absolute', bottom: 6, left: '50%',
            transform: 'translateX(-50%)',
            width: 120, height: 4,
            background: '#3a3a3c', borderRadius: 2,
          }} />

          {/* 내부 flex row */}
          <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

            {/* ── 좌측 패널: NowPlaying ── */}
            <div style={{
              width: '42%',
              display: 'flex', flexDirection: 'column',
              borderRight: '0.5px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              {currentTrack ? (
                <NowPlaying
                  compact
                  track={currentTrack}
                  isPlaying={isActuallyPlaying}
                  positionSec={playingTrack ? positionSec : 0}
                  isPending={!playingTrack}
                  canControl={permissions.canPlay}
                  canSkip={permissions.canSkip}
                  onPlay={handlePlay}
                  onSkip={handleSkip}
                />
              ) : (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 14, color: '#404060',
                }}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="1"/>
                    <path d="M20 32V18l16-4v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="17" cy="32" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="33" cy="28" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  <p style={{ fontSize: 12, fontFamily: 'inherit', color: '#404060' }}>
                    재생할 곡을 추가해보세요
                  </p>
                  <button
                    onClick={() => router.push(`/room/${roomId}/add`)}
                    style={{
                      padding: '7px 16px', background: '#A89EF5',
                      border: 'none', borderRadius: 8, cursor: 'pointer',
                      fontSize: 12, fontWeight: 500, color: '#0A0A0A',
                      fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                      <line x1="6" y1="1" x2="6" y2="11" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="1" y1="6" x2="11" y2="6" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    곡 추가하기
                  </button>
                </div>
              )}
            </div>

            {/* ── 우측 패널: 헤더 + 큐 + 캐릭터 바 ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* ① 헤더 */}
              <div style={{
                padding: '10px 16px', flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 8,
                borderBottom: '0.5px solid rgba(255,255,255,0.08)',
              }}>
                <span style={{
                  flex: 1, fontSize: 13, fontWeight: 500, color: '#F0EEFF',
                  fontFamily: 'inherit',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {room.name}
                </span>

                {/* 더보기 드롭다운 — 모든 유저에게 표시 */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    onClick={() => setShowDesktopMenu(!showDesktopMenu)}
                    style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: showDesktopMenu ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                      border: '0.5px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#A0A0C0',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="3" r="1.2" fill="currentColor"/>
                      <circle cx="7" cy="7" r="1.2" fill="currentColor"/>
                      <circle cx="7" cy="11" r="1.2" fill="currentColor"/>
                    </svg>
                  </button>

                  {showDesktopMenu && (
                    <>
                      {/* 닫기 오버레이 */}
                      <div
                        style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                        onClick={() => setShowDesktopMenu(false)}
                      />
                      {/* 드롭다운 메뉴 */}
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 10,
                        background: '#1A1A1A', borderRadius: 10,
                        border: '0.5px solid rgba(255,255,255,0.1)',
                        minWidth: 140, overflow: 'hidden',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      }}>
                        {/* 초대 */}
                        <button
                          onClick={() => { setShowInvite(true); setShowDesktopMenu(false) }}
                          style={{
                            width: '100%', padding: '10px 14px', textAlign: 'left',
                            fontSize: 13, color: '#F0EEFF', background: 'none',
                            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          초대하기
                        </button>

                        {/* 방장: 설정 + 방 종료 */}
                        {permissions.canManageRoom && (
                          <>
                            <button
                              onClick={() => { setShowSettings(true); setShowDesktopMenu(false) }}
                              style={{
                                width: '100%', padding: '10px 14px', textAlign: 'left',
                                fontSize: 13, color: '#F0EEFF', background: 'none',
                                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                borderBottom: '0.5px solid rgba(255,255,255,0.06)',
                              }}
                            >
                              방 설정
                            </button>
                            <button
                              onClick={() => { api.delete(`/api/rooms/${roomId}`); setShowDesktopMenu(false) }}
                              style={{
                                width: '100%', padding: '10px 14px', textAlign: 'left',
                                fontSize: 13, color: '#E24B4A', background: 'none',
                                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                              }}
                            >
                              방 종료
                            </button>
                          </>
                        )}

                        {/* 비방장: 나가기 */}
                        {!permissions.canManageRoom && (
                          <button
                            onClick={() => { handleLeave(); setShowDesktopMenu(false) }}
                            style={{
                              width: '100%', padding: '10px 14px', textAlign: 'left',
                              fontSize: 13, color: '#E24B4A', background: 'none',
                              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            }}
                          >
                            방 나가기
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ② 큐 리스트 + EmojiStack 인라인 오버레이 */}
              <div
                style={{ flex: 1, overflowY: 'auto', padding: '8px 0', position: 'relative' }}
                className="scrollbar-hide"
              >
                <QueueList
                  compact
                  tracks={tracks}
                  currentQueueId={currentTrack?.queueId ?? null}
                  canReorder={permissions.canReorder}
                  canVote={room.settings.voteMode}
                  myVotes={myVotes}
                  onAddTrack={() => router.push(`/room/${roomId}/add`)}
                  onReorder={handleReorder}
                  onRemove={handleRemove}
                  onVote={handleVote}
                  onAvatarTap={(id) => setParticipantTracksId(id)}
                />
                <EmojiStack inline onReact={handleReact} onCancel={handleCancel} />
              </div>

              {/* ③ 하단 캐릭터 존 */}
              <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                <ParticipantBar
                  participants={others}
                  me={me}
                  hasCurrentTrack={!!currentTrack}
                  onOtherTap={(id) => setParticipantTracksId(id)}
                  onAddTrack={() => router.push(`/room/${roomId}/add`)}
                  onReact={handleReact}
                  onCancel={handleCancel}
                />
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          공통 오버레이 (모바일/데스크탑 모두 fixed)
          ════════════════════════════════════════════════ */}
      <InviteSheet
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        room={room}
        participants={participants}
      />

      {showSettings && permissions.canManageRoom && (
        <RoomSettingsSheet
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={room.settings}
          onSave={handleSaveSettings}
        />
      )}

      {participantTracksId && (
        <BottomSheet isOpen onClose={() => setParticipantTracksId(null)}>
          <div className="px-4 pb-8">
            <div className="flex items-center gap-3 mb-5">
              {personForSheet && (
                <Avatar color={personForSheet.avatar as AvatarType} size="sm" isHost={personForSheet.isHost} />
              )}
              <div>
                <p className="text-[15px] font-medium text-[var(--text-primary)]">
                  {personForSheet?.nickname ?? '참여자'}
                </p>
                <p className="text-[12px] text-[var(--text-tertiary)]">
                  신청한 곡 {personTracksForSheet.length}개
                </p>
              </div>
            </div>

            {personTracksForSheet.length === 0 ? (
              <p className="text-[13px] text-[var(--text-tertiary)] text-center py-6">
                아직 신청한 곡이 없어요
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {personTracksForSheet.map((t) => (
                  <div key={t.queueId} className="flex items-center gap-3 py-1">
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-input)]">
                      {t.thumbnailUrl && (
                        <img src={t.thumbnailUrl} alt={t.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium truncate text-[var(--text-primary)]">{t.title}</p>
                      <p className="text-[12px] truncate text-[var(--text-secondary)]">{t.artist}</p>
                    </div>
                    {t.durationSec > 0 && (
                      <span className="text-[12px] text-[var(--text-tertiary)] flex-shrink-0">
                        {formatDuration(t.durationSec)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </BottomSheet>
      )}
    </>
  )
}
