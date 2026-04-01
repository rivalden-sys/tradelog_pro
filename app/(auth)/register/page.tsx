'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const FONT   = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
const NUNITO = "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif"

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: 'linear-gradient(135deg, #c9a84c 0%, #f5d77e 50%, #c9a84c 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 16px rgba(201,168,76,0.4)',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: NUNITO, fontSize: 16, fontWeight: 900, color: '#1a1100' }}>A</span>
      </div>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontFamily: NUNITO, fontSize: 15, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: '1.1' }}>AurumTrade</div>
        <div style={{ fontFamily: NUNITO, fontSize: 10, fontWeight: 500, color: '#c9a84c', letterSpacing: '0.04em', lineHeight: '1.1' }}>Pro Edition</div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name')
      return
    }
    setLoading(true)
    setError('')

    const username = `${firstName.trim()} ${lastName.trim()}`

    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: username },
      }
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    // Save username to users table
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email,
        username,
        plan: 'free',
      })
    }

    router.push('/dashboard')
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff', fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' as const,
    display: 'block' as const, marginBottom: 8,
    letterSpacing: '0.04em', textTransform: 'uppercase' as const,
  }

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#080808', fontFamily: FONT, position: 'relative', overflow: 'hidden',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@500;700;800&display=swap');`}</style>

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', left: '10%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(10,132,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo top left */}
      <div style={{ position: 'absolute', top: 24, left: 48 }}>
        <Logo />
      </div>

      {/* Card */}
      <div style={{
        width: 420, position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24, padding: '40px 36px',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 48px rgba(0,0,0,0.4)',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 100, padding: '5px 14px', marginBottom: 20,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c9a84c', boxShadow: '0 0 8px #c9a84c' }} />
            <span style={{ fontSize: 12, color: '#c9a84c', fontWeight: 600 }}>Free to start</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6 }}>Create account</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Start trading smarter today</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.25)',
            padding: '10px 14px', borderRadius: 10, marginBottom: 20,
            fontSize: 13, color: '#ff453a',
          }}>{error}</div>
        )}

        {/* First + Last Name row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>First Name</label>
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="John"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Last Name</label>
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Smith"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            style={inputStyle}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            style={inputStyle}
          />
        </div>

        {/* Register button */}
        <button
          onClick={handleRegister}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #c9a84c 0%, #f5d77e 50%, #c9a84c 100%)',
            color: '#1a1100',
            fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            boxShadow: loading ? 'none' : '0 0 30px rgba(201,168,76,0.3)',
            fontFamily: FONT, transition: 'all 0.2s',
          }}
        >
          {loading ? 'Creating account...' : 'Create account →'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          style={{
            width: '100%', padding: '13px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontFamily: FONT,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 14, marginTop: 24, color: 'rgba(255,255,255,0.3)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#c9a84c', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
