'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useLocale } from '@/hooks/useLocale'
import { createClient } from '@/lib/supabase/client'
import NavBar from '@/components/layout/NavBar'
import { Trade } from '@/types'

const FREE_LIMIT = 20
const GREEN  = '#30d158'
const RED    = '#ff453a'
const ORANGE = '#ff9f0a'
const BLUE   = '#0a84ff'
const GRAY   = '#8e8e93'

function resultColor(r: string) {
  if (r === 'Тейк') return GREEN
  if (r === 'Стоп') return RED
  return GRAY
}

function gradeColor(g: string) {
  if (g === 'A') return GREEN
  if (g === 'B') return BLUE
  if (g === 'C') return ORANGE
  return RED
}

export default function TradesPage() {
  const { theme: c } = useTheme()
  const { t } = useLocale()
  const router = useRouter()
  const [trades, setTrades]             = useState<Trade[]>([])
  const [loading, setLoading]           = useState(true)
  const [filterResult, setFilterResult] = useState('')
  const [filterPair, setFilterPair]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')   // '' | 'planned' | 'closed'
  const [plan, setPlan]                 = useState<string>('free')
  const [totalCount, setTotalCount]     = useState(0)

  useEffect(() => { loadPlan() }, [])
  useEffect(() => { fetchTrades() }, [filterResult, filterPair, filterStatus])

  const loadPlan = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('users').select('plan').eq('id', user.id).single()
    setPlan(data?.plan ?? 'free')
    const { count } = await supabase.from('trades').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    setTotalCount(count ?? 0)
  }

  const fetchTrades = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterResult) params.set('result', filterResult)
    if (filterPair)   params.set('pair', filterPair)
    if (filterStatus) params.set('status', filterStatus)
    const res  = await fetch(`/api/trades?${params}`)
    const json = await res.json()
    if (json.success) setTrades(json.data)
    setLoading(false)
  }

  const deleteTrade = async (id: string) => {
    if (!confirm(t('settings_confirm'))) return
    await fetch(`/api/trades/${id}`, { method: 'DELETE' })
    fetchTrades()
    loadPlan()
  }

  const resultLabel = (r: string) => {
    if (r === 'Тейк') return t('result_take')
    if (r === 'Стоп') return t('result_stop')
    if (r === 'БУ')   return t('result_bu')
    return r
  }

  const isFree      = plan === 'free'
  const isAtLimit   = isFree && totalCount >= FREE_LIMIT
  const isNearLimit = isFree && totalCount >= FREE_LIMIT - 5 && totalCount < FREE_LIMIT

  const filterBtn = (active: boolean, color: string): React.CSSProperties => ({
    background: active ? color + '22' : 'transparent',
    color:      active ? color : c.text3,
    border:     `1px solid ${active ? color + '66' : c.border}`,
    borderRadius: 10, padding: '7px 14px',
    fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer',
    transition: 'all 0.15s',
  })

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
              background: isAtLimit ? ORANGE : GREEN,
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '10px 18px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >{isAtLimit ? 'Upgrade ⚡' : t('trades_add')}</button>
        </div>

        {/* Free limit banner — at limit */}
        {isAtLimit && (
          <div style={{
            background: `linear-gradient(135deg, ${ORANGE}18, ${RED}12)`,
            border: `1px solid ${ORANGE}44`, borderRadius: 14,
            padding: '14px 16px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: ORANGE, marginBottom: 4 }}>
              ⚠️ Ліміт Free плану вичерпано
            </div>
            <div style={{ fontSize: 13, color: c.text3, marginBottom: 10 }}>
              Ви використали {totalCount} з {FREE_LIMIT} безкоштовних угод.
            </div>
            <a href="/billing" style={{
              display: 'inline-block', background: ORANGE, color: '#fff',
              borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>Upgrade to Pro →</a>
          </div>
        )}

        {/* Free limit banner — near limit */}
        {isNearLimit && (
          <div style={{
            background: `${BLUE}12`, border: `1px solid ${BLUE}30`,
            borderRadius: 14, padding: '12px 16px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, color: c.text3 }}>
              <span style={{ color: BLUE, fontWeight: 600 }}>ℹ️ </span>
              Залишилось {FREE_LIMIT - totalCount} безкоштовних угод.{' '}
              <a href="/billing" style={{ color: BLUE, fontWeight: 600 }}>Upgrade to Pro →</a>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Фільтр по результату */}
          {[
            { val: '',     label: t('trades_all')  },
            { val: 'Тейк', label: t('trades_take') },
            { val: 'Стоп', label: t('trades_stop') },
            { val: 'БУ',   label: t('trades_bu')   },
          ].map(f => (
            <button key={f.val} onClick={() => setFilterResult(f.val)}
              style={filterBtn(filterResult === f.val, GREEN)}
            >{f.label}</button>
          ))}

          {/* Роздільник */}
          <div style={{ width: 1, height: 24, background: c.border, margin: '0 4px' }} />

          {/* Фільтр по статусу */}
          <button onClick={() => setFilterStatus('')}
            style={filterBtn(filterStatus === '', GRAY)}>
            Всі угоди
          </button>
          <button onClick={() => setFilterStatus('planned')}
            style={filterBtn(filterStatus === 'planned', ORANGE)}>
            🕐 Планові
          </button>
          <button onClick={() => setFilterStatus('closed')}
            style={filterBtn(filterStatus === 'closed', GREEN)}>
            ✅ Закриті
          </button>

          {/* Фільтр по парі */}
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
                      {[t('th_date'), t('th_pair'), t('th_setup'), 'Статус', t('th_rr'), t('th_direction'), t('th_result'), t('th_pnl'), 'P&L %', t('th_grade'), ''].map((h, i) => (
                        <th key={i} style={{ textAlign: 'left', padding: '10px 14px', color: c.text3, fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(trade => {
                      const isPlanned = (trade as any).status === 'planned'
                      return (
                        <tr key={trade.id}
                          style={{
                            borderBottom: `1px solid ${c.border}`,
                            background: isPlanned
                              ? `${ORANGE}08`
                              : trade.result === 'Тейк' ? `${GREEN}08`
                              : trade.result === 'Стоп' ? `${RED}08`
                              : 'transparent',
                            cursor: 'pointer',
                          }}
                          onClick={() => router.push(`/trades/${trade.id}`)}
                        >
                          <td style={{ padding: '11px 14px', color: c.text2 }}>{trade.date}</td>
                          <td style={{ padding: '11px 14px', fontWeight: 600, color: c.text }}>{trade.pair}</td>
                          <td style={{ padding: '11px 14px', color: c.text3, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trade.setup}</td>
                          {/* Бейдж статусу */}
                          <td style={{ padding: '11px 14px' }}>
                            {isPlanned
                              ? <span style={{ background: `${ORANGE}22`, color: ORANGE, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🕐 Планова</span>
                              : <span style={{ background: `${GREEN}22`, color: GREEN, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>✅ Закрита</span>
                            }
                          </td>
                          <td style={{ padding: '11px 14px', color: c.text }}>{trade.rr}</td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ background: (trade.direction === 'Long' ? GREEN : RED) + '22', color: trade.direction === 'Long' ? GREEN : RED, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{trade.direction}</span>
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            {isPlanned
                              ? <span style={{ color: c.text3, fontSize: 12 }}>—</span>
                              : <span style={{ background: resultColor(trade.result) + '22', color: resultColor(trade.result), padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{resultLabel(trade.result)}</span>
                            }
                          </td>
                          <td style={{ padding: '11px 14px', fontWeight: 600, color: isPlanned ? c.text3 : trade.profit_usd >= 0 ? GREEN : RED }}>
                            {isPlanned ? '—' : `${trade.profit_usd >= 0 ? '+' : ''}${trade.profit_usd}$`}
                          </td>
                          <td style={{ padding: '11px 14px', color: isPlanned ? c.text3 : trade.profit_pct >= 0 ? GREEN : RED }}>
                            {isPlanned ? '—' : `${trade.profit_pct >= 0 ? '+' : ''}${trade.profit_pct}%`}
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            {trade.self_grade && !isPlanned && (
                              <span style={{ background: gradeColor(trade.self_grade) + '22', color: gradeColor(trade.self_grade), padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{trade.self_grade}</span>
                            )}
                          </td>
                          <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                            <button onClick={() => deleteTrade(trade.id)} style={{ background: `${RED}18`, color: RED, border: `1px solid ${RED}44`, borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>{t('trades_delete')}</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="trades-mobile" style={{ display: 'none', padding: '8px' }}>
                {trades.map(trade => {
                  const isPlanned = (trade as any).status === 'planned'
                  return (
                    <div key={trade.id}
                      onClick={() => router.push(`/trades/${trade.id}`)}
                      style={{
                        background: c.surface2, borderRadius: 14,
                        padding: '14px 16px', marginBottom: 8,
                        border: `1px solid ${isPlanned ? ORANGE + '44' : c.border}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: c.text, fontSize: 15 }}>{trade.pair}</span>
                          <span style={{ background: (trade.direction === 'Long' ? GREEN : RED) + '22', color: trade.direction === 'Long' ? GREEN : RED, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{trade.direction}</span>
                          {isPlanned
                            ? <span style={{ background: `${ORANGE}22`, color: ORANGE, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>🕐 Планова</span>
                            : <span style={{ background: resultColor(trade.result) + '22', color: resultColor(trade.result), padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{resultLabel(trade.result)}</span>
                          }
                        </div>
                        <span style={{ fontWeight: 700, color: isPlanned ? c.text3 : trade.profit_usd >= 0 ? GREEN : RED, fontSize: 15 }}>
                          {isPlanned ? '—' : `${trade.profit_usd >= 0 ? '+' : ''}${trade.profit_usd}$`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 12, color: c.text3 }}>
                          {trade.date} · RR {trade.rr} · {trade.setup.split('+')[0].trim()}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {trade.self_grade && !isPlanned && (
                            <span style={{ background: gradeColor(trade.self_grade) + '22', color: gradeColor(trade.self_grade), padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{trade.self_grade}</span>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); deleteTrade(trade.id) }}
                            style={{ background: `${RED}18`, color: RED, border: 'none', borderRadius: 8, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
                          >✕</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
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
