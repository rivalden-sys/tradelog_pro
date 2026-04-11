'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

const FONT   = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
const NUNITO = "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif"
const GREEN  = '#30d158'
const GOLD   = '#f5c842'
const BLUE   = '#0a84ff'
const ORANGE = '#ff9f0a'
const PURPLE = '#bf5af2'
const RED    = '#ff453a'

function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const scale = size === 'sm' ? 0.8 : size === 'lg' ? 1.4 : 1
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 * scale }}>
      <svg width={28 * scale} height={28 * scale} viewBox="0 0 28 28" fill="none">
        <rect x="0" y="0" width="28" height="28" rx="8" fill={`${GREEN}18`} />
        <rect x="0" y="0" width="28" height="28" rx="8" stroke={`${GREEN}50`} strokeWidth="1" />
        <path d="M14 6L20.5 22H17.8L16.2 18H11.8L10.2 22H7.5L14 6Z" fill={GREEN} />
        <path d="M12.7 15.5H15.3L14 11.5L12.7 15.5Z" fill="#060608" />
        <circle cx="14" cy="6" r="1.5" fill={GOLD} />
      </svg>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontFamily: NUNITO, fontSize: 16 * scale, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: '1.1' }}>
          Aurum<span style={{ color: GREEN }}>Trade</span>
        </div>
        <div style={{ fontFamily: NUNITO, fontSize: 9 * scale, fontWeight: 600, color: `${GOLD}cc`, letterSpacing: '0.08em', lineHeight: '1.1', textTransform: 'uppercase' }}>Pro Edition</div>
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
        background: hovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
        border: `1px solid ${accent ? accent + '40' : hovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 28,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.03)',
        position: 'relative', overflow: 'hidden',
        transition: 'all 0.3s ease',
        ...style,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%)', borderRadius: '28px 28px 0 0', pointerEvents: 'none', zIndex: 0 }} />
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
    <span style={{ background: `linear-gradient(135deg, ${from || '#fff'} 0%, ${to || 'rgba(255,255,255,0.55)'} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', ...style }}>
      {children}
    </span>
  )
}

// ─── AI DIALOG COMPONENT ───────────────────────────────────────────────────

type Message = { type: 'ai' | 'user'; text: string }
type Profile = 'reactor' | 'saboteur' | 'hunter' | 'guardian' | 'disciplined'

const DIALOG_CONTENT = {
  en: {
    pill: 'Try it now',
    heading: 'Let AI read you before you register',
    sub: 'Answer 4 questions. See what AurumTrade would find in your journal.',
    questions: [
      "Before you register — let me show you what I'd find in your journal.\n\nWhat's your approximate win rate?",
      "What's your biggest struggle right now?",
      "How do you usually feel when trading?",
      "How many trades do you take per week?",
    ],
    options: [
      ['Under 40%', '40–55%', '55–70%', '70%+'],
      ['Revenge trades', 'Breaking my rules', 'Cutting winners early', 'Overtrading'],
      ['Calm', 'Frustrated / Angry', 'Greedy / FOMO', 'Anxious / Fearful'],
      ['1–5 trades', '6–15 trades', '16+ trades'],
    ],
    thinking: 'Analyzing your profile...',
    cta: 'Get your full analysis — Start free →',
    profiles: {
      reactor:     { name: 'The Reactor',       count: '847' },
      saboteur:    { name: 'The Saboteur',       count: '612' },
      hunter:      { name: 'The Hunter',         count: '934' },
      guardian:    { name: 'The Guardian',       count: '521' },
      disciplined: { name: 'The Disciplined',    count: '389' },
    },
    results: {
      reactor:     { i1: "Your win rate isn't a strategy problem — it's execution. After a loss, your next trade is 60% more likely to lose too.", i2: "Frustrated traders with revenge patterns give back $180–$340/month on average. Your real win rate on planned trades is likely 15–20% higher.", improve: '+14% win rate in 30 days' },
      saboteur:    { i1: "You have a working system — but you break it under pressure. Traders who violate their rules have 29% WR vs 71% when they follow them.", i2: "Anxious traders overtighten stops and exit winners early. You're leaving $200–$400/month on the table by not trusting your own system.", improve: '+11% win rate in 30 days' },
      hunter:      { i1: "Overtrading with FOMO is the #1 account killer. Traders taking 16+ trades/week on greed have 34% WR vs 61% on selective entries.", i2: "Your best trades are your first 3–5 of the week. Everything after is noise — costing you $250/month on average.", improve: '+18% win rate in 30 days' },
      guardian:    { i1: "Cutting winners early is a fear response. Traders with your pattern achieve only 60% of their potential RR — the rest stays on the table.", i2: "Your system likely has a real edge. AI would find that your average actual RR is 40% below your planned RR.", improve: '+9% effective RR in 30 days' },
      disciplined: { i1: "With 55–70%+ win rate you already have an edge. Now it's about scaling and protecting it — not rebuilding.", i2: "Top performers plateau when they stop reviewing. AI would find 2–3 specific setups where you're leaving money without knowing it.", improve: '+6% profit factor in 30 days' },
    },
  },
  uk: {
    pill: 'Спробуй зараз',
    heading: 'Нехай AI прочитає тебе до реєстрації',
    sub: 'Відповідай на 4 питання. Побач що AurumTrade знайшов би у твоєму журналі.',
    questions: [
      "До реєстрації — дозволь показати що я б знайшов у твоєму журналі.\n\nЯкий твій приблизний win rate?",
      "Яка твоя головна проблема зараз?",
      "Яку емоцію відчуваєш найчастіше під час торгівлі?",
      "Скільки угод ти робиш на тиждень?",
    ],
    options: [
      ['Менше 40%', '40–55%', '55–70%', '70%+'],
      ['Revenge trades', 'Порушую правила', 'Закриваю прибуток рано', 'Overtrade'],
      ['Спокій', 'Злість / Роздратування', 'Жадібність / FOMO', 'Страх / Тривога'],
      ['1–5 угод', '6–15 угод', '16+ угод'],
    ],
    thinking: 'Аналізую твій профіль...',
    cta: 'Отримати повний аналіз — Почати безкоштовно →',
    profiles: {
      reactor:     { name: 'Реактор',            count: '847' },
      saboteur:    { name: 'Саботажник',          count: '612' },
      hunter:      { name: 'Мисливець',           count: '934' },
      guardian:    { name: 'Перестрахувальник',   count: '521' },
      disciplined: { name: 'Дисциплінований',     count: '389' },
    },
    results: {
      reactor:     { i1: "Win rate — це не проблема стратегії, це виконання. Після збитку твоя наступна угода на 60% частіше програшна.", i2: "Трейдери з revenge патерном віддають $180–$340 на місяць. Твій реальний win rate на запланованих угодах на 15–20% вищий.", improve: '+14% win rate за 30 днів' },
      saboteur:    { i1: "У тебе є робоча система — але ти ламаєш її під тиском. Трейдери що порушують правила мають 29% WR vs 71% коли дотримуються.", i2: "Тривожні трейдери закривають прибуток рано і ставлять стопи занадто близько. Ти залишаєш $200–$400 на місяць.", improve: '+11% win rate за 30 днів' },
      hunter:      { i1: "Overtrade на жадібності — головний вбивця депозиту. Трейдери що беруть 16+ угод через FOMO мають 34% WR vs 61% на вибіркових входах.", i2: "Твої найкращі угоди — перші 3–5 на тиждень. Все інше — шум що коштує $250 на місяць.", improve: '+18% win rate за 30 днів' },
      guardian:    { i1: "Ранній вихід з прибутку — реакція страху. Трейдери з твоїм патерном реалізують лише 60% потенційного RR.", i2: "Твоя система має реальний edge. AI знайде що твій реальний RR на 40% нижче запланованого.", improve: '+9% ефективний RR за 30 днів' },
      disciplined: { i1: "З win rate 55–70%+ у тебе вже є edge. Тепер задача — масштабувати і захистити, а не перебудовувати.", i2: "Топ трейдери зупиняються в рості коли перестають аналізувати. AI знайде 2–3 сетапи де ти залишаєш гроші не знаючи.", improve: '+6% profit factor за 30 днів' },
    },
  },
}

function getProfile(wr: number, struggle: number, emotion: number): Profile {
  if (emotion === 1 && struggle === 0) return 'reactor'
  if (emotion === 3 && struggle === 1) return 'saboteur'
  if (emotion === 2 && struggle === 3) return 'hunter'
  if (emotion === 0 && wr >= 2)        return 'disciplined'
  if (struggle === 2)                  return 'guardian'
  if (struggle === 0 || emotion === 1) return 'reactor'
  if (struggle === 1 || emotion === 3) return 'saboteur'
  return 'hunter'
}

function AIDialog({ isMobile }: { isMobile: boolean }) {
  const [lang, setLang]       = useState<'en' | 'uk'>('en')
  const [messages, setMessages] = useState<Message[]>([])
  const [options, setOptions]   = useState<string[]>([])
  const [step, setStep]         = useState(0)
  const [typing, setTyping]     = useState(false)
  const [answers, setAnswers]   = useState<number[]>([])
  const [done, setDone]         = useState(false)
  const [result, setResult]     = useState<any>(null)
  const [profile, setProfile]   = useState<Profile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const c = DIALOG_CONTENT[lang]

  useEffect(() => {
    setMessages([]); setOptions([]); setStep(0)
    setAnswers([]); setDone(false); setResult(null); setProfile(null)
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages([{ type: 'ai', text: DIALOG_CONTENT[lang].questions[0] }])
      setOptions(DIALOG_CONTENT[lang].options[0])
    }, 800)
  }, [lang])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, result])

  const handleOption = (idx: number, label: string) => {
    const newAnswers = [...answers, idx]
    setAnswers(newAnswers)
    setOptions([])
    setMessages(prev => [...prev, { type: 'user', text: label }])
    const nextStep = step + 1

    if (nextStep < 4) {
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        setMessages(prev => [...prev, { type: 'ai', text: c.questions[nextStep] }])
        setOptions(c.options[nextStep])
        setStep(nextStep)
      }, 700)
    } else {
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        setMessages(prev => [...prev, { type: 'ai', text: c.thinking }])
        const p = getProfile(newAnswers[0], newAnswers[1], newAnswers[2])
        setProfile(p)
        setResult(c.results[p])
        setTimeout(() => setDone(true), 600)
      }, 1200)
    }
  }

  const progressColors = [GREEN, ORANGE, PURPLE, BLUE]

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Lang toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 12 }}>
        {(['en','uk'] as const).map(l => (
          <button key={l} onClick={() => setLang(l)} style={{ background: lang === l ? 'rgba(255,255,255,0.08)' : 'transparent', border: `1px solid ${lang === l ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: lang === l ? '#fff' : 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: FONT, letterSpacing: '0.04em' }}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${PURPLE}25`, border: `1px solid ${PURPLE}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>AurumTrade AI</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: `0 0 6px ${GREEN}` }} />
              {lang === 'en' ? '60-second trader analysis' : 'Аналіз трейдера за 60 секунд'}
            </div>
          </div>
          {/* Progress dots */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width: 28, height: 3, borderRadius: 2, background: i < step + (done ? 1 : 0) ? progressColors[i] : 'rgba(255,255,255,0.1)', transition: 'background 0.4s' }} />
            ))}
          </div>
        </div>

        {/* Messages */}
        <div style={{ padding: '20px 18px', minHeight: 200, maxHeight: isMobile ? 320 : 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.type === 'user' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-start' }}>
              {m.type === 'ai' && (
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${PURPLE}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginTop: 2 }}>🤖</div>
              )}
              <div style={{
                maxWidth: '85%', padding: '10px 14px', fontSize: 14, lineHeight: 1.55, fontFamily: FONT,
                borderRadius: m.type === 'ai' ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                background: m.type === 'ai' ? 'rgba(255,255,255,0.06)' : `${PURPLE}25`,
                border: `1px solid ${m.type === 'ai' ? 'rgba(255,255,255,0.08)' : PURPLE + '40'}`,
                color: m.type === 'ai' ? 'rgba(255,255,255,0.85)' : '#fff',
                whiteSpace: 'pre-line',
              }}>
                {m.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${PURPLE}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>🤖</div>
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 18px 18px 18px', display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', animation: `typingDot 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* Result card */}
          {done && profile && result && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${GREEN}30`, borderRadius: 18, padding: '20px', marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{c.profiles[profile].name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{c.profiles[profile].count} traders</div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
                {lang === 'en' ? 'with this exact profile in AurumTrade' : 'з точно таким же профілем в AurumTrade'}
              </div>
              {[result.i1, result.i2].map((ins: string, i: number) => (
                <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, marginBottom: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, borderLeft: `2px solid ${i === 0 ? GREEN : ORANGE}` }}>
                  {ins}
                </div>
              ))}
              <div style={{ marginTop: 14, padding: '10px 14px', background: `${GREEN}12`, border: `1px solid ${GREEN}25`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{lang === 'en' ? 'Average improvement:' : 'Середнє покращення:'}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: GREEN }}>{result.improve}</div>
              </div>
              <Link href="/register" style={{ display: 'block', textAlign: 'center', marginTop: 14, padding: '13px', borderRadius: 14, background: `linear-gradient(135deg, ${GREEN}, #2ecc71)`, color: '#000', textDecoration: 'none', fontSize: 14, fontWeight: 800, boxShadow: `0 0 30px ${GREEN}44`, fontFamily: FONT }}>
                {c.cta}
              </Link>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Options */}
        {options.length > 0 && (
          <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {options.map((opt, i) => (
              <button key={i} onClick={() => handleOption(i, opt)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '11px 16px', fontSize: 14, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', textAlign: 'left', fontFamily: FONT, transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes typingDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}

// ─── MAIN LANDING ──────────────────────────────────────────────────────────

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
    { q: 'Is there a mobile version?',        a: 'AurumTrade is fully responsive and works great on any device — phone, tablet, or desktop.' },
    { q: 'Can I cancel my subscription?',     a: 'Absolutely. Cancel anytime from your billing settings — no questions asked, no hidden fees.' },
    { q: 'What markets does it support?',     a: 'Futures and Spot trading. Long and Short positions. Any trading pair — crypto, forex, stocks.' },
    { q: 'How does the AI know my patterns?', a: 'AI reads your actual trade history — setup, result, emotion, playbook compliance, journal mood — and finds patterns specific to your trading, not generic advice.' },
    { q: 'Can I try it before paying?',       a: 'Yes! The Free plan includes up to 20 trades with basic analytics. No credit card required.' },
    { q: 'What is CSV Import?',               a: 'Upload your trades directly from Bybit, Binance, OKX, Bitget, MEXC and more. Trades are parsed and added automatically — no manual entry needed.' },
    { q: 'What is Performance Simulator?',    a: "Monte Carlo simulation that projects your current stats into the future. See where you'll be in 3-6 months if you keep trading the same way." },
  ]

  return (
    <main style={{ background: '#060608', minHeight: '100vh', color: '#fff', fontFamily: FONT, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: ${GREEN}44; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes typingDot { 0%,80%,100%{opacity:0.3;transform:scale(1)} 40%{opacity:1;transform:scale(1.2)} }
      `}</style>

      {isMobile && showSticky && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, padding: '12px 16px 24px', background: 'rgba(6,6,8,0.94)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
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

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: isMobile ? '110px 20px 80px' : '130px 24px 100px', zIndex: 1 }}>
        <div style={{ textAlign: 'center', maxWidth: 860, width: '100%' }}>
          <Pill color={GREEN}>AI-powered trading journal</Pill>
          <h1 style={{ fontSize: isMobile ? 42 : 80, fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.05em', marginBottom: 24 }}>
            <GradientText from="#ffffff" to="rgba(255,255,255,0.65)">Trade smarter.</GradientText>
            <br />
            <GradientText from={GREEN} to="#2ecc71">Grow faster.</GradientText>
          </h1>
          <p style={{ fontSize: isMobile ? 16 : 21, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, maxWidth: 600, margin: '0 auto 40px' }}>
            An AI trading journal with coaching, psychology analysis, playbook rules, emotion tracking, goals, simulator and daily notes. Stop repeating the same mistakes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <Link href="/register" style={{ padding: isMobile ? '14px 28px' : '17px 40px', borderRadius: 16, background: `linear-gradient(135deg, ${GREEN}, #2ecc71)`, color: '#000', textDecoration: 'none', fontSize: isMobile ? 15 : 17, fontWeight: 800, boxShadow: `0 0 50px ${GREEN}55` }}>Start for free →</Link>
            <Link href="/login"    style={{ padding: isMobile ? '14px 28px' : '17px 40px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: isMobile ? 15 : 17, fontWeight: 500, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}>Log in</Link>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.02em' }}>Free up to 20 trades · No credit card required</p>
          <div style={{ marginTop: isMobile ? 48 : 72, animation: 'float 6s ease-in-out infinite' }}>
            <Glass style={{ padding: isMobile ? '16px' : '24px', borderRadius: 24, maxWidth: 720, margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 8 : 10, marginBottom: 12, position: 'relative', zIndex: 1 }}>
                {[{ l:'Win Rate',v:'62%',c:GREEN },{ l:'Total P&L',v:'+$1,240',c:GREEN },{ l:'Avg RR',v:'2.14',c:ORANGE },{ l:'Streak',v:'7 days',c:BLUE }].map(s => (
                  <div key={s.l} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: isMobile ? '12px' : '14px 16px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{s.l}</div>
                    <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: s.c, letterSpacing: '-0.03em' }}>{s.v}</div>
                  </div>
                ))}
              </div>
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

      {/* STATS */}
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

      {/* AI DIALOG SECTION */}
      <section style={{ padding: `0 ${px} ${pb}`, maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 60 }}>
          <Pill color={PURPLE}>Try it now</Pill>
          <h2 style={{ fontSize: isMobile ? 30 : 54, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.05, marginBottom: 16 }}>
            <GradientText from="#fff" to="rgba(255,255,255,0.55)">Let AI read you</GradientText>
            <br />
            <GradientText from={PURPLE} to={BLUE}>before you register</GradientText>
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 18, color: 'rgba(255,255,255,0.35)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            Answer 4 questions. See what AurumTrade would find in your journal.
          </p>
        </div>
        <AIDialog isMobile={isMobile} />
      </section>

      {/* KILLER FEATURES */}
      <section style={{ padding: `0 ${px} ${pb}`, maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 72 }}>
          <Pill color={PURPLE}>What's new</Pill>
          <h2 style={{ fontSize: isMobile ? 30 : 54, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.05 }}>
            <GradientText from="#fff" to="rgba(255,255,255,0.55)">Features your competitors<br />don't have</GradientText>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 20, marginBottom: isMobile ? 12 : 20 }}>
          <Glass accent={GREEN} style={{ padding: isMobile ? '28px 22px' : '44px 40px', borderRadius: 28 }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: '-0.03em' }}>Playbook</div>
              <div style={{ fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 24 }}>
                Define your setup rules. Every trade tracks which rules you followed — and shows win rate with vs without compliance.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {['Define entry rules per setup', 'Track compliance on every trade', 'Win rate: followed vs violated', '+X% insight when rules work'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: `${GREEN}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: GREEN, flexShrink: 0, fontWeight: 800 }}>✓</div>
                    <span style={{ fontSize: isMobile ? 13 : 14, color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${GREEN}30`, borderRadius: 16, padding: '16px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 10 }}>CHoCH + BOS + FVG</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
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
                <div style={{ fontSize: 12, fontWeight: 700, color: GREEN, background: `${GREEN}12`, border: `1px solid ${GREEN}25`, borderRadius: 8, padding: '7px 10px' }}>
                  Following rules gives +37% win rate
                </div>
              </div>
            </div>
          </Glass>

          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 20 }}>
            <Glass accent={ORANGE} style={{ padding: isMobile ? '24px 22px' : '32px 32px', borderRadius: 28, flex: 1 }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>🧠</div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.03em' }}>Emotion Tracking</div>
                <div style={{ fontSize: isMobile ? 13 : 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: 16 }}>
                  Log your emotional state on every trade. AI finds which emotions hurt your win rate most.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[{ e:'😌',l:'Calm',c:GREEN,wr:'71%' },{ e:'🤑',l:'Greed',c:ORANGE,wr:'38%' },{ e:'💀',l:'Revenge',c:RED,wr:'22%' },{ e:'🚀',l:'Euphoria',c:PURPLE,wr:'41%' }].map(em => (
                    <div key={em.l} style={{ background: `${em.c}15`, border: `1px solid ${em.c}30`, borderRadius: 10, padding: '8px 10px', textAlign: 'center', flex: 1, minWidth: 52 }}>
                      <div style={{ fontSize: 18 }}>{em.e}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{em.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: em.c, marginTop: 1 }}>{em.wr}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Glass>
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

        <Glass accent={ORANGE} style={{ padding: isMobile ? '28px 22px' : '40px 44px', borderRadius: 28, marginBottom: isMobile ? 12 : 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 20 : 48, alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: 36, marginBottom: 16 }}>📥</div>
              <div style={{ fontSize: isMobile ? 22 : 32, fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.03em' }}>CSV Import</div>
              <div style={{ fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 20 }}>
                Stop entering trades manually. Upload your history directly from your exchange — we auto-detect format.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Bybit','Binance','OKX','MEXC','Bitget','Gate.io','HTX','KuCoin','BingX','Phemex'].map(ex => (
                  <div key={ex} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{ex}</div>
                ))}
              </div>
            </div>
            <div>
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

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 20 }}>
          <Glass accent={GREEN} style={{ padding: isMobile ? '24px 22px' : '32px 32px', borderRadius: 28 }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🎯</div>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.03em' }}>Goals & Streak</div>
              <div style={{ fontSize: isMobile ? 13 : 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: 16 }}>
                Set weekly and monthly goals — win rate, trade count, P&L. Track your streak of active trading days.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Weekly & monthly goals', 'Win rate / P&L / trade count targets', 'Streak counter with trophy at 7 days', 'Auto-progress from real trades'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: `${GREEN}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: GREEN, flexShrink: 0, fontWeight: 800 }}>✓</div>
                    <span style={{ fontSize: isMobile ? 12 : 13, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </Glass>
          <Glass accent={PURPLE} style={{ padding: isMobile ? '24px 22px' : '32px 32px', borderRadius: 28 }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>📈</div>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.03em' }}>Performance Simulator</div>
              <div style={{ fontSize: isMobile ? 13 : 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: 16 }}>
                Monte Carlo simulation based on your real stats. See where you'll be in 3-6 months if you keep trading the same way.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['200 Monte Carlo scenarios', 'P10 / P50 / P90 outcomes', 'Ruin probability calculator', 'EV calculator'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: `${PURPLE}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: PURPLE, flexShrink: 0, fontWeight: 800 }}>✓</div>
                    <span style={{ fontSize: isMobile ? 12 : 13, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </Glass>
        </div>
      </section>

      {/* AI FEATURES */}
      <section style={{ padding: `0 ${px} ${pb}`, maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 72 }}>
          <Pill color={PURPLE}>AI Intelligence</Pill>
          <h2 style={{ fontSize: isMobile ? 30 : 54, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.05, marginBottom: 16 }}>
            <GradientText from="#fff" to="rgba(255,255,255,0.55)">Not just AI.</GradientText>
            <br />
            <GradientText from={PURPLE} to={BLUE}>Your personal trading analyst.</GradientText>
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 18, color: 'rgba(255,255,255,0.35)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
            Other journals show you charts. AurumTrade tells you exactly why you're losing — and what to fix.
          </p>
        </div>

        <Glass accent={PURPLE} style={{ padding: isMobile ? '28px 22px' : '48px 48px', borderRadius: 28, marginBottom: isMobile ? 12 : 20, background: `${PURPLE}08` }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${PURPLE}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>What your AI coach actually finds</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Real insights from real journal data — not generic advice</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? 10 : 14 }}>
              {[
                { icon: '😌', label: 'Psychology Analysis found:', insight: "Your win rate when calm: 71%. When feeling revenge: 22%. You've lost $340 on revenge trades this month.", color: PURPLE, tag: 'Psychology' },
                { icon: '📋', label: 'AI Coach found:', insight: "You follow your CHoCH+BOS playbook 68% of the time. The 32% when you break rules has a 29% win rate vs 71% when you follow them.", color: GREEN, tag: 'Coach' },
                { icon: '📊', label: 'Trade Score detected:', insight: "Your BOS setup on Mondays has 38% win rate (12 trades). On Wednesdays–Thursdays: 67%. You're taking low-probability trades early in the week.", color: ORANGE, tag: 'Trade Score' },
                { icon: '🔍', label: 'Trade Review revealed:', insight: "You grade yourself B when AI grades you D on 23% of trades. Your entries after a loss are on average 40% lower quality than your normal entries.", color: BLUE, tag: 'Trade Review' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${item.color}30`, borderRadius: 18, padding: isMobile ? '18px' : '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: item.color, background: `${item.color}18`, border: `1px solid ${item.color}30`, borderRadius: 20, padding: '2px 10px' }}>{item.tag}</span>
                  </div>
                  <div style={{ fontSize: isMobile ? 13 : 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, fontWeight: 500 }}>"{item.insight}"</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: '16px 20px', background: `${GREEN}10`, border: `1px solid ${GREEN}25`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 20 }}>💡</div>
              <div style={{ fontSize: isMobile ? 12 : 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                <span style={{ color: GREEN, fontWeight: 700 }}>Every insight is based on your actual data.</span>{' '}
                The more trades you log, the sharper the analysis.
              </div>
            </div>
          </div>
        </Glass>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 16, marginBottom: isMobile ? 10 : 16 }}>
          {[
            { icon: '🧠', title: 'AI Coach', color: GREEN, desc: 'Full journal analysis: setup performance, emotion patterns, playbook discipline, risk management. Returns 9 specific insights + 4 action steps.', stats: 'Analyzes last 50 trades' },
            { icon: '🎯', title: 'Trade Score', color: ORANGE, desc: 'Pre-trade probability score based on your personal historical win rate. Detects tilt risk, emotion impact, and unfavorable conditions.', stats: 'Scores 0–100 with confidence level' },
            { icon: '🧬', title: 'Psychology', color: PURPLE, desc: 'Identifies cognitive biases — loss aversion, revenge trading, overconfidence. Measures after-loss behavior and self-assessment accuracy.', stats: 'Severity: critical / high / medium / low' },
          ].map(f => (
            <Glass key={f.title} accent={f.color} hover style={{ padding: isMobile ? '22px 18px' : '28px 24px', borderRadius: 22 }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{f.icon}</div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: PURPLE, background: `${PURPLE}20`, border: `1px solid ${PURPLE}35`, borderRadius: 20, padding: '3px 10px' }}>Pro</span>
                </div>
                <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>{f.title}</div>
                <div style={{ fontSize: isMobile ? 12 : 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, marginBottom: 14 }}>{f.desc}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: f.color, background: `${f.color}12`, border: `1px solid ${f.color}25`, borderRadius: 8, padding: '5px 10px', display: 'inline-block' }}>{f.stats}</div>
              </div>
            </Glass>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 10 : 16 }}>
          {[
            { icon: '💬', title: 'AI Chat', color: BLUE, desc: 'Chat with AI that has full context of your journal — 50 trades, emotions, playbook compliance, mood history. Ask anything specific about your trading.', stats: '50 messages/hour' },
            { icon: '📊', title: 'Trade Review', color: RED, desc: 'Per-trade deep analysis: entry quality, execution score 0–100, AI grade vs your self-grade, setup historical context, and one key lesson per trade.', stats: 'Execution score + AI grade vs self-grade' },
          ].map(f => (
            <Glass key={f.title} accent={f.color} hover style={{ padding: isMobile ? '22px 18px' : '28px 24px', borderRadius: 22 }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{f.icon}</div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: PURPLE, background: `${PURPLE}20`, border: `1px solid ${PURPLE}35`, borderRadius: 20, padding: '3px 10px' }}>Pro</span>
                </div>
                <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>{f.title}</div>
                <div style={{ fontSize: isMobile ? 12 : 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, marginBottom: 14 }}>{f.desc}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: f.color, background: `${f.color}12`, border: `1px solid ${f.color}25`, borderRadius: 8, padding: '5px 10px', display: 'inline-block' }}>{f.stats}</div>
              </div>
            </Glass>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: `0 ${px} ${pb}`, maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 72 }}>
          <Pill color={BLUE}>How it works</Pill>
          <h2 style={{ fontSize: isMobile ? 30 : 54, fontWeight: 900, letterSpacing: '-0.05em' }}>
            <GradientText from="#fff" to="rgba(255,255,255,0.55)">Three steps to results</GradientText>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 16 }}>
          {[
            { num: '01', title: 'Log your trades',  desc: 'Fill in setup, direction, result, emotion, playbook rules, screenshot, comment.', color: GREEN  },
            { num: '02', title: 'AI analyzes',       desc: 'Run AI Coach, get Trade Score, Psychology — all using your actual journal data.', color: BLUE   },
            { num: '03', title: 'Grow as a trader', desc: 'Follow concrete AI steps. Watch win rate and discipline improve over time.', color: ORANGE },
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

      {/* TESTIMONIALS */}
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
                  <div style={{ color: GOLD, fontSize: isMobile ? 12 : 14, letterSpacing: 2 }}>★★★★★</div>
                </div>
              </div>
            </Glass>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: `0 ${px} ${pb}`, maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 72 }}>
          <Pill color={GOLD}>Pricing</Pill>
          <h2 style={{ fontSize: isMobile ? 30 : 54, fontWeight: 900, letterSpacing: '-0.05em' }}>
            <GradientText from="#fff" to="rgba(255,255,255,0.55)">Start for free</GradientText>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 20 }}>
          <Glass style={{ padding: isMobile ? '28px 22px' : '44px 38px', borderRadius: 28 }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Free</div>
              <div style={{ fontSize: isMobile ? 40 : 52, fontWeight: 900, letterSpacing: '-0.05em', marginBottom: 4 }}>$0</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 28 }}>forever</div>
              {['Up to 20 trades', 'Basic analytics', 'Dashboard', 'Dark mode & i18n', 'CSV Import (limited)'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>✓</div>
                  <span style={{ fontSize: isMobile ? 13 : 14, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                </div>
              ))}
              <Link href="/register" style={{ display: 'block', textAlign: 'center', marginTop: 28, padding: '14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14, fontWeight: 600, background: 'rgba(255,255,255,0.04)' }}>Get started →</Link>
            </div>
          </Glass>
          <Glass accent={GREEN} style={{ padding: isMobile ? '28px 22px' : '44px 38px', borderRadius: 28, background: `${GREEN}0d` }}>
            <div style={{ position: 'absolute', top: 18, right: 18, background: `linear-gradient(135deg, ${GOLD}, ${ORANGE})`, color: '#000', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 100, zIndex: 2, letterSpacing: '0.04em' }}>BEST VALUE</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 13, color: GREEN, marginBottom: 8, fontWeight: 700 }}>Pro</div>
              <div style={{ fontSize: isMobile ? 40 : 52, fontWeight: 900, letterSpacing: '-0.05em', marginBottom: 4 }}>$19</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 28 }}>per month</div>
              {['Unlimited trades','CSV Import (all exchanges)','Playbook + compliance','Emotion tracking','Daily Journal','Goals & Streak','Performance Simulator','Trade screenshots','Public profile','AI Coach','AI Trade Score','AI Psychology Analysis','AI Chat','Analysis history'].map(f => (
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

      {/* FAQ */}
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
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: isMobile ? '18px 20px' : '20px 26px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontFamily: FONT, minHeight: 58 }}>
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

      {/* FINAL CTA */}
      <section style={{ padding: `0 ${px} ${isMobile ? '100px' : '130px'}`, maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Glass accent={GREEN} style={{ padding: isMobile ? '48px 24px' : '80px 64px', borderRadius: 32, background: `${GREEN}0d`, textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${GREEN}15 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: isMobile ? 40 : 68, marginBottom: 16 }}>🚀</div>
            <h2 style={{ fontSize: isMobile ? 28 : 48, fontWeight: 900, letterSpacing: '-0.05em', marginBottom: 14, lineHeight: 1.05 }}>
              <GradientText from="#fff" to="rgba(255,255,255,0.7)">Ready to trade smarter?</GradientText>
            </h2>
            <p style={{ fontSize: isMobile ? 14 : 18, color: 'rgba(255,255,255,0.4)', marginBottom: 32, lineHeight: 1.6 }}>
              Join traders who are already using AI<br />to improve their results
            </p>
            <Link href="/register" style={{ padding: isMobile ? '15px 36px' : '18px 52px', borderRadius: 16, background: `linear-gradient(135deg, ${GREEN}, #2ecc71)`, color: '#000', textDecoration: 'none', fontSize: isMobile ? 16 : 18, fontWeight: 800, boxShadow: `0 0 60px ${GREEN}55`, display: 'inline-block' }}>
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
          <Link href="/privacy"  style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/terms"    style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Terms</Link>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>by dnproduction · 2026</div>
        </div>
      </footer>
    </main>
  )
}
