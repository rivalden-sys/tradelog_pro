'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useLocale } from '@/hooks/useLocale'
import { createClient } from '@/lib/supabase/client'
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

function card(t: ReturnType<typeof th>): React.CSSProperties {
  return { background: t.surface, borderRadius: 18, padding: '22px 24px', boxShadow: t.shadow, border: `1px solid ${t.border}` }
}

export default function SettingsPage() {
  const { dark } = useTheme()
  const t = th(dark)
  const { t: tr } = useLocale()
  const router = useRouter()

  const [email,         setEmail]         = useState('')
  const [username,      setUsername]      = useState('')
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [maxRiskPct,    setMaxRiskPct]    = useState('1')
  const [minRR,         setMinRR]         = useState('1.5')
  const [dailyLoss,     setDailyLoss]     = useState('3')

  const [balance,       setBalance]       = useState('')
  const [balanceSaved,  setBalanceSaved]  = useState(false)
  const [balanceSaving, setBalanceSaving] = useState(false)

  // Change password
  const [newPassword,  setNewPassword]  = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [pwSaving,     setPwSaving]     = useState(false)
  const [pwSaved,      setPwSaved]      = useState(false)
  const [pwError,      setPwError]      = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email || '')
      setUsername(user.user_metadata?.username || user.email?.split('@')[0] || '')

      const { data: profile } = await supabase
        .from('users').select('balance').eq('id', user.id).single()
      if (profile?.balance) setBalance(String(profile.balance))

      setLoading(false)
    }
    load()
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.auth.updateUser({ data: { username } })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const saveBalance = async () => {
    const val = parseFloat(balance)
    if (isNaN(val) || val < 0) return
    setBalanceSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ balance: val }).eq('id', user.id)
    }
    setBalanceSaving(false); setBalanceSaved(true)
    setTimeout(() => setBalanceSaved(false), 2000)
  }

  const savePassword = async () => {
    setPwError('')
    if (!newPassword.trim())       { setPwError('Введіть новий пароль'); return }
    if (newPassword.length < 6)    { setPwError('Мінімум 6 символів'); return }
    if (newPassword !== newPassword2) { setPwError('Паролі не співпадають'); return }

    setPwSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPwError(error.message); setPwSaving(false); return }

    setPwSaving(false); setPwSaved(true)
    setNewPassword(''); setNewPassword2('')
    setTimeout(() => setPwSaved(false), 3000)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: t.surface2, border: `1px solid ${t.border}`,
    borderRadius: 10, padding: '10px 14px', fontSize: 14, color: t.text,
    outline: 'none', boxSizing: 'border-box', fontFamily: FONT,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: t.sub, marginBottom: 6, display: 'block', fontWeight: 500,
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: FONT }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: t.sub }}>{tr('settings_loading')}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: FONT, transition: 'background 0.3s' }}>
      <NavBar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px', display: 'grid', gap: 20 }}>

        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.04em' }}>{tr('settings_title')}</div>
          <div style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>{tr('settings_subtitle')}</div>
        </div>

        {/* Профіль */}
        <div style={card(t)}>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 20 }}>{tr('settings_profile')}</div>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={labelStyle}>{tr('settings_email')}</label>
              <input value={email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={labelStyle}>{tr('settings_username')}</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder={tr('settings_username_ph')} style={inputStyle} />
            </div>
            <button onClick={saveProfile} disabled={saving} style={{
              background: saved ? GREEN : t.text, color: saved ? '#fff' : t.bg,
              border: 'none', borderRadius: 12, padding: '12px', fontSize: 14,
              fontWeight: 700, cursor: 'pointer', transition: 'background 0.3s', fontFamily: FONT,
            }}>
              {saved ? tr('settings_saved') : saving ? tr('settings_saving') : tr('settings_save')}
            </button>
          </div>
        </div>

        {/* 💰 Депозит */}
        <div style={{ ...card(t), border: `1px solid ${ORANGE}33` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>💰 Депозит</div>
            <span style={{ background: `${ORANGE}22`, color: ORANGE, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>USDT</span>
          </div>
          <div style={{ fontSize: 13, color: t.sub, marginBottom: 20 }}>
            Вкажіть поточний баланс депозиту. Використовується для розрахунку ризику при плануванні угод.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Баланс депозиту (USDT)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number" step="1" min="0" placeholder="10000"
                  value={balance} onChange={e => setBalance(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 60 }}
                />
                <span style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 13, fontWeight: 600, color: t.sub,
                }}>USDT</span>
              </div>
            </div>
            <button onClick={saveBalance} disabled={balanceSaving} style={{
              background: balanceSaved ? GREEN : ORANGE,
              color: balanceSaved ? '#fff' : '#000',
              border: 'none', borderRadius: 12, padding: '10px 20px',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: FONT, whiteSpace: 'nowrap',
              boxShadow: `0 0 20px ${ORANGE}44`,
              transition: 'background 0.3s',
            }}>
              {balanceSaved ? '✓ Збережено' : balanceSaving ? '...' : 'Зберегти'}
            </button>
          </div>
          {balance && !isNaN(parseFloat(balance)) && (
            <div style={{ marginTop: 14, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[1, 2, 3].map(pct => (
                <div key={pct} style={{ background: t.surface2, borderRadius: 10, padding: '8px 14px', fontSize: 12 }}>
                  <span style={{ color: t.sub }}>{pct}% ризику = </span>
                  <span style={{ fontWeight: 700, color: ORANGE }}>{(parseFloat(balance) * pct / 100).toFixed(2)} USDT</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🔑 Зміна пароля */}
        <div style={{ ...card(t), border: `1px solid ${BLUE}33` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>🔑 Змінити пароль</div>
          </div>
          <div style={{ fontSize: 13, color: t.sub, marginBottom: 20 }}>
            Введіть новий пароль для вашого акаунту.
          </div>

          {pwSaved && (
            <div style={{
              background: `${GREEN}18`, border: `1px solid ${GREEN}44`,
              borderRadius: 12, padding: '12px 16px', marginBottom: 16,
              fontSize: 13, color: GREEN, fontWeight: 600,
            }}>
              ✓ Пароль успішно змінено!
            </div>
          )}

          {pwError && (
            <div style={{
              background: `${RED}12`, border: `1px solid ${RED}33`,
              borderRadius: 12, padding: '12px 16px', marginBottom: 16,
              fontSize: 13, color: RED,
            }}>
              {pwError}
            </div>
          )}

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={labelStyle}>Новий пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setPwError('') }}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Підтвердіть пароль</label>
              <input
                type="password"
                value={newPassword2}
                onChange={e => { setNewPassword2(e.target.value); setPwError('') }}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && savePassword()}
                style={{
                  ...inputStyle,
                  border: `1px solid ${newPassword2 && newPassword !== newPassword2 ? RED + '66' : t.border}`,
                }}
              />
              {newPassword2 && newPassword !== newPassword2 && (
                <div style={{ fontSize: 11, color: RED, marginTop: 4 }}>Паролі не співпадають</div>
              )}
            </div>
            <button onClick={savePassword} disabled={pwSaving} style={{
              background: pwSaved ? GREEN : BLUE,
              color: '#fff', border: 'none', borderRadius: 12, padding: '12px',
              fontSize: 14, fontWeight: 700, cursor: pwSaving ? 'not-allowed' : 'pointer',
              opacity: pwSaving ? 0.7 : 1,
              fontFamily: FONT, transition: 'background 0.3s',
              boxShadow: `0 0 20px ${BLUE}33`,
            }}>
              {pwSaved ? '✓ Збережено' : pwSaving ? 'Збереження...' : 'Змінити пароль'}
            </button>
          </div>
        </div>

        {/* Ризик-менеджмент */}
        <div style={card(t)}>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6 }}>{tr('settings_risk')}</div>
          <div style={{ fontSize: 13, color: t.sub, marginBottom: 20 }}>{tr('settings_risk_sub')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>{tr('settings_max_risk')}</label>
              <input type="number" step="0.1" min="0.1" max="10" value={maxRiskPct} onChange={e => setMaxRiskPct(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{tr('settings_min_rr')}</label>
              <input type="number" step="0.1" min="0.5" max="10" value={minRR} onChange={e => setMinRR(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{tr('settings_daily_loss')}</label>
              <input type="number" step="0.5" min="1" max="20" value={dailyLoss} onChange={e => setDailyLoss(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: `${BLUE}12`, fontSize: 13, color: t.sub }}>
            {tr('settings_risk_hint')}
          </div>
        </div>

        {/* Акаунт */}
        <div style={card(t)}>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6 }}>{tr('settings_account')}</div>
          <div style={{ fontSize: 13, color: t.sub, marginBottom: 16 }}>{tr('settings_account_sub')}</div>
          <div style={{ display: 'grid', gap: 0 }}>
            {[
              { label: tr('settings_email'),  value: email },
              { label: tr('settings_status'), value: tr('settings_active') },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontSize: 14, color: t.sub }}>{row.label}</span>
                <span style={{ fontSize: 14, color: t.text, fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <span style={{ fontSize: 14, color: t.sub }}>{tr('settings_subscription')}</span>
              <a href="/billing" style={{ fontSize: 14, color: BLUE, textDecoration: 'none', fontWeight: 600 }}>{tr('settings_manage')}</a>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ ...card(t), border: `1px solid ${RED}44` }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: RED, marginBottom: 6 }}>{tr('settings_danger')}</div>
          <div style={{ fontSize: 13, color: t.sub, marginBottom: 16 }}>{tr('settings_danger_sub')}</div>
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)} style={{
              background: `${RED}18`, color: RED, border: `1px solid ${RED}44`,
              borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
            }}>{tr('settings_logout')}</button>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: t.sub }}>{tr('settings_confirm')}</span>
              <button onClick={handleLogout} style={{ background: RED, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{tr('settings_yes')}</button>
              <button onClick={() => setDeleteConfirm(false)} style={{ background: t.surface2, color: t.text, border: `1px solid ${t.border}`, borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{tr('settings_cancel')}</button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
