'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import { Trade, Period } from '@/types'
import NavBar from '@/components/layout/NavBar'

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
    sub:      dark ? '#8e8e93' : '#8e8e93',
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
    background: t.surface,
    borderRadius: 18,
    padding: '22px 24px',
    boxShadow: t.shadow,
    border: `1px solid ${t.border}`,
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
  const wins = trades.filter(t => t.result === 'Тейк')
  const total = trades.length
  const win_rate = total ? Math.round((wins.length / total) * 100) : 0
  const total_pnl = trades.reduce((s, t) => s + (t.profit_usd || 0), 0)
  const avg_rr = total ? trades.reduce((s, t) => s + (t.rr || 0), 0) / total : 0

  const setupMap: Record<string, { wins: number; total: number }> = {}
  trades.forEach(t => {
    if (!setupMap[t.setup]) setupMap[t.setup] = { wins: 0, total: 0 }
    setupMap[t.setup].total++
    if (t.result === 'Тейк') setupMap[t.setup].wins++
  })
  let best_setup = '—'
  let best_wr = -1
  Object.entries(setupMap).forEach(([s, v]) => {
    if (v.total >= 2 && v.wins / v.total > best_wr) {
      best_wr = v.wins / v.total
      best_setup = s
    }
  })

  let win_streak = 0, loss_streak = 0, cur_w = 0, cur_l = 0
  ;[...trades].sort((a, b) => a.date.localeCompare(b.date)).forEach(t => {
    if (t.result === 'Тейк') { cur_w++; cur_l = 0 }
    else                      { cur_l++; cur_w = 0 }
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
  const stop = trades.filter(t => t.result === 'Стоп').length
  const bu   = trades.filter(t => t.result === 'БУ').length
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
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
    .slice(0, 8)
}

function calcBySetup(trades: Trade[]) {
  const map: Record<string, number> = {}
  trades.forEach(t => { map[t.setup] = (map[t.setup] || 0) + (t.profit_usd || 0) })
  return Object.entries(map)
    .map(([setup, pnl]) => ({ setup: setup.split('+')[0].trim(), pnl: Math.round(pnl * 100) / 100 }))
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
    .slice(0, 6)
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

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Неделя', value: 'week' },
  { label: 'Месяц',  value: 'month' },
  { label: 'Всё',    value: 'all' },
]

export default function DashboardPage() {
  const dark = useDark()
  const t    = th(dark)

  const [trades,  setTrades]  = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [period,  setPeriod]  = useState<Period>('month')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
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
    { label: 'Сделок',       value: stats.total,                                                         color: BLUE   },
    { label: 'Win Rate',     value: `${stats.win_rate}%`,                                                color: stats.win_rate >= 50 ? GREEN : RED },
    { label: 'Total P&L',   value: `${stats.total_pnl >= 0 ? '+' : ''}${stats.total_pnl.toFixed(2)}$`, color: stats.total_pnl >= 0 ? GREEN : RED },
    { label: 'Avg RR',       value: stats.avg_rr.toFixed(2),                                             color: ORANGE },
    { label: 'Лучший сетап', value: stats.best_setup,                                                    color: t.text },
    { label: 'Макс. серия',  value: `${stats.win_streak}W / ${stats.loss_streak}L`,                     color: t.sub  },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: FONT }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: t.sub }}>
        Загрузка...
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: FONT, transition: 'background 0.3s' }}>
      <NavBar />
      <div style={{ padding: '32px 40px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.04em' }}>Dashboard</div>
            <div style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>{filtered.length} сделок за период</div>
          </div>
          <div style={{ display: 'flex', gap: 6, background: t.surface2, borderRadius: 12, padding: 4, border: `1px solid ${t.border}` }}>
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                style={{
                  padding: '7px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: period === p.value ? t.surface : 'transparent',
                  color: period === p.value ? t.text : t.sub,
                  fontFamily: FONT, fontSize: 13, fontWeight: period === p.value ? 700 : 400,
                  boxShadow: period === p.value ? t.shadow : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 24 }}>
          {statCards.map(sc => (
            <div key={sc.label} style={{ ...card(t), padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>{sc.label}</div>
              <div style={{ fontSize: sc.label === 'Лучший сетап' ? 11 : 22, fontWeight: 800, color: sc.color, letterSpacing: '-0.03em', lineHeight: 1.2 }}>{sc.value}</div>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={card(t)}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em' }}>Кривая баланса</div>
            {balance.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={balance}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: t.sub }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: t.sub }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip content={<CustomTooltip dark={dark} />} />
                  <Line type="monotone" dataKey="pnl" stroke={stats.total_pnl >= 0 ? GREEN : RED} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub, fontSize: 13 }}>Недостаточно данных</div>
            )}
          </div>

          <div style={card(t)}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em' }}>Тейк / Стоп / БУ</div>
            {pie.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pie} dataKey="value" cx="50%" cy="50%" innerRadius={44} outerRadius={68} paddingAngle={3}>
                      {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % 3]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any, n: any) => [`${v} сделок`, n]} contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, fontFamily: FONT }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
                  {pie.map((p, i) => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i] }} />
                      <span style={{ fontSize: 12, color: t.sub }}>{p.name} {p.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub, fontSize: 13 }}>Нет данных</div>
            )}
          </div>
        </div>

        {/* Charts row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={card(t)}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em' }}>P&L по парам</div>
            {byPair.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={byPair} barSize={24}>
                  <XAxis dataKey="pair" tick={{ fontSize: 10, fill: t.sub }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: t.sub }} axisLine={false} tickLine={false} width={46} />
                  <Tooltip content={<CustomTooltip dark={dark} />} />
                  <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                    {byPair.map((row, i) => <Cell key={i} fill={row.pnl >= 0 ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub, fontSize: 13 }}>Нет данных</div>
            )}
          </div>

          <div style={card(t)}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em' }}>P&L по сетапам</div>
            {bySetup.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={bySetup} barSize={24}>
                  <XAxis dataKey="setup" tick={{ fontSize: 10, fill: t.sub }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: t.sub }} axisLine={false} tickLine={false} width={46} />
                  <Tooltip content={<CustomTooltip dark={dark} />} />
                  <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                    {bySetup.map((row, i) => <Cell key={i} fill={row.pnl >= 0 ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.sub, fontSize: 13 }}>Нет данных</div>
            )}
          </div>
        </div>

        {/* Recent trades */}
        <div style={card(t)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>Последние сделки</div>
            <a href="/trades" style={{ fontSize: 13, color: BLUE, textDecoration: 'none', fontWeight: 600 }}>Все сделки →</a>
          </div>
          {recent.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: t.sub, fontSize: 14 }}>
              Нет сделок за этот период.{' '}
              <a href="/trades/new" style={{ color: BLUE, textDecoration: 'none', fontWeight: 600 }}>Добавить первую →</a>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    {['Дата', 'Пара', 'Сетап', 'RR', 'Направление', 'Результат', 'P&L $', 'Оценка'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: t.sub, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${t.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((tr, i) => (
                    <tr
                      key={tr.id}
                      onClick={() => window.location.href = `/trades/${tr.id}`}
                      style={{ background: i % 2 === 0 ? 'transparent' : `${t.surface2}70`, cursor: 'pointer' }}
                    >
                      <td style={{ padding: '10px 12px', color: t.sub, fontSize: 13 }}>{tr.date}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: t.text }}>{tr.pair}</td>
                      <td style={{ padding: '10px 12px', color: t.sub, fontSize: 12 }}>{tr.setup}</td>
                      <td style={{ padding: '10px 12px', color: t.sub }}>{tr.rr}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: tr.direction === 'Long' ? GREEN : RED }}>{tr.direction}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                          background: tr.result === 'Тейк' ? `${GREEN}18` : tr.result === 'Стоп' ? `${RED}18` : `${GRAY}18`,
                          color:      tr.result === 'Тейк' ? GREEN        : tr.result === 'Стоп' ? RED        : GRAY,
                        }}>
                          {tr.result}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: (tr.profit_usd || 0) >= 0 ? GREEN : RED }}>
                        {(tr.profit_usd || 0) >= 0 ? '+' : ''}{(tr.profit_usd || 0).toFixed(2)}$
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {tr.self_grade && (
                          <span style={{
                            fontSize: 12, fontWeight: 800, padding: '3px 9px', borderRadius: 8,
                            background: tr.self_grade === 'A' ? `${GREEN}18` : tr.self_grade === 'D' ? `${RED}18` : `${ORANGE}18`,
                            color:      tr.self_grade === 'A' ? GREEN        : tr.self_grade === 'D' ? RED        : ORANGE,
                          }}>
                            {tr.self_grade}
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
  )
}