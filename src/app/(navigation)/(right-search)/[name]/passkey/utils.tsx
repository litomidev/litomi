import { AuthenticatorTransportFuture } from '@simplewebauthn/server'

import IconBluetooth from '@/components/icons/IconBluetooth'
import IconCable from '@/components/icons/IconCable'
import IconChip from '@/components/icons/IconChip'
import IconKey from '@/components/icons/IconKey'
import IconNFC from '@/components/icons/IconNFC'
import IconSmartCard from '@/components/icons/IconSmartCard'
import IconSmartphone from '@/components/icons/IconSmartphone'
import IconUSB from '@/components/icons/IconUSB'

export function generateFakeCredentials(loginId: string): Array<{
  id: string
  transports?: AuthenticatorTransportFuture[]
}> {
  const encoder = new TextEncoder()
  const data = encoder.encode(loginId)

  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data[i]
    hash = hash & hash
  }

  const numCredentials = 1 + (Math.abs(hash) % 3)
  const credentials = []

  for (let i = 0; i < numCredentials; i++) {
    const credentialHash = Math.abs(hash + i * 12345)
      .toString(16)
      .padStart(16, '0')
    const fakeCredentialId = btoa(credentialHash).replace(/=/g, '').slice(0, 43)

    const transportIndex = (hash + i) % 4
    let transports: AuthenticatorTransportFuture[]

    switch (transportIndex) {
      case 0:
        transports = ['internal']
        break
      case 1:
        transports = ['usb']
        break
      case 2:
        transports = ['hybrid']
        break
      default:
        transports = ['internal', 'hybrid']
        break
    }

    credentials.push({
      id: fakeCredentialId,
      transports,
    })
  }

  return credentials
}

export function getDeviceInfo(deviceType: string) {
  switch (deviceType) {
    case 'cross-platform':
      return {
        icon: <IconUSB className="w-6 text-brand-end" />,
        label: '외부 기기',
        bgColor: 'bg-brand-end/10',
      }
    case 'platform':
      return {
        icon: <IconSmartphone className="w-6 text-brand-end" />,
        label: '현재 기기',
        bgColor: 'bg-brand-end/10',
      }
    default:
      return {
        icon: <IconKey className="w-6 text-zinc-400" />,
        label: '알 수 없는 기기',
        bgColor: 'bg-zinc-800',
      }
  }
}

export function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return '방금 전'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}일 전`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears}년 전`
}

export function getTransportIcon(transport: AuthenticatorTransportFuture) {
  switch (transport) {
    case 'ble':
      return <IconBluetooth className="h-3 w-3" />
    case 'cable':
      return <IconCable className="h-3 w-3" />
    case 'hybrid':
      return <IconSmartphone className="h-3 w-3" />
    case 'internal':
      return <IconChip className="h-3 w-3" />
    case 'nfc':
      return <IconNFC className="h-3 w-3" />
    case 'smart-card':
      return <IconSmartCard className="h-3 w-3" />
    case 'usb':
      return <IconUSB className="h-3 w-3" />
    default:
      return null
  }
}

const labelMap: Record<AuthenticatorTransportFuture, string | undefined> = {
  usb: 'USB',
  nfc: 'NFC',
  ble: '블루투스',
  internal: '내장',
  hybrid: '혼합',
  'smart-card': '스마트카드',
  cable: 'Cable',
}

export function getTransportLabel(transport?: AuthenticatorTransportFuture | null) {
  if (!transport) {
    return ''
  }

  return labelMap[transport]
}

export function getTruncatedId(id: string): string {
  if (id.length <= 12) {
    return id
  }
  return `${id.slice(0, 6)}...${id.slice(-4)}`
}

export function getUserVerificationMethod(deviceType: string) {
  switch (deviceType) {
    case 'cross-platform':
      return {
        requiresVerification: true,
        verificationLabel: '사용자 확인',
        verificationDescription: '보안 키의 버튼을 누르거나 PIN 입력',
      }
    case 'platform':
      return {
        requiresVerification: true,
        verificationLabel: '생체 인증',
        verificationDescription: '지문, 얼굴 인식 또는 PIN으로 인증',
      }
    default:
      return {
        requiresVerification: false,
        verificationLabel: '',
        verificationDescription: '',
      }
  }
}
