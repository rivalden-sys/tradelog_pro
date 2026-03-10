'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useLocale } from '@/hooks/useLocale'
import NavBar from '@/components/layout/NavBar'
import { Trade } from '@/types'

function resultColor(r: string) {
  if (r === 'Тейк' || r === 'Take') return '#30d158'
  if (r === 'Стоп' || r === 'Stop') return '#ff453a'
  return '#8e8e93'
}

function gradeColor(g: string) {
  if (g === 'A') return '#30d158'
  if (g === 'B') return '#0a84ff'
  if (g === 'C') return '#ff9f0a'
  return '#ff453a'
}

export default function TradeDetailPage() {
  const { theme: c } = useTheme()
  const { t } = useLocale()
  const router = useRouter()
  const params = useParams()
  const [trade, setTrade]         = useState<Trade | null>(null)
  const [loading, setLoading]     = useState(true)
  const [aiResult, setAiResult]   = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { fetchTrade() }, [])

  const fetchTrade = async () => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id
    const res  = await fetch(`/api/trades/${id}`)
    const json = await res.json()
    if (json.success) setTrade(json.data)
    setLoading(false)
  }

  const runAI = async () => {
    if (!trade) return
    setAiLoading(true)
    const res  = await fetch('/api/ai/trade-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tradeId: trade.id }),
    })
    const json = await res.json()
    if (json.success) setAiResult(json.data)
    setAiLoading(false)
  }

  if (loading) return (
    <div style={{ background: c.bg, minHeight: '100vh' }}>
      <NavBar />
      <div style={{ textAlign: 'center', padding: '64px', color: c.text3 }}>{t('trade_detail_loading')}</div>
    </div>
  )

  if (!trade) return (
    <div style={{ background: c.bg, minHeight: '100vh' }}>
      <NavBar />
      <div style={{ textAlign: 'center', padding: '64px', color: c.text3 }}>{t('trade_detail_not_found')}</div>
    </div>
  )

  const resultLabel = (r: string) => {
    if (r === 'Тейк') return t('result_take')
    if (r === 'Стоп') return t('result_stop')
    if (r === 'БУ')   return t('result_bu')
    return r
  }

  const fields: [string, string | number][] = [
    [t('trade_detail_setup'),     trade.setup],
    [t('trade_detail_rr'),        trade.rr],
    [t('trade_detail_direction'), trade.direction],
    [t('trade_detail_result'),    resultLabel(trade.result)],
    [t('trade_detail_pnl_usd'),   `${trade.profit_usd >= 0 ? '+' : ''}${trade.profit_usd}$`],
    [t('trade_detail_pnl_pct'),   `${trade.profit_pct >= 0 ? '+' : ''}${trade.profit_pct}%`],
    [t('trade_detail_grade'),     trade.self_grade || '—'],
    [t('trade_detail_score'),     trade.trade_score ? `${trade.trade_score}%` : '—'],
  ]

  return (
    <div style={{ background: c.bg, minHeight: '100vh' }}>
      <NavBar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>

        <button onClick={() => router.back()} style={{
          background: 'transparent', border: 'none', color: c.text3,
          fontSize: 14, cursor: 'pointer', marginBottom: 20,
        }}>{t('trade_detail_back')}</button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

          {/* Trade info */}
          <div style={{
            background: c.surface, borderRadius: 18, padding: '22px',
            border: `1px solid ${c.border}`, boxShadow: c.shadow,
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.text, marginBottom: 18 }}>
              {trade.pair} · {trade.date}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {fields.map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: c.text3, marginBottom: 3 }}>{label}</div>
                  <div style={{
                    fontSize: 14, fontWeight: 500,
                    color: label === t('trade_detail_pnl_usd') || label === t('trade_detail_pnl_pct')
                      ? (String(val).startsWith('+') ? '#30d158' : '#ff453a')
                      : label === t('trade_detail_result') ? resultColor(String(val))
                      : label === t('trade_detail_grade') && trade.self_grade ? gradeColor(trade.self_grade)
                      : c.text,
                  }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div style={{
            background: c.surface, borderRadius: 18, padding: '22px',
            border: `1px solid ${c.border}`, boxShadow: c.shadow,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 10 }}>
              {t('trade_detail_comment')}
            </div>
            <p style={{ fontSize: 14, color: c.text2, lineHeight: 1.6, margin: 0 }}>
              {trade.comment || t('trade_detail_no_comment')}
            </p>
            {trade.tradingview_url && (
              <a href={trade.tradingview_url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 14, fontSize: 13, color: '#0a84ff' }}>
                {t('trade_detail_tv')}
              </a>
            )}
          </div>
        </div>

        {/* AI Analysis */}
        <div style={{
          background: c.surface, borderRadius: 18, padding: '22px',
          border: `1px solid ${c.border}`, boxShadow: c.shadow,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{t('trade_detail_ai_title')}</div>
            {!aiResult && (
              <button onClick={runAI} disabled={aiLoading} style={{
                background: c.text, color: c.surface, border: 'none',
                borderRadius: 12, padding: '10px 18px', fontSize: 14,
                fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer',
                opacity: aiLoading ? 0.5 : 1,
              }}>
                {aiLoading ? t('trade_detail_analyzing') : t('trade_detail_ai_run')}
              </button>
            )}
          </div>

          {aiLoading && (
            <div style={{ textAlign: 'center', padding: '32px', color: c.text3 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              {t('trade_detail_ai_wait')}
            </div>
          )}

          {aiResult && (
            <div style={{ display: 'grid', gap: 12 }}>
              {([
                [t('trade_detail_ai_good'),   aiResult.entry_quality,    '#30d158'],
                [t('trade_detail_ai_errors'), aiResult.errors,           '#ff9f0a'],
                [t('trade_detail_ai_system'), aiResult.system_compliance,'#0a84ff'],
                [t('trade_detail_ai_rec'),    aiResult.recommendation,   c.text3],
              ] as [string, string, string][]).map(([title, text, color]) => (
                <div key={title} style={{
                  padding: '14px 16px', borderRadius: 12,
                  background: color + '12',
                  borderLeft: `3px solid ${color}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 13, color: c.text2, lineHeight: 1.6 }}>{text}</div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                <span style={{ color: c.text3, fontSize: 13 }}>{t('trade_detail_ai_grade')}</span>
                <span style={{
                  background: gradeColor(aiResult.ai_grade) + '22',
                  color: gradeColor(aiResult.ai_grade),
                  padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                }}>{aiResult.ai_grade}</span>
              </div>
            </div>
          )}

          {!aiResult && !aiLoading && (
            <div style={{ textAlign: 'center', padding: '24px', color: c.text3, fontSize: 13 }}>
              {t('trade_detail_ai_hint')}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
