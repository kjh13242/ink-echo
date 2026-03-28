# Ink & Echo

유튜브 기반 실시간 소셜 플레이리스트 서비스.

## 기술 스택

| 레이어 | 도구 |
|---|---|
| 프론트 | Next.js 14 + TypeScript |
| 상태 관리 | Zustand (실시간) + TanStack Query (서버) |
| 백엔드 | Fastify + TypeScript |
| 실시간 | WebSocket (ws) |
| DB | PostgreSQL + Redis |
| 스타일 | Tailwind CSS |

## 로컬 실행

### 사전 준비

- Node.js 18+
- pnpm 9+
- PostgreSQL 15+
- Redis 7+

### 1. 설치

```bash
git clone https://github.com/your-org/ink-echo
cd ink-echo
pnpm install
```

### 2. 환경 변수 설정

```bash
# 프론트
cp apps/web/.env.example apps/web/.env.local

# 백엔드
cp apps/api/.env.example apps/api/.env
```

`.env` 파일에서 다음 값을 채워주세요:
- `YOUTUBE_API_KEY` — [Google Cloud Console](https://console.cloud.google.com)
- `NEXT_PUBLIC_KAKAO_JS_KEY` — [Kakao Developers](https://developers.kakao.com)
- `DATABASE_URL` — PostgreSQL 연결 URL
- `JWT_SECRET` — 임의의 긴 문자열

### 3. DB 마이그레이션

```bash
pnpm --filter api db:migrate
```

### 4. 개발 서버 실행

```bash
# 프론트 + 백엔드 동시 실행
pnpm dev

# 개별 실행
pnpm dev:web   # http://localhost:3000
pnpm dev:api   # http://localhost:4000
```

## 프로젝트 구조

```
ink-echo/
├── apps/
│   ├── web/                  # Next.js 프론트
│   │   └── src/
│   │       ├── app/          # 페이지 (App Router)
│   │       ├── components/   # UI 컴포넌트
│   │       ├── hooks/        # 커스텀 훅
│   │       ├── store/        # Zustand 스토어
│   │       ├── types/        # TypeScript 타입
│   │       └── lib/          # 유틸리티
│   └── api/                  # Fastify 백엔드
│       └── src/
│           ├── routes/       # REST API 라우트
│           ├── websocket/    # WS 핸들러 + 브로드캐스터
│           ├── db/           # PostgreSQL + Redis
│           └── lib/          # 유틸리티
└── package.json              # pnpm 모노레포
```

## 주요 페이지

| URL | 설명 |
|---|---|
| `/` | 랜딩 |
| `/create` | 방 생성 |
| `/join` | 코드로 입장 |
| `/join/[code]` | 링크로 입장 |
| `/room/[roomId]` | 메인 룸 |
| `/room/[roomId]/add` | 곡 추가 |
| `/echo/[echoId]` | 에코 카드 |

## API 주요 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/rooms` | 방 생성 |
| GET | `/api/rooms/:code` | 방 조회 |
| POST | `/api/rooms/:id/join` | 방 입장 |
| POST | `/api/rooms/:id/queue` | 곡 추가 |
| GET | `/api/search/tracks` | 유튜브 검색 |
| WS | `/ws` | WebSocket 연결 |
