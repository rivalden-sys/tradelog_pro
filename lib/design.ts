// ─── DESIGN TOKENS — TradeLog Pro ────────────────────────────────────────────
// Apple-style: black / white / gray. No blue or other accent colors in UI.

export const colors = {
  green:  '#30d158',   // Тейк / Long / позитив
  red:    '#ff453a',   // Стоп / Short / негатив
  gray:   '#8e8e93',   // БУ / нейтральный
  orange: '#ff9f0a',   // предупреждение
  blue:   '#0a84ff',   // grade B / ссылки

  // Grades
  gradeA: '#30d158',
  gradeB: '#0a84ff',
  gradeC: '#ff9f0a',
  gradeD: '#ff453a',
} as const

export const lightTheme = {
  bg:       '#f2f2f7',
  surface:  '#ffffff',
  surface2: '#f2f2f7',
  surface3: '#e5e5ea',
  border:   'rgba(0,0,0,0.08)',
  text:     '#000000',
  text2:    '#3c3c43',
  text3:    '#8e8e93',
  shadow:   '0 2px 16px rgba(0,0,0,0.07)',
  shadow2:  '0 4px 24px rgba(0,0,0,0.10)',
} as const

export const darkTheme = {
  bg:       '#0a0a0b',
  surface:  '#1c1c1e',
  surface2: '#2c2c2e',
  surface3: '#3a3a3c',
  border:   'rgba(255,255,255,0.08)',
  text:     '#ffffff',
  text2:    '#ebebf5',
  text3:    '#8e8e93',
  shadow:   '0 2px 16px rgba(0,0,0,0.40)',
  shadow2:  '0 4px 24px rgba(0,0,0,0.50)',
} as const

export type Theme = typeof lightTheme

export const typography = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono:   "'SF Mono', 'Fira Code', Consolas, monospace",
} as const

export const radius = {
  sm:   '8px',
  md:   '12px',
  lg:   '18px',
  xl:   '24px',
  full: '9999px',
} as const

export const spacing = {
  xs:  '4px',
  sm:  '8px',
  md:  '16px',
  lg:  '24px',
  xl:  '32px',
  xxl: '48px',
} as const

// Helper: result → color
export function resultColor(result: string): string {
  if (result === 'Тейк') return colors.green
  if (result === 'Стоп') return colors.red
  return colors.gray
}

// Helper: grade → color
export function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    A: colors.gradeA,
    B: colors.gradeB,
    C: colors.gradeC,
    D: colors.gradeD,
  }
  return map[grade] ?? colors.gray
}

// Helper: score → color
export function scoreColor(score: number): string {
  if (score >= 70) return colors.green
  if (score >= 40) return colors.orange
  return colors.red
}

// Helper: pnl → color
export function pnlColor(pnl: number): string {
  if (pnl > 0) return colors.green
  if (pnl < 0) return colors.red
  return colors.gray
}
