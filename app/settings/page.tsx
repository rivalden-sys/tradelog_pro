'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/hooks/useLocale'
import { createClient } from '@/lib/supabase/client'
import NavBar from '@/components/layout/NavBar'

const FONT = "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', sans-serif"

const GREEN  = '#30d158'
const RED    = '#ff453a'
const BLUE   = '#0a84ff'
const ORANGE = '#ff9f0a'

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

export default function SettingsPage() {
  const dark = useDark()
  const { t: tr } = useLocale()
  const router = useRouter()

  const textColor   = dark ? '#f5f5f7' : '#1c1c1e'
  const subColor    = dark ? 'rgba(255,255,255,0.35)' : '#6e6e73'
  const borderColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.8)'
  const inputBg     = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const inputBorder = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)'
  const inputShadow = dark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 2px 4px rgba(0,0,0,0.04)'

  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

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
  const [newPassword,   setNewPassword]   = useState('')
  const [newPassword2,  setNewPassword2]  = useState('')
  const [pwSaving,      setPwSaving]      = useState(false)
  const [pwSaved,       setPwSaved]       = useState(false)
  const [pwError,       setPwError]       = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email || '')
      setUsername(user.user_metadata?.username || user.email?.split('@')[0] || '')
      const { data: profile } = await supabase.from('users').select('balance').eq('id', user.id).single()
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
    if (user) await supabase.from('users').update({ balance: val }).eq('id', user.id)
    setBalanceSaving(false); setBalanceSaved(true)
    setTimeout(() => setBalanceSaved(false), 2000)
  }

  const savePassword = async () => {
    setPwError('')
    if (!newPassword.trim())          { setPwError('Введіть новий пароль'); return }
    if (newPassword.length < 6)       { setPwError('Мінімум 6 символів'); return }
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
    width: '100%', background: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: 10, padding: '10px 14px', fontSize: 14, color: textColor,
    outline: 'none', boxSizing: 'border-box', fontFamily: FONT,
    backdropFilter: 'blur(10px)', boxShadow: inputShadow,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: subColor, marginBottom: 6, display: 'block',
    fontWeight: 600, letterSpacing: '0.02em',
  }

  // Глянцева кнопка — еталон з edit page
  const glossyBtn = (color: 'green' | 'blue' | 'orange', state: 'normal' | 'saved' | 'saving'): React.CSSProperties => {
    const isSaved   = state === 'saved'
    const isSaving  = state === 'saving'
    const bgMap = {
      green:  { dark: GREEN,  light: 'linear-gradient(180deg, #1f9e3f 0%, #166b2b 100%)' },
      blue:   { dark: BLUE,   light: 'linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%)' },
      orange: { dark: ORANGE, light: 'linear-gradient(180deg, #e08b00 0%, #b36d00 100%)' },
    }
    const savedBg = { dark: GREEN, light: 'linear-gradient(180deg, #1f9e3f 0%, #166b2b 100%)' }
    return {
      background: isSaving
        ? dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
        : isSaved
          ? dark ? savedBg.dark : savedBg.light
          : dark ? bgMap[color].dark : bgMap[color].light,
      color: isSaving ? subColor : '#fff',
      border: 'none', borderRadius: 12, padding: '12px',
      fontSize: 14, fontWeight: 700,
      cursor: isSaving ? 'not-allowed' : 'pointer',
      fontFamily: FONT, transition: 'all 0.3s',
      boxShadow: isSaving ? 'none' : dark
        ? `0 0 20px ${color === 'green' ? GREEN : color === 'blue' ? BLUE : ORANGE}33`
        : '0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
      opacity: isSaving ? 0.7 : 1,
    }
  }

  function glassCard(accent?: string): React.CSSProperties {
    return {
      background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.65)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderRadius: 20, padding: '24px',
      border: `1px solid ${accent ? accent + '44' : borderColor}`,
      boxShadow: dark
        ? 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.02)'
        : 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.02)',
      position: 'relative', overflow: 'hidden',
    }
  }

  const glare = (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: dark ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', background: dark ? '#0a0a0b' : '#f2f2f7', fontFamily: FONT }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: subColor }}>{tr('settings_loading')}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: dark ? '#0a0a0b' : 'linear-gradient(135deg, #e8edf5 0%, #f0f2f7 50%, #e8f0ed 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: noiseSvg, opacity: dark ? 0.35 : 0.15 }} />
      {dark ? (
        <>
          <div style={{ position: 'fixed', top: -200, left: '30%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(48,209,88,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'fixed', bottom: -200, right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(10,132,255,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        </>
      ) : (
        <>
          <div style={{ position: 'fixed', top: -150, left: '20%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(10,132,255,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'fixed', bottom: -150, right: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(48,209,88,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        </>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px', display: 'grid', gap: 16 }}>

          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: textColor, letterSpacing: '-0.04em' }}>{tr('settings_title')}</div>
            <div style={{ fontSize: 13, color: subColor, marginTop: 2 }}>{tr('settings_subtitle')}</div>
          </div>

          {/* Профіль */}
          <div style={glassCard()}>
            {glare}
            <div style={{ fontSize: 16, fontWeight: 700, color: textColor, marginBottom: 20, position: 'relative' }}>{tr('settings_profile')}</div>
            <div style={{ display: 'grid', gap: 16, position: 'relative' }}>
              <div>
                <label style={labelStyle}>{tr('settings_email')}</label>
                <input value={email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
              <div>
                <label style={labelStyle}>{tr('settings_username')}</label>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder={tr('settings_username_ph')} style={inputStyle} />
              </div>
              <button onClick={saveProfile} disabled={saving} style={glossyBtn('green', saved ? 'saved' : saving ? 'saving' : 'normal')}>
                {saved ? tr('settings_saved') : saving ? tr('settings_saving') : tr('settings_save')}
              </button>
            </div>
          </div>

          {/* Депозит */}
          <div style={glassCard(ORANGE)}>
            {glare}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, position: 'relative' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: textColor }}>💰 Депозит</div>
              <span style={{ background: dark ? ORANGE + '22' : '#fef3c7', color: dark ? ORANGE : '#92400e', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>USDT</span>
            </div>
            <div style={{ fontSize: 13, color: subColor, marginBottom: 20, position: 'relative' }}>
              Вкажіть поточний баланс депозиту. Використовується для розрахунку ризику при плануванні угод.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end', position: 'relative' }}>
              <div>
                <label style={labelStyle}>Баланс депозиту (USDT)</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" step="1" min="0" placeholder="10000" value={balance} onChange={e => setBalance(e.target.value)} style={{ ...inputStyle, paddingRight: 60 }} />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 600, color: subColor }}>USDT</span>
                </div>
              </div>
              <button onClick={saveBalance} disabled={balanceSaving} style={{
                ...glossyBtn('orange', balanceSaved ? 'saved' : balanceSaving ? 'saving' : 'normal'),
                padding: '10px 20px', whiteSpace: 'nowrap',
                color: dark ? '#000' : '#fff',
              }}>
                {balanceSaved ? '✓ Збережено' : balanceSaving ? '...' : 'Зберегти'}
              </button>
            </div>
            {balance && !isNaN(parseFloat(balance)) && (
              <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', position: 'relative' }}>
                {[1, 2, 3].map(pct => (
                  <div key={pct} style={{
                    background: inputBg, borderRadius: 10, padding: '8px 14px', fontSize: 12,
                    border: `1px solid ${inputBorder}`,
                  }}>
                    <span style={{ color: subColor }}>{pct}% ризику = </span>
                    <span style={{ fontWeight: 700, color: dark ? ORANGE : '#92400e' }}>{(parseFloat(balance) * pct / 100).toFixed(2)} USDT</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Зміна пароля */}
          <div style={glassCard(BLUE)}>
            {glare}
            <div style={{ fontSize: 16, fontWeight: 700, color: textColor, marginBottom: 6, position: 'relative' }}>🔑 Змінити пароль</div>
            <div style={{ fontSize: 13, color: subColor, marginBottom: 20, position: 'relative' }}>Введіть новий пароль для вашого акаунту.</div>
            {pwSaved && (
              <div style={{ background: dark ? `${GREEN}18` : '#e8f5ec', border: `1px solid ${dark ? GREEN + '44' : '#1a7a2e33'}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: dark ? GREEN : '#1a7a2e', fontWeight: 600, position: 'relative' }}>
                ✓ Пароль успішно змінено!
              </div>
            )}
            {pwError && (
              <div style={{ background: dark ? `${RED}12` : '#fde8e8', border: `1px solid ${dark ? RED + '33' : '#b91c1c33'}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: dark ? RED : '#b91c1c', position: 'relative' }}>
                {pwError}
              </div>
            )}
            <div style={{ display: 'grid', gap: 16, position: 'relative' }}>
              <div>
                <label style={labelStyle}>Новий пароль</label>
                <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPwError('') }} placeholder="••••••••" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Підтвердіть пароль</label>
                <input type="password" value={newPassword2} onChange={e => { setNewPassword2(e.target.value); setPwError('') }} placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && savePassword()}
                  style={{ ...inputStyle, border: `1px solid ${newPassword2 && newPassword !== newPassword2 ? dark ? RED + '66' : '#b91c1c55' : inputBorder}` }} />
                {newPassword2 && newPassword !== newPassword2 && (
                  <div style={{ fontSize: 11, color: dark ? RED : '#b91c1c', marginTop: 4 }}>Паролі не співпадають</div>
                )}
              </div>
              <button onClick={savePassword} disabled={pwSaving} style={glossyBtn('blue', pwSaved ? 'saved' : pwSaving ? 'saving' : 'normal')}>
                {pwSaved ? '✓ Збережено' : pwSaving ? 'Збереження...' : 'Змінити пароль'}
              </button>
            </div>
          </div>

          {/* Ризик-менеджмент */}
          <div style={glassCard()}>
            {glare}
            <div style={{ fontSize: 16, fontWeight: 700, color: textColor, marginBottom: 6, position: 'relative' }}>{tr('settings_risk')}</div>
            <div style={{ fontSize: 13, color: subColor, marginBottom: 20, position: 'relative' }}>{tr('settings_risk_sub')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, position: 'relative' }}>
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
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: dark ? `${BLUE}12` : '#e8f0fe', fontSize: 13, color: subColor, position: 'relative', border: `1px solid ${dark ? BLUE + '20' : '#1e40af22'}` }}>
              {tr('settings_risk_hint')}
            </div>
          </div>

          {/* Акаунт */}
          <div style={glassCard()}>
            {glare}
            <div style={{ fontSize: 16, fontWeight: 700, color: textColor, marginBottom: 6, position: 'relative' }}>{tr('settings_account')}</div>
            <div style={{ fontSize: 13, color: subColor, marginBottom: 16, position: 'relative' }}>{tr('settings_account_sub')}</div>
            <div style={{ position: 'relative' }}>
              {[
                { label: tr('settings_email'),  value: email },
                { label: tr('settings_status'), value: tr('settings_active') },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                  <span style={{ fontSize: 14, color: subColor }}>{row.label}</span>
                  <span style={{ fontSize: 14, color: textColor, fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <span style={{ fontSize: 14, color: subColor }}>{tr('settings_subscription')}</span>
                <a href="/billing" style={{ fontSize: 14, color: dark ? BLUE : '#1e40af', textDecoration: 'none', fontWeight: 600 }}>{tr('settings_manage')}</a>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div style={glassCard(RED)}>
            {glare}
            <div style={{ fontSize: 16, fontWeight: 700, color: dark ? RED : '#b91c1c', marginBottom: 6, position: 'relative' }}>{tr('settings_danger')}</div>
            <div style={{ fontSize: 13, color: subColor, marginBottom: 16, position: 'relative' }}>{tr('settings_danger_sub')}</div>
            {!deleteConfirm ? (
              <button onClick={() => setDeleteConfirm(true)} style={{
                background: dark ? `${RED}15` : '#fde8e8',
                color: dark ? RED : '#b91c1c',
                border: `1px solid ${dark ? RED + '44' : '#b91c1c33'}`,
                borderRadius: 12, padding: '10px 20px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: FONT, position: 'relative',
              }}>{tr('settings_logout')}</button>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
                <span style={{ fontSize: 13, color: subColor }}>{tr('settings_confirm')}</span>
                <button onClick={handleLogout} style={{
                  background: dark ? RED : 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  padding: '8px 16px', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: FONT,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}>{tr('settings_yes')}</button>
                <button onClick={() => setDeleteConfirm(false)} style={{
                  background: inputBg, color: textColor,
                  border: `1px solid ${inputBorder}`,
                  borderRadius: 10, padding: '8px 16px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                }}>{tr('settings_cancel')}</button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
