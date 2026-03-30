'use client'

import { useRouter } from 'next/navigation'
import { useToastStore } from '@/store/toastStore'

const FREE_FEATURES = [
  { text: '방 최대 10명', included: true },
  { text: '방 히스토리 7일 보관', included: true },
  { text: '기본 AI 추천', included: true },
  { text: '아바타 커스터마이징', included: false },
  { text: '히스토리 무제한 보관', included: false },
]

const PRO_FEATURES = [
  { text: '인원 무제한', bold: true },
  { text: '방 히스토리 무제한 보관', bold: true },
  { text: 'AI 고급 추천 — 소셜 신호 기반', boldPart: 'AI 고급 추천' },
  { text: '아바타 커스터마이징 — 헤어, 악세서리', boldPart: '아바타 커스터마이징' },
  { text: 'Free의 모든 기능 포함' },
]

const COMPARE_ROWS = [
  { label: '방 인원', free: '최대 10명', pro: '무제한' },
  { label: '히스토리', free: '7일', pro: '무제한' },
  { label: 'AI 추천', free: '기본', pro: '고급' },
  { label: '아바타', free: '4종 고정', pro: '커스터마이징' },
  { label: '에코 카드', free: '✓', pro: '✓' },
  { label: '플레이리스트 저장', free: '✓', pro: '✓' },
  { label: '방 규칙 설정', free: '✓', pro: '✓' },
]

function CheckIcon({ pro, no }: { pro?: boolean; no?: boolean }) {
  if (no) {
    return (
      <div style={{
        width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: 'rgba(180,176,220,0.2)',
        border: '0.5px solid rgba(180,176,220,0.3)',
      }} />
    )
  }
  return (
    <div style={{
      width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 1,
      background: pro ? 'var(--color-cta)' : 'var(--bg-input-focus)',
      border: `0.5px solid ${pro ? 'var(--color-cta)' : 'rgba(175,169,236,0.8)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
        <path d="M1.5 4L3.5 6L6.5 2" stroke={pro ? 'white' : 'var(--color-cta)'} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export default function PlanPage() {
  const router = useRouter()
  const showToast = useToastStore((s) => s.showToast)

  const handleProStart = () => {
    showToast({ type: 'info', message: '준비 중이에요 🚧' })
  }

  return (
    <div className="bg-[var(--bg-surface)] flex flex-col overflow-hidden" style={{ height: 'var(--frame-h, 100svh)' }}>
      {/* 상단 바 */}
      <div
        className="flex items-center gap-2 flex-shrink-0 sticky top-0 z-10"
        style={{
          padding: '12px 14px 10px',
          background: 'color-mix(in srgb, var(--bg-surface) 80%, transparent)',
          borderBottom: '0.5px solid var(--border-default)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center flex-shrink-0 active:opacity-50"
          style={{
            width: 26, height: 26, borderRadius: '50%',
            border: '0.5px solid rgba(160,156,200,0.5)',
            background: 'rgba(255,255,255,0.5)',
          }}
        >
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <path d="M7 1L3 5L7 9" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>플랜 선택</span>
      </div>

      {/* 스크롤 바디 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ padding: '16px 14px 24px' }}>

        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>✨</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3 }}>Ink & Echo Pro</div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            인원 제한 없이, 더 오래, 더 스마트하게<br />함께 듣는 경험을 만들어요
          </div>
        </div>

        {/* 플랜 카드들 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>

          {/* Free 카드 */}
          <div style={{
            borderRadius: 14, padding: 14,
            border: '0.5px solid rgba(180,176,220,0.5)',
            background: 'var(--bg-sheet)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 4 }}>Free</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
              ₩0 <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)' }}>/ 월</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-placeholder)', marginBottom: 10 }}>영원히 무료</div>
            <div style={{ height: '0.5px', background: 'rgba(200,196,240,0.4)', marginBottom: 10 }} />
            {FREE_FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                <CheckIcon no={!f.included} />
                <div style={{ fontSize: 10, color: f.included ? 'var(--text-primary)' : 'var(--text-placeholder)', lineHeight: 1.4 }}>
                  {f.text}
                </div>
              </div>
            ))}
          </div>

          {/* Pro 카드 */}
          <div style={{
            borderRadius: 14, padding: 14, position: 'relative', overflow: 'hidden',
            border: '0.5px solid var(--color-cta)',
            background: 'linear-gradient(135deg, var(--bg-input-focus) 0%, var(--bg-surface) 100%)',
          }}>
            {/* 추천 뱃지 */}
            <div style={{
              position: 'absolute', top: 10, right: 10,
              background: 'var(--color-cta)', color: 'var(--color-cta-text)',
              fontSize: 8, fontWeight: 500, padding: '2px 7px', borderRadius: 10,
            }}>추천</div>

            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-cta)', marginBottom: 4 }}>Pro</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
              ₩4,900 <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)' }}>/ 월</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-placeholder)', marginBottom: 10 }}>방장 1인 기준 · 언제든 해지 가능</div>
            <div style={{ height: '0.5px', background: 'rgba(200,196,240,0.4)', marginBottom: 10 }} />
            {PRO_FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                <CheckIcon pro />
                <div style={{ fontSize: 10, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {f.boldPart ? (
                    <><strong>{f.boldPart}</strong>{f.text.slice(f.boldPart.length)}</>
                  ) : f.bold ? (
                    <strong>{f.text}</strong>
                  ) : f.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pro CTA */}
        <button
          onClick={handleProStart}
          className="w-full flex items-center justify-center gap-[5px] active:opacity-75"
          style={{
            height: 42, borderRadius: 12,
            background: 'var(--color-cta)', color: 'var(--color-cta-text)',
            fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7 1l1.5 4h4L9 8l1.5 4L7 10l-3.5 2L5 8 1.5 5h4z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
          </svg>
          Pro 시작하기 — 월 ₩4,900
        </button>

        <button
          onClick={() => router.back()}
          className="w-full flex items-center justify-center active:opacity-75"
          style={{
            height: 38, borderRadius: 10, marginTop: 8,
            border: '0.5px solid rgba(180,176,220,0.6)',
            background: 'transparent',
            fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'inherit',
          }}
        >
          무료로 계속 사용
        </button>

        <div style={{ fontSize: 9, color: 'var(--text-placeholder)', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
          구독은 언제든지 해지할 수 있어요<br />방장에게만 적용되며 참여자는 무료
        </div>

        {/* 상세 비교 */}
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 20, marginBottom: 8, letterSpacing: '0.03em' }}>
          상세 비교
        </div>
        <div style={{
          borderRadius: 12, border: '0.5px solid rgba(180,176,220,0.4)',
          overflow: 'hidden', marginBottom: 14,
        }}>
          {/* 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'var(--bg-input-focus)' }}>
            {['기능', 'Free', 'Pro'].map((h, i) => (
              <div key={h} style={{
                padding: '7px 6px',
                fontSize: 9, fontWeight: 500,
                color: i === 2 ? '#3C3489' : 'var(--color-cta)',
                textAlign: i === 0 ? 'left' : 'center',
                paddingLeft: i === 0 ? 10 : 6,
              }}>
                {h}
              </div>
            ))}
          </div>
          {COMPARE_ROWS.map((row, i) => (
            <div key={row.label} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              borderTop: '0.5px solid rgba(200,196,240,0.3)',
              background: i % 2 === 1 ? 'rgba(244,242,255,0.4)' : 'transparent',
            }}>
              <div style={{ padding: '7px 6px 7px 10px', fontSize: 9, color: 'var(--text-primary)' }}>{row.label}</div>
              <div style={{ padding: '7px 6px', fontSize: 9, color: 'var(--text-secondary)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{row.free}</div>
              <div style={{ padding: '7px 6px', fontSize: 9, color: 'var(--color-cta)', fontWeight: 500, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{row.pro}</div>
            </div>
          ))}
        </div>

        {/* 방장 혜택 안내 */}
        <div style={{
          background: 'var(--bg-input-focus)', borderRadius: 12, padding: 12, marginBottom: 14,
          border: '0.5px solid rgba(175,169,236,0.4)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>👑 방장만 구독하면 돼요</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            참여자들은 무료로 입장하고 모든 기능을 쓸 수 있어요. 방장의 Pro 구독이 방 전체에 적용돼요.
          </div>
        </div>

        {/* 두 번째 CTA */}
        <button
          onClick={handleProStart}
          className="w-full flex items-center justify-center gap-[5px] active:opacity-75"
          style={{
            height: 42, borderRadius: 12,
            background: 'var(--color-cta)', color: 'var(--color-cta-text)',
            fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7 1l1.5 4h4L9 8l1.5 4L7 10l-3.5 2L5 8 1.5 5h4z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
          </svg>
          Pro 시작하기 — 월 ₩4,900
        </button>
        <div style={{ fontSize: 9, color: 'var(--text-placeholder)', textAlign: 'center', marginTop: 8 }}>
          구독은 언제든지 해지할 수 있어요
        </div>
      </div>
    </div>
  )
}
