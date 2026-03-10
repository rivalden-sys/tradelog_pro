'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTheme } from '@/components/layout/ThemeProvider';
import { useLocale } from '@/hooks/useLocale';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';

const FONT = "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', sans-serif";

function th(dark: boolean) {
  return {
    bg:       dark ? '#0a0a0b' : '#f2f2f7',
    surface:  dark ? '#1c1c1e' : '#ffffff',
    surface2: dark ? '#2c2c2e' : '#f2f2f7',
    border:   dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    text:     dark ? '#f5f5f7' : '#1c1c1e',
    sub:      '#8e8e93',
    shadow:   dark
      ? '0 1px 3px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.06)'
      : '0 1px 3px rgba(0,0,0,0.07),0 0 0 1px rgba(0,0,0,0.05)',
  }
}

const PURPLE = '#5e4ce6'

function BillingContent() {
  const { dark } = useTheme()
  const t = th(dark)
  const { t: tr } = useLocale()
  const [plan,      setPlan]      = useState<'free' | 'pro'>('free');
  const [status,    setStatus]    = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [loading,   setLoading]   = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
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

  const cardStyle: React.CSSProperties = {
    background: t.surface, borderRadius: 18, padding: '28px',
    boxShadow: t.shadow, border: '1.5px solid transparent', position: 'relative', transition: 'box-shadow 0.2s',
  }

  const freeFeatures = [
    { label: tr('billing_f1'), yes: true  },
    { label: tr('billing_f2'), yes: true  },
    { label: tr('billing_f3'), yes: true  },
    { label: tr('billing_f4'), yes: false },
    { label: tr('billing_f5'), yes: false },
  ]

  const proFeatures = [tr('billing_p1'), tr('billing_p2'), tr('billing_p3'), tr('billing_p4'), tr('billing_p5')]

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: FONT, transition: 'background 0.3s' }}>
      <NavBar />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 32px' }}>

        <div style={{ fontSize: 28, fontWeight: 700, color: t.text, letterSpacing: '-0.03em', marginBottom: 4 }}>{tr('billing_title')}</div>
        <div style={{ fontSize: 14, color: t.sub, marginBottom: 32 }}>{tr('billing_subtitle')}</div>

        {status === 'success' && <div style={{ padding: '12px 16px', borderRadius: 10, background: '#f0faf3', border: '1px solid #c6efd3', color: '#1a7f37', fontSize: 13, marginBottom: 24 }}>{tr('billing_success')}</div>}
        {status === 'canceled' && <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fffbf0', border: '1px solid #fde8a0', color: '#9a6700', fontSize: 13, marginBottom: 24 }}>{tr('billing_canceled')}</div>}

        <div style={{ background: t.surface, borderRadius: 16, padding: '20px 24px', marginBottom: 32, boxShadow: t.shadow, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{tr('billing_current')}</div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500, background: plan === 'pro' ? '#f0eeff' : t.surface2, color: plan === 'pro' ? PURPLE : t.sub }}>
              {plan === 'pro' ? '⚡ Pro' : 'Free'}
            </span>
          </div>
          {periodEnd && plan === 'pro' && <span style={{ fontSize: 12, color: t.sub }}>{tr('billing_next')} {periodEnd}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ ...cardStyle, borderColor: plan === 'free' ? t.border : 'transparent' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600, color: t.text, marginBottom: 3 }}>Free</div>
                <div style={{ fontSize: 12, color: t.sub }}>{tr('billing_free_desc')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: t.text, letterSpacing: '-0.02em', lineHeight: 1 }}>$0</div>
                <span style={{ fontSize: 11, color: t.sub }}>{tr('billing_forever')}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
              {freeFeatures.map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }}>
                  <span style={{ width: 15, height: 15, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, flexShrink: 0, background: f.yes ? '#e8f8ed' : t.surface2, color: f.yes ? '#1a7f37' : t.sub }}>{f.yes ? '✓' : '×'}</span>
                  <span style={{ color: f.yes ? t.text : t.sub }}>{f.label}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: t.border, marginBottom: 20 }} />
            {plan === 'free' ? <div style={{ textAlign: 'center', fontSize: 12, color: t.sub, padding: '11px 0' }}>{tr('billing_current_plan')}</div> : <div style={{ height: 44 }} />}
          </div>

          <div style={{ ...cardStyle, borderColor: plan === 'pro' ? '#c4b8ff' : 'transparent' }}>
            {plan !== 'pro' && (
              <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: PURPLE, color: '#fff', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                {tr('billing_recommended')}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600, color: t.text, marginBottom: 3 }}>Pro ⚡</div>
                <div style={{ fontSize: 12, color: t.sub }}>{tr('billing_pro_desc')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: t.text, letterSpacing: '-0.02em', lineHeight: 1 }}>$19</div>
                <span style={{ fontSize: 11, color: t.sub }}>{tr('billing_per_month')}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
              {proFeatures.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }}>
                  <span style={{ width: 15, height: 15, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, flexShrink: 0, background: '#e8f8ed', color: '#1a7f37' }}>✓</span>
                  <span style={{ color: t.text }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: t.border, marginBottom: 20 }} />
            {plan === 'pro' ? (
              <button onClick={handlePortal} disabled={loading} style={{ width: '100%', padding: 11, borderRadius: 10, background: 'transparent', border: `1.5px solid ${t.border}`, color: PURPLE, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: FONT }}>
                {loading ? tr('billing_loading') : tr('billing_portal')}
              </button>
            ) : (
              <button onClick={handleUpgrade} disabled={loading} style={{ width: '100%', padding: 11, borderRadius: 10, border: 'none', background: PURPLE, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: FONT }}>
                {loading ? tr('billing_loading') : tr('billing_upgrade')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return <Suspense><BillingContent /></Suspense>;
}