'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    onScroll()
    window.addEventListener('scroll', onScroll)
    window.addEventListener('resize', checkMobile)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return (
    <main style={{ background: '#080808', minHeight: '100vh', color: '#fff', fontFamily: FONT, overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(8,8,8,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.4s ease',
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.04em' }}>
          TradeLog <span style={{ color: '#30d158' }}>Pro</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/login" style={{
            padding: '8px 16px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 500,
          }}>Log in</Link>
          <Link href="/register" style={{
            padding: '8px 16px', borderRadius: 10,
            background: '#30d158', color: '#000',
            textDecoration: 'none', fontSize: 13, fontWeight: 700,
          }}>Start free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', padding: isMobile ? '100px 20px 60px' : '120px 24px 80px',
      }}>
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
          width: isMobile ? 300 : 600, height: isMobile ? 300 : 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(48,209,88,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ textAlign: 'center', maxWidth: 800, position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 24,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#30d158', boxShadow: '0 0 8px #30d158' }} />
            <span style={{ fontSize: 12, color: '#30d158', fontWeight: 600 }}>AI-powered trading journal</span>
          </div>

          <h1 style={{
            fontSize: isMobile ? 42 : 72, fontWeight: 900, lineHeight: 1.05,
            letterSpacing: '-0.04em', marginBottom: 20,
            background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Trade smarter.<br />
            <span style={{
              background: 'linear-gradient(135deg, #30d158, #34d399)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Grow faster.</span>
          </h1>

          <p style={{
            fontSize: isMobile ? 16 : 20, color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.6, maxWidth: 560, margin: '0 auto 36px',
          }}>
            A trading journal with AI coaching, psychological analysis, Trade Score and AI Chat. Stop losing money on the same mistakes.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              padding: isMobile ? '14px 28px' : '16px 36px', borderRadius: 14,
              background: '#30d158', color: '#000',
              textDecoration: 'none', fontSize: isMobile ? 15 : 16, fontWeight: 800,
              boxShadow: '0 0 40px rgba(48,209,88,0.3)',
            }}>Start for free →</Link>
            <Link href="/login" style={{
              padding: isMobile ? '14px 28px' : '16px 36px', borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', textDecoration: 'none', fontSize: isMobile ? 15 : 16, fontWeight: 500,
              background: 'rgba(255,255,255,0.04)',
            }}>Log in</Link>
          </div>

          <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            Free up to 20 trades · No credit card required
          </p>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: isMobile ? '0 16px 60px' : '0 48px 100px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 12 : 16,
        }}>
          {[
            { value: '12,430+', label: 'Trades logged' },
            { value: '57%',     label: 'Average win rate' },
            { value: '84k',     label: 'AI insights generated' },
            { value: '2,300+',  label: 'Active traders' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, padding: isMobile ? '20px 16px' : '28px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: isMobile ? 12 : 14, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: isMobile ? '0 16px 80px' : '0 48px 120px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
          <div style={{ fontSize: 12, color: '#30d158', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Features</div>
          <h2 style={{
            fontSize: isMobile ? 32 : 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 14,
            background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Everything you need to grow</h2>
          <p style={{ fontSize: isMobile ? 15 : 18, color: 'rgba(255,255,255,0.4)', maxWidth: 500, margin: '0 auto' }}>
            Not just a journal — a full AI coach that sees your patterns
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 12 : 20,
        }}>
          {[
            { icon: '📊', title: 'Trade Journal',       desc: 'All fields a real trader needs: setup, RR, direction, result, screenshot, self-grade.',             color: '#0a84ff' },
            { icon: '🧠', title: 'AI Coach',            desc: 'Analyzes your full journal: best setup, worst setup, main mistake, concrete next steps.',            color: '#30d158' },
            { icon: '🎯', title: 'Trade Score',         desc: 'AI estimates the probability of success before you enter, based on your own history.',              color: '#ff9f0a' },
            { icon: '🧬', title: 'Psychology Analysis', desc: 'Reads comments and detects fear, greed, revenge trading patterns automatically.',                    color: '#bf5af2' },
            { icon: '💬', title: 'AI Chat',             desc: 'Ask questions about your journal — AI answers with insights based on your actual trade data.',       color: '#30d158' },
            { icon: '📈', title: 'Advanced Analytics',  desc: 'Win rate by setup, P&L by pair, discipline calculator, RR distribution.',                          color: '#ff453a' },
            { icon: '🕐', title: 'Analysis History',    desc: 'All AI analyses are saved. Come back anytime and load any previous session.',                       color: '#0a84ff' },
            { icon: '🌙', title: 'Dark mode & i18n',    desc: 'Light and dark theme. Interface available in English and Ukrainian.',                               color: '#636366' },
            { icon: '🔒', title: 'Free / Pro plans',    desc: 'Start for free with up to 20 trades. Upgrade to Pro for unlimited trades and all AI features.',    color: '#ff9f0a' },
          ].map(f => (
            <div key={f.title} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, padding: isMobile ? '20px' : '32px 28px',
              display: isMobile ? 'flex' : 'block', alignItems: isMobile ? 'flex-start' : undefined, gap: isMobile ? 14 : undefined,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: isMobile ? 0 : 16,
              }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, marginBottom: 6, color: '#fff' }}>{f.title}</div>
                <div style={{ fontSize: isMobile ? 13 : 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: isMobile ? '0 16px 80px' : '0 48px 120px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
          <div style={{ fontSize: 12, color: '#0a84ff', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>How it works</div>
          <h2 style={{
            fontSize: isMobile ? 32 : 48, fontWeight: 900, letterSpacing: '-0.04em',
            background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Three steps to results</h2>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 12 : 2,
        }}>
          {[
            { num: '01', title: 'Log your trades', desc: 'Fill in all fields: setup, RR, direction, result, screenshot, comment and self-grade.', color: '#30d158' },
            { num: '02', title: 'AI analyzes',     desc: 'Run AI Coach, get Trade Score, chat with AI — it knows your journal and gives specific advice.', color: '#0a84ff' },
            { num: '03', title: 'Grow as a trader',desc: 'Follow concrete AI steps. Watch your win rate and discipline improve month over month.', color: '#ff9f0a' },
          ].map((s, i) => (
            <div key={s.num} style={{
              background: i === 1 ? 'rgba(10,132,255,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${i === 1 ? 'rgba(10,132,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 20, padding: isMobile ? '24px 20px' : '40px 32px',
            }}>
              <div style={{ fontSize: isMobile ? 40 : 52, fontWeight: 900, color: s.color, opacity: 0.3, letterSpacing: '-0.05em', marginBottom: 12 }}>{s.num}</div>
              <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, marginBottom: 10, color: '#fff' }}>{s.title}</div>
              <div style={{ fontSize: isMobile ? 13 : 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: isMobile ? '0 16px 80px' : '0 48px 120px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
          <div style={{ fontSize: 12, color: '#ff9f0a', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Pricing</div>
          <h2 style={{
            fontSize: isMobile ? 32 : 48, fontWeight: 900, letterSpacing: '-0.04em',
            background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Start for free</h2>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 12 : 20,
        }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: isMobile ? '28px 20px' : '40px 36px' }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Free</div>
            <div style={{ fontSize: isMobile ? 40 : 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 4 }}>$0</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 28 }}>forever</div>
            {['Up to 20 trades', 'Basic analytics', 'Dashboard', 'Dark mode & i18n'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>✓</div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
              </div>
            ))}
            <Link href="/register" style={{ display: 'block', textAlign: 'center', marginTop: 28, padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Get started →</Link>
          </div>

          <div style={{ background: 'rgba(48,209,88,0.06)', border: '1px solid rgba(48,209,88,0.25)', borderRadius: 24, padding: isMobile ? '28px 20px' : '40px 36px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, background: '#30d158', color: '#000', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 100 }}>RECOMMENDED</div>
            <div style={{ fontSize: 14, color: '#30d158', marginBottom: 8, fontWeight: 600 }}>Pro ⚡</div>
            <div style={{ fontSize: isMobile ? 40 : 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 4 }}>$19</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 28 }}>per month</div>
            {['Unlimited trades', 'Advanced analytics', 'AI Coach', 'AI Trade Score', 'AI Psychology Analysis', 'AI Chat', 'Analysis history saved', 'Priority support'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(48,209,88,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#30d158', flexShrink: 0 }}>✓</div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{f}</span>
              </div>
            ))}
            <Link href="/register" style={{ display: 'block', textAlign: 'center', marginTop: 28, padding: '13px', borderRadius: 12, background: '#30d158', color: '#000', textDecoration: 'none', fontSize: 14, fontWeight: 800, boxShadow: '0 0 30px rgba(48,209,88,0.25)' }}>Start Pro →</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: isMobile ? '0 16px 80px' : '0 48px 120px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ background: 'rgba(48,209,88,0.06)', border: '1px solid rgba(48,209,88,0.15)', borderRadius: 28, padding: isMobile ? '40px 20px' : '64px 48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(48,209,88,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <h2 style={{
            fontSize: isMobile ? 28 : 42, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 14,
            background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', position: 'relative',
          }}>Ready to trade smarter?</h2>
          <p style={{ fontSize: isMobile ? 14 : 18, color: 'rgba(255,255,255,0.4)', marginBottom: 28, position: 'relative' }}>
            Join traders who are already using AI to improve their results
          </p>
          <Link href="/register" style={{
            padding: isMobile ? '14px 32px' : '16px 44px', borderRadius: 14,
            background: '#30d158', color: '#000', textDecoration: 'none',
            fontSize: isMobile ? 15 : 17, fontWeight: 800,
            boxShadow: '0 0 50px rgba(48,209,88,0.3)', position: 'relative',
            display: 'inline-block',
          }}>
            Start for free →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: isMobile ? '20px 16px' : '32px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 1200, margin: '0 auto', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.03em' }}>
          TradeLog <span style={{ color: '#30d158' }}>Pro</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>by dnproduction · 2026</div>
      </footer>

    </main>
  )
}
