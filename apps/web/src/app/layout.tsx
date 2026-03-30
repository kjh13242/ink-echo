import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { ToastContainer } from '@/components/common/Toast'
import { DesktopFrame } from '@/components/layout/DesktopFrame'

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
      </head>
      <body className="bg-[#080808] h-full desktop-bg">
        <DesktopFrame>
          <Providers>
            {children}
            <ToastContainer />
          </Providers>
        </DesktopFrame>
        {/* YouTube IFrame placeholder — 화면에 보이지 않음 */}
        <div id="yt-player" style={{ display: 'none' }} />
      </body>
    </html>
  )
}
