'use client'

import { Check } from 'lucide-react'
import { memo } from 'react'

import MangaCard from '@/components/card/MangaCard'
import { Manga } from '@/types/manga'

import { useLibrarySelectionStore } from './[id]/librarySelection'

type Props = {
  index: number
  manga: Manga
}

export default memo(SelectableMangaCard)

function SelectableMangaCard({ index, manga }: Readonly<Props>) {
  const { selectedItems, toggleSelection } = useLibrarySelectionStore()
  const isSelected = selectedItems.has(manga.id)

  return (
    <div
      aria-selected={isSelected}
      className="relative cursor-pointer aria-selected:ring-2 aria-selected:ring-brand-end rounded-xl overflow-hidden"
      onClick={() => toggleSelection(manga.id)}
    >
      <div className="absolute top-2 left-2 z-10 size-5 flex items-center justify-center rounded border-2 border-white bg-zinc-900/80">
        {isSelected && <Check className="size-4" />}
      </div>
      <MangaCard className="h-full pointer-events-none" index={index} manga={manga} />
    </div>
  )
}
