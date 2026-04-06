'use client'

import { useEffect, useRef } from 'react'
import { formatDuration } from '@/lib/utils'
import type { QueueTrack } from '@/types'

interface NowPlayingProps {
  track: QueueTrack
  isPlaying: boolean
  positionSec: number
  canControl: boolean
  canSkip: boolean
  onPlay: () => void
  onSkip: () => void
  onAvatarTap?: (participantId: string) => void
}

export function NowPlaying({
  track,
  isPlaying,
  positionSec,
  canControl,
  canSkip,
  onPlay,
  onSkip,
}: NowPlayingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const tRef = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)
  const holoRef = useRef<HTMLDivElement>(null)
  const shimmerRef = useRef<HTMLDivElement>(null)

  const progress = track.durationSec > 0
    ? Math.min(positionSec / track.durationSec, 1)
    : 0

  // Canvas 배경 드로잉
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = 334, H = 334

    const drawAnimated = () => {
      tRef.current += 0.007
      const t = tRef.current
      ctx.clearRect(0, 0, W, H)
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#130d30')
      bg.addColorStop(0.55, '#3a2fa0')
      bg.addColorStop(1, '#a89ef5')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      for (let i = 0; i < 6; i++) {
        const x = W / 2 + Math.cos(t * 0.6 + i * 1.05) * 80
        const y = H / 2 + Math.sin(t * 0.45 + i * 0.8) * 70
        const r = 55 + Math.sin(t * 1.1 + i) * 22
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, '#d0c8ff55')
        g.addColorStop(1, '#130d3000')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx.lineWidth = 0.8
      for (let i = 0; i < 7; i++) {
        const cx = W / 2 + Math.cos(t * 0.18 + i * 0.9) * 28
        const cy = H / 2 + Math.sin(t * 0.13 + i * 0.9) * 28
        ctx.beginPath()
        ctx.arc(cx, cy, 38 + i * 20, 0, Math.PI * 2)
        ctx.stroke()
      }
      const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.75)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(0,0,0,0.6)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, W, H)
      rafRef.current = requestAnimationFrame(drawAnimated)
    }

    const drawImage = (img: HTMLImageElement) => {
      cancelAnimationFrame(rafRef.current)
      const drawStatic = () => {
        ctx.drawImage(img, 0, 0, W, H)
        const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.75)
        vg.addColorStop(0, 'rgba(0,0,0,0)')
        vg.addColorStop(1, 'rgba(0,0,0,0.45)')
        ctx.fillStyle = vg
        ctx.fillRect(0, 0, W, H)
      }
      drawStatic()
    }

    if (track.thumbnailUrl) {
      const img = new Image()
      img.onload = () => {
        imgRef.current = img
        drawImage(img)
      }
      img.onerror = () => {
        imgRef.current = null
        drawAnimated()
      }
      img.src = track.thumbnailUrl
        .replace('mqdefault', 'maxresdefault')
        .replace('hqdefault', 'maxresdefault')
    } else {
      drawAnimated()
    }

    return () => cancelAnimationFrame(rafRef.current)
  }, [track.thumbnailUrl])

  // 마우스 틸트 핸들러
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    const scene = e.currentTarget
    const glare = glareRef.current
    const holo = holoRef.current
    const shimmer = shimmerRef.current
    if (!card || !glare || !holo || !shimmer) return

    const rect = scene.getBoundingClientRect()
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)

    card.style.transform = `rotateX(${-dy * 18}deg) rotateY(${dx * 18}deg) scale3d(1.04,1.04,1.04)`
    card.style.transition = 'transform 0.08s linear'

    const px = Math.round(50 + dx * 30)
    const py = Math.round(50 + dy * 30)
    glare.style.opacity = '1'
    glare.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 65%)`

    const bx = Math.round(50 + dx * 60)
    const by = Math.round(50 + dy * 60)
    holo.style.opacity = '1'
    holo.style.backgroundPosition = `${bx}% ${by}%`

    shimmer.style.background = `linear-gradient(${105 + dx * 20}deg, rgba(255,255,255,0) 35%, rgba(255,255,255,${0.12 + Math.abs(dx) * 0.1}) 50%, rgba(255,255,255,0) 65%)`
  }

  const onMouseLeave = () => {
    const card = cardRef.current
    const glare = glareRef.current
    const holo = holoRef.current
    const shimmer = shimmerRef.current
    if (!card || !glare || !holo || !shimmer) return

    card.style.transition = 'transform 0.6s cubic-bezier(0.23,1,0.32,1)'
    card.style.transform = 'rotateX(0) rotateY(0) scale3d(1,1,1)'
    glare.style.opacity = '0'
    holo.style.opacity = '0'
    shimmer.style.background = 'linear-gradient(105deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 60%)'
  }

  return (
    <div className="px-5 pt-4 pb-2 bg-[#0A0A0A]">
      {/* 앨범 커버 — 홀로그램 카드 */}
      <div
        style={{ perspective: '600px', cursor: 'pointer' }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="w-full mb-4"
      >
        <div
          ref={cardRef}
          style={{
            borderRadius: '18px',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: 'rotateX(0) rotateY(0)',
            transition: 'transform 0.08s linear',
            overflow: 'hidden',
            aspectRatio: '1',
            width: '100%',
          }}
        >
          {/* 베이스 Canvas */}
          <canvas
            ref={canvasRef}
            width={334}
            height={334}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              borderRadius: '18px', display: 'block',
            }}
          />

          {/* 홀로그램 레이어 */}
          <div
            ref={holoRef}
            style={{
              position: 'absolute', inset: 0, borderRadius: '18px',
              background: `
                repeating-linear-gradient(0deg,
                  rgba(255,255,255,0) 0%, rgba(255,128,0,0.04) 10%,
                  rgba(255,255,0,0.06) 20%, rgba(0,255,128,0.06) 30%,
                  rgba(0,128,255,0.06) 40%, rgba(128,0,255,0.06) 50%,
                  rgba(255,0,128,0.04) 60%, rgba(255,255,255,0) 70%),
                repeating-linear-gradient(90deg,
                  rgba(255,255,255,0) 0%, rgba(255,200,100,0.03) 15%,
                  rgba(100,255,200,0.03) 30%, rgba(200,100,255,0.03) 45%,
                  rgba(255,255,255,0) 60%)
              `,
              backgroundSize: '200% 200%',
              mixBlendMode: 'color-dodge' as React.CSSProperties['mixBlendMode'],
              opacity: 0,
              transition: 'opacity 0.3s',
            }}
          />

          {/* 글레어 레이어 */}
          <div
            ref={glareRef}
            style={{
              position: 'absolute', inset: 0, borderRadius: '18px',
              background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 65%)',
              mixBlendMode: 'overlay' as React.CSSProperties['mixBlendMode'],
              opacity: 0,
              transition: 'opacity 0.3s',
            }}
          />

          {/* 시머 레이어 */}
          <div
            ref={shimmerRef}
            style={{
              position: 'absolute', inset: 0, borderRadius: '18px',
              background: 'linear-gradient(105deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 60%)',
              mixBlendMode: 'overlay' as React.CSSProperties['mixBlendMode'],
            }}
          />

          {/* 테두리 */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '18px',
            border: '0.5px solid rgba(255,255,255,0.18)',
            pointerEvents: 'none',
          }} />

          {/* 곡 정보 글라스 */}
          <div style={{
            position: 'absolute', bottom: 16, left: 16, right: 16,
            background: 'rgba(0,0,0,0.42)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderRadius: '12px',
            padding: '10px 14px',
            border: '0.5px solid rgba(255,255,255,0.12)',
          }}>
            <p className="text-[15px] font-medium text-white truncate mb-0.5">
              {track.title}
            </p>
            <p className="text-[12px] text-white/55 truncate">
              {track.artist}
            </p>
            {track.message && (
              <p className="text-[10px] text-white/35 truncate mt-0.5">
                &ldquo;{track.message}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="mb-3">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#A89EF5] rounded-full transition-all duration-1000"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] text-white/30">{formatDuration(positionSec)}</span>
          <span className="text-[11px] text-white/30">{formatDuration(track.durationSec)}</span>
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="flex items-center justify-center gap-6 pb-2">
        {/* 재생/정지 */}
        <button
          onClick={canControl ? onPlay : undefined}
          disabled={!canControl}
          className="w-14 h-14 rounded-full bg-[#A89EF5] flex items-center justify-center
                     disabled:opacity-40 active:opacity-80 transition-opacity"
        >
          {isPlaying ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="6" y="5" width="3.5" height="12" rx="1.5" fill="#0A0A0A"/>
              <rect x="12.5" y="5" width="3.5" height="12" rx="1.5" fill="#0A0A0A"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M7 5l10 6-10 6V5z" fill="#0A0A0A"/>
            </svg>
          )}
        </button>

        {/* 스킵 */}
        <button
          onClick={canSkip ? onSkip : undefined}
          disabled={!canSkip}
          className="text-white/40 active:opacity-60 disabled:opacity-20"
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M15 7l6 7-6 7V7z" fill="currentColor"/>
            <rect x="7" y="7" width="3" height="14" rx="1.5" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
