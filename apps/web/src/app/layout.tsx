import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { ToastContainer } from '@/components/common/Toast'

export const metadata: Metadata = {
  title: 'Ink & Echo',
  description: '함께 고르고, 반응하고, 기억하는 소셜 플레이리스트',
  openGraph: {
    title: 'Ink & Echo',
    description: '함께 고르고, 반응하고, 기억하는 소셜 플레이리스트',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* 카카오 SDK */}
        <script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.0/kakao.min.js"
          crossOrigin="anonymous"
          async
        />
      </head>
      <body className="bg-[#D8D4F0] min-h-screen">
        <Providers>
          {children}
          <ToastContainer />
        </Providers>
        {/* YouTube IFrame placeholder — 화면에 보이지 않음 */}
        <div id="yt-player" style={{ display: 'none' }} />
      </body>
    </html>
  )
}
