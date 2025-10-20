import './globals.css'

import type { Metadata, Viewport } from 'next'

import { GoogleAnalytics } from '@next/third-parties/google'
import dynamic from 'next/dynamic'
import localFont from 'next/font/local'
import { ReactNode } from 'react'
import { Toaster } from 'sonner'

import LibraryModal from '@/components/card/LibraryModal'
import HiyobiPing from '@/components/HiyobiPing'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import {
  APPLICATION_NAME,
  CANONICAL_URL,
  DESCRIPTION,
  generateOpenGraphMetadata,
  SHORT_NAME,
  THEME_COLOR,
} from '@/constants'
import { AMPLITUDE_API_KEY, NEXT_PUBLIC_GA_ID } from '@/constants/env'

import QueryProvider from '../components/QueryProvider'

// NOTE: 사용하지 않을 수 있어서 dynamic import
const Amplitude = dynamic(() => import('@/lib/amplitude/Amplitude'))

const PretendardVariable = localFont({
  src: '../fonts/PretendardVariable.400-700.3713.woff2',
  display: 'swap',
  weight: '400 700',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'system-ui',
    'Roboto',
    'Helvetica Neue',
    'Segoe UI',
    'Apple SD Gothic Neo',
    'Noto Sans KR',
    'Malgun Gothic',
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'sans-serif',
  ],
})

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_URL),
  title: {
    default: APPLICATION_NAME,
    template: `%s - ${SHORT_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SHORT_NAME,
  keywords:
    '리토미, 망가, 만화, 웹툰, 동인지, 온라인 만화 뷰어, litomi, doujinshi, manga, comic, webtoon, artist cg, hentai',
  referrer: 'same-origin',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: CANONICAL_URL,
    languages: {
      ko: CANONICAL_URL,
      'x-default': CANONICAL_URL,
    },
  },
  ...generateOpenGraphMetadata(),
  verification: { google: 'E8dCRgQMvY3hE4oaZ-vsuhopmTS7qyQG-O5WIMdVenA' },
  other: {
    RATING: 'RTA-5042-1996-1400-1577-RTA',
    rating: 'adult',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: THEME_COLOR,
  colorScheme: 'dark',
}

type Props = {
  children: ReactNode
}

export default function RootLayout({ children }: Readonly<Props>) {
  return (
    <html className="h-full" lang="ko">
      <head>
        <meta content={SHORT_NAME} name="apple-mobile-web-app-title" />
      </head>
      <body className={`${PretendardVariable.className} antialiased h-full`}>
        <QueryProvider>
          {children}
          <LibraryModal />
        </QueryProvider>
        <ServiceWorkerRegistrar />
        <HiyobiPing />
        <Toaster duration={3000} position="top-center" richColors theme="dark" />
        {AMPLITUDE_API_KEY && <Amplitude apiKey={AMPLITUDE_API_KEY} />}
        {NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  )
}
