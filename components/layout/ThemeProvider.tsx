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
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('tlp-dark')
    if (saved === null) {
      // Перший візит — dark за замовчуванням
      setDark(true)
      document.documentElement.classList.add('dark')
      localStorage.setItem('tlp-dark', 'true')
    } else {
      const isDark = saved === 'true'
      setDark(isDark)
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  const toggle = () => {
    setDark(prev => {
      const next = !prev
      localStorage.setItem('tlp-dark', String(next))
      if (next) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return next
    })
  }

  const theme = dark ? darkTheme : lightTheme

  useEffect(() => {
    document.documentElement.style.background = theme.bg
  }, [theme.bg])

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
