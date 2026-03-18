'use client'

import { useState, useEffect, useCallback } from 'react'
import { translations, type Locale, type TranslationKey } from '@/lib/i18n'

export function useLocale() {
  const [locale, setLocale] = useState<Locale>('uk')

  useEffect(() => {
    const saved = localStorage.getItem('tlp-locale') as Locale
    if (saved === 'en' || saved === 'uk') setLocale(saved)
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(prev => {
      const next = prev === 'uk' ? 'en' : 'uk'
      localStorage.setItem('tlp-locale', next)
      return next
    })
  }, [])

  const t = useCallback((key: TranslationKey): string => {
    return translations[locale][key] ?? translations.uk[key] ?? key
  }, [locale])

  return { locale, toggleLocale, t }
}
