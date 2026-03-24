'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { lightTheme, darkTheme, type Theme } from '@/lib/design'

interface ThemeContextValue {
  dark:   boolean
  toggle: () => void
  theme:  Theme
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false)

  // Застосовуємо bgStyle до <html>
  const applyTheme = (isDark: boolean) => {
    const theme = isDark ? darkTheme : lightTheme
    const html = document.documentElement

    if (isDark) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }

    // Застосовуємо фон через style attribute
    html.style.cssText = theme.bgStyle
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
      .join(' ')

    // Мінімальна висота щоб фон покривав всю сторінку
    html.style.minHeight = '100vh'
  }

  useEffect(() => {
    const saved = localStorage.getItem('tlp-dark')
    const isDark = saved === 'true'
    setDark(isDark)
    applyTheme(isDark)
  }, [])

  const toggle = () => {
    setDark(prev => {
      const next = !prev
      localStorage.setItem('tlp-dark', String(next))
      applyTheme(next)
      return next
    })
  }

  const theme = dark ? darkTheme : lightTheme

  return (
    <ThemeContext.Provider value={{ dark, toggle, theme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
