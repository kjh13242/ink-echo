'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
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
      <main className="bg-[#0A0A0A] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (!echoCard) {
    return (
      <main className="bg-[#0A0A0A] min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-h2 text-[var(--text-primary)]">에코 카드를 찾을 수 없어요</p>
        <Button variant="secondary" onClick={() => router.push('/')}>
          홈으로
        </Button>
      </main>
    )
  }

  const [copied, setCopied] = useState(false)

  const durationText = echoCard.durationMin >= 60
    ? `${Math.floor(echoCard.durationMin / 60)}시간 ${echoCard.durationMin % 60}분`
    : `${echoCard.durationMin}분`

  const echoUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/echo/${echoId}`
    : ''

  const handleShare = async () => {
    const shareData = {
      title: `${echoCard.roomName}의 에코`,
      text: `${echoCard.participantCount}명이 함께 들은 ${echoCard.trackCount}곡`,
      url: echoUrl,
    }
    if (navigator.share && navigator.canShare?.(shareData)) {
      try { await navigator.share(shareData) } catch { /* 취소 */ }
    } else {
      // fallback: 카카오
      shareKakao({ roomName: echoCard.roomName, participantCount: echoCard.participantCount, inviteUrl: echoUrl })
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(echoUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* 무시 */ }
  }

  const handleKakaoShare = () => {
    shareKakao({
      roomName: echoCard.roomName,
      participantCount: echoCard.participantCount,
      inviteUrl: echoUrl,
    })
  }

  return (
    <main className="bg-[#0A0A0A] min-h-screen flex flex-col max-w-[430px] mx-auto px-4 py-8 pb-24">

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
              background: highlight ? 'rgba(168,158,245,0.12)' : 'rgba(255,255,255,0.04)',
              borderColor: highlight ? 'rgba(168,158,245,0.3)' : 'rgba(255,255,255,0.08)',
            }}
          >
            <p
              className="text-[20px] font-medium leading-[1]"
              style={{ color: highlight ? '#A89EF5' : 'var(--text-primary)' }}
            >
              {value}
            </p>
            <p
              className="text-[11px]"
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
          <p className="text-[11px] font-medium tracking-[0.04em] mb-[6px]" style={{ color: '#9490C0' }}>
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
                    background: highlight ? 'rgba(168,158,245,0.12)' : 'rgba(255,255,255,0.04)',
                    borderColor: highlight ? 'rgba(168,158,245,0.3)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <span className="text-[13px] w-[18px] text-center flex-shrink-0">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                  </span>
                  {track.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={track.thumbnailUrl}
                      alt={track.title}
                      className="w-[30px] h-[30px] rounded-[5px] flex-shrink-0 object-cover border"
                      style={{ borderColor: 'rgba(180, 176, 220, 0.3)' }}
                    />
                  ) : (
                    <div
                      className="w-[30px] h-[30px] rounded-[5px] flex-shrink-0 border"
                      style={{ background: 'rgba(210, 206, 248, 0.4)', borderColor: 'rgba(180, 176, 220, 0.3)' }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{track.title}</p>
                    <p className="text-[11px] mt-[1px] truncate" style={{ color: 'var(--text-secondary)' }}>{track.artist}</p>
                  </div>
                  <div className="text-[12px] flex-shrink-0" style={{ color: '#9490C0' }}>
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
                      px-4 py-4 border-t"
                      style={{ background: 'rgba(10,10,10,0.95)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
        <div className="flex flex-col gap-[7px]">
          {/* 메인 공유 버튼 — navigator.share 지원 시 시스템 공유 시트, 아니면 카카오 */}
          <div
            onClick={handleShare}
            className="w-full h-[44px] rounded-[12px] bg-[var(--color-cta)] text-white text-[13px] font-medium flex items-center justify-center gap-[6px] cursor-pointer active:scale-[0.98] transition-transform"
            style={{ fontFamily: 'inherit' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M11 1l4 4-4 4M1 8v1a5 5 0 0 0 5 5h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 5H5a4 4 0 0 0-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            에코 공유하기
          </div>

          <div className="flex gap-[7px]">
            {/* 링크 복사 */}
            <div
              onClick={handleCopyLink}
              className="flex-1 h-[36px] rounded-[10px] flex items-center justify-center gap-[5px] cursor-pointer active:scale-[0.98] transition-transform border"
              style={{
                background: copied ? 'rgba(127,119,221,0.08)' : 'var(--bg-surface)',
                borderColor: copied ? 'rgba(127,119,221,0.4)' : 'var(--border-default)',
                color: copied ? 'var(--color-cta)' : 'var(--text-secondary)',
                fontSize: 12,
                fontFamily: 'inherit',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="4" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4 4V2.5A1.5 1.5 0 0 1 5.5 1H11.5A1.5 1.5 0 0 1 13 2.5V8.5A1.5 1.5 0 0 1 11.5 10H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {copied ? '복사됨!' : '링크 복사'}
            </div>
            {/* 카카오 */}
            <div
              onClick={handleKakaoShare}
              className="flex-1 h-[36px] rounded-[10px] flex items-center justify-center gap-[5px] cursor-pointer active:scale-[0.98] transition-transform border border-[var(--border-default)]"
              style={{ background: '#FEE500', color: '#3C1E1E', fontSize: 12, fontFamily: 'inherit' }}
            >
              <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                <ellipse cx="10" cy="8.5" rx="9" ry="7" fill="#3C1E1E"/>
                <path d="M6 11l1.5-4 2.5 3 2.5-3 1.5 4" stroke="#FEE500" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              카카오
            </div>
            {/* 새 방 */}
            <div
              className="flex-1 h-[36px] rounded-[10px] bg-[var(--bg-surface)] flex items-center justify-center cursor-pointer active:scale-[0.98] transition-transform border border-[var(--border-default)]"
              style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'inherit' }}
              onClick={() => router.push('/create')}
            >
              새 방 만들기
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
