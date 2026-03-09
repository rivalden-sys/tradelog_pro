'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function BillingPage() {
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [status, setStatus] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    if (success) setStatus('success');
    if (canceled) setStatus('canceled');
    loadUserPlan();
  }, []);

  async function loadUserPlan() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data } = await supabase
      .from('users')
      .select('plan, subscription_status, current_period_end')
      .eq('id', user.id)
      .single();

    if (data) {
      setPlan(data.plan || 'free');
      if (data.current_period_end) {
        setPeriodEnd(new Date(data.current_period_end).toLocaleDateString());
      }
    }
  }

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-lg font-bold text-purple-400">TradeLog Pro</span>
            <div className="flex items-center gap-1">
              {[
                { href: '/dashboard', label: 'Dashboard' },
                { href: '/trades', label: 'Trades' },
                { href: '/ai', label: 'AI Coach' },
                { href: '/billing', label: 'Billing' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    href === '/billing'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Выйти
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Billing</h1>
        <p className="text-gray-400 mb-8">Управление подпиской</p>

        {status === 'success' && (
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6">
            ✅ Подписка активирована! Добро пожаловать в Pro.
          </div>
        )}
        {status === 'canceled' && (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mb-6">
            ⚠️ Оплата отменена. Ты остаёшься на Free плане.
          </div>
        )}

        {/* Текущий план */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Текущий план</h2>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              plan === 'pro'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500'
                : 'bg-gray-700 text-gray-300'
            }`}>
              {plan === 'pro' ? '⚡ Pro' : '🆓 Free'}
            </span>
            {periodEnd && plan === 'pro' && (
              <span className="text-gray-400 text-sm">Следующее списание: {periodEnd}</span>
            )}
          </div>
        </div>

        {/* Планы */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className={`rounded-xl p-6 border ${
            plan === 'free'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-800 bg-gray-900'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">Free</h3>
                <p className="text-gray-400 text-sm">Для начала</p>
              </div>
              <div className="text-2xl font-bold">$0</div>
            </div>
            <ul className="space-y-2 mb-6">
              {['До 20 сделок', 'Базовая аналитика', 'Дашборд'].map(f => (
                <li key={f} className="flex items-center gap-2 text-gray-300 text-sm">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
              {['AI анализ', 'Расширенная аналитика'].map(f => (
                <li key={f} className="flex items-center gap-2 text-gray-500 text-sm">
                  <span className="text-gray-600">✗</span> {f}
                </li>
              ))}
            </ul>
            {plan === 'free' && (
              <div className="text-center text-sm text-blue-400 font-medium py-2">
                ✓ Текущий план
              </div>
            )}
          </div>

          {/* Pro */}
          <div className={`rounded-xl p-6 border relative ${
            plan === 'pro'
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-purple-800 bg-gray-900'
          }`}>
            {plan !== 'pro' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                РЕКОМЕНДУЕМ
              </div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">Pro ⚡</h3>
                <p className="text-gray-400 text-sm">Для серьёзных трейдеров</p>
              </div>
              <div>
                <span className="text-2xl font-bold">$19</span>
                <span className="text-gray-400 text-sm">/mo</span>
              </div>
            </div>
            <ul className="space-y-2 mb-6">
              {[
                'Безлимитные сделки',
                'Расширенная аналитика',
                'AI Coach',
                'AI анализ сделок',
                'Приоритетная поддержка',
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-gray-300 text-sm">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>
            {plan === 'pro' ? (
              <button
                onClick={handlePortal}
                disabled={loading}
                className="w-full py-2 rounded-lg border border-purple-500 text-purple-400 hover:bg-purple-500/20 transition text-sm font-medium"
              >
                {loading ? 'Загрузка...' : 'Управлять подпиской'}
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition font-medium"
              >
                {loading ? 'Загрузка...' : 'Upgrade to Pro →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}