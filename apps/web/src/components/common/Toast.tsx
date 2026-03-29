'use client'

import { useToastStore } from '@/store/toastStore'
import { cn } from '@/lib/utils'

export function ToastContainer() {
  const toast = useToastStore((s) => s.toast)

  if (!toast) return null

  const styles = {
    success: 'bg-success text-white',
    error:   'bg-error text-white',
    info:    'bg-purple-900 text-white',
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div
        className={cn(
          'px-4 py-2.5 rounded-btn text-[11px] font-medium shadow-lg',
          'animate-in fade-in slide-in-from-top-2 duration-200',
          styles[toast.type]
        )}
      >
        {toast.message}
      </div>
    </div>
  )
}
