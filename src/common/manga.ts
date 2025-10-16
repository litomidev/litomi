import { harpiClient } from '@/crawler/harpi/harpi'
import { hentaiPawClient } from '@/crawler/hentai-paw'
import { hentKorClient } from '@/crawler/hentkor'
import { hitomiClient } from '@/crawler/hitomi/hitomi'
import { hiyobiClient } from '@/crawler/hiyobi'
import { kHentaiClient } from '@/crawler/k-hentai'
import { komiClient } from '@/crawler/komi/komi'
import { MangaSource } from '@/database/enum'
import { Manga, MangaError } from '@/types/manga'
import { sec } from '@/utils/date'
import { mergeMangas } from '@/utils/manga'
import { checkDefined } from '@/utils/type'

type MangaResult = Error | Manga | null | undefined

export async function fetchMangaFromMultiSources(id: number): Promise<Manga | MangaError | null> {
  const revalidate = sec('30 days')

  const [hiyobiManga, hiyobiImages, kHentaiManga, harpiManga, komiManga, hitomiManga, hentaiPawImages] =
    await Promise.all([
      hiyobiClient.fetchManga({ id, revalidate }).catch(Error),
      hiyobiClient.fetchMangaImages({ id }).catch(() => null),
      kHentaiClient.fetchManga({ id }).catch(Error),
      harpiClient.fetchManga({ id, revalidate }).catch(Error),
      komiClient.fetchManga({ id, revalidate }).catch(Error),
      hitomiClient.fetchManga({ id }).catch(Error),
      hentaiPawClient.fetchMangaImages({ id, revalidate }).catch(() => null),
    ])

  const sources: MangaResult[] = [
    harpiManga,
    komiManga,
    kHentaiManga,
    hiyobiManga,
    createHentaiPawManga(id, hentaiPawImages),
    hitomiManga,
  ].filter(checkDefined)

  if (sources.length === 0) {
    return null
  }

  const validMangas = sources.filter((source): source is Manga => !(source instanceof Error))
  const errors = sources.filter((source): source is Error => source instanceof Error)

  if (validMangas.length === 0) {
    return createErrorManga(id, errors[0])
  }

  const validHiyobiManga = validMangas.find((manga) => manga.source === MangaSource.HIYOBI)

  if (validHiyobiManga && hiyobiImages) {
    validHiyobiManga.images = hiyobiImages.map((image) => ({ original: { url: image } }))
  }

  return mergeMangas(validMangas)
}

/**
 * @param ids - 10개 이하의 고유한 만화 ID 배열
 */
export async function fetchMangasFromMultiSources(ids: number[]): Promise<Record<number, Manga | MangaError>> {
  const revalidate = sec('30 days')
  const harpiMangas = await harpiClient.searchMangas({ ids }, revalidate).catch((error) => new Error(error))
  const mangaMap: Record<number, Manga> = {}
  const remainingIds = []

  if (harpiMangas) {
    for (const id of ids) {
      const harpiManga = findHarpiManga(harpiMangas, id)

      if (harpiManga) {
        mangaMap[id] = mergeMangas([harpiManga])
      } else {
        remainingIds.push(id)
      }
    }
  } else {
    remainingIds.push(...ids)
  }

  if (remainingIds.length === 0) {
    return mangaMap
  }

  const [hiyobiMangas, hiyobiImages, kHentaiMangas, komiMangas, hitomiMangas, hentaiPawImages] = await Promise.all([
    Promise.all(remainingIds.map((id) => hiyobiClient.fetchManga({ id, revalidate }).catch(Error))),
    Promise.all(remainingIds.map((id) => hiyobiClient.fetchMangaImages({ id }).catch(() => null))),
    Promise.all(remainingIds.map((id) => kHentaiClient.fetchManga({ id }).catch(Error))),
    Promise.all(remainingIds.map((id) => komiClient.fetchManga({ id, revalidate }).catch(Error))),
    Promise.all(remainingIds.map((id) => hitomiClient.fetchManga({ id }).catch(Error))),
    Promise.all(remainingIds.map((id) => hentaiPawClient.fetchMangaImages({ id, revalidate }).catch(() => null))),
  ])

  for (let i = 0; i < remainingIds.length; i++) {
    const id = remainingIds[i]

    const sources: MangaResult[] = [
      komiMangas[i],
      hiyobiMangas[i],
      kHentaiMangas[i],
      createHentaiPawManga(id, hentaiPawImages[i]),
      hitomiMangas[i],
    ].filter(checkDefined)

    if (sources.length === 0) {
      mangaMap[id] = {
        id,
        title: '해당 작품을 찾을 수 없어요',
        images: [],
      }
      continue
    }

    const validMangas = sources.filter((source): source is Manga => !(source instanceof Error))
    const errors = sources.filter((source): source is Error => source instanceof Error)

    if (validMangas.length === 0) {
      mangaMap[id] = createErrorManga(id, errors[0])
      continue
    }

    const validHiyobiManga = validMangas.find((manga) => manga.source === MangaSource.HIYOBI)
    const validHentaiPawManga = validMangas.find((manga) => manga.source === MangaSource.HENTAIPAW)
    const validHiyobiImages = hiyobiImages[i]
    const validHentaiPawImages = hentaiPawImages[i]

    if (validHiyobiManga && validHiyobiImages) {
      validHiyobiManga.images = validHiyobiImages.map((image) => ({ original: { url: image } }))
    }

    if (validHentaiPawManga && validHentaiPawImages) {
      validHentaiPawManga.images = validHentaiPawImages.map((image) => ({ original: { url: image } }))
    }

    mangaMap[id] = mergeMangas(validMangas)
  }

  return mangaMap
}

function createErrorManga(id: number, error: Error): MangaError {
  return {
    id,
    title: `${error.message}\n${error.cause ?? ''}`,
    images: hentKorClient.fetchMangaImages(id, 100).map((image) => ({ original: { url: image } })),
    isError: true,
  }
}

function createHentaiPawManga(id: number, images?: string[] | null): Manga | null {
  if (!images || images.length === 0) {
    return null
  }

  return {
    id,
    title: id.toString(),
    images: images.map((image) => ({ original: { url: image } })),
    source: MangaSource.HENTAIPAW,
    count: images.length,
  }
}

function findHarpiManga(harpiMangas: Error | Manga[] | null, id: number) {
  if (!harpiMangas || harpiMangas instanceof Error) {
    return null
  }

  return harpiMangas.find((manga) => manga.id === id)
}
