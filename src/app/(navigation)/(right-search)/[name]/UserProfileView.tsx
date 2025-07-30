import dayjs from 'dayjs'
import Image from 'next/image'
import { Suspense } from 'react'

import IconCalendar from '@/components/icons/IconCalendar'
import IconProfile from '@/components/icons/IconProfile'

import EditLogout from './EditLogout'

type Props = {
  user: {
    id?: number
    name?: string
    nickname?: string
    imageURL?: string | null
    createdAt?: Date
    type?: string
  }
}

export default function UserProfile({ user }: Readonly<Props>) {
  return (
    <>
      <div className="relative h-48 w-full shrink-0">
        <Image
          alt="Cover Image"
          className="object-cover"
          fill
          priority
          sizes="100vw, (min-width: 1024px) 1024px"
          src="/og-image.png"
        />
      </div>
      {/* 프로필 정보 영역 */}
      <div className="grid gap-4 px-4 pb-2">
        <div className="relative -mt-16 flex justify-between items-end">
          <div className="flex items-end">
            <div className="w-32 aspect-square shrink-0 border-4 rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center">
              {user.imageURL ? (
                <img alt="Profile Image" className="object-cover bg-zinc-900 aspect-square w-32" src={user.imageURL} />
              ) : (
                <IconProfile className="w-2/3 text-zinc-700" />
              )}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold line-clamp-1 break-all">{user.nickname}</h1>
              <p className="text-zinc-500 font-mono break-all">@{user.name}</p>
            </div>
          </div>
          <Suspense fallback={<div>...</div>}>
            <EditLogout />
          </Suspense>
        </div>
        <UserProfileDescription user={user} />
      </div>
    </>
  )
}

function UserProfileDescription({ user }: Readonly<Props>) {
  if (user.type === 'not-found') {
    return <div className="mt-2 text-zinc-500 text-sm">존재하지 않는 사용자에요</div>
  }

  if (user.type === 'guest') {
    return <div className="mt-2 text-zinc-500 text-sm">로그인하면 모든 기능을 이용할 수 있습니다</div>
  }

  if (user.type === 'loading') {
    return <div className="mt-2 text-zinc-500 animate-fade-in bg-zinc-800 rounded-full text-sm">.</div>
  }

  return (
    <>
      <div className="mt-2 flex items-center gap-1 text-zinc-500 text-sm">
        <IconCalendar className="w-4" /> 가입일: {dayjs(user.createdAt).format('YYYY년 M월')}
      </div>
      <div className="mt-4 flex gap-6">
        <div className="flex gap-2">
          <span className="font-bold">{123}</span>
          <span className="text-zinc-500">팔로우 중</span>
        </div>
        <div className="flex gap-2">
          <span className="font-bold">{456}</span>
          <span className="text-zinc-500">팔로워</span>
        </div>
      </div>
    </>
  )
}
