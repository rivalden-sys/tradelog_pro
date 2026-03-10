'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
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

export default function TradeDetailPage() {
  const { theme: c } = useTheme()
  const router = useRouter()
  const params = useParams()
  const [trade, setTrade]       = useState<Trade | null>(null)
  const [loading, setLoading]   = useState(true)
  const [aiResult, setAiResult] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    fetchTrade()
  }, [])

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
      <div style={{ textAlign: 'center', padding: '64px', color: c.text3 }}>Загрузка...</div>
    </div>
  )

  if (!trade) return (
    <div style={{ background: c.bg, minHeight: '100vh' }}>
      <NavBar />
      <div style={{ textAlign: 'center', padding: '64px', color: c.text3 }}>Сделка не найдена</div>
    </div>
  )

  return (
    <div style={{ background: c.bg, minHeight: '100vh' }}>
      <NavBar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        <button onClick={() => router.back()} style={{
          background: 'transparent', border: 'none', color: c.text3,
          fontSize: 14, cursor: 'pointer', marginBottom: 20,
        }}>← Назад к журналу</button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div style={{
            background: c.surface, borderRadius: 18, padding: '22px',
            border: `1px solid ${c.border}`, boxShadow: c.shadow,
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.text, marginBottom: 18 }}>
              {trade.pair} · {trade.date}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                ['Сетап', trade.setup],
                ['RR', trade.rr],
                ['Направление', trade.direction],
                ['Результат', trade.result],
                ['P&L $', `${trade.profit_usd >= 0 ? '+' : ''}${trade.profit_usd}$`],
                ['P&L %', `${trade.profit_pct >= 0 ? '+' : ''}${trade.profit_pct}%`],
                ['Самооценка', trade.self_grade || '—'],
                ['Trade Score', trade.trade_score ? `${trade.trade_score}%` : '—'],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <div style={{ fontSize: 11, color: c.text3, marginBottom: 3 }}>{label}</div>
                  <div style={{
                    fontSize: 14, fontWeight: 500,
                    color: label === 'P&L $' || label === 'P&L %'
                      ? (String(val).startsWith('+') ? '#30d158' : '#ff453a')
                      : label === 'Результат' ? resultColor(String(val))
                      : label === 'Самооценка' && trade.self_grade ? gradeColor(trade.self_grade)
                      : c.text,
                  }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: c.surface, borderRadius: 18, padding: '22px',
            border: `1px solid ${c.border}`, boxShadow: c.shadow,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 10 }}>
              Комментарий
            </div>
            <p style={{ fontSize: 14, color: c.text2, lineHeight: 1.6, margin: 0 }}>
              {trade.comment || 'Комментарий не добавлен'}
            </p>
            {trade.tradingview_url && (
              <a href={trade.tradingview_url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 14, fontSize: 13, color: '#0a84ff' }}>
                📊 Открыть в TradingView →
              </a>
            )}
          </div>
        </div>

        <div style={{
          background: c.surface, borderRadius: 18, padding: '22px',
          border: `1px solid ${c.border}`, boxShadow: c.shadow,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>🤖 AI Анализ сделки</div>
            {!aiResult && (
              <button onClick={runAI} disabled={aiLoading} style={{
                background: c.text, color: c.surface, border: 'none',
                borderRadius: 12, padding: '10px 18px', fontSize: 14,
                fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer',
                opacity: aiLoading ? 0.5 : 1,
              }}>
                {aiLoading ? 'Анализирую...' : 'Запустить анализ'}
              </button>
            )}
          </div>

          {aiLoading && (
            <div style={{ textAlign: 'center', padding: '32px', color: c.text3 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              GPT-4o анализирует сделку...
            </div>
          )}

          {aiResult && (
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                ['✅ Что сделано правильно', aiResult.entry_quality, '#30d158'],
                ['⚠️ Ошибки', aiResult.errors, '#ff9f0a'],
                ['📋 Соответствие системе', aiResult.system_compliance, '#0a84ff'],
                ['💡 Рекомендация', aiResult.recommendation, c.text3],
              ].map(([title, text, color]) => (
                <div key={title as string} style={{
                  padding: '14px 16px', borderRadius: 12,
                  background: (color as string) + '12',
                  borderLeft: `3px solid ${color}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: color as string, marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 13, color: c.text2, lineHeight: 1.6 }}>{text}</div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                <span style={{ color: c.text3, fontSize: 13 }}>Оценка AI:</span>
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
              Нажмите кнопку чтобы получить AI анализ этой сделки
            </div>
          )}
        </div>
      </div>
    </div>
  )
}