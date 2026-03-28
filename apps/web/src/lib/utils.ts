import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind 클래스 병합 유틸
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 초 → mm:ss 포맷
export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// 방 이름 자동 생성 (클라이언트 fallback용)
export function generateRoomName(): string {
  const hour = new Date().getHours()

  const timeAdjectives =
    hour >= 0 && hour < 6
      ? ['달리는', '조용한', '깊어가는', '새벽을 달리는']
      : hour < 12
      ? ['맑은', '상쾌한', '기분 좋은', '활기찬']
      : hour < 18
      ? ['여유로운', '따뜻한', '햇살 가득한', '산뜻한']
      : ['감성적인', '차분한', '노을 지는', '편안한']

  const nouns = [
    '고래들의 방',
    '파도의 방',
    '별빛의 방',
    '구름의 방',
    '달빛의 방',
    '바람의 방',
    '하늘의 방',
    '노을의 방',
  ]

  const adj = timeAdjectives[Math.floor(Math.random() * timeAdjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj} ${noun}`
}

// 닉네임 자동 생성
export function generateNickname(): string {
  const adjectives = ['달리는', '조용한', '신나는', '멋진', '귀여운', '활발한']
  const nouns = ['고래', '돌고래', '상어', '오징어', '문어', '해파리']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj} ${noun}`
}

// 기본 분위기 태그 (시간대 기반 자동 선택)
export function getDefaultMoodTag(): string {
  const hour = new Date().getHours()
  if (hour >= 0 && hour < 6) return 'late_drive'
  if (hour < 12) return 'daytime'
  if (hour < 18) return 'energy'
  return 'emotional'
}

// 짧은 ID 생성 (낙관적 업데이트용 임시 ID)
export function tempId(prefix: string): string {
  return `${prefix}_temp_${Math.random().toString(36).slice(2, 8)}`
}
