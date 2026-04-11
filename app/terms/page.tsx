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

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p style={{ fontSize: 15, color: subColor }}>Last updated: April 11, 2026</p>
        </div>

        <div style={card}>
          <p style={pStyle}>
            These Terms of Service ("Terms") govern your use of AurumTrade ("Service"),
            operated by AurumTrade, based in Poland. By accessing or using our Service,
            you agree to be bound by these Terms.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            If you do not agree to these Terms, please do not use AurumTrade.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>1. Description of Service</h2>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            AurumTrade is an AI-powered trading journal for cryptocurrency traders. The Service
            allows users to log trades, analyze performance, receive AI-powered coaching, manage
            playbooks, track goals, and simulate future performance. AurumTrade is available at{' '}
            <strong style={{ color: '#0a84ff' }}>aurumtrade.vercel.app</strong>.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>2. Accounts</h2>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={liStyle}>You must be at least 18 years old to use AurumTrade</li>
            <li style={liStyle}>You are responsible for maintaining the security of your account credentials</li>
            <li style={liStyle}>You must provide accurate information during registration</li>
            <li style={liStyle}>One person may not maintain more than one free account</li>
            <li style={liStyle}>You are responsible for all activity that occurs under your account</li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={h2Style}>3. Free and Pro Plans</h2>
          <p style={pStyle}>AurumTrade offers two plans:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={liStyle}>
              <strong style={{ color: textColor }}>Free Plan</strong> — up to 20 trades,
              basic analytics, no AI features
            </li>
            <li style={liStyle}>
              <strong style={{ color: textColor }}>Pro Plan</strong> — $19/month, unlimited
              trades, full AI features (Coach, Psychology, Trade Review, Chat)
            </li>
          </ul>
          <p style={{ ...pStyle, marginTop: 12, marginBottom: 0 }}>
            We reserve the right to modify pricing with 30 days notice to existing subscribers.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>4. Payments & Subscriptions</h2>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={liStyle}>Pro subscriptions are billed monthly via Stripe</li>
            <li style={liStyle}>Subscriptions automatically renew unless cancelled before the renewal date</li>
            <li style={liStyle}>You can cancel your subscription at any time from the Billing page</li>
            <li style={liStyle}>No refunds are provided for partial months</li>
            <li style={liStyle}>All payments are processed securely by Stripe — we do not store payment details</li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={h2Style}>5. Acceptable Use</h2>
          <p style={pStyle}>You agree not to:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={liStyle}>Use the Service for any unlawful purpose</li>
            <li style={liStyle}>Attempt to gain unauthorized access to any part of the Service</li>
            <li style={liStyle}>Reverse engineer, decompile, or disassemble any part of the Service</li>
            <li style={liStyle}>Upload malicious code or interfere with the Service's operation</li>
            <li style={liStyle}>Use automated means to scrape or access the Service without permission</li>
            <li style={liStyle}>Resell or sublicense access to the Service</li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={h2Style}>6. AI Features & No Financial Advice</h2>
          <p style={pStyle}>
            AurumTrade uses artificial intelligence (OpenAI GPT-4o) to provide trading analysis,
            coaching, and psychological insights. These features are for{' '}
            <strong style={{ color: textColor }}>educational and analytical purposes only</strong>.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            <strong style={{ color: '#ff453a' }}>
              AurumTrade does not provide financial advice, investment recommendations, or trading
              signals. We are not responsible for any trading decisions or financial losses resulting
              from use of our Service.
            </strong>{' '}
            Always consult a qualified financial advisor before making investment decisions.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>7. User Content</h2>
          <p style={pStyle}>
            You retain ownership of all trading data, notes, and content you submit to AurumTrade.
            By submitting content, you grant us a limited license to process and store it for the
            purpose of providing the Service, including passing relevant data to OpenAI for AI analysis.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            You are responsible for ensuring you have the right to submit any content you upload,
            including trade screenshots.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>8. Public Profiles</h2>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            If you enable a public profile, your trading statistics become publicly accessible.
            You are responsible for the content of your public profile. We reserve the right to
            disable public profiles that violate these Terms.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>9. Service Availability</h2>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            We strive for high availability but do not guarantee uninterrupted access to the Service.
            We may perform maintenance, updates, or experience downtime beyond our control. We are
            not liable for any losses resulting from Service unavailability.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>10. Limitation of Liability</h2>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            To the maximum extent permitted by applicable law, AurumTrade shall not be liable
            for any indirect, incidental, special, or consequential damages, including loss of
            profits or trading losses, arising from your use of the Service. Our total liability
            shall not exceed the amount you paid us in the 12 months preceding the claim.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>11. Termination</h2>
          <p style={pStyle}>
            You may delete your account at any time. We may suspend or terminate your account
            if you violate these Terms, with or without notice.
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            Upon termination, your right to use the Service ceases immediately. Your data will
            be deleted within 30 days unless retention is required by law.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>12. Governing Law</h2>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            These Terms are governed by the laws of Poland. Any disputes arising from these
            Terms shall be subject to the exclusive jurisdiction of Polish courts.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>13. Changes to Terms</h2>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            We may update these Terms from time to time. We will notify users of material
            changes via email or a prominent notice on our website at least 14 days before
            the changes take effect. Continued use after changes constitutes acceptance.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2Style}>14. Contact</h2>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            Questions about these Terms? Contact us at:{' '}
            <a href="mailto:support.aurumtrade@gmail.com" style={{ color: '#0a84ff', textDecoration: 'none' }}>
              support.aurumtrade@gmail.com
            </a>
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <a href="/privacy" style={{ color: '#0a84ff', textDecoration: 'none', fontSize: 15, marginRight: 32 }}>
            Privacy Policy →
          </a>
          <a href="/" style={{ color: subColor, textDecoration: 'none', fontSize: 15 }}>
            Back to Home
          </a>
        </div>

      </div>
    </div>
  )
}
