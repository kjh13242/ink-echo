'use client'

import React, { useState, useEffect } from 'react'

const DEFAULT_W = 390
const DEFAULT_H = 844
const STORAGE_KEY = 'ink-echo-frame'

export function DesktopFrame({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [w, setW] = useState(DEFAULT_W)
  const [h, setH] = useState(DEFAULT_H)
  const [wInput, setWInput] = useState(String(DEFAULT_W))
  const [hInput, setHInput] = useState(String(DEFAULT_H))

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      if (saved.w && saved.h) {
        setW(saved.w)
        setH(saved.h)
        setWInput(String(saved.w))
        setHInput(String(saved.h))
      }
    } catch {}

    setMounted(true)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const applyDims = (newW: number, newH: number) => {
    const cw = Math.max(320, Math.min(768, newW))
    const ch = Math.max(568, Math.min(1200, newH))
    setW(cw)
    setH(ch)
    setWInput(String(cw))
    setHInput(String(ch))
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ w: cw, h: ch }))
  }

  const commitW = () => {
    const v = parseInt(wInput)
    if (!isNaN(v)) applyDims(v, h)
    else setWInput(String(w))
  }

  const commitH = () => {
    const v = parseInt(hInput)
    if (!isNaN(v)) applyDims(w, v)
    else setHInput(String(h))
  }

  // Pre-mount: hide content to prevent full-viewport flash before frame applies
  if (!mounted) {
    return <div className="w-full h-full" style={{ visibility: 'hidden' }}>{children}</div>
  }

  // Mobile: render as-is
  if (!isDesktop) {
    return <div className="w-full h-full">{children}</div>
  }

  return (
    <>
      {/* Centered phone frame */}
      <div className="flex items-center justify-center h-full">
        <div
          style={{ width: w, height: h, '--frame-h': `${h - 2}px` } as React.CSSProperties}
          className="relative overflow-hidden rounded-[36px] border border-white/[0.08] shadow-[0_32px_96px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.04)] flex-shrink-0"
        >
          {children}
        </div>
      </div>

      {/* Resolution control — fixed bottom center */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/[0.07] rounded-full px-4 py-2 text-[11px] select-none">
        <span className="text-white/25 mr-1">해상도</span>

        <input
          type="number"
          value={wInput}
          onChange={e => setWInput(e.target.value)}
          onBlur={commitW}
          onKeyDown={e => e.key === 'Enter' && commitW()}
          className="w-12 bg-transparent text-center text-white/55 focus:outline-none focus:text-white/90 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-white/25">×</span>
        <input
          type="number"
          value={hInput}
          onChange={e => setHInput(e.target.value)}
          onBlur={commitH}
          onKeyDown={e => e.key === 'Enter' && commitH()}
          className="w-12 bg-transparent text-center text-white/55 focus:outline-none focus:text-white/90 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-white/25">px</span>

        {/* Preset buttons */}
        <span className="w-px h-4 bg-white/10 mx-1" />
        <button
          onClick={() => applyDims(390, 844)}
          className="text-white/30 hover:text-white/70 transition-colors px-1"
          title="iPhone 14"
        >
          iPhone
        </button>
        <button
          onClick={() => applyDims(360, 780)}
          className="text-white/30 hover:text-white/70 transition-colors px-1"
          title="Android"
        >
          Android
        </button>
      </div>
    </>
  )
}
