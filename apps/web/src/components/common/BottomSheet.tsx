'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  className,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  // 배경 스크롤 잠금
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      {/* 배경 dim */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* 시트 */}
      <div
        ref={sheetRef}
        className={cn(
          'relative z-10 bg-[var(--bg-sheet)] rounded-sheet rounded-b-none',
          'max-h-[90vh] overflow-y-auto scrollbar-hide',
          'animate-in slide-in-from-bottom duration-300',
          className
        )}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 bg-[var(--border-default)] rounded-full" />
        </div>
        {children}
      </div>
    </div>
  )
}
