'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useTheme } from '@/components/layout/ThemeProvider';
import { useLocale } from '@/hooks/useLocale';

const FONT = "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', sans-serif";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const { locale, toggleLocale, t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const navBg = dark ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.95)';
  const borderColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textColor = dark ? '#f5f5f7' : '#1d1d1f';
  const subColor = '#6e6e73';

  return (
    <>
      <nav style={{
        fontFamily: FONT,
        background: navBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${borderColor}`,
        padding: '0 16px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <span style={{ fontSize: 15, fontWeight: 700, color: textColor, letterSpacing: '-0.02em', flexShrink: 0 }}>
          TradeLog <span style={{ color: '#30d158' }}>Pro</span>
        </span>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 2 }} className="desktop-only">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} style={{
              padding: '5px 12px', borderRadius: 7, fontSize: 13,
              fontWeight: isActive(href) ? 600 : 400,
              color: isActive(href) ? textColor : subColor,
              textDecoration: 'none',
              background: isActive(href) ? (dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)') : 'transparent',
            }}>{label}</Link>
          ))}
        </div>

        {/* Desktop right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-only">
          <button onClick={toggleLocale} style={{
            background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            border: 'none', borderRadius: 8, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 13, fontWeight: 700, color: textColor, fontFamily: FONT,
          }}>{locale === 'uk' ? 'EN' : 'UK'}</button>
          <button onClick={toggle} style={{
            background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            border: 'none', borderRadius: 8, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 14, fontFamily: FONT,
          }}>{dark ? '☀️' : '🌙'}</button>
          <button onClick={handleLogout} style={{
            fontSize: 13, color: subColor, background: 'none',
            border: 'none', cursor: 'pointer', fontFamily: FONT,
          }}>{t('nav_logout')}</button>
        </div>

        {/* Burger button — mobile only */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="mobile-only"
          style={{
            background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            border: 'none', borderRadius: 8, width: 36, height: 36,
            display: 'none', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexDirection: 'column', gap: 5, padding: '10px 8px',
            flexShrink: 0,
          }}
        >
          <span style={{
            display: 'block', width: 18, height: 2, background: textColor, borderRadius: 2,
            transition: 'all 0.2s',
            transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
          }} />
          <span style={{
            display: 'block', width: 18, height: 2, background: textColor, borderRadius: 2,
            transition: 'all 0.2s', opacity: menuOpen ? 0 : 1,
          }} />
          <span style={{
            display: 'block', width: 18, height: 2, background: textColor, borderRadius: 2,
            transition: 'all 0.2s',
            transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
          }} />
        </button>
      </nav>

      {/* Mobile dropdown — повна ширина, не виходить за межі */}
      {menuOpen && (
        <div
          className="mobile-only"
          style={{
            position: 'fixed',
            top: 52,
            left: 0,
            right: 0,
            zIndex: 99,
            background: navBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${borderColor}`,
            padding: '8px 12px 16px',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          {/* Links */}
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                padding: '13px 16px',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: isActive(href) ? 600 : 400,
                color: isActive(href) ? textColor : subColor,
                textDecoration: 'none',
                background: isActive(href)
                  ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                  : 'transparent',
                marginBottom: 2,
                boxSizing: 'border-box',
              }}
            >
              {label}
            </Link>
          ))}

          <div style={{ height: 1, background: borderColor, margin: '10px 0' }} />

          {/* Bottom controls */}
          <div style={{ display: 'flex', gap: 8, padding: '0 4px' }}>
            <button onClick={() => { toggleLocale(); }} style={{
              flex: 1, padding: '11px 8px', borderRadius: 12,
              background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              border: 'none', fontSize: 13, fontWeight: 700,
              color: textColor, cursor: 'pointer', fontFamily: FONT,
            }}>{locale === 'uk' ? 'EN' : 'UK'}</button>
            <button onClick={() => { toggle(); }} style={{
              flex: 1, padding: '11px 8px', borderRadius: 12,
              background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: FONT,
            }}>{dark ? '☀️ Light' : '🌙 Dark'}</button>
            <button onClick={() => { setMenuOpen(false); handleLogout(); }} style={{
              flex: 1, padding: '11px 8px', borderRadius: 12,
              background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              border: 'none', fontSize: 13, color: '#ff453a',
              cursor: 'pointer', fontFamily: FONT,
            }}>{t('nav_logout')}</button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
          .desktop-only { display: flex !important; }
        }
      `}</style>
    </>
  );
}
