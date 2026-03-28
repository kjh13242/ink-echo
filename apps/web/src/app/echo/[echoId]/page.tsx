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
      <main className="dot-grid min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (!echoCard) {
    return (
      <main className="dot-grid min-h-screen flex flex-col items-center justify-center gap-4">
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
    <main className="dot-grid min-h-screen flex flex-col max-w-[430px] mx-auto px-4 py-8 pb-24">

      {/* 헤더 */}
      <div className="mb-6 text-center">
        <p className="text-caption text-purple-400 mb-1">오늘의 에코</p>
        <h1 className="text-display text-purple-900 mb-1">{echoCard.roomName}</h1>
        <p className="text-caption text-[var(--text-tertiary)]">
          {new Date(echoCard.startedAt).toLocaleDateString('ko-KR', {
            month: 'long', day: 'numeric',
          })}
          {' · '}
          {durationText}
        </p>
      </div>

      {/* 통계 4개 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: '재생한 곡', value: `${echoCard.trackCount}곡` },
          { label: '함께한 인원', value: `${echoCard.participantCount}명` },
          { label: '이모지 반응', value: `${echoCard.totalReactions}개` },
          { label: '앙코르', value: `${echoCard.encoreCount}번` },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-[var(--bg-surface)] rounded-card p-4 text-center
                       border border-[var(--border-default)]"
          >
            <p className="text-[22px] font-semibold text-purple-900 mb-0.5">{value}</p>
            <p className="text-caption text-[var(--text-tertiary)]">{label}</p>
          </div>
        ))}
      </div>

      {/* Top 3 */}
      {echoCard.topTracks?.length > 0 && (
        <div className="mb-6">
          <p className="text-caption text-purple-500 mb-3">반응 많았던 곡 TOP {echoCard.topTracks.length}</p>
          <div className="flex flex-col gap-2">
            {echoCard.topTracks.map((track, i) => (
              <div
                key={track.queueId}
                className="flex items-center gap-3 bg-[var(--bg-surface)]
                           rounded-btn px-3 py-2.5 border border-[var(--border-default)]"
              >
                <span className="text-h2 font-bold text-purple-400 w-5 text-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-body1 text-[var(--text-primary)] truncate">{track.title}</p>
                  <p className="text-caption text-[var(--text-secondary)] truncate">{track.artist}</p>
                </div>
                {track.topEmoji && (
                  <span className="text-[18px] flex-shrink-0">{track.topEmoji}</span>
                )}
                <span className="text-caption text-[var(--text-tertiary)] flex-shrink-0">
                  {track.reactionCount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 참여자 */}
      {echoCard.participants?.length > 0 && (
        <div className="mb-6">
          <p className="text-caption text-purple-500 mb-3">함께한 사람들</p>
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
        <div className="flex flex-col gap-2">
          {/* 카카오 공유 */}
          <Button
            variant="kakao"
            size="lg"
            fullWidth
            onClick={handleKakaoShare}
          >
            카카오톡으로 공유
          </Button>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => router.push('/create')}
            >
              새 방 만들기
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => router.push('/')}
            >
              홈으로
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
