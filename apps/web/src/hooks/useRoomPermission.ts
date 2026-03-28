'use client'

import { useRoomStore } from '@/store/roomStore'

export function useRoomPermission() {
  const session = useRoomStore((s) => s.session)
  const settings = useRoomStore((s) => s.room?.settings)

  const isHost = session?.isHost ?? false

  const canPlay =
    isHost || settings?.playbackControl === 'all'

  const canSkip =
    isHost ||
    settings?.skipControl === 'all' ||
    settings?.skipControl === 'vote'

  const canReorder =
    isHost || settings?.queueReorder === 'all'

  const canAddTrack =
    isHost || settings?.trackAdd === 'all'

  // 방 설정 변경, 종료 등 방장 전용
  const canManageRoom = isHost

  return {
    isHost,
    canPlay,
    canSkip,
    canReorder,
    canAddTrack,
    canManageRoom,
  }
}
