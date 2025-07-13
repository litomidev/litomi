'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

import { useServiceWorkerStore } from './serviceWorker'

type Props = {
  path: string
}

export default function ServiceWorker({ path }: Readonly<Props>) {
  const setIsServiceWorkerRegistered = useServiceWorkerStore((store) => store.setIsServiceWorkerRegistered)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(path)
        .then(() => setIsServiceWorkerRegistered(true))
        .catch((error) => {
          toast.error('서비스 워커 등록에 실패했습니다.')
          console.error(error)
        })
    }
  }, [path, setIsServiceWorkerRegistered])

  return null
}
