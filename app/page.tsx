'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    const onMouse = (e: MouseEvent) => {
      setMouseX((e.clientX / window.innerWidth - 0.5) * 20)
      setMouseY((e.clientY / window.innerHeight - 0.5) * 20)
    }
    window.addEventListener('scroll', onScroll)
    window.addEventListener('mousemove', onMouse)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('mousemove', onMouse) }
  }, [])

  return (
    <main style={{ background: '#080808', minHeight: '100vh', color: '#fff', fontFamily: FONT, overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 48px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(8,8,8,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.4s ease',
      }}>
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.04em' }}>
          TradeLog <span style={{ color: '#30d158' }}>Pro</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/login" style={{
            padding: '8px 20px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 500,
          }}>Войти</Link>
          <Link href="/register" style={{
            padding: '8px 20px', borderRadius: 10,
            background: '#30d158', color: '#000',
            textDecoration: 'none', fontSize: 14, fontWeight: 700,
          }}>Начать бесплатно</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '120px 24px 80px' }}>

        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(48,209,88,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Floating orbs */}
        <div style={{
          position: 'absolute', top: '20%', right: '15%',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(48,209,88,0.06) 0%, transparent 70%)',
          transform: `translate(${mouseX * 0.3}px, ${mouseY * 0.3}px)`,
          transition: 'transform 0.3s ease', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '25%', left: '10%',
          width: 150, height: 150, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(10,132,255,0.08) 0%, transparent 70%)',
          transform: `translate(${mouseX * -0.2}px, ${mouseY * -0.2}px)`,
          transition: 'transform 0.4s ease', pointerEvents: 'none',
        }} />

        <div style={{ textAlign: 'center', maxWidth: 800, position: 'relative', zIndex: 1 }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 32,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#30d158', boxShadow: '0 0 8px #30d158' }} />
            <span style={{ fontSize: 13, color: '#30d158', fontWeight: 600 }}>AI-powered торговый журнал</span>
          </div>

          <h1 style={{
            fontSize: 72, fontWeight: 900, lineHeight: 1.05,
            letterSpacing: '-0.05em', marginBottom: 24,
            background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Торгуй умнее.<br />
            <span style={{
              background: 'linear-gradient(135deg, #30d158, #34d399)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Расти быстрее.</span>
          </h1>

          <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 48, maxWidth: 560, margin: '0 auto 48px' }}>
            Журнал сделок с AI-коучем, психологическим анализом и Trade Score. Перестань терять деньги на одних и тех же ошибках.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              padding: '16px 36px', borderRadius: 14,
              background: '#30d158', color: '#000',
              textDecoration: 'none', fontSize: 16, fontWeight: 800,
              boxShadow: '0 0 40px rgba(48,209,88,0.3)',
              transition: 'all 0.2s',
            }}>
              Начать бесплатно →
            </Link>
            <Link href="/login" style={{
              padding: '16px 36px', borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', textDecoration: 'none', fontSize: 16, fontWeight: 500,
              background: 'rgba(255,255,255,0.04)',
            }}>
              Войти
            </Link>
          </div>

          <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
            Бесплатно до 20 сделок · Не нужна карта
          </p>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '0 48px 100px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { value: '12,430+', label: 'Сделок в системе' },
            { value: '57%',     label: 'Средний win rate' },
            { value: '84k',     label: 'AI анализов' },
            { value: '2,300+',  label: 'Активных трейдеров' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, padding: '28px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '0 48px 120px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 13, color: '#30d158', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Возможности</div>
          <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 16,
            background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Всё что нужно для роста
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', maxWidth: 500, margin: '0 auto' }}>
            Не просто журнал — полноценный AI-коуч который видит твои паттерны
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { icon: '📊', title: 'Журнал сделок', desc: 'Все поля реального трейдера: сетап, RR, направление, результат, скриншот, самооценка.', color: '#0a84ff' },
            { icon: '🧠', title: 'AI Coach', desc: 'Анализирует весь журнал: лучший сетап, худший, главная ошибка, конкретные шаги.', color: '#30d158' },
            { icon: '🎯', title: 'Trade Score', desc: 'AI оценивает вероятность успеха сделки на основе твоей истории до входа.', color: '#ff9f0a' },
            { icon: '🧬', title: 'Психологический анализ', desc: 'Читает комментарии и выявляет страх, жадность, revenge trading по паттернам.', color: '#bf5af2' },
            { icon: '📈', title: 'Аналитика', desc: 'Win rate по сетапам, P&L по парам, калькулятор дисциплины, распределение RR.', color: '#ff453a' },
            { icon: '🌙', title: 'Dark mode & i18n', desc: 'Тёмная и светлая тема. Интерфейс на русском и английском языках.', color: '#636366' },
          ].map(f => (
            <div key={f.title} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, padding: '32px 28px',
              transition: 'border-color 0.2s, background 0.2s',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, marginBottom: 20,
                background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>{f.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#fff' }}>{f.title}</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '0 48px 120px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 13, color: '#0a84ff', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Как это работает</div>
          <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em',
            background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Три шага к результату
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {[
            { num: '01', title: 'Записывай сделки', desc: 'Заполни все поля: сетап, RR, направление, результат, скриншот, комментарий и самооценку.', color: '#30d158' },
            { num: '02', title: 'AI анализирует', desc: 'Запусти AI Coach — он разберёт весь журнал, найдёт слабые места и психологические паттерны.', color: '#0a84ff' },
            { num: '03', title: 'Расти как трейдер', desc: 'Следуй конкретным шагам от AI. Смотри как меняется win rate и дисциплина от месяца к месяцу.', color: '#ff9f0a' },
          ].map((s, i) => (
            <div key={s.num} style={{
              background: i === 1 ? 'rgba(10,132,255,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${i === 1 ? 'rgba(10,132,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 20, padding: '40px 32px',
            }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: s.color, opacity: 0.3, letterSpacing: '-0.05em', marginBottom: 16 }}>{s.num}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#fff' }}>{s.title}</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '0 48px 120px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 13, color: '#ff9f0a', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Тарифы</div>
          <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em',
            background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Начни бесплатно
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Free */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24, padding: '40px 36px',
          }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Free</div>
            <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 4 }}>$0</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 32 }}>навсегда</div>
            {['До 20 сделок', 'Базовая аналитика', 'Dashboard', 'Dark mode'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</div>
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
              </div>
            ))}
            <Link href="/register" style={{
              display: 'block', textAlign: 'center', marginTop: 32,
              padding: '14px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 600,
            }}>Начать →</Link>
          </div>

          {/* Pro */}
          <div style={{
            background: 'rgba(48,209,88,0.06)', border: '1px solid rgba(48,209,88,0.25)',
            borderRadius: 24, padding: '40px 36px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 20, right: 20,
              background: '#30d158', color: '#000',
              fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 100,
            }}>РЕКОМЕНДУЕМ</div>
            <div style={{ fontSize: 14, color: '#30d158', marginBottom: 8, fontWeight: 600 }}>Pro ⚡</div>
            <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 4 }}>$19</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 32 }}>в месяц</div>
            {['Безлимитные сделки', 'Расширенная аналитика', 'AI Coach', 'AI анализ сделок', 'AI Trade Score', 'AI Психология', 'Приоритетная поддержка'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(48,209,88,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#30d158' }}>✓</div>
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>{f}</span>
              </div>
            ))}
            <Link href="/register" style={{
              display: 'block', textAlign: 'center', marginTop: 32,
              padding: '14px', borderRadius: 12,
              background: '#30d158', color: '#000',
              textDecoration: 'none', fontSize: 15, fontWeight: 800,
              boxShadow: '0 0 30px rgba(48,209,88,0.25)',
            }}>Начать Pro →</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 48px 120px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'rgba(48,209,88,0.06)', border: '1px solid rgba(48,209,88,0.15)',
          borderRadius: 28, padding: '64px 48px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(48,209,88,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <h2 style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 16,
            background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', position: 'relative' }}>
            Готов торговать умнее?
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', marginBottom: 36, position: 'relative' }}>
            Присоединяйся к трейдерам которые уже используют AI для роста
          </p>
          <Link href="/register" style={{
            padding: '16px 44px', borderRadius: 14,
            background: '#30d158', color: '#000',
            textDecoration: 'none', fontSize: 17, fontWeight: 800,
            boxShadow: '0 0 50px rgba(48,209,88,0.3)',
            position: 'relative',
          }}>
            Начать бесплатно →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 1200, margin: '0 auto',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.03em' }}>
          TradeLog <span style={{ color: '#30d158' }}>Pro</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
          by dnproduction · 2026
        </div>
      </footer>

    </main>
  )
}
