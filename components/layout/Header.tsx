'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
import { typography } from '@/lib/design'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/trades',    label: 'Журнал' },
  { href: '/ai',        label: 'AI Coach' },
  { href: '/analytics', label: 'Аналитика' },
  { href: '/settings',  label: 'Настройки' },
]

interface HeaderProps {
  plan?: 'free' | 'pro'
}

export function Header({ plan = 'free' }: HeaderProps) {
  const { theme, dark, toggle } = useTheme()
  const c = theme
  const pathname = usePathname()

  return (
    <header style={{
      background:     c.surface,
      borderBottom:   `1px solid ${c.border}`,
      position:       'sticky',
      top:            0,
      zIndex:         100,
      backdropFilter: 'blur(20px)',
      fontFamily:     typography.fontFamily,
    }}>
      <div style={{
        maxWidth:   1200,
        margin:     '0 auto',
        padding:    '0 24px',
        height:     56,
        display:    'flex',
        alignItems: 'center',
        gap:        8,
      }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px', color: c.text }}>
            TradeLog <span style={{ color: '#30d158' }}>Pro</span>
          </span>
        </Link>

        <span style={{ fontSize: 11, color: c.text3, marginTop: 1 }}>
          by dnproduction
        </span>

        <nav style={{ display: 'flex', gap: 4, marginLeft: 20 }}>
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <span style={{
                  display:      'inline-block',
                  background:   active ? c.text : 'transparent',
                  color:        active ? c.surface : c.text3,
                  borderRadius: 10,
                  padding:      '6px 14px',
                  fontSize:     14,
                  fontWeight:   600,
                  cursor:       'pointer',
                  transition:   'all .15s',
                }}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {plan === 'pro' && (
            <span style={{
              fontSize: 12, color: '#30d158', fontWeight: 600,
              background: '#30d15818', padding: '4px 10px', borderRadius: 20,
            }}>PRO</span>
          )}
          {plan === 'free' && (
            <Link href="/settings" style={{ textDecoration: 'none' }}>
              <span style={{
                fontSize: 12, color: '#ff9f0a', fontWeight: 600,
                background: '#ff9f0a18', padding: '4px 10px', borderRadius: 20,
              }}>FREE → Upgrade</span>
            </Link>
          )}
          <button onClick={toggle} style={{
            background:   c.surface2,
            border:       `1px solid ${c.border}`,
            borderRadius: 20,
            padding:      '6px 14px',
            cursor:       'pointer',
            fontSize:     13,
            color:        c.text,
            fontFamily:   typography.fontFamily,
          }}>
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  )
}