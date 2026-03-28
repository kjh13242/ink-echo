'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SearchTrack } from '@/types'

const RECENT_KEY = 'ink_echo_recent_searches'
const MAX_RECENT = 5
const DEBOUNCE_MS = 300

function getRecentQueries(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecentQuery(query: string) {
  const recent = getRecentQueries().filter((q) => q !== query)
  const updated = [query, ...recent].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

export function useTrackSearch() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [recentQueries, setRecentQueries] = useState<string[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 최근 검색어 초기 로드
  useEffect(() => {
    setRecentQueries(getRecentQueries())
  }, [])

  // 디바운스 처리
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query)
      if (query.trim()) saveRecentQuery(query.trim())
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  // TanStack Query — 1시간 캐시
  const { data, isLoading } = useQuery({
    queryKey: ['track-search', debouncedQuery],
    queryFn: () =>
      api.get<{ tracks: SearchTrack[] }>('/api/search/tracks', {
        q: debouncedQuery,
        limit: 10,
      }),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })

  const deleteRecent = useCallback((q: string) => {
    const updated = getRecentQueries().filter((r) => r !== q)
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
    setRecentQueries(updated)
  }, [])

  const clearQuery = useCallback(() => {
    setQuery('')
    setDebouncedQuery('')
  }, [])

  return {
    query,
    setQuery,
    clearQuery,
    results: data?.tracks ?? [],
    isLoading: isLoading && debouncedQuery.length > 0,
    recentQueries,
    deleteRecent,
  }
}
