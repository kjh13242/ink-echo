import type { ApiResponse } from '@/types'

// 브라우저 환경에서 NEXT_PUBLIC_API_URL 없으면 상대경로 사용 (next.config rewrite 경유)
// 서버 환경(SSR)에서는 localhost:4000 직접 연결
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== 'undefined' ? '' : 'http://localhost:4000')

// session_token을 로컬스토리지에서 가져옴
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('session_token')
}

export function setToken(token: string) {
  localStorage.setItem('session_token', token)
}

export function clearToken() {
  localStorage.removeItem('session_token')
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options

  // 쿼리스트링 처리
  const rawUrl = `${BASE_URL}${path}`
  const url = BASE_URL
    ? new URL(rawUrl)
    : new URL(rawUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      url.searchParams.set(k, String(v))
    })
  }

  const token = getToken()
  const hasBody = fetchOptions.body !== undefined
  const headers: Record<string, string> = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(fetchOptions.headers as Record<string, string> ?? {}),
  }

  const res = await fetch(url.toString(), {
    ...fetchOptions,
    headers,
  })

  const json: ApiResponse<T> = await res.json()

  if (!json.success) {
    throw new ApiError(
      json.error?.code ?? 'UNKNOWN_ERROR',
      json.error?.message ?? '알 수 없는 오류가 발생했어요',
      res.status
    )
  }

  return json.data as T
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// HTTP 메서드 헬퍼
export const api = {
  get: <T>(path: string, params?: RequestOptions['params']) =>
    request<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
}
