'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const FONT   = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
const NUNITO = "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif"
const GREEN  = '#30d158'
const BLUE   = '#0a84ff'
const ORANGE = '#ff9f0a'
const PURPLE = '#bf5af2'
const RED    = '#ff453a'

function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const scale = size === 'sm' ? 0.8 : size === 'lg' ? 1.3 : 1
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 * scale }}>
      <svg width={20 * scale} height={22 * scale} viewBox="0 0 20 22" fill="none">
        <rect x="0"  y="13" width="4" height="9"  rx="2" fill={GREEN} opacity="0.4"/>
        <rect x="5"  y="9"  width="4" height="13" rx="2" fill={GREEN} opacity="0.62"/>
        <rect x="10" y="4"  width="4" height="18" rx="2" fill={GREEN} opacity="0.82"/>
        <rect x="15" y="0"  width="4" height="22" rx="2" fill={GREEN}/>
      </svg>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontFamily: NUNITO, fontSize: 15 * scale, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: '1.1' }}>TradeLog</div>
        <div style={{ fontFamily: NUNITO, fontSize: 10 * scale, fontWeight: 500, color: GREEN, letterSpacing: '0.04em', lineHeight: '1.1' }}>Pro Edition</div>
      </div>
    </div>
  )
}

function GlassCard({ children, accent, style }: { children: React.ReactNode; accent?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: `1px solid ${accent ? accent + '33' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 24,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.02)`,
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)', borderRadius: '24px 24px 0 0', pointerEvents: 'none' }} />
      {children}
    </div>
  )
}

export default function Landing() {
  const [scrolled,  setScrolled]  = useState(false)
  const [isMobile,  setIsMobile]  = useState(false)
  const [openFaq,   setOpenFaq]   = useState<number | null>(null)

  useEffect(() => {
    const onScroll    = () => setScrolled(window.scrollY > 40)
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile(); onScroll()
    window.addEventListener('scroll', onScroll)
    window.addEventListener('resize', checkMobile)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', checkMobile) }
  }, [])

  const faqs = [
    { q: 'Is my trading data safe?',           a: 'Yes. All data is stored securely in Supabase with Row Level Security — only you can access your trades.' },
    { q: 'Is there a mobile version?',          a: 'TradeLog Pro is fully responsive and works great on any device — phone, tablet, or desktop.' },
    { q: 'Can I cancel my subscription?',       a: 'Absolutely. Cancel anytime from your billing settings — no questions asked, no hidden fees.' },
    { q: 'What markets does it support?',       a: 'Futures and Spot trading. Long and Short positions. Any trading pair — crypto, forex, stocks.' },
    { q: 'How does the AI know my patterns?',   a: 'AI reads your actual trade history — setup, result, comment, grade — and finds patterns specific to your trading.' },
    { q: 'Can I try it before paying?',         a: 'Yes! The Free plan includes up to 20 trades with basic analytics. No credit card required.' },
  ]

  const testimonials = [
    { name: 'Alex M.',    role: 'Crypto Futures Trader',  text: 'After 2 weeks with TradeLog AI Coach I realized I was overtrading on weekends. Win rate jumped from 44% to 61%.', avatar: 'AM', color: BLUE   },
    { name: 'Sarah K.',   role: 'Swing Trader',           text: 'The Psychology Analysis is scary accurate. It caught my revenge trading pattern before I even noticed it myself.', avatar: 'SK', color: PURPLE },
    { name: 'Denis N.',   role: 'Day Trader',             text: 'Trade Score saved me from 3 bad entries last week. The AI literally told me my CHoCH setup has 38% win rate on Mondays.', avatar: 'DN', color: GREEN  },
    { name: 'Maria T.',   role: 'Spot Trader',            text: 'Finally a journal that works for spot too. Clean design, fast, and the AI chat answers questions about MY data.', avatar: 'MT', color: ORANGE },
  ]

  return (
    <main style={{ background: '#080808', minHeight: '100vh', color: '#fff', fontFamily: FONT, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@500;700;800&display=swap');
        * { box-sizing: border-box; }
      `}</style>

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
        <Logo />
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/login" style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>Log in</Link>
          <Link href="/register" style={{ padding: '8px 16px', borderRadius: 10, background: GREEN, color: '#000', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Start free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: isMobile ? '100px 20px 60px' : '120px 24px 80px' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: isMobile ? 300 : 600, height: isMobile ? 300 : 600, borderRadius: '50%', background: `radial-gradient(circle, ${GREEN}1a 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', maxWidth: 800, position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${GREEN}1a`, border: `1px solid ${GREEN}33`, borderRadius: 100, padding: '6px 16px', marginBottom: 24 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
            <span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>AI-powered trading journal</span>
          </div>
          <h1 style={{ fontSize: isMobile ? 42 : 72, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 20, background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Trade smarter.<br />
            <span style={{ background: `linear-gradient(135deg, ${GREEN}, #34d399)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Grow faster.</span>
          </h1>
          <p style={{ fontSize: isMobile ? 16 : 20, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 36px' }}>
            A trading journal with AI coaching, psychological analysis, Trade Score and AI Chat. Stop losing money on the same mistakes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ padding: isMobile ? '14px 28px' : '16px 36px', borderRadius: 14, background: GREEN, color: '#000', textDecoration: 'none', fontSize: isMobile ? 15 : 16, fontWeight: 800, boxShadow: `0 0 40px ${GREEN}4d` }}>Start for free →</Link>
            <Link href="/login" style={{ padding: isMobile ? '14px 28px' : '16px 36px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', color: '#fff', textDecoration: 'none', fontSize: isMobile ? 15 : 16, fontWeight: 500, background: 'rgba(255,255,255,0.04)' }}>Log in</Link>
          </div>
          <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Free up to 20 trades · No credit card required</p>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: isMobile ? '0 16px 60px' : '0 48px 100px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 12 : 16 }}>
          {[
            { value: '12,430+', label: 'Trades logged',          color: GREEN  },
            { value: '57%',     label: 'Average win rate',       color: BLUE   },
            { value: '84k',     label: 'AI insights generated',  color: PURPLE },
            { value: '2,300+',  label: 'Active traders',         color: ORANGE },
          ].map(s => (
            <GlassCard key={s.label} accent={s.color} style={{ padding: isMobile ? '20px 16px' : '28px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, letterSpacing: '-0.04em', color: s.color, marginBottom: 6, position: 'relative' }}>{s.value}</div>
              <div style={{ fontSize: isMobile ? 12 : 14, color: 'rgba(255,255,255,0.4)', position: 'relative' }}>{s.label}</div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* FUTURES + SPOT */}
      <section style={{ padding: isMobile ? '0 16px 80px' : '0 48px 120px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
          <div style={{ fontSize: 12, color: ORANGE, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Markets</div>
          <h2 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 14, background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Futures & Spot — both covered
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 18, color: 'rgba(255,255,255,0.4)', maxWidth: 500, margin: '0 auto' }}>
            One journal for all your trading styles
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 20 }}>
          <GlassCard accent={BLUE} style={{ padding: isMobile ? '28px 24px' : '40px 36px' }}>
            <div style={{ fontSize: 36, marginBottom: 16, position: 'relative' }}>📈</div>
            <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff', marginBottom: 10, position: 'relative' }}>Futures Trading</div>
            <div style={{ fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 24, position: 'relative' }}>
              Full support for Long & Short positions. Track leverage, entry/stop/take prices, risk per trade. AI analyzes both directions separately.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
              {['Long & Short positions', 'RR auto-calculation', 'Risk % of deposit', 'Long vs Short win rate analytics'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${BLUE}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: BLUE, flexShrink: 0 }}>✓</div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard accent={ORANGE} style={{ padding: isMobile ? '28px 24px' : '40px 36px' }}>
            <div style={{ fontSize: 36, marginBottom: 16, position: 'relative' }}>🪙</div>
            <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#fff', marginBottom: 10, position: 'relative' }}>Spot Trading</div>
            <div style={{ fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 24, position: 'relative' }}>
              Log spot buys and sells. Track P&L in USDT and %. AI Coach works the same — finds your best pairs, worst setups, discipline patterns.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
              {['Long-only spot entries', 'P&L in USDT & %', 'Setup & pair analytics', 'AI insights for spot traders'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${ORANGE}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: ORANGE, flexShrink: 0 }}>✓</div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section style={{ padding: isMobile ? '0 16px 80px' : '0 48px 120px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
          <div style={{ fontSize: 12, color: GREEN, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Dashboard</div>
          <h2 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 14, background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your stats at a glance
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 18, color: 'rgba(255,255,255,0.4)', maxWidth: 500, margin: '0 auto' }}>
            Everything that matters — in one screen
          </p>
        </div>

        <GlassCard style={{ padding: isMobile ? '20px 16px' : '32px 28px' }}>
          {/* Stat cards mock */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10, marginBottom: 20, position: 'relative' }}>
            {[
              { label: 'Total Trades', value: '48',      color: BLUE   },
              { label: 'Win Rate',     value: '62%',     color: GREEN  },
              { label: 'Total P&L',    value: '+$1,240', color: GREEN  },
              { label: 'Avg RR',       value: '2.14',    color: ORANGE },
              { label: 'Avg P&L',      value: '+$25.8',  color: GREEN  },
              { label: 'Max Drawdown', value: '-$180',   color: RED    },
              { label: 'Best Setup',   value: 'CHoCH',   color: '#fff' },
              { label: 'Streak',       value: '7W / 2L', color: 'rgba(255,255,255,0.4)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)', borderRadius: '14px 14px 0 0', pointerEvents: 'none' }} />
                <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, position: 'relative' }}>{s.label}</div>
                <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', position: 'relative' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Long vs Short mock */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 20, position: 'relative' }}>
            <div style={{ background: `${GREEN}0d`, border: `1px solid ${GREEN}22`, borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>↑ Long</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: GREEN }}>68%</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '68%', background: `linear-gradient(90deg, ${GREEN}, #4ade80)`, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>32 trades</div>
            </div>
            <div style={{ background: `${RED}0d`, border: `1px solid ${RED}22`, borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: RED }}>↓ Short</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: RED }}>44%</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '44%', background: `linear-gradient(90deg, ${RED}, #ff6b61)`, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>16 trades</div>
            </div>
          </div>

          {/* P&L by weekday mock */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 20px', position: 'relative' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16 }}>P&L by Day of Week</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {[
                { day: 'Mon', pnl: +320, h: 70 },
                { day: 'Tue', pnl: -80,  h: 18 },
                { day: 'Wed', pnl: +210, h: 46 },
                { day: 'Thu', pnl: +480, h: 100 },
                { day: 'Fri', pnl: +140, h: 32 },
                { day: 'Sat', pnl: -120, h: 26 },
                { day: 'Sun', pnl: 0,    h: 4  },
              ].map(d => (
                <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: d.pnl > 0 ? GREEN : d.pnl < 0 ? RED : 'rgba(255,255,255,0.3)' }}>
                    {d.pnl !== 0 ? `${d.pnl > 0 ? '+' : ''}${d.pnl}` : '—'}
                  </div>
                  <div style={{ width: '100%', height: 64, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{ width: '60%', height: d.h, borderRadius: 4, background: d.pnl > 0 ? `linear-gradient(180deg, #4ade80, ${GREEN})` : d.pnl < 0 ? `linear-gradient(180deg, #ff6b61, ${RED})` : 'rgba(255,255,255,0.08)', opacity: d.pnl !== 0 ? 1 : 0.3 }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{d.day}</div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </section>

      {/* FEATURES */}
      <section style={{ padding: isMobile ? '0 16px 80px' : '0 48px 120px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
          <div style={{ fontSize: 12, color: GREEN, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Features</div>
          <h2 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 14, background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Everything you need to grow</h2>
          <p style={{ fontSize: isMobile ? 15 : 18, color: 'rgba(255,255,255,0.4)', maxWidth: 500, margin: '0 auto' }}>Not just a journal — a full AI coach that sees your patterns</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 20 }}>
          {[
            { icon: '📊', title: 'Trade Journal',       desc: 'All fields a real trader needs: setup, RR, direction, result, screenshot, self-grade.',           color: BLUE   },
            { icon: '🧠', title: 'AI Coach',            desc: 'Analyzes your full journal: best setup, worst setup, main mistake, concrete next steps.',          color: GREEN  },
            { icon: '🎯', title: 'Trade Score',         desc: 'AI estimates the probability of success before you enter, based on your own history.',            color: ORANGE },
            { icon: '🧬', title: 'Psychology Analysis', desc: 'Reads comments and detects fear, greed, revenge trading patterns automatically.',                  color: PURPLE },
            { icon: '💬', title: 'AI Chat',             desc: 'Ask questions about your journal — AI answers with insights based on your actual trade data.',     color: GREEN  },
            { icon: '📈', title: 'Advanced Analytics',  desc: 'Win rate by setup, P&L by pair, discipline calculator, RR distribution.',                        color: RED    },
            { icon: '🕐', title: 'Analysis History',    desc: 'All AI analyses are saved. Come back anytime and load any previous session.',                     color: BLUE   },
            { icon: '🌙', title: 'Dark mode & i18n',    desc: 'Light and dark theme. Interface available in English and Ukrainian.',                             color: '#636366' },
            { icon: '🔒', title: 'Free / Pro plans',    desc: 'Start for free with up to 20 trades. Upgrade to Pro for unlimited trades and all AI features.',  color: ORANGE },
          ].map(f => (
            <GlassCard key={f.title} accent={f.color} style={{ padding: isMobile ? '20px' : '32px 28px', display: isMobile ? 'flex' : 'block', alignItems: isMobile ? 'flex-start' : undefined, gap: isMobile ? 14 : undefined }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `${f.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: isMobile ? 0 : 16, position: 'relative' }}>{f.icon}</div>
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, marginBottom: 6, color: '#fff' }}>{f.title}</div>
                <div style={{ fontSize: isMobile ? 13 : 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: isMobile ? '0 16px 80px' : '0 48px 120px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
          <div style={{ fontSize: 12, color: BLUE, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>How it works</div>
          <h2 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 900, letterSpacing: '-0.04em', background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Three steps to results</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 2 }}>
          {[
            { num: '01', title: 'Log your trades',   desc: 'Fill in all fields: setup, RR, direction, result, screenshot, comment and self-grade.', color: GREEN  },
            { num: '02', title: 'AI analyzes',        desc: 'Run AI Coach, get Trade Score, chat with AI — it knows your journal and gives specific advice.', color: BLUE   },
            { num: '03', title: 'Grow as a trader',  desc: 'Follow concrete AI steps. Watch your win rate and discipline improve month over month.', color: ORANGE },
          ].map((s, i) => (
            <GlassCard key={s.num} accent={s.color} style={{ padding: isMobile ? '24px 20px' : '40px 32px', background: i === 1 ? `${BLUE}0d` : 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: isMobile ? 40 : 52, fontWeight: 900, color: s.color, opacity: 0.3, letterSpacing: '-0.05em', marginBottom: 12, position: 'relative' }}>{s.num}</div>
              <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, marginBottom: 10, color: '#fff', position: 'relative' }}>{s.title}</div>
              <div style={{ fontSize: isMobile ? 13 : 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, position: 'relative' }}>{s.desc}</div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: isMobile ? '0 16px 80px' : '0 48px 120px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
          <div style={{ fontSize: 12, color: PURPLE, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Testimonials</div>
          <h2 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 900, letterSpacing: '-0.04em', background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Traders love it</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? 12 : 20 }}>
          {testimonials.map(t => (
            <GlassCard key={t.name} accent={t.color} style={{ padding: isMobile ? '24px 20px' : '32px 28px' }}>
              <div style={{ fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 20, position: 'relative' }}>"{t.text}"</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${t.color}22`, border: `1px solid ${t.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: t.color, flexShrink: 0 }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{t.role}</div>
                </div>
                <div style={{ marginLeft: 'auto', color: ORANGE, fontSize: 14 }}>★★★★★</div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: isMobile ? '0 16px 80px' : '0 48px 120px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
          <div style={{ fontSize: 12, color: ORANGE, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Pricing</div>
          <h2 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 900, letterSpacing: '-0.04em', background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Start for free</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 20 }}>
          <GlassCard style={{ padding: isMobile ? '28px 20px' : '40px 36px' }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 8, position: 'relative' }}>Free</div>
            <div style={{ fontSize: isMobile ? 40 : 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 4, position: 'relative' }}>$0</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 28, position: 'relative' }}>forever</div>
            {['Up to 20 trades', 'Basic analytics', 'Dashboard', 'Dark mode & i18n'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, position: 'relative' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>✓</div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
              </div>
            ))}
            <Link href="/register" style={{ display: 'block', textAlign: 'center', marginTop: 28, padding: '13px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600, position: 'relative' }}>Get started →</Link>
          </GlassCard>

          <GlassCard accent={GREEN} style={{ padding: isMobile ? '28px 20px' : '40px 36px', background: `${GREEN}0d` }}>
            <div style={{ position: 'absolute', top: 16, right: 16, background: GREEN, color: '#000', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 100 }}>RECOMMENDED</div>
            <div style={{ fontSize: 14, color: GREEN, marginBottom: 8, fontWeight: 600, position: 'relative' }}>Pro ⚡</div>
            <div style={{ fontSize: isMobile ? 40 : 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 4, position: 'relative' }}>$19</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 28, position: 'relative' }}>per month</div>
            {['Unlimited trades', 'Advanced analytics', 'AI Coach', 'AI Trade Score', 'AI Psychology Analysis', 'AI Chat', 'Analysis history saved', 'Priority support'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, position: 'relative' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${GREEN}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: GREEN, flexShrink: 0 }}>✓</div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{f}</span>
              </div>
            ))}
            <Link href="/register" style={{ display: 'block', textAlign: 'center', marginTop: 28, padding: '13px', borderRadius: 12, background: GREEN, color: '#000', textDecoration: 'none', fontSize: 14, fontWeight: 800, boxShadow: `0 0 30px ${GREEN}40`, position: 'relative' }}>Start Pro →</Link>
          </GlassCard>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: isMobile ? '0 16px 80px' : '0 48px 120px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
          <div style={{ fontSize: 12, color: BLUE, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>FAQ</div>
          <h2 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 900, letterSpacing: '-0.04em', background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Common questions</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((faq, i) => (
            <GlassCard key={i} style={{ padding: 0, borderRadius: 16, cursor: 'pointer' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', padding: '18px 24px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontFamily: FONT }}
              >
                <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, color: '#fff', textAlign: 'left' }}>{faq.q}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18, flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none', display: 'inline-block' }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 24px 18px', fontSize: isMobile ? 13 : 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, position: 'relative' }}>
                  {faq.a}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: isMobile ? '0 16px 80px' : '0 48px 120px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <GlassCard accent={GREEN} style={{ padding: isMobile ? '40px 20px' : '64px 48px', background: `${GREEN}0d` }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${GREEN}14 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 14, background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', position: 'relative' }}>Ready to trade smarter?</h2>
          <p style={{ fontSize: isMobile ? 14 : 18, color: 'rgba(255,255,255,0.4)', marginBottom: 28, position: 'relative' }}>Join traders who are already using AI to improve their results</p>
          <Link href="/register" style={{ padding: isMobile ? '14px 32px' : '16px 44px', borderRadius: 14, background: GREEN, color: '#000', textDecoration: 'none', fontSize: isMobile ? 15 : 17, fontWeight: 800, boxShadow: `0 0 50px ${GREEN}4d`, position: 'relative', display: 'inline-block' }}>
            Start for free →
          </Link>
        </GlassCard>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '20px 16px' : '32px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto', flexWrap: 'wrap', gap: 8 }}>
        <Logo />
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link href="/login"    style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Log in</Link>
          <Link href="/register" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Register</Link>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>by dnproduction · 2026</div>
        </div>
      </footer>
    </main>
  )
}
