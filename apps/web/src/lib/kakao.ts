declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void
      isInitialized: () => boolean
      Share: {
        sendDefault: (params: unknown) => void
      }
    }
  }
}

let initialized = false

export function initKakao() {
  if (initialized || typeof window === 'undefined') return

  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
  if (!key) {
    console.warn('[Kakao] JS Key가 설정되지 않았어요')
    return
  }

  // SDK가 로드되어 있는지 확인
  if (!window.Kakao) {
    console.warn('[Kakao] SDK가 로드되지 않았어요')
    return
  }

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(key)
  }

  initialized = true
}

interface KakaoShareParams {
  roomName: string
  participantCount: number
  inviteUrl: string
}

export function shareKakao({ roomName, participantCount, inviteUrl }: KakaoShareParams) {
  if (!window?.Kakao?.Share) {
    // SDK 미로드 시 링크 복사 fallback
    navigator.clipboard.writeText(inviteUrl)
    return
  }

  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: `🐋 ${roomName}`,
      description: `${participantCount}명이 함께 듣고 있어요. 같이 들을래요?`,
      imageUrl: 'https://cdn.inkecho.kr/og-image.png',
      link: {
        mobileWebUrl: inviteUrl,
        webUrl: inviteUrl,
      },
    },
    buttons: [
      {
        title: '방에 입장하기',
        link: {
          mobileWebUrl: inviteUrl,
          webUrl: inviteUrl,
        },
      },
    ],
  })
}
