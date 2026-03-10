'use client'

import { useState, useEffect, useCallback } from 'react'
import { translations, type Locale, type TranslationKey } from '@/lib/i18n'

export function useLocale() {
  const [locale, setLocale] = useState<Locale>('ru')

  useEffect(() => {
    const saved = localStorage.getItem('tlp-locale') as Locale
    if (saved === 'en' || saved === 'ru') setLocale(saved)
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(prev => {
      const next = prev === 'ru' ? 'en' : 'ru'
      localStorage.setItem('tlp-locale', next)
      return next
    })
  }, [])

  const t = useCallback((key: TranslationKey): string => {
    return translations[locale][key] ?? translations.ru[key] ?? key
  }, [locale])

  return { locale, toggleLocale, t }
}