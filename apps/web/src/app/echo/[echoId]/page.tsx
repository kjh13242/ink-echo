'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/common/Button'
import { shareKakao } from '@/lib/kakao'
import type { EchoCard, Avatar as AvatarType } from '@/types'

export default function EchoCardPage() {
  const params = useParams()
  const router = useRouter()
  const echoId = params.echoId as string

  const { data: echoCard, isLoading } = useQuery({
    queryKey: ['echo-card', echoId],
    queryFn: () => api.get<EchoCard>(`/api/echo-cards/${echoId}`),
  })

  if (isLoading) {
    return (
      <main className="dot-grid bg-[var(--bg-base)] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (!echoCard) {
    return (
      <main className="dot-grid bg-[var(--bg-base)] min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-h2 text-[var(--text-primary)]">에코 카드를 찾을 수 없어요</p>
        <Button variant="secondary" onClick={() => router.push('/')}>
          홈으로
        </Button>
      </main>
    )
  }

  const durationText = echoCard.durationMin >= 60
    ? `${Math.floor(echoCard.durationMin / 60)}시간 ${echoCard.durationMin % 60}분`
    : `${echoCard.durationMin}분`

  const handleKakaoShare = () => {
    shareKakao({
      roomName: echoCard.roomName,
      participantCount: echoCard.participantCount,
      inviteUrl: `${window.location.origin}/echo/${echoId}`,
    })
  }

  return (
    <main className="dot-grid bg-[var(--bg-base)] min-h-screen flex flex-col max-w-[430px] mx-auto px-4 py-8 pb-24">

      {/* 헤더 */}
      <div className="mb-6 text-center">
        <p className="text-caption text-[var(--text-secondary)] mb-1">오늘의 에코</p>
        <h1 className="text-display text-[var(--text-primary)] mb-1">{echoCard.roomName}</h1>
        <p className="text-caption text-[var(--text-tertiary)]">
          {new Date(echoCard.startedAt).toLocaleDateString('ko-KR', {
            month: 'long', day: 'numeric',
          })}
          {' · '}
          {durationText}
        </p>
      </div>

      {/* 통계 4개 */}
      <div className="grid grid-cols-2 gap-[7px] mb-[12px]">
        {[
          { label: '재생한 곡', value: `${echoCard.trackCount}곡`, highlight: true },
          { label: '함께한 인원', value: `${echoCard.participantCount}명`, highlight: false },
          { label: '이모지 반응', value: `${echoCard.totalReactions}개`, highlight: false },
          { label: '앙코르', value: `${echoCard.encoreCount}번`, highlight: false },
        ].map(({ label, value, highlight }) => (
          <div
            key={label}
            className="rounded-[10px] p-[10px_10px_8px] flex flex-col gap-[3px] border"
            style={{
              background: highlight ? '#EEEDFE' : '#FFFFFF',
              borderColor: highlight ? 'rgba(175, 169, 236, 0.5)' : 'rgba(180, 176, 220, 0.5)',
            }}
          >
            <p
              className="text-[20px] font-medium leading-[1]"
              style={{ color: highlight ? '#3C3489' : '#2A2660' }}
            >
              {value}
            </p>
            <p
              className="text-[9px]"
              style={{ color: highlight ? '#7F77DD' : '#9490C0' }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Top 3 */}
      {echoCard.topTracks?.length > 0 && (
        <div className="mb-[12px]">
          <p className="text-[9px] font-medium tracking-[0.04em] mb-[6px]" style={{ color: '#9490C0' }}>
            반응 많았던 곡 TOP {echoCard.topTracks.length}
          </p>
          <div className="flex flex-col gap-[5px]">
            {echoCard.topTracks.map((track, i) => {
              const highlight = i === 0
              return (
                <div
                  key={track.queueId}
                  className="flex items-center gap-[8px] px-[10px] py-[7px] rounded-[10px] border"
                  style={{
                    background: highlight ? '#EEEDFE' : '#FFFFFF',
                    borderColor: highlight ? 'rgba(175, 169, 236, 0.5)' : 'rgba(180, 176, 220, 0.4)',
                  }}
                >
                  <span className="text-[13px] w-[18px] text-center flex-shrink-0">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                  </span>
                  <div
                    className="w-[30px] h-[30px] rounded-[5px] flex-shrink-0 border"
                    style={{ background: 'rgba(210, 206, 248, 0.4)', borderColor: 'rgba(180, 176, 220, 0.3)' }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate" style={{ color: '#2A2660' }}>{track.title}</p>
                    <p className="text-[9px] mt-[1px] truncate" style={{ color: '#6B67A0' }}>{track.artist}</p>
                  </div>
                  <div className="text-[10px] flex-shrink-0" style={{ color: '#9490C0' }}>
                    {track.topEmoji && <span className="mr-1">{track.topEmoji}</span>}
                    {track.reactionCount}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 참여자 */}
      {echoCard.participants?.length > 0 && (
        <div className="mb-6">
          <p className="text-caption text-[var(--text-secondary)] mb-3">함께한 사람들</p>
          <div className="flex gap-3 flex-wrap">
            {echoCard.participants.map((p) => (
              <div key={p.participantId} className="flex flex-col items-center gap-1">
                <Avatar color={p.avatar as AvatarType} size="md" isHost={p.isHost} />
                <p className="text-micro text-[var(--text-secondary)]">{p.nickname}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 액션 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto
                      px-4 py-4 bg-[var(--bg-sheet)] border-t border-[var(--border-default)]">
        <div className="flex flex-col gap-[7px]">
          <div
            onClick={handleKakaoShare}
            className="w-full h-[40px] rounded-[10px] bg-[var(--color-cta)] text-white text-[11px] font-medium flex items-center justify-center gap-[6px] cursor-pointer active:scale-[0.98] transition-transform"
            style={{ fontFamily: 'inherit' }}
          >
            카카오톡으로 공유
          </div>

          <div className="flex gap-[7px]">
            <div
              className="flex-1 h-[36px] rounded-[10px] bg-[var(--bg-surface)] text-[10px] flex items-center justify-center cursor-pointer active:scale-[0.98] transition-transform border border-[var(--border-default)]"
              style={{ color: 'var(--text-primary)', fontFamily: 'inherit' }}
              onClick={() => router.push('/create')}
            >
              새 방 만들기
            </div>
            <div
              className="flex-1 h-[36px] rounded-[10px] bg-[var(--bg-surface)] text-[10px] border border-[var(--border-default)] flex items-center justify-center cursor-pointer active:scale-[0.98] transition-transform"
              style={{ color: 'var(--text-primary)', fontFamily: 'inherit' }}
              onClick={() => router.push('/')}
            >
              홈으로
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
