'use client'

import { type MouseEvent, type ReactNode, type TouchEvent, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import useMounted from '@/hook/useMounted'

import IconX from '../icons/IconX'

type Props = {
  children: ReactNode
  className?: string
  dragButtonClassName?: string
  onClose?: () => void
  open: boolean
  showCloseButton?: boolean
  showDragButton?: boolean
}

export default function Modal({
  className = '',
  dragButtonClassName = '',
  children,
  open,
  onClose,
  showCloseButton,
  showDragButton,
}: Readonly<Props>) {
  function closeModal(e: MouseEvent) {
    e.stopPropagation()
    onClose?.()
  }

  useEffect(() => {
    function closeOnEscapeKey(e: KeyboardEvent) {
      if (e.code === 'Escape') {
        onClose?.()
      }
    }

    if (open) {
      const bodyStyle = document.body.style

      document.addEventListener('keydown', closeOnEscapeKey, false)
      bodyStyle.overflow = 'hidden'
      bodyStyle.touchAction = 'none'

      return () => {
        document.removeEventListener('keydown', closeOnEscapeKey, false)
        bodyStyle.overflow = ''
        bodyStyle.touchAction = ''
      }
    }
  }, [onClose, open])

  // --
  const modalRef = useRef<HTMLDivElement>(null)

  function dragModalMouse(event: MouseEvent) {
    const modal = modalRef.current
    if (!modal) return

    const modalRect = modal.getBoundingClientRect()
    const modalStyle = modal.style

    const shiftX = event.clientX - modalRect.left
    const shiftY = event.clientY - modalRect.top

    function moveModal({ clientX, clientY }: globalThis.MouseEvent) {
      modalStyle.left = Math.min(Math.max(0, clientX - shiftX), window.innerWidth - modalRect.width) + 'px'
      modalStyle.top = Math.min(Math.max(0, clientY - shiftY), window.innerHeight - modalRect.height) + 'px'
    }

    document.addEventListener('mousemove', moveModal)
    document.addEventListener('mouseup', () => document.removeEventListener('mousemove', moveModal), { once: true })
  }

  function dragModalTouch(event: TouchEvent) {
    const modal = modalRef.current
    if (!modal) return

    const modalRect = modal.getBoundingClientRect()
    const modalStyle = modal.style

    const shiftX = event.touches[0].clientX - modalRect.left
    const shiftY = event.touches[0].clientY - modalRect.top

    function moveModal({ touches }: globalThis.TouchEvent) {
      const { clientX, clientY } = touches[0]
      modalStyle.left = Math.min(Math.max(0, clientX - shiftX), window.innerWidth - modalRect.width) + 'px'
      modalStyle.top = Math.min(Math.max(0, clientY - shiftY), window.innerHeight - modalRect.height) + 'px'
    }

    document.addEventListener('touchmove', moveModal)
    document.addEventListener('touchend', () => document.removeEventListener('touchmove', moveModal), { once: true })
    document.addEventListener('touchcancel', () => document.removeEventListener('touchmove', moveModal), { once: true })
  }

  // --
  const isMounted = useMounted()

  if (!isMounted) return null

  return (
    <>
      {createPortal(
        <div
          aria-current={open}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 transition pointer-events-none opacity-0 aria-current:pointer-events-auto aria-current:opacity-100"
          onClick={closeModal}
        >
          {showCloseButton && (
            <button aria-label="닫기" onClick={closeModal}>
              <IconX className="absolute right-2 top-2 z-[60] w-8 cursor-pointer rounded-full bg-zinc-700/50 p-1" />
            </button>
          )}
          <div
            aria-current={open}
            className={`absolute z-50 transition sm:scale-95 aria-current:scale-100 ${className}`}
            onClick={(e) => e.stopPropagation()}
            ref={showDragButton ? modalRef : null}
          >
            {showDragButton && (
              <div
                className={`absolute left-0 right-0 top-0 z-50 flex h-4 cursor-move select-none justify-center p-2 pb-6 ${dragButtonClassName}`}
                onDragStart={(e) => e.preventDefault()}
                onMouseDown={dragModalMouse}
                onTouchStart={dragModalTouch}
              >
                <div className="h-1 w-8 rounded-full bg-zinc-600" />
              </div>
            )}
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
