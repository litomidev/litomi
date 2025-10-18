'use client'

import { ChartNoAxesColumn } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { toggleLikingPost } from '@/app/(navigation)/(right-search)/posts/action'
import useMeQuery from '@/query/useMeQuery'

import IconChat from '../icons/IconChat'
import IconHeart from '../icons/IconHeart'
import IconLogout from '../icons/IconLogout'
import IconRepeat from '../icons/IconRepeat'
import LoginPageLink from '../LoginPageLink'

type Props = {
  postId: number
  likeCount?: number
  commentCount?: number
  repostCount?: number
  viewCount?: number
  isLiked?: boolean
}

export default function PostActionButtons({
  postId,
  likeCount = 0,
  commentCount = 0,
  repostCount = 0,
  viewCount = 0,
  isLiked = false,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const { data: me } = useMeQuery()

  const handleLike = () => {
    if (!me) {
      toast.warning(
        <div className="flex gap-2 items-center">
          <div>로그인이 필요해요</div>
          <LoginPageLink>로그인하기</LoginPageLink>
        </div>,
      )
      return
    }

    startTransition(async () => {
      const result = await toggleLikingPost(postId)
      if ('error' in result) {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2 text-zinc-400 [&_svg]:size-9 [&_svg]:shrink-0 [&_svg]:p-2 [&_svg]:rounded-full [&_svg]:transition-all">
      <div className="grid grow grid-cols-4 gap-1 text-sm">
        <div className="flex items-center">
          <IconChat />
          {commentCount}
        </div>
        <div className="flex items-center">
          <IconRepeat />
          {repostCount}
        </div>
        <button
          className="flex items-center group transition-all hover:text-red-500 disabled:opacity-50"
          disabled={isPending}
          onClick={handleLike}
        >
          <IconHeart
            aria-selected={isLiked}
            className="group-hover:bg-red-500/20 group-hover:text-red-500 aria-selected:text-red-500"
          />
          <span
            aria-selected={isLiked}
            className={`transition-all aria-selected:font-medium aria-selected:text-red-500`}
          >
            {likeCount}
          </span>
        </button>
        <div className="flex items-center">
          <ChartNoAxesColumn />
          {viewCount}
        </div>
      </div>
      <div className="flex">
        <IconLogout className="-rotate-90" />
      </div>
    </div>
  )
}
