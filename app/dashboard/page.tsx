'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import { Trade, Period } from '@/types'
import NavBar from '@/components/layout/NavBar'
import { useLocale } from '@/hooks/useLocale'

const FONT = "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', sans-serif"

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

function th(dark: boolean) {
  return {
    bg:       dark ? '#0a0a0b' : '#f2f2f7',
    surface:  dark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    surface2: dark ? 'rgba(255,255,255,0.03)' : '#f2f2f7',
    border:   dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    text:     dark ? '#f5f5f7' : '#1c1c1e',
    sub:      dark ? 'rgba(255,255,255,0.35)' : '#8e8e93',
    shadow:   'none',
  }
}

const GREEN  = '#30d158'
const RED    = '#ff453a'
const GRAY   = '#8e8e93'
const BLUE   = '#0a84ff'
const ORANGE = '#ff9f0a'

function filterByPeriod(trades: Trade[], period: Period): Trade[] {
  if (period === 'all') return trades
  const now = new Date()
  const cutoff = new Date()
  if (period === 'week')  cutoff.setDate(now.getDate() - 7)
  if (period === 'month') cutoff.setDate(now.getDate() - 30)
  return trades.filter(t => new Date(t.date) >= cutoff)
}

function calcStats(trades: Trade[]) {
  const wins  = trades.filter(t => t.result === 'Тейк')
  const total = trades.length
  const win_rate  = total ? Math.round((wins.length / total) * 100) : 0
  const total_pnl = trades.reduce((s, t) => s + (t.profit_usd || 0), 0)
  const avg_rr    = total ? trades.reduce((s, t) => s + (t.rr || 0), 0) / total : 0
  const avg_pnl   = total ? total_pnl / total : 0

  let peak = 0, maxDD = 0, cum = 0
  ;[...trades].sort((a, b) => a.date.localeCompare(b.date)).forEach(t => {
    cum += t.profit_usd || 0
    if (cum > peak) peak = cum
    const dd = peak - cum
    if (dd > maxDD) maxDD = dd
  })

  const longs  = trades.filter(t => t.direction === 'Long')
  const shorts = trades.filter(t => t.direction === 'Short')
  const long_wr  = longs.length  ? Math.round((longs.filter(t => t.result === 'Тейк').length  / longs.length)  * 100) : null
  const short_wr = shorts.length ? Math.round((shorts.filter(t => t.result === 'Тейк').length / shorts.length) * 100) : null

  const setupMap: Record<string, { wins: number; total: number }> = {}
  trades.forEach(t => {
    if (!setupMap[t.setup]) setupMap[t.setup] = { wins: 0, total: 0 }
    setupMap[t.setup].total++
    if (t.result === 'Тейк') setupMap[t.setup].wins++
  })
  let best_setup = '—', best_wr = -1
  Object.entries(setupMap).forEach(([s, v]) => {
    if (v.total >= 2 && v.wins / v.total > best_wr) { best_wr = v.wins / v.total; best_setup = s }
  })

  let win_streak = 0, loss_streak = 0, cur_w = 0, cur_l = 0
  ;[...trades].sort((a, b) => a.date.localeCompare(b.date)).forEach(t => {
    if (t.result === 'Тейк') { cur_w++; cur_l = 0 } else { cur_l++; cur_w = 0 }
    win_streak  = Math.max(win_streak,  cur_w)
    loss_streak = Math.max(loss_streak, cur_l)
  })

  return { total, win_rate, total_pnl, avg_rr, avg_pnl, best_setup, win_streak, loss_streak, max_drawdown: maxDD, long_wr, short_wr }
}

function calcBalance(trades: Trade[]) {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date))
  let cum = 0
  return sorted.map(t => {
    cum += t.profit_usd || 0
    return { date: t.date.slice(5), pnl: Math.round(cum * 100) / 100 }
  })
}

function calcPie(trades: Trade[]) {
  const teik = trades.filter(t => t.result === 'Тейк').length
  const stop  = trades.filter(t => t.result === 'Стоп').length
  const bu    = trades.filter(t => t.result === 'БУ').length
  return [
    { name: 'Тейк', value: teik },
    { name: 'Стоп', value: stop },
    { name: 'БУ',   value: bu   },
  ].filter(x => x.value > 0)
}

function calcByPair(trades: Trade[]) {
  const map: Record<string, number> = {}
  trades.forEach(t => { map[t.pair] = (map[t.pair] || 0) + (t.profit_usd || 0) })
  return Object.entries(map)
    .map(([pair, pnl]) => ({ pair, pnl: Math.round(pnl * 100) / 100 }))
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl)).slice(0, 8)
}

function calcBySetup(trades: Trade[]) {
  const map: Record<string, number> = {}
  trades.forEach(t => { map[t.setup] = (map[t.setup] || 0) + (t.profit_usd || 0) })
  return Object.entries(map)
    .map(([setup, pnl]) => ({ setup: setup.split('+')[0].trim(), pnl: Math.round(pnl * 100) / 100 }))
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl)).slice(0, 6)
}

function calcByWeekday(trades: Trade[]) {
  const DAYS_UK = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  const ORDER = [1, 2, 3, 4, 5, 6, 0]
  const map: Record<number, { pnl: number; count: number }> = {}
  ORDER.forEach(d => { map[d] = { pnl: 0, count: 0 } })
  trades.forEach(t => {
    const d = new Date(t.date).getDay()
    map[d].pnl += t.profit_usd || 0
    map[d].count++
  })
  return ORDER.map(d => ({
    day: DAYS_UK[d],
    pnl: Math.round(map[d].pnl * 100) / 100,
    count: map[d].count,
  }))
}

function CustomTooltip({ active, payload, dark }: any) {
  const t = th(dark)
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div style={{
      background: dark ? 'rgba(28,28,30,0.92)' : t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 10, padding: '8px 14px',
      fontFamily: FONT, backdropFilter: 'blur(20px)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: val >= 0 ? GREEN : RED }}>{val >= 0 ? '+' : ''}{val}$</div>
      <div style={{ fontSize: 11, color: t.sub }}>{payload[0].payload?.date || payload[0].payload?.pair || payload[0].payload?.setup || payload[0].payload?.day}</div>
    </div>
  )
}

const PIE_COLORS = [GREEN, RED, GRAY]

function glassCard(dark: boolean): React.CSSProperties {
  if (!dark) return {
    background: '#ffffff',
    borderRadius: 20, padding: '22px 24px',
    border: '1px solid rgba(0,0,0,0.06)',
  }
  return {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: 20, padding: '22px 24px',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.14),
      inset 0 -1px 0 rgba(255,255,255,0.03),
      inset 1px 0 0 rgba(255,255,255,0.06),
      inset -1px 0 0 rgba(255,255,255,0.02)
    `,
  }
}

function statCard(dark: boolean): React.CSSProperties {
  if (!dark) return {
    background: '#ffffff',
    borderRadius: 16, padding: '16px 18px',
    border: '1px solid rgba(0,0,0,0.06)',
  }
  return {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: 16, padding: '16px 18px',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.16),
      inset 0 -1px 0 rgba(255,255,255,0.02),
      inset 1px 0 0 rgba(255,255,255,0.06),
      inset -1px 0 0 rgba(255,255,255,0.02)
    `,
    position: 'relative', overflow: 'hidden',
    transition: 'transform 0.2s',
  }
}

export default function DashboardPage() {
  const dark = useDark()
  const t    = th(dark)
  const { t: tr } = useLocale()

  const [trades,  setTrades]  = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [period,  setPeriod]  = useState<Period>('month')

  const PERIODS = [
    { label: tr('dashboard_week'),  value: 'week'  as Period },
    { label: tr('dashboard_month'), value: 'month' as Period },
    { label: tr('dashboard_all'),   value: 'all'   as Period },
  ]

  const resultLabel = (r: string) => {
    if (r === 'Тейк') return tr('result_take')
    if (r === 'Стоп') return tr('result_stop')
    if (r === 'БУ')   return tr('result_bu')
    return r
  }

  const resultColor = (r: string) => {
    if (r === 'Тейк') return GREEN
    if (r === 'Стоп') return RED
    return GRAY
  }

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('trades').select('*')
        .eq('user_id', user.id).eq('status', 'closed')
        .order('date', { ascending: false })
      setTrades(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered  = filterByPeriod(trades, period)
  const stats     = calcStats(filtered)
  const balance   = calcBalance(filtered)
  const pie       = calcPie(filtered)
  const byPair    = calcByPair(filtered)
  const bySetup   = calcBySetup(filtered)
  const byWeekday = calcByWeekday(filtered)
  const recent    = filtered.slice(0, 10)

  const statCards = [
    { label: tr('dashboard_trades'),    value: stats.total,                                                          color: BLUE   },
    { label: tr('dashboard_winrate'),   value: `${stats.win_rate}%`,                                                 color: stats.win_rate >= 50 ? GREEN : RED },
    { label: tr('dashboard_totalpnl'),  value: `${stats.total_pnl >= 0 ? '+' : ''}${stats.total_pnl.toFixed(2)}$`,  color: stats.total_pnl >= 0 ? GREEN : RED },
    { label: tr('dashboard_avgrr'),     value: stats.avg_rr.toFixed(2),                                              color: ORANGE },
    { label: tr('dashboard_avg_pnl'),   value: `${stats.avg_pnl >= 0 ? '+' : ''}${stats.avg_pnl.toFixed(2)}$`,      color: stats.avg_pnl >= 0 ? GREEN : RED },
    { label: tr('dashboard_maxdd'),     value: stats.max_drawdown > 0 ? `-${stats.max_drawdown.toFixed(2)}$` : '—', color: stats.max_drawdown > 0 ? RED : t.sub },
    { label: tr('dashboard_bestsetup'), value: stats.best_setup,                                                     color: t.text },
    { label: tr('dashboard_maxstreak'), value: `${stats.win_streak}W / ${stats.loss_streak}L`,                      color: t.sub  },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: FONT }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: t.sub }}>
        {tr('dashboard_loading')}
      </div>
    </div>
  )

  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: FONT, transition: 'background 0.3s', position: 'relative' }}>

      {dark && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: noiseSvg, opacity: 0.35,
        }} />
      )}

      {dark && (
        <>
          <div style={{
            position: 'fixed', top: -200, left: '30%',
            width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(48,209,88,0.07) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 0,
          }} />
          <div style={{
            position: 'fixed', bottom: -200, right: '10%',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(10,132,255,0.05) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 0,
          }} />
        </>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar />
        <div style={{ padding: '24px 16px' }} className="dashboard-container">

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: '-0.04em' }}>{tr('dashboard_title')}</div>
              <div style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>{filtered.length} {tr('dashboard_subtitle')}</div>
            </div>
            <div style={{
              display: 'flex', gap: 2,
              background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              borderRadius: 12, padding: 3,
              border: `1px solid ${t.border}`,
              backdropFilter: dark ? 'blur(10px)' : 'none',
            }}>
              {PERIODS.map(p => (
                <button key={p.value} onClick={() => setPeriod(p.value)} style={{
                  padding: '6px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: period === p.value
                    ? dark ? 'rgba(255,255,255,0.1)' : '#ffffff'
                    : 'transparent',
                  color: period === p.value ? t.text : t.sub,
                  fontFamily: FONT, fontSize: 13, fontWeight: period === p.value ? 700 : 400,
                  boxShadow: period === p.value
                    ? dark ? 'inset 0 1px 0 rgba(255,255,255,0.12)' : '0 1px 3px rgba(0,0,0,0.1)'
                    : 'none',
                  transition: 'all 0.15s',
                }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stat cards */}
          <div className="stat-grid" style={{ marginBottom: 16 }}>
            {statCards.map(sc => (
              <div key={sc.label} style={statCard(dark)}>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>{sc.label}</div>
                <div style={{ fontSize: sc.label === tr('dashboard_bestsetup') ? 11 : 18, fontWeight: 800, color: sc.color, letterSpacing: '-0.03em', lineHeight: 1.2 }}>{sc.value}</div>
                {dark && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
                    borderRadius: '16px 16px 0 0', pointerEvents: 'none',
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Long vs Short */}
          {(stats.long_wr !== null || stats.short_wr !== null) && (
            <div style={{ ...glassCard(dark), marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
              {dark && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />}
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 16, letterSpacing: '-0.02em', position: 'relative' }}>{tr('dashboard_long_short')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, position: 'relative' }}>
                <div style={{ background: dark ? 'rgba(48,209,88,0.06)' : 'rgba(48,209,88,0.08)', border: `1px solid rgba(48,209,88,0.15)`, borderRadius: 14, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>↑ Long</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: GREEN, letterSpacing: '-0.03em' }}>{stats.long_wr !== null ? `${stats.long_wr}%` : '—'}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stats.long_wr ?? 0}%`, background: `linear-gradient(90deg, ${GREEN}, #4ade80)`, borderRadius: 3, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: t.sub, marginTop: 6 }}>{filtered.filter(x => x.direction === 'Long').length} {tr('analytics_trades')}</div>
                </div>
                <div style={{ background: dark ? 'rgba(255,69,58,0.06)' : 'rgba(255,69,58,0.08)', border: `1px solid rgba(255,69,58,0.15)`, borderRadius: 14, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: RED }}>↓ Short</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: RED, letterSpacing: '-0.03em' }}>{stats.short_wr !== null ? `${stats.short_wr}%` : '—'}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stats.short_wr ?? 0}%`, background: `linear-gradient(90deg, ${RED}, #ff6b61)`, borderRadius: 3, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: t.sub, marginTop: 6 }}>{filtered.filter(x => x.direction === 'Short').length} {tr('analytics_trades')}</div>
                </div>
              </div>
            </div>
          )}

          {/* Charts row 1 */}
          <div className="chart-grid-2" style={{ marginBottom: 16 }}>
            <div style={{ ...glassCard(dark), position: 'relative', overflow: 'hidden' }}>
              {dark && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />}
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em', position: 'relative' }}>{tr('dashboard_balance')}</div>
              {balance.length > 1 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={balance}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: t.sub }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: t.sub }} axisLine={false} tickLine={false} width={46} />
                    <Tooltip content={<CustomTooltip dark={dark} />} />
                    <Line type="monotone" dataKey="pnl" stroke={stats.total_pnl >= 0 ? GREEN : RED} strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub, fontSize: 13 }}>{tr('dashboard_insufficient')}</div>
              )}
            </div>
            <div style={{ ...glassCard(dark), position: 'relative', overflow: 'hidden' }}>
              {dark && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />}
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em', position: 'relative' }}>{tr('dashboard_results')}</div>
              {pie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={pie} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3}>
                        {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % 3]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => [`${v}`, n]} contentStyle={{ background: dark ? 'rgba(28,28,30,0.92)' : '#fff', border: `1px solid ${t.border}`, borderRadius: 10, fontFamily: FONT, backdropFilter: 'blur(20px)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 4, flexWrap: 'wrap', position: 'relative' }}>
                    {pie.map((p, i) => (
                      <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i] }} />
                        <span style={{ fontSize: 12, color: t.sub }}>{resultLabel(p.name)} {p.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub, fontSize: 13 }}>{tr('dashboard_no_data')}</div>
              )}
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="chart-grid-2" style={{ marginBottom: 16 }}>
            <div style={{ ...glassCard(dark), position: 'relative', overflow: 'hidden' }}>
              {dark && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />}
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em', position: 'relative' }}>{tr('dashboard_pnl_pairs')}</div>
              {byPair.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={byPair} barSize={22}>
                    <XAxis dataKey="pair" tick={{ fontSize: 9, fill: t.sub }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: t.sub }} axisLine={false} tickLine={false} width={42} />
                    <Tooltip content={<CustomTooltip dark={dark} />} />
                    <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                      {byPair.map((row, i) => <Cell key={i} fill={row.pnl >= 0 ? GREEN : RED} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub, fontSize: 13 }}>{tr('dashboard_no_data')}</div>
              )}
            </div>
            <div style={{ ...glassCard(dark), position: 'relative', overflow: 'hidden' }}>
              {dark && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />}
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em', position: 'relative' }}>{tr('dashboard_pnl_setups')}</div>
              {bySetup.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={bySetup} barSize={22}>
                    <XAxis dataKey="setup" tick={{ fontSize: 9, fill: t.sub }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: t.sub }} axisLine={false} tickLine={false} width={42} />
                    <Tooltip content={<CustomTooltip dark={dark} />} />
                    <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                      {bySetup.map((row, i) => <Cell key={i} fill={row.pnl >= 0 ? GREEN : RED} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub, fontSize: 13 }}>{tr('dashboard_no_data')}</div>
              )}
            </div>
          </div>

          {/* P&L по днях тижня */}
          <div style={{ ...glassCard(dark), marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
            {dark && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />}
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em', position: 'relative' }}>{tr('dashboard_weekday_pnl')}</div>
            {filtered.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, position: 'relative' }}>
                {byWeekday.map(d => {
                  const isPos = d.pnl > 0
                  const isNeg = d.pnl < 0
                  const color = isPos ? GREEN : isNeg ? RED : t.sub
                  const maxAbs = Math.max(...byWeekday.map(x => Math.abs(x.pnl)), 1)
                  const barH = d.count > 0 ? Math.max(4, Math.round((Math.abs(d.pnl) / maxAbs) * 60)) : 4
                  return (
                    <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '-0.02em' }}>
                        {d.pnl !== 0 ? `${isPos ? '+' : ''}${d.pnl.toFixed(0)}$` : '—'}
                      </div>
                      <div style={{ width: '100%', height: 64, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <div style={{
                          width: '60%', height: barH, borderRadius: 4,
                          background: d.count > 0
                            ? isPos ? `linear-gradient(180deg, #4ade80, ${GREEN})` : `linear-gradient(180deg, #ff6b61, ${RED})`
                            : dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                          opacity: d.count > 0 ? 1 : 0.3,
                          transition: 'height 0.4s ease',
                          position: 'relative', overflow: 'hidden',
                        }}>
                          {d.count > 0 && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)' }} />
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: t.sub }}>{d.day}</div>
                      {d.count > 0 && <div style={{ fontSize: 10, color: t.sub }}>{d.count} {tr('analytics_trades')}</div>}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub, fontSize: 13 }}>{tr('dashboard_no_data')}</div>
            )}
          </div>

          {/* Recent Trades */}
          <div style={{ ...glassCard(dark), position: 'relative', overflow: 'hidden' }}>
            {dark && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, position: 'relative' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>{tr('dashboard_recent')}</div>
              <a href="/trades" style={{ fontSize: 13, color: BLUE, textDecoration: 'none', fontWeight: 600 }}>{tr('dashboard_all_trades')}</a>
            </div>
            {recent.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: t.sub, fontSize: 14, position: 'relative' }}>
                {tr('dashboard_add_first')}{' '}
                <a href="/trades/new" style={{ color: BLUE, textDecoration: 'none', fontWeight: 600 }}>{tr('dashboard_add_link')}</a>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', position: 'relative' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
                  <thead>
                    <tr>
                      {[tr('th_date'), tr('th_pair'), tr('th_setup'), tr('th_rr'), tr('th_direction'), tr('th_result'), tr('th_pnl'), tr('th_grade')].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: t.sub, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${t.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((trade, i) => (
                      <tr key={trade.id} onClick={() => window.location.href = `/trades/${trade.id}`}
                        style={{ background: i % 2 === 0 ? 'transparent' : dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', cursor: 'pointer' }}>
                        <td style={{ padding: '10px 10px', color: t.sub, fontSize: 12 }}>{trade.date}</td>
                        <td style={{ padding: '10px 10px', fontWeight: 700, color: t.text }}>{trade.pair}</td>
                        <td style={{ padding: '10px 10px', color: t.sub, fontSize: 11, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trade.setup}</td>
                        <td style={{ padding: '10px 10px', color: t.sub }}>{trade.rr}</td>
                        <td style={{ padding: '10px 10px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: trade.direction === 'Long' ? GREEN : RED }}>{trade.direction}</span>
                        </td>
                        <td style={{ padding: '10px 10px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: resultColor(trade.result) + '18', color: resultColor(trade.result) }}>
                            {resultLabel(trade.result)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 10px', fontWeight: 700, color: (trade.profit_usd || 0) >= 0 ? GREEN : RED, fontSize: 12 }}>
                          {(trade.profit_usd || 0) >= 0 ? '+' : ''}{(trade.profit_usd || 0).toFixed(2)}$
                        </td>
                        <td style={{ padding: '10px 10px' }}>
                          {trade.self_grade && (
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 8, background: trade.self_grade === 'A' ? `${GREEN}18` : trade.self_grade === 'D' ? `${RED}18` : `${ORANGE}18`, color: trade.self_grade === 'A' ? GREEN : trade.self_grade === 'D' ? RED : ORANGE }}>
                              {trade.self_grade}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`
        .dashboard-container { max-width: 1200px; margin: 0 auto; }
        .stat-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 12px; }
        .chart-grid-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
        @media (max-width: 1200px) { .stat-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 768px) {
          .dashboard-container { padding: 16px 12px !important; }
          .stat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .chart-grid-2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  )
}
