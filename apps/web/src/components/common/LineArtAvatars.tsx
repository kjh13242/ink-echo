'use client'

export type LineArtId = 'la1' | 'la2' | 'la3' | 'la4' | 'la5' | 'la6' | 'la7' | 'la8'
export const LINE_ART_IDS: LineArtId[] = ['la1', 'la2', 'la3', 'la4', 'la5', 'la6', 'la7', 'la8']

export function pickRandomAvatarId(): LineArtId {
  return LINE_ART_IDS[Math.floor(Math.random() * LINE_ART_IDS.length)]
}

// 공통 stroke 속성
const sw = 1.8
const cap = 'round' as const
const join = 'round' as const

// ──────────────────────────────────────────────────────────────
// 8개 캐릭터 — viewBox "0 0 80 80", 정면+살짝 각도 구도
// 머리+상반신 중심, 흑백 라인아트
// ──────────────────────────────────────────────────────────────

function La1() {
  // 긴 웨이브 밝은 머리 + 코트 칼라
  return (
    <g>
      {/* 웨이브 머리카락 — 아웃라인만 (밝은 색) */}
      <path d="M24 23 C24 10 31 4 40 4 C49 4 56 10 56 23" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap} strokeLinejoin={join}/>
      <path d="M24 23 C22 34 22 50 24 66" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      <path d="M56 23 C58 34 58 52 56 68" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      {/* 웨이브 결 */}
      <path d="M24 30 C27 35 31 30 35 35 C39 40 43 35 47 30 C51 25 54 26 56 26" fill="none" stroke="#111" strokeWidth={1} strokeLinecap={cap}/>
      <path d="M23 44 C26 49 30 44 34 49 C38 54 42 49 46 44" fill="none" stroke="#111" strokeWidth={1} strokeLinecap={cap}/>
      {/* 머리 */}
      <ellipse cx="40" cy="26" rx="16" ry="18" fill="white" stroke="#111" strokeWidth={sw}/>
      {/* 눈 */}
      <circle cx="33" cy="24" r={1.5} fill="#111"/>
      <circle cx="46" cy="23" r={1.2} fill="#111"/>
      {/* 목 */}
      <line x1="40" y1="44" x2="40" y2="56" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      {/* 코트 칼라 — 넓게 열린 형태 */}
      <path d="M40 56 C36 53 30 52 22 58" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap} strokeLinejoin={join}/>
      <path d="M40 56 C44 53 50 52 58 58" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap} strokeLinejoin={join}/>
      <path d="M22 58 L18 80 M58 58 L62 80 M18 80 L62 80" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
    </g>
  )
}

function La2() {
  // 짧은 다크 단발 + 터틀넥
  return (
    <g>
      {/* 단발 머리 — 다크 필 (머리보다 먼저) */}
      <path d="M24 23 C24 10 31 4 40 4 C49 4 56 10 56 23 C56 37 52 47 47 51 C43 54 37 51 34 47 C30 43 24 34 24 23 Z" fill="#111"/>
      {/* 머리 (흰 배경) — 얼굴 영역 복원 */}
      <ellipse cx="40" cy="26" rx="16" ry="18" fill="white" stroke="#111" strokeWidth={sw}/>
      {/* 머리 윗부분 다크로 덮기 */}
      <path d="M24 23 C24 10 31 4 40 4 C49 4 56 10 56 23 C56 17 52 11 40 11 C28 11 24 17 24 23 Z" fill="#111"/>
      {/* 눈 */}
      <circle cx="33" cy="25" r={1.5} fill="#111"/>
      <circle cx="46" cy="24" r={1.2} fill="#111"/>
      {/* 터틀넥 — 다크 */}
      <rect x="30" y="44" width="20" height="16" rx="4" fill="#111"/>
      {/* 어깨 */}
      <path d="M20 62 C20 58 30 56 40 56 C50 56 60 58 60 62 L62 80 L18 80 Z" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap} strokeLinejoin={join}/>
    </g>
  )
}

function La3() {
  // 다크 포니테일 + 심플 탑
  return (
    <g>
      {/* 머리 */}
      <ellipse cx="40" cy="26" rx="16" ry="18" fill="white" stroke="#111" strokeWidth={sw}/>
      {/* 다크 크라운 */}
      <path d="M24 23 C24 10 31 4 40 4 C49 4 56 10 56 23 C56 17 51 12 40 12 C29 12 24 17 24 23 Z" fill="#111"/>
      {/* 포니테일 */}
      <path d="M56 20 C62 16 68 18 67 27 C66 34 62 42 58 52" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      <path d="M56 18 C61 13 66 14 66 20" fill="none" stroke="#111" strokeWidth={1.3} strokeLinecap={cap}/>
      {/* 머리끈 */}
      <circle cx="56" cy="22" r={2.5} fill="#111"/>
      {/* 눈 */}
      <circle cx="33" cy="25" r={1.5} fill="#111"/>
      <circle cx="46" cy="24" r={1.2} fill="#111"/>
      {/* 목 */}
      <line x1="40" y1="44" x2="40" y2="56" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      {/* 셔츠 칼라 */}
      <path d="M30 58 C30 54 35 52 40 52 C45 52 50 54 50 58" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      {/* 상체 */}
      <path d="M22 64 C22 60 32 58 40 58 C48 58 58 60 58 64 L60 80 L20 80 Z" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap} strokeLinejoin={join}/>
    </g>
  )
}

function La4() {
  // 긴 다크 스트레이트 머리 — 양 옆으로 흘러내림
  return (
    <g>
      {/* 양옆 긴 머리 패널 — 먼저 그려서 머리 뒤에 */}
      <path d="M26 22 L20 80 L30 80 L32 42 Z" fill="#111"/>
      <path d="M54 22 L52 42 L54 80 L64 80 Z" fill="#111"/>
      {/* 머리 윗부분 아크 */}
      <path d="M26 22 C26 10 32 4 40 4 C48 4 54 10 54 22" fill="#111"/>
      {/* 머리 — 흰 배경으로 얼굴 영역 보임 */}
      <ellipse cx="40" cy="26" rx="16" ry="18" fill="white" stroke="#111" strokeWidth={sw}/>
      {/* 눈 */}
      <circle cx="33" cy="24" r={1.5} fill="#111"/>
      <circle cx="46" cy="23" r={1.2} fill="#111"/>
      {/* 목 */}
      <line x1="40" y1="44" x2="40" y2="58" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      {/* 심플 탑 */}
      <path d="M28 62 C28 58 34 56 40 56 C46 56 52 58 52 62 L52 80 L28 80 Z" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap} strokeLinejoin={join}/>
    </g>
  )
}

function La5() {
  // 짧은 다크 머리 + 오버사이즈 후드
  return (
    <g>
      {/* 머리 */}
      <ellipse cx="40" cy="26" rx="16" ry="18" fill="white" stroke="#111" strokeWidth={sw}/>
      {/* 짧은 다크 머리 — 윗부분만 */}
      <path d="M24 23 C24 10 31 4 40 4 C49 4 56 10 56 23 C56 15 51 9 40 9 C29 9 24 15 24 23 Z" fill="#111"/>
      {/* 눈 */}
      <circle cx="33" cy="25" r={1.5} fill="#111"/>
      <circle cx="46" cy="24" r={1.2} fill="#111"/>
      {/* 목 */}
      <line x1="40" y1="44" x2="40" y2="56" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      {/* 오버사이즈 후드 */}
      <path d="M14 62 C14 56 27 53 40 53 C53 53 66 56 66 62 L66 80 L14 80 Z" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap} strokeLinejoin={join}/>
      {/* 후드 디테일 */}
      <path d="M14 62 C19 57 27 56 35 58" fill="none" stroke="#111" strokeWidth={1.2} strokeLinecap={cap}/>
      <path d="M66 62 C61 57 53 56 45 58" fill="none" stroke="#111" strokeWidth={1.2} strokeLinecap={cap}/>
      {/* 캥거루 포켓 */}
      <path d="M30 71 L50 71" stroke="#111" strokeWidth={1.3} strokeLinecap={cap}/>
    </g>
  )
}

function La6() {
  // 턱선 다크 단발 (la2보다 길게) + 루즈 칼라
  return (
    <g>
      {/* 중간 길이 단발 — 다크 */}
      <path d="M24 23 C24 10 31 4 40 4 C49 4 56 10 56 23 C56 40 52 54 47 58 C43 61 37 58 34 54 C30 49 24 37 24 23 Z" fill="#111"/>
      {/* 머리 위에 그려 얼굴 영역 보임 */}
      <ellipse cx="40" cy="26" rx="16" ry="18" fill="white" stroke="#111" strokeWidth={sw}/>
      {/* 눈 */}
      <circle cx="33" cy="25" r={1.5} fill="#111"/>
      <circle cx="46" cy="24" r={1.2} fill="#111"/>
      {/* 목 */}
      <line x1="40" y1="44" x2="40" y2="58" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      {/* 루즈 칼라 */}
      <path d="M40 58 C36 55 30 53 24 58 C20 62 18 70 18 78" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap} strokeLinejoin={join}/>
      <path d="M40 58 C44 55 50 53 56 58 C60 62 62 70 62 78" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap} strokeLinejoin={join}/>
      <path d="M18 78 L18 80 M62 78 L62 80 M14 80 L66 80" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
    </g>
  )
}

function La7() {
  // 웨이브 밝은 머리 (la1과 다른 패턴) + V넥
  return (
    <g>
      {/* 긴 웨이브 머리 — 아웃라인, 다른 방향 웨이브 */}
      <path d="M24 23 C24 10 31 4 40 4 C49 4 56 10 56 23" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      <path d="M24 23 C22 36 22 54 24 72" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      <path d="M56 23 C58 36 58 56 56 74" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      {/* 웨이브 — 가로형 곡선 */}
      <path d="M24 32 C28 36 32 32 36 36" fill="none" stroke="#111" strokeWidth={0.9} strokeLinecap={cap}/>
      <path d="M44 28 C48 32 52 28 56 26" fill="none" stroke="#111" strokeWidth={0.9} strokeLinecap={cap}/>
      <path d="M23 48 C27 52 31 48 35 52" fill="none" stroke="#111" strokeWidth={0.9} strokeLinecap={cap}/>
      <path d="M45 44 C49 48 53 44 57 46" fill="none" stroke="#111" strokeWidth={0.9} strokeLinecap={cap}/>
      {/* 머리 */}
      <ellipse cx="40" cy="26" rx="16" ry="18" fill="white" stroke="#111" strokeWidth={sw}/>
      {/* 눈 */}
      <circle cx="33" cy="24" r={1.5} fill="#111"/>
      <circle cx="46" cy="23" r={1.2} fill="#111"/>
      {/* 목 */}
      <line x1="40" y1="44" x2="40" y2="56" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      {/* V넥 */}
      <path d="M40 58 C38 62 34 66 28 70" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      <path d="M40 58 C42 62 46 66 52 70" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      <path d="M22 70 L22 80 L58 80 L58 70" stroke="#111" strokeWidth={sw} strokeLinecap={cap} strokeLinejoin={join}/>
    </g>
  )
}

function La8() {
  // 짧은 머리 (텍스처) + 귀 보임 + 크루넥
  return (
    <g>
      {/* 머리 */}
      <ellipse cx="40" cy="26" rx="16" ry="18" fill="white" stroke="#111" strokeWidth={sw}/>
      {/* 짧은 머리 — 아주 얇은 캡 */}
      <path d="M24 23 C24 10 31 4 40 4 C49 4 56 10 56 23 C56 16 51 10 40 10 C29 10 24 16 24 23 Z" fill="#111"/>
      {/* 머리카락 텍스처 스트로크 */}
      <path d="M27 21 C30 19 33 20 35 19" fill="none" stroke="#111" strokeWidth={1.1} strokeLinecap={cap}/>
      <path d="M46 16 C49 15 52 16 54 15" fill="none" stroke="#111" strokeWidth={1.1} strokeLinecap={cap}/>
      <path d="M36 13 C39 11 43 12 45 11" fill="none" stroke="#111" strokeWidth={1.1} strokeLinecap={cap}/>
      {/* 귀 — 오른쪽에 살짝 보임 */}
      <path d="M56 27 C60 27 61 31 59 34 C58 36 56 35 56 33" fill="none" stroke="#111" strokeWidth={1.6} strokeLinecap={cap}/>
      {/* 눈 */}
      <circle cx="33" cy="25" r={1.5} fill="#111"/>
      <circle cx="46" cy="24" r={1.2} fill="#111"/>
      {/* 목 */}
      <line x1="40" y1="44" x2="40" y2="56" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      {/* 크루넥 */}
      <path d="M32 56 C32 52 36 50 40 50 C44 50 48 52 48 56" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap}/>
      <path d="M20 64 C20 60 30 58 40 58 C50 58 60 60 60 64 L60 80 L20 80 Z" fill="none" stroke="#111" strokeWidth={sw} strokeLinecap={cap} strokeLinejoin={join}/>
    </g>
  )
}

const DEFS: Record<LineArtId, () => JSX.Element> = {
  la1: La1, la2: La2, la3: La3, la4: La4,
  la5: La5, la6: La6, la7: La7, la8: La8,
}

interface LineArtAvatarProps {
  id: LineArtId
  size?: number
  className?: string
}

export function LineArtAvatar({ id, size = 40, className }: LineArtAvatarProps) {
  const Def = DEFS[id]
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      <rect width="80" height="80" fill="white"/>
      <Def/>
    </svg>
  )
}
