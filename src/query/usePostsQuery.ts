import { useInfiniteQuery } from '@tanstack/react-query'

import { GETPostsResponse } from '@/app/api/post/route'
import { PostFilter } from '@/app/api/post/schema'
import { QueryKeys } from '@/constants/query'

export default function usePostsInfiniteQuery(filter: PostFilter, mangaId?: number) {
  return useInfiniteQuery<GETPostsResponse>({
    queryKey: QueryKeys.posts(filter, mangaId),
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams({ filter })

      if (pageParam) {
        searchParams.set('cursor', String(pageParam))
      }
      if (mangaId) {
        searchParams.set('mangaId', String(mangaId))
      }

      const response = await fetch(`/api/post?${searchParams}`)

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`)
      }

      return response.json()
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as number | undefined,
  })
}
