'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
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

const GREEN = '#30d158'
const RED   = '#ff453a'
const BLUE  = '#0a84ff'

function card(t: ReturnType<typeof th>): React.CSSProperties {
  return {
    background: t.surface, borderRadius: 18, padding: '22px 24px',
    boxShadow: t.shadow, border: `1px solid ${t.border}`,
  }
}

export default function SettingsPage() {
  const { dark } = useTheme()
  const t = th(dark)
  const router = useRouter()

  const [email,         setEmail]         = useState('')
  const [username,      setUsername]      = useState('')
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const [maxRiskPct, setMaxRiskPct] = useState('1')
  const [minRR,      setMinRR]      = useState('1.5')
  const [dailyLoss,  setDailyLoss]  = useState('3')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email || '')
      setUsername(user.user_metadata?.username || user.email?.split('@')[0] || '')
      setLoading(false)
    }
    load()
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.auth.updateUser({ data: { username } })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDeleteAccount = async () => {
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: t.sub }}>
        Загрузка...
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: FONT, transition: 'background 0.3s' }}>
      <NavBar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px', display: 'grid', gap: 20 }}>

        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.04em' }}>Настройки</div>
          <div style={{ fontSize: 13, color: t.sub, marginTop: 2 }}>Профиль и параметры трейдинга</div>
        </div>

        {/* Profile */}
        <div style={card(t)}>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 20 }}>Профиль</div>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input value={email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={labelStyle}>Имя пользователя</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Твоё имя"
                style={inputStyle}
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              style={{
                background: saved ? GREEN : t.text,
                color: saved ? '#fff' : t.bg,
                border: 'none', borderRadius: 12, padding: '12px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                transition: 'background 0.3s', fontFamily: FONT,
              }}
            >
              {saved ? '✓ Сохранено' : saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        </div>

        {/* Risk Management */}
        <div style={card(t)}>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6 }}>Риск-менеджмент</div>
          <div style={{ fontSize: 13, color: t.sub, marginBottom: 20 }}>Параметры контроля рисков</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Макс. риск на сделку %</label>
              <input type="number" step="0.1" min="0.1" max="10" value={maxRiskPct} onChange={e => setMaxRiskPct(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Мин. R:R</label>
              <input type="number" step="0.1" min="0.5" max="10" value={minRR} onChange={e => setMinRR(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Дневной лимит потерь %</label>
              <input type="number" step="0.5" min="1" max="20" value={dailyLoss} onChange={e => setDailyLoss(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: `${BLUE}12`, fontSize: 13, color: t.sub }}>
            💡 Эти параметры отображаются для справки. В будущих версиях они будут использоваться для предупреждений при добавлении сделок.
          </div>
        </div>

        {/* Account info */}
        <div style={card(t)}>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6 }}>Информация об аккаунте</div>
          <div style={{ fontSize: 13, color: t.sub, marginBottom: 16 }}>Данные подписки и аккаунта</div>
          <div style={{ display: 'grid', gap: 0 }}>
            {[
              { label: 'Email',  value: email     },
              { label: 'Статус', value: 'Активен' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontSize: 14, color: t.sub }}>{row.label}</span>
                <span style={{ fontSize: 14, color: t.text, fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <span style={{ fontSize: 14, color: t.sub }}>Подписка</span>
              <a href="/billing" style={{ fontSize: 14, color: BLUE, textDecoration: 'none', fontWeight: 600 }}>Управление →</a>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ ...card(t), border: `1px solid ${RED}44` }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: RED, marginBottom: 6 }}>Опасная зона</div>
          <div style={{ fontSize: 13, color: t.sub, marginBottom: 16 }}>Необратимые действия</div>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              style={{
                background: `${RED}18`, color: RED, border: `1px solid ${RED}44`,
                borderRadius: 12, padding: '10px 20px', fontSize: 14,
                fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
              }}
            >
              Выйти из аккаунта
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: t.sub }}>Вы уверены?</span>
              <button
                onClick={handleDeleteAccount}
                style={{ background: RED, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
              >Да, выйти</button>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{ background: t.surface2, color: t.text, border: `1px solid ${t.border}`, borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
              >Отмена</button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}