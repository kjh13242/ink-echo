'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRoomStore } from '@/store/roomStore'

export default function LandingPage() {
  const { room, session } = useRoomStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const hasActiveRoom = mounted && !!room && !!session

  return (
    <main
      className="bg-[var(--bg-surface)] flex flex-col items-center justify-center relative overflow-hidden"
      style={{ minHeight: 'var(--frame-h, 100svh)', padding: '24px 20px' }}
    >
      {/* 장식용 흐릿한 원 */}
      <div
        className="absolute w-[200px] h-[200px] rounded-full blur-[80px]"
        style={{
          background: 'rgba(127, 119, 221, 0.25)',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 0
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* 아이콘 */}
        <div
          className="flex items-center justify-center"
          style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'var(--bg-surface)',
            border: '0.5px solid var(--border-default)',
            marginBottom: 16,
            boxShadow: '0 8px 32px rgba(127, 119, 221, 0.15)'
          }}
        >
          <svg width="32" height="32" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
            <rect width="16" height="16" fill="var(--bg-surface)" />
            <rect x="3" y="4" width="10" height="4" fill="#FFD4A8" />
            <rect x="4" y="5" width="2" height="2" fill="#2A2660" />
            <rect x="10" y="5" width="2" height="2" fill="#2A2660" />
            <rect x="6" y="8" width="4" height="1" fill="#E8A090" />
            <rect x="3" y="9" width="10" height="1" fill="#2A2660" />
            <rect x="2" y="10" width="12" height="3" fill="#7F77DD" />
            <rect x="3" y="13" width="3" height="2" fill="#5A5490" />
            <rect x="10" y="13" width="3" height="2" fill="#5A5490" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: 20, fontWeight: 500,
            color: 'var(--text-primary)',
            marginBottom: 6, textAlign: 'center', lineHeight: 1.3,
          }}
        >
          같이 듣는 플레이리스트
        </h1>
        <p
          style={{
            fontSize: 14, color: 'var(--text-tertiary)',
            textAlign: 'center', lineHeight: 1.6, marginBottom: 28,
          }}
        >
          방을 만들고 친구를 부르면<br />함께 음악을 고를 수 있어요
        </p>

        <div className="w-full" style={{ maxWidth: 260 }}>
          {/* 이어 듣기 — 활성 세션 있을 때만 */}
          {hasActiveRoom && (
            <Link href={`/room/${room!.roomId}`} className="block w-full" style={{ marginBottom: 10 }}>
              <div
                className="w-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{
                  height: 44, borderRadius: 14,
                  background: 'var(--color-cta)',
                  color: 'var(--color-cta-text)',
                  fontSize: 14, fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(127, 119, 221, 0.3)'
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor"/>
                </svg>
                {room!.name} 이어 듣기
              </div>
            </Link>
          )}

          <Link href="/create" className="block w-full" style={{ marginBottom: 10 }}>
            <div
              className="w-full flex items-center justify-center active:scale-[0.98] transition-transform"
              style={{
                height: hasActiveRoom ? 40 : 44,
                borderRadius: 14,
                background: hasActiveRoom ? 'transparent' : 'var(--color-cta)',
                border: hasActiveRoom ? '0.5px solid rgba(180,176,220,0.7)' : 'none',
                color: hasActiveRoom ? 'var(--text-secondary)' : 'var(--color-cta-text)',
                fontSize: 14, fontWeight: hasActiveRoom ? 400 : 500,
                cursor: 'pointer',
                boxShadow: hasActiveRoom ? 'none' : '0 4px 12px rgba(127, 119, 221, 0.3)'
              }}
            >
              방 만들기
            </div>
          </Link>
          <Link href="/join" className="block w-full">
            <div
              className="w-full flex items-center justify-center gap-[5px] active:scale-[0.98] transition-all"
              style={{
                height: 40, borderRadius: 14,
                background: 'transparent',
                border: '0.5px solid rgba(180,176,220,0.7)',
                color: 'var(--text-secondary)',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <line x1="3.5" y1="6" x2="3.5" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="6" y1="6" x2="6" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8.5" y1="6" x2="8.5" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="3.5" y1="8.5" x2="10.5" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              코드로 입장하기
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
