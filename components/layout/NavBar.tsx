'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useTheme } from '@/components/layout/ThemeProvider';
import { useLocale } from '@/hooks/useLocale';

const FONT = "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', sans-serif";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const { locale, toggleLocale, t } = useLocale();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const links = [
    { href: '/dashboard', label: t('nav_dashboard') },
    { href: '/trades',    label: t('nav_journal')   },
    { href: '/ai',        label: t('nav_ai')         },
    { href: '/analytics', label: t('nav_analytics')  },
    { href: '/settings',  label: t('nav_settings')   },
    { href: '/billing',   label: t('nav_billing')    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const btnStyle: React.CSSProperties = {
    background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
    border: 'none',
    borderRadius: 8,
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
    color: dark ? '#f5f5f7' : '#1c1c1e',
    fontFamily: FONT,
  }

  return (
    <nav style={{
      fontFamily: FONT,
      background: dark ? 'rgba(28,28,30,0.9)' : 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
      padding: '0 40px',
      height: 52,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: dark ? '#f5f5f7' : '#1d1d1f', letterSpacing: '-0.02em' }}>
        TradeLog <span style={{ color: '#30d158' }}>Pro</span>
      </span>

      <div style={{ display: 'flex', gap: 2 }}>
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              padding: '5px 14px',
              borderRadius: 7,
              fontSize: 13,
              fontWeight: isActive(href) ? 600 : 400,
              color: isActive(href) ? (dark ? '#f5f5f7' : '#1d1d1f') : '#6e6e73',
              textDecoration: 'none',
              background: isActive(href) ? (dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)') : 'transparent',
              transition: 'all 0.15s ease',
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={toggleLocale} style={btnStyle}>
          {locale === 'uk' ? 'EN' : 'UK'}
        </button>
        <button onClick={toggle} style={btnStyle}>
          {dark ? '☀️' : '🌙'}
        </button>
        <button
          onClick={handleLogout}
          style={{ fontSize: 13, color: '#6e6e73', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, marginLeft: 4 }}
        >
          {t('nav_logout')}
        </button>
      </div>
    </nav>
  );
}
