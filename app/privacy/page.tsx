'use client'
import { useState, useEffect } from 'react'
import NavBar from '@/components/layout/NavBar'

function useDark() {
  const [dark, setDark] = useState(true)
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

export default function PrivacyPage() {
  const dark = useDark()

  const bg = dark
    ? '#0a0a0b'
    : 'linear-gradient(135deg, #e8edf5 0%, #f0f2f7 50%, #e8f0ed 100%)'
  const textColor = dark ? '#f5f5f7' : '#1d1d1f'
  const subColor = dark ? '#8e8e93' : '#6e6e73'
  const borderColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  const card: React.CSSProperties = {
    background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: 20,
    border: `1px solid ${borderColor}`,
    boxShadow: dark
      ? 'inset 0 1px 0 rgba(255,255,255,0.1)'
      : 'inset 0 1px 0 rgba(255,255,255,0.95)',
    padding: '32px',
    marginBottom: 24,
  }

  const h2Style: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: textColor,
    marginBottom: 12,
    marginTop: 0,
  }

  const pStyle: React.CSSProperties = {
    fontSize: 15,
    color: subColor,
    lineHeight: 1.7,
    marginBottom: 12,
    marginTop: 0,
  }

  const liStyle: React.CSSProperties = {
    fontSize: 15,
    color: subColor,
    lineHeight: 1.7,
    marginBottom: 6,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: bg,
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      color: textColor,
    }}>
      <NavBar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px' }}>

        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: textColor, marginBottom: 8 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 15, color: subColor }}>Last updated: April 11, 2026</p>
        </div>

        <div style={card}>
          <p style={pStyle}>
            AurumTrade ("we", "our", or "us") is committed to protecting your personal data
            in accordance with the General Data Protection Regulation (GDPR) and applicable
            Polish law. This Privacy Policy explains how we collect, use, and safeguard your
            information when you use our service at{' '}
            <strong style={{ color: '#0a84ff' }}>aurumtrade.vercel.app</strong>.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            By using AurumTrade, you agree to the collection and use of information in
            accordance with this policy.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>1. Data Controller</h2>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            <strong style={{ color: textColor }}>AurumTrade</strong><br />
            Poland<br />
            Email:{' '}
            <a href="mailto:support.aurumtrade@gmail.com" style={{ color: '#0a84ff', textDecoration: 'none' }}>
              support.aurumtrade@gmail.com
            </a>
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>2. Information We Collect</h2>
          <p style={pStyle}>We collect the following categories of personal data:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={liStyle}><strong style={{ color: textColor }}>Account information</strong> — email address, name, and encrypted password upon registration</li>
            <li style={liStyle}><strong style={{ color: textColor }}>Trading data</strong> — trades, P&L figures, journal entries, emotions, screenshots, and playbook notes you voluntarily submit</li>
            <li style={liStyle}><strong style={{ color: textColor }}>Usage data</strong> — pages visited, features used, and interaction patterns to improve our service</li>
            <li style={liStyle}><strong style={{ color: textColor }}>Payment data</strong> — processed securely through Stripe; we do not store card details on our servers</li>
            <li style={liStyle}><strong style={{ color: textColor }}>Technical data</strong> — IP address, browser type, and device information</li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={h2Style}>3. Legal Basis for Processing (GDPR)</h2>
          <p style={pStyle}>We process your personal data on the following legal bases:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={liStyle}><strong style={{ color: textColor }}>Contract performance</strong> — to provide the AurumTrade service you signed up for</li>
            <li style={liStyle}><strong style={{ color: textColor }}>Legitimate interests</strong> — to improve our product, prevent fraud, and ensure security</li>
            <li style={liStyle}><strong style={{ color: textColor }}>Consent</strong> — for optional features such as marketing communications</li>
            <li style={liStyle}><strong style={{ color: textColor }}>Legal obligation</strong> — to comply with applicable laws and regulations</li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={h2Style}>4. How We Use Your Information</h2>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={liStyle}>To provide and maintain the AurumTrade service</li>
            <li style={liStyle}>To generate AI-powered trade analysis and coaching based on your trading data</li>
            <li style={liStyle}>To process payments and manage your subscription</li>
            <li style={liStyle}>To send transactional emails (account confirmation, password reset)</li>
            <li style={liStyle}>To improve and develop new features</li>
            <li style={liStyle}>To comply with legal obligations</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 12, marginBottom: 0 }}>
            We do <strong style={{ color: textColor }}>not</strong> sell your personal data to third parties. Ever.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>5. Third-Party Services</h2>
          <p style={pStyle}>We use the following trusted third-party processors:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={liStyle}><strong style={{ color: textColor }}>Supabase</strong> — database and authentication (supabase.com)</li>
            <li style={liStyle}><strong style={{ color: textColor }}>OpenAI</strong> — AI analysis of your trading data (openai.com)</li>
            <li style={liStyle}><strong style={{ color: textColor }}>Stripe</strong> — payment processing (stripe.com)</li>
            <li style={liStyle}><strong style={{ color: textColor }}>Vercel</strong> — hosting and deployment (vercel.com)</li>
            <li style={liStyle}><strong style={{ color: textColor }}>Google</strong> — optional OAuth login (google.com)</li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={h2Style}>6. Data Storage & Security</h2>
          <p style={pStyle}>
            Your data is stored securely on Supabase infrastructure with Row Level Security (RLS)
            enabled — only you can access your own data. All connections use HTTPS/TLS encryption.
            Trade screenshots are stored in secure Supabase Storage with authenticated access only.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            We retain your data for as long as your account is active. Upon account deletion,
            all personal data is permanently removed within 30 days.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>7. Public Profile</h2>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            If you choose to enable your public profile, certain statistical data (win rate,
            total P&L, top pairs, top setups) will be publicly visible via your profile link.
            No personal information (email or full name) is exposed. You can disable your
            public profile at any time from your Settings page.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>8. Your Rights Under GDPR</h2>
          <p style={pStyle}>As a data subject under GDPR, you have the right to:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={liStyle}><strong style={{ color: textColor }}>Access</strong> — request a copy of your personal data</li>
            <li style={liStyle}><strong style={{ color: textColor }}>Rectification</strong> — correct inaccurate or incomplete data</li>
            <li style={liStyle}><strong style={{ color: textColor }}>Erasure</strong> — request deletion of your account and all data ("right to be forgotten")</li>
            <li style={liStyle}><strong style={{ color: textColor }}>Portability</strong> — receive your data in a machine-readable format</li>
            <li style={liStyle}><strong style={{ color: textColor }}>Objection</strong> — object to processing based on legitimate interests</li>
            <li style={liStyle}><strong style={{ color: textColor }}>Restriction</strong> — request restriction of processing in certain circumstances</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 12, marginBottom: 0 }}>
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:support.aurumtrade@gmail.com" style={{ color: '#0a84ff', textDecoration: 'none' }}>
              support.aurumtrade@gmail.com
            </a>. We will respond within 30 days.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>9. Cookies</h2>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            We use only essential cookies necessary for authentication and session management
            (via Supabase). We do not use tracking or advertising cookies. Your dark/light
            mode preference is stored in localStorage on your device only.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>10. Changes to This Policy</h2>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            We may update this Privacy Policy from time to time. We will notify you of
            significant changes via email or a notice on our website. Continued use of
            AurumTrade after changes constitutes acceptance of the updated policy.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>11. Contact & Complaints</h2>
          <p style={pStyle}>
            For any privacy-related questions, contact us at:{' '}
            <a href="mailto:support.aurumtrade@gmail.com" style={{ color: '#0a84ff', textDecoration: 'none' }}>
              support.aurumtrade@gmail.com
            </a>
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            If you are located in the EU and believe we have not handled your data correctly,
            you have the right to lodge a complaint with the Polish supervisory authority:{' '}
            <strong style={{ color: textColor }}>UODO (Urząd Ochrony Danych Osobowych)</strong>{' '}
            — uodo.gov.pl
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <a href="/terms" style={{ color: '#0a84ff', textDecoration: 'none', fontSize: 15, marginRight: 32 }}>
            Terms of Service →
          </a>
          <a href="/" style={{ color: subColor, textDecoration: 'none', fontSize: 15 }}>
            Back to Home
          </a>
        </div>

      </div>
    </div>
  )
}
