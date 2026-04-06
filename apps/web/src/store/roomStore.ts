import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Room, Participant, Session, RoomSettings } from '@/types'

interface RoomState {
  room: Room | null
  participants: Participant[]
  session: Session | null

  // 액션
  setRoom: (room: Room) => void
  updateSettings: (settings: RoomSettings) => void
  setParticipants: (participants: Participant[]) => void
  addParticipant: (participant: Participant) => void
  removeParticipant: (participantId: string) => void
  transferHost: (newHostId: string) => void
  setSession: (session: Session) => void
  clearRoom: () => void
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
  room: null,
  participants: [],
  session: null,

  setRoom: (room) => set({ room }),

  updateSettings: (settings) =>
    set((state) => ({
      room: state.room ? { ...state.room, settings } : null,
    })),

  setParticipants: (participants) => set({ participants }),

  addParticipant: (participant) =>
    set((state) => ({
      // 이미 존재하면 정보 업데이트, 없으면 추가
      participants: state.participants.some((p) => p.participantId === participant.participantId)
        ? state.participants.map((p) => p.participantId === participant.participantId ? participant : p)
        : [...state.participants, participant],
    })),

  removeParticipant: (participantId) =>
    set((state) => ({
      participants: state.participants.filter(
        (p) => p.participantId !== participantId
      ),
    })),

  transferHost: (newHostId) =>
    set((state) => ({
      participants: state.participants.map((p) => ({
        ...p,
        isHost: p.participantId === newHostId,
      })),
      session: state.session
        ? { ...state.session, isHost: state.session.participantId === newHostId }
        : null,
    })),

  setSession: (session) => set({ session }),

  clearRoom: () => set({ room: null, participants: [], session: null }),
    }),
    {
      name: 'room-session',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : localStorage
      ),
      partialize: (state) => ({
        room: state.room,
        session: state.session,
        participants: state.participants,
      }),
    }
  )
)
