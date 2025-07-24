import 'server-only'

import characterTranslationJSON from '@/translation/character.json'

import { Multilingual, translateValue } from './common'

const CHARACTER_TRANSLATION: Record<string, Multilingual> = characterTranslationJSON

/**
 * Get all characters with their translations as value/label pairs for search suggestions
 */
export function getAllCharactersWithLabels() {
  return Object.entries(CHARACTER_TRANSLATION).map(([key, translations]) => ({
    value: `character:${key}`,
    labels: {
      ko: `캐릭터:${translations.ko || translations.en || key.replace(/_/g, ' ')}`,
      en: `character:${translations.en || key.replace(/_/g, ' ')}`,
      ja: translations.ja ? `キャラクター:${translations.ja}` : undefined,
      'zh-CN': translations['zh-CN'] ? `角色:${translations['zh-CN']}` : undefined,
      'zh-TW': translations['zh-TW'] ? `角色:${translations['zh-TW']}` : undefined,
    },
  }))
}

export function translateCharacterList(characterList: string[] | undefined, locale: keyof Multilingual) {
  return characterList?.map((character) => ({
    value: character,
    label: translateValue(CHARACTER_TRANSLATION, character, locale),
  }))
}
