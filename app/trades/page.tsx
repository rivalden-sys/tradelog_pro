'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useLocale } from '@/hooks/useLocale'
import { createClient } from '@/lib/supabase/client'
import NavBar from '@/components/layout/NavBar'
import { Trade } from '@/types'

const FREE_LIMIT = 20

function resultColor(r?: string | null) {
  if (!r) return '#8e8e93'
  if (r === 'Тейк') return '#30d158'
  if (r === 'Стоп') return '#ff453a'
  return '#8e8e93'
}

function gradeColor(g: string) {
  if (g === 'A') return '#30d158'
  if (g === 'B') return '#0a84ff'
  if (g === 'C') return '#ff9f0a'
  return '#ff453a'
}

export default function TradesPage() {
  const { theme: c } = useTheme()
  const { t } = useLocale()
  const router = useRouter()
  const [trades, setTrades]             = useState<Trade[]>([])
  const [loading, setLoading]           = useState(true)
  const [filterResult, setFilterResult] = useState('')
  const [filterPair, setFilterPair]     = useState('')
  const [plan, setPlan]                 = useState<string>('free')
  const [totalCount, setTotalCount]     = useState(0)

  async function loadPlan() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('users').select('plan').eq('id', user.id).single()
    setPlan(data?.plan ?? 'free')
    const { count } = await supabase.from('trades').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    setTotalCount(count ?? 0)
  }

  async function fetchTrades() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterResult) params.set('result', filterResult)
    if (filterPair)   params.set('pair', filterPair)
    const res  = await fetch(`/api/trades?${params}`)
    const json = await res.json()
    if (json.success) setTrades(json.data)
    setLoading(false)
  }

  useEffect(() => { loadPlan() }, [])
  useEffect(() => { fetchTrades() }, [filterResult, filterPair])

  const deleteTrade = async (id: string) => {
    if (!confirm(t('settings_confirm'))) return
    await fetch(`/api/trades/${id}`, { method: 'DELETE' })
    fetchTrades()
    loadPlan()
  }

  const resultLabel = (r?: string | null) => {
    if (!r) return 'План'
    if (r === 'Тейк') return t('result_take')
    if (r === 'Стоп') return t('result_stop')
    if (r === 'БУ')   return t('result_bu')
    return r
  }

  const isFree      = plan === 'free'
  const isAtLimit   = isFree && totalCount >= FREE_LIMIT
  const isNearLimit = isFree && totalCount >= FREE_LIMIT - 5 && totalCount < FREE_LIMIT

  return (
    <div style={{ background: c.bg, minHeight: '100vh' }}>
      <NavBar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c.text, margin: 0 }}>{t('trades_title')}</h1>
          <button
            onClick={() => isAtLimit ? router.push('/billing') : router.push('/trades/new')}
            style={{
              background: isAtLimit ? '#ff9f0a' : '#30d158',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '10px 18px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >{isAtLimit ? 'Upgrade ⚡' : t('trades_add')}</button>
        </div>

        {/* Free limit banner — at limit */}
        {isAtLimit && (
          <div style={{
            background: 'linear-gradient(135deg, #ff9f0a18, #ff453a12)',
            border: '1px solid #ff9f0a44', borderRadius: 14,
            padding: '14px 16px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ff9f0a', marginBottom: 4 }}>
              ⚠️ Ліміт Free плану вичерпано
            </div>
            <div style={{ fontSize: 13, color: c.text3, marginBottom: 10 }}>
              Ви використали {totalCount} з {FREE_LIMIT} безкоштовних угод.
            </div>
            <a href="/billing" style={{
              display: 'inline-block', background: '#ff9f0a', color: '#fff',
              borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>Upgrade to Pro →</a>
          </div>
        )}

        {/* Free limit banner — near limit */}
        {isNearLimit && (
          <div style={{
            background: '#0a84ff12', border: '1px solid #0a84ff30',
            borderRadius: 14, padding: '12px 16px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, color: c.text3 }}>
              <span style={{ color: '#0a84ff', fontWeight: 600 }}>ℹ️ </span>
              Залишилось {FREE_LIMIT - totalCount} безкоштовних угод.{' '}
              <a href="/billing" style={{ color: '#0a84ff', fontWeight: 600 }}>Upgrade to Pro →</a>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { val: '',     label: t('trades_all')  },
            { val: 'Тейк', label: t('trades_take') },
            { val: 'Стоп', label: t('trades_stop') },
            { val: 'БУ',   label: t('trades_bu')   },
          ].map(f => (
            <button key={f.val} onClick={() => setFilterResult(f.val)} style={{
              background: filterResult === f.val ? c.text : 'transparent',
              color:      filterResult === f.val ? c.surface : c.text3,
              border: `1px solid ${c.border}`, borderRadius: 10,
              padding: '7px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>{f.label}</button>
          ))}
          <select
            value={filterPair}
            onChange={e => setFilterPair(e.target.value)}
            style={{
              background: c.surface2, border: `1px solid ${c.border}`,
              color: c.text, borderRadius: 10, padding: '7px 14px', fontSize: 13,
              marginLeft: 'auto',
            }}
          >
            <option value="">{t('trades_all')}</option>
            {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'POL/USDT', 'BNB/USDT', 'XRP/USDT'].map(p => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div style={{
          background: c.surface, borderRadius: 18, border: `1px solid ${c.border}`,
          boxShadow: c.shadow, overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: c.text3 }}>{t('trades_loading')}</div>
          ) : trades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: c.text3 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: c.text }}>{t('trades_empty')}</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>{t('trades_empty_sub')}</div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="trades-desktop" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                      {[t('th_date'), t('th_pair'), t('th_setup'), t('th_rr'), t('th_direction'), t('th_result'), t('th_pnl'), 'P&L %', t('th_grade'), ''].map((h, i) => (
                        <th key={i} style={{ textAlign: 'left', padding: '10px 14px', color: c.text3, fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(trade => (
                      <tr key={trade.id}
                        style={{
                          borderBottom: `1px solid ${c.border}`,
                          background: trade.actual_result === 'Тейк' ? '#30d15808' : trade.actual_result === 'Стоп' ? '#ff453a08' : 'transparent',
                          cursor: 'pointer',
                        }}
                        onClick={() => router.push(`/trades/${trade.id}`)}
                      >
                        <td style={{ padding: '11px 14px', color: c.text2 }}>{trade.date}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 600, color: c.text }}>{trade.pair}</td>
                        <td style={{ padding: '11px 14px', color: c.text3, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trade.setup}</td>
                        <td style={{ padding: '11px 14px', color: c.text }}>{trade.planned_rr ?? trade.rr ?? '-'}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ background: (trade.direction === 'Long' ? '#30d158' : '#ff453a') + '22', color: trade.direction === 'Long' ? '#30d158' : '#ff453a', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{trade.direction}</span>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ background: resultColor(trade.actual_result || trade.result) + '22', color: resultColor(trade.actual_result || trade.result), padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{resultLabel(trade.actual_result || trade.result)}</span>
                        </td>
                        <td style={{ padding: '11px 14px', fontWeight: 600, color: (trade.actual_profit_usd ?? trade.profit_usd ?? 0) >= 0 ? '#30d158' : '#ff453a' }}>
                          {trade.actual_profit_usd == null && trade.profit_usd == null ? '—' : `${(trade.actual_profit_usd ?? trade.profit_usd ?? 0) >= 0 ? '+' : ''}${trade.actual_profit_usd ?? trade.profit_usd}$`}
                        </td>
                        <td style={{ padding: '11px 14px', color: (trade.actual_profit_pct ?? trade.profit_pct ?? 0) >= 0 ? '#30d158' : '#ff453a' }}>
                          {trade.actual_profit_pct == null && trade.profit_pct == null ? '—' : `${(trade.actual_profit_pct ?? trade.profit_pct ?? 0) >= 0 ? '+' : ''}${trade.actual_profit_pct ?? trade.profit_pct}%`}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          {trade.self_grade && (
                            <span style={{ background: gradeColor(trade.self_grade) + '22', color: gradeColor(trade.self_grade), padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{trade.self_grade}</span>
                          )}
                        </td>
                        <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => deleteTrade(trade.id)} style={{ background: '#ff453a18', color: '#ff453a', border: '1px solid #ff453a44', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>{t('trades_delete')}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="trades-mobile" style={{ display: 'none', padding: '8px' }}>
                {trades.map(trade => (
                  <div key={trade.id}
                    onClick={() => router.push(`/trades/${trade.id}`)}
                    style={{
                      background: c.surface2, borderRadius: 14,
                      padding: '14px 16px', marginBottom: 8,
                      border: `1px solid ${c.border}`, cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: c.text, fontSize: 15 }}>{trade.pair}</span>
                        <span style={{ background: (trade.direction === 'Long' ? '#30d158' : '#ff453a') + '22', color: trade.direction === 'Long' ? '#30d158' : '#ff453a', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{trade.direction}</span>
                        <span style={{ background: resultColor(trade.actual_result || trade.result) + '22', color: resultColor(trade.actual_result || trade.result), padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{resultLabel(trade.actual_result || trade.result)}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: (trade.actual_profit_usd ?? trade.profit_usd ?? 0) >= 0 ? '#30d158' : '#ff453a', fontSize: 15 }}>
                        {trade.actual_profit_usd == null && trade.profit_usd == null ? '—' : `${(trade.actual_profit_usd ?? trade.profit_usd ?? 0) >= 0 ? '+' : ''}${trade.actual_profit_usd ?? trade.profit_usd}$`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, color: c.text3 }}>
                        {trade.date} · RR {trade.planned_rr ?? trade.rr ?? '-'} · {trade.setup.split('+')[0].trim()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {trade.self_grade && (
                          <span style={{ background: gradeColor(trade.self_grade) + '22', color: gradeColor(trade.self_grade), padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{trade.self_grade}</span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); deleteTrade(trade.id) }}
                          style={{ background: '#ff453a18', color: '#ff453a', border: 'none', borderRadius: 8, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
                        >✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .trades-desktop { display: none !important; }
          .trades-mobile { display: block !important; }
        }
      `}</style>
    </div>
  )
}
