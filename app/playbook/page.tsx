'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/layout/NavBar'
import { createClient } from '@/lib/supabase/client'
import { DARK, LIGHT } from '@/lib/colors'
import { useLocale } from '@/hooks/useLocale'
import Icon from '@/components/icons/Icon'

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

interface Rule {
  id: string
  text: string
}

interface Playbook {
  id: string
  setup_name: string
  rules: Rule[]
  created_at: string
}

interface PlaybookStats {
  totalTrades: number
  followedAll: number
  followedAllWR: number
  violatedAny: number
  violatedAnyWR: number
}

export default function PlaybookPage() {
  const dark        = useDark()
  const router      = useRouter()
  const { t, locale } = useLocale()

  const GREEN  = dark ? DARK.green  : LIGHT.green
  const RED    = dark ? DARK.red    : LIGHT.red
  const BLUE   = dark ? DARK.blue   : LIGHT.blue
  const ORANGE = dark ? DARK.orange : LIGHT.orange
  const PURPLE = dark ? DARK.purple : LIGHT.purple

  const textColor   = dark ? DARK.text   : LIGHT.text
  const subColor    = dark ? DARK.sub    : LIGHT.sub
  const borderColor = dark ? DARK.border : LIGHT.border

  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

  const [playbooks,    setPlaybooks]    = useState<Playbook[]>([])
  const [stats,        setStats]        = useState<Record<string, PlaybookStats>>({})
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [setupName,    setSetupName]    = useState('')
  const [rules,        setRules]        = useState<Rule[]>([{ id: crypto.randomUUID(), text: '' }])
  const [saving,       setSaving]       = useState(false)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: pbData } = await supabase
      .from('playbooks')
      .select('*')
      .order('created_at', { ascending: false })

    if (!pbData?.length) { setPlaybooks([]); setLoading(false); return }
    setPlaybooks(pbData)

    const statsMap: Record<string, PlaybookStats> = {}

    for (const pb of pbData) {
      const { data: checks } = await supabase
        .from('trade_rule_checks')
        .select('trade_id, followed')
        .eq('playbook_id', pb.id)

      if (!checks?.length) {
        statsMap[pb.id] = { totalTrades: 0, followedAll: 0, followedAllWR: 0, violatedAny: 0, violatedAnyWR: 0 }
        continue
      }

      const byTrade: Record<string, boolean[]> = {}
      checks.forEach(c => {
        if (!byTrade[c.trade_id]) byTrade[c.trade_id] = []
        byTrade[c.trade_id].push(c.followed)
      })

      const tradeIds        = Object.keys(byTrade)
      const followedAllIds  = tradeIds.filter(id => byTrade[id].every(f => f))
      const violatedAnyIds  = tradeIds.filter(id => byTrade[id].some(f => !f))

      const { data: trades } = await supabase
        .from('trades')
        .select('id, result')
        .in('id', tradeIds)
        .eq('status', 'closed')

      if (!trades?.length) {
        statsMap[pb.id] = { totalTrades: tradeIds.length, followedAll: followedAllIds.length, followedAllWR: 0, violatedAny: violatedAnyIds.length, violatedAnyWR: 0 }
        continue
      }

      const tradeResults: Record<string, string> = {}
      trades.forEach(tr => { tradeResults[tr.id] = tr.result })

      const calcWR = (ids: string[]) => {
        const closed = ids.filter(id => tradeResults[id])
        if (!closed.length) return 0
        const wins = closed.filter(id => tradeResults[id] === 'Тейк').length
        return Math.round(wins / closed.length * 100)
      }

      statsMap[pb.id] = {
        totalTrades:   tradeIds.length,
        followedAll:   followedAllIds.length,
        followedAllWR: calcWR(followedAllIds),
        violatedAny:   violatedAnyIds.length,
        violatedAnyWR: calcWR(violatedAnyIds),
      }
    }

    setStats(statsMap)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const resetForm = () => {
    setSetupName('')
    setRules([{ id: crypto.randomUUID(), text: '' }])
    setEditingId(null)
    setShowForm(false)
  }

  const startEdit = (pb: Playbook) => {
    setSetupName(pb.setup_name)
    setRules(pb.rules.length ? pb.rules : [{ id: crypto.randomUUID(), text: '' }])
    setEditingId(pb.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const addRule    = () => setRules(r => [...r, { id: crypto.randomUUID(), text: '' }])
  const updateRule = (id: string, text: string) => setRules(r => r.map(rule => rule.id === id ? { ...rule, text } : rule))
  const removeRule = (id: string) => setRules(r => r.length > 1 ? r.filter(rule => rule.id !== id) : r)

  const save = async () => {
    if (!setupName.trim()) return
    const validRules = rules.filter(r => r.text.trim())
    if (!validRules.length) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    if (editingId) {
      await supabase.from('playbooks').update({ setup_name: setupName.trim(), rules: validRules }).eq('id', editingId)
    } else {
      await supabase.from('playbooks').insert({ user_id: user.id, setup_name: setupName.trim(), rules: validRules })
    }
    setSaving(false)
    resetForm()
    load()
  }

  const deletePlaybook = async (id: string) => {
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from('playbooks').delete().eq('id', id)
    setPlaybooks(p => p.filter(pb => pb.id !== id))
    setDeletingId(null)
  }

  const rulesCountLabel = (n: number) => {
    if (locale === 'en') return `${n} ${n === 1 ? t('playbook_rules_count_1') : t('playbook_rules_count_2')}`
    if (n === 1) return `${n} ${t('playbook_rules_count_1')}`
    if (n < 5)   return `${n} ${t('playbook_rules_count_2')}`
    return `${n} ${t('playbook_rules_count_5')}`
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
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: subColor, marginBottom: 6,
    display: 'block', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.04em',
  }

  const rulePh = (i: number) => {
    if (i === 0) return t('playbook_rule_ph1')
    if (i === 1) return t('playbook_rule_ph2')
    if (i === 2) return t('playbook_rule_ph3')
    return t('playbook_rule_ph_more')
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: dark ? DARK.bg : LIGHT.bg }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: noiseSvg, opacity: dark ? 0.35 : 0.15 }} />
      <div style={{ position: 'fixed', top: -200, left: '30%', width: 600, height: 600, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(48,209,88,0.06) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(10,132,255,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: textColor, margin: 0, letterSpacing: '-0.04em', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="playbook" size={28} color={GREEN} />
                {t('playbook_title')}
              </h1>
              <div style={{ fontSize: 13, color: subColor, marginTop: 4 }}>{t('playbook_subtitle')}</div>
            </div>
            {!showForm && (
              <button onClick={() => setShowForm(true)} style={{
                padding: '10px 20px', borderRadius: 12, border: 'none',
                background: dark ? DARK.green : 'linear-gradient(180deg, #1f9e3f 0%, #166b2b 100%)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: FONT,
                boxShadow: `0 0 20px ${GREEN}44`,
              }}>{t('playbook_new_btn')}</button>
            )}
          </div>

          {/* Form */}
          {showForm && (
            <div style={{ ...glassCard(editingId ? BLUE : GREEN), marginBottom: 20 }}>
              {glare}
              <div style={{ fontSize: 15, fontWeight: 800, color: textColor, marginBottom: 20, position: 'relative' }}>
                {editingId ? t('playbook_form_edit') : t('playbook_form_new')}
              </div>
              <div style={{ marginBottom: 20, position: 'relative' }}>
                <label style={labelStyle}>{t('playbook_setup_label')}</label>
                <input type="text" placeholder={t('playbook_setup_ph')} value={setupName} onChange={e => setSetupName(e.target.value)} style={inputStyle} autoFocus />
              </div>
              <div style={{ marginBottom: 20, position: 'relative' }}>
                <label style={labelStyle}>{t('playbook_rules_label')}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rules.map((rule, i) => (
                    <div key={rule.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ fontSize: 12, color: subColor, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{i + 1}</div>
                      <input type="text"
                        placeholder={rulePh(i)}
                        value={rule.text} onChange={e => updateRule(rule.id, e.target.value)}
                        style={{ ...inputStyle, flex: 1 }} />
                      {rules.length > 1 && (
                        <button onClick={() => removeRule(rule.id)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: RED + '22', color: RED, fontSize: 16, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={addRule} style={{ padding: '9px 16px', borderRadius: 10, border: `1px dashed ${borderColor}`, background: 'transparent', color: subColor, fontSize: 13, cursor: 'pointer', fontFamily: FONT, textAlign: 'left' }}>
                    {t('playbook_add_rule')}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
                <button onClick={save} disabled={saving || !setupName.trim() || !rules.some(r => r.text.trim())} style={{
                  padding: '11px 24px', borderRadius: 12, border: 'none',
                  background: saving ? 'rgba(128,128,128,0.2)' : editingId ? BLUE : GREEN,
                  color: saving ? subColor : '#fff',
                  fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: FONT, opacity: saving ? 0.6 : 1,
                }}>{saving ? t('playbook_saving') : editingId ? t('playbook_save_edit') : t('playbook_save')}</button>
                <button onClick={resetForm} style={{ padding: '11px 20px', borderRadius: 12, border: `1px solid ${borderColor}`, background: 'transparent', color: subColor, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{t('playbook_cancel')}</button>
              </div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: subColor, fontSize: 14 }}>{t('playbook_loading')}</div>
          ) : playbooks.length === 0 && !showForm ? (
            <div style={{ ...glassCard(), textAlign: 'center', padding: '48px 20px' }}>
              {glare}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <Icon name="playbook" size={48} color={subColor} style={{ opacity: 0.4 }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: textColor, marginBottom: 8 }}>{t('playbook_empty_title')}</div>
              <div style={{ fontSize: 14, color: subColor, lineHeight: 1.6, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
                {t('playbook_empty_sub')}
              </div>
              <button onClick={() => setShowForm(true)} style={{ padding: '11px 24px', borderRadius: 12, border: 'none', background: GREEN, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                {t('playbook_empty_btn')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {playbooks.map(pb => {
                const s = stats[pb.id]
                const hasStats = s && s.totalTrades > 0
                return (
                  <div key={pb.id} style={glassCard()}>
                    {glare}

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, position: 'relative' }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: textColor, letterSpacing: '-0.02em' }}>{pb.setup_name}</div>
                        <div style={{ fontSize: 12, color: subColor, marginTop: 2 }}>
                          {rulesCountLabel(pb.rules.length)}
                          {hasStats && ` · ${s.totalTrades} ${t('playbook_trades')}`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => startEdit(pb)} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: subColor, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{t('playbook_edit_btn')}</button>
                        <button onClick={() => deletePlaybook(pb.id)} disabled={deletingId === pb.id} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${RED}44`, background: RED + '11', color: RED, fontSize: 12, fontWeight: 600, cursor: deletingId === pb.id ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: deletingId === pb.id ? 0.5 : 1 }}>
                          {deletingId === pb.id ? '...' : '🗑'}
                        </button>
                      </div>
                    </div>

                    {hasStats && (
                      <div style={{ marginBottom: 16, position: 'relative' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                          <div style={{ padding: '12px 14px', borderRadius: 12, background: dark ? 'rgba(48,209,88,0.08)' : 'rgba(48,209,88,0.07)', border: `1px solid ${GREEN}33` }}>
                            <div style={{ fontSize: 11, color: GREEN, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{t('playbook_followed')}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                              <div style={{ fontSize: 26, fontWeight: 900, color: GREEN, letterSpacing: '-0.03em' }}>{s.followedAllWR}%</div>
                              <div style={{ fontSize: 12, color: subColor }}>{t('playbook_winrate')}</div>
                            </div>
                            <div style={{ fontSize: 12, color: subColor, marginTop: 2 }}>{s.followedAll} {t('playbook_trades')}</div>
                            <div style={{ height: 4, borderRadius: 2, background: 'rgba(128,128,128,0.15)', overflow: 'hidden', marginTop: 8 }}>
                              <div style={{ height: '100%', width: `${s.followedAllWR}%`, background: GREEN, borderRadius: 2, transition: 'width 0.6s ease' }} />
                            </div>
                          </div>

                          <div style={{ padding: '12px 14px', borderRadius: 12, background: dark ? 'rgba(255,69,58,0.08)' : 'rgba(255,69,58,0.06)', border: `1px solid ${RED}33` }}>
                            <div style={{ fontSize: 11, color: RED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{t('playbook_violated')}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                              <div style={{ fontSize: 26, fontWeight: 900, color: RED, letterSpacing: '-0.03em' }}>{s.violatedAnyWR}%</div>
                              <div style={{ fontSize: 12, color: subColor }}>{t('playbook_winrate')}</div>
                            </div>
                            <div style={{ fontSize: 12, color: subColor, marginTop: 2 }}>{s.violatedAny} {t('playbook_trades')}</div>
                            <div style={{ height: 4, borderRadius: 2, background: 'rgba(128,128,128,0.15)', overflow: 'hidden', marginTop: 8 }}>
                              <div style={{ height: '100%', width: `${s.violatedAnyWR}%`, background: RED, borderRadius: 2, transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                        </div>

                        {s.followedAll > 0 && s.violatedAny > 0 && (
                          <div style={{
                            padding: '10px 14px', borderRadius: 10, fontSize: 13,
                            background: s.followedAllWR > s.violatedAnyWR
                              ? dark ? 'rgba(48,209,88,0.08)' : 'rgba(48,209,88,0.07)'
                              : dark ? 'rgba(255,159,10,0.08)' : 'rgba(255,159,10,0.07)',
                            border: `1px solid ${s.followedAllWR > s.violatedAnyWR ? GREEN : ORANGE}33`,
                            color: s.followedAllWR > s.violatedAnyWR ? GREEN : ORANGE,
                            fontWeight: 600,
                          }}>
                            {s.followedAllWR > s.violatedAnyWR
                              ? t('playbook_insight_good').replace('{diff}', String(s.followedAllWR - s.violatedAnyWR))
                              : t('playbook_insight_warn')
                            }
                          </div>
                        )}
                        {s.totalTrades > 0 && s.followedAll === 0 && (
                          <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: dark ? 'rgba(255,159,10,0.08)' : 'rgba(255,159,10,0.07)', border: `1px solid ${ORANGE}33`, color: ORANGE, fontWeight: 600 }}>
                            {t('playbook_insight_never')}
                          </div>
                        )}
                      </div>
                    )}

                    {!hasStats && (
                      <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: `1px solid ${borderColor}`, fontSize: 13, color: subColor, position: 'relative' }}>
                        {t('playbook_no_stats')}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
                      {pb.rules.map((rule, i) => (
                        <div key={rule.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px', borderRadius: 10, background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)', border: `1px solid ${borderColor}` }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: BLUE + '22', color: BLUE, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                          <div style={{ fontSize: 14, color: textColor, lineHeight: 1.5, paddingTop: 1 }}>{rule.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
