'use client'

import { useState, useEffect, useRef } from 'react'
import { useLocale } from '@/hooks/useLocale'
import { createClient } from '@/lib/supabase/client'
import NavBar from '@/components/layout/NavBar'
import { DARK, LIGHT } from '@/lib/colors'

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

function Dot({ color }: { color: string }) {
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 8 }} />
}

function Section({ title, color, children, textColor }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center' }}>
        <Dot color={color} />{title}
      </div>
      <div style={{ fontSize: 14, color: textColor, lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}

function ProGate({ dark, purple, blue }: { dark: boolean; purple: string; blue: string }) {
  const textColor = dark ? DARK.text : LIGHT.text
  const subColor  = dark ? DARK.sub  : LIGHT.sub
  return (
    <div style={{
      padding: '28px 20px', textAlign: 'center',
      background: dark ? `linear-gradient(135deg, ${purple}15, ${blue}10)` : `linear-gradient(135deg, ${purple}10, ${blue}08)`,
      borderRadius: 14, border: `1px solid ${purple}30`,
    }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>⚡</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: textColor, marginBottom: 8 }}>Pro Feature</div>
      <div style={{ fontSize: 13, color: subColor, marginBottom: 20, lineHeight: 1.6 }}>AI analysis is available on Pro plan only.</div>
      <a href="/billing" style={{ display: 'inline-block', background: purple, color: '#fff', borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
        Upgrade to Pro →
      </a>
    </div>
  )
}

function HistoryItem({ session, onLoad, locale, dark }: { session: any; onLoad: (data: any, type: string) => void; locale: string; dark: boolean }) {
  const textColor   = dark ? DARK.text   : LIGHT.text
  const subColor    = dark ? DARK.sub    : LIGHT.sub
  const borderColor = dark ? DARK.border : LIGHT.border
  const BLUE   = dark ? DARK.blue   : LIGHT.blue
  const PURPLE = dark ? DARK.purple : LIGHT.purple
  const GREEN  = dark ? DARK.green  : LIGHT.green
  const date = new Date(session.created_at).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const typeLabel: Record<string, Record<string, string>> = {
    coach:      { uk: 'Аналіз журналу', en: 'Journal Analysis' },
    psychology: { uk: 'Психологія',     en: 'Psychology' },
    chat:       { uk: 'AI Чат',         en: 'AI Chat' },
  }
  const typeColor: Record<string, string> = { coach: BLUE, psychology: PURPLE, chat: GREEN }
  const label = typeLabel[session.type]?.[locale] || session.type

  const preview = session.type === 'chat'
    ? (() => { try { const msgs = JSON.parse(session.response); const first = msgs.find((m: any) => m.role === 'user'); return first?.content?.slice(0, 60) + '...' || '' } catch { return '' } })()
    : ''

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderRadius: 12,
      background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
      border: `1px solid ${borderColor}`,
      backdropFilter: 'blur(10px)',
      marginBottom: 8, flexWrap: 'wrap', gap: 8,
      boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Dot color={typeColor[session.type] || BLUE} />
          <span style={{ fontSize: 13, fontWeight: 600, color: textColor }}>{label}</span>
        </div>
        <div style={{ fontSize: 12, color: subColor, paddingLeft: 16 }}>{date}</div>
        {preview && <div style={{ fontSize: 11, color: subColor, paddingLeft: 16, marginTop: 2, fontStyle: 'italic' }}>{preview}</div>}
      </div>
      <button
        onClick={() => { try { onLoad(JSON.parse(session.response), session.type) } catch {} }}
        style={{
          padding: '6px 14px', borderRadius: 8,
          border: `1px solid ${borderColor}`,
          background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
          color: BLUE, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: FONT,
          backdropFilter: 'blur(10px)',
        }}
      >
        {locale === 'uk' ? 'Завантажити' : 'Load'}
      </button>
    </div>
  )
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function AIPage() {
  const dark = useDark()
  const { t: tr, locale } = useLocale()
  const chatEndRef = useRef<HTMLDivElement>(null)

  const GREEN  = dark ? DARK.green  : LIGHT.green
  const RED    = dark ? DARK.red    : LIGHT.red
  const BLUE   = dark ? DARK.blue   : LIGHT.blue
  const ORANGE = dark ? DARK.orange : LIGHT.orange
  const PURPLE = dark ? DARK.purple : LIGHT.purple

  const textColor   = dark ? DARK.text   : LIGHT.text
  const subColor    = dark ? DARK.sub    : LIGHT.sub
  const borderColor = dark ? DARK.border : LIGHT.border

  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

  const [coachData,    setCoachData]    = useState<any>(null)
  const [psychData,    setPsychData]    = useState<any>(null)
  const [coachLoading, setCoachLoading] = useState(false)
  const [psychLoading, setPsychLoading] = useState(false)
  const [coachError,   setCoachError]   = useState('')
  const [psychError,   setPsychError]   = useState('')
  const [coachPro,     setCoachPro]     = useState(false)
  const [psychPro,     setPsychPro]     = useState(false)
  const [history,      setHistory]      = useState<any[]>([])
  const [historyOpen,  setHistoryOpen]  = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput,    setChatInput]    = useState('')
  const [chatLoading,  setChatLoading]  = useState(false)
  const [chatPro,      setChatPro]      = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: sessions } = await supabase
        .from('ai_sessions')
        .select('*')
        .eq('user_id', user.id)
        .in('type', ['coach', 'psychology', 'chat'])
        .order('created_at', { ascending: false })
        .limit(20)
      setHistory(sessions || [])
    }
    load()
  }, [coachData, psychData, chatMessages])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  async function runCoach() {
    setCoachLoading(true); setCoachError(''); setCoachPro(false)
    try {
      const res  = await fetch('/api/ai/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale }) })
      const json = await res.json()
      if (json.success)                      setCoachData(json.data)
      else if (json.code === 'PRO_REQUIRED') setCoachPro(true)
      else                                   setCoachError(json.error || 'Error')
    } catch { setCoachError(tr('ai_net_error')) }
    setCoachLoading(false)
  }

  async function runPsych() {
    setPsychLoading(true); setPsychError(''); setPsychPro(false)
    try {
      const res  = await fetch('/api/ai/psychology', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale }) })
      const json = await res.json()
      if (json.success)                      setPsychData(json.data)
      else if (json.code === 'PRO_REQUIRED') setPsychPro(true)
      else                                   setPsychError(json.error || 'Error')
    } catch { setPsychError(tr('ai_net_error')) }
    setPsychLoading(false)
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput(''); setChatPro(false)
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: userMsg }]
    setChatMessages(newMessages); setChatLoading(true)
    try {
      const res  = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg, history: chatMessages, locale }) })
      const json = await res.json()
      if (json.success)                      setChatMessages([...newMessages, { role: 'assistant', content: json.data.answer }])
      else if (json.code === 'PRO_REQUIRED') { setChatPro(true); setChatMessages(chatMessages) }
      else                                   setChatMessages([...newMessages, { role: 'assistant', content: '⚠ ' + (json.error || 'Error') }])
    } catch { setChatMessages([...newMessages, { role: 'assistant', content: '⚠ Network error' }]) }
    setChatLoading(false)
  }

  function loadFromHistory(data: any, type: string) {
    if (type === 'coach')      setCoachData(data)
    if (type === 'psychology') setPsychData(data)
    if (type === 'chat')       setChatMessages(Array.isArray(data) ? data : [])
    setHistoryOpen(false)
  }

  function glassCard(): React.CSSProperties {
    return {
      background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderRadius: 20, padding: '20px',
      border: `1px solid ${borderColor}`,
      boxShadow: dark
        ? 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.02)'
        : 'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)',
      position: 'relative', overflow: 'hidden',
    }
  }

  const glare = (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: dark ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />
  )

  const runBtnStyle = (loading: boolean): React.CSSProperties => ({
    padding: '9px 20px', borderRadius: 12, border: 'none',
    cursor: loading ? 'default' : 'pointer',
    background: loading
      ? dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      : dark ? 'rgba(255,255,255,0.1)' : textColor,
    color: loading ? subColor : dark ? textColor : '#fff',
    fontFamily: FONT, fontSize: 13, fontWeight: 700,
    opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap' as const,
    backdropFilter: 'blur(10px)',
    boxShadow: loading ? 'none' : dark ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
    transition: 'all 0.15s',
  })

  const severityMap: Record<string, { label: string; color: string; bg: string }> = {
    high:     { label: tr('ai_high'),     color: RED,    bg: `${RED}18`    },
    critical: { label: tr('ai_high'),     color: RED,    bg: `${RED}18`    },
    medium:   { label: tr('ai_medium'),   color: ORANGE, bg: `${ORANGE}18` },
    low:      { label: tr('ai_low'),      color: GREEN,  bg: `${GREEN}18`  },
  }

  const historyLabel    = locale === 'uk' ? `Історія (${history.length})` : `History (${history.length})`
  const historyTitle    = locale === 'uk' ? 'Історія аналізів' : 'Analysis History'
  const chatTitle       = locale === 'uk' ? 'AI Чат' : 'AI Chat'
  const chatSubtitle    = locale === 'uk' ? 'Задавай питання — AI відповідає на основі твого журналу' : 'Ask questions — AI answers based on your journal'
  const chatEmpty       = locale === 'uk' ? 'Постав перше питання щоб почати розмову' : 'Ask your first question to start'
  const clearLabel      = locale === 'uk' ? 'Очистити' : 'Clear'
  const sendLabel       = locale === 'uk' ? 'Надіслати' : 'Send'
  const sendingLabel    = locale === 'uk' ? 'Відповідає...' : 'Thinking...'
  const chatPlaceholder = locale === 'uk' ? 'Запитай про свій журнал...' : 'Ask about your journal...'

  const suggestions = locale === 'uk'
    ? ['Який мій кращий сетап?', 'Чому я втрачаю на Short?', 'Оціни мою дисципліну', 'Що покращити?']
    : ['What is my best setup?', 'Why do I lose on Shorts?', 'Rate my discipline', 'What to improve?']

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: dark ? DARK.bg : LIGHT.bg }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: noiseSvg, opacity: dark ? 0.35 : 0.15 }} />
      <div style={{ position: 'fixed', top: -200, left: '30%', width: 600, height: 600, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(191,90,242,0.07) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(191,90,242,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -200, right: '10%', width: 500, height: 500, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(10,132,255,0.05) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(10,132,255,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: textColor, letterSpacing: '-0.04em' }}>{tr('ai_title')}</div>
              <div style={{ fontSize: 13, color: subColor, marginTop: 2 }}>{tr('ai_subtitle')}</div>
            </div>
            {history.length > 0 && (
              <button onClick={() => setHistoryOpen(v => !v)} style={{
                padding: '9px 18px', borderRadius: 12,
                background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                border: `1px solid ${borderColor}`,
                color: textColor, fontFamily: FONT, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', backdropFilter: 'blur(10px)',
                boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
              }}>
                {historyLabel}
              </button>
            )}
          </div>

          {/* History */}
          {historyOpen && history.length > 0 && (
            <div style={{ ...glassCard(), marginBottom: 20 }}>
              {glare}
              <div style={{ fontSize: 15, fontWeight: 700, color: textColor, marginBottom: 16, position: 'relative' }}>{historyTitle}</div>
              <div style={{ position: 'relative' }}>
                {history.map(s => (
                  <HistoryItem key={s.id} session={s} onLoad={loadFromHistory} locale={locale} dark={dark} />
                ))}
              </div>
            </div>
          )}

          {/* Coach + Psychology grid */}
          <div className="ai-grid" style={{ marginBottom: 20 }}>

            {/* AI Coach */}
            <div style={glassCard()}>
              {glare}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8, position: 'relative' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: textColor, display: 'flex', alignItems: 'center' }}>
                    <Dot color={BLUE} />{tr('ai_journal')}
                  </div>
                  <div style={{ fontSize: 12, color: subColor, marginTop: 3, paddingLeft: 16 }}>{tr('ai_journal_sub')}</div>
                </div>
                <button onClick={runCoach} disabled={coachLoading} style={runBtnStyle(coachLoading)}>
                  {coachLoading ? tr('ai_running') : tr('ai_run')}
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                {coachPro  && <ProGate dark={dark} purple={PURPLE} blue={BLUE} />}
                {coachError && <div style={{ padding: '12px 16px', borderRadius: 12, background: `${RED}12`, color: RED, fontSize: 13, marginBottom: 16 }}>{coachError}</div>}
                {!coachData && !coachLoading && !coachError && !coachPro && <div style={{ padding: '40px 0', textAlign: 'center', color: subColor, fontSize: 13 }}>{tr('ai_empty_coach')}</div>}
                {coachLoading && <div style={{ padding: '40px 0', textAlign: 'center', color: subColor, fontSize: 13 }}>{tr('ai_loading_coach')}</div>}
                {coachData && (
                  <div>
                    <Section title={tr('ai_main_error')}  color={RED}    textColor={textColor}>{coachData.main_error}</Section>
                    <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '12px 0' }} />
                    <Section title={tr('ai_best_setup')}  color={GREEN}  textColor={textColor}>{coachData.best_setup}</Section>
                    <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '12px 0' }} />
                    <Section title={tr('ai_worst_setup')} color={ORANGE} textColor={textColor}>{coachData.worst_setup}</Section>
                    <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '12px 0' }} />
                    <Section title={tr('ai_discipline')}  color={PURPLE} textColor={textColor}>{coachData.discipline}</Section>
                    <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '12px 0' }} />
                    <Section title={tr('ai_risk')}        color={BLUE}   textColor={textColor}>{coachData.risk_management}</Section>
                    {coachData.action_steps?.length > 0 && (
                      <>
                        <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '12px 0' }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: subColor, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{tr('ai_steps')}</div>
                        {coachData.action_steps.map((step: string, i: number) => (
                          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                            <div style={{ width: 22, height: 22, borderRadius: 7, background: `${BLUE}18`, color: BLUE, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                            <div style={{ fontSize: 14, color: textColor, lineHeight: 1.6 }}>{step}</div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Psychology */}
            <div style={glassCard()}>
              {glare}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8, position: 'relative' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: textColor, display: 'flex', alignItems: 'center' }}>
                    <Dot color={PURPLE} />{tr('ai_psych')}
                  </div>
                  <div style={{ fontSize: 12, color: subColor, marginTop: 3, paddingLeft: 16 }}>{tr('ai_psych_sub')}</div>
                </div>
                <button onClick={runPsych} disabled={psychLoading} style={runBtnStyle(psychLoading)}>
                  {psychLoading ? tr('ai_running') : tr('ai_run')}
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                {psychPro  && <ProGate dark={dark} purple={PURPLE} blue={BLUE} />}
                {psychError && <div style={{ padding: '12px 16px', borderRadius: 12, background: `${RED}12`, color: RED, fontSize: 13, marginBottom: 16 }}>{psychError}</div>}
                {!psychData && !psychLoading && !psychError && !psychPro && <div style={{ padding: '40px 0', textAlign: 'center', color: subColor, fontSize: 13 }}>{tr('ai_empty_psych')}</div>}
                {psychLoading && <div style={{ padding: '40px 0', textAlign: 'center', color: subColor, fontSize: 13 }}>{tr('ai_loading_psych')}</div>}
                {psychData && (
                  <div>
                    <Section title={tr('ai_portrait')} color={PURPLE} textColor={textColor}>{psychData.summary}</Section>
                    <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '12px 0' }} />
                    <div style={{ padding: '12px 16px', borderRadius: 12, background: `${RED}10`, marginBottom: 16, border: `1px solid ${RED}20` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: RED, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{tr('ai_top_risk')}</div>
                      <div style={{ fontSize: 14, color: textColor, lineHeight: 1.6 }}>{psychData.top_risk}</div>
                    </div>
                    {psychData.patterns?.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: subColor, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>{tr('ai_patterns')}</div>
                        {psychData.patterns.map((p: any, i: number) => {
                          const s = severityMap[p.severity] || severityMap.medium
                          return (
                            <div key={i} style={{
                              background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
                              border: `1px solid ${borderColor}`, borderRadius: 12,
                              padding: '14px 16px', marginBottom: 10,
                              backdropFilter: 'blur(10px)',
                              boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{p.pattern}</div>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>
                              </div>
                              <div style={{ fontSize: 13, color: subColor, lineHeight: 1.6, marginBottom: 8 }}>{p.evidence}</div>
                              <div style={{ fontSize: 13, color: GREEN, lineHeight: 1.6 }}>→ {p.action}</div>
                            </div>
                          )
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Chat */}
          <div style={glassCard()}>
            {glare}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8, position: 'relative' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: textColor, display: 'flex', alignItems: 'center' }}>
                  <Dot color={GREEN} />{chatTitle}
                </div>
                <div style={{ fontSize: 12, color: subColor, marginTop: 3, paddingLeft: 16 }}>{chatSubtitle}</div>
              </div>
              {chatMessages.length > 0 && (
                <button onClick={() => setChatMessages([])} style={{
                  padding: '7px 14px', borderRadius: 10,
                  background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                  border: `1px solid ${borderColor}`,
                  color: subColor, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: FONT, backdropFilter: 'blur(10px)',
                }}>
                  {clearLabel}
                </button>
              )}
            </div>

            {chatPro && <ProGate dark={dark} purple={PURPLE} blue={BLUE} />}

            {!chatPro && (
              <>
                <div style={{ minHeight: 160, maxHeight: 360, overflowY: 'auto', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                  {chatMessages.length === 0 && (
                    <div style={{ padding: '24px 0', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: subColor, marginBottom: 14 }}>{chatEmpty}</div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {suggestions.map(s => (
                          <button key={s} onClick={() => setChatInput(s)} style={{
                            padding: '7px 14px', borderRadius: 20,
                            background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                            border: `1px solid ${borderColor}`,
                            color: subColor, fontSize: 12,
                            cursor: 'pointer', fontFamily: FONT,
                            backdropFilter: 'blur(10px)',
                            boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.8)',
                          }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '85%', padding: '12px 16px',
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: msg.role === 'user'
                          ? dark ? 'rgba(255,255,255,0.12)' : textColor
                          : dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                        color: msg.role === 'user' ? (dark ? textColor : '#fff') : textColor,
                        fontSize: 14, lineHeight: 1.6,
                        border: msg.role === 'assistant' ? `1px solid ${borderColor}` : 'none',
                        backdropFilter: msg.role === 'assistant' ? 'blur(10px)' : 'none',
                        boxShadow: msg.role === 'assistant'
                          ? dark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.9)'
                          : 'none',
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={{
                        padding: '12px 16px', borderRadius: '18px 18px 18px 4px',
                        background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                        border: `1px solid ${borderColor}`, backdropFilter: 'blur(10px)',
                        fontSize: 13, color: subColor,
                      }}>
                        {sendingLabel}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                    placeholder={chatPlaceholder}
                    style={{
                      flex: 1, padding: '12px 16px', borderRadius: 12,
                      border: `1px solid ${borderColor}`,
                      background: dark ? DARK.inputBg : LIGHT.inputBg,
                      color: textColor, fontSize: 14, outline: 'none', fontFamily: FONT,
                      backdropFilter: 'blur(10px)',
                      boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
                    }}
                  />
                  <button
                    onClick={sendChat}
                    disabled={chatLoading || !chatInput.trim()}
                    style={{
                      padding: '12px 20px', borderRadius: 12, border: 'none',
                      background: chatLoading || !chatInput.trim()
                        ? dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                        : GREEN,
                      color: chatLoading || !chatInput.trim() ? subColor : '#000',
                      fontSize: 14, fontWeight: 700,
                      cursor: chatLoading || !chatInput.trim() ? 'default' : 'pointer',
                      fontFamily: FONT, whiteSpace: 'nowrap' as const,
                      boxShadow: chatLoading || !chatInput.trim() ? 'none' : `0 0 20px ${GREEN}44`,
                      transition: 'all 0.15s',
                    }}
                  >
                    {chatLoading ? '...' : sendLabel}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .ai-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
