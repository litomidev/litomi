'use client'

import { captureException } from '@sentry/nextjs'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import useCooldown from '@/hook/useCooldown'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: Readonly<Props>) {
  const cooldown = useCooldown()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    captureException(error, {
      tags: { error_boundary: pathname },
      extra: { searchParams: Object.fromEntries(searchParams) },
    })
  }, [error, pathname, searchParams])

  return (
    <main className="flex flex-col justify-center items-center gap-6 text-center h-dvh">
      <h1 className="text-xl md:text-2xl">⚠️ 오류가 발생했어요</h1>
      <div className="grid gap-2">
        <span className="text-sm">{error.digest}</span>
        <p className="text-red-600">{error.message}</p>
      </div>
      <button
        className="bg-zinc-700 rounded-full min-w-50 hover:bg-zinc-600 active:bg-zinc-700 px-4 py-2 transition disabled:bg-zinc-600 disabled:text-zinc-400 disabled:pointer-events-none"
        disabled={cooldown > 0}
        onClick={reset}
      >
        다시 시도하기 {cooldown > 0 && `(${cooldown / 1000}초)`}
      </button>
    </main>
  )
}
