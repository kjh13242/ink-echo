'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTrackSearch } from '@/hooks/useTrackSearch'
import { useRoomStore } from '@/store/roomStore'
import { useToastStore } from '@/store/toastStore'
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

export default function AddTrackPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string

  const room = useRoomStore((s) => s.room)
  const showToast = useToastStore((s) => s.showToast)

  const { query, setQuery, clearQuery, results, isLoading, recentQueries, deleteRecent } =
    useTrackSearch()

  const [isFocused, setIsFocused] = useState(false)
  const [selectedTracks, setSelectedTracks] = useState<SearchTrack[]>([])
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)
  const [activeMood, setActiveMood] = useState(getDefaultMoodTag())
  const [recommendations, setRecommendations] = useState<SearchTrack[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 분위기 추천 로드
  useEffect(() => {
    api.get<{ tracks: SearchTrack[] }>('/api/search/recommendations', {
      mood: activeMood,
      limit: '10',
    }).then((data) => setRecommendations(data.tracks)).catch(() => {})
  }, [activeMood])

  const isSearchMode = query.length > 0
  const showRecentDropdown = isFocused && !isSearchMode && recentQueries.length > 0

  const toggleSelect = (track: SearchTrack) => {
    if (!track.isAvailable) return
    const exists = selectedTracks.find((t) => t.youtubeId === track.youtubeId)
    if (exists) {
      setSelectedTracks((prev) => prev.filter((t) => t.youtubeId !== track.youtubeId))
      setMessages((prev) => { const n = { ...prev }; delete n[track.youtubeId]; return n })
      if (activeTrackId === track.youtubeId) setActiveTrackId(null)
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

      showToast({
        type: 'success',
        message: `${selectedTracks.length}곡이 추가됐어요`,
      })
      router.back()
    } catch {
      showToast({ type: 'error', message: '추가에 실패했어요. 다시 시도해주세요' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const trackList = isSearchMode ? results : recommendations

  return (
    <main className="bg-[var(--bg-base)] min-h-screen flex flex-col max-w-[430px] mx-auto">
      {/* 상단 바 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[rgba(200,196,244,0.5)] backdrop-blur-sm sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="text-[var(--text-secondary)] active:opacity-60"
        >
          <BackIcon />
        </button>

        {/* 검색창 */}
        <div className="relative flex-1">
          <div className="flex items-center gap-2 h-9 px-3 rounded-btn
                          bg-[var(--bg-input)] border border-[var(--border-default)]
                          focus-within:border-[var(--border-focus)] focus-within:bg-[var(--bg-input-focus)]
                          transition-colors">
            <SearchIcon />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 150)}
              placeholder="곡, 아티스트 검색"
              className="flex-1 bg-transparent text-body1 text-[var(--text-primary)]
                         placeholder:text-[var(--text-placeholder)]
                         outline-none"
            />
            {query && (
              <button onClick={clearQuery} className="text-[var(--text-tertiary)]">
                <XIcon />
              </button>
            )}
          </div>

          {/* 최근 검색어 드롭다운 */}
          {showRecentDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-sheet)]
                            border border-[var(--border-default)] rounded-drop shadow-lg z-20">
              {recentQueries.map((q) => (
                <div key={q} className="flex items-center gap-2 px-3 py-2.5">
                  <button
                    className="flex-1 text-left text-body2 text-[var(--text-primary)]"
                    onClick={() => setQuery(q)}
                  >
                    {q}
                  </button>
                  <button
                    onClick={() => deleteRecent(q)}
                    className="text-[var(--text-tertiary)]"
                  >
                    <XIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 분위기 태그 (검색 전) */}
      {!isSearchMode && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {MOOD_TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveMood(tag.id)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-caption border',
                  'transition-all active:scale-95',
                  activeMood === tag.id
                    ? 'border-purple-400 bg-purple-100 text-purple-800'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                )}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 탭 (검색 시) */}
      {isSearchMode && (
        <div className="px-4 pt-2 flex gap-4 border-b border-[var(--border-default)]">
          <span className="text-body1 font-medium text-purple-600 pb-2 border-b-2 border-purple-500">
            검색 결과
          </span>
        </div>
      )}

      {/* 트랙 목록 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-32">
        {isLoading ? (
          <TrackSkeleton />
        ) : trackList.length === 0 && isSearchMode ? (
          <p className="text-body2 text-[var(--text-tertiary)] text-center py-12">
            '{query}'에 대한 결과가 없어요
          </p>
        ) : (
          <div className="flex flex-col gap-1 pt-2">
            {trackList.map((track) => {
              const isSelected = !!selectedTracks.find((t) => t.youtubeId === track.youtubeId)
              return (
                <button
                  key={track.youtubeId}
                  onClick={() => toggleSelect(track)}
                  disabled={!track.isAvailable}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-btn text-left w-full',
                    'transition-all active:scale-[0.99]',
                    isSelected
                      ? 'bg-purple-50 border border-purple-300'
                      : 'bg-[var(--bg-surface)] border border-transparent',
                    !track.isAvailable && 'opacity-45'
                  )}
                >
                  {/* 썸네일 */}
                  <div className="relative flex-shrink-0">
                    {track.thumbnailUrl ? (
                      <img
                        src={track.thumbnailUrl}
                        alt={track.title}
                        className="w-11 h-11 rounded-thumb object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-thumb bg-[var(--bg-input)]" />
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 rounded-thumb bg-purple-500/20
                                      flex items-center justify-center">
                        <CheckIcon />
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-body1 text-[var(--text-primary)] truncate">
                      {track.title}
                    </p>
                    <p className="text-caption text-[var(--text-secondary)] truncate">
                      {track.artist}
                    </p>
                    {!track.isAvailable && (
                      <span className="text-micro text-error">재생 불가</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 하단 선택 패널 */}
      {selectedTracks.length > 0 && (
        <SelectionPanel
          selectedTracks={selectedTracks}
          messages={messages}
          activeTrackId={activeTrackId}
          isSubmitting={isSubmitting}
          onRemove={(youtubeId) => {
            setSelectedTracks((prev) => prev.filter((t) => t.youtubeId !== youtubeId))
            setMessages((prev) => { const n = { ...prev }; delete n[youtubeId]; return n })
            if (activeTrackId === youtubeId) setActiveTrackId(null)
          }}
          onMessageChange={(youtubeId, msg) =>
            setMessages((prev) => ({ ...prev, [youtubeId]: msg }))
          }
          onActiveChange={setActiveTrackId}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  )
}

// ─── 하단 선택 패널 ────────────────────────────────────
interface SelectionPanelProps {
  selectedTracks: SearchTrack[]
  messages: Record<string, string>
  activeTrackId: string | null
  isSubmitting: boolean
  onRemove: (id: string) => void
  onMessageChange: (id: string, msg: string) => void
  onActiveChange: (id: string) => void
  onSubmit: () => void
}

function SelectionPanel({
  selectedTracks,
  messages,
  activeTrackId,
  isSubmitting,
  onRemove,
  onMessageChange,
  onActiveChange,
  onSubmit,
}: SelectionPanelProps) {
  const activeTrack =
    selectedTracks.find((t) => t.youtubeId === activeTrackId) ?? selectedTracks[0]
  const isMultiple = selectedTracks.length > 1

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-20
                    bg-[var(--bg-sheet)] border-t border-[var(--border-default)]
                    px-4 pt-3 pb-5 shadow-xl">

      {/* 복수 선택: 칩 스크롤 */}
      {isMultiple && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 pb-1">
          {selectedTracks.map((track) => (
            <button
              key={track.youtubeId}
              onClick={() => onActiveChange(track.youtubeId)}
              className={cn(
                'flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1.5 rounded-full',
                'text-caption border transition-all',
                track.youtubeId === (activeTrackId ?? selectedTracks[0].youtubeId)
                  ? 'border-purple-400 bg-purple-100 text-purple-800'
                  : 'border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-secondary)]'
              )}
            >
              <span className="max-w-[80px] truncate">{track.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(track.youtubeId) }}
                className="text-[var(--text-tertiary)] hover:text-error"
              >
                <XSmallIcon />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* 단건: 선택 카드 */}
      {!isMultiple && activeTrack && (
        <div className="flex items-center gap-3 mb-3">
          {activeTrack.thumbnailUrl && (
            <img
              src={activeTrack.thumbnailUrl}
              alt={activeTrack.title}
              className="w-10 h-10 rounded-thumb object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-body1 text-[var(--text-primary)] truncate">{activeTrack.title}</p>
            <p className="text-caption text-[var(--text-secondary)] truncate">{activeTrack.artist}</p>
          </div>
          <button onClick={() => onRemove(activeTrack.youtubeId)} className="text-[var(--text-tertiary)]">
            <XIcon />
          </button>
        </div>
      )}

      {/* 메시지 입력 */}
      {activeTrack && (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={messages[activeTrack.youtubeId] ?? ''}
            onChange={(e) => onMessageChange(activeTrack.youtubeId, e.target.value.slice(0, 30))}
            placeholder="한 줄 메시지... (선택)"
            className="flex-1 h-9 px-3 rounded-btn bg-[var(--bg-input)]
                       border border-[var(--border-default)]
                       text-body2 text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]
                       focus:outline-none focus:border-[var(--border-focus)] focus:bg-[var(--bg-input-focus)]
                       transition-colors"
          />
          <span className="text-micro text-[var(--text-placeholder)] flex-shrink-0">
            {(messages[activeTrack.youtubeId] ?? '').length}/30
          </span>
        </div>
      )}

      {/* 추가 버튼 */}
      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full h-10 rounded-btn bg-[var(--color-cta)] text-[var(--color-cta-text)]
                   text-body1 font-medium
                   disabled:opacity-40 active:opacity-80 transition-opacity"
      >
        {isSubmitting
          ? '추가 중...'
          : isMultiple
          ? `${selectedTracks.length}곡 추가`
          : '추가'
        }
      </button>
    </div>
  )
}

// ─── 스켈레톤 ─────────────────────────────────────────
function TrackSkeleton() {
  return (
    <div className="flex flex-col gap-1 pt-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-surface)] rounded-btn animate-pulse">
          <div className="w-11 h-11 rounded-thumb bg-[var(--bg-input)] flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3 bg-[var(--bg-input)] rounded mb-1.5 w-3/4" />
            <div className="h-2.5 bg-[var(--bg-input)] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── 아이콘 ───────────────────────────────────────────
function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-[var(--text-placeholder)]">
      <path fillRule="evenodd" d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1ZM0 6a6 6 0 1 1 10.89 3.477l2.816 2.816a.75.75 0 1 1-1.06 1.06L9.83 10.538A6 6 0 0 1 0 6Z" clipRule="evenodd"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function XSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4 9l4 4 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
