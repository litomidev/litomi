import { z } from 'zod/v4'

import { MAX_SEARCH_QUERY_LENGTH } from '@/constants/policy'
import { ViewCookie } from '@/utils/param'

export enum Sort {
  RANDOM = 'random',
  ID_ASC = 'id_asc',
  POPULAR = 'popular',
}

export const GETProxyKSearchSchema = z
  .object({
    query: z.string().trim().max(MAX_SEARCH_QUERY_LENGTH).optional(),
    view: z.enum(ViewCookie).default(ViewCookie.CARD),
    sort: z.enum(Sort).optional(),
    'min-rating': z.coerce.number().int().min(0).max(500).optional(),
    'max-rating': z.coerce.number().int().min(0).max(500).optional(),
    'min-view': z.coerce.number().int().min(0).optional(),
    'max-view': z.coerce.number().int().min(0).optional(),
    'min-page': z.coerce.number().int().positive().max(10000).optional(),
    'max-page': z.coerce.number().int().positive().max(10000).optional(),
    from: z.coerce.number().int().min(0).optional(),
    to: z.coerce.number().int().min(0).optional(),
    'next-id': z.coerce.number().int().positive().optional(),
    'next-views': z.coerce.number().int().min(0).optional(),
    'next-views-id': z.coerce.number().int().positive().optional(),
    skip: z.coerce.number().int().min(0).max(10000).optional(),
  })
  .refine(
    (data) => {
      if (data['min-view'] && data['max-view'] && data['min-view'] > data['max-view']) {
        return false
      }
      if (data['min-page'] && data['max-page'] && data['min-page'] > data['max-page']) {
        return false
      }
      if (data.from && data.to && data.from > data.to) {
        return false
      }
      if (data['min-rating'] && data['max-rating'] && data['min-rating'] > data['max-rating']) {
        return false
      }
      return true
    },
    { error: '최소값은 최대값보다 클 수 없어요' },
  )

export type GETProxyKSearchRequest = z.infer<typeof GETProxyKSearchSchema>
