'use client'

import { useState, useEffect, useRef } from 'react'
import NavBar from '@/components/layout/NavBar'
import { createClient } from '@/lib/supabase/client'
import { DARK, LIGHT } from '@/lib/colors'
import { useLocale } from '@/hooks/useLocale'

const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"

function useDark() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    )
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

function runMonteCarlo(
  winRate: number, avgWin: number, avgLoss: number,
  tradesPerMonth: number, months: number, simulations: number, startBalance: number
): { paths: number[][]; final: number[]; ruinCount: number } {
  const paths: number[][] = []
  const final: number[] = []
  let ruinCount = 0
  const totalTrades = tradesPerMonth * months
  for (let s = 0; s < simulations; s++) {
    let balance = startBalance
    const path = [balance]
    let ruin = false
    for (let i = 0; i < totalTrades; i++) {
      const win = Math.random() < winRate / 100
      balance += win ? avgWin : -avgLoss
      if (balance <= 0) { ruin = true; balance = 0; break }
      if ((i + 1) % tradesPerMonth === 0) path.push(balance)
    }
    if (path.length < months + 1) path.push(balance)
    if (ruin) ruinCount++
    paths.push(path)
    final.push(balance)
  }
  return { paths, final, ruinCount }
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.floor((p / 100) * sorted.length)
  return sorted[Math.min(idx, sorted.length - 1)]
}

export default function SimulatorPage() {
  const dark       = useDark()
  const { locale } = useLocale()
  const isUk       = locale === 'uk'

  const GREEN  = dark ? DARK.green  : LIGHT.green
  const RED    = dark ? DARK.red    : LIGHT.red
  const BLUE   = dark ? DARK.blue   : LIGHT.blue
  const ORANGE = dark ? DARK.orange : LIGHT.orange
  const PURPLE = dark ? DARK.purple : LIGHT.purple

  const textColor   = dark ? DARK.text   : LIGHT.text
  const subColor    = dark ? DARK.sub    : LIGHT.sub
  const borderColor = dark ? DARK.border : LIGHT.border

  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

  const [realWinRate,        setRealWinRate]        = useState<number | null>(null)
  const [realAvgWin,         setRealAvgWin]         = useState<number | null>(null)
  const [realAvgLoss,        setRealAvgLoss]        = useState<number | null>(null)
  const [realTradesPerMonth, setRealTradesPerMonth] = useState<number | null>(null)
  const [loadingStats,       setLoadingStats]       = useState(true)

  const [winRate,        setWinRate]        = useState(55)
  const [avgWin,         setAvgWin]         = useState(100)
  const [avgLoss,        setAvgLoss]        = useState(60)
  const [tradesPerMonth, setTradesPerMonth] = useState(20)
  const [months,         setMonths]         = useState(6)
  const [startBalance,   setStartBalance]   = useState(1000)
  const [simulations]                       = useState(200)

  const [result, setResult] = useState<{
    p10: number; p25: number; p50: number; p75: number; p90: number
    ruinPct: number; paths: number[][]
  } | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoadingStats(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingStats(false); return }
      const { data: trades } = await supabase
        .from('trades').select('result, profit_usd, date')
        .eq('user_id', user.id).eq('status', 'closed')
        .order('date', { ascending: false })
      if (!trades || trades.length < 5) { setLoadingStats(false); return }
      const wins   = trades.filter(t => t.result === 'Тейк')
      const losses = trades.filter(t => t.result === 'Стоп')
      const wr = Math.round((wins.length / trades.length) * 100)
      const aw = wins.length   ? Math.abs(wins.reduce((s, t)   => s + (t.profit_usd || 0), 0) / wins.length)   : 0
      const al = losses.length ? Math.abs(losses.reduce((s, t) => s + (t.profit_usd || 0), 0) / losses.length) : 0
      const dates = trades.map(t => t.date.slice(0, 7))
      const monthCounts: Record<string, number> = {}
      dates.forEach(d => { monthCounts[d] = (monthCounts[d] || 0) + 1 })
      const avgPerMonth = Math.round(Object.values(monthCounts).reduce((s, v) => s + v, 0) / Object.keys(monthCounts).length)
      setRealWinRate(wr)
      setRealAvgWin(Math.round(aw * 100) / 100)
      setRealAvgLoss(Math.round(al * 100) / 100)
      setRealTradesPerMonth(avgPerMonth)
      setWinRate(wr)
      setAvgWin(Math.round(aw) || 100)
      setAvgLoss(Math.round(al) || 60)
      setTradesPerMonth(avgPerMonth || 20)
      setLoadingStats(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (loadingStats) return
    const { paths, final, ruinCount } = runMonteCarlo(
      winRate, avgWin, avgLoss, tradesPerMonth, months, simulations, startBalance
    )
    const step = Math.max(1, Math.floor(paths.length / 30))
    const sampledPaths = paths.filter((_, i) => i % step === 0).slice(0, 30)
    setResult({
      p10: Math.round(percentile(final, 10)),
      p25: Math.round(percentile(final, 25)),
      p50: Math.round(percentile(final, 50)),
      p75: Math.round(percentile(final, 75)),
      p90: Math.round(percentile(final, 90)),
      ruinPct: Math.round((ruinCount / simulations) * 100),
      paths: sampledPaths,
    })
  }, [winRate, avgWin, avgLoss, tradesPerMonth, months, startBalance, loadingStats])

  const glassCard = (accent?: string): React.CSSProperties => ({
    background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    borderRadius: 20, padding: '20px',
    border: `1px solid ${accent ? accent + '44' : borderColor}`,
    boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'inset 0 1px 0 rgba(255,255,255,0.95)',
    position: 'relative', overflow: 'hidden',
  })

  const glare = (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', background: dark ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />
  )

  const sliderLabelStyle: React.CSSProperties = {
    fontSize: 12, color: subColor, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block',
  }

  // Кастомний слайдер з підтримкою touch і trackpad
  function Slider({ label, value, min, max, step = 1, unit = '', onChange, color }: {
    label: string; value: number; min: number; max: number; step?: number
    unit?: string; onChange: (v: number) => void; color?: string
  }) {
    const trackRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)

    const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step))

    const getValueFromX = (clientX: number) => {
      if (!trackRef.current) return value
      const rect = trackRef.current.getBoundingClientRect()
      const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      return clamp(min + pct * (max - min))
    }

    // Mouse events
    const onMouseDown = (e: React.MouseEvent) => {
      isDragging.current = true
      onChange(getValueFromX(e.clientX))
      const onMove = (ev: MouseEvent) => { if (isDragging.current) onChange(getValueFromX(ev.clientX)) }
      const onUp   = () => { isDragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    // Touch events
    const onTouchStart = (e: React.TouchEvent) => {
      e.preventDefault()
      onChange(getValueFromX(e.touches[0].clientX))
    }
    const onTouchMove = (e: React.TouchEvent) => {
      e.preventDefault()
      onChange(getValueFromX(e.touches[0].clientX))
    }

    // Trackpad/wheel
    const onWheel = (e: React.WheelEvent) => {
      e.preventDefault()
      onChange(clamp(value + (e.deltaY > 0 ? -step : step)))
    }

    const pct = ((value - min) / (max - min)) * 100
    const c   = color || BLUE

    return (
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={sliderLabelStyle}>{label}</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: c, letterSpacing: '-0.02em' }}>
            {unit === '$' ? `$${value}` : `${value}${unit}`}
          </span>
        </div>

        {/* Custom track */}
        <div
          ref={trackRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onWheel={onWheel}
          style={{
            position: 'relative', height: 44, cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            touchAction: 'none', userSelect: 'none',
          }}
        >
          {/* Track background */}
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 5, borderRadius: 99,
            background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }} />
          {/* Track fill */}
          <div style={{
            position: 'absolute', left: 0, width: `${pct}%`, height: 5, borderRadius: 99,
            background: c,
          }} />
          {/* Thumb */}
          <div style={{
            position: 'absolute',
            left: `${pct}%`,
            transform: 'translateX(-50%)',
            width: 28, height: 28, borderRadius: '50%',
            background: c,
            border: `3px solid ${dark ? '#1c1c1e' : '#ffffff'}`,
            boxShadow: `0 2px 10px ${c}66`,
            pointerEvents: 'none',
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: 10, color: subColor }}>{unit === '$' ? `$${min}` : `${min}${unit}`}</span>
          <span style={{ fontSize: 10, color: subColor }}>{unit === '$' ? `$${max}` : `${max}${unit}`}</span>
        </div>
      </div>
    )
  }

  function StatBadge({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
    return (
      <div style={{
        background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
        border: `1px solid ${color}33`, borderRadius: 14, padding: '14px 16px', textAlign: 'center',
        boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
      }}>
        <div style={{ fontSize: 11, color: subColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: '-0.03em' }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: subColor, marginTop: 4 }}>{sub}</div>}
      </div>
    )
  }

  function MonteCarloChart() {
    if (!result) return null
    const W = 600; const H = 260
    const padding = { top: 20, right: 20, bottom: 30, left: 60 }
    const chartW = W - padding.left - padding.right
    const chartH = H - padding.top - padding.bottom
    const allValues = result.paths.flat()
    const minV = Math.min(...allValues, 0)
    const maxV = Math.max(...allValues, startBalance * 1.1)
    const xSteps = months
    const xScale = (i: number) => padding.left + (i / xSteps) * chartW
    const yScale = (v: number) => padding.top + chartH - ((v - minV) / (maxV - minV)) * chartH
    const pathColor = dark ? 'rgba(10,132,255,0.15)' : 'rgba(10,132,255,0.12)'
    const gridColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    const axisColor = dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
    const yTicks = 4
    const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
      const v = minV + ((maxV - minV) / yTicks) * i
      return { v, y: yScale(v) }
    })
    const medianPath = Array.from({ length: months + 1 }, (_, i) => {
      const vals = result.paths.map(p => p[Math.min(i, p.length - 1)])
      return percentile(vals, 50)
    })
    const toSvgPath = (points: number[]) =>
      points.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ')

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {yLabels.map(({ v, y }) => (
          <g key={v}>
            <line x1={padding.left} y1={y} x2={W - padding.right} y2={y} stroke={gridColor} strokeWidth={1} />
            <text x={padding.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill={axisColor}>${Math.round(v)}</text>
          </g>
        ))}
        {Array.from({ length: months + 1 }, (_, i) => (
          <text key={i} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize={10} fill={axisColor}>
            {i === 0 ? (isUk ? 'Зараз' : 'Now') : `${i}m`}
          </text>
        ))}
        {result.paths.map((path, i) => (
          <path key={i} d={toSvgPath(path)} fill="none" stroke={pathColor} strokeWidth={1.5} strokeLinecap="round" />
        ))}
        <line
          x1={padding.left} y1={yScale(startBalance)} x2={W - padding.right} y2={yScale(startBalance)}
          stroke={dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} strokeWidth={1} strokeDasharray="4 4"
        />
        <path d={toSvgPath(medianPath)} fill="none" stroke={GREEN} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={xScale(months)} cy={yScale(medianPath[months])} r={5} fill={GREEN} stroke={dark ? '#0a0a0b' : '#fff'} strokeWidth={2} />
      </svg>
    )
  }

  const expValue    = Math.round((winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss)
  const isPositiveEV = expValue > 0

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: dark ? DARK.bg : LIGHT.bg }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: noiseSvg, opacity: dark ? 0.35 : 0.15 }} />
      <div style={{ position: 'fixed', top: -200, left: '30%', width: 600, height: 600, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(48,209,88,0.06) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(10,132,255,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -200, right: '10%', width: 500, height: 500, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(191,90,242,0.04) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(48,209,88,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: textColor, margin: 0, letterSpacing: '-0.04em' }}>
              📈 Performance Simulator
            </h1>
            <div style={{ fontSize: 13, color: subColor, marginTop: 4 }}>
              {isUk ? 'Monte Carlo симуляція — що буде якщо торгувати так само ще кілька місяців' : 'Monte Carlo simulation — what happens if you keep trading the same way'}
            </div>
          </div>

          {/* Real stats banner */}
          {!loadingStats && realWinRate !== null && (
            <div style={{ ...glassCard(BLUE), marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {glare}
              <div style={{ fontSize: 20, flexShrink: 0 }}>📊</div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 2 }}>
                  {isUk ? 'Параметри завантажені з твоїх реальних угод' : 'Parameters loaded from your real trades'}
                </div>
                <div style={{ fontSize: 12, color: subColor }}>
                  {isUk
                    ? `Win Rate ${realWinRate}% · Avg Win $${realAvgWin} · Avg Loss $${realAvgLoss} · ${realTradesPerMonth} угод/міс`
                    : `Win Rate ${realWinRate}% · Avg Win $${realAvgWin} · Avg Loss $${realAvgLoss} · ${realTradesPerMonth} trades/mo`}
                </div>
              </div>
              <div style={{ fontSize: 11, color: BLUE, fontWeight: 600, flexShrink: 0, position: 'relative' }}>
                {isUk ? 'Змінюй слайдери нижче' : 'Adjust sliders below'}
              </div>
            </div>
          )}

          <div className="sim-grid">

            {/* Left — controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={glassCard()}>
                {glare}
                <div style={{ fontSize: 14, fontWeight: 700, color: textColor, marginBottom: 20, position: 'relative' }}>
                  {isUk ? '📊 Статистика торгівлі' : '📊 Trading Statistics'}
                </div>
                <div style={{ position: 'relative' }}>
                  <Slider label={isUk ? 'Win Rate' : 'Win Rate'} value={winRate} min={10} max={90} unit="%" color={winRate >= 50 ? GREEN : RED} onChange={setWinRate} />
                  <Slider label={isUk ? 'Середній прибуток' : 'Average Win'} value={avgWin} min={10} max={1000} step={10} unit="$" color={GREEN} onChange={setAvgWin} />
                  <Slider label={isUk ? 'Середній збиток' : 'Average Loss'} value={avgLoss} min={10} max={1000} step={10} unit="$" color={RED} onChange={setAvgLoss} />
                  <Slider label={isUk ? 'Угод на місяць' : 'Trades per Month'} value={tradesPerMonth} min={1} max={100} color={BLUE} onChange={setTradesPerMonth} />
                </div>
              </div>

              <div style={glassCard()}>
                {glare}
                <div style={{ fontSize: 14, fontWeight: 700, color: textColor, marginBottom: 20, position: 'relative' }}>
                  {isUk ? '⚙️ Параметри симуляції' : '⚙️ Simulation Parameters'}
                </div>
                <div style={{ position: 'relative' }}>
                  <Slider label={isUk ? 'Стартовий баланс' : 'Starting Balance'} value={startBalance} min={100} max={100000} step={100} unit="$" color={PURPLE} onChange={setStartBalance} />
                  <Slider label={isUk ? 'Горизонт (місяців)' : 'Horizon (months)'} value={months} min={1} max={24} color={ORANGE} onChange={setMonths} />
                </div>

                <div style={{
                  marginTop: 4, padding: '14px 16px', borderRadius: 14,
                  background: isPositiveEV ? GREEN + '15' : RED + '15',
                  border: `1px solid ${isPositiveEV ? GREEN : RED}33`,
                  position: 'relative',
                }}>
                  <div style={{ fontSize: 11, color: subColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                    {isUk ? 'Очікувана цінність (EV) на угоду' : 'Expected Value (EV) per trade'}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: isPositiveEV ? GREEN : RED, letterSpacing: '-0.03em' }}>
                    {isPositiveEV ? '+' : ''}{expValue}$
                  </div>
                  <div style={{ fontSize: 12, color: subColor, marginTop: 4 }}>
                    {isPositiveEV
                      ? (isUk ? '✅ Позитивне математичне очікування' : '✅ Positive expected value')
                      : (isUk ? '❌ Негативне математичне очікування — система збиткова' : '❌ Negative expected value — system is losing')}
                  </div>
                </div>
              </div>
            </div>

            {/* Right — results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={glassCard()}>
                {glare}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>
                    {isUk ? `Прогноз на ${months} міс. (${simulations} симуляцій)` : `${months}-month forecast (${simulations} simulations)`}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 20, height: 2, background: GREEN, borderRadius: 1 }} />
                      <span style={{ fontSize: 11, color: subColor }}>Median</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 20, height: 2, background: dark ? 'rgba(10,132,255,0.4)' : 'rgba(10,132,255,0.3)', borderRadius: 1 }} />
                      <span style={{ fontSize: 11, color: subColor }}>{isUk ? 'Сценарії' : 'Scenarios'}</span>
                    </div>
                  </div>
                </div>
                <MonteCarloChart />
              </div>

              {result && (
                <div style={glassCard()}>
                  {glare}
                  <div style={{ fontSize: 14, fontWeight: 700, color: textColor, marginBottom: 16, position: 'relative' }}>
                    {isUk ? `📊 Результати після ${months} місяців` : `📊 Results after ${months} months`}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, position: 'relative' }}>
                    <StatBadge label={isUk ? 'Гірший 10%' : 'Worst 10%'} value={`$${result.p10}`} color={RED}    sub={`${Math.round((result.p10 / startBalance - 1) * 100)}%`} />
                    <StatBadge label={isUk ? 'Гірший 25%' : 'Bad 25%'}   value={`$${result.p25}`} color={ORANGE} sub={`${Math.round((result.p25 / startBalance - 1) * 100)}%`} />
                    <StatBadge label="Median"                             value={`$${result.p50}`} color={BLUE}   sub={`${Math.round((result.p50 / startBalance - 1) * 100)}%`} />
                    <StatBadge label={isUk ? 'Кращий 25%' : 'Good 25%'}  value={`$${result.p75}`} color={GREEN}  sub={`${Math.round((result.p75 / startBalance - 1) * 100)}%`} />
                    <StatBadge label={isUk ? 'Кращий 10%' : 'Best 10%'}  value={`$${result.p90}`} color={GREEN}  sub={`${Math.round((result.p90 / startBalance - 1) * 100)}%`} />
                  </div>

                  <div style={{
                    marginTop: 14, padding: '12px 16px', borderRadius: 12,
                    background: result.ruinPct > 10 ? RED + '15' : result.ruinPct > 3 ? ORANGE + '15' : GREEN + '15',
                    border: `1px solid ${result.ruinPct > 10 ? RED : result.ruinPct > 3 ? ORANGE : GREEN}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    position: 'relative',
                  }}>
                    <div>
                      <div style={{ fontSize: 12, color: subColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {isUk ? 'Ймовірність руїни' : 'Ruin Probability'}
                      </div>
                      <div style={{ fontSize: 11, color: subColor, marginTop: 2 }}>
                        {isUk ? 'Баланс досягає $0' : 'Balance reaches $0'}
                      </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: result.ruinPct > 10 ? RED : result.ruinPct > 3 ? ORANGE : GREEN, letterSpacing: '-0.03em' }}>
                      {result.ruinPct}%
                    </div>
                  </div>
                </div>
              )}

              {result && (
                <div style={glassCard(isPositiveEV ? GREEN : RED)}>
                  {glare}
                  <div style={{ fontSize: 14, fontWeight: 700, color: textColor, marginBottom: 10, position: 'relative' }}>
                    {isUk ? '💡 Висновок' : '💡 Key Insight'}
                  </div>
                  <div style={{ fontSize: 14, color: textColor, lineHeight: 1.7, position: 'relative' }}>
                    {isPositiveEV ? (
                      result.p50 > startBalance
                        ? (isUk
                          ? `При поточній статистиці медіанний результат за ${months} місяців — $${result.p50} (${Math.round((result.p50 / startBalance - 1) * 100)}% до стартового балансу). Система прибуткова — продовжуй торгувати за планом.`
                          : `At your current stats, the median outcome after ${months} months is $${result.p50} (${Math.round((result.p50 / startBalance - 1) * 100)}% vs starting balance). Your system is profitable — keep trading your plan.`)
                        : (isUk
                          ? 'EV позитивний, але недостатньо угод для стабільного результату. Збільш кількість угод або горизонт симуляції.'
                          : 'EV is positive but not enough trades for consistent results. Increase trades per month or simulation horizon.')
                    ) : (
                      isUk
                        ? `❌ При поточних параметрах система збиткова. Потрібно або збільшити Win Rate, або покращити співвідношення Win/Loss. Середній збиток ($${avgLoss}) перевищує середній прибуток з урахуванням ймовірності.`
                        : `❌ At current parameters your system is losing money. You need to either improve your Win Rate or your Win/Loss ratio. Average loss ($${avgLoss}) outweighs average win given the probabilities.`
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .sim-grid { display: grid; grid-template-columns: 380px 1fr; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .sim-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
