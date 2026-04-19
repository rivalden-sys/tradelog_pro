'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useLocale } from '@/hooks/useLocale'
import { DARK, LIGHT } from '@/lib/colors'
import NavBar from '@/components/layout/NavBar'
import Icon, { IconName } from '@/components/icons/Icon'

const FONT = "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', sans-serif"
const GREEN  = '#30d158'
const RED    = '#ff453a'
const ORANGE = '#ff9f0a'
const BLUE   = '#0a84ff'
const PURPLE = '#bf5af2'

type GoalType = 'win_rate' | 'trade_count' | 'total_pnl' | 'max_losses'
type Period   = 'weekly' | 'monthly'

interface Goal {
  id: string
  type: GoalType
  period: Period
  target: number
}

interface GoalProgress {
  current: number
  percent: number
  done: boolean
}

const GOAL_META: Record<GoalType, { label: string; labelUk: string; unit: string; color: string; icon: IconName; description: string; descriptionUk: string }> = {
  win_rate:    { label: 'Win Rate',          labelUk: 'Win Rate',            unit: '%', color: GREEN,  icon: 'goals',     description: 'Percentage of winning trades', descriptionUk: 'Відсоток прибуткових угод' },
  trade_count: { label: 'Trades',            labelUk: 'Угоди',               unit: '',  color: BLUE,   icon: 'trades',    description: 'Number of closed trades',      descriptionUk: 'Кількість закритих угод' },
  total_pnl:   { label: 'Total P&L',         labelUk: 'Загальний P&L',       unit: '$', color: PURPLE, icon: 'analytics', description: 'Total profit in USD',          descriptionUk: 'Загальний прибуток у USD' },
  max_losses:  { label: 'Max Losing Streak', labelUk: 'Макс. серія збитків', unit: '',  color: ORANGE, icon: 'warning',   description: 'Max consecutive losing trades', descriptionUk: 'Макс. збиткових угод поспіль' },
}

function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(now); mon.setDate(now.getDate() + diff); mon.setHours(0,0,0,0)
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999)
  return { from: mon.toISOString(), to: sun.toISOString() }
}

function getMonthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { from: from.toISOString(), to: to.toISOString() }
}

function calcProgress(trades: any[], goal: Goal): GoalProgress {
  const closed = trades.filter(t => t.status === 'closed' || !t.status)
  if (goal.type === 'win_rate') {
    if (!closed.length) return { current: 0, percent: 0, done: false }
    const wins = closed.filter(t => t.result === 'Тейк').length
    const current = Math.round((wins / closed.length) * 100)
    const percent = Math.min(100, Math.round((current / goal.target) * 100))
    return { current, percent, done: current >= goal.target }
  }
  if (goal.type === 'trade_count') {
    const current = closed.length
    const percent = Math.min(100, Math.round((current / goal.target) * 100))
    return { current, percent, done: current >= goal.target }
  }
  if (goal.type === 'total_pnl') {
    const current = Math.round(closed.reduce((s, t) => s + (t.profit_usd || 0), 0))
    const percent = goal.target > 0
      ? Math.min(100, Math.max(0, Math.round((current / goal.target) * 100)))
      : 0
    return { current, percent, done: current >= goal.target }
  }
  if (goal.type === 'max_losses') {
    let maxStreak = 0, cur = 0
    for (const t of closed) {
      if (t.result === 'Стоп') { cur++; maxStreak = Math.max(maxStreak, cur) }
      else cur = 0
    }
    const current = maxStreak
    const done = current <= goal.target
    const percent = done ? 100 : Math.max(0, Math.round((goal.target / Math.max(current, 1)) * 100))
    return { current, percent, done }
  }
  return { current: 0, percent: 0, done: false }
}

function calcStreak(allTrades: any[]) {
  const days = [...new Set(allTrades.map(t => t.date?.slice(0, 10)))].sort().reverse()
  if (!days.length) return 0
  let streak = 0
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (days[0] !== today && days[0] !== yesterday) return 0
  let expected = days[0] === today ? today : yesterday
  for (const d of days) {
    if (d === expected) {
      streak++
      const prev = new Date(expected)
      prev.setDate(prev.getDate() - 1)
      expected = prev.toISOString().slice(0, 10)
    } else break
  }
  return streak
}

export default function GoalsPage() {
  const { dark } = useTheme()
  const { locale } = useLocale()
  const isUk = locale === 'uk'

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const bg      = dark ? DARK.bg   : LIGHT.bg
  const surface = dark ? '#1c1c1e' : '#ffffff'
  const text    = dark ? DARK.text : LIGHT.text
  const sub     = dark ? DARK.sub  : LIGHT.sub
  const border  = dark ? DARK.border : 'rgba(0,0,0,0.08)'

  const [goals,       setGoals]       = useState<Goal[]>([])
  const [weekTrades,  setWeekTrades]  = useState<any[]>([])
  const [monthTrades, setMonthTrades] = useState<any[]>([])
  const [allTrades,   setAllTrades]   = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [formType,    setFormType]    = useState<GoalType>('win_rate')
  const [formPeriod,  setFormPeriod]  = useState<Period>('weekly')
  const [formTarget,  setFormTarget]  = useState('')
  const [saving,      setSaving]      = useState(false)
  const [editGoal,    setEditGoal]    = useState<Goal | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { from: wFrom, to: wTo } = getWeekRange()
      const { from: mFrom, to: mTo } = getMonthRange()

      const [goalsRes, weekRes, monthRes, allRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('trades').select('date,result,profit_usd,status').eq('user_id', user.id).gte('date', wFrom.slice(0,10)).lte('date', wTo.slice(0,10)),
        supabase.from('trades').select('date,result,profit_usd,status').eq('user_id', user.id).gte('date', mFrom.slice(0,10)).lte('date', mTo.slice(0,10)),
        supabase.from('trades').select('date,result,profit_usd,status').eq('user_id', user.id).order('date', { ascending: false }),
      ])

      setGoals(goalsRes.data || [])
      setWeekTrades(weekRes.data || [])
      setMonthTrades(monthRes.data || [])
      setAllTrades(allRes.data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function saveGoal() {
    if (!formTarget || isNaN(Number(formTarget))) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (editGoal) {
        await supabase.from('goals').update({ type: formType, period: formPeriod, target: Number(formTarget) }).eq('id', editGoal.id)
      } else {
        await supabase.from('goals').insert({ user_id: user.id, type: formType, period: formPeriod, target: Number(formTarget) })
      }
      setShowForm(false)
      setEditGoal(null)
      setFormTarget('')
      load()
    } finally {
      setSaving(false)
    }
  }

  async function deleteGoal(id: string) {
    await supabase.from('goals').delete().eq('id', id)
    load()
  }

  function openEdit(g: Goal) {
    setEditGoal(g)
    setFormType(g.type)
    setFormPeriod(g.period)
    setFormTarget(String(g.target))
    setShowForm(true)
  }

  function openAdd() {
    setEditGoal(null)
    setFormType('win_rate')
    setFormPeriod('weekly')
    setFormTarget('')
    setShowForm(true)
  }

  const streak     = calcStreak(allTrades)
  const weekGoals  = goals.filter(g => g.period === 'weekly')
  const monthGoals = goals.filter(g => g.period === 'monthly')

  const card = (style?: React.CSSProperties): React.CSSProperties => ({
    background: surface,
    border: `1px solid ${border}`,
    borderRadius: 18,
    padding: '24px 28px',
    ...style,
  })

  function ProgressBar({ percent, color, done }: { percent: number; color: string; done: boolean }) {
    const c = done ? GREEN : color
    return (
      <div style={{ height: 6, background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', borderRadius: 99, overflow: 'hidden', margin: '12px 0 8px' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: c, borderRadius: 99, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)', boxShadow: `0 0 8px ${c}55` }} />
      </div>
    )
  }

  function GoalCard({ goal }: { goal: Goal }) {
    const trades = goal.period === 'weekly' ? weekTrades : monthTrades
    const prog   = calcProgress(trades, goal)
    const meta   = GOAL_META[goal.type]
    const label  = isUk ? meta.labelUk : meta.label
    const color  = meta.color

    const formatCurrent = () => {
      if (goal.type === 'win_rate')  return `${prog.current}%`
      if (goal.type === 'total_pnl') return `$${prog.current}`
      return String(prog.current)
    }
    const formatTarget = () => {
      if (goal.type === 'win_rate')  return `${goal.target}%`
      if (goal.type === 'total_pnl') return `$${goal.target}`
      return String(goal.target)
    }

    return (
      <div style={{
        background: surface,
        border: `1px solid ${prog.done ? GREEN + '55' : border}`,
        borderRadius: 16, padding: '20px 22px',
        position: 'relative', transition: 'border-color 0.3s',
        boxShadow: prog.done ? `0 0 20px ${GREEN}18` : 'none',
      }}>
        {prog.done && (
          <div style={{ position: 'absolute', top: 14, right: 14, background: GREEN + '22', color: GREEN, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, letterSpacing: '0.04em' }}>
            ✓ {isUk ? 'Виконано' : 'Done'}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name={meta.icon} size={32} color={color} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{label}</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{isUk ? meta.descriptionUk : meta.description}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={() => openEdit(goal)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub, fontSize: 15, padding: '2px 4px' }}>✏️</button>
            <button onClick={() => deleteGoal(goal.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: RED, fontSize: 15, padding: '2px 4px' }}>🗑</button>
          </div>
        </div>

        <ProgressBar percent={prog.percent} color={color} done={prog.done} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <span style={{ fontSize: 24, fontWeight: 700, color: prog.done ? GREEN : text }}>{formatCurrent()}</span>
            <span style={{ fontSize: 13, color: sub, marginLeft: 6 }}>/ {formatTarget()}</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: prog.done ? GREEN : color }}>{prog.percent}%</div>
        </div>
      </div>
    )
  }

  function Section({ title, goals }: { title: string; goals: Goal[]; period: Period }) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: text }}>{title}</div>
          <button onClick={openAdd} style={{
            background: GREEN + '18', color: GREEN,
            border: `1px solid ${GREEN}44`,
            borderRadius: 10, padding: '6px 14px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
          }}>+ {isUk ? 'Ціль' : 'Goal'}</button>
        </div>
        {goals.length === 0 ? (
          <div style={{ ...card(), textAlign: 'center', padding: '40px 24px', color: sub }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <Icon name="goals" size={40} color={sub} style={{ opacity: 0.4 }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>{isUk ? 'Немає цілей' : 'No goals yet'}</div>
            <div style={{ fontSize: 13 }}>{isUk ? 'Додайте першу ціль для цього періоду' : 'Add your first goal for this period'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {goals.map(g => <GoalCard key={g.id} goal={g} />)}
          </div>
        )}
      </div>
    )
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: bg }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: sub, fontSize: 15 }}>
        {isUk ? 'Завантаження...' : 'Loading...'}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: FONT }}>
      <NavBar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: text, margin: 0, letterSpacing: '-0.02em' }}>
            {isUk ? 'Цілі та стрік' : 'Goals & Streak'}
          </h1>
          <p style={{ fontSize: 15, color: sub, marginTop: 8, marginBottom: 0 }}>
            {isUk ? 'Ставте тижневі та місячні цілі — відстежуйте прогрес автоматично' : 'Set weekly and monthly goals — track progress automatically'}
          </p>
        </div>

        {/* Streak Card */}
        <div style={{
          ...card({ marginBottom: 40 }),
          background: dark
            ? 'linear-gradient(135deg, rgba(255,159,10,0.12) 0%, rgba(255,159,10,0.04) 100%)'
            : 'linear-gradient(135deg, rgba(255,159,10,0.08) 0%, rgba(255,159,10,0.02) 100%)',
          border: `1px solid ${ORANGE}44`,
          display: 'flex', alignItems: 'center', gap: 28,
        }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 56, lineHeight: 1 }}>🔥</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: sub, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {isUk ? 'Активний стрік' : 'Active Streak'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 48, fontWeight: 800, color: ORANGE, letterSpacing: '-0.03em' }}>{streak}</span>
              <span style={{ fontSize: 18, color: sub }}>
                {isUk ? (streak === 1 ? 'день' : streak < 5 ? 'дні' : 'днів') : streak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <div style={{ fontSize: 14, color: sub, marginTop: 4 }}>
              {streak === 0
                ? (isUk ? 'Немає активних торгових днів поспіль' : 'No consecutive trading days yet')
                : (isUk ? 'поспіль з угодами' : 'consecutive days with trades')}
            </div>
          </div>
          {streak >= 7 && (
            <div style={{ background: ORANGE + '22', border: `1px solid ${ORANGE}55`, borderRadius: 14, padding: '12px 20px', textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 24 }}>🏆</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: ORANGE, marginTop: 4 }}>
                {streak >= 30 ? (isUk ? 'Легенда!' : 'Legend!') : streak >= 14 ? (isUk ? 'Вогонь!' : 'On fire!') : (isUk ? '1 тиждень!' : '1 week!')}
              </div>
            </div>
          )}
        </div>

        {/* Weekly Goals */}
        <div style={{ marginBottom: 40 }}>
          <Section
            title={isUk ? '📅 Тижневі цілі' : '📅 Weekly Goals'}
            goals={weekGoals}
            period="weekly"
          />
        </div>

        {/* Monthly Goals */}
        <Section
          title={isUk ? '📆 Місячні цілі' : '📆 Monthly Goals'}
          goals={monthGoals}
          period="monthly"
        />
      </div>

      {/* Modal Form */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, backdropFilter: 'blur(4px)',
        }} onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditGoal(null) } }}>
          <div style={{
            background: surface, borderRadius: 20,
            border: `1px solid ${border}`,
            padding: '28px 32px', width: '100%', maxWidth: 420,
            boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: text, margin: '0 0 24px' }}>
              {editGoal ? (isUk ? 'Редагувати ціль' : 'Edit Goal') : (isUk ? 'Нова ціль' : 'New Goal')}
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: sub, display: 'block', marginBottom: 6 }}>
                {isUk ? 'Тип цілі' : 'Goal Type'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(Object.keys(GOAL_META) as GoalType[]).map(type => {
                  const m = GOAL_META[type]
                  const active = formType === type
                  return (
                    <button key={type} onClick={() => setFormType(type)} style={{
                      padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                      background: active ? m.color + '22' : dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      border: active ? `1.5px solid ${m.color}66` : `1px solid ${border}`,
                      color: active ? m.color : sub,
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      fontFamily: FONT, textAlign: 'left', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <Icon name={m.icon} size={18} color={active ? m.color : sub} style={{ opacity: active ? 1 : 0.5 }} />
                      {isUk ? m.labelUk : m.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: sub, display: 'block', marginBottom: 6 }}>
                {isUk ? 'Період' : 'Period'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['weekly', 'monthly'] as Period[]).map(p => (
                  <button key={p} onClick={() => setFormPeriod(p)} style={{
                    padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                    background: formPeriod === p ? BLUE + '22' : dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    border: formPeriod === p ? `1.5px solid ${BLUE}66` : `1px solid ${border}`,
                    color: formPeriod === p ? BLUE : sub,
                    fontSize: 13, fontWeight: formPeriod === p ? 600 : 400,
                    fontFamily: FONT, transition: 'all 0.15s',
                  }}>
                    {p === 'weekly' ? (isUk ? '📅 Тижнева' : '📅 Weekly') : (isUk ? '📆 Місячна' : '📆 Monthly')}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, color: sub, display: 'block', marginBottom: 6 }}>
                {isUk ? 'Ціль' : 'Target'} {GOAL_META[formType].unit && `(${GOAL_META[formType].unit})`}
              </label>
              <input
                type="number"
                value={formTarget}
                onChange={e => setFormTarget(e.target.value)}
                placeholder={formType === 'win_rate' ? '60' : formType === 'total_pnl' ? '500' : formType === 'max_losses' ? '3' : '10'}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 12,
                  background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${border}`, color: text,
                  fontSize: 16, fontFamily: FONT, boxSizing: 'border-box', outline: 'none',
                }}
              />
              {formType === 'max_losses' && (
                <div style={{ fontSize: 12, color: sub, marginTop: 6 }}>
                  {isUk ? '⬇️ Чим менше — тим краща ціль. Напр. "не більше 3 збиткових поспіль"' : '⬇️ Lower is better. E.g. "no more than 3 consecutive losses"'}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowForm(false); setEditGoal(null) }} style={{
                flex: 1, padding: '12px', borderRadius: 12,
                background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                border: `1px solid ${border}`, color: sub,
                fontSize: 14, cursor: 'pointer', fontFamily: FONT,
              }}>{isUk ? 'Скасувати' : 'Cancel'}</button>
              <button onClick={saveGoal} disabled={saving || !formTarget} style={{
                flex: 2, padding: '12px', borderRadius: 12,
                background: GREEN, color: '#fff',
                border: 'none', fontSize: 14, fontWeight: 600,
                cursor: saving || !formTarget ? 'not-allowed' : 'pointer',
                opacity: saving || !formTarget ? 0.6 : 1,
                fontFamily: FONT,
              }}>{saving ? '...' : (editGoal ? (isUk ? 'Зберегти' : 'Save') : (isUk ? 'Додати ціль' : 'Add Goal'))}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
