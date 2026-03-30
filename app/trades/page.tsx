'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/hooks/useLocale'
import { createClient } from '@/lib/supabase/client'
import NavBar from '@/components/layout/NavBar'
import { Trade } from '@/types'
import { DARK, LIGHT } from '@/lib/colors'
import { SUPPORTED_EXCHANGES, FORMAT_LABELS, type DetectedFormat, type ColumnMapping } from '@/lib/importParsers'

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

const FREE_LIMIT = 20

export default function TradesPage() {
  const dark       = useDark()
  const { t }      = useLocale()
  const router     = useRouter()

  const GREEN  = dark ? DARK.green  : LIGHT.green
  const RED    = dark ? DARK.red    : LIGHT.red
  const ORANGE = dark ? DARK.orange : LIGHT.orange
  const BLUE   = dark ? DARK.blue   : LIGHT.blue
  const GRAY   = dark ? DARK.gray   : LIGHT.gray

  const textColor   = dark ? DARK.text   : LIGHT.text
  const subColor    = dark ? DARK.sub    : LIGHT.sub
  const borderColor = dark ? DARK.border : LIGHT.border

  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

  const [trades,       setTrades]       = useState<Trade[]>([])
  const [loading,      setLoading]      = useState(true)
  const [filterResult, setFilterResult] = useState('')
  const [filterPair,   setFilterPair]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [plan,         setPlan]         = useState<string>('free')
  const [totalCount,   setTotalCount]   = useState(0)
  const [pairs,        setPairs]        = useState<string[]>([])

  const [showImport,    setShowImport]    = useState(false)
  const [importFile,    setImportFile]    = useState<File | null>(null)
  const [importText,    setImportText]    = useState('')
  const [importFormat,  setImportFormat]  = useState<DetectedFormat>('unknown')
  const [importHeaders, setImportHeaders] = useState<string[]>([])
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [importTotal,   setImportTotal]   = useState(0)
  const [importStep,    setImportStep]    = useState<'upload' | 'mapping' | 'preview' | 'done'>('upload')
  const [importLoading, setImportLoading] = useState(false)
  const [importError,   setImportError]   = useState('')
  const [importResult,  setImportResult]  = useState<{ imported: number; skipped: number } | null>(null)
  const [mapping,       setMapping]       = useState<ColumnMapping>({
    pair: '', side: '', pnl: '', date: '', entry_price: '', exit_price: '', trade_type: 'futures'
  })

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
    if (pairsData) setPairs([...new Set(pairsData.map((tr: any) => tr.pair))])
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

  const resetImport = () => {
    setShowImport(false)
    setImportStep('upload')
    setImportFile(null)
    setImportText('')
    setImportFormat('unknown')
    setImportHeaders([])
    setImportPreview([])
    setImportTotal(0)
    setImportError('')
    setImportResult(null)
    setMapping({ pair: '', side: '', pnl: '', date: '', entry_price: '', exit_price: '', trade_type: 'futures' })
  }

  const analyzeFile = async (useMapping = false) => {
    if (!importText) return
    setImportLoading(true); setImportError('')
    try {
      const body = useMapping ? { csvText: importText, mapping } : { csvText: importText }
      const res  = await fetch('/api/import', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!json.success) { setImportError(json.error || 'Parse error'); return }
      setImportFormat(json.format)
      setImportHeaders(json.headers)
      setImportPreview(json.preview)
      setImportTotal(json.total)
      if (json.format === 'unknown' && !useMapping) {
        setImportStep('mapping')
      } else {
        setImportStep('preview')
      }
    } catch (err: any) { setImportError(err.message) }
    finally { setImportLoading(false) }
  }

  const doImport = async () => {
    setImportLoading(true); setImportError('')
    try {
      const body = importFormat === 'unknown'
        ? { csvText: importText, mapping }
        : { csvText: importText }
      const res  = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!json.success) {
        setImportError(json.code === 'FREE_LIMIT_REACHED' ? t('trades_import_free_limit') : json.error || 'Import error')
        return
      }
      setImportResult({ imported: json.imported, skipped: json.skipped ?? 0 })
      setImportStep('done')
      fetchTrades(); loadPlan()
    } catch (err: any) { setImportError(err.message) }
    finally { setImportLoading(false) }
  }

  const resultLabel = (r: string) => {
    if (r === 'Тейк') return t('result_take')
    if (r === 'Стоп') return t('result_stop')
    if (r === 'БУ')   return t('result_bu')
    return r
  }

  const badge = (label: string, type: 'green' | 'red' | 'orange' | 'blue' | 'gray'): React.CSSProperties => {
    const map = {
      green:  { color: GREEN,  bg: dark ? DARK.green  + '22' : LIGHT.greenBg  },
      red:    { color: RED,    bg: dark ? DARK.red    + '18' : LIGHT.redBg    },
      orange: { color: ORANGE, bg: dark ? DARK.orange + '22' : LIGHT.orangeBg },
      blue:   { color: BLUE,   bg: dark ? DARK.blue   + '18' : LIGHT.blueBg   },
      gray:   { color: GRAY,   bg: dark ? DARK.gray   + '18' : LIGHT.grayBg   },
    }
    return {
      background: map[type].bg, color: map[type].color,
      padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'inline-block',
    }
  }

  const filterBtn = (active: boolean, type: 'green' | 'orange' | 'gray'): React.CSSProperties => {
    const colorMap = {
      green:  { color: GREEN,  bg: dark ? DARK.green  + '22' : LIGHT.greenBg  },
      orange: { color: ORANGE, bg: dark ? DARK.orange + '22' : LIGHT.orangeBg },
      gray:   { color: GRAY,   bg: dark ? DARK.gray   + '18' : LIGHT.grayBg   },
    }
    const c = colorMap[type]
    return {
      background: active ? c.bg : dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
      color: active ? c.color : subColor,
      border: `1px solid ${active ? dark ? c.color + '55' : c.color + '44' : dark ? DARK.border : 'rgba(0,0,0,0.1)'}`,
      borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: active ? 700 : 500,
      cursor: 'pointer', transition: 'all 0.15s',
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: dark ? DARK.inputBg : LIGHT.inputBg,
    border: `1px solid ${dark ? DARK.border : 'rgba(0,0,0,0.1)'}`,
    borderRadius: 10, padding: '10px 14px', fontSize: 14, color: textColor,
    outline: 'none', boxSizing: 'border-box', fontFamily: FONT,
    boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 2px 4px rgba(0,0,0,0.04)',
  }

  const isFree      = plan === 'free'
  const isAtLimit   = isFree && totalCount >= FREE_LIMIT
  const isNearLimit = isFree && totalCount >= FREE_LIMIT - 5 && totalCount < FREE_LIMIT

  const stepIndex = { upload: 0, mapping: 1, preview: 1, done: 2 }

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: dark ? DARK.bg : LIGHT.bg }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: noiseSvg, opacity: dark ? 0.35 : 0.15 }} />
      <div style={{ position: 'fixed', top: -200, left: '30%', width: 600, height: 600, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(48,209,88,0.06) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(10,132,255,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -200, right: '10%', width: 500, height: 500, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(10,132,255,0.04) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(48,209,88,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: textColor, margin: 0, letterSpacing: '-0.04em' }}>{t('trades_title')}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setShowImport(true)} style={{
                background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.8)',
                border: `1px solid ${borderColor}`, borderRadius: 12, padding: '10px 16px',
                fontSize: 14, fontWeight: 600, color: textColor, cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
              }}>{t('trades_import_csv')}</button>
              <button
                onClick={() => isAtLimit ? router.push('/billing') : router.push('/trades/new')}
                style={{
                  background: isAtLimit
                    ? dark ? DARK.orange : `linear-gradient(180deg, #e08b00 0%, #b36d00 100%)`
                    : dark ? DARK.green  : `linear-gradient(180deg, #1f9e3f 0%, #166b2b 100%)`,
                  color: isAtLimit ? '#000' : '#fff',
                  border: 'none', borderRadius: 12, padding: '10px 20px',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  boxShadow: dark ? `0 0 20px ${isAtLimit ? DARK.orange : DARK.green}44` : '0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
                  transition: 'all 0.2s',
                }}
              >{isAtLimit ? t('trades_upgrade') : t('trades_add')}</button>
            </div>
          </div>

          {/* Banners */}
          {isAtLimit && (
            <div style={{ background: dark ? `linear-gradient(135deg, ${DARK.orange}15, ${DARK.red}10)` : LIGHT.orangeBg, border: `1px solid ${dark ? DARK.orange + '44' : LIGHT.orange + '44'}`, borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: ORANGE, marginBottom: 4 }}>{t('trades_free_limit_title')}</div>
              <div style={{ fontSize: 13, color: subColor, marginBottom: 10 }}>{t('trades_free_limit_sub').replace('{count}', String(totalCount)).replace('{limit}', String(FREE_LIMIT))}</div>
              <a href="/billing" style={{ display: 'inline-block', background: dark ? DARK.orange : `linear-gradient(180deg, #e08b00 0%, #b36d00 100%)`, color: dark ? '#000' : '#fff', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Upgrade to Pro →</a>
            </div>
          )}
          {isNearLimit && (
            <div style={{ background: dark ? `${DARK.blue}12` : LIGHT.blueBg, border: `1px solid ${dark ? DARK.blue + '30' : LIGHT.blue + '33'}`, borderRadius: 16, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: subColor }}>
                <span style={{ color: BLUE, fontWeight: 600 }}>ℹ️ </span>
                {t('trades_near_limit').replace('{count}', String(FREE_LIMIT - totalCount))}{' '}
                <a href="/billing" style={{ color: BLUE, fontWeight: 600 }}>Upgrade to Pro →</a>
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
                style={filterBtn(filterResult === f.val, f.val === 'Тейк' ? 'green' : 'gray')}>
                {f.label}
              </button>
            ))}
            <div style={{ width: 1, height: 24, background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '0 4px' }} />
            <button onClick={() => setFilterStatus('')}        style={filterBtn(filterStatus === '',        'gray')}>{t('trades_all_trades')}</button>
            <button onClick={() => setFilterStatus('planned')} style={filterBtn(filterStatus === 'planned', 'orange')}>{t('trades_planned')}</button>
            <button onClick={() => setFilterStatus('closed')}  style={filterBtn(filterStatus === 'closed',  'green')}>{t('trades_closed')}</button>
            {pairs.length > 0 && (
              <select value={filterPair} onChange={e => setFilterPair(e.target.value)} style={{
                background: dark ? DARK.inputBg : LIGHT.inputBg,
                border: `1px solid ${dark ? DARK.border : 'rgba(0,0,0,0.1)'}`,
                color: textColor, borderRadius: 10, padding: '7px 14px', fontSize: 13,
                marginLeft: 'auto', outline: 'none',
              }}>
                <option value="">{t('trades_all_pairs')}</option>
                {pairs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
          </div>

          {/* Table card */}
          <div style={{
            background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 20, border: `1px solid ${borderColor}`,
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
                <div className="trades-desktop" style={{ overflowX: 'auto', position: 'relative', zIndex: 2 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${dark ? DARK.border : 'rgba(0,0,0,0.06)'}` }}>
                        {[t('th_date'), t('th_pair'), t('th_setup'), t('trades_status_label'), t('th_rr'), t('th_direction'), t('th_result'), t('th_pnl'), 'P&L %', t('th_grade'), ''].map((h, i) => (
                          <th key={i} style={{ textAlign: 'left', padding: '12px 14px', color: subColor, fontWeight: 600, whiteSpace: 'nowrap', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade) => {
                        const isPlanned = (trade as any).status === 'planned'
                        const rowBg = isPlanned
                          ? dark ? `${DARK.orange}08` : `${LIGHT.orangeBg}88`
                          : trade.result === 'Тейк' ? dark ? `${DARK.green}06` : `${LIGHT.greenBg}66`
                          : trade.result === 'Стоп' ? dark ? `${DARK.red}06`   : `${LIGHT.redBg}66`
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
                                ? <span style={badge(t('trades_badge_planned'), 'orange')}>{t('trades_badge_planned')}</span>
                                : <span style={badge(t('trades_badge_closed'), 'green')}>{t('trades_badge_closed')}</span>}
                            </td>
                            <td style={{ padding: '11px 14px', color: textColor }}>{trade.rr}</td>
                            <td style={{ padding: '11px 14px' }}>
                              <span style={badge(trade.direction, trade.direction === 'Long' ? 'green' : 'red')}>{trade.direction}</span>
                            </td>
                            <td style={{ padding: '11px 14px' }}>
                              {isPlanned
                                ? <span style={{ color: subColor, fontSize: 12 }}>—</span>
                                : <span style={badge(resultLabel(trade.result), trade.result === 'Тейк' ? 'green' : trade.result === 'Стоп' ? 'red' : 'gray')}>{resultLabel(trade.result)}</span>}
                            </td>
                            <td style={{ padding: '11px 14px', fontWeight: 700, color: isPlanned ? subColor : (trade.profit_usd >= 0 ? GREEN : RED) }}>
                              {isPlanned ? '—' : `${trade.profit_usd >= 0 ? '+' : ''}${trade.profit_usd}$`}
                            </td>
                            <td style={{ padding: '11px 14px', color: isPlanned ? subColor : (trade.profit_pct >= 0 ? GREEN : RED) }}>
                              {isPlanned ? '—' : `${trade.profit_pct >= 0 ? '+' : ''}${trade.profit_pct}%`}
                            </td>
                            <td style={{ padding: '11px 14px' }}>
                              {trade.self_grade && !isPlanned && (
                                <span style={badge(trade.self_grade, trade.self_grade === 'A' ? 'green' : trade.self_grade === 'B' ? 'blue' : trade.self_grade === 'C' ? 'orange' : 'red')}>{trade.self_grade}</span>
                              )}
                            </td>
                            <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                              <button onClick={() => deleteTrade(trade.id)} style={{ background: dark ? `${DARK.red}12` : LIGHT.redBg, color: RED, border: `1px solid ${dark ? DARK.red + '33' : LIGHT.red + '33'}`, borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>{t('trades_delete')}</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="trades-mobile" style={{ display: 'none', padding: '8px', position: 'relative', zIndex: 2 }}>
                  {trades.map(trade => {
                    const isPlanned = (trade as any).status === 'planned'
                    return (
                      <div key={trade.id} onClick={() => router.push(`/trades/${trade.id}`)}
                        style={{ background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)', borderRadius: 14, padding: '14px 16px', marginBottom: 8, border: `1px solid ${isPlanned ? dark ? DARK.orange + '44' : LIGHT.orange + '33' : borderColor}`, cursor: 'pointer', boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.9)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: textColor, fontSize: 15 }}>{trade.pair}</span>
                            <span style={badge(trade.direction, trade.direction === 'Long' ? 'green' : 'red')}>{trade.direction}</span>
                            {isPlanned
                              ? <span style={badge(t('trades_badge_planned'), 'orange')}>{t('trades_badge_planned')}</span>
                              : <span style={badge(resultLabel(trade.result), trade.result === 'Тейк' ? 'green' : trade.result === 'Стоп' ? 'red' : 'gray')}>{resultLabel(trade.result)}</span>}
                          </div>
                          <span style={{ fontWeight: 700, color: isPlanned ? subColor : (trade.profit_usd >= 0 ? GREEN : RED), fontSize: 15 }}>
                            {isPlanned ? '—' : `${trade.profit_usd >= 0 ? '+' : ''}${trade.profit_usd}$`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 12, color: subColor }}>{trade.date} · RR {trade.rr} · {trade.setup.split('+')[0].trim()}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {trade.self_grade && !isPlanned && (
                              <span style={badge(trade.self_grade, trade.self_grade === 'A' ? 'green' : trade.self_grade === 'B' ? 'blue' : trade.self_grade === 'C' ? 'orange' : 'red')}>{trade.self_grade}</span>
                            )}
                            <button onClick={e => { e.stopPropagation(); deleteTrade(trade.id) }} style={{ background: dark ? `${DARK.red}12` : LIGHT.redBg, color: RED, border: 'none', borderRadius: 8, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>✕</button>
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

      {/* IMPORT MODAL */}
      {showImport && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={resetImport}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: dark ? '#1c1c1e' : '#fff', borderRadius: 24, padding: '28px 24px', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${borderColor}`, boxShadow: '0 32px 100px rgba(0,0,0,0.5)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: textColor }}>{t('trades_import_title')}</div>
                <div style={{ fontSize: 13, color: subColor, marginTop: 4 }}>
                  {importStep === 'upload'  && t('trades_import_sub_upload')}
                  {importStep === 'mapping' && t('trades_import_sub_map')}
                  {importStep === 'preview' && t('trades_import_sub_prev').replace('{count}', String(importTotal))}
                  {importStep === 'done'    && t('trades_import_sub_done')}
                </div>
              </div>
              <button onClick={resetImport} style={{ background: 'transparent', border: 'none', color: subColor, fontSize: 24, cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
              {[t('trades_import_step1'), t('trades_import_step2'), t('trades_import_step3')].map((s, i) => (
                <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', height: 3, borderRadius: 2, background: stepIndex[importStep] >= i ? GREEN : dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', transition: 'background 0.3s' }} />
                  <div style={{ fontSize: 10, color: stepIndex[importStep] >= i ? GREEN : subColor, fontWeight: 600 }}>{s}</div>
                </div>
              ))}
            </div>

            {importStep === 'upload' && (
              <div>
                <div style={{ background: dark ? 'rgba(10,132,255,0.08)' : LIGHT.blueBg, border: `1px solid ${BLUE}22`, borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: BLUE, marginBottom: 10 }}>{t('trades_import_supported')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {SUPPORTED_EXCHANGES.map((ex: any) => (
                      <div key={ex.name} style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)', border: `1px solid ${borderColor}`, borderRadius: 8, padding: '4px 10px', fontSize: 12, color: textColor, fontWeight: 600 }}>
                        {ex.name}
                        {ex.formats.includes('Маппінг вручну') && <span style={{ color: ORANGE, fontSize: 10, marginLeft: 4 }}>*</span>}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: subColor, marginTop: 8 }}>{t('trades_import_manual_note')}</div>
                </div>

                <label style={{ display: 'block', border: `2px dashed ${importFile ? GREEN : borderColor}`, borderRadius: 16, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: importFile ? (dark ? `${DARK.green}0a` : LIGHT.greenBg) : 'transparent', transition: 'all 0.2s' }}>
                  <input type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
                    onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setImportFile(file); setImportError('')
                      const text = await file.text()
                      setImportText(text)
                    }}
                  />
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{importFile ? '✅' : '📁'}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: textColor, marginBottom: 6 }}>
                    {importFile ? importFile.name : t('trades_import_drop')}
                  </div>
                  <div style={{ fontSize: 12, color: subColor }}>{t('trades_import_formats')}</div>
                </label>

                {importError && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: `${RED}12`, color: RED, fontSize: 13 }}>{importError}</div>}

                <button disabled={!importFile || importLoading} onClick={() => analyzeFile(false)} style={{
                  width: '100%', marginTop: 16, padding: '13px', borderRadius: 12, border: 'none',
                  fontSize: 15, fontWeight: 700, cursor: !importFile ? 'not-allowed' : 'pointer',
                  background: !importFile ? dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' : dark ? DARK.green : 'linear-gradient(180deg, #1f9e3f 0%, #166b2b 100%)',
                  color: !importFile ? subColor : '#fff',
                }}>{importLoading ? t('trades_import_analyzing') : t('trades_import_analyze')}</button>
              </div>
            )}

            {importStep === 'mapping' && (
              <div>
                <div style={{ padding: '12px 16px', borderRadius: 12, background: `${ORANGE}12`, color: ORANGE, fontSize: 13, marginBottom: 20 }}>{t('trades_import_unknown')}</div>
                {[
                  { key: 'pair',        label: 'Trading Pair / Торгова пара',       required: true  },
                  { key: 'side',        label: 'Direction (Buy/Sell/Long/Short)',    required: true  },
                  { key: 'pnl',         label: 'P&L / Profit (USDT)',               required: true  },
                  { key: 'date',        label: 'Date / Дата',                        required: true  },
                  { key: 'entry_price', label: 'Entry Price / Ціна входу',           required: false },
                  { key: 'exit_price',  label: 'Exit Price / Ціна виходу',           required: false },
                ].map(field => (
                  <div key={field.key} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, color: subColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                      {field.label} {field.required ? <span style={{ color: RED }}>*</span> : <span style={{ color: subColor, fontSize: 10 }}>(optional)</span>}
                    </label>
                    <select value={(mapping as any)[field.key]} onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))} style={{ ...inputStyle }}>
                      <option value="">— not selected —</option>
                      {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: subColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>Trade Type</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['futures', 'spot'] as const).map(tt => (
                      <button key={tt} onClick={() => setMapping(m => ({ ...m, trade_type: tt }))} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${mapping.trade_type === tt ? GREEN : borderColor}`, background: mapping.trade_type === tt ? `${GREEN}22` : 'transparent', color: mapping.trade_type === tt ? GREEN : subColor, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                        {tt === 'futures' ? '📈 Futures' : '🪙 Spot'}
                      </button>
                    ))}
                  </div>
                </div>
                {importError && <div style={{ padding: '10px 14px', borderRadius: 10, background: `${RED}12`, color: RED, fontSize: 13, marginBottom: 12 }}>{importError}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setImportStep('upload')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1px solid ${borderColor}`, background: 'transparent', color: subColor, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{t('trades_import_back')}</button>
                  <button disabled={!mapping.pair || !mapping.side || !mapping.pnl || !mapping.date || importLoading} onClick={() => analyzeFile(true)} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: dark ? DARK.green : 'linear-gradient(180deg, #1f9e3f 0%, #166b2b 100%)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                    {importLoading ? t('trades_import_checking') : t('trades_import_preview_btn')}
                  </button>
                </div>
              </div>
            )}

            {importStep === 'preview' && (
              <div>
                {importFormat !== 'unknown' && (
                  <div style={{ padding: '10px 16px', borderRadius: 12, background: `${GREEN}12`, color: GREEN, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                    {t('trades_preview_format')} {FORMAT_LABELS[importFormat]}
                  </div>
                )}
                <div style={{ fontSize: 13, color: subColor, marginBottom: 12 }}>
                  {t('trades_preview_first').replace('{count}', String(importPreview.length)).replace('{total}', String(importTotal))}
                </div>
                <div style={{ overflowX: 'auto', marginBottom: 20, borderRadius: 12, border: `1px solid ${borderColor}` }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${borderColor}`, background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                        {[t('trades_col_date'), t('trades_col_pair'), t('trades_col_direction'), t('trades_col_pnl'), t('trades_col_result'), t('trades_col_type')].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: subColor, fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((tr, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                          <td style={{ padding: '9px 12px', color: subColor, whiteSpace: 'nowrap' }}>{tr.date}</td>
                          <td style={{ padding: '9px 12px', fontWeight: 700, color: textColor }}>{tr.pair}</td>
                          <td style={{ padding: '9px 12px', color: tr.direction === 'Long' ? GREEN : RED, fontWeight: 700 }}>{tr.direction}</td>
                          <td style={{ padding: '9px 12px', fontWeight: 700, color: tr.profit_usd >= 0 ? GREEN : RED }}>{tr.profit_usd >= 0 ? '+' : ''}{tr.profit_usd}$</td>
                          <td style={{ padding: '9px 12px', color: tr.result === 'Тейк' ? GREEN : tr.result === 'Стоп' ? RED : subColor }}>{tr.result}</td>
                          <td style={{ padding: '9px 12px', color: subColor }}>{tr.trade_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importError && <div style={{ padding: '10px 14px', borderRadius: 10, background: `${RED}12`, color: RED, fontSize: 13, marginBottom: 12 }}>{importError}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setImportStep('upload')} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1px solid ${borderColor}`, background: 'transparent', color: subColor, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{t('trades_import_back')}</button>
                  <button disabled={importLoading} onClick={doImport} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: dark ? DARK.green : 'linear-gradient(180deg, #1f9e3f 0%, #166b2b 100%)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                    {importLoading ? t('trades_import_doing') : t('trades_import_do').replace('{count}', String(importTotal))}
                  </button>
                </div>
              </div>
            )}

            {importStep === 'done' && importResult && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: textColor, marginBottom: 8 }}>{t('trades_import_done_title')}</div>
                <div style={{ fontSize: 15, color: subColor, marginBottom: 28 }}>
                  {t('trades_import_done_added')} <span style={{ color: GREEN, fontWeight: 800 }}>{importResult.imported}</span>
                  {importResult.skipped > 0 && <span style={{ color: subColor }}> · {t('trades_import_done_skip')} {importResult.skipped}</span>}
                </div>
                <button onClick={resetImport} style={{ padding: '13px 32px', borderRadius: 12, border: 'none', background: dark ? DARK.green : 'linear-gradient(180deg, #1f9e3f 0%, #166b2b 100%)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                  {t('trades_import_view')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .trades-desktop { display: none !important; }
          .trades-mobile  { display: block !important; }
        }
      `}</style>
    </div>
  )
}
