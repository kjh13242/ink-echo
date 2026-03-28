'use client'

import { useState } from 'react'
import { BottomSheet } from '@/components/common/BottomSheet'
import { cn } from '@/lib/utils'
import type { RoomSettings, PermissionTarget } from '@/types'

interface RoomSettingsSheetProps {
  isOpen: boolean
  onClose: () => void
  settings: RoomSettings
  onSave: (settings: Partial<RoomSettings>) => Promise<void>
}

export function RoomSettingsSheet({
  isOpen,
  onClose,
  settings,
  onSave,
}: RoomSettingsSheetProps) {
  const [local, setLocal] = useState<RoomSettings>({ ...settings })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(local)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-4 pb-8">
        <h2 className="text-h2 text-[var(--text-primary)] mb-5">방 설정</h2>

        <div className="flex flex-col gap-4">
          {/* 재생 제어 */}
          <SettingRow
            label="재생 제어"
            description="재생/일시정지를 누가 할 수 있나요"
            value={local.playbackControl}
            options={[
              { value: 'all', label: '모두' },
              { value: 'host_only', label: '방장만' },
            ]}
            onChange={(v) => setLocal((s) => ({ ...s, playbackControl: v as PermissionTarget }))}
          />

          {/* 스킵 제어 */}
          <SettingRow
            label="스킵"
            description="다음 곡으로 넘기는 권한"
            value={local.skipControl}
            options={[
              { value: 'all', label: '모두' },
              { value: 'host_only', label: '방장만' },
              { value: 'vote', label: '투표' },
            ]}
            onChange={(v) => setLocal((s) => ({ ...s, skipControl: v as RoomSettings['skipControl'] }))}
          />

          {/* 큐 순서 변경 */}
          <SettingRow
            label="곡 순서 변경"
            description="플레이리스트 순서를 바꿀 수 있는 권한"
            value={local.queueReorder}
            options={[
              { value: 'all', label: '모두' },
              { value: 'host_only', label: '방장만' },
            ]}
            onChange={(v) => setLocal((s) => ({ ...s, queueReorder: v as PermissionTarget }))}
          />

          {/* 곡 추가 */}
          <SettingRow
            label="곡 추가"
            description="곡을 추가할 수 있는 권한"
            value={local.trackAdd}
            options={[
              { value: 'all', label: '모두' },
              { value: 'host_only', label: '방장만' },
            ]}
            onChange={(v) => setLocal((s) => ({ ...s, trackAdd: v as PermissionTarget }))}
          />

          {/* 투표 모드 */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-body1 text-[var(--text-primary)]">투표 모드</p>
              <p className="text-caption text-[var(--text-secondary)] mt-0.5">
                참여자 투표로 곡을 스킵할 수 있어요
              </p>
            </div>
            <button
              onClick={() => setLocal((s) => ({ ...s, voteMode: !s.voteMode }))}
              className={cn(
                'w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5',
                local.voteMode ? 'bg-purple-500' : 'bg-[var(--border-default)]'
              )}
            >
              <span
                className={cn(
                  'block w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5',
                  local.voteMode ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* 투표 임계값 */}
          {local.voteMode && (
            <div className="bg-[var(--bg-input)] rounded-btn p-3 flex flex-col gap-3">
              <div className="flex gap-2">
                {[
                  { value: 'ratio', label: '비율' },
                  { value: 'absolute', label: '인원 수' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setLocal((s) => ({
                        ...s,
                        voteThresholdType: opt.value as RoomSettings['voteThresholdType'],
                        voteThresholdValue: opt.value === 'ratio' ? 0.5 : 3,
                      }))
                    }
                    className={cn(
                      'flex-1 py-1.5 rounded-btn text-caption transition-colors',
                      local.voteThresholdType === opt.value
                        ? 'bg-purple-500 text-white'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {local.voteThresholdType === 'ratio' ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-caption text-[var(--text-secondary)]">
                    <span>스킵 기준</span>
                    <span className="text-purple-500 font-medium">
                      {Math.round(local.voteThresholdValue * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={local.voteThresholdValue}
                    onChange={(e) =>
                      setLocal((s) => ({ ...s, voteThresholdValue: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-micro text-[var(--text-placeholder)]">
                    <span>10%</span>
                    <span>100%</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-caption text-[var(--text-secondary)] flex-1">스킵 기준 인원</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setLocal((s) => ({
                          ...s,
                          voteThresholdValue: Math.max(1, s.voteThresholdValue - 1),
                        }))
                      }
                      className="w-7 h-7 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)]
                                 flex items-center justify-center active:opacity-60"
                    >
                      −
                    </button>
                    <span className="text-body1 text-purple-500 font-medium w-6 text-center">
                      {local.voteThresholdValue}
                    </span>
                    <button
                      onClick={() =>
                        setLocal((s) => ({ ...s, voteThresholdValue: s.voteThresholdValue + 1 }))
                      }
                      className="w-7 h-7 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)]
                                 flex items-center justify-center active:opacity-60"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-11 mt-6 rounded-btn bg-[var(--color-cta)] text-[var(--color-cta-text)]
                     text-body1 font-medium disabled:opacity-40 active:opacity-80 transition-opacity"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </BottomSheet>
  )
}

function SettingRow({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string
  description: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-body1 text-[var(--text-primary)]">{label}</p>
        <p className="text-caption text-[var(--text-secondary)] mt-0.5">{description}</p>
      </div>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 py-2 rounded-btn text-caption transition-colors',
              value === opt.value
                ? 'bg-purple-500 text-white'
                : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-default)]'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
