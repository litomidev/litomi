'use client'

import { useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import IconFilter from '@/components/icons/IconFilter'
import IconSearch from '@/components/icons/IconSearch'
import IconSpinner from '@/components/icons/IconSpinner'
import { QueryKeys } from '@/constants/query'
import { CensorshipKey } from '@/database/enum'
import useActionResponse from '@/hook/useActionResponse'
import useInfiniteScrollObserver from '@/hook/useInfiniteScrollObserver'
import useCensorshipsInfiniteQuery from '@/query/useCensorshipInfiniteQuery'

import { deleteCensorships } from './action'
import CensorshipCard, { CensorshipCardSkeleton } from './CensorshipCard'
import CensorshipCreationBar from './CensorshipCreationBar'
import CensorshipStats from './CensorshipStats'
import { CENSORSHIP_KEY_LABELS } from './constants'
import DefaultCensorshipInfo from './DefaultCensorshipInfo'

const ImportExportModal = dynamic(() => import('./ImportExportModal'))

export default function Censorships() {
  const queryClient = useQueryClient()
  const [showImportExportModal, setShowImportExportModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterKey, setFilterKey] = useState<CensorshipKey | null>(null)
  const [selectedIds, setSelectedIds] = useState(new Set<number>())
  const [deletingIds, setDeletingIds] = useState(new Set<number>())
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useCensorshipsInfiniteQuery()

  const [__, dispatchDeleteAction] = useActionResponse({
    action: deleteCensorships,
    onSuccess: (deletedIds) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.censorships })
      toast.success(`${deletedIds?.length ?? 0}개의 검열 규칙을 삭제했어요`)
      setSelectedIds(new Set())
      setDeletingIds(new Set())
    },
  })

  const loadMoreRef = useInfiniteScrollObserver({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  const allCensorships = useMemo(() => data?.pages.flatMap((page) => page.censorships) ?? [], [data])

  const filteredCensorships = useMemo(() => {
    return allCensorships.filter((censorship) => {
      const matchesSearch = censorship.value.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterKey === null || censorship.key === filterKey
      return matchesSearch && matchesFilter
    })
  }, [allCensorships, searchQuery, filterKey])

  const handleCloseImportExportModal = useCallback(() => {
    setShowImportExportModal(false)
  }, [])

  const handleToggleSelect = (id: number) => {
    const newSelectedIds = new Set(selectedIds)
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id)
    } else {
      newSelectedIds.add(id)
    }
    setSelectedIds(newSelectedIds)
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return

    setDeletingIds(new Set(selectedIds))
    const formData = new FormData()
    selectedIds.forEach((id) => formData.append('id', id.toString()))
    dispatchDeleteAction(formData)
  }

  const isDeleting = deletingIds.size > 0

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Header - Always visible to prevent layout shift */}
      <div className="border-b-2">
        <div className="p-3 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">검열 설정</h2>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition border-2 disabled:opacity-50"
                disabled={isLoading || isDeleting}
                onClick={() => setShowImportExportModal(true)}
                title="가져오기/내보내기"
              >
                <MoreHorizontal className="w-4" />
              </button>
            </div>
          </div>

          {/* Quick Add Bar - Primary way to add censorships */}
          <CensorshipCreationBar />

          {/* Search and Filter - Always visible */}
          <div className="flex gap-2 my-4">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 text-zinc-400" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 rounded-lg border-2 focus:border-zinc-600 outline-none transition disabled:opacity-50"
                disabled={isLoading || isDeleting}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색..."
                type="text"
                value={searchQuery}
              />
            </div>
            <div className="bg-zinc-800 rounded-lg border-2 flex items-center">
              <select
                className="pl-4 mr-2 py-2 focus:border-zinc-600 transition disabled:opacity-50"
                disabled={isLoading || isDeleting}
                onChange={(e) => setFilterKey(e.target.value === '' ? null : Number(e.target.value))}
                value={filterKey ?? ''}
              >
                <option value="">모든 유형</option>
                {Object.entries(CENSORSHIP_KEY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selection Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg mb-4">
              <span className="text-sm">{selectedIds.size}개 선택됨</span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-sm bg-zinc-700 hover:bg-zinc-600 rounded transition disabled:opacity-50"
                  disabled={isDeleting}
                  onClick={() => setSelectedIds(new Set())}
                >
                  선택 해제
                </button>
                <button
                  className="px-3 min-w-12 py-1 text-sm bg-red-600 hover:bg-red-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={isDeleting}
                  onClick={handleBulkDelete}
                >
                  {isDeleting ? <IconSpinner className="w-3" /> : '삭제'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <CensorshipStats censorships={allCensorships} />
      </div>

      <DefaultCensorshipInfo />

      <div className="flex-1 px-4 pb-4 min-h-72">
        {isLoading ? (
          <div className="grid gap-3">
            <CensorshipCardSkeleton />
            <CensorshipCardSkeleton />
            <CensorshipCardSkeleton />
          </div>
        ) : filteredCensorships.length === 0 ? (
          <div className="text-center py-12">
            <IconFilter className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-400">
              {searchQuery || filterKey !== null ? '검색 결과가 없습니다' : '아직 검열 규칙이 없습니다'}
            </p>
            {!searchQuery && filterKey === null && (
              <p className="text-zinc-500 text-sm mt-2">위의 입력창에 검열할 키워드를 입력하세요</p>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredCensorships.map((censorship) => (
              <CensorshipCard
                censorship={censorship}
                isDeleting={deletingIds.has(censorship.id)}
                isSelected={selectedIds.has(censorship.id)}
                key={censorship.id}
                onToggleSelect={() => {
                  if (!isDeleting) {
                    handleToggleSelect(censorship.id)
                  }
                }}
              />
            ))}
            {hasNextPage && (
              <div className="py-4" ref={loadMoreRef}>
                {isFetchingNextPage ? <CensorshipCardSkeleton /> : <div className="h-1" />}
              </div>
            )}
          </div>
        )}
      </div>

      <ImportExportModal
        censorships={allCensorships}
        onClose={handleCloseImportExportModal}
        open={showImportExportModal && !isDeleting}
      />
    </div>
  )
}
