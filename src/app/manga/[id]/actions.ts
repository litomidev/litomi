'use server'

import { captureException } from '@sentry/nextjs'
import { sql } from 'drizzle-orm'
import { z } from 'zod/v4'

import { MAX_READING_HISTORY_PER_USER } from '@/constants/policy'
import { db } from '@/database/drizzle'
import { readingHistoryTable } from '@/database/schema'
import { badRequest, internalServerError, ok, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

type SessionDBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const saveReadingProgressSchema = z.object({
  mangaId: z.number().int().positive(),
  page: z.number().int().positive(),
})

export async function saveReadingProgress(mangaId: number, page: number) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = saveReadingProgressSchema.safeParse({ mangaId, page })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  try {
    await db.transaction(async (tx) => {
      await db
        .insert(readingHistoryTable)
        .values({
          userId,
          mangaId,
          lastPage: page,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [readingHistoryTable.userId, readingHistoryTable.mangaId],
          set: {
            lastPage: page,
            updatedAt: new Date(),
          },
        })

      await enforceHistoryLimit(tx, userId)
    })

    return ok(true)
  } catch (error) {
    captureException(error)
    return internalServerError('읽기 기록 저장 중 오류가 발생했어요')
  }
}

async function enforceHistoryLimit(tx: SessionDBTransaction, userId: number) {
  await tx.execute(sql`
    DELETE FROM ${readingHistoryTable}
    WHERE ${readingHistoryTable.userId} = ${userId}
      AND (manga_id, updated_at) NOT IN (
        SELECT ${readingHistoryTable.mangaId}, ${readingHistoryTable.updatedAt}
        FROM ${readingHistoryTable}
        WHERE ${readingHistoryTable.userId} = ${userId}
        ORDER BY ${readingHistoryTable.updatedAt} DESC, ${readingHistoryTable.mangaId} DESC
        LIMIT ${MAX_READING_HISTORY_PER_USER}
      )
  `)
}

const migrateReadingHistorySchema = z.object({
  localHistories: z
    .array(
      z.object({
        mangaId: z.number().int().positive(),
        lastPage: z.number().int().positive(),
        updatedAt: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(100),
})

export type ReadingHistoryItem = {
  mangaId: number
  lastPage: number
  updatedAt: Date
}

export async function migrateReadingHistory(data: ReadingHistoryItem[]) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = migrateReadingHistorySchema.safeParse({ localHistories: data })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { localHistories } = validation.data

  const values = localHistories.map((item) => ({
    userId,
    mangaId: item.mangaId,
    lastPage: item.lastPage,
    updatedAt: new Date(item.updatedAt),
  }))

  try {
    const result = await db.transaction(async (tx) => {
      const result = await tx
        .insert(readingHistoryTable)
        .values(values)
        .onConflictDoNothing()
        .returning({ mangaId: readingHistoryTable.mangaId })

      await enforceHistoryLimit(tx, userId)
      return result
    })

    return ok(result.length)
  } catch (error) {
    captureException(error)
    return internalServerError('읽기 기록 동기화 중 오류가 발생했어요')
  }
}
