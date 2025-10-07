'use client'

import { Clock, X, X as XIcon } from 'lucide-react'
import { ReadonlyURLSearchParams, usePathname, useRouter } from 'next/navigation'
import { FormEvent, memo, useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'

import IconSpinner from '@/components/icons/IconSpinner'
import Toggle from '@/components/ui/Toggle'
import { MAX_SEARCH_QUERY_LENGTH } from '@/constants/policy'

import { type SearchSuggestion } from './constants'
import SuggestionDropdown from './SuggestionDropdown'
import UpdateFromSearchParams from './UpdateFromSearchParams'
import useRecentSearches from './useRecentSearches'
import useSearchSuggestions from './useSearchSuggestions'
import { getWordAtCursor, translateKoreanToEnglish } from './utils'

type Props = {
  className?: string
}

export default memo(SearchForm)

function SearchForm({ className = '' }: Readonly<Props>) {
  const router = useRouter()
  const pathname = usePathname()
  const [keyword, setKeyword] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [isSearching, startSearching] = useTransition()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const currentWordInfo = useMemo(() => getWordAtCursor(keyword, cursorPosition), [keyword, cursorPosition])
  const { recentSearches, isEnabled, saveRecentSearch, removeRecentSearch, toggleEnabled } = useRecentSearches()

  const { selectedIndex, searchSuggestions, resetSelection, navigateSelection, isLoading, isFetching } =
    useSearchSuggestions({ keyword: currentWordInfo.word.replace(/^-/g, '') })

  const selectSuggestion = useCallback(
    (suggestion: SearchSuggestion) => {
      const before = keyword.slice(0, currentWordInfo.start)
      const after = keyword.slice(currentWordInfo.end)
      const newKeyword = before + suggestion.value + after
      const newCursorPosition = currentWordInfo.start + suggestion.value.length

      setKeyword(newKeyword)
      setCursorPosition(newCursorPosition)
      setShowSuggestions(false)
      resetSelection()
      inputRef.current?.focus()

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = newCursorPosition
        }
      }, 0)
    },
    [keyword, currentWordInfo, setShowSuggestions, resetSelection],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || searchSuggestions.length === 0) {
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        navigateSelection('down')
        break
      case 'ArrowUp':
        e.preventDefault()
        navigateSelection('up')
        break
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault()
          selectSuggestion(searchSuggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        resetSelection()
        break
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const position = e.target.selectionStart || 0

    setKeyword(value)
    setCursorPosition(position)
    setShowSuggestions(true)
    resetSelection()
  }

  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement
    setCursorPosition(target.selectionStart || 0)
  }

  const handleFocus = () => {
    setShowSuggestions(true)
    resetSelection()

    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || 0)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!suggestionsRef.current?.contains(e.relatedTarget)) {
      setTimeout(() => {
        resetSelection()
      }, 300)
    }
  }

  const handleClear = () => {
    setKeyword('')
    setCursorPosition(0)
    resetSelection()
    inputRef.current?.focus()
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)

    const params = new URLSearchParams(window.location.search)

    if (keyword.trim()) {
      const convertedQuery = keyword.trim()
      const translatedKeyword = translateKoreanToEnglish(convertedQuery)
      const finalQuery = translatedKeyword || convertedQuery
      params.set('query', finalQuery)
      saveRecentSearch(finalQuery)
    } else {
      params.delete('query')
    }

    startSearching(() => {
      router.push(`${pathname}?${params}`)
    })
  }

  const handleSearchParamUpdate = useCallback((searchParams: ReadonlyURLSearchParams) => {
    const query = searchParams.get('query') ?? ''
    setKeyword(query)
    setCursorPosition(query.length)
  }, [])

  // NOTE: "/" 키보드 단축키로 검색 입력창에 포커스
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return

      if (e.key === '/') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  // NOTE: 외부 영역 클릭 시 검색어 제안 창 닫기
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [setShowSuggestions])

  return (
    <div className={`relative ${className}`}>
      <UpdateFromSearchParams onUpdate={handleSearchParamUpdate} />
      <form
        className="flex bg-zinc-900 border-2 border-zinc-700 rounded-xl text-zinc-400 overflow-hidden transition
        hover:border-zinc-500 focus-within:border-zinc-400"
        onSubmit={onSubmit}
      >
        <div className="relative flex-1">
          <input
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-label="검색어 입력"
            autoCapitalize="off"
            autoComplete="off"
            className="bg-transparent px-3 py-2 pr-8 text-foreground min-w-0 w-full placeholder-zinc-500 text-base
            focus:outline-none
            [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none
            [&::-ms-clear]:hidden [&::-ms-clear]:w-0 [&::-ms-clear]:h-0"
            maxLength={MAX_SEARCH_QUERY_LENGTH}
            name="query"
            onBlur={handleBlur}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            placeholder="/ 키를 눌러 검색하기"
            ref={inputRef}
            type="search"
            value={keyword}
          />
          {keyword && (
            <button
              aria-label="검색어 지우기"
              className="absolute right-0 top-0 bottom-0 p-2 shrink-0 transition duration-200 text-zinc-500 
              hover:text-zinc-300 active:text-zinc-400"
              onClick={handleClear}
              type="button"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
        <button
          aria-label="검색하기"
          className="flex items-center justify-center p-2 px-4 shrink-0 font-medium rounded-l-none transition duration-200
          aria-disabled:opacity-60 bg-zinc-800 text-zinc-200 
          active:bg-zinc-800 hover:bg-zinc-700 hover:text-white
          focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-inset"
          disabled={isSearching}
          type="submit"
        >
          {isSearching ? <IconSpinner className="w-5 mx-1" /> : <span className="block min-w-7">검색</span>}
        </button>
      </form>
      <SuggestionDropdown
        dropdownRef={suggestionsRef}
        header={
          keyword === '' && (
            <div className="border-b border-zinc-800">
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Clock className="size-3" />
                  <span>최근 검색어</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-zinc-500">자동 저장</span>
                  <Toggle
                    aria-label="최근 검색 자동 저장"
                    checked={isEnabled}
                    className="w-10 peer-checked:bg-brand-end/80"
                    onToggle={toggleEnabled}
                  />
                </label>
              </div>
              {isEnabled && recentSearches.length === 0 && (
                <div className="p-2.5 text-center text-sm text-zinc-500">최근 검색어가 여기에 표시됩니다</div>
              )}
              {!isEnabled && (
                <div className="p-2.5 text-center text-sm text-zinc-500">최근 검색 저장이 비활성화되어 있습니다</div>
              )}
              {isEnabled &&
                recentSearches.map((search) => (
                  <div
                    className="w-full flex items-center hover:bg-zinc-700/50 transition group"
                    key={search.timestamp}
                  >
                    <button
                      className="flex-1 p-4 py-2.5 text-left text-sm"
                      onClick={() => {
                        setKeyword(search.query)
                        setCursorPosition(search.query.length)
                        inputRef.current?.focus()
                      }}
                      type="button"
                    >
                      {search.query}
                    </button>
                    <button
                      aria-label={`${search.query} 삭제`}
                      className="transition p-3 text-zinc-500 hover:text-red-400"
                      onClick={() => {
                        removeRecentSearch(search.query)
                        inputRef.current?.focus()
                      }}
                      type="button"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </div>
                ))}
            </div>
          )
        }
        isFetching={isFetching}
        isLoading={isLoading}
        onSelect={selectSuggestion}
        renderRightContent={({ value }) =>
          value.endsWith(':') && (
            <span className="text-xs text-zinc-400 bg-zinc-700/50 px-1.5 py-0.5 rounded">접두사</span>
          )
        }
        searchTerm={currentWordInfo.word}
        selectedIndex={selectedIndex}
        showSuggestions={showSuggestions}
        suggestions={searchSuggestions}
      />
    </div>
  )
}
