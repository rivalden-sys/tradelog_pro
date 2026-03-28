'use client'

import { useState, useEffect } from 'react'
import NavBar from '@/components/layout/NavBar'
import { createClient } from '@/lib/supabase/client'
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

const MOODS = [
  { value: 1, emoji: '😞', label: 'Погано' },
  { value: 2, emoji: '😕', label: 'Не дуже' },
  { value: 3, emoji: '😐', label: 'Нейтрально' },
  { value: 4, emoji: '🙂', label: 'Добре' },
  { value: 5, emoji: '😄', label: 'Відмінно' },
]

interface DailyNote {
  id?: string
  date: string
  mood: number
  content: string
  market: string
  plans: string
  mistakes: string
}

const emptyNote = (date: string): DailyNote => ({
  date, mood: 3, content: '', market: '', plans: '', mistakes: ''
})

export default function JournalPage() {
  const dark = useDark()

  const GREEN  = dark ? DARK.green  : LIGHT.green
  const RED    = dark ? DARK.red    : LIGHT.red
  const BLUE   = dark ? DARK.blue   : LIGHT.blue
  const ORANGE = dark ? DARK.orange : LIGHT.orange
  const PURPLE = dark ? DARK.purple : LIGHT.purple

  const textColor   = dark ? DARK.text   : LIGHT.text
  const subColor    = dark ? DARK.sub    : LIGHT.sub
  const borderColor = dark ? DARK.border : LIGHT.border

  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

  const today = new Date().toISOString().split('T')[0]

  const [selectedDate, setSelectedDate] = useState(today)
  const [note,         setNote]         = useState<DailyNote>(emptyNote(today))
  const [loading,      setLoading]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [history,      setHistory]      = useState<DailyNote[]>([])
  const [histLoading,  setHistLoading]  = useState(true)

  const loadNote = async (date: string) => {
    setLoading(true)
    setSaved(false)
    const supabase = createClient()
    const { data } = await supabase
      .from('daily_notes')
      .select('*')
      .eq('date', date)
      .single()
    setNote(data ? { ...data } : emptyNote(date))
    setLoading(false)
  }

  const loadHistory = async () => {
    setHistLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('daily_notes')
      .select('id, date, mood, content')
      .order('date', { ascending: false })
      .limit(30)
    setHistory(data || [])
    setHistLoading(false)
  }

  useEffect(() => {
    loadNote(today)
    loadHistory()
  }, [])

  const selectDate = (date: string) => {
    setSelectedDate(date)
    loadNote(date)
  }

  const save = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      user_id:  user.id,
      date:     selectedDate,
      mood:     note.mood,
      content:  note.content,
      market:   note.market,
      plans:    note.plans,
      mistakes: note.mistakes,
      updated_at: new Date().toISOString(),
    }

    if (note.id) {
      await supabase.from('daily_notes').update(payload).eq('id', note.id)
    } else {
      const { data } = await supabase.from('daily_notes').insert(payload).select().single()
      if (data) setNote(prev => ({ ...prev, id: data.id }))
    }

    setSaving(false)
    setSaved(true)
    loadHistory()
    setTimeout(() => setSaved(false), 2000)
  }

  const moodColor = (m: number) => {
    if (m >= 4) return GREEN
    if (m === 3) return ORANGE
    return RED
  }

  const glassCard = (accent?: string): React.CSSProperties => ({
    background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    borderRadius: 20, padding: '20px',
    border: `1px solid ${accent ? accent + '44' : borderColor}`,
    boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'inset 0 1px 0 rgba(255,255,255,0.95)',
    position: 'relative', overflow: 'hidden',
  })

  const glare = (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%', background: dark ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />
  )

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: `1px solid ${borderColor}`,
    background: dark ? DARK.inputBg : LIGHT.inputBg,
    color: textColor, fontSize: 14, fontFamily: FONT,
    outline: 'none', boxSizing: 'border-box',
    backdropFilter: 'blur(10px)',
    resize: 'vertical' as const,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: subColor, marginBottom: 8,
    display: 'block', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.04em',
  }

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    const isToday = d === today
    const isYesterday = d === new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const label = isToday ? 'Сьогодні' : isYesterday ? 'Вчора' : date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
    const weekday = date.toLocaleDateString('uk-UA', { weekday: 'long' })
    return { label, weekday }
  }

  const { label: dateLabel, weekday } = formatDate(selectedDate)

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: dark ? DARK.bg : LIGHT.bg }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: noiseSvg, opacity: dark ? 0.35 : 0.15 }} />
      <div style={{ position: 'fixed', top: -200, left: '30%', width: 600, height: 600, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(10,132,255,0.05) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(10,132,255,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar />
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: textColor, margin: 0, letterSpacing: '-0.04em' }}>
              📓 Daily Journal
            </h1>
            <div style={{ fontSize: 13, color: subColor, marginTop: 4 }}>
              Нотатки дня — навіть якщо угод не було
            </div>
          </div>

          <div className="journal-grid">

            {/* Left — editor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Date selector */}
              <div style={glassCard()}>
                {glare}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: textColor, letterSpacing: '-0.03em' }}>{dateLabel}</div>
                    <div style={{ fontSize: 13, color: subColor, textTransform: 'capitalize' }}>{weekday}</div>
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    max={today}
                    onChange={e => selectDate(e.target.value)}
                    style={{ ...inputStyle, width: 'auto', padding: '8px 12px', fontSize: 13 }}
                  />
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: subColor }}>Завантаження...</div>
              ) : (
                <>
                  {/* Mood */}
                  <div style={glassCard(moodColor(note.mood))}>
                    {glare}
                    <div style={{ fontSize: 14, fontWeight: 700, color: textColor, marginBottom: 14, position: 'relative' }}>
                      Настрій дня
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative' }}>
                      {MOODS.map(m => (
                        <button
                          key={m.value}
                          onClick={() => setNote(prev => ({ ...prev, mood: m.value }))}
                          style={{
                            flex: 1, minWidth: 60,
                            padding: '12px 8px', borderRadius: 12, border: 'none',
                            background: note.mood === m.value
                              ? moodColor(m.value) + '22'
                              : dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            cursor: 'pointer', fontFamily: FONT,
                            outline: note.mood === m.value ? `2px solid ${moodColor(m.value)}` : `1px solid ${borderColor}`,
                            transition: 'all 0.15s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          }}
                        >
                          <span style={{ fontSize: 24 }}>{m.emoji}</span>
                          <span style={{ fontSize: 11, color: note.mood === m.value ? moodColor(m.value) : subColor, fontWeight: 600 }}>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fields */}
                  <div style={glassCard()}>
                    {glare}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>

                      <div>
                        <label style={labelStyle}>📝 Загальні нотатки</label>
                        <textarea
                          value={note.content}
                          onChange={e => setNote(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Як пройшов день? Що відбувалось? Будь-які думки..."
                          rows={4}
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>📈 Що сталося на ринку</label>
                        <textarea
                          value={note.market}
                          onChange={e => setNote(prev => ({ ...prev, market: e.target.value }))}
                          placeholder="Ключові рухи, новини, контекст ринку..."
                          rows={3}
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>🎯 Плани на завтра</label>
                        <textarea
                          value={note.plans}
                          onChange={e => setNote(prev => ({ ...prev, plans: e.target.value }))}
                          placeholder="Які пари слідкувати? Які сетапи очікуєш?"
                          rows={3}
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>⚠️ Помилки та висновки</label>
                        <textarea
                          value={note.mistakes}
                          onChange={e => setNote(prev => ({ ...prev, mistakes: e.target.value }))}
                          placeholder="Що зробив не так? Що вивчив сьогодні?"
                          rows={3}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save button */}
                  <button onClick={save} disabled={saving} style={{
                    padding: '14px', borderRadius: 12, border: 'none',
                    background: saved
                      ? GREEN
                      : saving
                        ? dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                        : dark ? DARK.blue : 'linear-gradient(180deg, #0a7fd4 0%, #065fa0 100%)',
                    color: saving && !saved ? subColor : '#fff',
                    fontSize: 15, fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: FONT, transition: 'all 0.2s',
                    boxShadow: saving ? 'none' : `0 0 24px ${BLUE}44`,
                  }}>
                    {saved ? '✓ Збережено' : saving ? 'Збереження...' : '💾 Зберегти запис'}
                  </button>
                </>
              )}
            </div>

            {/* Right — history */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>Останні записи</div>

              {histLoading ? (
                <div style={{ color: subColor, fontSize: 13 }}>Завантаження...</div>
              ) : history.length === 0 ? (
                <div style={{ ...glassCard(), padding: '24px', textAlign: 'center' }}>
                  {glare}
                  <div style={{ fontSize: 28, marginBottom: 10 }}>📓</div>
                  <div style={{ fontSize: 14, color: subColor, lineHeight: 1.6 }}>
                    Записів ще немає. Почни вести журнал щодня!
                  </div>
                </div>
              ) : (
                history.map(h => {
                  const { label, weekday: wd } = formatDate(h.date)
                  const isSelected = h.date === selectedDate
                  const mc = moodColor(h.mood)
                  return (
                    <div
                      key={h.id}
                      onClick={() => selectDate(h.date)}
                      style={{
                        ...glassCard(isSelected ? BLUE : undefined),
                        cursor: 'pointer',
                        padding: '14px 16px',
                        transition: 'all 0.15s',
                        outline: isSelected ? `2px solid ${BLUE}` : 'none',
                      }}
                    >
                      {glare}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, position: 'relative' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{label}</div>
                          <div style={{ fontSize: 11, color: subColor, textTransform: 'capitalize' }}>{wd}</div>
                        </div>
                        <div style={{ fontSize: 22 }}>{MOODS.find(m => m.value === h.mood)?.emoji ?? '😐'}</div>
                      </div>
                      {h.content && (
                        <div style={{ fontSize: 12, color: subColor, lineHeight: 1.5, position: 'relative', overflow: 'hidden', maxHeight: 36, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical' as any }}>
                          {h.content}
                        </div>
                      )}
                      {/* Mood bar */}
                      <div style={{ height: 3, borderRadius: 2, background: 'rgba(128,128,128,0.15)', overflow: 'hidden', marginTop: 10, position: 'relative' }}>
                        <div style={{ height: '100%', width: `${h.mood * 20}%`, background: mc, borderRadius: 2 }} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .journal-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
        @media (max-width: 768px) { .journal-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
