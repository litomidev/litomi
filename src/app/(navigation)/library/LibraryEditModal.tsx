'use client'

import { Check } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'

import IconSpinner from '@/components/icons/IconSpinner'
import IconX from '@/components/icons/IconX'
import Modal from '@/components/ui/Modal'
import { MAX_LIBRARY_DESCRIPTION_LENGTH, MAX_LIBRARY_NAME_LENGTH } from '@/constants/policy'
import useActionResponse, { getFieldError, getFormField } from '@/hook/useActionResponse'

import { updateLibrary } from './action'

const DEFAULT_ICONS = ['📚', '❤️', '⭐', '📖', '🔖', '📌', '💾', '🗂️']

type Library = {
  id: number
  name: string
  description: string | null
  color: string | null
  icon: string | null
}

type Props = {
  library: Library
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LibraryEditModal({ library, open, onOpenChange }: Readonly<Props>) {
  const formRef = useRef<HTMLFormElement>(null)

  const [response, dispatchAction, isPending] = useActionResponse({
    action: updateLibrary,
    onSuccess: () => {
      toast.success('서재가 수정됐어요')
      onOpenChange(false)
    },
    onError: (error) => {
      if (typeof error === 'string') {
        toast.error(error)
      }
    },
  })

  const nameError = getFieldError(response, 'name')
  const descriptionError = getFieldError(response, 'description')
  const nameValue = getFormField(response, 'name') || library.name
  const descriptionValue = getFormField(response, 'description') || library.description || ''
  const colorValue = getFormField(response, 'color') || library.color || '#6366f1'
  const iconValue = getFormField(response, 'icon') || library.icon || '📚'

  function handleIconClick(emoji: string) {
    if (!formRef.current) {
      return
    }

    formRef.current.icon.value = emoji
    const buttons = formRef.current.querySelectorAll('[name="icon-button"]')

    for (const button of buttons) {
      const buttonElement = button as HTMLButtonElement
      buttonElement.setAttribute('aria-pressed', buttonElement.dataset.icon === emoji ? 'true' : 'false')
    }
  }

  return (
    <Modal
      className="fixed inset-0 z-50 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
        sm:w-full sm:max-w-md sm:max-h-[calc(100dvh-4rem)] 
        bg-zinc-900 sm:border sm:border-zinc-800 sm:rounded-xl flex flex-col overflow-hidden"
      onClose={() => onOpenChange(false)}
      open={open}
    >
      <form action={dispatchAction} className="flex flex-col h-full min-h-0" ref={formRef}>
        <input name="library-id" type="hidden" value={library.id} />

        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-zinc-100">서재 수정</h2>
          <button
            className="p-2 hover:bg-zinc-800 rounded-lg transition"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <IconX className="w-5 text-zinc-400" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 grid gap-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5" htmlFor="library-name">
                이름
              </label>
              <input
                aria-invalid={Boolean(nameError)}
                className="w-full px-3 py-2 bg-zinc-800 border rounded-lg 
                focus:outline-none focus:ring-2 focus:border-transparent
                aria-invalid:border-red-500 aria-invalid:focus:ring-red-500
                border-zinc-700 focus:ring-zinc-600"
                defaultValue={nameValue}
                disabled={isPending}
                id="library-name"
                maxLength={MAX_LIBRARY_NAME_LENGTH}
                name="name"
                placeholder="서재 이름"
                required
                type="text"
              />
              <p aria-invalid={Boolean(nameError)} className="text-xs mt-1 text-zinc-500 aria-invalid:text-red-400">
                {nameError || `서재 이름을 입력해주세요 (최대 ${MAX_LIBRARY_NAME_LENGTH}자)`}
              </p>
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5" htmlFor="library-description">
                설명 (선택)
              </label>
              <textarea
                aria-invalid={Boolean(descriptionError)}
                className="w-full px-3 py-2 bg-zinc-800 border rounded-lg 
                focus:outline-none focus:ring-2 focus:border-transparent
                resize-none aria-invalid:border-red-500 aria-invalid:focus:ring-red-500
                border-zinc-700 focus:ring-zinc-600"
                defaultValue={descriptionValue}
                disabled={isPending}
                id="library-description"
                maxLength={MAX_LIBRARY_DESCRIPTION_LENGTH + 1}
                name="description"
                placeholder="서재 설명"
                rows={3}
              />
              <p
                aria-invalid={Boolean(descriptionError)}
                className="text-xs mt-1 text-zinc-500 aria-invalid:text-red-400"
              >
                {descriptionError || `서재에 대한 설명을 추가할 수 있어요 (최대 ${MAX_LIBRARY_DESCRIPTION_LENGTH}자)`}
              </p>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5" htmlFor="library-color">
                색상
              </label>
              <input
                className="h-10 w-20 p-1 bg-zinc-800 border border-zinc-700 rounded cursor-pointer"
                defaultValue={colorValue}
                disabled={isPending}
                id="library-color"
                name="color"
                type="color"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">아이콘</label>
              <input defaultValue={iconValue} name="icon" type="hidden" />
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {DEFAULT_ICONS.map((emoji) => (
                  <button
                    aria-pressed={emoji === iconValue}
                    className="p-1 rounded-lg flex items-center justify-center text-lg transition aria-pressed:bg-zinc-700 aria-pressed:ring-2 aria-pressed:ring-zinc-500 bg-zinc-800 hover:bg-zinc-700"
                    data-icon={emoji}
                    disabled={isPending}
                    key={emoji}
                    name="icon-button"
                    onClick={() => handleIconClick(emoji)}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div className="flex gap-3 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-zinc-900 border-t border-zinc-800 flex-shrink-0">
          <button
            className="flex-1 h-10 px-4 rounded-lg bg-zinc-800 text-zinc-300 font-medium 
              hover:bg-zinc-700 transition disabled:opacity-50"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            type="button"
          >
            취소
          </button>
          <button
            className="flex-1 h-10 px-4 rounded-lg bg-brand-end text-background font-semibold
              hover:bg-brand-end/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={isPending}
            type="submit"
          >
            {isPending ? <IconSpinner className="size-4" /> : <Check className="size-4" />}
            <span>수정하기</span>
          </button>
        </div>
      </form>
    </Modal>
  )
}
