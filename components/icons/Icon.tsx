'use client'

import React from 'react'

/**
 * AurumTrade Icon System — HYBRID
 * --------------------------------------------
 * Two variants per icon:
 *   • duotone  — flat two-color (crisp at small sizes)
 *   • glass    — translucent gradients + shine (premium at large sizes)
 *
 * Auto-select by size:
 *   size < 32   → duotone
 *   size >= 32  → glass
 *
 * Override:
 *   <Icon name="dashboard" size={20} variant="glass" />
 *
 * Usage:
 *   <Icon name="dashboard" size={24} />           // duotone
 *   <Icon name="ai" size={64} />                   // glass
 *   <Icon name="take" size={20} color="#30d158" /> // duotone green
 */

export type IconName =
  | 'dashboard' | 'trades' | 'playbook' | 'journal' | 'goals'
  | 'simulator' | 'analytics' | 'ai' | 'settings' | 'billing' | 'import'
  | 'long' | 'short' | 'take' | 'stop' | 'breakeven' | 'planned'
  | 'calm' | 'fear' | 'greed' | 'anger' | 'euphoria' | 'revenge'
  | 'gradeA' | 'gradeB' | 'gradeC' | 'gradeD'
  | 'upload' | 'download' | 'edit' | 'delete' | 'plus'
  | 'check' | 'warning' | 'lock' | 'user' | 'logout'

export type IconVariant = 'duotone' | 'glass' | 'auto'

interface IconProps {
  name: IconName
  size?: number
  color?: string
  variant?: IconVariant
  mutedOpacity?: number
  className?: string
  style?: React.CSSProperties
}

// Unique ID per instance to avoid gradient collisions in same DOM
let uidCounter = 0
const nextUid = () => `aticon-${++uidCounter}`

export function Icon({
  name,
  size = 24,
  color = '#0a84ff',
  variant = 'auto',
  mutedOpacity = 0.25,
  className,
  style,
}: IconProps) {
  const resolvedVariant: 'duotone' | 'glass' =
    variant === 'auto' ? (size >= 32 ? 'glass' : 'duotone') : variant

  const uid = React.useMemo(() => nextUid(), [])

  const common = {
    width: size,
    height: size,
    viewBox: '0 0 48 48',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className,
    style,
  }

  if (resolvedVariant === 'duotone') {
    return <DuotoneIcon name={name} color={color} mutedOpacity={mutedOpacity} {...common} />
  }
  return <GlassIcon name={name} color={color} uid={uid} {...common} />
}

/* ═══════════════════════════════════════════════════════════════ */
/*                        DUOTONE RENDERER                         */
/* ═══════════════════════════════════════════════════════════════ */

function DuotoneIcon({ name, color, mutedOpacity, ...svgProps }: any) {
  const m = { fill: color, fillOpacity: mutedOpacity }
  const f = { fill: color }
  const sk = { stroke: '#fff', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const skC = { stroke: color, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (name) {
    case 'dashboard':
      return (
        <svg {...svgProps}>
          <rect x="6" y="6" width="16" height="20" rx="4" {...m} />
          <rect x="26" y="6" width="16" height="12" rx="4" {...m} />
          <rect x="6" y="30" width="16" height="12" rx="4" {...m} />
          <rect x="26" y="22" width="16" height="20" rx="4" {...f} />
          <path d="M29 36 L32 33 L35 35 L39 29" {...sk} />
          <circle cx="39" cy="29" r="1.4" fill="#fff" />
        </svg>
      )
    case 'trades':
      return (
        <svg {...svgProps}>
          <rect x="6" y="10" width="36" height="28" rx="5" {...m} />
          <path d="M11 32 L18 24 L24 28 L32 18 L38 22" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="38" cy="22" r="3" {...f} />
          <circle cx="38" cy="22" r="1.2" fill="#fff" />
        </svg>
      )
    case 'playbook':
      return (
        <svg {...svgProps}>
          <path d="M8 10 Q8 7 11 7 L34 7 Q37 7 37 10 L37 38 Q37 41 34 41 L11 41 Q8 41 8 38 Z" {...m} />
          <path d="M8 10 Q8 7 11 7 L22 7 L22 41 L11 41 Q8 41 8 38 Z" {...f} />
          <path d="M27 15 L35 15 M27 22 L33 22 M27 29 L35 29" {...skC} />
          <circle cx="40" cy="10" r="4" {...f} />
          <path d="M38.5 10 L39.5 11 L41.5 9" {...sk} />
        </svg>
      )
    case 'journal':
      return (
        <svg {...svgProps}>
          <rect x="8" y="8" width="30" height="34" rx="4" {...m} />
          <path d="M12 16 L30 16 M12 23 L30 23 M12 30 L24 30" {...skC} />
          <path d="M34 6 L42 14 L30 26 L22 26 L22 18 Z" {...f} />
          <path d="M34 6 L42 14" {...sk} />
        </svg>
      )
    case 'goals':
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" {...m} />
          <circle cx="24" cy="24" r="11" {...m} />
          <circle cx="24" cy="24" r="5" {...f} />
          <path d="M24 24 L40 8 M40 8 L40 14 L46 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    case 'simulator':
      return (
        <svg {...svgProps}>
          <rect x="6" y="10" width="36" height="24" rx="4" {...m} />
          <path d="M11 28 Q18 20 24 24 T38 14" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" strokeDasharray="3 2.5" />
          <circle cx="38" cy="14" r="3" {...f} />
          <path d="M18 40 L30 40" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <rect x="21" y="34" width="6" height="6" rx="1.2" {...f} />
        </svg>
      )
    case 'analytics':
      return (
        <svg {...svgProps}>
          <rect x="8" y="22" width="6" height="18" rx="1.5" {...m} />
          <rect x="18" y="14" width="6" height="26" rx="1.5" {...m} />
          <rect x="28" y="8" width="6" height="32" rx="1.5" {...f} />
          <rect x="38" y="18" width="4" height="22" rx="1.2" {...m} />
          <path d="M6 42 L42 42" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'ai':
      return (
        <svg {...svgProps}>
          <path d="M24 6 L30 18 L42 18 L32 27 L36 40 L24 33 L12 40 L16 27 L6 18 L18 18 Z" {...m} />
          <circle cx="24" cy="24" r="8" {...f} />
          <circle cx="21" cy="22" r="1.5" fill="#fff" />
          <circle cx="27" cy="22" r="1.5" fill="#fff" />
          <path d="M20 27 Q24 29 28 27" {...sk} />
        </svg>
      )
    case 'settings':
      return (
        <svg {...svgProps}>
          <path d="M24 4 L28 8 L34 6 L37 11 L43 12 L42 18 L46 22 L42 28 L43 34 L37 35 L34 40 L28 38 L24 42 L20 38 L14 40 L11 35 L5 34 L6 28 L2 22 L6 18 L5 12 L11 11 L14 6 L20 8 Z" {...m} />
          <circle cx="24" cy="23" r="7" {...f} />
          <circle cx="24" cy="23" r="2.8" fill="#fff" />
        </svg>
      )
    case 'billing':
      return (
        <svg {...svgProps}>
          <rect x="6" y="12" width="36" height="24" rx="4" {...m} />
          <rect x="6" y="16" width="36" height="6" {...f} />
          <rect x="10" y="28" width="10" height="4" rx="1" fill="#fff" fillOpacity="0.9" />
          <rect x="28" y="28" width="8" height="2" rx="1" {...f} />
        </svg>
      )
    case 'import':
      return (
        <svg {...svgProps}>
          <rect x="6" y="26" width="36" height="16" rx="3" {...m} />
          <path d="M24 8 L24 28 M24 28 L16 20 M24 28 L32 20" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="14" cy="34" r="1.5" {...f} />
        </svg>
      )
    case 'long':
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" {...m} />
          <path d="M16 28 L24 18 L32 28" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="24" cy="18" r="2.5" {...f} />
        </svg>
      )
    case 'short':
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" {...m} />
          <path d="M16 20 L24 30 L32 20" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="24" cy="30" r="2.5" {...f} />
        </svg>
      )
    case 'take':
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" {...m} />
          <circle cx="24" cy="24" r="11" {...f} />
          <path d="M18 24 L22 28 L30 20" {...sk} strokeWidth="2.4" />
        </svg>
      )
    case 'stop':
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" {...m} />
          <circle cx="24" cy="24" r="11" {...f} />
          <path d="M19 19 L29 29 M29 19 L19 29" {...sk} strokeWidth="2.4" />
        </svg>
      )
    case 'breakeven':
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" {...m} />
          <circle cx="24" cy="24" r="11" {...f} />
          <path d="M17 22 L31 22 M17 26 L31 26" {...sk} strokeWidth="2.4" />
        </svg>
      )
    case 'planned':
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" {...m} />
          <circle cx="24" cy="24" r="11" {...f} />
          <path d="M24 18 L24 24 L28 26" {...sk} strokeWidth="2.2" />
        </svg>
      )
    case 'calm':
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" {...m} />
          <circle cx="17" cy="21" r="2" {...f} />
          <circle cx="31" cy="21" r="2" {...f} />
          <path d="M17 31 L31 31" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'fear':
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" {...m} />
          <circle cx="17" cy="22" r="2.5" {...f} />
          <circle cx="31" cy="22" r="2.5" {...f} />
          <ellipse cx="24" cy="32" rx="4" ry="3" {...f} />
          <path d="M14 16 L18 18 M34 16 L30 18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'greed':
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" {...m} />
          <path d="M17 20 L21 22 L17 24 M31 20 L27 22 L31 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M24 16 L24 34 M20 20 L28 20 M18 28 L30 28" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'anger':
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" {...m} />
          <path d="M13 19 L20 22 M35 19 L28 22" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="18" cy="24" r="1.8" {...f} />
          <circle cx="30" cy="24" r="1.8" {...f} />
          <path d="M17 33 Q24 28 31 33" stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </svg>
      )
    case 'euphoria':
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" {...m} />
          <path d="M14 19 L20 22 M34 19 L28 22" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M15 28 Q24 38 33 28" stroke={color} strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <path d="M24 6 L25.5 10 L29.5 10 L26 12.5 L27.5 16.5 L24 14 L20.5 16.5 L22 12.5 L18.5 10 L22.5 10 Z" {...f} />
        </svg>
      )
    case 'revenge':
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" {...m} />
          <path d="M14 18 L20 22 L14 22 Z M34 18 L28 22 L34 22 Z" {...f} />
          <path d="M15 33 Q24 27 33 33" stroke={color} strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <path d="M10 10 L14 14 M38 10 L34 14" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'gradeA':
      return (
        <svg {...svgProps}>
          <path d="M24 4 L40 12 L40 28 Q40 38 24 44 Q8 38 8 28 L8 12 Z" {...m} />
          <path d="M24 10 L36 16 L36 27 Q36 34 24 38 Q12 34 12 27 L12 16 Z" {...f} />
          <path d="M18 30 L24 16 L30 30 M20 25 L28 25" {...sk} strokeWidth="2.2" />
        </svg>
      )
    case 'gradeB':
      return (
        <svg {...svgProps}>
          <path d="M24 4 L40 12 L40 28 Q40 38 24 44 Q8 38 8 28 L8 12 Z" {...m} />
          <path d="M24 10 L36 16 L36 27 Q36 34 24 38 Q12 34 12 27 L12 16 Z" {...f} />
          <path d="M19 16 L27 16 Q30 16 30 19 Q30 22 27 22 L19 22 M19 22 L28 22 Q31 22 31 26 Q31 30 28 30 L19 30 Z" {...sk} strokeWidth="2" fill="none" />
        </svg>
      )
    case 'gradeC':
      return (
        <svg {...svgProps}>
          <path d="M24 4 L40 12 L40 28 Q40 38 24 44 Q8 38 8 28 L8 12 Z" {...m} />
          <path d="M24 10 L36 16 L36 27 Q36 34 24 38 Q12 34 12 27 L12 16 Z" {...f} />
          <path d="M30 19 Q27 16 24 16 Q18 16 18 23 Q18 30 24 30 Q27 30 30 27" {...sk} strokeWidth="2.2" fill="none" />
        </svg>
      )
    case 'gradeD':
      return (
        <svg {...svgProps}>
          <path d="M24 4 L40 12 L40 28 Q40 38 24 44 Q8 38 8 28 L8 12 Z" {...m} />
          <path d="M24 10 L36 16 L36 27 Q36 34 24 38 Q12 34 12 27 L12 16 Z" {...f} />
          <path d="M19 16 L25 16 Q31 16 31 23 Q31 30 25 30 L19 30 Z" {...sk} strokeWidth="2" fill="none" />
        </svg>
      )
    case 'upload':
      return (
        <svg {...svgProps}>
          <rect x="6" y="28" width="36" height="14" rx="3" {...m} />
          <path d="M24 38 L24 10 M24 10 L16 18 M24 10 L32 18" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    case 'download':
      return (
        <svg {...svgProps}>
          <rect x="6" y="28" width="36" height="14" rx="3" {...m} />
          <path d="M24 10 L24 36 M24 36 L16 28 M24 36 L32 28" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...svgProps}>
          <path d="M8 40 L8 32 L28 12 L36 20 L16 40 Z" {...m} />
          <path d="M28 12 L36 20 L40 16 Q42 14 40 12 L36 8 Q34 6 32 8 Z" {...f} />
          <path d="M8 40 L16 40" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'delete':
      return (
        <svg {...svgProps}>
          <path d="M10 14 L38 14 L36 40 Q36 42 34 42 L14 42 Q12 42 12 40 Z" {...m} />
          <rect x="14" y="6" width="20" height="6" rx="2" {...f} />
          <path d="M20 20 L20 36 M24 20 L24 36 M28 20 L28 36" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" {...m} />
          <circle cx="24" cy="24" r="11" {...f} />
          <path d="M24 18 L24 30 M18 24 L30 24" {...sk} strokeWidth="2.6" />
        </svg>
      )
    case 'check':
      return (
        <svg {...svgProps}>
          <circle cx="24" cy="24" r="18" {...m} />
          <circle cx="24" cy="24" r="11" {...f} />
          <path d="M18 24 L22 28 L30 20" {...sk} strokeWidth="2.6" />
        </svg>
      )
    case 'warning':
      return (
        <svg {...svgProps}>
          <path d="M24 6 L44 40 Q45 42 43 42 L5 42 Q3 42 4 40 Z" {...m} />
          <path d="M24 14 L40 40 L8 40 Z" {...f} />
          <path d="M24 22 L24 31" {...sk} strokeWidth="2.6" />
          <circle cx="24" cy="36" r="1.6" fill="#fff" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...svgProps}>
          <rect x="10" y="22" width="28" height="20" rx="4" {...m} />
          <path d="M16 22 L16 16 Q16 8 24 8 Q32 8 32 16 L32 22" stroke={color} strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <circle cx="24" cy="31" r="3" {...f} />
          <rect x="23" y="31" width="2" height="6" rx="1" {...f} />
        </svg>
      )
    case 'user':
      return (
        <svg {...svgProps}>
          <path d="M6 42 Q6 28 24 28 Q42 28 42 42 Z" {...m} />
          <circle cx="24" cy="16" r="8" {...f} />
        </svg>
      )
    case 'logout':
      return (
        <svg {...svgProps}>
          <path d="M6 10 Q6 6 10 6 L24 6 L24 42 L10 42 Q6 42 6 38 Z" {...m} />
          <path d="M24 24 L42 24 M42 24 L34 16 M42 24 L34 32" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    default:
      return null
  }
}

/* ═══════════════════════════════════════════════════════════════ */
/*                         GLASS RENDERER                          */
/* ═══════════════════════════════════════════════════════════════ */

function GlassIcon({ name, color, uid, ...svgProps }: any) {
  const cyan = '#5ac8fa'
  const purple = '#bf5af2'

  const ids = {
    bg: `${uid}-bg`,
    active: `${uid}-active`,
    shine: `${uid}-shine`,
    orb: `${uid}-orb`,
    hi: `${uid}-hi`,
    glow: `${uid}-glow`,
  }

  const Defs = () => (
    <defs>
      <linearGradient id={ids.bg} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.35" />
        <stop offset="50%" stopColor={cyan} stopOpacity="0.2" />
        <stop offset="100%" stopColor={purple} stopOpacity="0.3" />
      </linearGradient>
      <linearGradient id={ids.active} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.95" />
        <stop offset="100%" stopColor={cyan} stopOpacity="0.85" />
      </linearGradient>
      <linearGradient id={ids.shine} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
        <stop offset="50%" stopColor="#fff" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={ids.orb} cx="0.3" cy="0.3" r="0.8">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
        <stop offset="30%" stopColor={cyan} stopOpacity="0.85" />
        <stop offset="70%" stopColor={color} stopOpacity="0.9" />
        <stop offset="100%" stopColor={purple} stopOpacity="0.95" />
      </radialGradient>
      <radialGradient id={ids.hi} cx="0.3" cy="0.25" r="0.4">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <filter id={ids.glow} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
      </filter>
    </defs>
  )

  const bg = `url(#${ids.bg})`
  const active = `url(#${ids.active})`
  const shine = `url(#${ids.shine})`
  const orb = `url(#${ids.orb})`
  const hi = `url(#${ids.hi})`
  const stroke = 'rgba(255,255,255,0.35)'
  const strokeStrong = 'rgba(255,255,255,0.5)'

  switch (name) {
    case 'dashboard':
      return (
        <svg {...svgProps}><Defs />
          <rect x="6" y="6" width="16" height="20" rx="4" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <rect x="6.5" y="6.5" width="15" height="8" rx="3.5" fill={shine} opacity="0.7" />
          <rect x="26" y="6" width="16" height="12" rx="4" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <rect x="26.5" y="6.5" width="15" height="5" rx="3.5" fill={shine} opacity="0.7" />
          <rect x="6" y="30" width="16" height="12" rx="4" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <rect x="6.5" y="30.5" width="15" height="5" rx="3.5" fill={shine} opacity="0.7" />
          <rect x="26" y="22" width="16" height="20" rx="4" fill={active} stroke={strokeStrong} strokeWidth="0.6" />
          <rect x="26.5" y="22.5" width="15" height="8" rx="3.5" fill={shine} opacity="0.85" />
          <path d="M29 36 L32 33 L35 35 L39 29" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="39" cy="29" r="1.4" fill="#fff" />
        </svg>
      )
    case 'trades':
      return (
        <svg {...svgProps}><Defs />
          <rect x="6" y="10" width="36" height="28" rx="5" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <rect x="6.5" y="10.5" width="35" height="10" rx="4.5" fill={shine} opacity="0.7" />
          <path d="M11 32 L18 24 L24 28 L32 18 L38 22" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="38" cy="22" r="3" fill={orb} />
          <circle cx="38" cy="22" r="1.2" fill="#fff" />
        </svg>
      )
    case 'playbook':
      return (
        <svg {...svgProps}><Defs />
          <path d="M8 10 Q8 7 11 7 L34 7 Q37 7 37 10 L37 38 Q37 41 34 41 L11 41 Q8 41 8 38 Z" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <path d="M8 10 Q8 7 11 7 L22 7 L22 41 L11 41 Q8 41 8 38 Z" fill={active} stroke={strokeStrong} strokeWidth="0.5" />
          <path d="M9 10 Q9 8 11 8 L21 8 L21 18 L9 18 Z" fill={shine} opacity="0.5" />
          <path d="M27 15 L35 15 M27 22 L33 22 M27 29 L35 29" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="40" cy="10" r="4" fill={orb} />
          <path d="M38.5 10 L39.5 11 L41.5 9" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    case 'journal':
      return (
        <svg {...svgProps}><Defs />
          <rect x="8" y="8" width="30" height="34" rx="4" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <rect x="8.5" y="8.5" width="29" height="12" rx="3.5" fill={shine} opacity="0.6" />
          <path d="M12 16 L30 16 M12 23 L30 23 M12 30 L24 30" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M34 6 L42 14 L30 26 L22 26 L22 18 Z" fill={active} stroke={strokeStrong} strokeWidth="0.5" />
          <path d="M34 6 L42 14" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'goals':
      return (
        <svg {...svgProps}><Defs />
          <circle cx="24" cy="24" r="18" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <circle cx="24" cy="24" r="11" fill={bg} stroke={stroke} strokeWidth="0.4" />
          <circle cx="24" cy="24" r="5" fill={orb} />
          <ellipse cx="20" cy="14" rx="10" ry="4" fill={shine} opacity="0.5" />
          <path d="M24 24 L40 8 M40 8 L40 14 L46 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    case 'simulator':
      return (
        <svg {...svgProps}><Defs />
          <rect x="6" y="10" width="36" height="24" rx="4" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <rect x="6.5" y="10.5" width="35" height="8" rx="3.5" fill={shine} opacity="0.6" />
          <path d="M11 28 Q18 20 24 24 T38 14" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" strokeDasharray="3 2.5" />
          <circle cx="38" cy="14" r="3" fill={orb} />
          <path d="M18 40 L30 40" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <rect x="21" y="34" width="6" height="6" rx="1.2" fill={active} stroke={strokeStrong} strokeWidth="0.4" />
        </svg>
      )
    case 'analytics':
      return (
        <svg {...svgProps}><Defs />
          <rect x="8" y="22" width="6" height="18" rx="1.5" fill={bg} stroke={stroke} strokeWidth="0.4" />
          <rect x="18" y="14" width="6" height="26" rx="1.5" fill={bg} stroke={stroke} strokeWidth="0.4" />
          <rect x="28" y="8" width="6" height="32" rx="1.5" fill={active} stroke={strokeStrong} strokeWidth="0.5" />
          <rect x="28.5" y="8.5" width="5" height="10" rx="1" fill={shine} opacity="0.8" />
          <rect x="38" y="18" width="4" height="22" rx="1.2" fill={bg} stroke={stroke} strokeWidth="0.4" />
          <path d="M6 42 L42 42" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'ai':
      return (
        <svg {...svgProps}><Defs />
          <path d="M24 6 L30 18 L42 18 L32 27 L36 40 L24 33 L12 40 L16 27 L6 18 L18 18 Z" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <circle cx="24" cy="24" r="10" fill={color} opacity="0.3" filter={`url(#${ids.glow})`} />
          <circle cx="24" cy="24" r="8" fill={orb} stroke={strokeStrong} strokeWidth="0.5" />
          <ellipse cx="21" cy="21" rx="3.5" ry="2.5" fill={hi} />
          <circle cx="21" cy="23" r="1.2" fill="#fff" />
          <circle cx="27" cy="23" r="1.2" fill="#fff" />
          <path d="M20 27 Q24 29 28 27" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...svgProps}><Defs />
          <path d="M24 4 L28 8 L34 6 L37 11 L43 12 L42 18 L46 22 L42 28 L43 34 L37 35 L34 40 L28 38 L24 42 L20 38 L14 40 L11 35 L5 34 L6 28 L2 22 L6 18 L5 12 L11 11 L14 6 L20 8 Z" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <circle cx="24" cy="23" r="7" fill={orb} stroke={strokeStrong} strokeWidth="0.5" />
          <ellipse cx="22" cy="21" rx="3" ry="2" fill={hi} />
          <circle cx="24" cy="23" r="2.8" fill="#fff" />
        </svg>
      )
    case 'billing':
      return (
        <svg {...svgProps}><Defs />
          <rect x="6" y="12" width="36" height="24" rx="4" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <rect x="6" y="16" width="36" height="6" fill={active} />
          <rect x="6.5" y="12.5" width="35" height="3" rx="3.5" fill={shine} opacity="0.6" />
          <rect x="10" y="28" width="10" height="4" rx="1" fill="#fff" fillOpacity="0.9" />
          <rect x="28" y="28" width="8" height="2" rx="1" fill={color} />
        </svg>
      )
    case 'import':
      return (
        <svg {...svgProps}><Defs />
          <rect x="6" y="26" width="36" height="16" rx="3" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <rect x="6.5" y="26.5" width="35" height="6" rx="2.5" fill={shine} opacity="0.6" />
          <path d="M24 8 L24 28 M24 28 L16 20 M24 28 L32 20" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="14" cy="34" r="1.5" fill={active} />
        </svg>
      )
    case 'long':
      return (
        <svg {...svgProps}><Defs />
          <circle cx="24" cy="24" r="18" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="20" cy="12" rx="12" ry="4" fill={shine} opacity="0.5" />
          <path d="M16 28 L24 18 L32 28" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="24" cy="18" r="2.5" fill={orb} />
        </svg>
      )
    case 'short':
      return (
        <svg {...svgProps}><Defs />
          <circle cx="24" cy="24" r="18" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="20" cy="12" rx="12" ry="4" fill={shine} opacity="0.5" />
          <path d="M16 20 L24 30 L32 20" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="24" cy="30" r="2.5" fill={orb} />
        </svg>
      )
    case 'take':
      return (
        <svg {...svgProps}><Defs />
          <circle cx="24" cy="24" r="18" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <circle cx="24" cy="24" r="11" fill={orb} stroke={strokeStrong} strokeWidth="0.5" />
          <ellipse cx="21" cy="20" rx="5" ry="3" fill={hi} />
          <path d="M18 24 L22 28 L30 20" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    case 'stop':
      return (
        <svg {...svgProps}><Defs />
          <circle cx="24" cy="24" r="18" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <circle cx="24" cy="24" r="11" fill={orb} stroke={strokeStrong} strokeWidth="0.5" />
          <ellipse cx="21" cy="20" rx="5" ry="3" fill={hi} />
          <path d="M19 19 L29 29 M29 19 L19 29" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'breakeven':
      return (
        <svg {...svgProps}><Defs />
          <circle cx="24" cy="24" r="18" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <circle cx="24" cy="24" r="11" fill={orb} stroke={strokeStrong} strokeWidth="0.5" />
          <ellipse cx="21" cy="20" rx="5" ry="3" fill={hi} />
          <path d="M17 22 L31 22 M17 26 L31 26" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'planned':
      return (
        <svg {...svgProps}><Defs />
          <circle cx="24" cy="24" r="18" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <circle cx="24" cy="24" r="11" fill={orb} stroke={strokeStrong} strokeWidth="0.5" />
          <ellipse cx="21" cy="20" rx="5" ry="3" fill={hi} />
          <path d="M24 18 L24 24 L28 26" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    case 'calm':
      return (
        <svg {...svgProps}><Defs />
          <circle cx="24" cy="24" r="18" fill={orb} stroke={strokeStrong} strokeWidth="0.5" />
          <ellipse cx="20" cy="14" rx="12" ry="5" fill={hi} opacity="0.8" />
          <circle cx="17" cy="21" r="2" fill="#fff" />
          <circle cx="31" cy="21" r="2" fill="#fff" />
          <path d="M17 31 L31 31" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'fear':
      return (
        <svg {...svgProps}><Defs />
          <circle cx="24" cy="24" r="18" fill={orb} stroke={strokeStrong} strokeWidth="0.5" />
          <ellipse cx="20" cy="14" rx="12" ry="5" fill={hi} opacity="0.8" />
          <circle cx="17" cy="22" r="2.5" fill="#fff" />
          <circle cx="31" cy="22" r="2.5" fill="#fff" />
          <ellipse cx="24" cy="32" rx="4" ry="3" fill="#fff" />
          <path d="M14 16 L18 18 M34 16 L30 18" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'greed':
      return (
        <svg {...svgProps}><Defs />
          <circle cx="24" cy="24" r="18" fill={orb} stroke={strokeStrong} strokeWidth="0.5" />
          <ellipse cx="20" cy="14" rx="12" ry="5" fill={hi} opacity="0.8" />
          <path d="M17 20 L21 22 L17 24 M31 20 L27 22 L31 24" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M24 16 L24 34 M20 20 L28 20 M18 28 L30 28" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'anger':
      return (
        <svg {...svgProps}><Defs />
          <circle cx="24" cy="24" r="18" fill={orb} stroke={strokeStrong} strokeWidth="0.5" />
          <ellipse cx="20" cy="14" rx="12" ry="5" fill={hi} opacity="0.8" />
          <path d="M13 19 L20 22 M35 19 L28 22" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="18" cy="24" r="1.8" fill="#fff" />
          <circle cx="30" cy="24" r="1.8" fill="#fff" />
          <path d="M17 33 Q24 28 31 33" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </svg>
      )
    case 'euphoria':
      return (
        <svg {...svgProps}><Defs />
          <circle cx="24" cy="24" r="18" fill={orb} stroke={strokeStrong} strokeWidth="0.5" />
          <ellipse cx="20" cy="14" rx="12" ry="5" fill={hi} opacity="0.8" />
          <path d="M14 19 L20 22 M34 19 L28 22" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <path d="M15 28 Q24 38 33 28" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <path d="M24 6 L25.5 10 L29.5 10 L26 12.5 L27.5 16.5 L24 14 L20.5 16.5 L22 12.5 L18.5 10 L22.5 10 Z" fill={active} stroke={strokeStrong} strokeWidth="0.3" />
        </svg>
      )
    case 'revenge':
      return (
        <svg {...svgProps}><Defs />
          <circle cx="24" cy="24" r="18" fill={orb} stroke={strokeStrong} strokeWidth="0.5" />
          <ellipse cx="20" cy="14" rx="12" ry="5" fill={hi} opacity="0.8" />
          <path d="M14 18 L20 22 L14 22 Z M34 18 L28 22 L34 22 Z" fill="#fff" />
          <path d="M15 33 Q24 27 33 33" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <path d="M10 10 L14 14 M38 10 L34 14" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </svg>
      )
    case 'gradeA':
      return (
        <svg {...svgProps}><Defs />
          <path d="M24 4 L40 12 L40 28 Q40 38 24 44 Q8 38 8 28 L8 12 Z" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <path d="M24 10 L36 16 L36 27 Q36 34 24 38 Q12 34 12 27 L12 16 Z" fill={active} stroke={strokeStrong} strokeWidth="0.5" />
          <path d="M24 10 L36 16 L36 22 L12 22 L12 16 Z" fill={shine} opacity="0.4" />
          <path d="M18 30 L24 16 L30 30 M20 25 L28 25" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    case 'gradeB':
      return (
        <svg {...svgProps}><Defs />
          <path d="M24 4 L40 12 L40 28 Q40 38 24 44 Q8 38 8 28 L8 12 Z" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <path d="M24 10 L36 16 L36 27 Q36 34 24 38 Q12 34 12 27 L12 16 Z" fill={active} stroke={strokeStrong} strokeWidth="0.5" />
          <path d="M24 10 L36 16 L36 22 L12 22 L12 16 Z" fill={shine} opacity="0.4" />
          <path d="M19 16 L27 16 Q30 16 30 19 Q30 22 27 22 L19 22 M19 22 L28 22 Q31 22 31 26 Q31 30 28 30 L19 30 Z" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'gradeC':
      return (
        <svg {...svgProps}><Defs />
          <path d="M24 4 L40 12 L40 28 Q40 38 24 44 Q8 38 8 28 L8 12 Z" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <path d="M24 10 L36 16 L36 27 Q36 34 24 38 Q12 34 12 27 L12 16 Z" fill={active} stroke={strokeStrong} strokeWidth="0.5" />
          <path d="M24 10 L36 16 L36 22 L12 22 L12 16 Z" fill={shine} opacity="0.4" />
          <path d="M30 19 Q27 16 24 16 Q18 16 18 23 Q18 30 24 30 Q27 30 30 27" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </svg>
      )
    case 'gradeD':
      return (
        <svg {...svgProps}><Defs />
          <path d="M24 4 L40 12 L40 28 Q40 38 24 44 Q8 38 8 28 L8 12 Z" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <path d="M24 10 L36 16 L36 27 Q36 34 24 38 Q12 34 12 27 L12 16 Z" fill={active} stroke={strokeStrong} strokeWidth="0.5" />
          <path d="M24 10 L36 16 L36 22 L12 22 L12 16 Z" fill={shine} opacity="0.4" />
          <path d="M19 16 L25 16 Q31 16 31 23 Q31 30 25 30 L19 30 Z" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'upload':
      return (
        <svg {...svgProps}><Defs />
          <rect x="6" y="28" width="36" height="14" rx="3" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <rect x="6.5" y="28.5" width="35" height="5" rx="2.5" fill={shine} opacity="0.6" />
          <path d="M24 38 L24 10 M24 10 L16 18 M24 10 L32 18" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    case 'download':
      return (
        <svg {...svgProps}><Defs />
          <rect x="6" y="28" width="36" height="14" rx="3" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <rect x="6.5" y="28.5" width="35" height="5" rx="2.5" fill={shine} opacity="0.6" />
          <path d="M24 10 L24 36 M24 36 L16 28 M24 36 L32 28" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...svgProps}><Defs />
          <path d="M8 40 L8 32 L28 12 L36 20 L16 40 Z" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <path d="M28 12 L36 20 L40 16 Q42 14 40 12 L36 8 Q34 6 32 8 Z" fill={active} stroke={strokeStrong} strokeWidth="0.5" />
          <path d="M8 40 L16 40" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'delete':
      return (
        <svg {...svgProps}><Defs />
          <path d="M10 14 L38 14 L36 40 Q36 42 34 42 L14 42 Q12 42 12 40 Z" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <rect x="14" y="6" width="20" height="6" rx="2" fill={active} stroke={strokeStrong} strokeWidth="0.5" />
          <rect x="14.5" y="6.5" width="19" height="2" rx="1.5" fill={shine} opacity="0.7" />
          <path d="M20 20 L20 36 M24 20 L24 36 M28 20 L28 36" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...svgProps}><Defs />
          <circle cx="24" cy="24" r="18" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <circle cx="24" cy="24" r="11" fill={orb} stroke={strokeStrong} strokeWidth="0.5" />
          <ellipse cx="21" cy="20" rx="5" ry="3" fill={hi} />
          <path d="M24 18 L24 30 M18 24 L30 24" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      )
    case 'check':
      return (
        <svg {...svgProps}><Defs />
          <circle cx="24" cy="24" r="18" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <circle cx="24" cy="24" r="11" fill={orb} stroke={strokeStrong} strokeWidth="0.5" />
          <ellipse cx="21" cy="20" rx="5" ry="3" fill={hi} />
          <path d="M18 24 L22 28 L30 20" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    case 'warning':
      return (
        <svg {...svgProps}><Defs />
          <path d="M24 6 L44 40 Q45 42 43 42 L5 42 Q3 42 4 40 Z" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <path d="M24 14 L40 40 L8 40 Z" fill={active} stroke={strokeStrong} strokeWidth="0.5" />
          <path d="M24 14 L32 27 L16 27 Z" fill={shine} opacity="0.4" />
          <path d="M24 22 L24 31" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="24" cy="36" r="1.6" fill="#fff" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...svgProps}><Defs />
          <rect x="10" y="22" width="28" height="20" rx="4" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <rect x="10.5" y="22.5" width="27" height="7" rx="3.5" fill={shine} opacity="0.6" />
          <path d="M16 22 L16 16 Q16 8 24 8 Q32 8 32 16 L32 22" stroke={color} strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <circle cx="24" cy="31" r="3" fill={active} />
          <rect x="23" y="31" width="2" height="6" rx="1" fill={active} />
        </svg>
      )
    case 'user':
      return (
        <svg {...svgProps}><Defs />
          <path d="M6 42 Q6 28 24 28 Q42 28 42 42 Z" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <circle cx="24" cy="16" r="8" fill={orb} stroke={strokeStrong} strokeWidth="0.5" />
          <ellipse cx="21" cy="13" rx="3.5" ry="2.5" fill={hi} />
        </svg>
      )
    case 'logout':
      return (
        <svg {...svgProps}><Defs />
          <path d="M6 10 Q6 6 10 6 L24 6 L24 42 L10 42 Q6 42 6 38 Z" fill={bg} stroke={stroke} strokeWidth="0.5" />
          <path d="M7 10 Q7 7 10 7 L23 7 L23 16 L7 16 Z" fill={shine} opacity="0.5" />
          <path d="M24 24 L42 24 M42 24 L34 16 M42 24 L34 32" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    default:
      return null
  }
}

export default Icon
