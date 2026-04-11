'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/hooks/useLocale'
import { createClient } from '@/lib/supabase/client'
import NavBar from '@/components/layout/NavBar'
import { DARK, LIGHT, BTN } from '@/lib/colors'

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

export default function SettingsPage() {
  const dark        = useDark()
  const { t: tr }   = useLocale()
  const router      = useRouter()

  const GREEN  = dark ? DARK.green  : LIGHT.green
  const RED    = dark ? DARK.red    : LIGHT.red
  const BLUE   = dark ? DARK.blue   : LIGHT.blue
  const ORANGE = dark ? DARK.orange : LIGHT.orange

  const textColor   = dark ? DARK.text   : LIGHT.text
  const subColor    = dark ? DARK.sub    : LIGHT.sub
  const borderColor = dark ? DARK.border : LIGHT.border

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
  const [copied,        setCopied]        = useState(false)

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
    if (!newPassword.trim())          { setPwError(tr('settings_pw_enter')); return }
    if (newPassword.length < 6)       { setPwError(tr('settings_pw_min')); return }
    if (newPassword !== newPassword2) { setPwError(tr('settings_pw_mismatch')); return }
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

  const publicProfileUrl = `https://aurumtrade.vercel.app/u/${email.split('@')[0]}`

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: dark ? DARK.inputBg : LIGHT.inputBg,
    border: `1px solid ${dark ? DARK.border : 'rgba(0,0,0,0.1)'}`,
    borderRadius: 10, padding: '10px 14px', fontSize: 14, color: textColor,
    outline: 'none', boxSizing: 'border-box', fontFamily: FONT,
    backdropFilter: 'blur(10px)',
    boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 2px 4px rgba(0,0,0,0.04)',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: subColor, marginBottom: 6, display: 'block',
    fontWeight: 600, letterSpacing: '0.02em',
  }

  const glossyBtn = (color: 'green' | 'blue' | 'orange', state: 'normal' | 'saved' | 'saving'): React.CSSProperties => {
    const isSaving = state === 'saving'
    const isSaved  = state === 'saved'
    const bgMap = {
      green:  { dark: DARK.green,  light: BTN.green  },
      blue:   { dark: DARK.blue,   light: BTN.blue   },
      orange: { dark: DARK.orange, light: BTN.orange  },
    }
    return {
      background: isSaving
        ? dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
        : isSaved ? dark ? DARK.green : BTN.green
        : dark ? bgMap[color].dark : bgMap[color].light,
      color: isSaving ? subColor : '#fff',
      border: 'none', borderRadius: 12, padding: '12px',
      fontSize: 14, fontWeight: 700,
      cursor: isSaving ? 'not-allowed' : 'pointer',
      fontFamily: FONT, transition: 'all 0.3s',
      boxShadow: isSaving ? 'none' : BTN.shadow,
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
    <div style={{ minHeight: '100vh', background: dark ? DARK.bg : LIGHT.bg, fontFamily: FONT }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: subColor }}>{tr('settings_loading')}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: dark ? DARK.bg : LIGHT.bg }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: noiseSvg, opacity: dark ? 0.35 : 0.15 }} />
      <div style={{ position: 'fixed', top: -200, left: '30%', width: 600, height: 600, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(48,209,88,0.06) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(10,132,255,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -200, right: '10%', width: 500, height: 500, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(10,132,255,0.04) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(48,209,88,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px', display: 'grid', gap: 16 }}>

          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: textColor, letterSpacing: '-0.04em' }}>{tr('settings_title')}</div>
            <div style={{ fontSize: 13, color: subColor, marginTop: 2 }}>{tr('settings_subtitle')}</div>
          </div>

          {/* Profile */}
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

          {/* Deposit */}
          <div style={glassCard(ORANGE)}>
            {glare}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, position: 'relative' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: textColor }}>{tr('settings_deposit_title')}</div>
              <span style={{ background: dark ? DARK.orange + '22' : LIGHT.orangeBg, color: ORANGE, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>USDT</span>
            </div>
            <div style={{ fontSize: 13, color: subColor, marginBottom: 20, position: 'relative' }}>
              {tr('settings_deposit_sub')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end', position: 'relative' }}>
              <div>
                <label style={labelStyle}>{tr('settings_deposit_label')}</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" step="1" min="0" placeholder="10000" value={balance} onChange={e => setBalance(e.target.value)} style={{ ...inputStyle, paddingRight: 60 }} />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 600, color: subColor }}>USDT</span>
                </div>
              </div>
              <button onClick={saveBalance} disabled={balanceSaving} style={{
                ...glossyBtn('orange', balanceSaved ? 'saved' : balanceSaving ? 'saving' : 'normal'),
                padding: '10px 20px', whiteSpace: 'nowrap',
              }}>
                {balanceSaved ? tr('settings_deposit_saved') : balanceSaving ? tr('settings_deposit_saving') : tr('settings_deposit_save')}
              </button>
            </div>
            {balance && !isNaN(parseFloat(balance)) && (
              <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', position: 'relative' }}>
                {[1, 2, 3].map(pct => (
                  <div key={pct} style={{ background: dark ? DARK.inputBg : LIGHT.inputBg, borderRadius: 10, padding: '8px 14px', fontSize: 12, border: `1px solid ${dark ? DARK.border : 'rgba(0,0,0,0.1)'}` }}>
                    <span style={{ color: subColor }}>{pct}% = </span>
                    <span style={{ fontWeight: 700, color: ORANGE }}>{(parseFloat(balance) * pct / 100).toFixed(2)} USDT</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Change Password */}
          <div style={glassCard(BLUE)}>
            {glare}
            <div style={{ fontSize: 16, fontWeight: 700, color: textColor, marginBottom: 6, position: 'relative' }}>{tr('settings_pw_title')}</div>
            <div style={{ fontSize: 13, color: subColor, marginBottom: 20, position: 'relative' }}>{tr('settings_pw_sub')}</div>
            {pwSaved && (
              <div style={{ background: dark ? `${DARK.green}18` : LIGHT.greenBg, border: `1px solid ${GREEN}33`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: GREEN, fontWeight: 600, position: 'relative' }}>
                {tr('settings_pw_saved')}
              </div>
            )}
            {pwError && (
              <div style={{ background: dark ? `${DARK.red}12` : LIGHT.redBg, border: `1px solid ${RED}33`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: RED, position: 'relative' }}>
                {pwError}
              </div>
            )}
            <div style={{ display: 'grid', gap: 16, position: 'relative' }}>
              <div>
                <label style={labelStyle}>{tr('settings_pw_new')}</label>
                <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPwError('') }} placeholder="••••••••" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{tr('settings_pw_confirm')}</label>
                <input type="password" value={newPassword2} onChange={e => { setNewPassword2(e.target.value); setPwError('') }} placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && savePassword()}
                  style={{ ...inputStyle, border: `1px solid ${newPassword2 && newPassword !== newPassword2 ? RED + '66' : dark ? DARK.border : 'rgba(0,0,0,0.1)'}` }} />
                {newPassword2 && newPassword !== newPassword2 && (
                  <div style={{ fontSize: 11, color: RED, marginTop: 4 }}>{tr('settings_pw_mismatch')}</div>
                )}
              </div>
              <button onClick={savePassword} disabled={pwSaving} style={glossyBtn('blue', pwSaved ? 'saved' : pwSaving ? 'saving' : 'normal')}>
                {pwSaved ? tr('settings_saved') : pwSaving ? tr('settings_pw_saving') : tr('settings_pw_btn')}
              </button>
            </div>
          </div>

          {/* Risk Management */}
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
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: dark ? `${DARK.blue}12` : LIGHT.blueBg, fontSize: 13, color: subColor, position: 'relative', border: `1px solid ${BLUE}22` }}>
              {tr('settings_risk_hint')}
            </div>
          </div>

          {/* Account */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <span style={{ fontSize: 14, color: subColor }}>{tr('settings_subscription')}</span>
                <a href="/billing" style={{ fontSize: 14, color: BLUE, textDecoration: 'none', fontWeight: 600 }}>{tr('settings_manage')}</a>
              </div>

              {/* Public Profile */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <span style={{ fontSize: 14, color: subColor }}>🌐 Public Profile</span>
                  <div style={{ fontSize: 11, color: subColor, opacity: 0.6, marginTop: 2 }}>
                    aurumtrade.vercel.app/u/{email.split('@')[0]}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  
                    href={publicProfileUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      color: subColor,
                      border: `1px solid ${dark ? DARK.border : 'rgba(0,0,0,0.08)'}`,
                      borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: FONT, textDecoration: 'none',
                    }}
                  >
                    View
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(publicProfileUrl)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    style={{
                      background: copied ? (dark ? `${DARK.green}22` : LIGHT.greenBg) : dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      color: copied ? GREEN : subColor,
                      border: `1px solid ${copied ? GREEN + '44' : dark ? DARK.border : 'rgba(0,0,0,0.08)'}`,
                      borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: FONT, transition: 'all 0.2s',
                    }}
                  >
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div style={glassCard(RED)}>
            {glare}
            <div style={{ fontSize: 16, fontWeight: 700, color: RED, marginBottom: 6, position: 'relative' }}>{tr('settings_danger')}</div>
            <div style={{ fontSize: 13, color: subColor, marginBottom: 16, position: 'relative' }}>{tr('settings_danger_sub')}</div>
            {!deleteConfirm ? (
              <button onClick={() => setDeleteConfirm(true)} style={{
                background: dark ? `${DARK.red}15` : LIGHT.redBg, color: RED,
                border: `1px solid ${RED}44`, borderRadius: 12, padding: '10px 20px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, position: 'relative',
              }}>{tr('settings_logout')}</button>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
                <span style={{ fontSize: 13, color: subColor }}>{tr('settings_confirm')}</span>
                <button onClick={handleLogout} style={{ background: dark ? DARK.red : BTN.red, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, boxShadow: BTN.shadow }}>{tr('settings_yes')}</button>
                <button onClick={() => setDeleteConfirm(false)} style={{ background: dark ? DARK.inputBg : LIGHT.inputBg, color: textColor, border: `1px solid ${dark ? DARK.border : 'rgba(0,0,0,0.1)'}`, borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{tr('settings_cancel')}</button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
