import ms from 'ms'

import type { Manga } from '@/types/manga'

import { MangaSource, tagCategoryNameToInt } from '@/database/enum'
import { translateArtistList } from '@/translation/artist'
import { translateCharacterList } from '@/translation/character'
import { translateGroupList } from '@/translation/group'
import { translateLanguageList } from '@/translation/language'
import { translateSeriesList } from '@/translation/series'
import { translateTag } from '@/translation/tag'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { sec } from '@/utils/date'
import { convertCamelCaseToKebabCase } from '@/utils/param'

import { NotFoundError, ParseError, UpstreamServerError } from './errors'
import { ProxyClient, ProxyClientConfig } from './proxy'
import { isUpstreamServerError } from './proxy-utils'
import { getOriginFromImageURLs } from './utils'

const kHentaiTypeNumberToName: Record<number, string> = {
  1: '동인지',
  2: '망가',
  3: '아티스트 CG',
  4: '게임 CG',
  5: '서양',
  6: '이미지 모음',
  7: '건전',
  8: '코스프레',
  9: '아시안',
  10: '기타',
  11: '비공개',
}

const typeNameToNumber: Record<string, number> = {
  동인지: 1,
  doujinshi: 1,
  망가: 2,
  manga: 2,
  아티스트cg: 3,
  아티스트_cg: 3,
  artistcg: 3,
  artist_cg: 3,
  게임cg: 4,
  게임_cg: 4,
  game_cg: 4,
  gamecg: 4,
  서양: 5,
  western: 5,
  이미지모음: 6,
  이미지_모음: 6,
  imageset: 6,
  image_set: 6,
  건전: 7,
  'non-h': 7,
  코스프레: 8,
  cosplay: 8,
  아시안: 9,
  asian: 9,
  기타: 10,
  other: 10,
  misc: 10,
  비공개: 11,
  private: 11,
}

const VALID_TAG_CATEGORIES = ['female', 'male', 'mixed', 'other'] as const

export interface File {
  id: string
  image: Image
  name: string
  thumbnail: Thumbnail
}

export interface Image {
  extension: string
  height: number
  id: string
  orientation: string
  server: number
  size: number
  url: string
  width: number
}

export interface KHentaiGallery extends KHentaiMangaCommon {
  files: File[]
}

export interface KHentaiManga extends KHentaiMangaCommon {
  torrents: Torrent[]
}

export type KHentaiMangaSearchOptions = {
  search?: string
  nextId?: string
  sort?: 'id_asc' | 'popular' | 'random'
  offset?: string
  categories?: string
  minViews?: string
  maxViews?: string
  minPages?: string
  maxPages?: string
  startDate?: string
  endDate?: string
  minRating?: string
  maxRating?: string
  uploader?: string
}

export interface Thumbnail {
  extension: string
  height: number
  id: string
  orientation: string
  server: number
  size: number
  url: string
  width: number
}

interface KHentaiMangaCommon {
  archived: number
  blocked: number
  category: number
  current_gid: number
  current_key: number
  expunged: number
  filecount: number
  filesize: number
  first_gid: number
  first_key: string
  id: number
  parent_gid: number
  parent_key: string
  posted: number
  rating: number
  tags: KHentaiTag[]
  thumb: string
  thumb_extension: string
  title: string
  title_jpn: string
  token: string
  torrentcount: number
  updated: number
  uploader: string
  views: number
}

interface KHentaiTag {
  id: number
  tag: [string, string] // e.g. ['female', 'big_breasts']
}

type TagCategory = (typeof VALID_TAG_CATEGORIES)[number]

interface Torrent {
  added: number
  fsize: number
  hash: string
  name: string
  tsize: number
}

const K_HENTAI_CONFIG: ProxyClientConfig = {
  baseURL: 'https://k-hentai.org',
  circuitBreaker: {
    failureThreshold: 8,
    successThreshold: 3,
    timeout: ms('5 minutes'),
    shouldCountAsFailure: isUpstreamServerError,
  },
  retry: {
    maxRetries: 2,
    initialDelay: ms('1 second'),
    maxDelay: ms('5 seconds'),
    backoffMultiplier: 2,
    jitter: true,
  },
  requestTimeout: ms('5 seconds'),
  defaultHeaders: {
    'accept-encoding': 'gzip, deflate, br, zstd',
    origin: 'https://k-hentai.org',
    referer: 'https://k-hentai.org/',
  },
}

const KOHENTAI_CONFIG: ProxyClientConfig = {
  baseURL: 'https://kohentai.org',
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: ms('10 minutes'),
    shouldCountAsFailure: isUpstreamServerError,
  },
  retry: {
    maxRetries: 2,
    initialDelay: ms('1 second'),
    maxDelay: ms('5 seconds'),
    backoffMultiplier: 2,
    jitter: true,
  },
  requestTimeout: ms('5 seconds'),
  defaultHeaders: {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    origin: 'https://kohentai.org',
    referer: 'https://kohentai.org/',
    cookie: 'kh_session_id=952793d253ed50545542fbcc5643e0ac48f79ce9a7825e3eebacda2ac1c09586', // NOTE: 2026-10-01 새로운 값으로 교체하기
  },
}

class KHentaiClient {
  private readonly client: ProxyClient
  private readonly fallbackClient: ProxyClient

  constructor() {
    this.client = new ProxyClient(K_HENTAI_CONFIG)
    this.fallbackClient = new ProxyClient(KOHENTAI_CONFIG)
  }

  async fetchManga(id: number, revalidate = sec('12 hours')): Promise<Manga | null> {
    const gallery = await this.fetchGallery(id, revalidate)

    if (!gallery) {
      return null
    }

    return {
      ...this.convertKHentaiCommonToManga(gallery),
      ...getOriginFromImageURLs(gallery.files.map((file) => file.image.url)),
    }
  }

  async fetchMangaImages(id: number, revalidate = sec('12 hours')): Promise<string[] | null> {
    const gallery = await this.fetchGallery(id, revalidate)

    if (!gallery) {
      return null
    }

    return gallery.files.map((file) => file.image.url)
  }

  async fetchRandomKoreanMangas(): Promise<Manga[]> {
    return this.searchMangas({ search: 'language:korean', sort: 'random' }, 15)
  }

  async searchKoreanMangas(): Promise<Manga[]> {
    return this.searchMangas({ search: 'language:korean' }, sec('6 hours'))
  }

  async searchMangas(params: KHentaiMangaSearchOptions = {}, revalidate = sec('5 minutes')): Promise<Manga[]> {
    const kebabCaseParams = Object.entries(params)
      .filter(([key, value]) => key !== 'offset' && value !== undefined)
      .map(([key, value]) => [convertCamelCaseToKebabCase(key), value])

    const searchParams = new URLSearchParams(kebabCaseParams)
    searchParams.sort()

    const kHentaiMangas = await this.client.fetch<KHentaiManga[]>(`/ajax/search?${searchParams}`, {
      next: { revalidate },
    })

    const mangas = kHentaiMangas
      .filter((manga) => manga.archived === 1)
      .map((manga) => this.convertKHentaiCommonToManga(manga))

    return params.offset ? mangas.slice(Number(params.offset)) : mangas
  }

  private convertKHentaiCommonToManga({
    id,
    title,
    category,
    posted,
    rating,
    tags,
    filecount,
    views,
    uploader,
    filesize,
    torrentcount,
    thumb,
  }: KHentaiMangaCommon) {
    const locale = 'ko' // TODO: Get from user preferences or context
    const seriesValues = tags.filter(({ tag }) => tag[0] === 'parody').map(({ tag }) => tag[1])
    const characterValues = tags.filter(({ tag }) => tag[0] === 'character').map(({ tag }) => tag[1])
    const groupValues = tags.filter(({ tag }) => tag[0] === 'group').map(({ tag }) => tag[1])
    const artistValues = tags.filter(({ tag }) => tag[0] === 'artist').map(({ tag }) => tag[1])
    const languageValues = tags.filter(({ tag }) => tag[0] === 'language').map(({ tag }) => tag[1])

    return {
      id,
      title,
      images: [thumb],
      date: new Date(posted * 1000).toISOString(),
      artists: translateArtistList(artistValues, locale),
      characters: translateCharacterList(characterValues, locale),
      group: translateGroupList(groupValues, locale),
      series: translateSeriesList(seriesValues, locale),
      tags: tags
        .filter(this.isValidKHentaiTag)
        .map(({ tag: [category, value] }) => translateTag(category, value, locale))
        // NOTE: 알파벳순으로 정렬되기에 카테고리, locale 순서대로 정렬
        .sort((a, b) => {
          if (a.category !== b.category) {
            return tagCategoryNameToInt[a.category] - tagCategoryNameToInt[b.category]
          }
          return a.label.localeCompare(b.label)
        }),
      type: kHentaiTypeNumberToName[category] ?? '?',
      languages: translateLanguageList(languageValues, locale),
      count: filecount,
      rating: rating / 100,
      viewCount: views,
      uploader,
      filesize,
      torrentCount: torrentcount,
      source: MangaSource.K_HENTAI,
    }
  }

  private async fetchGallery(id: number, revalidate = sec('12 hours')): Promise<KHentaiGallery | null> {
    try {
      const html = await this.client.fetch<string>(`/r/${id}`, { next: { revalidate } }, true)
      return this.parseGalleryFromHTML(html, id)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null
      }

      if (error instanceof UpstreamServerError && error.statusCode === 403) {
        const userId = await validateUserIdFromCookie()

        if (!userId) {
          throw error
        }

        const html = await this.fallbackClient.fetch<string>(`/r/${id}`, { next: { revalidate } }, true)
        return this.parseGalleryFromHTML(html, id)
      }

      throw error
    }
  }

  // NOTE: k-hentai에서 언어, 그룹, 패러디 등의 값도 태그로 내려줘서, 진짜 태그만 추출하기 위한 함수
  private isValidKHentaiTag(tag: KHentaiTag): tag is { id: number; tag: [TagCategory, string] } {
    return VALID_TAG_CATEGORIES.includes(tag.tag[0] as TagCategory)
  }

  private parseGalleryFromHTML(html: string, id: number): KHentaiGallery {
    const match = html.match(/const\s+gallery\s*=\s*(\{[\s\S]*?\});/s)

    if (!match) {
      throw new ParseError('k-hentai: `gallery` 변수를 찾을 수 없어요.', { mangaId: id })
    }

    try {
      return JSON.parse(match[1]) as KHentaiGallery
    } catch (error) {
      throw new ParseError('k-hentai: `gallery` 변수를 읽을 수 없어요.', {
        mangaId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

// Singleton instance
export const kHentaiClient = new KHentaiClient()

export function getCategories(query?: string) {
  return query
    ?.match(/\btype:(\S+)/i)?.[1]
    .split(',')
    .map((categoryName) => {
      const normalized = categoryName.trim().toLowerCase().replace(/\s+/g, '')
      return /^\d+$/.test(normalized) ? normalized : (typeNameToNumber[normalized] ?? categoryName)
    })
    .filter(Boolean)
    .join(',')
}
