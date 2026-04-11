'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const FONT   = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
const NUNITO = "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif"

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
        <rect x="0"  y="13" width="4" height="9"  rx="2" fill="#30d158" opacity="0.4"/>
        <rect x="5"  y="9"  width="4" height="13" rx="2" fill="#30d158" opacity="0.62"/>
        <rect x="10" y="4"  width="4" height="18" rx="2" fill="#30d158" opacity="0.82"/>
        <rect x="15" y="0"  width="4" height="22" rx="2" fill="#30d158"/>
      </svg>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontFamily: NUNITO, fontSize: 15, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: '1.1' }}>TradeLog</div>
        <div style={{ fontFamily: NUNITO, fontSize: 10, fontWeight: 500, color: '#30d158', letterSpacing: '0.04em', lineHeight: '1.1' }}>Pro Edition</div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const supabase = createClient()

  const handleReset = async () => {
    if (!email.trim()) { setError('Введіть email'); return }
    setLoading(true)
    setError('')
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
    captchaToken: undefined,
   })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
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
        background: 'radial-gradient(circle, rgba(48,209,88,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <Link href="/" style={{ position: 'absolute', top: 24, left: 48, textDecoration: 'none' }}>
       <Logo />
      </Link>

      {/* Card */}
      <div style={{
        width: 420, position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24, padding: '40px 36px',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 48px rgba(0,0,0,0.4)',
      }}>

        {!sent ? (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: 24,
              }}>🔑</div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 8 }}>
                Forgot password?
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                Enter your email and we'll send you a link to reset your password
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.25)',
                padding: '10px 14px', borderRadius: 10, marginBottom: 20,
                fontSize: 13, color: '#ff453a',
              }}>{error}</div>
            )}

            {/* Email */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                onKeyDown={e => e.key === 'Enter' && handleReset()}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Button */}
            <button
              onClick={handleReset}
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: '#0a84ff', color: '#fff',
                fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: loading ? 'none' : '0 0 30px rgba(10,132,255,0.25)',
                fontFamily: FONT, transition: 'all 0.2s',
              }}
            >
              {loading ? 'Sending...' : 'Send reset link →'}
            </button>

            {/* Back to login */}
            <p style={{ textAlign: 'center', fontSize: 14, marginTop: 24, color: 'rgba(255,255,255,0.3)' }}>
              Remember your password?{' '}
              <Link href="/login" style={{ color: '#30d158', fontWeight: 600, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </>
        ) : (
          /* Success state */
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: 'rgba(48,209,88,0.15)', border: '1px solid rgba(48,209,88,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: 30,
            }}>✉️</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 12 }}>
              Check your email
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 8 }}>
              We sent a reset link to
            </p>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#30d158', marginBottom: 28 }}>
              {email}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 28 }}>
              The link expires in 60 minutes. Check your spam folder if you don't see it.
            </p>
            <Link href="/login" style={{
              display: 'block', padding: '13px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600,
              textAlign: 'center',
            }}>
              ← Back to sign in
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
