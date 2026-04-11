'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const FONT   = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
const NUNITO = "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif"
const GREEN  = '#30d158'
const RED    = '#ff453a'
const BLUE   = '#0a84ff'
const ORANGE = '#ff9f0a'
const GRAY   = '#8e8e93'

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '20px',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: GRAY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: color || '#fff', letterSpacing: '-0.03em' }}>{value}</div>
    </div>
  )
}

export default function PublicProfilePage() {
  const params = useParams()
  const username = params.username as string

  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`/api/public/${username}`)
        const json = await res.json()
        if (json.success) setData(json.data)
        else setError('Trader not found')
      } catch { setError('Network error') }
      setLoading(false)
    }
    load()
  }, [username])

  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0b', fontFamily: FONT, position: 'relative', overflow: 'hidden' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');`}</style>

      <div style={{ position: 'fixed', inset: 0, backgroundImage: noiseSvg, opacity: 0.35, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: -200, left: '30%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(48,209,88,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -200, right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(10,132,255,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* NavBar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,11,0.8)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 24px', height: 54,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect x="0" y="0" width="28" height="28" rx="8" fill="rgba(48,209,88,0.12)" />
            <rect x="0" y="0" width="28" height="28" rx="8" stroke="rgba(48,209,88,0.35)" strokeWidth="1" />
            <path d="M14 6L20.5 22H17.8L16.2 18H11.8L10.2 22H7.5L14 6Z" fill="#30d158" />
            <path d="M12.7 15.5H15.3L14 11.5L12.7 15.5Z" fill="#0a0a0b" />
            <circle cx="14" cy="6" r="1.5" fill="#f5c842" />
          </svg>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: NUNITO, fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
              Aurum<span style={{ color: GREEN }}>Trade</span>
            </div>
            <div style={{ fontFamily: NUNITO, fontSize: 9, fontWeight: 600, color: 'rgba(245,200,66,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Pro Edition</div>
          </div>
        </Link>
        <Link href="/login" style={{ fontSize: 13, color: GREEN, fontWeight: 600, textDecoration: 'none', background: `${GREEN}18`, border: `1px solid ${GREEN}33`, borderRadius: 10, padding: '7px 16px' }}>
          Sign in →
        </Link>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 16px', position: 'relative', zIndex: 1 }}>

        {loading && (
          <div style={{ textAlign: 'center', color: GRAY, fontSize: 14, marginTop: 80 }}>Loading...</div>
        )}

        {error && (
          <div style={{ textAlign: 'center', marginTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Trader not found</div>
            <div style={{ fontSize: 14, color: GRAY }}>No public profile for @{username}</div>
          </div>
        )}

        {data && (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: `linear-gradient(135deg, ${GREEN}33, ${BLUE}22)`,
                border: `1px solid ${GREEN}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 28,
              }}>📊</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 4 }}>
                @{data.username}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: data.plan === 'pro' ? `${GREEN}18` : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${data.plan === 'pro' ? GREEN + '44' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700,
                  color: data.plan === 'pro' ? GREEN : GRAY,
                }}>
                  {data.plan === 'pro' ? '⚡ Pro Trader' : '🆓 Free Trader'}
                </div>
                <div style={{ fontSize: 12, color: GRAY }}>{data.totalTrades} trades</div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }} className="stats-grid">
              <StatCard label="Win Rate" value={`${data.winRate}%`} color={data.winRate >= 50 ? GREEN : RED} />
              <StatCard label="Total P&L" value={`${data.totalPnl >= 0 ? '+' : ''}${data.totalPnl}$`} color={data.totalPnl >= 0 ? GREEN : RED} />
              <StatCard label="Avg RR" value={data.avgRR} color={BLUE} />
              <StatCard label="Trades" value={data.totalTrades} color="#fff" />
            </div>

            {/* Top Pairs + Setups */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }} className="pairs-grid">

              {/* Top Pairs */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>🔥 Top Pairs</div>
                {data.topPairs.length === 0
                  ? <div style={{ fontSize: 13, color: GRAY }}>No data</div>
                  : data.topPairs.map((p: any, i: number) => (
                    <div key={p.pair} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < data.topPairs.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 8, background: `${GREEN}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: GREEN }}>{i + 1}</div>
                        <span style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{p.pair}</span>
                      </div>
                      <span style={{ fontSize: 12, color: GRAY }}>{p.count} trades</span>
                    </div>
                  ))
                }
              </div>

              {/* Top Setups */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>📋 Top Setups</div>
                {data.topSetups.length === 0
                  ? <div style={{ fontSize: 13, color: GRAY }}>No data</div>
                  : data.topSetups.map((s: any, i: number) => (
                    <div key={s.setup} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < data.topSetups.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 8, background: `${BLUE}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: BLUE }}>{i + 1}</div>
                        <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{s.setup}</span>
                      </div>
                      <span style={{ fontSize: 12, color: s.winRate >= 50 ? GREEN : RED, fontWeight: 700 }}>{s.winRate}% WR</span>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Recent trades */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '20px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 32 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>📈 Recent Trades</div>
              {data.recentTrades.length === 0
                ? <div style={{ fontSize: 13, color: GRAY }}>No trades yet</div>
                : data.recentTrades.map((t: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < data.recentTrades.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.pair}</span>
                      <span style={{ fontSize: 12, color: t.direction === 'Long' ? GREEN : RED, fontWeight: 600 }}>{t.direction}</span>
                      <span style={{ fontSize: 11, color: GRAY }}>{t.setup}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: t.result === 'Тейк' ? GREEN : t.result === 'Стоп' ? RED : GRAY }}>
                        {t.result === 'Тейк' ? '✓' : t.result === 'Стоп' ? '✗' : '~'} {t.result}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: (t.profit_usd || 0) >= 0 ? GREEN : RED }}>
                        {(t.profit_usd || 0) >= 0 ? '+' : ''}{t.profit_usd}$
                      </span>
                      <span style={{ fontSize: 11, color: GRAY }}>{t.date}</span>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center', padding: '32px 20px', background: `linear-gradient(135deg, ${GREEN}12, ${BLUE}08)`, borderRadius: 20, border: `1px solid ${GREEN}22` }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.03em' }}>
                Track your trades with AurumTrade
              </div>
              <div style={{ fontSize: 14, color: GRAY, marginBottom: 20 }}>
                AI-powered trading journal. Free to start.
              </div>
              <Link href="/register" style={{
                display: 'inline-block', background: GREEN, color: '#000',
                borderRadius: 12, padding: '12px 28px', fontSize: 15, fontWeight: 800,
                textDecoration: 'none', boxShadow: `0 0 30px ${GREEN}33`,
              }}>
                Start for free →
              </Link>
            </div>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .pairs-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
