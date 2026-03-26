'use client';

import { useState, useEffect, Suspense } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';

const FONT   = "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', sans-serif";
const PURPLE = '#5e4ce6';
const GREEN  = '#30d158';
const RED    = '#ff453a';

function useDark() {
  const [dark, setDark] = useState(false)
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

function BillingContent() {
  const dark   = useDark()
  const { t: tr } = useLocale()

  const textColor   = dark ? '#f5f5f7' : '#1c1c1e'
  const subColor    = dark ? 'rgba(255,255,255,0.35)' : '#8e8e93'
  const borderColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.8)'

  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

  const [plan,      setPlan]      = useState<'free' | 'pro'>('free');
  const [status,    setStatus]    = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [loading,   setLoading]   = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('success'))  setStatus('success');
    if (searchParams.get('canceled')) setStatus('canceled');
    loadUserPlan();
  }, []);

  async function loadUserPlan() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data } = await supabase.from('users').select('plan, subscription_status, current_period_end').eq('id', user.id).single();
    if (data) {
      setPlan(data.plan || 'free');
      if (data.current_period_end) setPeriodEnd(new Date(data.current_period_end).toLocaleDateString());
    }
  }

  async function handleUpgrade() {
    setLoading(true);
    try { const res = await fetch('/api/stripe/checkout', { method: 'POST' }); const data = await res.json(); if (data.url) window.location.href = data.url; } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handlePortal() {
    setLoading(true);
    try { const res = await fetch('/api/stripe/portal', { method: 'POST' }); const data = await res.json(); if (data.url) window.location.href = data.url; } catch (e) { console.error(e); }
    setLoading(false);
  }

  function glassCard(accent?: string): React.CSSProperties {
    return {
      background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderRadius: 20, padding: '28px',
      border: `1px solid ${accent ? accent + '44' : borderColor}`,
      boxShadow: dark
        ? 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.02)'
        : 'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)',
      position: 'relative', overflow: 'hidden',
    }
  }

  const glare = (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: dark ? 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />
  )

  const freeFeatures = [
    { label: tr('billing_f1'), yes: true  },
    { label: tr('billing_f2'), yes: true  },
    { label: tr('billing_f3'), yes: true  },
    { label: tr('billing_f4'), yes: false },
    { label: tr('billing_f5'), yes: false },
  ]

  const proFeatures = [tr('billing_p1'), tr('billing_p2'), tr('billing_p3'), tr('billing_p4'), tr('billing_p5')]

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>

      {/* Фон */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: dark ? '#0a0a0b' : 'linear-gradient(135deg, #e8edf5 0%, #f0f2f7 50%, #e8f0ed 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: noiseSvg, opacity: dark ? 0.35 : 0.15 }} />
      {dark ? (
        <>
          <div style={{ position: 'fixed', top: -200, left: '20%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,76,230,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'fixed', bottom: -200, right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(48,209,88,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        </>
      ) : (
        <>
          <div style={{ position: 'fixed', top: -150, left: '20%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,76,230,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'fixed', bottom: -150, right: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(48,209,88,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        </>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar />
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px' }}>

          <div style={{ fontSize: 28, fontWeight: 800, color: textColor, letterSpacing: '-0.04em', marginBottom: 4 }}>{tr('billing_title')}</div>
          <div style={{ fontSize: 14, color: subColor, marginBottom: 32 }}>{tr('billing_subtitle')}</div>

          {/* Status banners */}
          {status === 'success' && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: `${GREEN}15`, border: `1px solid ${GREEN}44`, color: GREEN, fontSize: 13, marginBottom: 24, fontWeight: 600 }}>
              ✓ {tr('billing_success')}
            </div>
          )}
          {status === 'canceled' && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,159,10,0.12)', border: '1px solid rgba(255,159,10,0.3)', color: '#ff9f0a', fontSize: 13, marginBottom: 24 }}>
              {tr('billing_canceled')}
            </div>
          )}

          {/* Current plan */}
          <div style={{ ...glassCard(), marginBottom: 32 }}>
            {glare}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: subColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{tr('billing_current')}</div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                  background: plan === 'pro' ? PURPLE + '22' : dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: plan === 'pro' ? PURPLE : subColor,
                  border: `1px solid ${plan === 'pro' ? PURPLE + '44' : borderColor}`,
                }}>
                  {plan === 'pro' ? '⚡ Pro' : 'Free'}
                </span>
              </div>
              {periodEnd && plan === 'pro' && (
                <span style={{ fontSize: 12, color: subColor }}>{tr('billing_next')} {periodEnd}</span>
              )}
            </div>
          </div>

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Free */}
            <div style={glassCard(plan === 'free' ? PURPLE : undefined)}>
              {glare}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, position: 'relative' }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: textColor, marginBottom: 3 }}>Free</div>
                  <div style={{ fontSize: 12, color: subColor }}>{tr('billing_free_desc')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: textColor, letterSpacing: '-0.02em', lineHeight: 1 }}>$0</div>
                  <span style={{ fontSize: 11, color: subColor }}>{tr('billing_forever')}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, position: 'relative' }}>
                {freeFeatures.map(f => (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, flexShrink: 0,
                      background: f.yes ? `${GREEN}22` : dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      color: f.yes ? GREEN : subColor,
                      border: `1px solid ${f.yes ? GREEN + '44' : borderColor}`,
                    }}>{f.yes ? '✓' : '×'}</span>
                    <span style={{ color: f.yes ? textColor : subColor }}>{f.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', marginBottom: 20, position: 'relative' }} />
              {plan === 'free'
                ? <div style={{ textAlign: 'center', fontSize: 12, color: subColor, padding: '11px 0', position: 'relative' }}>{tr('billing_current_plan')}</div>
                : <div style={{ height: 44, position: 'relative' }} />
              }
            </div>

            {/* Pro */}
            <div style={{ ...glassCard(PURPLE), border: plan === 'pro' ? `1px solid ${PURPLE}66` : `1px solid ${PURPLE}44` }}>
              {glare}
              {plan !== 'pro' && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: PURPLE, color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap', zIndex: 2 }}>
                  {tr('billing_recommended')}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, position: 'relative' }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: textColor, marginBottom: 3 }}>Pro ⚡</div>
                  <div style={{ fontSize: 12, color: subColor }}>{tr('billing_pro_desc')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: textColor, letterSpacing: '-0.02em', lineHeight: 1 }}>$19</div>
                  <span style={{ fontSize: 11, color: subColor }}>{tr('billing_per_month')}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, position: 'relative' }}>
                {proFeatures.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, flexShrink: 0,
                      background: `${GREEN}22`, color: GREEN, border: `1px solid ${GREEN}44`,
                    }}>✓</span>
                    <span style={{ color: textColor }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', marginBottom: 20, position: 'relative' }} />
              {plan === 'pro' ? (
                <button onClick={handlePortal} disabled={loading} style={{
                  width: '100%', padding: '12px', borderRadius: 12,
                  background: 'transparent',
                  border: `1px solid ${PURPLE}66`,
                  color: PURPLE, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: FONT, position: 'relative',
                  transition: 'all 0.2s',
                }}>
                  {loading ? tr('billing_loading') : tr('billing_portal')}
                </button>
              ) : (
                <button onClick={handleUpgrade} disabled={loading} style={{
                  width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                  background: PURPLE, color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: FONT, position: 'relative',
                  boxShadow: `0 0 24px ${PURPLE}44`, transition: 'all 0.2s',
                }}>
                  {loading ? tr('billing_loading') : tr('billing_upgrade')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return <Suspense><BillingContent /></Suspense>;
}
