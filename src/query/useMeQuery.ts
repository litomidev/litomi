import { useQuery } from '@tanstack/react-query'
import ms from 'ms'
import { useEffect } from 'react'

import { GETMeResponse } from '@/app/api/me/route'
import { QueryKeys } from '@/constants/query'
import amplitude from '@/lib/amplitude/lazy'
import { handleResponseError, ResponseError } from '@/utils/react-query-error'

export async function fetchMe() {
  try {
    const response = await fetch('/api/me')
    return await handleResponseError<GETMeResponse>(response)
  } catch (error) {
    if (error instanceof ResponseError && error.status === 401) {
      return null
    }
    throw error
  }
}

export default function useMeQuery() {
  const result = useQuery({
    queryKey: QueryKeys.me,
    queryFn: fetchMe,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: ms('1 hour'),
    gcTime: ms('1 hour'),
  })

  const userId = result.data?.id

  useEffect(() => {
    if (userId) {
      amplitude.setUserId(userId)
    }
  }, [userId])

  return result
}
