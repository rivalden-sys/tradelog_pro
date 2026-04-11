'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/hooks/useLocale'
import { createClient } from '@/lib/supabase/client'
import NavBar from '@/components/layout/NavBar'
import { Trade } from '@/types'
import { DARK, LIGHT } from '@/lib/colors'

const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"

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

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ background: color + '22', color, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
      {label}
    </span>
  )
}

function ScoreBar({ score, green, orange, red }: { score: number; green: string; orange: string; red: string }) {
  const color = score >= 70 ? green : score >= 40 ? orange : red
  const gray = '#8e8e93'
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: gray }}>Probability of success</span>
        <span style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: '-0.03em' }}>{score}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(128,128,128,0.15)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg, ${color}, ${color}99)`, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

function ProGate({ feature, dark, purple, blue }: { feature: string; dark: boolean; purple: string; blue: string }) {
  const subColor = dark ? DARK.sub : LIGHT.sub
  return (
    <div style={{
      padding: '28px 20px', textAlign: 'center',
      background: dark ? `linear-gradient(135deg, ${purple}15, ${blue}10)` : `linear-gradient(135deg, ${purple}10, ${blue}08)`,
      borderRadius: 14, border: `1px solid ${purple}30`,
    }}>
      <div style={{ fontSize: 24, marginBottom: 10 }}>⚡</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: dark ? DARK.text : LIGHT.text, marginBottom: 6 }}>Pro Feature</div>
      <div style={{ fontSize: 13, color: subColor, marginBottom: 18, lineHeight: 1.6 }}>
        {feature} is available on Pro plan only.
      </div>
      <a href="/billing" style={{ display: 'inline-block', background: purple, color: '#fff', borderRadius: 10, padding: '9px 22px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
        Upgrade to Pro →
      </a>
    </div>
  )
}

function HistoryTag({ date, onLoad }: { date: string; onLoad: () => void }) {
  const d = new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  return (
    <button onClick={onLoad} style={{
      padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(128,128,128,0.2)',
      background: 'transparent', color: '#8e8e93', fontSize: 11, fontWeight: 600,
      cursor: 'pointer', fontFamily: FONT,
    }}>{d}</button>
  )
}

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const dark = useDark()
  const { t, locale } = useLocale()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const GREEN  = dark ? DARK.green  : LIGHT.green
  const RED    = dark ? DARK.red    : LIGHT.red
  const BLUE   = dark ? DARK.blue   : LIGHT.blue
  const ORANGE = dark ? DARK.orange : LIGHT.orange
  const PURPLE = dark ? DARK.purple : LIGHT.purple
  const GRAY   = dark ? DARK.gray   : LIGHT.gray

  const textColor   = dark ? DARK.text   : LIGHT.text
  const subColor    = dark ? DARK.sub    : LIGHT.sub
  const borderColor = dark ? DARK.border : LIGHT.border

  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

  const resultColor = (r: string) => {
    if (r === 'Тейк') return GREEN
    if (r === 'Стоп') return RED
    return GRAY
  }

  const gradeColor = (g: string) => {
    if (g === 'A') return GREEN
    if (g === 'B') return BLUE
    if (g === 'C') return ORANGE
    return RED
  }

  const [trade,        setTrade]        = useState<Trade | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [aiData,       setAiData]       = useState<any>(null)
  const [scoreData,    setScoreData]    = useState<any>(null)
  const [aiLoading,    setAiLoading]    = useState(false)
  const [scoreLoading, setScoreLoading] = useState(false)
  const [aiError,      setAiError]      = useState('')
  const [scoreError,   setScoreError]   = useState('')
  const [aiProGate,    setAiProGate]    = useState(false)
  const [scoreProGate, setScoreProGate] = useState(false)
  const [aiHistory,    setAiHistory]    = useState<any[]>([])
  const [scoreHistory, setScoreHistory] = useState<any[]>([])
  const [editingComment, setEditingComment] = useState(false)
  const [commentValue,   setCommentValue]   = useState('')
  const [commentSaving,  setCommentSaving]  = useState(false)
  const [showCloseForm,  setShowCloseForm]  = useState(false)
  const [closeResult,    setCloseResult]    = useState<'Тейк' | 'Стоп' | 'БУ'>('Тейк')
  const [closeProfitUsd, setCloseProfitUsd] = useState('')
  const [closeProfitPct, setCloseProfitPct] = useState('')
  const [closeComment,   setCloseComment]   = useState('')
  const [closeGrade,     setCloseGrade]     = useState<'A'|'B'|'C'|'D'>('A')
  const [closeSaving,    setCloseSaving]    = useState(false)
  const [closeError,     setCloseError]     = useState('')
  const [closeFieldErrors, setCloseFieldErrors] = useState<{ profitUsd?: boolean; profitPct?: boolean }>({})
  const [tradeId,        setTradeId]        = useState<string>('')
  const [ruleChecks,     setRuleChecks]     = useState<any[]>([])
  const [playbook,       setPlaybook]       = useState<any>(null)
  const [screenshotUrl,      setScreenshotUrl]      = useState<string>('')
  const [screenshotUploading, setScreenshotUploading] = useState(false)
  const [screenshotError,    setScreenshotError]    = useState('')
  const [dragOver,           setDragOver]           = useState(false)

  useEffect(() => {
    const load = async () => {
      const { id } = await params
      setTradeId(id)
      const res  = await fetch(`/api/trades/${id}`)
      const json = await res.json()
      if (!json.success) { setLoading(false); return }
      setTrade(json.data)
      setCommentValue(json.data.comment || '')
      if (json.data.screenshot_url) setScreenshotUrl(json.data.screenshot_url)
      const supabase = createClient()

      const { data: sessions } = await supabase
        .from('ai_sessions').select('*').eq('trade_id', id)
        .in('type', ['trade_review', 'trade_score'])
        .order('created_at', { ascending: false }).limit(10)
      if (sessions) {
        const reviews = sessions.filter(s => s.type === 'trade_review')
        const scores  = sessions.filter(s => s.type === 'trade_score')
        setAiHistory(reviews)
        setScoreHistory(scores)
        if (reviews.length > 0) { try { setAiData(JSON.parse(reviews[0].response)) } catch {} }
        if (scores.length > 0)  { try { setScoreData(JSON.parse(scores[0].response)) } catch {} }
      }

      const { data: checks } = await supabase
        .from('trade_rule_checks').select('*').eq('trade_id', id)
      if (checks?.length) {
        setRuleChecks(checks)
        const { data: pb } = await supabase
          .from('playbooks').select('*').eq('id', checks[0].playbook_id).single()
        if (pb) setPlaybook(pb)
      }

      setLoading(false)
    }
    load()
  }, [params])

  const uploadScreenshot = async (file: File) => {
    if (!tradeId) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { setScreenshotError('Only JPG, PNG, WEBP allowed'); return }
    if (file.size > 2 * 1024 * 1024) { setScreenshotError('Max file size is 2MB'); return }
    setScreenshotUploading(true); setScreenshotError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res  = await fetch(`/api/trades/${tradeId}/upload`, { method: 'POST', body: formData })
      const json = await res.json()
      if (json.success) setScreenshotUrl(json.url)
      else setScreenshotError(json.error || 'Upload failed')
    } catch { setScreenshotError('Network error') }
    setScreenshotUploading(false)
  }

  const deleteScreenshot = async () => {
    if (!tradeId) return
    setScreenshotUploading(true); setScreenshotError('')
    try {
      const res  = await fetch(`/api/trades/${tradeId}/upload`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) setScreenshotUrl('')
      else setScreenshotError(json.error || 'Delete failed')
    } catch { setScreenshotError('Network error') }
    setScreenshotUploading(false)
  }

  const saveComment = async () => {
    if (!tradeId) return
    setCommentSaving(true)
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: commentValue }),
      })
      const json = await res.json()
      if (json.success) { setTrade(prev => prev ? { ...prev, comment: commentValue } : prev); setEditingComment(false) }
    } catch {}
    setCommentSaving(false)
  }

  const closeTrade = async () => {
    if (!tradeId) return
    if (closeResult !== 'БУ') {
      const errors: { profitUsd?: boolean; profitPct?: boolean } = {}
      if (!closeProfitUsd.trim()) errors.profitUsd = true
      if (!closeProfitPct.trim()) errors.profitPct = true
      if (Object.keys(errors).length > 0) { setCloseFieldErrors(errors); return }
    }
    setCloseFieldErrors({})
    setCloseSaving(true); setCloseError('')
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'closed', result: closeResult,
          profit_usd: parseFloat(closeProfitUsd) || 0,
          profit_pct: parseFloat(closeProfitPct) || 0,
          comment: closeComment || trade?.comment || '',
          self_grade: closeGrade,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setTrade(prev => prev ? { ...prev, status: 'closed', result: closeResult, profit_usd: parseFloat(closeProfitUsd) || 0, profit_pct: parseFloat(closeProfitPct) || 0, comment: closeComment || prev.comment, self_grade: closeGrade } : prev)
        setShowCloseForm(false)
      } else { setCloseError(json.error || 'Error saving') }
    } catch { setCloseError('Network error') }
    setCloseSaving(false)
  }

  const runAIReview = async () => {
    if (!trade) return
    setAiLoading(true); setAiError(''); setAiProGate(false)
    try {
      const res  = await fetch('/api/ai/trade-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trade, locale }) })
      const json = await res.json()
      if (json.success) { setAiData(json.data); setAiHistory(prev => [{ response: JSON.stringify(json.data), created_at: new Date().toISOString() }, ...prev]) }
      else if (json.code === 'PRO_REQUIRED') setAiProGate(true)
      else setAiError(json.error || 'AI error')
    } catch { setAiError(t('ai_net_error')) }
    setAiLoading(false)
  }

  const runTradeScore = async () => {
    if (!trade) return
    setScoreLoading(true); setScoreError(''); setScoreProGate(false)
    try {
      const res  = await fetch('/api/ai/trade-score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trade, locale }) })
      const json = await res.json()
      if (json.success) { setScoreData(json.data); setScoreHistory(prev => [{ response: JSON.stringify(json.data), created_at: new Date().toISOString() }, ...prev]) }
      else if (json.code === 'PRO_REQUIRED') setScoreProGate(true)
      else setScoreError(json.error || 'AI error')
    } catch { setScoreError(t('ai_net_error')) }
    setScoreLoading(false)
  }

  function glassCard(accent?: string): React.CSSProperties {
    return {
      background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderRadius: 20, padding: '20px',
      border: `1px solid ${accent ? accent + '44' : borderColor}`,
      boxShadow: dark
        ? `inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.02)`
        : `inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)`,
      position: 'relative', overflow: 'hidden',
    }
  }

  const glare = (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: dark ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />
  )

  const btnStyle = (bg: string, color: string, disabled?: boolean): React.CSSProperties => ({
    padding: '9px 18px', borderRadius: 12, border: 'none',
    background: disabled ? dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' : bg,
    color: disabled ? subColor : color,
    fontSize: 13, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
    fontFamily: FONT, opacity: disabled ? 0.7 : 1, transition: 'all 0.2s',
    boxShadow: disabled ? 'none' : `0 0 20px ${bg}44`,
    whiteSpace: 'nowrap' as const,
  })

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%', padding: '10px 14px', borderRadius: 12,
    border: `1px solid ${hasError ? RED : borderColor}`,
    background: hasError
      ? dark ? `${RED}15` : `${RED}08`
      : dark ? DARK.inputBg : LIGHT.inputBg,
    color: textColor, fontSize: 14, fontFamily: FONT,
    outline: 'none', boxSizing: 'border-box',
    backdropFilter: 'blur(10px)',
    boxShadow: hasError
      ? `0 0 0 3px ${RED}22`
      : dark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  })

  const toggleBtn = (active: boolean, color: string): React.CSSProperties => ({
    padding: '8px 18px', borderRadius: 10,
    border: `1px solid ${active ? color : borderColor}`,
    background: active ? color + '22' : dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
    color: active ? color : subColor,
    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
    backdropFilter: 'blur(10px)',
  })

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: subColor, fontWeight: 600,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em',
  }

  const errorLabelStyle: React.CSSProperties = {
    fontSize: 11, color: RED, fontWeight: 600, marginTop: 5,
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: dark ? DARK.bg : LIGHT.bg, fontFamily: FONT }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: subColor }}>{t('trade_detail_loading')}</div>
    </div>
  )

  if (!trade) return (
    <div style={{ minHeight: '100vh', background: dark ? DARK.bg : LIGHT.bg, fontFamily: FONT }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: subColor }}>{t('trade_detail_not_found')}</div>
    </div>
  )

  const isPlanned = (trade as any).status === 'planned'
  const followedCount = ruleChecks.filter(c => c.followed).length

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: dark ? DARK.bg : LIGHT.bg }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: noiseSvg, opacity: dark ? 0.35 : 0.15 }} />
      <div style={{ position: 'fixed', top: -200, left: '30%', width: 600, height: 600, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(48,209,88,0.06) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(10,132,255,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -200, right: '10%', width: 500, height: 500, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(10,132,255,0.04) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(48,209,88,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <button onClick={() => router.back()} style={{
              background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
              border: `1px solid ${borderColor}`, backdropFilter: 'blur(10px)',
              borderRadius: 10, padding: '8px 14px', color: subColor,
              fontSize: 13, cursor: 'pointer', fontFamily: FONT,
              boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
            }}>← {t('trade_detail_back').replace('← ', '')}</button>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: textColor, letterSpacing: '-0.03em' }}>
                {trade.pair} <span style={{ color: trade.direction === 'Long' ? GREEN : RED }}>{trade.direction}</span>
              </div>
              <div style={{ fontSize: 13, color: subColor, marginTop: 2 }}>{trade.date} · {trade.setup}</div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {isPlanned
                ? <Badge label={t('trade_planned_badge')} color={ORANGE} />
                : <Badge label={trade.result} color={resultColor(trade.result)} />
              }
              {trade.self_grade && !isPlanned && <Badge label={`Grade ${trade.self_grade}`} color={gradeColor(trade.self_grade)} />}
              <button onClick={() => router.push(`/trades/${tradeId}/edit`)} style={{
                background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                border: `1px solid ${borderColor}`, backdropFilter: 'blur(10px)',
                borderRadius: 10, padding: '8px 14px', color: subColor,
                fontSize: 13, cursor: 'pointer', fontFamily: FONT,
                boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
              }}>✏️ {t('trade_detail_edit')}</button>
              {isPlanned && (
                <button onClick={() => setShowCloseForm(true)} style={btnStyle(GREEN, '#000')}>
                  {t('trade_close_btn')}
                </button>
              )}
            </div>
          </div>

          {/* Close form */}
          {showCloseForm && (
            <div style={{ ...glassCard(GREEN), marginBottom: 20 }}>
              {glare}
              <div style={{ fontSize: 15, fontWeight: 800, color: textColor, marginBottom: 20, position: 'relative' }}>{t('trade_close_title')}</div>
              <div style={{ marginBottom: 16, position: 'relative' }}>
                <div style={labelStyle}>{t('trade_close_result')}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['Тейк', 'Стоп', 'БУ'] as const).map(r => (
                    <button key={r} onClick={() => { setCloseResult(r); setCloseFieldErrors({}) }} style={toggleBtn(closeResult === r, r === 'Тейк' ? GREEN : r === 'Стоп' ? RED : GRAY)}>
                      {r === 'Тейк' ? t('new_trade_take') : r === 'Стоп' ? t('new_trade_stop') : t('new_trade_bu')}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, position: 'relative' }}>
                <div>
                  <div style={{ ...labelStyle, color: closeFieldErrors.profitUsd ? RED : subColor }}>
                    {t('new_trade_profit_usd')}{closeResult !== 'БУ' ? ' *' : ''}
                  </div>
                  <input type="number" placeholder="150.00" value={closeProfitUsd}
                    onChange={e => { setCloseProfitUsd(e.target.value); setCloseFieldErrors(prev => ({ ...prev, profitUsd: false })) }}
                    style={inputStyle(closeFieldErrors.profitUsd)} />
                  {closeFieldErrors.profitUsd && <div style={errorLabelStyle}>Обов'язкове поле</div>}
                </div>
                <div>
                  <div style={{ ...labelStyle, color: closeFieldErrors.profitPct ? RED : subColor }}>
                    {t('new_trade_profit_pct')}{closeResult !== 'БУ' ? ' *' : ''}
                  </div>
                  <input type="number" placeholder="1.5" value={closeProfitPct}
                    onChange={e => { setCloseProfitPct(e.target.value); setCloseFieldErrors(prev => ({ ...prev, profitPct: false })) }}
                    style={inputStyle(closeFieldErrors.profitPct)} />
                  {closeFieldErrors.profitPct && <div style={errorLabelStyle}>Обов'язкове поле</div>}
                </div>
              </div>
              <div style={{ marginBottom: 16, position: 'relative' }}>
                <div style={labelStyle}>{t('trade_close_grade')}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['A', 'B', 'C', 'D'] as const).map(g => (
                    <button key={g} onClick={() => setCloseGrade(g)} style={toggleBtn(closeGrade === g, gradeColor(g))}>{g}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20, position: 'relative' }}>
                <div style={labelStyle}>{t('trade_close_comment')}</div>
                <textarea placeholder={t('trade_close_comment_ph')} value={closeComment} onChange={e => setCloseComment(e.target.value)} rows={3} style={{ ...inputStyle(), resize: 'vertical' }} />
              </div>
              {closeError && <div style={{ padding: '10px 14px', borderRadius: 10, background: `${RED}12`, color: RED, fontSize: 13, marginBottom: 12, position: 'relative' }}>{closeError}</div>}
              <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
                <button onClick={closeTrade} disabled={closeSaving} style={btnStyle(GREEN, '#000', closeSaving)}>
                  {closeSaving ? t('trade_close_saving') : t('trade_close_save')}
                </button>
                <button onClick={() => { setShowCloseForm(false); setCloseFieldErrors({}) }} style={{
                  padding: '9px 18px', borderRadius: 12, border: `1px solid ${borderColor}`,
                  background: 'transparent', color: subColor, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                }}>{t('trade_close_cancel')}</button>
              </div>
            </div>
          )}

          {/* Content grid */}
          <div className="trade-detail-grid">

            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Fields */}
              <div style={glassCard()}>
                {glare}
                <div style={{ fontSize: 14, fontWeight: 700, color: textColor, marginBottom: 16, position: 'relative' }}>{t('trade_detail_fields')}</div>
                <div className="trade-fields-grid" style={{ position: 'relative' }}>
                  {[
                    { label: t('trade_detail_date'),      value: trade.date },
                    { label: t('trade_detail_pair'),      value: trade.pair },
                    { label: t('trade_detail_setup'),     value: trade.setup },
                    { label: t('trade_detail_direction'), value: trade.direction, color: trade.direction === 'Long' ? GREEN : RED },
                    ...((trade as any).emotion ? [{ label: '🧠 Емоція', value: (() => { const em: Record<string,string> = { calm: '😌 Спокій', fear: '😰 Страх', greed: '🤑 Жадібність', anger: '😤 Злість', euphoria: '🚀 Ейфорія', revenge: '😈 Revenge' }; return em[(trade as any).emotion] || (trade as any).emotion })(), color: (() => { const c: Record<string,string> = { calm: GREEN, fear: BLUE, greed: ORANGE, anger: RED, euphoria: PURPLE, revenge: RED }; return c[(trade as any).emotion] || subColor })() }] : []),
                    ...(!isPlanned ? [
                      { label: t('trade_detail_result'),  value: trade.result, color: resultColor(trade.result) },
                      { label: t('trade_detail_rr'),      value: String(trade.rr) },
                      { label: t('trade_detail_pnl_usd'), value: `${trade.profit_usd >= 0 ? '+' : ''}${trade.profit_usd}$`, color: trade.profit_usd >= 0 ? GREEN : RED },
                      { label: t('trade_detail_pnl_pct'), value: `${trade.profit_pct >= 0 ? '+' : ''}${trade.profit_pct}%`, color: trade.profit_pct >= 0 ? GREEN : RED },
                      ...((trade as any).mae_price ? [{ label: 'MAE', value: String((trade as any).mae_price), color: RED   }] : []),
                      ...((trade as any).mfe_price ? [{ label: 'MFE', value: String((trade as any).mfe_price), color: GREEN }] : []),
                    ] : [
                      { label: t('trade_detail_rr'),      value: String(trade.rr) },
                      { label: t('trade_detail_status'),  value: t('trade_detail_planned'), color: ORANGE },
                      ...((trade as any).entry_price ? [{ label: t('trade_detail_entry'),      value: String((trade as any).entry_price) }] : []),
                      ...((trade as any).stop_price  ? [{ label: t('trade_detail_stop_price'), value: String((trade as any).stop_price), color: RED   }] : []),
                      ...((trade as any).take_price  ? [{ label: t('trade_detail_take_price'), value: String((trade as any).take_price), color: GREEN }] : []),
                      ...((trade as any).risk_pct    ? [{ label: t('trade_detail_risk'),        value: `${(trade as any).risk_pct}%` }] : []),
                    ]),
                  ].map(f => (
                    <div key={f.label} style={{
                      background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
                      borderRadius: 12, padding: '12px 14px',
                      border: `1px solid ${borderColor}`,
                      backdropFilter: 'blur(10px)',
                      boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
                    }}>
                      <div style={{ fontSize: 11, color: subColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{f.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: (f as any).color || textColor }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Playbook rule checks */}
              {playbook && ruleChecks.length > 0 && (
                <div style={glassCard(PURPLE)}>
                  {glare}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>📋 Playbook</div>
                      <div style={{ fontSize: 12, color: subColor, marginTop: 2 }}>{playbook.setup_name}</div>
                    </div>
                    <div style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: followedCount === ruleChecks.length ? GREEN + '22' : followedCount === 0 ? RED + '22' : ORANGE + '22',
                      color: followedCount === ruleChecks.length ? GREEN : followedCount === 0 ? RED : ORANGE,
                    }}>
                      {followedCount}/{ruleChecks.length} правил
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
                    {playbook.rules.map((rule: any, i: number) => {
                      const check = ruleChecks.find(c => c.rule_id === rule.id)
                      const followed = check?.followed ?? false
                      return (
                        <div key={rule.id} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '10px 12px', borderRadius: 10,
                          background: followed ? dark ? 'rgba(48,209,88,0.08)' : 'rgba(48,209,88,0.07)' : dark ? 'rgba(255,69,58,0.08)' : 'rgba(255,69,58,0.06)',
                          border: `1px solid ${followed ? GREEN + '44' : RED + '44'}`,
                        }}>
                          <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, border: `2px solid ${followed ? GREEN : RED}`, background: followed ? GREEN : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {followed
                              ? <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>
                              : <span style={{ color: RED, fontSize: 11, fontWeight: 800 }}>✕</span>
                            }
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: subColor, fontWeight: 600, marginBottom: 2 }}>Правило {i + 1}</div>
                            <div style={{ fontSize: 14, color: textColor, lineHeight: 1.4 }}>{rule.text}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Comment */}
              <div style={glassCard()}>
                {glare}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, position: 'relative' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{t('trade_detail_comment')}</div>
                  {!editingComment && (
                    <button onClick={() => setEditingComment(true)} style={{
                      background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                      border: `1px solid ${borderColor}`, backdropFilter: 'blur(10px)',
                      borderRadius: 8, padding: '5px 12px', color: subColor,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                    }}>{t('trade_detail_comment_edit')}</button>
                  )}
                </div>
                {editingComment ? (
                  <div style={{ position: 'relative' }}>
                    <textarea value={commentValue} onChange={e => setCommentValue(e.target.value)} rows={4}
                      placeholder={t('trade_detail_comment_ph')}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1px solid ${borderColor}`, background: dark ? DARK.inputBg : LIGHT.inputBg, color: textColor, fontSize: 14, fontFamily: FONT, outline: 'none', boxSizing: 'border-box', resize: 'vertical', marginBottom: 10, backdropFilter: 'blur(10px)' }}
                      autoFocus />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={saveComment} disabled={commentSaving} style={btnStyle(BLUE, '#fff', commentSaving)}>
                        {commentSaving ? t('trade_detail_saving') : t('trade_detail_save')}
                      </button>
                      <button onClick={() => { setEditingComment(false); setCommentValue(trade.comment || '') }} style={{ padding: '9px 18px', borderRadius: 12, border: `1px solid ${borderColor}`, background: 'transparent', color: subColor, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                        {t('trade_close_cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    fontSize: 14, color: trade.comment ? textColor : subColor, lineHeight: 1.7,
                    background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
                    borderRadius: 12, padding: '14px 16px', border: `1px solid ${borderColor}`,
                    fontStyle: trade.comment ? 'normal' : 'italic', position: 'relative',
                  }}>
                    {trade.comment || t('trade_detail_no_comment')}
                  </div>
                )}
              </div>

              {/* TradingView */}
              {trade.tradingview_url && (
                <div style={glassCard()}>
                  {glare}
                  <div style={{ fontSize: 14, fontWeight: 700, color: textColor, marginBottom: 12, position: 'relative' }}>TradingView</div>
                  <a href={trade.tradingview_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: BLUE, fontSize: 14, textDecoration: 'none', fontWeight: 600, position: 'relative' }}>
                    {t('trade_detail_tv_link')}
                  </a>
                </div>
              )}

              {/* Screenshot */}
              <div style={glassCard()}>
                {glare}
                <div style={{ fontSize: 14, fontWeight: 700, color: textColor, marginBottom: 12, position: 'relative' }}>📸 Screenshot</div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadScreenshot(f) }} />

                {screenshotUrl ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={screenshotUrl} alt="Trade screenshot"
                      onClick={() => window.open(screenshotUrl, '_blank')}
                      style={{ width: '100%', borderRadius: 12, cursor: 'pointer', border: `1px solid ${borderColor}`, display: 'block' }}
                    />
                    <button onClick={deleteScreenshot} disabled={screenshotUploading} style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(255,69,58,0.85)', color: '#fff',
                      border: 'none', borderRadius: 8, padding: '5px 10px',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                    }}>
                      {screenshotUploading ? '...' : '🗑 Delete'}
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) uploadScreenshot(f) }}
                    style={{
                      border: `2px dashed ${dragOver ? BLUE : borderColor}`,
                      borderRadius: 12, padding: '32px 20px', textAlign: 'center',
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: dragOver ? (dark ? 'rgba(10,132,255,0.08)' : 'rgba(10,132,255,0.05)') : 'transparent',
                    }}
                  >
                    {screenshotUploading ? (
                      <div style={{ color: subColor, fontSize: 13 }}>⏳ Uploading...</div>
                    ) : (
                      <>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
                        <div style={{ fontSize: 13, color: subColor, marginBottom: 4 }}>Click or drag to upload</div>
                        <div style={{ fontSize: 11, color: subColor, opacity: 0.6 }}>JPG, PNG, WEBP · max 2MB</div>
                      </>
                    )}
                  </div>
                )}
                {screenshotError && <div style={{ marginTop: 8, fontSize: 12, color: RED, fontWeight: 600 }}>{screenshotError}</div>}
              </div>

            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Trade Score */}
              <div style={glassCard()}>
                {glare}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8, position: 'relative' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{t('trade_score_title')}</div>
                    <div style={{ fontSize: 12, color: subColor, marginTop: 2 }}>{t('trade_score_sub')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {scoreHistory.length > 1 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {scoreHistory.slice(1, 4).map((s, i) => (
                          <HistoryTag key={i} date={s.created_at} onLoad={() => { try { setScoreData(JSON.parse(s.response)) } catch {} }} />
                        ))}
                      </div>
                    )}
                    {!scoreProGate && (
                      <button onClick={runTradeScore} disabled={scoreLoading} style={btnStyle(ORANGE, '#000', scoreLoading)}>
                        {scoreLoading ? t('trade_score_analyzing') : scoreData ? t('trade_score_rerun') : t('trade_score_get')}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  {scoreProGate && <ProGate feature="Trade Score" dark={dark} purple={PURPLE} blue={BLUE} />}
                  {scoreError && <div style={{ padding: '10px 14px', borderRadius: 10, background: `${RED}12`, color: RED, fontSize: 13 }}>{scoreError}</div>}
                  {!scoreData && !scoreLoading && !scoreError && !scoreProGate && <div style={{ padding: '24px 0', textAlign: 'center', color: subColor, fontSize: 13 }}>{t('trade_score_empty')}</div>}
                  {scoreLoading && <div style={{ padding: '24px 0', textAlign: 'center', color: subColor, fontSize: 13 }}>{t('trade_score_analyzing')}</div>}
                  {scoreData && (
                    <div>
                      <ScoreBar score={scoreData.score} green={GREEN} orange={ORANGE} red={RED} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '16px 0' }}>
                        <div style={{ background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)', border: `1px solid ${borderColor}`, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: subColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('trade_score_similar')}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: textColor, marginTop: 4 }}>{scoreData.similar_trades}</div>
                        </div>
                        <div style={{ background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)', border: `1px solid ${borderColor}`, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: subColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('trade_score_wr')}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: scoreData.win_rate >= 50 ? GREEN : RED, marginTop: 4 }}>{scoreData.win_rate}%</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 14, color: textColor, lineHeight: 1.6, marginBottom: 12 }}>{scoreData.explanation}</div>
                      <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: scoreData.recommendation === 'enter' ? `${GREEN}18` : scoreData.recommendation === 'skip' ? `${RED}18` : `${ORANGE}18`, color: scoreData.recommendation === 'enter' ? GREEN : scoreData.recommendation === 'skip' ? RED : ORANGE }}>
                        {scoreData.recommendation === 'enter' ? t('trade_score_enter') : scoreData.recommendation === 'skip' ? t('trade_score_skip') : t('trade_score_reduce')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Analysis */}
              <div style={glassCard()}>
                {glare}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8, position: 'relative' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{t('ai_analysis_title')}</div>
                    <div style={{ fontSize: 12, color: subColor, marginTop: 2 }}>{t('ai_analysis_sub')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {aiHistory.length > 1 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {aiHistory.slice(1, 4).map((s, i) => (
                          <HistoryTag key={i} date={s.created_at} onLoad={() => { try { setAiData(JSON.parse(s.response)) } catch {} }} />
                        ))}
                      </div>
                    )}
                    {!aiProGate && (
                      <button onClick={runAIReview} disabled={aiLoading} style={btnStyle(BLUE, '#fff', aiLoading)}>
                        {aiLoading ? t('ai_running') : aiData ? t('ai_reanalyze') : t('ai_analyze')}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  {aiProGate && <ProGate feature="AI Analysis" dark={dark} purple={PURPLE} blue={BLUE} />}
                  {aiError && <div style={{ padding: '10px 14px', borderRadius: 10, background: `${RED}12`, color: RED, fontSize: 13 }}>{aiError}</div>}
                  {!aiData && !aiLoading && !aiError && !aiProGate && <div style={{ padding: '24px 0', textAlign: 'center', color: subColor, fontSize: 13 }}>{t('ai_empty_trade')}</div>}
                  {aiLoading && <div style={{ padding: '24px 0', textAlign: 'center', color: subColor, fontSize: 13 }}>{t('ai_loading_trade')}</div>}
                  {aiData && (
                    <div>
                      {[
                        { label: t('ai_entry_quality'),     value: aiData.entry_quality,     color: GREEN  },
                        { label: t('ai_errors'),            value: aiData.errors,            color: RED    },
                        { label: t('ai_system_compliance'), value: aiData.system_compliance, color: BLUE   },
                        { label: t('ai_verdict'),           value: aiData.verdict,           color: ORANGE },
                        { label: t('ai_recommendation'),    value: aiData.recommendation,    color: PURPLE },
                      ].map((s, i) => (
                        <div key={s.label}>
                          {i > 0 && <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '10px 0' }} />}
                          <div style={{ fontSize: 11, fontWeight: 700, color: s.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                          <div style={{ fontSize: 13, color: textColor, lineHeight: 1.6 }}>{s.value}</div>
                        </div>
                      ))}
                      {aiData.ai_grade && (
                        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, color: subColor }}>{t('ai_grade')}</span>
                          <Badge label={aiData.ai_grade} color={gradeColor(aiData.ai_grade)} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .trade-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .trade-fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 768px) {
          .trade-detail-grid { grid-template-columns: 1fr; }
          .trade-fields-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}
