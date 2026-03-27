'use client'

import { useState, useEffect } from 'react'
import { useLocale } from '@/hooks/useLocale'
import { createClient } from '@/lib/supabase/client'
import { Trade } from '@/types'
import NavBar from '@/components/layout/NavBar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { DARK, LIGHT } from '@/lib/colors'

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

export default function AnalyticsPage() {
  const dark = useDark()
  const { t: tr } = useLocale()

  const GREEN  = dark ? DARK.green  : LIGHT.green
  const RED    = dark ? DARK.red    : LIGHT.red
  const BLUE   = dark ? DARK.blue   : LIGHT.blue
  const ORANGE = dark ? DARK.orange : LIGHT.orange

  const textColor   = dark ? DARK.text   : LIGHT.text
  const subColor    = dark ? DARK.sub    : LIGHT.sub
  const borderColor = dark ? DARK.border : LIGHT.border

  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

  const [trades,  setTrades]  = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('trades').select('*')
        .eq('user_id', user.id).eq('status', 'closed')
        .order('date', { ascending: true })
      setTrades((data as Trade[]) || [])
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

  const gradedTrades     = trades.filter(tr2 => tr2.self_grade)
  const disciplineTrades = gradedTrades.filter(tr2 => tr2.self_grade === 'C' || tr2.self_grade === 'D')
  const disciplineScore  = gradedTrades.length ? Math.round(((gradedTrades.length - disciplineTrades.length) / gradedTrades.length) * 100) : -1

  const longs   = trades.filter(tr2 => tr2.direction === 'Long')
  const shorts  = trades.filter(tr2 => tr2.direction === 'Short')
  const longWR  = longs.length  ? Math.round((longs.filter(tr2  => tr2.result === 'Тейк').length / longs.length)  * 100) : -1
  const shortWR = shorts.length ? Math.round((shorts.filter(tr2 => tr2.result === 'Тейк').length / shorts.length) * 100) : -1

  const gradeColors: Record<string, string> = { A: GREEN, B: BLUE, C: ORANGE, D: RED }

  function glassCard(): React.CSSProperties {
    return {
      background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderRadius: 20, padding: '20px',
      border: `1px solid ${borderColor}`,
      boxShadow: dark
        ? 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.02)'
        : 'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)',
      position: 'relative', overflow: 'hidden',
    }
  }

  function statCard(): React.CSSProperties {
    return {
      background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderRadius: 16, padding: '16px 18px',
      border: `1px solid ${borderColor}`,
      boxShadow: dark
        ? 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.02)'
        : 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.02)',
      position: 'relative', overflow: 'hidden',
    }
  }

  const glare = (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: dark ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', background: dark ? DARK.bg : LIGHT.bg, fontFamily: FONT }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: subColor }}>{tr('analytics_loading')}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: dark ? DARK.bg : LIGHT.bg }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: noiseSvg, opacity: dark ? 0.35 : 0.15 }} />
      <div style={{ position: 'fixed', top: -200, left: '30%', width: 600, height: 600, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(48,209,88,0.06) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(10,132,255,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -200, right: '10%', width: 500, height: 500, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(10,132,255,0.04) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(48,209,88,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: textColor, letterSpacing: '-0.04em' }}>{tr('analytics_title')}</div>
            <div style={{ fontSize: 13, color: subColor, marginTop: 2 }}>{trades.length} {tr('analytics_trades')}</div>
          </div>

          {/* Stat cards */}
          <div className="analytics-stat-grid" style={{ marginBottom: 20 }}>
            {[
              { label: tr('analytics_discipline'), value: disciplineScore === -1 ? '—' : `${disciplineScore}%`, color: disciplineScore === -1 ? subColor : disciplineScore >= 70 ? GREEN : RED },
              { label: tr('analytics_long_wr'),    value: longWR  === -1 ? '—' : `${longWR}%`,                  color: longWR  === -1 ? subColor : longWR  >= 50 ? GREEN : RED },
              { label: tr('analytics_short_wr'),   value: shortWR === -1 ? '—' : `${shortWR}%`,                 color: shortWR === -1 ? subColor : shortWR >= 50 ? GREEN : RED },
              { label: tr('analytics_ls_ratio'),   value: `${longs.length} / ${shorts.length}`,                 color: textColor },
            ].map(sc => (
              <div key={sc.label} style={statCard()}>
                {glare}
                <div style={{ fontSize: 11, fontWeight: 600, color: subColor, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8, position: 'relative' }}>{sc.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: sc.color, letterSpacing: '-0.03em', position: 'relative' }}>{sc.value}</div>
              </div>
            ))}
          </div>

          {/* Charts row 1 */}
          <div className="analytics-grid-2" style={{ marginBottom: 16 }}>

            {/* Win Rate by Setup */}
            <div style={glassCard()}>
              {glare}
              <div style={{ fontSize: 15, fontWeight: 700, color: textColor, marginBottom: 18, position: 'relative' }}>{tr('analytics_wr_setups')}</div>
              {bySetup.length === 0 ? (
                <div style={{ color: subColor, fontSize: 13, textAlign: 'center', padding: '32px 0' }}>{tr('analytics_no_data')}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                  {bySetup.map(s => (
                    <div key={s.setup}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: textColor, fontWeight: 500 }}>{s.setup}</span>
                        <span style={{ fontSize: 13, color: s.wr >= 50 ? GREEN : RED, fontWeight: 700 }}>
                          {s.wr}% <span style={{ color: subColor, fontWeight: 400 }}>({s.total})</span>
                        </span>
                      </div>
                      <div style={{ height: 6, background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${s.wr}%`, background: s.wr >= 50 ? `linear-gradient(90deg, ${GREEN}, #4ade80)` : `linear-gradient(90deg, ${RED}, #ff6b61)`, borderRadius: 3, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* P&L by Month */}
            <div style={glassCard()}>
              {glare}
              <div style={{ fontSize: 15, fontWeight: 700, color: textColor, marginBottom: 18, position: 'relative' }}>{tr('analytics_pnl_month')}</div>
              {byMonth.length === 0 ? (
                <div style={{ color: subColor, fontSize: 13, textAlign: 'center', padding: '32px 0' }}>{tr('analytics_no_data')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={byMonth} barSize={28}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: subColor }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: subColor }} axisLine={false} tickLine={false} width={46} />
                    <Tooltip
                      contentStyle={{ background: dark ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.9)', border: `1px solid ${borderColor}`, borderRadius: 10, fontFamily: FONT, backdropFilter: 'blur(20px)' }}
                      formatter={(v: any) => [`${v}$`, 'P&L']}
                    />
                    <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                      {byMonth.map((row, i) => <Cell key={i} fill={row.pnl >= 0 ? GREEN : RED} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="analytics-grid-2" style={{ marginBottom: 16 }}>

            {/* Stats by Pair */}
            <div style={glassCard()}>
              {glare}
              <div style={{ fontSize: 15, fontWeight: 700, color: textColor, marginBottom: 18, position: 'relative' }}>{tr('analytics_by_pairs')}</div>
              {byPair.length === 0 ? (
                <div style={{ color: subColor, fontSize: 13, textAlign: 'center', padding: '32px 0' }}>{tr('analytics_no_data')}</div>
              ) : (
                <div style={{ overflowX: 'auto', position: 'relative' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 280 }}>
                    <thead>
                      <tr>
                        {[tr('analytics_th_pair'), tr('analytics_th_trades'), tr('analytics_th_wr'), tr('analytics_th_pnl')].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: subColor, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {byPair.map(p => (
                        <tr key={p.pair} style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                          <td style={{ padding: '10px 8px', fontWeight: 700, color: textColor }}>{p.pair}</td>
                          <td style={{ padding: '10px 8px', color: subColor }}>{p.total}</td>
                          <td style={{ padding: '10px 8px', color: p.wr >= 50 ? GREEN : RED, fontWeight: 700 }}>{p.wr}%</td>
                          <td style={{ padding: '10px 8px', color: p.pnl >= 0 ? GREEN : RED, fontWeight: 700 }}>{p.pnl >= 0 ? '+' : ''}{p.pnl}$</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Grades + RR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={glassCard()}>
                {glare}
                <div style={{ fontSize: 15, fontWeight: 700, color: textColor, marginBottom: 16, position: 'relative' }}>{tr('analytics_grades')}</div>
                <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
                  {byGrade.map(g => (
                    <div key={g.grade} style={{
                      flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: 12,
                      background: (gradeColors[g.grade] || subColor) + '18',
                      border: `1px solid ${(gradeColors[g.grade] || subColor)}33`,
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: gradeColors[g.grade] || subColor }}>{g.count}</div>
                      <div style={{ fontSize: 11, color: subColor, marginTop: 4 }}>Grade {g.grade}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={glassCard()}>
                {glare}
                <div style={{ fontSize: 15, fontWeight: 700, color: textColor, marginBottom: 16, position: 'relative' }}>{tr('analytics_rr_dist')}</div>
                {rrDist.length === 0 ? (
                  <div style={{ color: subColor, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>{tr('analytics_no_data')}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={rrDist} barSize={20}>
                      <XAxis dataKey="rr" tick={{ fontSize: 10, fill: subColor }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: dark ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.9)', border: `1px solid ${borderColor}`, borderRadius: 10, fontFamily: FONT, backdropFilter: 'blur(20px)' }}
                        formatter={(v: any) => [v, 'Trades']}
                      />
                      <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .analytics-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .analytics-grid-2    { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 768px) {
          .analytics-stat-grid { grid-template-columns: repeat(2, 1fr); }
          .analytics-grid-2    { grid-template-columns: 1fr; }
        }
        @media (max-width: 400px) { .analytics-stat-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  )
}
