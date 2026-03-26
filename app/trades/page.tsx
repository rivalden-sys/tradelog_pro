'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/hooks/useLocale'
import { createClient } from '@/lib/supabase/client'
import NavBar from '@/components/layout/NavBar'
import { Trade } from '@/types'

const FONT   = "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', sans-serif"

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

const FREE_LIMIT = 20

// Dark mode colors
const GREEN  = '#30d158'
const RED    = '#ff453a'
const ORANGE = '#ff9f0a'
const BLUE   = '#0a84ff'
const GRAY   = '#8e8e93'

// Light mode — приглушені відтінки
const GREEN_L_TEXT = '#1a7a2e'
const GREEN_L_BG   = '#e8f5ec'
const RED_L_TEXT   = '#b91c1c'
const RED_L_BG     = '#fde8e8'
const ORANGE_L_TEXT = '#92400e'
const ORANGE_L_BG   = '#fef3c7'
const BLUE_L_TEXT  = '#1e40af'
const BLUE_L_BG    = '#e8f0fe'
const GRAY_L_TEXT  = '#4b5563'
const GRAY_L_BG    = '#f3f4f6'

export default function TradesPage() {
  const dark   = useDark()
  const { t }  = useLocale()
  const router = useRouter()

  const textColor   = dark ? '#f5f5f7' : '#1c1c1e'
  const subColor    = dark ? 'rgba(255,255,255,0.35)' : '#6e6e73'
  const borderColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.8)'

  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

  const [trades,       setTrades]       = useState<Trade[]>([])
  const [loading,      setLoading]      = useState(true)
  const [filterResult, setFilterResult] = useState('')
  const [filterPair,   setFilterPair]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [plan,         setPlan]         = useState<string>('free')
  const [totalCount,   setTotalCount]   = useState(0)
  const [pairs,        setPairs]        = useState<string[]>([])

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
    const { data: pairsData } = await supabase.from('trades').select('pair').eq('user_id', user.id)
    if (pairsData) setPairs([...new Set(pairsData.map(t => t.pair))])
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
    fetchTrades(); loadPlan()
  }

  const resultLabel = (r: string) => {
    if (r === 'Тейк') return t('result_take')
    if (r === 'Стоп') return t('result_stop')
    if (r === 'БУ')   return t('result_bu')
    return r
  }

  // Бейдж з урахуванням dark/light
  const badge = (label: string, type: 'green' | 'red' | 'orange' | 'blue' | 'gray'): React.CSSProperties => {
    const map = {
      green:  { color: dark ? GREEN  : GREEN_L_TEXT,  bg: dark ? GREEN  + '22' : GREEN_L_BG  },
      red:    { color: dark ? RED    : RED_L_TEXT,    bg: dark ? RED    + '18' : RED_L_BG    },
      orange: { color: dark ? ORANGE : ORANGE_L_TEXT, bg: dark ? ORANGE + '22' : ORANGE_L_BG },
      blue:   { color: dark ? BLUE   : BLUE_L_TEXT,   bg: dark ? BLUE   + '18' : BLUE_L_BG   },
      gray:   { color: dark ? GRAY   : GRAY_L_TEXT,   bg: dark ? GRAY   + '18' : GRAY_L_BG   },
    }
    return {
      background: map[type].bg,
      color: map[type].color,
      padding: '2px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      display: 'inline-block',
    }
  }

  const filterBtn = (active: boolean, type: 'green' | 'orange' | 'gray'): React.CSSProperties => {
    const colorMap = {
      green:  { d: GREEN,  l: GREEN_L_TEXT,  bg: GREEN_L_BG  },
      orange: { d: ORANGE, l: ORANGE_L_TEXT, bg: ORANGE_L_BG },
      gray:   { d: GRAY,   l: GRAY_L_TEXT,   bg: GRAY_L_BG   },
    }
    const c = colorMap[type]
    return {
      background: active
        ? dark ? c.d + '22' : c.bg
        : dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
      color: active
        ? dark ? c.d : c.l
        : subColor,
      border: `1px solid ${active
        ? dark ? c.d + '55' : c.l + '44'
        : dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
      borderRadius: 10, padding: '7px 14px',
      fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
      transition: 'all 0.15s',
    }
  }

  const isFree      = plan === 'free'
  const isAtLimit   = isFree && totalCount >= FREE_LIMIT
  const isNearLimit = isFree && totalCount >= FREE_LIMIT - 5 && totalCount < FREE_LIMIT

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: dark ? '#0a0a0b' : 'linear-gradient(135deg, #e8edf5 0%, #f0f2f7 50%, #e8f0ed 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: noiseSvg, opacity: dark ? 0.35 : 0.15 }} />
      {dark ? (
        <>
          <div style={{ position: 'fixed', top: -200, left: '30%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(48,209,88,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'fixed', bottom: -200, right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(10,132,255,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        </>
      ) : (
        <>
          <div style={{ position: 'fixed', top: -150, left: '20%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(10,132,255,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'fixed', bottom: -150, right: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(48,209,88,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        </>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: textColor, margin: 0, letterSpacing: '-0.04em' }}>{t('trades_title')}</h1>
            <button
              onClick={() => isAtLimit ? router.push('/billing') : router.push('/trades/new')}
              style={{
                background: isAtLimit
                  ? dark ? ORANGE : 'linear-gradient(180deg, #e08b00 0%, #b36d00 100%)'
                  : dark ? GREEN  : 'linear-gradient(180deg, #1f9e3f 0%, #166b2b 100%)',
                color: isAtLimit ? '#000' : '#fff',
                border: 'none', borderRadius: 12,
                padding: '10px 20px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: dark
                  ? `0 0 20px ${isAtLimit ? ORANGE : GREEN}44`
                  : '0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
                transition: 'all 0.2s',
              }}
            >{isAtLimit ? 'Upgrade ⚡' : t('trades_add')}</button>
          </div>

          {/* Banners */}
          {isAtLimit && (
            <div style={{
              background: dark ? `linear-gradient(135deg, ${ORANGE}15, ${RED}10)` : '#fef3c7',
              border: `1px solid ${dark ? ORANGE + '44' : '#f59e0b44'}`,
              borderRadius: 16, padding: '16px 20px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: dark ? ORANGE : ORANGE_L_TEXT, marginBottom: 4 }}>⚠️ Ліміт Free плану вичерпано</div>
              <div style={{ fontSize: 13, color: subColor, marginBottom: 10 }}>Ви використали {totalCount} з {FREE_LIMIT} безкоштовних угод.</div>
              <a href="/billing" style={{ display: 'inline-block', background: dark ? ORANGE : 'linear-gradient(180deg, #e08b00 0%, #b36d00 100%)', color: dark ? '#000' : '#fff', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Upgrade to Pro →</a>
            </div>
          )}
          {isNearLimit && (
            <div style={{
              background: dark ? `${BLUE}12` : BLUE_L_BG,
              border: `1px solid ${dark ? BLUE + '30' : BLUE_L_TEXT + '33'}`,
              borderRadius: 16, padding: '12px 16px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, color: subColor }}>
                <span style={{ color: dark ? BLUE : BLUE_L_TEXT, fontWeight: 600 }}>ℹ️ </span>
                Залишилось {FREE_LIMIT - totalCount} безкоштовних угод.{' '}
                <a href="/billing" style={{ color: dark ? BLUE : BLUE_L_TEXT, fontWeight: 600 }}>Upgrade to Pro →</a>
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { val: '',     label: t('trades_all')  },
              { val: 'Тейк', label: t('trades_take') },
              { val: 'Стоп', label: t('trades_stop') },
              { val: 'БУ',   label: t('trades_bu')   },
            ].map(f => (
              <button key={f.val} onClick={() => setFilterResult(f.val)}
                style={filterBtn(filterResult === f.val, f.val === 'Тейк' ? 'green' : f.val === 'Стоп' ? 'gray' : 'gray')}>
                {f.label}
              </button>
            ))}

            <div style={{ width: 1, height: 24, background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

            <button onClick={() => setFilterStatus('')}        style={filterBtn(filterStatus === '',        'gray')}>Всі угоди</button>
            <button onClick={() => setFilterStatus('planned')} style={filterBtn(filterStatus === 'planned', 'orange')}>🕐 Планові</button>
            <button onClick={() => setFilterStatus('closed')}  style={filterBtn(filterStatus === 'closed',  'green')}>✅ Закриті</button>

            {pairs.length > 0 && (
              <select value={filterPair} onChange={e => setFilterPair(e.target.value)} style={{
                background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
                color: textColor, borderRadius: 10, padding: '7px 14px', fontSize: 13,
                marginLeft: 'auto', outline: 'none',
              }}>
                <option value="">Всі пари</option>
                {pairs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
          </div>

          {/* Table card */}
          <div style={{
            background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 20,
            border: `1px solid ${borderColor}`,
            boxShadow: dark
              ? 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.02)'
              : 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.02)',
            overflow: 'hidden', position: 'relative',
          }}>

            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20%', background: dark ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />

            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px', color: subColor }}>{t('trades_loading')}</div>
            ) : trades.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: subColor }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: textColor }}>{t('trades_empty')}</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>{t('trades_empty_sub')}</div>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="trades-desktop" style={{ overflowX: 'auto', position: 'relative', zIndex: 2 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}` }}>
                        {[t('th_date'), t('th_pair'), t('th_setup'), 'Статус', t('th_rr'), t('th_direction'), t('th_result'), t('th_pnl'), 'P&L %', t('th_grade'), ''].map((h, i) => (
                          <th key={i} style={{ textAlign: 'left', padding: '12px 14px', color: subColor, fontWeight: 600, whiteSpace: 'nowrap', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade) => {
                        const isPlanned = (trade as any).status === 'planned'
                        const rowBg = isPlanned
                          ? dark ? `${ORANGE}08` : `${ORANGE_L_BG}88`
                          : trade.result === 'Тейк' ? dark ? `${GREEN}06` : `${GREEN_L_BG}66`
                          : trade.result === 'Стоп' ? dark ? `${RED}06`   : `${RED_L_BG}66`
                          : 'transparent'
                        return (
                          <tr key={trade.id}
                            style={{ borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, background: rowBg, cursor: 'pointer', transition: 'background 0.15s' }}
                            onClick={() => router.push(`/trades/${trade.id}`)}
                          >
                            <td style={{ padding: '11px 14px', color: subColor }}>{trade.date}</td>
                            <td style={{ padding: '11px 14px', fontWeight: 700, color: textColor }}>{trade.pair}</td>
                            <td style={{ padding: '11px 14px', color: subColor, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trade.setup}</td>
                            <td style={{ padding: '11px 14px' }}>
                              {isPlanned
                                ? <span style={badge('🕐 Планова', 'orange')}>🕐 Планова</span>
                                : <span style={badge('✅ Закрита', 'green')}>✅ Закрита</span>
                              }
                            </td>
                            <td style={{ padding: '11px 14px', color: textColor }}>{trade.rr}</td>
                            <td style={{ padding: '11px 14px' }}>
                              <span style={badge(trade.direction, trade.direction === 'Long' ? 'green' : 'red')}>{trade.direction}</span>
                            </td>
                            <td style={{ padding: '11px 14px' }}>
                              {isPlanned
                                ? <span style={{ color: subColor, fontSize: 12 }}>—</span>
                                : <span style={badge(resultLabel(trade.result), trade.result === 'Тейк' ? 'green' : trade.result === 'Стоп' ? 'red' : 'gray')}>{resultLabel(trade.result)}</span>
                              }
                            </td>
                            <td style={{ padding: '11px 14px', fontWeight: 700, color: isPlanned ? subColor : dark ? (trade.profit_usd >= 0 ? GREEN : RED) : (trade.profit_usd >= 0 ? GREEN_L_TEXT : RED_L_TEXT) }}>
                              {isPlanned ? '—' : `${trade.profit_usd >= 0 ? '+' : ''}${trade.profit_usd}$`}
                            </td>
                            <td style={{ padding: '11px 14px', color: isPlanned ? subColor : dark ? (trade.profit_pct >= 0 ? GREEN : RED) : (trade.profit_pct >= 0 ? GREEN_L_TEXT : RED_L_TEXT) }}>
                              {isPlanned ? '—' : `${trade.profit_pct >= 0 ? '+' : ''}${trade.profit_pct}%`}
                            </td>
                            <td style={{ padding: '11px 14px' }}>
                              {trade.self_grade && !isPlanned && (
                                <span style={badge(trade.self_grade,
                                  trade.self_grade === 'A' ? 'green' :
                                  trade.self_grade === 'B' ? 'blue'  :
                                  trade.self_grade === 'C' ? 'orange': 'red'
                                )}>{trade.self_grade}</span>
                              )}
                            </td>
                            <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                              <button onClick={() => deleteTrade(trade.id)} style={{
                                background: dark ? `${RED}12` : RED_L_BG,
                                color: dark ? RED : RED_L_TEXT,
                                border: `1px solid ${dark ? RED + '33' : RED_L_TEXT + '33'}`,
                                borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                              }}>{t('trades_delete')}</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="trades-mobile" style={{ display: 'none', padding: '8px', position: 'relative', zIndex: 2 }}>
                  {trades.map(trade => {
                    const isPlanned = (trade as any).status === 'planned'
                    return (
                      <div key={trade.id}
                        onClick={() => router.push(`/trades/${trade.id}`)}
                        style={{
                          background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
                          borderRadius: 14, padding: '14px 16px', marginBottom: 8,
                          border: `1px solid ${isPlanned ? dark ? ORANGE + '44' : ORANGE_L_TEXT + '33' : borderColor}`,
                          cursor: 'pointer',
                          boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: textColor, fontSize: 15 }}>{trade.pair}</span>
                            <span style={badge(trade.direction, trade.direction === 'Long' ? 'green' : 'red')}>{trade.direction}</span>
                            {isPlanned
                              ? <span style={badge('🕐 Планова', 'orange')}>🕐 Планова</span>
                              : <span style={badge(resultLabel(trade.result), trade.result === 'Тейк' ? 'green' : trade.result === 'Стоп' ? 'red' : 'gray')}>{resultLabel(trade.result)}</span>
                            }
                          </div>
                          <span style={{ fontWeight: 700, color: isPlanned ? subColor : dark ? (trade.profit_usd >= 0 ? GREEN : RED) : (trade.profit_usd >= 0 ? GREEN_L_TEXT : RED_L_TEXT), fontSize: 15 }}>
                            {isPlanned ? '—' : `${trade.profit_usd >= 0 ? '+' : ''}${trade.profit_usd}$`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 12, color: subColor }}>{trade.date} · RR {trade.rr} · {trade.setup.split('+')[0].trim()}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {trade.self_grade && !isPlanned && (
                              <span style={badge(trade.self_grade, trade.self_grade === 'A' ? 'green' : trade.self_grade === 'B' ? 'blue' : trade.self_grade === 'C' ? 'orange' : 'red')}>{trade.self_grade}</span>
                            )}
                            <button
                              onClick={e => { e.stopPropagation(); deleteTrade(trade.id) }}
                              style={{ background: dark ? `${RED}12` : RED_L_BG, color: dark ? RED : RED_L_TEXT, border: 'none', borderRadius: 8, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
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
      </div>

      <style>{`
        @media (max-width: 768px) {
          .trades-desktop { display: none !important; }
          .trades-mobile  { display: block !important; }
        }
      `}</style>
    </div>
  )
}
