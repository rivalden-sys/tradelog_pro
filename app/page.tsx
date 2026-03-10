'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
import { Header } from '@/components/layout/Header'
import { Trade } from '@/types'

const SETUPS = [
  'CHoCH + BOS + FVG',
  'Breaker/Mitigation + iFVG',
  'Order Block + FVG',
  'Liquidity Sweep + Reversal',
  'NWOG / NDOG',
  'Premium/Discount + POI',
]

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
  const router = useRouter()
  const [trades, setTrades]           = useState<Trade[]>([])
  const [loading, setLoading]         = useState(true)
  const [filterResult, setFilterResult] = useState('')
  const [filterPair, setFilterPair]   = useState('')

  useEffect(() => {
    fetchTrades()
  }, [filterResult, filterPair])

  const fetchTrades = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterResult) params.set('result', filterResult)
    if (filterPair)   params.set('pair', filterPair)

    const res = await fetch(`/api/trades?${params}`)
    const json = await res.json()
    if (json.success) setTrades(json.data)
    setLoading(false)
  }

  const deleteTrade = async (id: string) => {
    if (!confirm('Удалить сделку?')) return
    await fetch(`/api/trades/${id}`, { method: 'DELETE' })
    fetchTrades()
  }

  return (
    <div style={{ background: c.bg, minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: c.text, margin: 0 }}>Журнал сделок</h1>
          <button
            onClick={() => router.push('/trades/new')}
            style={{
              background: '#30d158', color: '#fff', border: 'none',
              borderRadius: 12, padding: '10px 20px', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}
          >+ Добавить сделку</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['', 'Тейк', 'Стоп', 'БУ'].map(f => (
            <button key={f} onClick={() => setFilterResult(f)} style={{
              background: filterResult === f ? c.text : 'transparent',
              color:      filterResult === f ? c.surface : c.text3,
              border:     `1px solid ${c.border}`, borderRadius: 10,
              padding:    '7px 14px', fontSize: 13, fontWeight: 500,
              cursor:     'pointer',
            }}>{f || 'Все'}</button>
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
            <option value="">Все пары</option>
            {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'POL/USDT'].map(p => (
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
            <div style={{ textAlign: 'center', padding: '48px', color: c.text3 }}>Загрузка...</div>
          ) : trades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', color: c.text3 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: c.text2 }}>Сделок пока нет</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Добавьте первую сделку</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                    {['Дата', 'Пара', 'Сетап', 'RR', 'Направление', 'Результат', 'P&L $', 'P&L %', 'Оценка', 'Действия'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '10px 14px',
                        color: c.text3, fontWeight: 500, whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.map(t => (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: `1px solid ${c.border}`,
                        background: t.result === 'Тейк' ? '#30d15808' : t.result === 'Стоп' ? '#ff453a08' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => router.push(`/trades/${t.id}`)}
                    >
                      <td style={{ padding: '11px 14px', color: c.text2 }}>{t.date}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: c.text }}>{t.pair}</td>
                      <td style={{ padding: '11px 14px', color: c.text3, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.setup}</td>
                      <td style={{ padding: '11px 14px', color: c.text }}>{t.rr}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          background: (t.direction === 'Long' ? '#30d158' : '#ff453a') + '22',
                          color: t.direction === 'Long' ? '#30d158' : '#ff453a',
                          padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        }}>{t.direction}</span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          background: resultColor(t.result) + '22',
                          color: resultColor(t.result),
                          padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        }}>{t.result}</span>
                      </td>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: t.profit_usd >= 0 ? '#30d158' : '#ff453a' }}>
                        {t.profit_usd >= 0 ? '+' : ''}{t.profit_usd}$
                      </td>
                      <td style={{ padding: '11px 14px', color: t.profit_pct >= 0 ? '#30d158' : '#ff453a' }}>
                        {t.profit_pct >= 0 ? '+' : ''}{t.profit_pct}%
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        {t.self_grade && (
                          <span style={{
                            background: gradeColor(t.self_grade) + '22',
                            color: gradeColor(t.self_grade),
                            padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          }}>{t.self_grade}</span>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => deleteTrade(t.id)}
                          style={{
                            background: '#ff453a18', color: '#ff453a',
                            border: '1px solid #ff453a44', borderRadius: 8,
                            padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                          }}
                        >Удалить</button>
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