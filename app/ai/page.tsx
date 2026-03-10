'use client'

import { useState } from 'react'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useLocale } from '@/hooks/useLocale'
import NavBar from '@/components/layout/NavBar'

const FONT = "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', sans-serif"

function th(dark: boolean) {
  return {
    bg:       dark ? '#0a0a0b' : '#f2f2f7',
    surface:  dark ? '#1c1c1e' : '#ffffff',
    surface2: dark ? '#2c2c2e' : '#f2f2f7',
    border:   dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    text:     dark ? '#f5f5f7' : '#1c1c1e',
    sub:      '#8e8e93',
    shadow:   dark
      ? '0 1px 3px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.06)'
      : '0 1px 3px rgba(0,0,0,0.07),0 0 0 1px rgba(0,0,0,0.05)',
  }
}

const GREEN  = '#30d158'
const RED    = '#ff453a'
const BLUE   = '#0a84ff'
const ORANGE = '#ff9f0a'
const PURPLE = '#bf5af2'

function card(t: ReturnType<typeof th>): React.CSSProperties {
  return { background: t.surface, borderRadius: 18, padding: '24px 26px', boxShadow: t.shadow, border: `1px solid ${t.border}` }
}

function Dot({ color }: { color: string }) {
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 8 }} />
}

function Section({ title, color, children, t }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center' }}>
        <Dot color={color} />{title}
      </div>
      <div style={{ fontSize: 14, color: t.text, lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}

export default function AIPage() {
  const { dark } = useTheme()
  const t = th(dark)
  const { t: tr } = useLocale()

  const [coachData,    setCoachData]    = useState<any>(null)
  const [psychData,    setPsychData]    = useState<any>(null)
  const [coachLoading, setCoachLoading] = useState(false)
  const [psychLoading, setPsychLoading] = useState(false)
  const [coachError,   setCoachError]   = useState('')
  const [psychError,   setPsychError]   = useState('')

  async function runCoach() {
    setCoachLoading(true); setCoachError('')
    try {
      const res  = await fetch('/api/ai/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const json = await res.json()
      if (json.success) setCoachData(json.data)
      else setCoachError(json.error || 'Error')
    } catch { setCoachError(tr('ai_net_error')) }
    setCoachLoading(false)
  }

  async function runPsych() {
    setPsychLoading(true); setPsychError('')
    try {
      const res  = await fetch('/api/ai/psychology', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const json = await res.json()
      if (json.success) setPsychData(json.data)
      else setPsychError(json.error || 'Error')
    } catch { setPsychError(tr('ai_net_error')) }
    setPsychLoading(false)
  }

  const severityMap: Record<string, { label: string; color: string; bg: string }> = {
    high:   { label: tr('ai_high'),   color: RED,    bg: `${RED}18`    },
    medium: { label: tr('ai_medium'), color: ORANGE, bg: `${ORANGE}18` },
    low:    { label: tr('ai_low'),    color: GREEN,  bg: `${GREEN}18`  },
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: FONT, transition: 'background 0.3s' }}>
      <NavBar />
      <div style={{ padding: '32px 40px' }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.04em' }}>{tr('ai_title')}</div>
          <div style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>{tr('ai_subtitle')}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* AI Coach */}
          <div style={card(t)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: t.text, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center' }}>
                  <Dot color={BLUE} />{tr('ai_journal')}
                </div>
                <div style={{ fontSize: 12, color: t.sub, marginTop: 3, paddingLeft: 16 }}>{tr('ai_journal_sub')}</div>
              </div>
              <button onClick={runCoach} disabled={coachLoading} style={{
                padding: '9px 20px', borderRadius: 12, border: 'none', cursor: coachLoading ? 'default' : 'pointer',
                background: coachLoading ? t.surface2 : t.text, color: coachLoading ? t.sub : t.bg,
                fontFamily: FONT, fontSize: 13, fontWeight: 700, transition: 'all 0.2s', opacity: coachLoading ? 0.7 : 1,
              }}>
                {coachLoading ? tr('ai_running') : tr('ai_run')}
              </button>
            </div>

            {coachError && <div style={{ padding: '12px 16px', borderRadius: 12, background: `${RED}12`, color: RED, fontSize: 13, marginBottom: 16 }}>{coachError}</div>}
            {!coachData && !coachLoading && !coachError && <div style={{ padding: '40px 0', textAlign: 'center', color: t.sub, fontSize: 13 }}>{tr('ai_empty_coach')}</div>}
            {coachLoading && <div style={{ padding: '40px 0', textAlign: 'center', color: t.sub, fontSize: 13 }}>{tr('ai_loading_coach')}</div>}

            {coachData && (
              <div>
                <Section title={tr('ai_main_error')}  color={RED}    t={t}>{coachData.main_error}</Section>
                <div style={{ height: 1, background: t.border, margin: '12px 0' }} />
                <Section title={tr('ai_best_setup')}  color={GREEN}  t={t}>{coachData.best_setup}</Section>
                <div style={{ height: 1, background: t.border, margin: '12px 0' }} />
                <Section title={tr('ai_worst_setup')} color={ORANGE} t={t}>{coachData.worst_setup}</Section>
                <div style={{ height: 1, background: t.border, margin: '12px 0' }} />
                <Section title={tr('ai_discipline')}  color={PURPLE} t={t}>{coachData.discipline}</Section>
                <div style={{ height: 1, background: t.border, margin: '12px 0' }} />
                <Section title={tr('ai_risk')}        color={BLUE}   t={t}>{coachData.risk_management}</Section>
                {coachData.action_steps?.length > 0 && (
                  <>
                    <div style={{ height: 1, background: t.border, margin: '12px 0' }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: t.sub, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{tr('ai_steps')}</div>
                    {coachData.action_steps.map((step: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                        <div style={{ width: 22, height: 22, borderRadius: 7, background: `${BLUE}18`, color: BLUE, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ fontSize: 14, color: t.text, lineHeight: 1.6 }}>{step}</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Psychology */}
          <div style={card(t)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: t.text, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center' }}>
                  <Dot color={PURPLE} />{tr('ai_psych')}
                </div>
                <div style={{ fontSize: 12, color: t.sub, marginTop: 3, paddingLeft: 16 }}>{tr('ai_psych_sub')}</div>
              </div>
              <button onClick={runPsych} disabled={psychLoading} style={{
                padding: '9px 20px', borderRadius: 12, border: 'none', cursor: psychLoading ? 'default' : 'pointer',
                background: psychLoading ? t.surface2 : t.text, color: psychLoading ? t.sub : t.bg,
                fontFamily: FONT, fontSize: 13, fontWeight: 700, transition: 'all 0.2s', opacity: psychLoading ? 0.7 : 1,
              }}>
                {psychLoading ? tr('ai_running') : tr('ai_run')}
              </button>
            </div>

            {psychError && <div style={{ padding: '12px 16px', borderRadius: 12, background: `${RED}12`, color: RED, fontSize: 13, marginBottom: 16 }}>{psychError}</div>}
            {!psychData && !psychLoading && !psychError && <div style={{ padding: '40px 0', textAlign: 'center', color: t.sub, fontSize: 13 }}>{tr('ai_empty_psych')}</div>}
            {psychLoading && <div style={{ padding: '40px 0', textAlign: 'center', color: t.sub, fontSize: 13 }}>{tr('ai_loading_psych')}</div>}

            {psychData && (
              <div>
                <Section title={tr('ai_portrait')} color={PURPLE} t={t}>{psychData.summary}</Section>
                <div style={{ height: 1, background: t.border, margin: '12px 0' }} />
                <div style={{ padding: '12px 16px', borderRadius: 12, background: `${RED}10`, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: RED, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{tr('ai_top_risk')}</div>
                  <div style={{ fontSize: 14, color: t.text, lineHeight: 1.6 }}>{psychData.top_risk}</div>
                </div>
                {psychData.patterns?.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: t.sub, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>{tr('ai_patterns')}</div>
                    {psychData.patterns.map((p: any, i: number) => {
                      const s = severityMap[p.severity] || severityMap.medium
                      return (
                        <div key={i} style={{ border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{p.pattern}</div>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>
                          </div>
                          <div style={{ fontSize: 13, color: t.sub, lineHeight: 1.6, marginBottom: 8 }}>{p.evidence}</div>
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
    </div>
  )
}