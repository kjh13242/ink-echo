import { create } from 'zustand'
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

export const useRoomStore = create<RoomState>((set) => ({
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
      participants: [...state.participants, participant],
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
}))
