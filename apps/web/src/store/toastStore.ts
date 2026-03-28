import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastStoreState {
  toast: Toast | null
  showToast: (params: { type: ToastType; message: string }) => void
  hideToast: () => void
}

export const useToastStore = create<ToastStoreState>((set) => ({
  toast: null,

  showToast: ({ type, message }) => {
    const id = Math.random().toString(36).slice(2)
    set({ toast: { id, type, message } })

    // 2초 후 자동 사라짐
    setTimeout(() => {
      set((state) => (state.toast?.id === id ? { toast: null } : state))
    }, 2000)
  },

  hideToast: () => set({ toast: null }),
}))
