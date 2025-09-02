import { desc, eq } from 'drizzle-orm'
import { Metadata } from 'next'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { READING_HISTORY_PER_PAGE } from '@/constants/policy'
import { db } from '@/database/drizzle'
import { readingHistoryTable } from '@/database/schema'
import { getUserIdFromCookie } from '@/utils/session'

import HistoryPageClient from './HistoryPageClient'
import NotFound from './NotFound'
import Unauthorized from './Unauthorized'

export const metadata: Metadata = {
  title: `감상 기록 - ${SHORT_NAME}`,
  openGraph: {
    ...defaultOpenGraph,
    title: `감상 기록 - ${SHORT_NAME}`,
    url: '/library/history',
  },
  alternates: {
    canonical: '/library/history',
    languages: { ko: '/library/history' },
  },
}

export default async function HistoryPage() {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return <Unauthorized />
  }

  const history = await db
    .select({
      mangaId: readingHistoryTable.mangaId,
      lastPage: readingHistoryTable.lastPage,
      updatedAt: readingHistoryTable.updatedAt,
    })
    .from(readingHistoryTable)
    .where(eq(readingHistoryTable.userId, Number(userId)))
    .orderBy(desc(readingHistoryTable.updatedAt), desc(readingHistoryTable.mangaId))
    .limit(READING_HISTORY_PER_PAGE + 1)

  if (history.length === 0) {
    return <NotFound />
  }

  const hasNextPage = history.length > READING_HISTORY_PER_PAGE

  if (hasNextPage) {
    history.pop()
  }

  const initialHistory = history.map((h) => ({
    mangaId: h.mangaId,
    lastPage: h.lastPage,
    updatedAt: h.updatedAt.getTime(),
  }))

  const initialData = {
    items: initialHistory,
    nextCursor: hasNextPage ? initialHistory[initialHistory.length - 1] : null,
  }

  return (
    <main className="flex-1 flex flex-col">
      <h1 className="sr-only">감상 기록</h1>
      <HistoryPageClient initialData={initialData} />
    </main>
  )
}
