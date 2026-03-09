'use client'

import { CSSProperties, ReactNode, MouseEvent } from 'react'
import { useTheme } from '@/components/layout/ThemeProvider'
import { typography, radius, scoreColor } from '@/lib/design'

// ─── CARD ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children:  ReactNode
  style?:    CSSProperties
  onClick?:  () => void
  hoverable?: boolean
  padding?:  string
}

export function Card({ children, style, onClick, hoverable, padding = '20px 22px' }: CardProps) {
  const { theme: c } = useTheme()
  return (
    <div
      onClick={onClick}
      style={{
        background:   c.surface,
        borderRadius: radius.lg,
        padding,
        boxShadow:    c.shadow,
        border:       `1px solid ${c.border}`,
        cursor:       hoverable ? 'pointer' : undefined,
        transition:   hoverable ? 'box-shadow .15s' : undefined,
        ...style,
      }}
      onMouseEnter={e => { if (hoverable) (e.currentTarget as HTMLElement).style.boxShadow = c.shadow2 }}
      onMouseLeave={e => { if (hoverable) (e.currentTarget as HTMLElement).style.boxShadow = c.shadow }}
    >
      {children}
    </div>
  )
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'ghost' | 'green' | 'red' | 'orange'

interface ButtonProps {
  children:  ReactNode
  onClick?:  () => void
  variant?:  ButtonVariant
  disabled?: boolean
  style?:    CSSProperties
  type?:     'button' | 'submit' | 'reset'
  fullWidth?: boolean
}

export function Button({
  children, onClick, variant = 'primary',
  disabled, style, type = 'button', fullWidth,
}: ButtonProps) {
  const { theme: c } = useTheme()

  const base: CSSProperties = {
    border:       'none',
    borderRadius: radius.md,
    padding:      '10px 18px',
    fontSize:     14,
    fontWeight:   600,
    cursor:       disabled ? 'not-allowed' : 'pointer',
    transition:   'opacity .15s',
    fontFamily:   typography.fontFamily,
    width:        fullWidth ? '100%' : undefined,
    opacity:      disabled ? 0.5 : 1,
  }

  const variants: Record<ButtonVariant, CSSProperties> = {
    primary: { background: c.text,      color: c.surface },
    ghost:   { background: 'transparent', color: c.text3, border: `1px solid ${c.border}` },
    green:   { background: '#30d158',   color: '#fff' },
    red:     { background: '#ff453a',   color: '#fff' },
    orange:  { background: '#ff9f0a',   color: '#fff' },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled) (e.target as HTMLElement).style.opacity = '0.75' }}
      onMouseLeave={e => { if (!disabled) (e.target as HTMLElement).style.opacity = '1' }}
    >
      {children}
    </button>
  )
}

// ─── BADGE ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: ReactNode
  color:    string
  size?:    'sm' | 'md'
}

export function Badge({ children, color, size = 'sm' }: BadgeProps) {
  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        size === 'sm' ? '2px 10px' : '4px 14px',
      borderRadius:   20,
      fontSize:       size === 'sm' ? 12 : 13,
      fontWeight:     600,
      background:     color + '22',
      color,
      fontFamily:     typography.fontFamily,
      whiteSpace:     'nowrap',
    }}>
      {children}
    </span>
  )
}

// ─── SCORE BADGE ──────────────────────────────────────────────────────────────

export function ScoreBadge({ score }: { score: number }) {
  const color = scoreColor(score)
  return (
    <div style={{
      display:     'inline-flex',
      alignItems:  'center',
      gap:         6,
      background:  color + '18',
      border:      `1px solid ${color}44`,
      borderRadius: 20,
      padding:     '3px 10px',
    }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}%</span>
    </div>
  )
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label:  string
  value:  ReactNode
  sub?:   string
  color?: string
}

export function StatCard({ label, value, sub, color }: StatCardProps) {
  const { theme: c } = useTheme()
  return (
    <Card>
      <div style={{ fontSize: 13, color: c.text3, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color ?? c.text, letterSpacing: '-0.5px' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: c.text3, marginTop: 4 }}>{sub}</div>}
    </Card>
  )
}

// ─── INPUT ────────────────────────────────────────────────────────────────────

interface InputProps {
  label?:       string
  placeholder?: string
  value:        string
  onChange:     (v: string) => void
  type?:        string
  required?:    boolean
  style?:       CSSProperties
}

export function Input({ label, placeholder, value, onChange, type = 'text', required, style }: InputProps) {
  const { theme: c } = useTheme()
  const inputStyle: CSSProperties = {
    width:        '100%',
    boxSizing:    'border-box',
    background:   c.surface2,
    border:       `1px solid ${c.border}`,
    borderRadius: radius.md,
    padding:      '11px 14px',
    fontSize:     14,
    color:        c.text,
    fontFamily:   typography.fontFamily,
    outline:      'none',
    ...style,
  }
  return (
    <div>
      {label && (
        <label style={{ fontSize: 13, color: c.text3, marginBottom: 6, display: 'block', fontWeight: 500 }}>
          {label}{required && <span style={{ color: '#ff453a' }}> *</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        style={inputStyle}
      />
    </div>
  )
}

// ─── SELECT GROUP (button group) ─────────────────────────────────────────────

interface SelectGroupProps {
  label?:    string
  options:   string[]
  value:     string
  onChange:  (v: string) => void
  colorMap?: Record<string, string>
  required?: boolean
}

export function SelectGroup({ label, options, value, onChange, colorMap = {}, required }: SelectGroupProps) {
  const { theme: c } = useTheme()
  return (
    <div>
      {label && (
        <label style={{ fontSize: 13, color: c.text3, marginBottom: 8, display: 'block', fontWeight: 500 }}>
          {label}{required && <span style={{ color: '#ff453a' }}> *</span>}
        </label>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map(opt => {
          const active    = value === opt
          const accentColor = colorMap[opt]
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              style={{
                background:   active ? (accentColor ?? c.text) : 'transparent',
                color:        active ? (accentColor ? '#fff' : c.surface) : c.text3,
                border:       `1px solid ${active ? (accentColor ?? c.text) : c.border}`,
                borderRadius: radius.md,
                padding:      '9px 16px',
                fontSize:     14,
                fontWeight:   600,
                cursor:       'pointer',
                fontFamily:   typography.fontFamily,
                transition:   'all .15s',
              }}
            >{opt}</button>
          )
        })}
      </div>
    </div>
  )
}

// ─── LOADING SPINNER ─────────────────────────────────────────────────────────

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div style={{
      width:        size,
      height:       size,
      border:       '2px solid rgba(255,255,255,0.2)',
      borderTop:    '2px solid currentColor',
      borderRadius: '50%',
      animation:    'spin 0.6s linear infinite',
      display:      'inline-block',
    }} />
  )
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  const { theme: c } = useTheme()
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', color: c.text3 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: c.text2, marginBottom: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
    </div>
  )
}

// ─── PAGE WRAPPER ─────────────────────────────────────────────────────────────

export function PageWrapper({ children, maxWidth = 1200 }: { children: ReactNode; maxWidth?: number }) {
  const { theme: c } = useTheme()
  return (
    <div style={{ background: c.bg, minHeight: '100vh' }}>
      <div style={{ maxWidth, margin: '0 auto', padding: '28px 24px' }}>
        {children}
      </div>
    </div>
  )
}

// ─── PAGE HEADER ─────────────────────────────────────────────────────────────

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  const { theme: c } = useTheme()
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: c.text, margin: 0 }}>{title}</h1>
      {action}
    </div>
  )
}
