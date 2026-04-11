'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const FONT   = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
const NUNITO = "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif"

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
      <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
        <rect x="0" y="0" width="28" height="28" rx="8" fill="rgba(48,209,88,0.12)" />
        <rect x="0" y="0" width="28" height="28" rx="8" stroke="rgba(48,209,88,0.35)" strokeWidth="1" />
        <path d="M14 6L20.5 22H17.8L16.2 18H11.8L10.2 22H7.5L14 6Z" fill="#30d158" />
        <path d="M12.7 15.5H15.3L14 11.5L12.7 15.5Z" fill="#0a0a0b" />
        <circle cx="14" cy="6" r="1.5" fill="#f5c842" />
      </svg>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontFamily: NUNITO, fontSize: 15, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: '1.1' }}>
          Aurum<span style={{ color: '#30d158' }}>Trade</span>
        </div>
        <div style={{ fontFamily: NUNITO, fontSize: 9, fontWeight: 600, color: 'rgba(245,200,66,0.8)', letterSpacing: '0.08em', lineHeight: '1.1', textTransform: 'uppercase' }}>Pro Edition</div>
      </div>
    </div>
  )
}

function ResetPasswordForm() {
  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')
  const [ready,     setReady]     = useState(false)

  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setReady(true)
        return
      }

      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        const params    = new URLSearchParams(hash.substring(1))
        const tokenHash = params.get('access_token')
        const type      = params.get('type')

        if (tokenHash && type === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          })
          if (!error) {
            window.history.replaceState(null, '', window.location.pathname)
            setReady(true)
            return
          } else {
            setError(`verifyOtp error: ${error.message}`)
            return
          }
        }
      }

      setError('Link expired or invalid. Please request a new one.')
    }

    init()
  }, [])

  const handleSave = async () => {
    if (!password.trim()) { setError('Введіть новий пароль'); return }
    if (password.length < 6) { setError('Мінімум 6 символів'); return }
    if (password !== password2) { setError('Паролі не співпадають'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <div style={{
      width: 420, position: 'relative', zIndex: 1,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 24, padding: '40px 36px',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 48px rgba(0,0,0,0.4)',
    }}>
      {done ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'rgba(48,209,88,0.15)', border: '1px solid rgba(48,209,88,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 30,
          }}>✅</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 12 }}>Password updated!</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Redirecting to sign in...</p>
        </div>

      ) : !ready ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: error ? 'rgba(255,69,58,0.15)' : 'rgba(255,159,10,0.15)',
            border: `1px solid ${error ? 'rgba(255,69,58,0.25)' : 'rgba(255,159,10,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 24,
          }}>{error ? '❌' : '⏳'}</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 8 }}>
            {error ? 'Link invalid' : 'Verifying link...'}
          </h1>
          {error && (
            <div style={{
              background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.25)',
              padding: '10px 14px', borderRadius: 10, marginTop: 16,
              fontSize: 13, color: '#ff453a',
            }}>{error}</div>
          )}
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 16 }}>
            <span onClick={() => router.push('/forgot-password')} style={{ color: '#30d158', cursor: 'pointer', fontWeight: 600 }}>
              Request a new link
            </span>
          </p>
        </div>

      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'rgba(48,209,88,0.15)', border: '1px solid rgba(48,209,88,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 24,
            }}>🔒</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 8 }}>New password</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Choose a strong password</p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.25)',
              padding: '10px 14px', borderRadius: 10, marginBottom: 20,
              fontSize: 13, color: '#ff453a',
            }}>{error}</div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>New password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Confirm password</label>
            <input
              type="password" value={password2} onChange={e => setPassword2(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${password2 && password !== password2 ? 'rgba(255,69,58,0.4)' : 'rgba(255,255,255,0.1)'}`, background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
            {password2 && password !== password2 && (
              <div style={{ fontSize: 12, color: '#ff453a', marginTop: 6 }}>Passwords don't match</div>
            )}
          </div>

          <button
            onClick={handleSave} disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#30d158', color: '#000', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: loading ? 'none' : '0 0 30px rgba(48,209,88,0.25)', fontFamily: FONT, transition: 'all 0.2s' }}
          >
            {loading ? 'Saving...' : 'Save new password →'}
          </button>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#080808', fontFamily: FONT, position: 'relative', overflow: 'hidden',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@500;700;800&display=swap');`}</style>
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(48,209,88,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <Link href="/" style={{ position: 'absolute', top: 24, left: 48, textDecoration: 'none' }}>
       <Logo />
      </Link>
      <Suspense fallback={
        <div style={{ width: 420, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '40px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </main>
  )
}
