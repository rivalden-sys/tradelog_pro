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

function Glass({ children, accent, style, hover }: { children: React.ReactNode; accent?: string; style?: React.CSSProperties; hover?: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: hovered
          ? 'rgba(255,255,255,0.07)'
          : 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: `1px solid ${accent ? accent + '40' : hovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 28,
        boxShadow: accent
          ? `inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(255,255,255,0.03), 0 0 80px ${accent}15`
          : `inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.03)`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        ...style,
      }}
    >
      {/* Top glare */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%)', borderRadius: '28px 28px 0 0', pointerEvents: 'none', zIndex: 0 }} />
      {/* Bottom gradient */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(0deg, rgba(0,0,0,0.15) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 0 }} />
      {children}
    </div>
  )
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `${color}18`, border: `1px solid ${color}35`, borderRadius: 100, padding: '6px 16px', marginBottom: 20 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
      <span style={{ fontSize: 12, color, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{children}</span>
    </div>
  )
}

function GradientText({ children, from, to, style }: { children: React.ReactNode; from?: string; to?: string; style?: React.CSSProperties }) {
  return (
    <span style={{
      background: `linear-gradient(135deg, ${from || '#fff'} 0%, ${to || 'rgba(255,255,255,0.55)'} 100%)`,
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      ...style,
    }}>{children}</span>
  )
}

export default function Landing() {
  const [scrolled,   setScrolled]   = useState(false)
  const [isMobile,   setIsMobile]   = useState(false)
  const [openFaq,    setOpenFaq]    = useState<number | null>(null)
  const [showSticky, setShowSticky] = useState(false)

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 40); setShowSticky(window.scrollY > 600) }
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile(); onScroll()
    window.addEventListener('scroll', onScroll)
    window.addEventListener('resize', checkMobile)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', checkMobile) }
  }, [])

  const px = isMobile ? '16px' : '48px'
  const pb = isMobile ? '80px' : '120px'

  const faqs = [
    { q: 'Is my trading data safe?',         a: 'Yes. All data is stored securely in Supabase with Row Level Security — only you can access your trades.' },
    { q: 'Is there a mobile version?',        a: 'TradeLog Pro is fully responsive and works great on any device — phone, tablet, or desktop.' },
    { q: 'Can I cancel my subscription?',     a: 'Absolutely. Cancel anytime from your billing settings — no questions asked, no hidden fees.' },
    { q: 'What markets does it support?',     a: 'Futures and Spot trading. Long and Short positions. Any trading pair — crypto, forex, stocks.' },
    { q: 'How does the AI know my patterns?', a: 'AI reads your actual trade history — setup, result, emotion, playbook compliance, journal mood — and finds patterns specific to your trading.' },
    { q: 'Can I try it before paying?',       a: 'Yes! The Free plan includes up to 20 trades with basic analytics. No credit card required.' },
    { q: 'What is CSV Import?',               a: 'Upload your trades directly from Bybit, Binance, OKX, Bitget, MEXC and more. Trades are parsed and added automatically — no manual entry needed.' },
  ]

  return (
    <main style={{ background: '#060608', minHeight: '100vh', color: '#fff', fontFamily: FONT, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@500;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: ${GREEN}44; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes glow  { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Ambient background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '20%', width: 700, height: 700, borderRadius: '50%', background: `radial-gradient(circle, ${GREEN}12 0%, transparent 65%)`, animation: 'glow 6s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '30%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${BLUE}0e 0%, transparent 65%)`, animation: 'glow 8s ease-in-out infinite 2s' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${PURPLE}0a 0%, transparent 65%)`, animation: 'glow 10s ease-in-out infinite 4s' }} />
      </div>

      {/* Sticky mobile CTA */}
      {isMobile && showSticky && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, padding: '12px 16px 24px', background: 'rgba(6,6,8,0.94)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 -16px 48px rgba(0,0,0,0.5)' }}>
          <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '15px', borderRadius: 16, background: `linear-gradient(135deg, ${GREEN}, #2ecc71)`, color: '#000', textDecoration: 'none', fontSize: 16, fontWeight: 800, boxShadow: `0 0 40px ${GREEN}55` }}>
            Start for free →
          </Link>
        </div>
      )}

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: isMobile ? '0 16px' : '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(6,6,8,0.88)' : 'transparent', backdropFilter: scrolled ? 'blur(32px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none', transition: 'all 0.4s ease' }}>
        <Logo size={isMobile ? 'sm' : 'md'} />
        <div style={{ display: 'flex', gap: 6 }}>
          <Link href="/login"    style={{ padding: isMobile ? '7px 14px' : '8px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: isMobile ? 12 : 13, fontWeight: 500, backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.04)' }}>Log in</Link>
          <Link href="/register" style={{ padding: isMobile ? '7px 14px' : '8px 18px', borderRadius: 10, background: `linear-gradient(135deg, ${GREEN}, #2ecc71)`, color: '#000', textDecoration: 'none', fontSize: isMobile ? 12 : 13, fontWeight: 800, boxShadow: `0 0 20px ${GREEN}44` }}>Start free</Link>
        </div>
      </nav>

      {/* ══════════════════════════════════
          HERO
      ══════════════════════════════════ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: isMobile ? '110px 20px 80px' : '130px 24px 100px', zIndex: 1 }}>
        <div style={{ textAlign: 'center', maxWidth: 860, width: '100%' }}>
          <Pill color={GREEN}>AI-powered trading journal</Pill>
          <h1 style={{ fontSize: isMobile ? 42 : 80, fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.05em', marginBottom: 24 }}>
            <GradientText from="#ffffff" to="rgba(255,255,255,0.65)">Trade smarter.</GradientText>
            <br />
            <GradientText from={GREEN} to="#2ecc71">Grow faster.</GradientText>
          </h1>
          <p style={{ fontSize: isMobile ? 16 : 21, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, maxWidth: 600, margin: '0 auto 40px' }}>
            An AI trading journal with coaching, psychology analysis, playbook rules, emotion tracking and daily notes. Stop repeating the same mistakes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <Link href="/register" style={{ padding: isMobile ? '14px 28px' : '17px 40px', borderRadius: 16, background: `linear-gradient(135deg, ${GREEN}, #2ecc71)`, color: '#000', textDecoration: 'none', fontSize: isMobile ? 15 : 17, fontWeight: 800, boxShadow: `0 0 50px ${GREEN}55`, letterSpacing: '-0.01em' }}>Start for free →</Link>
            <Link href="/login"    style={{ padding: isMobile ? '14px 28px' : '17px 40px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: isMobile ? 15 : 17, fontWeight: 500, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}>Log in</Link>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.02em' }}>Free up to 20 trades · No credit card required</p>

          {/* Hero dashboard preview */}
          <div style={{ marginTop: isMobile ? 48 : 72, animation: 'float 6s ease-in-out infinite' }}>
            <Glass style={{ padding: isMobile ? '16px' : '24px', borderRadius: 24, maxWidth: 720, margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 8 : 10, marginBottom: 12, position: 'relative', zIndex: 1 }}>
                {[
                  { l: 'Win Rate',  v: '62%',    c: GREEN  },
                  { l: 'Total P&L', v: '+$1,240', c: GREEN  },
                  { l: 'Avg RR',    v: '2.14',   c: ORANGE },
                  { l: 'Streak',    v: '7 days',  c: BLUE   },
                ].map(s => (
                  <div key={s.l} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: isMobile ? '12px' : '14px 16px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{s.l}</div>
                    <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: s.c, letterSpacing: '-0.03em' }}>{s.v}</div>
                  </div>
                ))}
              </div>
              {/* Mini chart bars */}
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: isMobile ? '12px' : '14px 18px', position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>P&L by Day of Week</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: isMobile ? 4 : 8, height: isMobile ? 40 : 56 }}>
                  {[{ d:'Mon',v:320 },{ d:'Tue',v:-80 },{ d:'Wed',v:210 },{ d:'Thu',v:480 },{ d:'Fri',v:140 },{ d:'Sat',v:-120 },{ d:'Sun',v:60 }].map(b => (
                    <div key={b.d} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', gap: 4 }}>
                      <div style={{ width:'60%', height: `${Math.abs(b.v)/480*100}%`, minHeight: 3, borderRadius: 3, background: b.v > 0 ? `linear-gradient(180deg, #4ade80, ${GREEN})` : `linear-gradient(180deg, #ff6b61, ${RED})` }} />
                      <div style={{ fontSize: isMobile ? 7 : 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{b.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Glass>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          STATS
      ══════════════════════════════════ */}
      <section style={{ padding: `0 ${px} 80px`, maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16 }}>
          {[
            { value: '12,430+', label: 'Trades logged',         color: GREEN  },
            { value: '57%',     label: 'Avg win rate',          color: BLUE   },
            { value: '84k',     label: 'AI insights generated', color: PURPLE },
            { value: '2,300+',  label: 'Active traders',        color: ORANGE },
          ].map(s => (
            <Glass key={s.label} accent={s.color} style={{ padding: isMobile ? '20px 16px' : '30px 26px', textAlign: 'center', borderRadius: 22 }}>
              <div style={{ fontSize: isMobile ? 28 : 38, fontWeight: 900, letterSpacing: '-0.04em', color: s.color, marginBottom: 6, position: 'relative', zIndex: 1 }}>{s.value}</div>
              <div style={{ fontSize: isMobile ? 11 : 13, color: 'rgba(255,255,255,0.35)', position: 'relative', zIndex: 1, fontWeight: 500 }}>{s.label}</div>
            </Glass>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          KILLER FEATURES — NEW
      ══════════════════════════════════ */}
      <section style={{ padding: `0 ${px} ${pb}`, maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 72 }}>
          <Pill color={PURPLE}>What's new</Pill>
          <h2 style={{ fontSize: isMobile ? 30 : 54, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.05 }}>
            <GradientText from="#fff" to="rgba(255,255,255,0.55)">Features your competitors<br />don't have</GradientText>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 20, marginBottom: isMobile ? 12 : 20 }}>

          {/* Playbook */}
          <Glass accent={GREEN} style={{ padding: isMobile ? '28px 22px' : '44px 40px', borderRadius: 28 }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: '-0.03em' }}>Playbook</div>
              <div style={{ fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 24 }}>
                Define your setup rules. Every trade tracks which rules you followed — and shows win rate with vs without compliance.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Define entry rules per setup', 'Track compliance on every trade', 'Win rate: followed vs violated', '+X% insight when rules work'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: `${GREEN}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: GREEN, flexShrink: 0, fontWeight: 800 }}>✓</div>
                    <span style={{ fontSize: isMobile ? 13 : 14, color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                  </div>
                ))}
              </div>
              {/* Mini playbook card */}
              <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.04)', border: `1px solid ${GREEN}30`, borderRadius: 16, padding: '16px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 10 }}>CHoCH + BOS + FVG</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: `${GREEN}15`, border: `1px solid ${GREEN}30`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: GREEN, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>✓ Followed</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: GREEN }}>71%</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>win rate</div>
                  </div>
                  <div style={{ background: `${RED}15`, border: `1px solid ${RED}30`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: RED, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>✕ Violated</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: RED }}>34%</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>win rate</div>
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: GREEN, background: `${GREEN}12`, border: `1px solid ${GREEN}25`, borderRadius: 8, padding: '7px 10px' }}>
                  📈 Following rules gives +37% win rate
                </div>
              </div>
            </div>
          </Glass>

          {/* Emotion + Journal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 20 }}>

            {/* Emotion tracking */}
            <Glass accent={ORANGE} style={{ padding: isMobile ? '24px 22px' : '32px 32px', borderRadius: 28, flex: 1 }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>🧠</div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.03em' }}>Emotion Tracking</div>
                <div style={{ fontSize: isMobile ? 13 : 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: 16 }}>
                  Log your emotional state on every trade. AI finds which emotions hurt your win rate most.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { e: '😌', l: 'Calm',     c: GREEN,  wr: '71%' },
                    { e: '🤑', l: 'Greed',    c: ORANGE, wr: '38%' },
                    { e: '💀', l: 'Revenge',  c: RED,    wr: '22%' },
                    { e: '🚀', l: 'Euphoria', c: PURPLE, wr: '41%' },
                  ].map(em => (
                    <div key={em.l} style={{ background: `${em.c}15`, border: `1px solid ${em.c}30`, borderRadius: 10, padding: '8px 10px', textAlign: 'center', flex: 1, minWidth: 52 }}>
                      <div style={{ fontSize: 18 }}>{em.e}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{em.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: em.c, marginTop: 1 }}>{em.wr}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Glass>

            {/* Daily Journal */}
            <Glass accent={BLUE} style={{ padding: isMobile ? '24px 22px' : '32px 32px', borderRadius: 28, flex: 1 }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>📓</div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.03em' }}>Daily Journal</div>
                <div style={{ fontSize: isMobile ? 13 : 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: 16 }}>
                  Note your mood, market observations, plans, and mistakes — even on no-trade days.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['😞','😕','😐','🙂','😄'].map((em, i) => (
                    <div key={em} style={{ flex: 1, background: i === 3 ? `${BLUE}25` : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 3 ? BLUE + '50' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '8px 4px', textAlign: 'center', outline: i === 3 ? `2px solid ${BLUE}` : 'none' }}>
                      <div style={{ fontSize: 20 }}>{em}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Glass>
          </div>
        </div>

        {/* CSV Import — full width */}
        <Glass accent={ORANGE} style={{ padding: isMobile ? '28px 22px' : '40px 44px', borderRadius: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 20 : 48, alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: 36, marginBottom: 16 }}>📥</div>
              <div style={{ fontSize: isMobile ? 22 : 32, fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.03em' }}>CSV Import</div>
              <div style={{ fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 20 }}>
                Stop entering trades manually. Upload your history directly from your exchange — we auto-detect format.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Bybit', 'Binance', 'OKX', 'MEXC', 'Bitget', 'Gate.io', 'HTX', 'KuCoin', 'BingX', 'Phemex'].map(ex => (
                  <div key={ex} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{ex}</div>
                ))}
              </div>
            </div>
            <div>
              {/* Mock upload UI */}
              <div style={{ border: `2px dashed ${ORANGE}55`, borderRadius: 18, padding: '28px 20px', textAlign: 'center', background: `${ORANGE}08` }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Drop your CSV here</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Supports .csv and .xlsx</div>
              </div>
              <div style={{ marginTop: 12, background: `${GREEN}12`, border: `1px solid ${GREEN}30`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 18 }}>✅</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>Format detected: Bybit Futures</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Found 47 trades — ready to import</div>
                </div>
              </div>
            </div>
          </div>
        </Glass>
      </section>

      {/* ══════════════════════════════════
          AI FEATURES
      ══════════════════════════════════ */}
      <section style={{ padding: `0 ${px} ${pb}`, maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 72 }}>
          <Pill color={GREEN}>AI Features</Pill>
          <h2 style={{ fontSize: isMobile ? 30 : 54, fontWeight: 900, letterSpacing: '-0.05em' }}>
            <GradientText from="#fff" to="rgba(255,255,255,0.55)">AI that reads<br />your journal</GradientText>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 20 }}>
          {[
            { icon: '🧠', title: 'AI Coach',         color: GREEN,  desc: 'Analyzes last 50 trades, emotion patterns, playbook compliance. Gives main mistakes + 4 concrete steps.', badge: 'Pro' },
            { icon: '🎯', title: 'Trade Score',       color: ORANGE, desc: 'AI estimates success probability before you enter. Based on your personal historical win rate for this exact setup.', badge: 'Pro' },
            { icon: '🧬', title: 'Psychology',        color: PURPLE, desc: 'Reads your comments and emotions. Finds fear, greed, revenge trading. Gives severity + action for each pattern.', badge: 'Pro' },
            { icon: '💬', title: 'AI Chat',           color: BLUE,   desc: 'Chat with AI that has full context of your journal, emotions, playbook, and journal mood. Ask anything.', badge: 'Pro' },
            { icon: '📊', title: 'Trade Analysis',    color: RED,    desc: 'Detailed breakdown per trade: entry quality, mistakes, system compliance, AI grade. Runs on demand.', badge: 'Pro' },
            { icon: '📈', title: 'Analytics',         color: GREEN,  desc: 'Win rate by setup & pair, P&L by weekday, Long vs Short, Max Drawdown, grade distribution and more.', badge: 'Free' },
          ].map(f => (
            <Glass key={f.title} accent={f.color} hover style={{ padding: isMobile ? '22px 18px' : '32px 28px', borderRadius: 22 }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: `${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{f.icon}</div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: f.badge === 'Pro' ? PURPLE : GREEN, background: f.badge === 'Pro' ? `${PURPLE}20` : `${GREEN}20`, border: `1px solid ${f.badge === 'Pro' ? PURPLE : GREEN}35`, borderRadius: 20, padding: '3px 10px' }}>{f.badge}</span>
                </div>
                <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: isMobile ? 12 : 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </Glass>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          MARKETS
      ══════════════════════════════════ */}
      <section style={{ padding: `0 ${px} ${pb}`, maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 72 }}>
          <Pill color={ORANGE}>Markets</Pill>
          <h2 style={{ fontSize: isMobile ? 30 : 54, fontWeight: 900, letterSpacing: '-0.05em' }}>
            <GradientText from="#fff" to="rgba(255,255,255,0.55)">Futures & Spot — both covered</GradientText>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 20 }}>
          {[
            { icon: '📈', title: 'Futures', color: BLUE, features: ['Long & Short positions', 'RR auto-calculation', 'Risk % of deposit', 'Long vs Short win rate'], desc: 'Full support for leveraged futures. Track direction, entry/stop/take, risk per trade. AI analyzes both sides separately.' },
            { icon: '🪙', title: 'Spot',    color: ORANGE, features: ['Spot buy & sell entries', 'P&L in USDT & %', 'Setup & pair analytics', 'AI insights for spot'], desc: 'Log spot buys and sells. Track P&L in USDT and %. AI Coach finds your best pairs, worst setups, discipline patterns.' },
          ].map(item => (
            <Glass key={item.title} accent={item.color} style={{ padding: isMobile ? '28px 22px' : '44px 40px', borderRadius: 28 }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{item.icon}</div>
                <div style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: '-0.03em' }}>{item.title} Trading</div>
                <div style={{ fontSize: isMobile ? 13 : 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 20 }}>{item.desc}</div>
                {item.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: `${item.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: item.color, flexShrink: 0 }}>✓</div>
                    <span style={{ fontSize: isMobile ? 13 : 14, color: 'rgba(255,255,255,0.65)' }}>{f}</span>
                  </div>
                ))}
              </div>
            </Glass>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════ */}
      <section style={{ padding: `0 ${px} ${pb}`, maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 72 }}>
          <Pill color={BLUE}>How it works</Pill>
          <h2 style={{ fontSize: isMobile ? 30 : 54, fontWeight: 900, letterSpacing: '-0.05em' }}>
            <GradientText from="#fff" to="rgba(255,255,255,0.55)">Three steps to results</GradientText>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 16 }}>
          {[
            { num: '01', title: 'Log your trades',   desc: 'Fill in setup, direction, result, emotion, playbook rules, screenshot, comment.', color: GREEN  },
            { num: '02', title: 'AI analyzes',        desc: 'Run AI Coach, get Trade Score, Psychology — all using your actual journal data.', color: BLUE   },
            { num: '03', title: 'Grow as a trader',  desc: 'Follow concrete AI steps. Watch win rate and discipline improve over time.', color: ORANGE },
          ].map((s, i) => (
            <Glass key={s.num} accent={s.color} style={{ padding: isMobile ? '28px 22px' : '44px 36px', borderRadius: 24, background: i === 1 ? `${BLUE}0d` : 'rgba(255,255,255,0.03)' }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: isMobile ? 48 : 64, fontWeight: 900, color: s.color, opacity: 0.25, letterSpacing: '-0.06em', lineHeight: 1, marginBottom: 14 }}>{s.num}</div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: '-0.03em' }}>{s.title}</div>
                <div style={{ fontSize: isMobile ? 13 : 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            </Glass>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════ */}
      <section style={{ padding: `0 ${px} ${pb}`, maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 72 }}>
          <Pill color={PURPLE}>Testimonials</Pill>
          <h2 style={{ fontSize: isMobile ? 30 : 54, fontWeight: 900, letterSpacing: '-0.05em' }}>
            <GradientText from="#fff" to="rgba(255,255,255,0.55)">Traders love it</GradientText>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 10 : 20 }}>
          {[
            { name: 'Alex M.',  role: 'Crypto Futures Trader', text: 'After 2 weeks with AI Coach I realized I was overtrading on weekends. Win rate jumped from 44% to 61%.', avatar: 'AM', color: BLUE   },
            { name: 'Sarah K.', role: 'Swing Trader',           text: 'The Psychology Analysis is scary accurate. It caught my revenge trading before I even noticed it myself.', avatar: 'SK', color: PURPLE },
            { name: 'Denis N.', role: 'Day Trader',             text: 'Trade Score saved me from 3 bad entries last week. AI told me my setup has 38% win rate on Mondays.', avatar: 'DN', color: GREEN  },
            { name: 'Maria T.', role: 'Spot Trader',            text: 'Finally a journal that works for spot too. The Playbook feature is exactly what I was missing.', avatar: 'MT', color: ORANGE },
          ].map(t => (
            <Glass key={t.name} accent={t.color} hover style={{ padding: isMobile ? '24px 20px' : '36px 32px', borderRadius: 24 }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: 20 }}>"{t.text}"</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${t.color}25`, border: `1px solid ${t.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: t.color }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{t.role}</div>
                    </div>
                  </div>
                  <div style={{ color: ORANGE, fontSize: isMobile ? 12 : 14, letterSpacing: 2 }}>★★★★★</div>
                </div>
              </div>
            </Glass>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          PRICING
      ══════════════════════════════════ */}
      <section style={{ padding: `0 ${px} ${pb}`, maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 72 }}>
          <Pill color={ORANGE}>Pricing</Pill>
          <h2 style={{ fontSize: isMobile ? 30 : 54, fontWeight: 900, letterSpacing: '-0.05em' }}>
            <GradientText from="#fff" to="rgba(255,255,255,0.55)">Start for free</GradientText>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 20 }}>
          <Glass style={{ padding: isMobile ? '28px 22px' : '44px 38px', borderRadius: 28 }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 8, fontWeight: 500 }}>Free</div>
              <div style={{ fontSize: isMobile ? 40 : 52, fontWeight: 900, letterSpacing: '-0.05em', marginBottom: 4 }}>$0</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 28 }}>forever</div>
              {['Up to 20 trades', 'Basic analytics', 'Dashboard', 'Dark mode & i18n', 'CSV Import (limited)'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>✓</div>
                  <span style={{ fontSize: isMobile ? 13 : 14, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                </div>
              ))}
              <Link href="/register" style={{ display: 'block', textAlign: 'center', marginTop: 28, padding: '14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14, fontWeight: 600, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}>Get started →</Link>
            </div>
          </Glass>

          <Glass accent={GREEN} style={{ padding: isMobile ? '28px 22px' : '44px 38px', borderRadius: 28, background: `${GREEN}0d` }}>
            <div style={{ position: 'absolute', top: 18, right: 18, background: `linear-gradient(135deg, ${GREEN}, #2ecc71)`, color: '#000', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 100, zIndex: 2, letterSpacing: '0.04em' }}>BEST VALUE</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 13, color: GREEN, marginBottom: 8, fontWeight: 700 }}>Pro ⚡</div>
              <div style={{ fontSize: isMobile ? 40 : 52, fontWeight: 900, letterSpacing: '-0.05em', marginBottom: 4 }}>$19</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 28 }}>per month</div>
              {['Unlimited trades', 'CSV Import (all exchanges)', 'Playbook + compliance', 'Emotion tracking', 'Daily Journal', 'AI Coach', 'AI Trade Score', 'AI Psychology Analysis', 'AI Chat', 'Analysis history'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: `${GREEN}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: GREEN, flexShrink: 0, fontWeight: 800 }}>✓</div>
                  <span style={{ fontSize: isMobile ? 13 : 14, color: 'rgba(255,255,255,0.8)' }}>{f}</span>
                </div>
              ))}
              <Link href="/register" style={{ display: 'block', textAlign: 'center', marginTop: 28, padding: '14px', borderRadius: 14, background: `linear-gradient(135deg, ${GREEN}, #2ecc71)`, color: '#000', textDecoration: 'none', fontSize: 14, fontWeight: 800, boxShadow: `0 0 40px ${GREEN}44` }}>Start Pro →</Link>
            </div>
          </Glass>
        </div>
      </section>

      {/* ══════════════════════════════════
          FAQ
      ══════════════════════════════════ */}
      <section style={{ padding: `0 ${px} ${pb}`, maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 72 }}>
          <Pill color={BLUE}>FAQ</Pill>
          <h2 style={{ fontSize: isMobile ? 30 : 54, fontWeight: 900, letterSpacing: '-0.05em' }}>
            <GradientText from="#fff" to="rgba(255,255,255,0.55)">Common questions</GradientText>
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((faq, i) => (
            <Glass key={i} style={{ padding: 0, borderRadius: 18 }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', padding: isMobile ? '18px 20px' : '20px 26px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontFamily: FONT, minHeight: 58 }}
              >
                <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, color: openFaq === i ? '#fff' : 'rgba(255,255,255,0.8)', textAlign: 'left', lineHeight: 1.4, position: 'relative', zIndex: 1 }}>{faq.q}</span>
                <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: openFaq === i ? `${GREEN}22` : 'rgba(255,255,255,0.06)', border: `1px solid ${openFaq === i ? GREEN + '55' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: openFaq === i ? GREEN : 'rgba(255,255,255,0.35)', fontSize: 18, transition: 'all 0.25s', transform: openFaq === i ? 'rotate(45deg)' : 'none', position: 'relative', zIndex: 1 }}>+</div>
              </button>
              {openFaq === i && (
                <div style={{ padding: isMobile ? '0 20px 20px' : '0 26px 22px', fontSize: isMobile ? 13 : 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, position: 'relative', zIndex: 1 }}>{faq.a}</div>
              )}
            </Glass>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          FINAL CTA
      ══════════════════════════════════ */}
      <section style={{ padding: `0 ${px} ${isMobile ? '100px' : '130px'}`, maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Glass accent={GREEN} style={{ padding: isMobile ? '48px 24px' : '80px 64px', borderRadius: 32, background: `${GREEN}0d`, textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${GREEN}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: isMobile ? 40 : 68, marginBottom: 16 }}>🚀</div>
            <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 900, letterSpacing: '-0.05em', marginBottom: 14, lineHeight: 1.05 }}>
              <GradientText from="#fff" to="rgba(255,255,255,0.7)">Ready to trade smarter?</GradientText>
            </h2>
            <p style={{ fontSize: isMobile ? 14 : 18, color: 'rgba(255,255,255,0.4)', marginBottom: 32, lineHeight: 1.6 }}>
              Join traders who are already using AI<br />to improve their results
            </p>
            <Link href="/register" style={{ padding: isMobile ? '15px 36px' : '18px 52px', borderRadius: 16, background: `linear-gradient(135deg, ${GREEN}, #2ecc71)`, color: '#000', textDecoration: 'none', fontSize: isMobile ? 16 : 18, fontWeight: 800, boxShadow: `0 0 60px ${GREEN}55`, display: 'inline-block', letterSpacing: '-0.01em' }}>
              Start for free →
            </Link>
            <div style={{ marginTop: 18, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Free · No credit card · Cancel anytime</div>
          </div>
        </Glass>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '24px 16px 80px' : '36px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto', flexWrap: 'wrap', gap: 10, position: 'relative', zIndex: 1 }}>
        <Logo size={isMobile ? 'sm' : 'md'} />
        <div style={{ display: 'flex', gap: isMobile ? 16 : 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/login"    style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Log in</Link>
          <Link href="/register" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Register</Link>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>by dnproduction · 2026</div>
        </div>
      </footer>
    </main>
  )
}
