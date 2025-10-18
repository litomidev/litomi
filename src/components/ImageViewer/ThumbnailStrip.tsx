'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { memo, useCallback, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

import { ImageVariant } from '@/types/manga'

import MangaImage from '../MangaImage'
import { useImageIndexStore } from './store/imageIndex'
import { usePageViewStore } from './store/pageView'
import { useVirtualScrollStore } from './store/virtualizer'

type Props = {
  images: (ImageVariant | undefined)[]
}

export default memo(ThumbnailStrip)

function ThumbnailStrip({ images }: Props) {
  const { imageIndex, navigateToImageIndex } = useImageIndexStore()
  const pageView = usePageViewStore((state) => state.pageView)
  const scrollToRow = useVirtualScrollStore((state) => state.scrollToRow)
  const isDoublePage = pageView === 'double'
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { ref: firstImageRef, inView: isFirstImageInView } = useInView()
  const { ref: lastImageRef, inView: isLastImageInView } = useInView()

  const handleThumbnailClick = useCallback(
    (index: number) => {
      navigateToImageIndex(index)
      scrollToRow(isDoublePage ? Math.floor(index / 2) : index)
    },
    [isDoublePage, navigateToImageIndex, scrollToRow],
  )

  function scrollLeft() {
    const container = scrollContainerRef.current
    if (container) {
      const scrollAmount = container.clientWidth * 0.8
      container.scrollTo({
        left: container.scrollLeft - scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  function scrollRight() {
    const container = scrollContainerRef.current
    if (container) {
      const scrollAmount = container.clientWidth * 0.8
      container.scrollTo({
        left: container.scrollLeft + scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="relative overflow-hidden">
      <button
        aria-hidden={isFirstImageInView}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-r-lg bg-background/90 transition hover:bg-background
        aria-hidden:opacity-0 aria-hidden:pointer-events-none"
        onClick={scrollLeft}
      >
        <ChevronLeft className="size-5 stroke-3" />
      </button>
      <button
        aria-hidden={isLastImageInView}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-l-lg bg-background/90 transition hover:bg-background
        aria-hidden:opacity-0 aria-hidden:pointer-events-none"
        onClick={scrollRight}
      >
        <ChevronRight className="size-5 stroke-3" />
      </button>
      <div
        className="flex gap-1 p-2 pb-4 overscroll-none overflow-x-auto scrollbar-hidden"
        onWheel={(e) => e.stopPropagation()}
        ref={scrollContainerRef}
      >
        {images.map((image, i) => {
          const isActive = i === imageIndex
          const isSecondaryActive = isDoublePage && i === imageIndex + 1

          return (
            <button
              aria-current={isActive || isSecondaryActive}
              className="relative flex-shrink-0 w-16 h-20 rounded overflow-hidden border-2 transition 
              aria-current:border-foreground aria-current:scale-105 active:scale-95 hover:ring-2"
              key={i}
              onClick={() => handleThumbnailClick(i)}
              ref={i === 0 ? firstImageRef : i === images.length - 1 ? lastImageRef : undefined}
            >
              {image ? (
                <MangaImage
                  className="w-full h-full object-cover"
                  fetchPriority={i > imageIndex - 3 && i <= imageIndex + 3 ? undefined : 'low'}
                  imageIndex={i}
                  src={image.url}
                />
              ) : (
                <div className="w-full h-full bg-zinc-800" />
              )}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-lg bg-background/80 text-xs text-center p-2 py-0.5">
                {i + 1}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
