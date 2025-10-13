import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { generateOpenGraphMetadata, SHORT_NAME } from '@/constants'
import { BLACKLISTED_MANGA_IDS, MAX_MANGA_DESCRIPTION_LENGTH, MAX_MANGA_TITLE_LENGTH } from '@/constants/policy'
import { litomiClient } from '@/crawler/litomi'

import Forbidden from './Forbidden'
import MangaViewer from './MangaViewer'
import { mangaSchema } from './schema'

export async function generateMetadata({ params }: PageProps<'/manga/[id]'>): Promise<Metadata> {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data

  if (BLACKLISTED_MANGA_IDS.includes(id)) {
    return {
      title: '403 Forbidden',
      description: '규정에 따라 볼 수 없는 작품이에요.',
    }
  }

  const manga = await getManga(id)
  const slicedTitle = manga?.title?.slice(0, MAX_MANGA_TITLE_LENGTH) || '작품'
  const slicedDescription = manga?.description?.slice(0, MAX_MANGA_DESCRIPTION_LENGTH)

  return {
    title: `${slicedTitle}`,
    description: slicedDescription,
    ...generateOpenGraphMetadata({
      title: `${slicedTitle} - ${SHORT_NAME}`,
      description: slicedDescription,
      images: `https://soujpa.in/start/${id}/${id}_0.avif`,
      url: `/manga/${id}`,
    }),
    alternates: {
      canonical: `/manga/${id}`,
      languages: { ko: `/manga/${id}` },
    },
  }
}

export default async function Page({ params }: PageProps<'/manga/[id]'>) {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data

  if (BLACKLISTED_MANGA_IDS.includes(id)) {
    return <Forbidden />
  }

  const manga = await getManga(id)

  return (
    <main>
      <MangaViewer id={id} initialManga={manga} />
    </main>
  )
}

const getMangaFromNextjsCache = (id: number) =>
  unstable_cache(
    async (id: number) => {
      try {
        return await litomiClient.getManga(id)
      } catch {
        return null
      }
    },
    ['manga'],
    { tags: ['manga', 'litomi', `manga:${id}`] },
  )(id)

const getManga = cache((id: number) => getMangaFromNextjsCache(id))
