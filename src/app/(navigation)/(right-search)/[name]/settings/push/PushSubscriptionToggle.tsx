'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import Toggle from '@/components/ui/Toggle'
import { NEXT_PUBLIC_VAPID_PUBLIC_KEY } from '@/constants/env'
import useActionResponse from '@/hook/useActionResponse'
import { checkIOSDevice, checkIOSSafari, urlBase64ToUint8Array } from '@/utils/browser'
import { getUsernameFromParam } from '@/utils/param'

import { Params } from '../../common'
import { subscribeToNotifications, unsubscribeFromNotifications } from './action'
import { getCurrentBrowserEndpoint } from './common'

type Props = {
  endpoints: string[]
}

export default function PushSubscriptionToggle({ endpoints }: Readonly<Props>) {
  const [isPending, setIsPending] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const { name } = useParams<Params>()
  const username = getUsernameFromParam(name)

  useEffect(() => {
    if (endpoints.length > 0) {
      ;(async () => {
        const currentEndpoint = await getCurrentBrowserEndpoint()

        if (currentEndpoint && endpoints.includes(currentEndpoint)) {
          setIsSubscribed(true)
        }
      })()
    }
  }, [endpoints])

  const [_, dispatchSubscriptionAction] = useActionResponse({
    action: subscribeToNotifications,
    onSuccess: (data) => {
      setIsSubscribed(true)
      toast.success(data)
    },
    shouldSetResponse: false,
  })

  const [__, dispatchUnsubscriptionAction] = useActionResponse({
    action: unsubscribeFromNotifications,
    onSuccess: (data) => {
      setIsSubscribed(false)
      toast.success(data)
    },
    shouldSetResponse: false,
  })

  async function subscribeNotification() {
    if (!('Notification' in window)) {
      if (checkIOSSafari()) {
        toast.warning('iOS Safari 환경에선 사이트를 홈 화면에 추가해야 알림을 받을 수 있어요')
      } else if (checkIOSDevice()) {
        toast.warning('iOS에서는 Safari를 통해 사이트를 홈 화면에 추가해야 알림을 받을 수 있어요')
      } else {
        toast.warning('이 브라우저는 알림을 지원하지 않아요')
      }
      return
    }

    if (!('serviceWorker' in navigator)) {
      toast.warning('Service Worker를 사용할 수 없어요')
      return
    }

    try {
      setIsPending(true)

      const permission = await Notification.requestPermission()

      if (permission === 'denied') {
        toast.error('알림 권한이 거부됐어요')
        return
      }

      const registration = await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      dispatchSubscriptionAction({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
        username,
      })
    } catch (error) {
      console.error('requestNotificationPermission:', error)
      toast.error('알림 활성화 중 오류가 발생했어요')
    } finally {
      setIsPending(false)
    }
  }

  async function unsubscribeNotification() {
    try {
      setIsPending(true)

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        toast.success('알림이 비활성화됐어요')
        return
      }

      await subscription.unsubscribe()

      dispatchUnsubscriptionAction({
        endpoint: subscription.endpoint,
        username,
      })
    } catch (error) {
      console.error('unsubscribeNotification:', error)
      toast.error('알림 비활성화 중 오류가 발생했어요')
    } finally {
      setIsPending(false)
    }
  }

  function handleToggle(enabled: boolean) {
    if (enabled) {
      subscribeNotification()
    } else {
      unsubscribeNotification()
    }
  }

  return (
    <Toggle
      checked={isSubscribed}
      className="w-12 sm:w-14 peer-checked:bg-brand-end/80 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"
      disabled={isPending}
      onToggle={handleToggle}
    />
  )
}
