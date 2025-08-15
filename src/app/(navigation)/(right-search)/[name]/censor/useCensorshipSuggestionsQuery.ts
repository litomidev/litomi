'use client'

import { useQuery } from '@tanstack/react-query'

import type { GETSearchSuggestionsResponse } from '@/app/api/search/suggestions/schema'

import { MIN_SUGGESTION_QUERY_LENGTH } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import useLocaleFromCookie from '@/hook/useLocaleFromCookie'
import { handleResponseError } from '@/utils/react-query-error'

type Props = {
  query: string
}

export async function fetchCensorshipSuggestions(query: string, locale: string) {
  const params = new URLSearchParams({ query, locale })
  const response = await fetch(`/api/search/suggestions?${params}`)
  return handleResponseError<GETSearchSuggestionsResponse>(response)
}

export default function useCensorshipSuggestionsQuery({ query }: Props) {
  const locale = useLocaleFromCookie()

  return useQuery({
    queryKey: QueryKeys.searchSuggestions(query, locale),
    queryFn: () => fetchCensorshipSuggestions(query, locale),
    enabled: query.length >= MIN_SUGGESTION_QUERY_LENGTH,
  })
}
