'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTrackSearch } from '@/hooks/useTrackSearch'
import { useToastStore } from '@/store/toastStore'
import { useQueueStore } from '@/store/queueStore'
import { usePlaybackStore } from '@/store/playbackStore'
import { api } from '@/lib/api'
import { getDefaultMoodTag, cn } from '@/lib/utils'
import type { SearchTrack } from '@/types'

const MOOD_TAGS = [
  { id: 'late_drive', label: '🌙 새벽 드라이브' },
  { id: 'energy',     label: '⚡ 에너지 충전' },
  { id: 'party',      label: '🎉 파티 모드' },
  { id: 'focus',      label: '🧘 집중' },
  { id: 'daytime',    label: '☀️ 기분 좋은 낮' },
  { id: 'emotional',  label: '💔 감성' },
]

type Tab = 'search' | 'mood'

export default function AddTrackPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string
  const showToast = useToastStore((s) => s.showToast)

  const { query, setQuery, clearQuery, results, isLoading, recentQueries, deleteRecent } =
    useTrackSearch()

  const tracks = useQueueStore((s) => s.tracks)
  const isPlaying = usePlaybackStore((s) => s.isPlaying)
  const positionSec = usePlaybackStore((s) => s.positionSec)
  const currentTrack = tracks.find((t) => t.status === 'playing') ?? null

  const [tab, setTab] = useState<Tab>('search')
  const [isFocused, setIsFocused] = useState(false)
  const [selectedTracks, setSelectedTracks] = useState<SearchTrack[]>([])
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)
  const [activeMood, setActiveMood] = useState(getDefaultMoodTag())
  const [recommendations, setRecommendations] = useState<SearchTrack[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    api.get<{ tracks: SearchTrack[] }>('/api/search/recommendations', {
      mood: activeMood,
      limit: '10',
    }).then((data) => setRecommendations(data.tracks)).catch(() => {})
  }, [activeMood])

  const isSearchMode = query.length > 0
  const showRecentDropdown = isFocused && !isSearchMode && recentQueries.length > 0
  const trackList = isSearchMode ? results : recommendations

  const toggleSelect = (track: SearchTrack) => {
    if (!track.isAvailable) return
    const exists = selectedTracks.find((t) => t.youtubeId === track.youtubeId)
    if (exists) {
      const next = selectedTracks.filter((t) => t.youtubeId !== track.youtubeId)
      setSelectedTracks(next)
      setMessages((prev) => { const n = { ...prev }; delete n[track.youtubeId]; return n })
      setActiveTrackId(next[next.length - 1]?.youtubeId ?? null)
    } else {
      setSelectedTracks((prev) => [...prev, track])
      setActiveTrackId(track.youtubeId)
    }
  }

  const handleSubmit = async () => {
    if (!selectedTracks.length) return
    setIsSubmitting(true)
    try {
      await api.post(`/api/rooms/${roomId}/queue`, {
        tracks: selectedTracks.map((t) => ({
          youtube_id: t.youtubeId,
          title: t.title,
          artist: t.artist,
          thumbnail_url: t.thumbnailUrl,
          duration_sec: t.durationSec,
          message: messages[t.youtubeId] || null,
        })),
      })
      showToast({ type: 'success', message: `${selectedTracks.length}곡이 추가됐어요` })
      router.replace(`/room/${roomId}`)
    } catch {
      showToast({ type: 'error', message: '추가에 실패했어요. 다시 시도해주세요' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeTrack =
    selectedTracks.find((t) => t.youtubeId === activeTrackId) ?? selectedTracks[0]

  return (
    <div className="bg-[var(--bg-surface)] flex flex-col overflow-hidden" style={{ height: 'var(--frame-h, 100svh)' }}>

      {/* ── 상단 바 ── */}
      <div
        className="flex items-center gap-2 px-[14px] py-3 flex-shrink-0 sticky top-0 z-10"
        style={{
          background: 'color-mix(in srgb, var(--bg-surface) 80%, transparent)',
          borderBottom: '0.5px solid var(--border-default)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <button
          onClick={() => router.replace(`/room/${roomId}`)}
          className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 active:opacity-50 transition-opacity"
          style={{ border: '0.5px solid var(--border-default)', background: 'var(--bg-input)' }}
        >
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <path d="M7 1L3 5L7 9" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[13px] font-medium text-[var(--text-primary)] flex-1">곡 추가하기</span>
        {selectedTracks.length > 0 && (
          <span className="text-[12px] font-medium" style={{ color: 'var(--color-cta)' }}>
            {selectedTracks.length}곡 선택
          </span>
        )}
      </div>

      {/* ── 미니 재생바 ── */}
      {currentTrack && (
        <div
          className="flex items-center gap-[8px] px-3 flex-shrink-0"
          style={{
            height: 44,
            background: 'rgba(127,119,221,0.06)',
            borderBottom: '0.5px solid rgba(127,119,221,0.15)',
          }}
        >
          {/* 썸네일 */}
          <div
            className="w-[28px] h-[28px] flex-shrink-0 overflow-hidden relative"
            style={{ borderRadius: 5, background: 'var(--bg-input)' }}
          >
            {currentTrack.thumbnailUrl && (
              <img src={currentTrack.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            )}
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center"
                   style={{ background: 'rgba(0,0,0,0.35)' }}>
                <div className="flex items-end gap-[2px]" style={{ height: 10 }}>
                  {[0, 0.2, 0.1].map((delay, i) => (
                    <div
                      key={i}
                      style={{
                        width: 2, borderRadius: 1, background: 'white',
                        animation: `eq-bar 0.8s ease-in-out ${delay}s infinite alternate`,
                        height: i === 1 ? 10 : 6,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 정보 + 프로그레스 */}
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium truncate" style={{ color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {currentTrack.title}
            </div>
            <div className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
              {currentTrack.artist}
            </div>
            {/* 프로그레스 바 */}
            <div
              className="mt-[3px]"
              style={{ height: 2, borderRadius: 1, background: 'rgba(127,119,221,0.2)', overflow: 'hidden' }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: 1,
                  background: 'var(--color-cta)',
                  width: currentTrack.durationSec
                    ? `${Math.min(100, (positionSec / currentTrack.durationSec) * 100)}%`
                    : '0%',
                  transition: 'width 1s linear',
                }}
              />
            </div>
          </div>

          {/* 재생 상태 아이콘 */}
          <div className="flex-shrink-0" style={{ color: 'var(--color-cta)', opacity: 0.7 }}>
            {isPlaying ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="2" y="2" width="3" height="8" rx="1" fill="currentColor" />
                <rect x="7" y="2" width="3" height="8" rx="1" fill="currentColor" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 2l7 4-7 4V2z" fill="currentColor" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* ── 검색 바 ── */}
      <div className="px-3 py-2 flex-shrink-0 relative z-10">
        <div className="relative">
          <svg
            className="absolute left-[9px] top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ opacity: 0.5 }}
            width="13" height="13" viewBox="0 0 16 16" fill="none"
          >
            <circle cx="7" cy="7" r="4.5" stroke="#7F77DD" strokeWidth="1.5" />
            <line x1="10.5" y1="10.5" x2="13" y2="13" stroke="#7F77DD" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            placeholder="곡, 아티스트 검색"
            className="w-full h-[34px] text-[13px] outline-none transition-colors pl-[28px] pr-[10px]"
            style={{
              borderRadius: 10,
              border: `0.5px solid ${isFocused || query ? 'rgba(127,119,221,0.5)' : 'var(--border-default)'}`,
              background: isFocused || query ? 'var(--bg-input-focus)' : 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              colorScheme: 'light',
              WebkitAppearance: 'none',
              appearance: 'none',
            }}
          />
          {query && (
            <button
              onClick={clearQuery}
              className="absolute right-[9px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full flex items-center justify-center text-[7px]"
              style={{ background: 'rgba(180,176,220,0.3)', color: 'var(--text-secondary)' }}
            >
              ✕
            </button>
          )}

          {/* 최근 검색어 드롭다운 — 콘텐츠 위에 오버레이 */}
          {showRecentDropdown && (
            <div
              className="absolute top-full left-0 right-0 mt-1 overflow-hidden"
              style={{
                borderRadius: 10,
                border: '0.5px solid rgba(180,176,220,0.7)',
                background: 'var(--bg-sheet)',
                boxShadow: '0 4px 16px rgba(100,96,180,0.12)',
                zIndex: 30,
              }}
            >
              {recentQueries.map((q, i) => (
                <div
                  key={q}
                  className="flex items-center gap-2 px-3"
                  style={{
                    paddingTop: 8, paddingBottom: 8,
                    borderBottom: i < recentQueries.length - 1 ? '0.5px solid rgba(200,196,240,0.4)' : 'none',
                  }}
                >
                  {/* 시계 아이콘 */}
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.4, flexShrink: 0 }}>
                    <circle cx="8" cy="8" r="5.5" stroke="var(--text-secondary)" strokeWidth="1.2" />
                    <path d="M8 5v3.5l2 1.5" stroke="var(--text-secondary)" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <button
                    className="flex-1 text-left text-[13px]"
                    style={{ color: 'var(--text-primary)', fontFamily: 'inherit' }}
                    onClick={() => setQuery(q)}
                  >
                    {q}
                  </button>
                  <button
                    onClick={() => deleteRecent(q)}
                    className="text-[12px] px-1"
                    style={{ color: 'var(--text-placeholder)' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 탭 ── */}
      <div
        className="flex flex-shrink-0"
        style={{ borderBottom: '0.5px solid var(--border-default)' }}
      >
        {(['search', 'mood'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-[6px] text-[13px] text-center transition-colors"
            style={{
              fontFamily: 'inherit',
              fontWeight: tab === t ? 500 : 400,
              color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
              borderBottom: `2px solid ${tab === t ? 'var(--color-cta)' : 'transparent'}`,
            }}
          >
            {t === 'search' ? '검색' : '분위기 추천'}
          </button>
        ))}
      </div>

      {/* ── 분위기 태그 (검색어 없을 때 항상 표시) ── */}
      {!isSearchMode && (
        <div
          className="px-3 py-[7px] flex-shrink-0"
          style={{ borderBottom: '0.5px solid var(--border-default)' }}
        >
          <div className="flex flex-wrap gap-1">
            {MOOD_TAGS.map((tag) => {
              const isActive = tab === 'mood' && activeMood === tag.id
              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    if (tab === 'search') {
                      setTab('mood')
                    }
                    setActiveMood(tag.id)
                  }}
                  className="text-[12px] transition-colors"
                  style={{
                    fontFamily: 'inherit',
                    padding: '3px 9px',
                    borderRadius: 10,
                    border: `0.5px solid ${isActive ? 'rgba(168,158,245,0.5)' : 'var(--border-default)'}`,
                    background: isActive ? 'rgba(168,158,245,0.12)' : 'var(--bg-input)',
                    color: isActive ? 'var(--color-cta)' : 'var(--text-secondary)',
                  }}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 트랙 목록 ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* 섹션 레이블 */}
        <div
          className="px-3 pt-[6px] pb-[3px] text-[11px] tracking-[0.05em] font-medium"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {isSearchMode
            ? `'${query}' 검색 결과`
            : tab === 'mood'
            ? `${MOOD_TAGS.find((t) => t.id === activeMood)?.label} — 방 히스토리 기반`
            : '지금 방 분위기에 어울리는 곡'}
        </div>

        {isLoading ? (
          <TrackSkeleton />
        ) : trackList.length === 0 && isSearchMode ? (
          <p className="text-[13px] text-center py-12 px-4" style={{ color: 'var(--text-tertiary)' }}>
            &lsquo;{query}&rsquo;에 대한 결과가 없어요
          </p>
        ) : (
          trackList.map((track) => {
            const isSelected = !!selectedTracks.find((t) => t.youtubeId === track.youtubeId)
            return (
              <div
                key={track.youtubeId}
                onClick={() => toggleSelect(track)}
                className={cn('flex items-center gap-[7px] px-3 py-[6px] cursor-pointer transition-colors', !track.isAvailable && 'opacity-40')}
                style={{ background: isSelected ? 'rgba(127,119,221,0.06)' : undefined }}
              >
                {/* 썸네일 */}
                <div
                  className="w-[34px] h-[34px] flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{
                    borderRadius: 6,
                    border: '0.5px solid var(--border-default)',
                    background: 'var(--bg-input)',
                  }}
                >
                  {track.thumbnailUrl ? (
                    <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-0 h-0 ml-[2px]"
                      style={{
                        borderTop: '4px solid transparent',
                        borderBottom: '4px solid transparent',
                        borderLeft: '7px solid rgba(120,116,180,0.4)',
                      }}
                    />
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {track.title}
                  </div>
                  <div className="text-[12px] mt-[1px] truncate" style={{ color: 'var(--text-secondary)' }}>
                    {track.artist}
                  </div>
                </div>

                {/* 추가/체크 버튼 */}
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    border: `0.5px solid ${isSelected ? 'rgba(168,158,245,0.5)' : 'var(--border-default)'}`,
                    background: isSelected ? 'rgba(168,158,245,0.15)' : 'var(--bg-surface)',
                  }}
                >
                  {isSelected ? (
                    <span className="text-[12px]" style={{ color: 'var(--color-cta)' }}>✓</span>
                  ) : (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <rect x="3.75" y="0" width="1.5" height="9" rx="0.75" fill="var(--text-tertiary)" />
                      <rect x="0" y="3.75" width="9" height="1.5" rx="0.75" fill="var(--text-tertiary)" />
                    </svg>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── 하단 영역 (sticky) ── */}
      <div
        className="sticky bottom-0 z-20 px-3 pb-4 flex-shrink-0"
        style={{
          borderTop: '0.5px solid var(--border-default)',
          background: 'color-mix(in srgb, var(--bg-sheet) 97%, transparent)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {selectedTracks.length > 0 && (
          <div className="pt-2">
            {selectedTracks.length === 1 ? (
              /* 단건 선택 카드 */
              <div
                className="flex items-center gap-[7px] px-2 py-[5px] mb-[7px]"
                style={{
                  borderRadius: 10,
                  border: '0.5px solid var(--border-default)',
                  background: 'var(--bg-input)',
                }}
              >
                <div
                  className="w-[28px] h-[28px] flex-shrink-0 overflow-hidden"
                  style={{ borderRadius: 5, border: '0.5px solid var(--border-default)', background: 'var(--bg-surface)' }}
                >
                  {selectedTracks[0].thumbnailUrl && (
                    <img src={selectedTracks[0].thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {selectedTracks[0].title}
                  </div>
                  <div className="text-[12px] mt-[1px] truncate" style={{ color: 'var(--text-secondary)' }}>
                    {selectedTracks[0].artist}
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedTracks([]); setMessages({}) }}
                  className="text-[11px] px-[3px] py-[2px]"
                  style={{ color: 'var(--text-placeholder)' }}
                >
                  ✕
                </button>
              </div>
            ) : (
              /* 복수 칩 */
              <div className="flex gap-1 overflow-x-auto pb-1 mb-[6px]" style={{ scrollbarWidth: 'none' }}>
                {selectedTracks.map((track) => {
                  const isActive = (activeTrackId ?? selectedTracks[0].youtubeId) === track.youtubeId
                  return (
                    <div
                      key={track.youtubeId}
                      onClick={() => setActiveTrackId(track.youtubeId)}
                      className="flex items-center gap-1 flex-shrink-0 cursor-pointer transition-colors"
                      style={{
                        padding: '3px 7px 3px 5px',
                        borderRadius: 9,
                        border: `0.5px solid ${isActive ? 'rgba(168,158,245,0.5)' : 'var(--border-default)'}`,
                        background: isActive ? 'rgba(168,158,245,0.12)' : 'var(--bg-input)',
                      }}
                    >
                      <div
                        className="w-[16px] h-[16px] flex-shrink-0 overflow-hidden"
                        style={{ borderRadius: 3, background: 'var(--bg-surface)' }}
                      >
                        {track.thumbnailUrl && <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span
                        className="text-[12px] font-medium max-w-[55px] truncate"
                        style={{ color: isActive ? 'var(--color-cta)' : 'var(--text-secondary)' }}
                      >
                        {track.title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const next = selectedTracks.filter((t) => t.youtubeId !== track.youtubeId)
                          setSelectedTracks(next)
                          setMessages((prev) => { const n = { ...prev }; delete n[track.youtubeId]; return n })
                          if (activeTrackId === track.youtubeId) setActiveTrackId(next[0]?.youtubeId ?? null)
                        }}
                        className="text-[12px]"
                        style={{ color: 'var(--text-placeholder)' }}
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 메시지 입력 */}
            {activeTrack && (
              <>
                {selectedTracks.length > 1 && (
                  <div className="text-[12px] mb-1 pl-[2px]" style={{ color: 'var(--text-placeholder)' }}>
                    {activeTrack.title}에 메시지 남기기 (선택)
                  </div>
                )}
                <div className="relative mb-[7px]">
                  <input
                    type="text"
                    value={messages[activeTrack.youtubeId] ?? ''}
                    onChange={(e) =>
                      setMessages((prev) => ({ ...prev, [activeTrack.youtubeId]: e.target.value.slice(0, 30) }))
                    }
                    placeholder="한 줄 메시지... (선택)"
                    className="w-full h-[34px] outline-none transition-colors pl-[10px] pr-[38px]"
                    style={{
                      borderRadius: 10,
                      border: '0.5px solid var(--border-default)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      fontStyle: 'italic',
                      colorScheme: 'light',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(127,119,221,0.5)'
                      e.target.style.background = 'var(--bg-input-focus)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-default)'
                      e.target.style.background = 'var(--bg-input)'
                    }}
                  />
                  <span
                    className="absolute right-[9px] top-1/2 -translate-y-1/2 text-[11px] pointer-events-none"
                    style={{ color: 'var(--text-placeholder)' }}
                  >
                    {(messages[activeTrack.youtubeId] ?? '').length}/30
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* 제출 버튼 */}
        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={selectedTracks.length === 0 || isSubmitting}
            className="w-full h-[36px] text-[13px] font-medium flex items-center justify-center transition-all active:scale-[0.98] disabled:cursor-default"
            style={{
              borderRadius: 10,
              fontFamily: 'inherit',
              background: selectedTracks.length === 0 ? 'rgba(180,176,220,0.15)' : 'var(--color-cta)',
              color: selectedTracks.length === 0 ? 'var(--text-placeholder)' : 'var(--color-cta-text)',
              opacity: isSubmitting ? 0.5 : 1,
              boxShadow: selectedTracks.length > 0 ? '0 4px 12px rgba(127, 119, 221, 0.3)' : 'none',
            }}
          >
            {isSubmitting
              ? '추가 중...'
              : selectedTracks.length === 0
              ? '곡을 선택해주세요'
              : selectedTracks.length === 1
              ? '플레이리스트에 추가'
              : `${selectedTracks.length}곡 모두 추가하기`}
          </button>
        </div>
      </div>
    </div>
  )
}

function TrackSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-[7px] px-3 py-[6px] animate-pulse">
          <div className="w-[34px] h-[34px] flex-shrink-0" style={{ borderRadius: 6, background: 'var(--bg-input)' }} />
          <div className="flex-1">
            <div className="h-[11px] w-3/4 mb-1" style={{ borderRadius: 4, background: 'var(--bg-input)' }} />
            <div className="h-[9px] w-1/2" style={{ borderRadius: 4, background: 'var(--bg-input)' }} />
          </div>
          <div className="w-[22px] h-[22px] rounded-full flex-shrink-0" style={{ background: 'var(--bg-input)' }} />
        </div>
      ))}
    </>
  )
}
