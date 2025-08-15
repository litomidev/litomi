'use client'

import { useMemo, useRef, useState } from 'react'

import { BLIND_TAG_VALUE_TO_LABEL, BLIND_TAG_VALUES, DEFAULT_SUGGESTIONS } from '@/constants/json'
import { MAX_SEARCH_SUGGESTIONS, SUGGESTION_DEBOUNCE_MS } from '@/constants/policy'
import useDebouncedValue from '@/hook/useDebouncedValue'

import useCensorshipSuggestionsQuery from './useCensorshipSuggestionsQuery'

export type CensorshipSuggestion = {
  value: string
  label: string
}

const INITIAL_SELECTED_INDEX = -1

const BLIND_TAG_SUGGESTIONS: CensorshipSuggestion[] = BLIND_TAG_VALUES.map((value) => ({
  value,
  label: BLIND_TAG_VALUE_TO_LABEL[value],
}))

const CENSORSHIP_PREFIX_SET = new Set([
  'artist:',
  'character:',
  'female:',
  'group:',
  'male:',
  'mixed:',
  'other:',
  'series:',
  'type:',
])

type Props = {
  inputValue: string
  cursorPosition: number
}

export default function useCensorshipSuggestions({ inputValue, cursorPosition }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(INITIAL_SELECTED_INDEX)

  const currentWord = useMemo(() => {
    if (!inputValue) return { word: '', start: 0, end: 0 }

    const lastComma = inputValue.lastIndexOf(',', cursorPosition - 1)
    const nextComma = inputValue.indexOf(',', cursorPosition)
    const start = lastComma + 1
    const end = nextComma === -1 ? inputValue.length : nextComma
    const segment = inputValue.slice(start, end)
    const trimStart = segment.length - segment.trimStart().length

    return {
      word: segment.trim().toLowerCase(),
      start: start + trimStart,
      end,
    }
  }, [inputValue, cursorPosition])

  const debouncedWord = useDebouncedValue({
    value: currentWord.word,
    delay: SUGGESTION_DEBOUNCE_MS,
  })

  const { data: apiSuggestions = [], isLoading, isFetching } = useCensorshipSuggestionsQuery({ query: debouncedWord })
  const cachedSuggestionsRef = useRef(DEFAULT_SUGGESTIONS.slice(0, MAX_SEARCH_SUGGESTIONS))

  const suggestions = useMemo(() => {
    if (!debouncedWord) {
      return cachedSuggestionsRef.current
    }

    const seenValues = new Set<string>()
    const results: CensorshipSuggestion[] = []

    const matchesSearch = (s: CensorshipSuggestion): boolean => {
      if (s.value.includes(debouncedWord)) return true
      return s.label.includes(debouncedWord)
    }

    // Helper for adding unique suggestions - O(1) per check
    const addUnique = (suggestion: CensorshipSuggestion): boolean => {
      if (seenValues.has(suggestion.value)) return false
      if (results.length >= MAX_SEARCH_SUGGESTIONS) return false

      seenValues.add(suggestion.value)
      results.push(suggestion)
      return true
    }

    // Helper to check if value has censorship prefix - O(k) where k is prefix length (max 10)
    const hasCensorshipPrefix = (value: string): boolean => {
      const colonIndex = value.indexOf(':')
      if (colonIndex === -1) return false
      return CENSORSHIP_PREFIX_SET.has(value.slice(0, colonIndex + 1))
    }

    // 1. Add matching blind tags first (priority) - O(b) where b = blind tags count
    for (const blindTag of BLIND_TAG_SUGGESTIONS) {
      if (matchesSearch(blindTag)) {
        if (!addUnique(blindTag)) break // Stop if we hit the limit
      }
    }

    // 2. Filter and add API suggestions - O(a) where a = api suggestions count
    if (results.length < MAX_SEARCH_SUGGESTIONS) {
      for (const suggestion of apiSuggestions) {
        // Quick rejection checks before expensive operations
        if (!matchesSearch(suggestion)) continue

        // Check if it's a valid censorship suggestion
        const hasPrefix = hasCensorshipPrefix(suggestion.value)
        const isTag = !hasPrefix && !suggestion.value.includes(':') && suggestion.label.includes(':')

        if (hasPrefix || isTag) {
          if (!addUnique(suggestion)) break // Stop if we hit the limit
        }
      }
    }

    if (results.length > 0) {
      cachedSuggestionsRef.current = results
    }

    return cachedSuggestionsRef.current
  }, [debouncedWord, apiSuggestions])

  const navigateSelection = (direction: 'down' | 'up') => {
    const len = suggestions.length
    if (len === 0) return

    setSelectedIndex((prev) => {
      if (direction === 'down') {
        return prev === len - 1 ? 0 : prev + 1
      } else {
        return prev <= 0 ? len - 1 : prev - 1
      }
    })
  }

  const selectSuggestion = (suggestion: CensorshipSuggestion): string => {
    const before = inputValue.slice(0, currentWord.start)
    const after = inputValue.slice(currentWord.end)
    const needsSpace = before.length > 0 && !before.endsWith(' ')
    return before + (needsSpace ? ' ' : '') + suggestion.value + after
  }

  return {
    suggestions,
    selectedIndex,
    setSelectedIndex,
    resetSelection: () => setSelectedIndex(INITIAL_SELECTED_INDEX),
    navigateSelection,
    selectSuggestion,
    currentWord,
    debouncedWord,
    isLoading,
    isFetching,
  }
}
