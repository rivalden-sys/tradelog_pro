'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useLocale } from '@/hooks/useLocale'
import { createClient } from '@/lib/supabase/client'
import { Trade } from '@/types'
import NavBar from '@/components/layout/NavBar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const FONT = "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', sans-serif"

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
const BLUE   = '#0a84ff'
const ORANGE = '#ff9f0a'

function card(t: ReturnType<typeof th>): React.CSSProperties {
  return { background: t.surface, borderRadius: 18, padding: '22px 24px', boxShadow: t.shadow, border: `1px solid ${t.border}` }
}

export default function AnalyticsPage() {
  const { dark } = useTheme()
  const t = th(dark)
  const { t: tr } = useLocale()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('trades')
        .select('id, date, pair, setup, direction, result, rr, profit_usd, profit_pct, self_grade')
        .eq('user_id', user.id).order('date', { ascending: true })
      setTrades(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const setupMap: Record<string, { wins: number; total: number; pnl: number }> = {}
  trades.forEach(tr2 => {
    if (!setupMap[tr2.setup]) setupMap[tr2.setup] = { wins: 0, total: 0, pnl: 0 }
    setupMap[tr2.setup].total++
    setupMap[tr2.setup].pnl += tr2.profit_usd || 0
    if (tr2.result === 'Тейк') setupMap[tr2.setup].wins++
  })
  const bySetup = Object.entries(setupMap)
    .map(([setup, v]) => ({ setup: setup.split('+')[0].trim(), wr: Math.round((v.wins / v.total) * 100), total: v.total, pnl: Math.round(v.pnl * 100) / 100 }))
    .sort((a, b) => b.wr - a.wr)

  const pairMap: Record<string, { wins: number; total: number; pnl: number }> = {}
  trades.forEach(tr2 => {
    if (!pairMap[tr2.pair]) pairMap[tr2.pair] = { wins: 0, total: 0, pnl: 0 }
    pairMap[tr2.pair].total++
    pairMap[tr2.pair].pnl += tr2.profit_usd || 0
    if (tr2.result === 'Тейк') pairMap[tr2.pair].wins++
  })
  const byPair = Object.entries(pairMap)
    .map(([pair, v]) => ({ pair, wr: Math.round((v.wins / v.total) * 100), total: v.total, pnl: Math.round(v.pnl * 100) / 100 }))
    .sort((a, b) => b.pnl - a.pnl)

  const gradeMap: Record<string, number> = {}
  trades.forEach(tr2 => { if (tr2.self_grade) gradeMap[tr2.self_grade] = (gradeMap[tr2.self_grade] || 0) + 1 })
  const byGrade = ['A', 'B', 'C', 'D'].map(g => ({ grade: g, count: gradeMap[g] || 0 }))

  const rrBuckets: Record<string, number> = {}
  trades.forEach(tr2 => {
    if (!tr2.rr) return
    const bucket = `${Math.floor(tr2.rr * 2) / 2}`
    rrBuckets[bucket] = (rrBuckets[bucket] || 0) + 1
  })
  const rrDist = Object.entries(rrBuckets).map(([rr, count]) => ({ rr, count })).sort((a, b) => parseFloat(a.rr) - parseFloat(b.rr))

  const monthMap: Record<string, number> = {}
  trades.forEach(tr2 => {
    const month = tr2.date.slice(0, 7)
    monthMap[month] = (monthMap[month] || 0) + (tr2.profit_usd || 0)
  })
  const byMonth = Object.entries(monthMap)
    .map(([month, pnl]) => ({ month: month.slice(5), pnl: Math.round(pnl * 100) / 100 }))
    .sort((a, b) => a.month.localeCompare(b.month))

  const disciplineTrades = trades.filter(tr2 => tr2.self_grade === 'C' || tr2.self_grade === 'D')
  const disciplineScore  = trades.length ? Math.round(((trades.length - disciplineTrades.length) / trades.length) * 100) : 0

  const longs   = trades.filter(tr2 => tr2.direction === 'Long')
  const shorts  = trades.filter(tr2 => tr2.direction === 'Short')
  const longWR  = longs.length  ? Math.round((longs.filter(tr2  => tr2.result === 'Тейк').length / longs.length)  * 100) : 0
  const shortWR = shorts.length ? Math.round((shorts.filter(tr2 => tr2.result === 'Тейк').length / shorts.length) * 100) : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: FONT }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: t.sub }}>{tr('analytics_loading')}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: FONT, transition: 'background 0.3s' }}>
      <NavBar />
      <div style={{ padding: '32px 40px' }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.04em' }}>{tr('analytics_title')}</div>
          <div style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>{trades.length} {tr('analytics_trades')}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: tr('analytics_discipline'), value: `${disciplineScore}%`,              color: disciplineScore >= 70 ? GREEN : RED },
            { label: tr('analytics_long_wr'),    value: `${longWR}%`,                       color: longWR  >= 50 ? GREEN : RED },
            { label: tr('analytics_short_wr'),   value: `${shortWR}%`,                      color: shortWR >= 50 ? GREEN : RED },
            { label: tr('analytics_ls_ratio'),   value: `${longs.length} / ${shorts.length}`, color: t.text },
          ].map(sc => (
            <div key={sc.label} style={{ ...card(t), padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.sub, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>{sc.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: sc.color, letterSpacing: '-0.03em' }}>{sc.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={card(t)}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em' }}>{tr('analytics_wr_setups')}</div>
            {bySetup.length === 0 ? (
              <div style={{ color: t.sub, fontSize: 13, textAlign: 'center', padding: '32px 0' }}>{tr('analytics_no_data')}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bySetup.map(s => (
                  <div key={s.setup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{s.setup}</span>
                      <span style={{ fontSize: 13, color: s.wr >= 50 ? GREEN : RED, fontWeight: 700 }}>{s.wr}% <span style={{ color: t.sub, fontWeight: 400 }}>({s.total})</span></span>
                    </div>
                    <div style={{ height: 6, background: t.surface2, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.wr}%`, background: s.wr >= 50 ? GREEN : RED, borderRadius: 3, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={card(t)}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em' }}>{tr('analytics_pnl_month')}</div>
            {byMonth.length === 0 ? (
              <div style={{ color: t.sub, fontSize: 13, textAlign: 'center', padding: '32px 0' }}>{tr('analytics_no_data')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byMonth} barSize={28}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.sub }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: t.sub }} axisLine={false} tickLine={false} width={46} />
                  <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, fontFamily: FONT }} formatter={(v: any) => [`${v}$`, 'P&L']} />
                  <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                    {byMonth.map((row, i) => <Cell key={i} fill={row.pnl >= 0 ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={card(t)}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 18, letterSpacing: '-0.02em' }}>{tr('analytics_by_pairs')}</div>
            {byPair.length === 0 ? (
              <div style={{ color: t.sub, fontSize: 13, textAlign: 'center', padding: '32px 0' }}>{tr('analytics_no_data')}</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {[tr('analytics_th_pair'), tr('analytics_th_trades'), tr('analytics_th_wr'), tr('analytics_th_pnl')].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: t.sub, fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byPair.map(p => (
                    <tr key={p.pair} style={{ borderTop: `1px solid ${t.border}` }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600, color: t.text }}>{p.pair}</td>
                      <td style={{ padding: '10px 8px', color: t.sub }}>{p.total}</td>
                      <td style={{ padding: '10px 8px', color: p.wr >= 50 ? GREEN : RED, fontWeight: 600 }}>{p.wr}%</td>
                      <td style={{ padding: '10px 8px', color: p.pnl >= 0 ? GREEN : RED, fontWeight: 600 }}>{p.pnl >= 0 ? '+' : ''}{p.pnl}$</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={card(t)}>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 16, letterSpacing: '-0.02em' }}>{tr('analytics_grades')}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {byGrade.map(g => {
                  const colors: Record<string, string> = { A: GREEN, B: BLUE, C: ORANGE, D: RED }
                  return (
                    <div key={g.grade} style={{ flex: 1, textAlign: 'center', padding: '14px 8px', borderRadius: 12, background: (colors[g.grade] || t.sub) + '18' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: colors[g.grade] || t.sub }}>{g.count}</div>
                      <div style={{ fontSize: 12, color: t.sub, marginTop: 4 }}>Grade {g.grade}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={card(t)}>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 16, letterSpacing: '-0.02em' }}>{tr('analytics_rr_dist')}</div>
              {rrDist.length === 0 ? (
                <div style={{ color: t.sub, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>{tr('analytics_no_data')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={rrDist} barSize={20}>
                    <XAxis dataKey="rr" tick={{ fontSize: 10, fill: t.sub }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, fontFamily: FONT }} formatter={(v: any) => [v, 'Trades']} />
                    <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}