'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0a0a0b',
      fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
    }}>
      <div style={{
        background: '#1c1c1e', borderRadius: 18, padding: '40px 36px',
        width: '100%', maxWidth: 400, border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            TradeLog <span style={{ color: '#30d158' }}>Pro</span>
          </h1>
          <p style={{ fontSize: 14, color: '#8e8e93' }}>Войдите в аккаунт</p>
        </div>

        {error && (
          <div style={{
            background: '#ff453a18', border: '1px solid #ff453a44',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            fontSize: 13, color: '#ff453a',
          }}>{error}</div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: '#8e8e93', display: 'block', marginBottom: 6 }}>Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '11px 14px', fontSize: 14,
              color: '#fff', outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: '#8e8e93', display: 'block', marginBottom: 6 }}>Пароль</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '11px 14px', fontSize: 14,
              color: '#fff', outline: 'none',
            }}
          />
        </div>

        <button onClick={handleLogin} disabled={loading} style={{
          width: '100%', background: '#fff', color: '#000',
          border: 'none', borderRadius: 12, padding: '12px',
          fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1, marginBottom: 12,
          fontFamily: 'inherit',
        }}>
          {loading ? 'Входим...' : 'Войти'}
        </button>

        <button onClick={handleGoogle} style={{
          width: '100%', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '12px',
          fontSize: 15, fontWeight: 600, cursor: 'pointer',
          color: '#fff', marginBottom: 24, fontFamily: 'inherit',
        }}>
          Google
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#8e8e93' }}>
          Нет аккаунта?{' '}
          <a href="/register" style={{ color: '#30d158', fontWeight: 600 }}>Зарегистрироваться</a>
        </p>
      </div>
    </div>
  )
}