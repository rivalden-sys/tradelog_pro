'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useLocale } from '@/hooks/useLocale'
import NavBar from '@/components/layout/NavBar'
import { Trade } from '@/types'

function resultColor(r: string) {
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

  useEffect(() => { fetchTrades() }, [filterResult, filterPair])

  const fetchTrades = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterResult) params.set('result', filterResult)
    if (filterPair)   params.set('pair', filterPair)
    const res  = await fetch(`/api/trades?${params}`)
    const json = await res.json()
    if (json.success) setTrades(json.data)
    setLoading(false)
  }

  const deleteTrade = async (id: string) => {
    if (!confirm(t('settings_confirm'))) return
    await fetch(`/api/trades/${id}`, { method: 'DELETE' })
    fetchTrades()
  }

  // Result display label — always show translated value
  const resultLabel = (r: string) => {
    if (r === 'Тейк') return t('result_take')
    if (r === 'Стоп') return t('result_stop')
    if (r === 'БУ')   return t('result_bu')
    return r
  }

  return (
    <div style={{ background: c.bg, minHeight: '100vh' }}>
      <NavBar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: c.text, margin: 0 }}>{t('trades_title')}</h1>
          <button
            onClick={() => router.push('/trades/new')}
            style={{
              background: '#30d158', color: '#fff', border: 'none',
              borderRadius: 12, padding: '10px 20px', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}
          >{t('trades_add')}</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { val: '',      label: t('trades_all')  },
            { val: 'Тейк',  label: t('trades_take') },
            { val: 'Стоп',  label: t('trades_stop') },
            { val: 'БУ',    label: t('trades_bu')   },
          ].map(f => (
            <button key={f.val} onClick={() => setFilterResult(f.val)} style={{
              background: filterResult === f.val ? c.text : 'transparent',
              color:      filterResult === f.val ? c.surface : c.text3,
              border:     `1px solid ${c.border}`, borderRadius: 10,
              padding:    '7px 14px', fontSize: 13, fontWeight: 500,
              cursor:     'pointer',
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
            <div style={{ textAlign: 'center', padding: '64px', color: c.text3 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: c.text2 }}>{t('trades_empty')}</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>{t('trades_empty_sub')}</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                    {[
                      t('th_date'), t('th_pair'), t('th_setup'), t('th_rr'),
                      t('th_direction'), t('th_result'), t('th_pnl'), 'P&L %',
                      t('th_grade'), '',
                    ].map((h, i) => (
                      <th key={i} style={{
                        textAlign: 'left', padding: '10px 14px',
                        color: c.text3, fontWeight: 500, whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.map(trade => (
                    <tr
                      key={trade.id}
                      style={{
                        borderBottom: `1px solid ${c.border}`,
                        background: trade.result === 'Тейк' ? '#30d15808' : trade.result === 'Стоп' ? '#ff453a08' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => router.push(`/trades/${trade.id}`)}
                    >
                      <td style={{ padding: '11px 14px', color: c.text2 }}>{trade.date}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: c.text }}>{trade.pair}</td>
                      <td style={{
                        padding: '11px 14px', color: c.text3,
                        maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{trade.setup}</td>
                      <td style={{ padding: '11px 14px', color: c.text }}>{trade.rr}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          background: (trade.direction === 'Long' ? '#30d158' : '#ff453a') + '22',
                          color: trade.direction === 'Long' ? '#30d158' : '#ff453a',
                          padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        }}>{trade.direction}</span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          background: resultColor(trade.result) + '22',
                          color: resultColor(trade.result),
                          padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        }}>{resultLabel(trade.result)}</span>
                      </td>
                      <td style={{
                        padding: '11px 14px', fontWeight: 600,
                        color: trade.profit_usd >= 0 ? '#30d158' : '#ff453a',
                      }}>
                        {trade.profit_usd >= 0 ? '+' : ''}{trade.profit_usd}$
                      </td>
                      <td style={{
                        padding: '11px 14px',
                        color: trade.profit_pct >= 0 ? '#30d158' : '#ff453a',
                      }}>
                        {trade.profit_pct >= 0 ? '+' : ''}{trade.profit_pct}%
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        {trade.self_grade && (
                          <span style={{
                            background: gradeColor(trade.self_grade) + '22',
                            color: gradeColor(trade.self_grade),
                            padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          }}>{trade.self_grade}</span>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => deleteTrade(trade.id)}
                          style={{
                            background: '#ff453a18', color: '#ff453a',
                            border: '1px solid #ff453a44', borderRadius: 8,
                            padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                          }}
                        >{t('trades_delete')}</button>
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
