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
    surface:  dark ? '#1c1c1e' : '#ffffff',
    surface2: dark ? '#2c2c2e' : '#f2f2f7',
    border:   dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    text:     dark ? '#f5f5f7' : '#1c1c1e',
    sub:      '#8e8e93',
    shadow:   dark
      ? '0 1px 3px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.06)'
      : '0 1px 3px rgba(0,0,0,0.07),0 0 0 1px rgba(0,0,0,0.05)',
  }
}

const GREEN  = '#30d158'
const RED    = '#ff453a'
const GRAY   = '#8e8e93'
const BLUE   = '#0a84ff'
const ORANGE = '#ff9f0a'

function card(t: ReturnType<typeof th>): React.CSSProperties {
  return {
    background: t.surface, borderRadius: 18, padding: '22px 24px',
    boxShadow: t.shadow, border: `1px solid ${t.border}`,
  }
}

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

  return { total, win_rate, total_pnl, avg_rr, best_setup, win_streak, loss_streak }
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

function CustomTooltip({ active, payload, dark }: any) {
  const t = th(dark)
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: '8px 14px', fontFamily: FONT, boxShadow: t.shadow }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: val >= 0 ? GREEN : RED }}>{val >= 0 ? '+' : ''}{val}$</div>
      <div style={{ fontSize: 11, color: t.sub }}>{payload[0].payload?.date || payload[0].payload?.pair || payload[0].payload?.setup}</div>
    </div>
  )
}

const PIE_COLORS = [GREEN, RED, GRAY]

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
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'closed') // ← тільки закриті угоди
        .order('date', { ascending: false })
      setTrades(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filterByPeriod(trades, period)
  const stats    = calcStats(filtered)
  const balance  = calcBalance(filtered)
  const pie      = calcPie(filtered)
  const byPair   = calcByPair(filtered)
  const bySetup  = calcBySetup(filtered)
  const recent   = filtered.slice(0, 10)

  const statCards = [
    { label: tr('dashboard_trades'),    value: stats.total,                                                          color: BLUE   },
    { label: tr('dashboard_winrate'),   value: `${stats.win_rate}%`,                                                color: stats.win_rate >= 50 ? GREEN : RED },
    { label: tr('dashboard_totalpnl'),  value: `${stats.total_pnl >= 0 ? '+' : ''}${stats.total_pnl.toFixed(2)}$`, color: stats.total_pnl >= 0 ? GREEN : RED },
    { label: tr('dashboard_avgrr'),     value: stats.avg_rr.toFixed(2),                                             color: ORANGE },
    { label: tr('dashboard_bestsetup'), value: stats.best_setup,                                                    color: t.text },
    { label: tr('dashboard_maxstreak'), value: `${stats.win_streak}W / ${stats.loss_streak}L`,                     color: t.sub  },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: FONT }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: t.sub }}>
        {tr('dashboard_loading')}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: FONT, transition: 'background 0.3s' }}>
      <NavBar />
      <div style={{ padding: '24px 16px' }} className="dashboard-container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: '-0.04em' }}>{tr('dashboard_title')}</div>
            <div style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>{filtered.length} {tr('dashboard_subtitle')}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, background: t.surface2, borderRadius: 12, padding: 4, border: `1px solid ${t.border}` }}>
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)} style={{
                padding: '6px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: period === p.value ? t.surface : 'transparent',
                color: period === p.value ? t.text : t.sub,
                fontFamily: FONT, fontSize: 13, fontWeight: period === p.value ? 700 : 400,
                boxShadow: period === p.value ? t.shadow : 'none', transition: 'all 0.15s',
              }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          {statCards.map(sc => (
            <div key={sc.label} style={{ ...card(t), padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>{sc.label}</div>
              <div style={{ fontSize: sc.label === tr('dashboard_bestsetup') ? 11 : 20, fontWeight: 800, color: sc.color, letterSpacing: '-0.03em', lineHeight: 1.2 }}>{sc.value}</div>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="chart-grid-2" style={{ marginBottom: 16 }}>
          <div style={card(t)}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em' }}>{tr('dashboard_balance')}</div>
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

          <div style={card(t)}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em' }}>{tr('dashboard_results')}</div>
            {pie.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={pie} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3}>
                      {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % 3]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any, n: any) => [`${v}`, n]} contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, fontFamily: FONT }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
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
        <div className="chart-grid-2" style={{ marginBottom: 24 }}>
          <div style={card(t)}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em' }}>{tr('dashboard_pnl_pairs')}</div>
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

          <div style={card(t)}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em' }}>{tr('dashboard_pnl_setups')}</div>
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

        {/* Recent Trades */}
        <div style={card(t)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>{tr('dashboard_recent')}</div>
            <a href="/trades" style={{ fontSize: 13, color: BLUE, textDecoration: 'none', fontWeight: 600 }}>{tr('dashboard_all_trades')}</a>
          </div>
          {recent.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: t.sub, fontSize: 14 }}>
              {tr('dashboard_add_first')}{' '}
              <a href="/trades/new" style={{ color: BLUE, textDecoration: 'none', fontWeight: 600 }}>{tr('dashboard_add_link')}</a>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
                      style={{ background: i % 2 === 0 ? 'transparent' : `${t.surface2}70`, cursor: 'pointer' }}>
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

      <style>{`
        .dashboard-container { max-width: 1200px; margin: 0 auto; }
        .stat-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
        .chart-grid-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
        @media (max-width: 1024px) { .stat-grid { grid-template-columns: repeat(3, 1fr); } }
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
