import { ErrorBoundary } from '@suspensive/react'
import { ExternalLink } from 'lucide-react'
import { memo, ReactNode, Suspense } from 'react'

import { Manga } from '@/types/manga'
import { getViewerLink } from '@/utils/manga'

import LogoDiscord from '../icons/LogoDiscord'
import LogoGitHub from '../icons/LogoGitHub'
import LogoX from '../icons/LogoX'
import TagList from '../TagList'
import BookmarkButton, { BookmarkButtonError, BookmarkButtonSkeleton } from './BookmarkButton'
import DownloadButton from './DownloadButton'
import LanguageBadge from './LanguageBadge'
import MangaCardDate from './MangaCardDate'
import MangaCardImage from './MangaCardImage'
import MangaCardStats from './MangaCardStats'
import MangaMetadataItem from './MangaMetadataItem'
import MangaMetadataList from './MangaMetadataList'
import SearchFromHereButton from './SearchFromHereButton'

type Props = {
  manga: Manga
  index?: number
  className?: string
  showSearchFromNextButton?: boolean
}

export default memo(MangaCard)

export function MangaCardDonation() {
  return (
    <MangaCardSkeleton className="!p-0 overflow-hidden">
      <div className="h-full w-full overflow-y-auto flex">
        <div className="m-auto flex flex-col items-center gap-1 p-4">
          <span>
            리토미를 도와주세요. X 계정 팔로우 및 게시글 좋아요를 하거나 GitHub Star 클릭, Discord 채널 부스트, Patreon
            후원, Ko-fi 후원, 또는 쿠팡 파트너스 링크로 물품을 구매하여 서비스를 응원해주세요. 매일 몇 천원의 서버
            비용이 발생하는데, 유해 광고 없이 서비스를 운영하기 위해서 참여해주시면 감사하겠습니다. 🙇
          </span>
          <a className="inline-flex items-center gap-1 hover:underline" href="https://x.com/litomi_in" target="_blank">
            <LogoX className="size-4" /> @litomi_in
          </a>
          <a
            className="inline-flex items-center gap-1 hover:underline"
            href="https://github.com/gwak2837/litomi"
            target="_blank"
          >
            <LogoGitHub className="size-4" /> GitHub Star
          </a>
          <a
            className="inline-flex items-center gap-1 hover:underline"
            href="https://discord.gg/xTrbQaxpyD"
            target="_blank"
          >
            <LogoDiscord className="size-4" /> Discord 부스트
          </a>
          <a className="hover:underline" href="https://patreon.com/litomi" target="_blank">
            Patreon
          </a>
          <a className="hover:underline" href="https://ko-fi.com/litomi" target="_blank">
            Ko-fi
          </a>
          <a
            className="hover:underline"
            href="https://velog.io/@gwak2837/%EC%A0%9C%EC%A3%BC-%EC%82%BC%EB%8B%A4%EC%88%98"
            target="_blank"
          >
            쿠팡 파트너스
          </a>
        </div>
      </div>
    </MangaCardSkeleton>
  )
}

export function MangaCardSkeleton({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <li
      className={`animate-fade-in rounded-xl bg-zinc-900 border-2 aspect-[3/4] w-full h-full flex flex-col justify-center items-center gap-1 p-4 ${className}`}
    >
      {children}
    </li>
  )
}

function MangaCard({ manga, index = 0, className = '', showSearchFromNextButton }: Readonly<Props>) {
  const { id, artists, characters, date, group, series, tags, title, type, origin, languages, uploader } = manga
  const isDownloadable = origin === 'https://soujpa.in'
  const viewerLink = getViewerLink(id)

  return (
    <li
      className={`flex flex-col border-2 rounded-xl overflow-hidden bg-zinc-900 relative ${className}`}
      data-manga-card
      key={id}
    >
      <MangaCardImage
        className="h-fit my-auto aspect-[4/3] [&_img]:snap-start [&_img]:flex-shrink-0 [&_img]:w-full [&_img]:object-contain [&_img]:aspect-[4/3]"
        manga={manga}
        mangaIndex={index}
      />
      <div className="flex grow flex-col justify-between gap-2 p-2 border-t-2">
        <dl className="flex flex-col gap-2 text-sm [&_dt]:whitespace-nowrap [&_dt]:font-semibold">
          <div className="flex items-start gap-1.5">
            <a className="flex-1 hover:underline focus:underline" href={viewerLink} target="_blank">
              <h4 className="line-clamp-3 font-bold text-base leading-5 min-w-0 break-words break-all">
                {title} <ExternalLink className="size-3 ml-1 text-zinc-400 inline-block" />
              </h4>
            </a>
            {languages && languages.length > 0 && (
              <Suspense>
                <LanguageBadge key={languages[0].value} language={languages[0].value} />
              </Suspense>
            )}
          </div>
          {type && (
            <div className="flex gap-1">
              <dt>종류</dt>
              <Suspense>
                <MangaMetadataItem filterType="type" value={type} />
              </Suspense>
            </div>
          )}
          {artists && artists.length > 0 && (
            <div className="flex gap-1">
              <dt>작가</dt>
              <Suspense>
                <MangaMetadataList details={artists} filterType="artist" />
              </Suspense>
            </div>
          )}
          {group && group.length > 0 && (
            <div className="flex gap-1">
              <dt>그룹</dt>
              <Suspense>
                <MangaMetadataList details={group} filterType="group" />
              </Suspense>
            </div>
          )}
          {series && series.length > 0 && (
            <div className="flex gap-1">
              <dt>시리즈</dt>
              <Suspense>
                <MangaMetadataList details={series} filterType="series" />
              </Suspense>
            </div>
          )}
          {characters && characters.length > 0 && (
            <div className="flex gap-1">
              <dt>캐릭터</dt>
              <Suspense>
                <MangaMetadataList details={characters} filterType="character" />
              </Suspense>
            </div>
          )}
          {uploader && (
            <div className="flex gap-1">
              <dt>업로더</dt>
              <Suspense>
                <MangaMetadataItem filterType="uploader" value={uploader} />
              </Suspense>
            </div>
          )}
          {tags && tags.length > 0 && (
            <Suspense>
              <TagList className="flex flex-wrap gap-1 font-semibold" tags={tags} />
            </Suspense>
          )}
        </dl>
        <div className="grid gap-2">
          <MangaCardStats manga={manga} />
          <div className="flex text-xs justify-between items-center gap-1">
            <a
              className="text-zinc-400 focus:underline flex items-center gap-1 hover:underline"
              href={viewerLink}
              target="_blank"
            >
              {id}
              <ExternalLink className="size-3" />
            </a>
            {date && <MangaCardDate manga={manga} />}
          </div>
          <div
            className="flex flex-wrap justify-around gap-2 text-sm font-medium 
            [&_button]:transition [&_button]:bg-zinc-900 [&_button]:rounded-lg [&_button]:p-1 [&_button]:px-2 [&_button]:border-2 [&_button]:h-full [&_button]:w-full
            [&_button]:disabled:bg-zinc-800 [&_button]:disabled:cursor-not-allowed [&_button]:disabled:text-zinc-500 
            [&_button]:hover:bg-zinc-800 [&_button]:active:bg-zinc-900 [&_button]:active:border-zinc-700"
          >
            <ErrorBoundary fallback={BookmarkButtonError}>
              <Suspense fallback={<BookmarkButtonSkeleton className="flex-1" />}>
                <BookmarkButton className="flex-1" manga={manga} />
              </Suspense>
            </ErrorBoundary>
            {showSearchFromNextButton ? (
              <Suspense>
                <SearchFromHereButton className="flex-1" mangaId={id} />
              </Suspense>
            ) : isDownloadable ? (
              <DownloadButton className="flex-1" manga={manga} />
            ) : null}
          </div>
        </div>
      </div>
    </li>
  )
}
