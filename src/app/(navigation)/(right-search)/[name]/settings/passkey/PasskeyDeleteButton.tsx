'use client'
import { useState } from 'react'
import { toast } from 'sonner'

import IconShield from '@/components/icons/IconShield'
import IconSpinner from '@/components/icons/IconSpinner'
import IconTrash from '@/components/icons/IconTrash'
import Modal from '@/components/ui/Modal'
import useActionResponse from '@/hook/useActionResponse'

import { deleteCredential } from './action-delete'

type Props = {
  id: number
  className?: string
  onCancel?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function PasskeyDeleteButton({ id, className, onCancel, open, onOpenChange }: Readonly<Props>) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const setIsOpen = (value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value)
    }
    onOpenChange?.(value)
  }

  function handleCancel() {
    setIsOpen(false)
    onCancel?.()
  }

  const [_, dispatchAction, isPending] = useActionResponse({
    action: deleteCredential,
    onSuccess: (data) => {
      toast.success(data)
      setIsOpen(false)
    },
  })

  return (
    <>
      {!isControlled && (
        <button aria-label="패스키 삭제" className={className} onClick={() => setIsOpen(true)} type="button">
          <IconTrash className="w-5" />
        </button>
      )}
      <Modal
        className="w-[90vw] max-w-sm rounded-xl bg-zinc-900 border border-zinc-800"
        onClose={handleCancel}
        open={isOpen}
      >
        <div className="p-5 relative">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="mb-3 h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center">
              <IconShield className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-1">패스키 삭제</h2>
            <p className="text-sm text-zinc-500">
              이 패스키를 삭제하면 다시 등록해야 해요. 삭제된 패스키는 복구할 수 없어요.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="flex-1 h-10 px-4 rounded-lg bg-zinc-800 text-zinc-300 font-medium disabled:opacity-50"
              disabled={isPending}
              onClick={handleCancel}
              type="button"
            >
              취소
            </button>
            <form action={dispatchAction} className="flex-1">
              <input name="credential-id" type="hidden" value={id} />
              <button
                className="flex items-center justify-center w-full h-10 px-4 rounded-lg bg-red-600 text-white font-medium disabled:opacity-70 relative"
                disabled={isPending}
                type="submit"
              >
                {isPending ? <IconSpinner className="size-6" /> : '삭제'}
              </button>
            </form>
          </div>
        </div>
      </Modal>
    </>
  )
}
