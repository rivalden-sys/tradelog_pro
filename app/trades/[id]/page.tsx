'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useLocale } from '@/hooks/useLocale'
import { createClient } from '@/lib/supabase/client'
import NavBar from '@/components/layout/NavBar'
import { Trade } from '@/types'

const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"

const GREEN  = '#30d158'
const RED    = '#ff453a'
const BLUE   = '#0a84ff'
const ORANGE = '#ff9f0a'
const PURPLE = '#bf5af2'

function resultColor(r: string) {
  if (r === 'Тейк') return GREEN
  if (r === 'Стоп') return RED
  return '#8e8e93'
}

function gradeColor(g: string) {
  if (g === 'A') return GREEN
  if (g === 'B') return BLUE
  if (g === 'C') return ORANGE
  return RED
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ background: color + '22', color, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
      {label}
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? GREEN : score >= 40 ? ORANGE : RED
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#8e8e93' }}>Probability of success</span>
        <span style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: '-0.03em' }}>{score}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(128,128,128,0.15)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

function ProGate({ feature }: { feature: string }) {
  return (
    <div style={{
      padding: '28px 20px', textAlign: 'center',
      background: `linear-gradient(135deg, ${PURPLE}12, ${BLUE}12)`,
      borderRadius: 14, border: `1px solid ${PURPLE}30`,
    }}>
      <div style={{ fontSize: 24, marginBottom: 10 }}>⚡</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#f5f5f7', marginBottom: 6 }}>Pro Feature</div>
      <div style={{ fontSize: 13, color: '#8e8e93', marginBottom: 18, lineHeight: 1.6 }}>
        {feature} is available on Pro plan only.
      </div>
      <a href="/billing" style={{ display: 'inline-block', background: PURPLE, color: '#fff', borderRadius: 10, padding: '9px 22px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
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
    }}>
      {d}
    </button>
  )
}

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { theme: c } = useTheme()
  const { locale } = useLocale()
  const router = useRouter()

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
  const [factSaving, setFactSaving] = useState(false)
  const [factForm, setFactForm] = useState({
    actual_result: '',
    actual_profit_usd: '',
    actual_profit_pct: '',
    post_comment: '',
  })

  useEffect(() => {
    const load = async () => {
      const { id } = await params
      const res  = await fetch(`/api/trades/${id}`)
      const json = await res.json()
      if (!json.success) { setLoading(false); return }
      setTrade(json.data)
      setFactForm({
        actual_result: json.data.actual_result || json.data.result || '',
        actual_profit_usd: json.data.actual_profit_usd != null ? String(json.data.actual_profit_usd) : '',
        actual_profit_pct: json.data.actual_profit_pct != null ? String(json.data.actual_profit_pct) : '',
        post_comment: json.data.post_comment || json.data.comment || '',
      })

      const supabase = createClient()
      const { data: sessions } = await supabase
        .from('ai_sessions')
        .select('*')
        .eq('trade_id', id)
        .in('type', ['trade_review', 'trade_score'])
        .order('created_at', { ascending: false })
        .limit(10)

      if (sessions) {
        const reviews = sessions.filter(s => s.type === 'trade_review')
        const scores  = sessions.filter(s => s.type === 'trade_score')
        setAiHistory(reviews)
        setScoreHistory(scores)
        if (reviews.length > 0) { try { setAiData(JSON.parse(reviews[0].response)) } catch {} }
        if (scores.length > 0)  { try { setScoreData(JSON.parse(scores[0].response)) } catch {} }
      }

      setLoading(false)
    }
    load()
  }, [params])

  const runAIReview = async () => {
    if (!trade) return
    setAiLoading(true); setAiError(''); setAiProGate(false)
    try {
      const res  = await fetch('/api/ai/trade-review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trade, locale }),
      })
      const json = await res.json()
      if (json.success) {
        setAiData(json.data)
        setAiHistory(prev => [{ response: JSON.stringify(json.data), created_at: new Date().toISOString() }, ...prev])
      }
      else if (json.code === 'PRO_REQUIRED') setAiProGate(true)
      else setAiError(json.error || 'AI error')
    } catch { setAiError('Network error') }
    setAiLoading(false)
  }

  const runTradeScore = async () => {
    if (!trade) return
    setScoreLoading(true); setScoreError(''); setScoreProGate(false)
    try {
      const res  = await fetch('/api/ai/trade-score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trade, locale }),
      })
      const json = await res.json()
      if (json.success) {
        setScoreData(json.data)
        setScoreHistory(prev => [{ response: JSON.stringify(json.data), created_at: new Date().toISOString() }, ...prev])
      }
      else if (json.code === 'PRO_REQUIRED') setScoreProGate(true)
      else setScoreError(json.error || 'AI error')
    } catch { setScoreError('Network error') }
    setScoreLoading(false)
  }

  const saveFact = async () => {
    if (!trade) return
    setFactSaving(true)
    const payload: Record<string, any> = {
      post_comment: factForm.post_comment,
      comment: factForm.post_comment,
    }
    if (factForm.actual_result) payload.actual_result = factForm.actual_result
    if (factForm.actual_profit_usd !== '') payload.actual_profit_usd = parseFloat(factForm.actual_profit_usd)
    if (factForm.actual_profit_pct !== '') payload.actual_profit_pct = parseFloat(factForm.actual_profit_pct)
    if (factForm.actual_result) payload.result = factForm.actual_result
    if (factForm.actual_profit_usd !== '') payload.profit_usd = parseFloat(factForm.actual_profit_usd)
    if (factForm.actual_profit_pct !== '') payload.profit_pct = parseFloat(factForm.actual_profit_pct)

    const res = await fetch(`/api/trades/${trade.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.success) {
      setTrade(json.data)
    }
    setFactSaving(false)
  }

  if (loading) return (
    <div style={{ background: c.bg, minHeight: '100vh', fontFamily: FONT }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: c.text3 }}>Loading...</div>
    </div>
  )

  if (!trade) return (
    <div style={{ background: c.bg, minHeight: '100vh', fontFamily: FONT }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: c.text3 }}>Trade not found</div>
    </div>
  )

  const cardStyle = {
    background: c.surface, borderRadius: 18, padding: '20px',
    border: `1px solid ${c.border}`, boxShadow: c.shadow,
  }

  const btnStyle = (bg: string, color: string, disabled?: boolean): React.CSSProperties => ({
    padding: '9px 18px', borderRadius: 12, border: 'none',
    background: disabled ? c.surface2 : bg, color: disabled ? c.text3 : color,
    fontSize: 13, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
    fontFamily: FONT, opacity: disabled ? 0.7 : 1, transition: 'all 0.2s',
    boxShadow: disabled ? 'none' : `0 0 20px ${bg}44`,
    whiteSpace: 'nowrap' as const,
  })

  return (
    <div style={{ background: c.bg, minHeight: '100vh', fontFamily: FONT }}>
      <NavBar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <button onClick={() => router.back()} style={{
            background: 'transparent', border: `1px solid ${c.border}`,
            borderRadius: 10, padding: '8px 14px', color: c.text3,
            fontSize: 13, cursor: 'pointer', fontFamily: FONT,
          }}>← Back</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: c.text, letterSpacing: '-0.03em' }}>
              {trade.pair} <span style={{ color: trade.direction === 'Long' ? GREEN : RED }}>{trade.direction}</span>
            </div>
            <div style={{ fontSize: 13, color: c.text3, marginTop: 2 }}>{trade.date} · {trade.setup}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge label={trade.actual_result || trade.result || 'План'} color={resultColor(trade.actual_result || trade.result || '')} />
            {trade.self_grade && <Badge label={`Grade ${trade.self_grade}`} color={gradeColor(trade.self_grade)} />}
          </div>
        </div>

        {/* Content grid */}
        <div className="trade-detail-grid">

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>Trade Details</div>
              <div className="trade-fields-grid">
                {[
                  { label: 'Date',      value: trade.date },
                  { label: 'Pair',      value: trade.pair },
                  { label: 'Setup',     value: trade.setup },
                  { label: 'Direction', value: trade.direction, color: trade.direction === 'Long' ? GREEN : RED },
                  { label: 'Result',    value: trade.actual_result || trade.result || 'План', color: resultColor(trade.actual_result || trade.result || '') },
                  { label: 'Plan RR',   value: String(trade.planned_rr ?? trade.rr ?? '-') },
                  { label: 'Plan P&L $', value: trade.planned_profit_usd != null ? `+${trade.planned_profit_usd}$` : '-' },
                  { label: 'Plan P&L %', value: trade.planned_profit_pct != null ? `+${trade.planned_profit_pct}%` : '-' },
                  { label: 'Fact P&L $',     value: trade.actual_profit_usd != null ? `${trade.actual_profit_usd >= 0 ? '+' : ''}${trade.actual_profit_usd}$` : '-', color: (trade.actual_profit_usd ?? 0) >= 0 ? GREEN : RED },
                  { label: 'Fact P&L %',     value: trade.actual_profit_pct != null ? `${trade.actual_profit_pct >= 0 ? '+' : ''}${trade.actual_profit_pct}%` : '-', color: (trade.actual_profit_pct ?? 0) >= 0 ? GREEN : RED },
                ].map(f => (
                  <div key={f.label} style={{ background: c.surface2, borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: c.text3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: (f as any).color || c.text }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 12 }}>Пост-трейд факт</div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Тейк', 'Стоп', 'БУ'].map(r => (
                    <button
                      key={r}
                      onClick={() => setFactForm(prev => ({ ...prev, actual_result: r }))}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: `1px solid ${c.border}`,
                        background: factForm.actual_result === r ? c.text : c.surface2,
                        color: factForm.actual_result === r ? c.surface : c.text,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >{r}</button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input value={factForm.actual_profit_usd} onChange={e => setFactForm(prev => ({ ...prev, actual_profit_usd: e.target.value }))} placeholder="Fact P&L $" type="number" style={{ background: c.surface2, border: `1px solid ${c.border}`, borderRadius: 10, padding: '10px 12px', color: c.text }} />
                  <input value={factForm.actual_profit_pct} onChange={e => setFactForm(prev => ({ ...prev, actual_profit_pct: e.target.value }))} placeholder="Fact P&L %" type="number" style={{ background: c.surface2, border: `1px solid ${c.border}`, borderRadius: 10, padding: '10px 12px', color: c.text }} />
                </div>
                <textarea
                  value={factForm.post_comment}
                  onChange={e => setFactForm(prev => ({ ...prev, post_comment: e.target.value }))}
                  placeholder="Добавьте выводы после реализации сделки..."
                  rows={4}
                  style={{ background: c.surface2, border: `1px solid ${c.border}`, borderRadius: 10, padding: '10px 12px', color: c.text, resize: 'vertical' }}
                />
                <button
                  onClick={saveFact}
                  disabled={factSaving}
                  style={{ alignSelf: 'flex-start', border: 'none', borderRadius: 10, padding: '10px 16px', background: BLUE, color: '#fff', cursor: 'pointer', fontWeight: 700, opacity: factSaving ? 0.7 : 1 }}
                >
                  {factSaving ? 'Saving...' : 'Save fact'}
                </button>
              </div>
            </div>

            {trade.tradingview_url && (
              <div style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 12 }}>TradingView</div>
                <a href={trade.tradingview_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: BLUE, fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
                  Open chart →
                </a>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Trade Score */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>🎯 Trade Score</div>
                  <div style={{ fontSize: 12, color: c.text3, marginTop: 2 }}>AI probability based on your history</div>
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
                      {scoreLoading ? 'Analyzing...' : scoreData ? 'Re-run' : 'Get Score'}
                    </button>
                  )}
                </div>
              </div>

              {scoreProGate && <ProGate feature="Trade Score" />}
              {scoreError && <div style={{ padding: '10px 14px', borderRadius: 10, background: `${RED}12`, color: RED, fontSize: 13 }}>{scoreError}</div>}
              {!scoreData && !scoreLoading && !scoreError && !scoreProGate && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: c.text3, fontSize: 13 }}>Click "Get Score" to see AI probability</div>
              )}
              {scoreLoading && <div style={{ padding: '24px 0', textAlign: 'center', color: c.text3, fontSize: 13 }}>Analyzing your history...</div>}

              {scoreData && (
                <div>
                  <ScoreBar score={scoreData.score} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '16px 0' }}>
                    <div style={{ background: c.surface2, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Similar trades</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: c.text, marginTop: 4 }}>{scoreData.similar_trades}</div>
                    </div>
                    <div style={{ background: c.surface2, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Historical WR</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: scoreData.win_rate >= 50 ? GREEN : RED, marginTop: 4 }}>{scoreData.win_rate}%</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: c.text2, lineHeight: 1.6, marginBottom: 12 }}>{scoreData.explanation}</div>
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    background: scoreData.recommendation === 'enter' ? `${GREEN}18` : scoreData.recommendation === 'skip' ? `${RED}18` : `${ORANGE}18`,
                    color: scoreData.recommendation === 'enter' ? GREEN : scoreData.recommendation === 'skip' ? RED : ORANGE,
                  }}>
                    {scoreData.recommendation === 'enter' ? '✓ Enter the trade' : scoreData.recommendation === 'skip' ? '✗ Skip this trade' : '⚠ Reduce risk'}
                  </div>
                </div>
              )}
            </div>

            {/* AI Analysis */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>🧠 AI Analysis</div>
                  <div style={{ fontSize: 12, color: c.text3, marginTop: 2 }}>Detailed review of this trade</div>
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
                      {aiLoading ? 'Analyzing...' : aiData ? 'Re-analyze' : 'Analyze'}
                    </button>
                  )}
                </div>
              </div>

              {aiProGate && <ProGate feature="AI Analysis" />}
              {aiError && <div style={{ padding: '10px 14px', borderRadius: 10, background: `${RED}12`, color: RED, fontSize: 13 }}>{aiError}</div>}
              {!aiData && !aiLoading && !aiError && !aiProGate && (
                <div style={{ padding: '24px 0', textAlign: 'center', color: c.text3, fontSize: 13 }}>Click "Analyze" to get AI feedback on this trade</div>
              )}
              {aiLoading && <div style={{ padding: '24px 0', textAlign: 'center', color: c.text3, fontSize: 13 }}>AI is reviewing your trade...</div>}

              {aiData && (
                <div>
                  {[
                    { label: 'Entry Quality',     value: aiData.entry_quality,     color: GREEN  },
                    { label: 'Errors',            value: aiData.errors,            color: RED    },
                    { label: 'System Compliance', value: aiData.system_compliance, color: BLUE   },
                    { label: 'Verdict',           value: aiData.verdict,           color: ORANGE },
                    { label: 'Recommendation',    value: aiData.recommendation,    color: PURPLE },
                  ].map((s, i) => (
                    <div key={s.label}>
                      {i > 0 && <div style={{ height: 1, background: c.border, margin: '10px 0' }} />}
                      <div style={{ fontSize: 11, fontWeight: 700, color: s.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 13, color: c.text2, lineHeight: 1.6 }}>{s.value}</div>
                    </div>
                  ))}
                  {aiData.ai_grade && (
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: c.text3 }}>AI Grade:</span>
                      <Badge label={aiData.ai_grade} color={gradeColor(aiData.ai_grade)} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .trade-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .trade-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 768px) {
          .trade-detail-grid {
            grid-template-columns: 1fr;
          }
          .trade-fields-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  )
}
