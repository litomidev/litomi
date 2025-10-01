import Link from 'next/link'

import IconFlame from '@/components/icons/IconFlame'
import InstallPrompt from '@/components/InstallPrompt'
import LinkPending from '@/components/LinkPending'
import SourceTooltip from '@/components/tooltip/SourceTooltip'
import { SHORT_NAME } from '@/constants'

import { DEFAULT_METRIC, DEFAULT_PERIOD } from '../(ranking)/common'
import NewMangaLink from './NewMangaLink'
import RandomMangaLink from './RandomMangaLink'

export default async function Layout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex flex-col flex-1 gap-2 p-2">
      <div className="flex flex-wrap justify-center gap-2 text-sm sm:justify-end sm:text-base">
        <Link
          className="flex items-center gap-2 p-2 px-3 rounded-xl transition border-2 text-white hover:bg-zinc-900"
          href={`/ranking/${DEFAULT_METRIC}/${DEFAULT_PERIOD}`}
        >
          <LinkPending className="size-5">
            <IconFlame className="size-5" />
          </LinkPending>{' '}
          인기
        </Link>
        <NewMangaLink />
        <RandomMangaLink />
      </div>
      <div className="flex justify-center whitespace-nowrap">
        <SourceTooltip />
      </div>
      <main className="flex flex-col grow gap-2">{children}</main>
      <footer className="text-center grid gap-2 p-4 text-sm">
        <InstallPrompt />
        <p>ⓒ 2025. {SHORT_NAME}. All rights reserved.</p>
        <div className="flex justify-center gap-2 gap-y-1 flex-wrap text-xs">
          <Link className="hover:underline" href="/doc/terms">
            이용약관
          </Link>
          <Link className="hover:underline" href="/doc/privacy">
            개인정보처리방침
          </Link>
          <Link className="hover:underline" href="/deterrence">
            사용자 연령 제한 규정
          </Link>
          <a className="hover:underline" href="https://github.com/gwak2837/litomi/issues" target="_blank">
            이슈 제보
          </a>
        </div>
        <div className="flex justify-center gap-2 gap-y-1 flex-wrap text-xs">
          <a className="hover:text-pink-400 transition" href="https://github.com/sponsors/gwak2837" target="_blank">
            후원하기
          </a>
          <span>ㅋㅋㅇ뱅크 3333-23-9770326 곽*욱</span>
          <a className="hover:text-purple-400 transition" href="https://patreon.com/litomi" target="_blank">
            Patreon
          </a>
          <a className="hover:text-yellow-400 transition" href="https://ko-fi.com/litomi" target="_blank">
            Ko-fi
          </a>
        </div>
      </footer>
    </div>
  )
}
