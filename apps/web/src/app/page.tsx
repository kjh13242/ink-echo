import Link from 'next/link'
import { Button } from '@/components/common/Button'

export default function LandingPage() {
  return (
    <main className="dot-grid min-h-screen flex flex-col items-center justify-center px-5">
      {/* 로고 */}
      <div className="mb-12 text-center">
        <h1 className="text-[28px] font-semibold text-purple-900 font-[Arial] tracking-tight mb-1">
          Ink & Echo
        </h1>
        <p className="text-[12px] text-purple-500">
          함께 고르고, 반응하고, 기억하는 플레이리스트
        </p>
      </div>

      {/* 픽셀 캐릭터들 */}
      <div className="flex gap-4 mb-12">
        {(['purple', 'green', 'yellow', 'pink'] as const).map((color, i) => (
          <PixelAvatar key={color} color={color} delay={i * 0.1} />
        ))}
      </div>

      {/* CTA */}
      <div className="w-full max-w-[280px] flex flex-col gap-3">
        <Link href="/create" className="w-full">
          <Button variant="primary" size="lg" fullWidth>
            방 만들기
          </Button>
        </Link>
        <Link href="/join" className="w-full">
          <Button variant="secondary" size="lg" fullWidth>
            코드로 입장하기
          </Button>
        </Link>
      </div>
    </main>
  )
}

function PixelAvatar({
  color,
  delay,
}: {
  color: 'purple' | 'green' | 'yellow' | 'pink'
  delay: number
}) {
  const COLORS = {
    purple: { body: '#FFD4A8', shirt: '#7F77DD' },
    green:  { body: '#C8E8D0', shirt: '#1D9E75' },
    yellow: { body: '#FFE4B0', shirt: '#F0A030' },
    pink:   { body: '#F4D8F4', shirt: '#D4537E' },
  }
  const c = COLORS[color]

  return (
    <div
      className="animate-bounce"
      style={{ animationDelay: `${delay}s`, animationDuration: '1.4s' }}
    >
      <svg
        viewBox="0 0 16 16"
        width={40}
        height={40}
        xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: 'pixelated' }}
        className="rounded-full"
      >
        <rect width="16" height="16" fill={c.shirt} opacity="0.3" />
        <rect x="3" y="3" width="10" height="6" rx="1" fill={c.body} />
        <rect x="5" y="5" width="2" height="2" fill="#1A1A2E" />
        <rect x="9" y="5" width="2" height="2" fill="#1A1A2E" />
        <rect x="6" y="7" width="1" height="1" fill="#1A1A2E" />
        <rect x="9" y="7" width="1" height="1" fill="#1A1A2E" />
        <rect x="2" y="10" width="12" height="4" rx="1" fill={c.shirt} />
        <rect x="6" y="9" width="4" height="2" fill={c.body} />
      </svg>
    </div>
  )
}
