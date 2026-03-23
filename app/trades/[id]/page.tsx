// /app/trades/[id]/page.tsx

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
  const { t, locale } = useLocale()
  const router = useRouter()

  const [trade,        setTrade]        = useState<Trade | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [commentEdit,  setCommentEdit]  = useState('')
  const [savingComment,setSavingComment]= useState(false)

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

  useEffect(() => {
    const load = async () => {
      const { id } = await params
      const res  = await fetch(`/api/trades/${id}`)
      const json = await res.json()
      if (!json.success) { setLoading(false); return }
      setTrade(json.data)
      setCommentEdit(json.data.post_comment || '')

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

  const saveComment = async () => {
    if (!trade) return
    setSavingComment(true)

    const supabase = createClient()
    await supabase
      .from('trades')
      .update({ post_comment: commentEdit })
      .eq('id', trade.id)

    setSavingComment(false)
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

        <div className="trade-detail-grid">

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>Trade Details</div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 12 }}>Post Trade Comment</div>

              <textarea
                value={commentEdit}
                onChange={(e) => setCommentEdit(e.target.value)}
                placeholder="Write your conclusions after the trade..."
                style={{
                  width: '100%',
                  minHeight: 120,
                  borderRadius: 12,
                  border: `1px solid ${c.border}`,
                  padding: '12px 14px',
                  background: c.surface2,
                  color: c.text,
                  fontFamily: FONT,
                  fontSize: 13,
                  resize: 'vertical'
                }}
              />

              <button
                onClick={saveComment}
                disabled={savingComment}
                style={{ ...btnStyle(BLUE, '#fff', savingComment), marginTop: 10 }}
              >
                {savingComment ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
