'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { GETLibraryResponse } from '@/app/api/library/route'
import IconPlus from '@/components/icons/IconPlus'
import IconSpinner from '@/components/icons/IconSpinner'
import IconX from '@/components/icons/IconX'
import Modal from '@/components/ui/Modal'
import Toggle from '@/components/ui/Toggle'
import { MAX_LIBRARY_DESCRIPTION_LENGTH, MAX_LIBRARY_NAME_LENGTH } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import useActionResponse from '@/hook/useActionResponse'

import { createLibrary } from './action'

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
]

const DEFAULT_ICONS = ['📚', '❤️', '⭐', '📖', '🔖', '📌', '💾', '🗂️']

type Props = {
  className?: string
}

export default function CreateLibraryButton({ className = '' }: Readonly<Props>) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0])
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_ICONS[0])
  const [isPublic, setIsPublic] = useState(false)
  const queryClient = useQueryClient()

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedColor(DEFAULT_COLORS[0])
    setSelectedIcon(DEFAULT_ICONS[0])
    setIsPublic(false)
  }

  const [formErrors, dispatchAction, isPending] = useActionResponse({
    action: createLibrary,
    onSuccess: (newLibraryId, [formData]) => {
      queryClient.setQueryData<GETLibraryResponse>(QueryKeys.libraries, (oldData) => {
        const newLibrary = {
          id: newLibraryId,
          name: formData.get('name')?.toString() ?? '',
          description: formData.get('description')?.toString() ?? '',
          color: formData.get('color')?.toString() ?? '',
          icon: formData.get('icon')?.toString() ?? '',
          isPublic: formData.get('isPublic')?.toString() === 'true',
          itemCount: 0,
        }

        if (!oldData) {
          return { libraries: [newLibrary] }
        }

        oldData.libraries.push(newLibrary)
        return { libraries: oldData.libraries }
      })

      toast.success('서재를 생성했어요')
      handleClose()
    },
  })

  return (
    <>
      <button
        className={`flex w-full items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition
          sm:rounded sm:p-1.5 sm:hover:bg-zinc-800 sm:w-auto ${className}`}
        onClick={() => setIsModalOpen(true)}
        title="서재 만들기"
        type="button"
      >
        <IconPlus className="w-5 h-5" />
        <span className="font-medium sm:hidden">서재 만들기</span>
      </button>
      <Modal
        className="fixed inset-0 z-50 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 flex flex-col overflow-hidden
          bg-zinc-900 sm:w-full sm:max-w-lg sm:max-h-[calc(100dvh-4rem)] sm:border-2 sm:border-zinc-700 sm:rounded-xl sm:-translate-y-1/2"
        onClose={handleClose}
        open={isModalOpen}
      >
        <form action={dispatchAction} className="flex flex-col h-full min-h-0">
          <div className="flex items-center justify-between p-4 bg-zinc-900 border-b-2 border-zinc-800 flex-shrink-0">
            <h2 className="text-xl font-bold text-zinc-100">서재 만들기</h2>
            <button className="p-2 -m-1 rounded-lg hover:bg-zinc-800 transition" onClick={handleClose} type="button">
              <IconX className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 flex flex-col gap-4 min-h-0 relative">
            <div className="flex items-center justify-center p-4">
              <div
                className="size-20 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition"
                style={{ backgroundColor: selectedColor }}
              >
                {selectedIcon}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">아이콘</label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_ICONS.map((icon) => (
                  <button
                    aria-pressed={selectedIcon === icon}
                    className="p-3 rounded-lg border-2 text-2xl transition flex items-center justify-center
                      aria-pressed:bg-zinc-700 aria-pressed:border-brand-end aria-pressed:hover:bg-zinc-700
                      border-zinc-700 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isPending}
                    key={icon}
                    onClick={() => setSelectedIcon(icon)}
                    type="button"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">색상</label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    aria-pressed={selectedColor === color}
                    className="h-12 rounded-lg border-2 border-background transition aria-pressed:ring-2 aria-pressed:ring-brand-end
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isPending}
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="name">
                서재 이름
              </label>
              <input
                autoCapitalize="off"
                autoComplete="off"
                autoFocus
                className="w-full px-4 py-2 bg-zinc-800 rounded-lg border-2 border-zinc-700 focus:border-zinc-600 outline-none transition text-zinc-100 placeholder-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isPending}
                id="name"
                maxLength={MAX_LIBRARY_NAME_LENGTH}
                name="name"
                placeholder="순애작"
                required
                type="text"
              />
              {formErrors && 'name' in formErrors && (
                <p className="text-red-500 text-sm mt-1">{String(formErrors.name)}</p>
              )}
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="description">
                설명 (선택사항)
              </label>
              <textarea
                className="w-full px-4 py-3 bg-zinc-800 rounded-lg border-2 border-zinc-700 focus:border-zinc-600 outline-none transition text-zinc-100 placeholder-zinc-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isPending}
                id="description"
                maxLength={MAX_LIBRARY_DESCRIPTION_LENGTH}
                name="description"
                placeholder="달달한 순애만"
                rows={3}
              />
              {formErrors && 'description' in formErrors && (
                <p className="text-red-500 text-sm mt-1">{String(formErrors.description)}</p>
              )}
            </div>

            {/* Public Toggle */}
            <div>
              <div className="block text-sm font-medium text-zinc-300 mb-2">공개 설정</div>
              <label className="w-full block p-4 rounded-lg border-2 bg-zinc-900 border-zinc-700 hover:border-zinc-600 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-zinc-100">{isPublic ? '공개 서재' : '비공개 서재'}</div>
                    <div className="text-sm text-zinc-400">
                      {isPublic ? '다른 사용자들이 이 서재를 볼 수 있어요' : '나만 볼 수 있는 서재예요'}
                    </div>
                  </div>
                  <Toggle
                    aria-label="서재 공개 설정"
                    checked={isPublic}
                    className="w-12 peer-checked:bg-brand-end/80"
                    disabled={isPending}
                    name="is-public"
                    onToggle={setIsPublic}
                  />
                </div>
              </label>
            </div>

            {/* Hidden inputs */}
            <input name="color" type="hidden" value={selectedColor} />
            <input name="icon" type="hidden" value={selectedIcon} />
          </div>

          {/* Footer */}
          <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-zinc-900 border-t-2 border-zinc-800 flex gap-2 flex-shrink-0">
            <button
              className="flex-1 px-4 py-3 text-zinc-300 font-medium bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg transition"
              disabled={isPending}
              onClick={handleClose}
              type="button"
            >
              취소
            </button>
            <button
              className="flex-1 px-4 py-3 text-background font-semibold bg-brand-end hover:bg-brand-end/90 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg transition flex items-center justify-center gap-2"
              disabled={isPending}
              type="submit"
            >
              {isPending ? <IconSpinner className="w-5" /> : <IconPlus className="w-5" />}
              <span>생성하기</span>
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
