'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { lightTheme, darkTheme } from '@/lib/design'
const ThemeContext = createContext(null)
export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false)
  useEffect(() => { if (localStorage.getItem('tlp-dark') === 'true') setDark(true) }, [])
  const toggle = () => setDark(prev => { localStorage.setItem('tlp-dark', String(!prev)); return !prev })
  const theme = dark ? darkTheme : lightTheme
  useEffect(() => { document.documentElement.style.background = theme.bg }, [theme.bg])
  return <ThemeContext.Provider value={{ dark, toggle, theme }}>{children}</ThemeContext.Provider>
}
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
