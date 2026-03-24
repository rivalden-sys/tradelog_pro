// ─── DESIGN TOKENS — TradeLog Pro ────────────────────────────────────────────
export const colors = {
  green:  '#30d158',
  red:    '#ff453a',
  gray:   '#8e8e93',
  orange: '#ff9f0a',
  blue:   '#0a84ff',
  gradeA: '#30d158',
  gradeB: '#0a84ff',
  gradeC: '#ff9f0a',
  gradeD: '#ff453a',
}

// ─── LIGHT: Warm Cream ────────────────────────────────────────────────────────
export const lightTheme = {
  bg:       '#faf8f4',
  surface:  'rgba(255,255,252,0.95)',
  surface2: '#f3f0ea',
  surface3: '#e8e4dc',
  border:   'rgba(180,160,120,0.2)',
  text:     '#1c1a14',
  text2:    '#3a3630',
  text3:    '#9a9080',
  shadow:   '0 2px 16px rgba(120,100,60,0.08)',
  shadow2:  '0 4px 24px rgba(120,100,60,0.12)',
  // Фон з сіткою і фіолетовим свіченням зверху
  bgStyle: `
    background-color: #faf8f4;
    background-image:
      radial-gradient(ellipse 100% 50% at 50% 0%, rgba(120,80,255,0.05) 0%, transparent 65%),
      linear-gradient(rgba(180,160,120,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(180,160,120,0.07) 1px, transparent 1px);
    background-size: 100% 100%, 40px 40px, 40px 40px;
    background-attachment: fixed;
  `,
}

// ─── DARK: Obsidian Deep ──────────────────────────────────────────────────────
export const darkTheme = {
  bg:       '#07070f',
  surface:  '#111118',
  surface2: '#1a1a24',
  surface3: '#24243000',
  border:   'rgba(120,80,255,0.15)',
  text:     '#ededff',
  text2:    '#c0c0e0',
  text3:    '#5a5a8a',
  shadow:   '0 2px 16px rgba(0,0,0,0.50)',
  shadow2:  '0 4px 24px rgba(120,80,255,0.12)',
  // Фон з фіолетовою сіткою і свіченням
  bgStyle: `
    background-color: #07070f;
    background-image:
      radial-gradient(ellipse 100% 60% at 50% -10%, rgba(120,80,255,0.13) 0%, transparent 65%),
      radial-gradient(ellipse 60% 40% at 90% 80%, rgba(10,132,255,0.07) 0%, transparent 60%),
      linear-gradient(rgba(120,80,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(120,80,255,0.04) 1px, transparent 1px);
    background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
    background-attachment: fixed;
  `,
}

export type Theme = typeof lightTheme

export const typography = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono:   "'SF Mono', 'Fira Code', Consolas, monospace",
}

export const radius = {
  sm:   '8px',
  md:   '12px',
  lg:   '18px',
  xl:   '24px',
  full: '9999px',
}

export const spacing = {
  xs:  '4px',
  sm:  '8px',
  md:  '16px',
  lg:  '24px',
  xl:  '32px',
  xxl: '48px',
}

export function resultColor(result: string): string {
  if (result === 'Тейк') return colors.green
  if (result === 'Стоп') return colors.red
  return colors.gray
}

export function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    A: colors.gradeA,
    B: colors.gradeB,
    C: colors.gradeC,
    D: colors.gradeD,
  }
  return map[grade] ?? colors.gray
}

export function scoreColor(score: number): string {
  if (score >= 70) return colors.green
  if (score >= 40) return colors.orange
  return colors.red
}

export function pnlColor(pnl: number): string {
  if (pnl > 0) return colors.green
  if (pnl < 0) return colors.red
  return colors.gray
}
