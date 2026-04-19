'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useTheme } from '@/components/layout/ThemeProvider';
import { useLocale } from '@/hooks/useLocale';
import { DARK, LIGHT } from '@/lib/colors';
import Icon from '@/components/icons/Icon';

const FONT   = "-apple-system, 'SF Pro Display', BlinkMacSystemFont, 'Segoe UI', sans-serif";
const NUNITO = "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif";

export default function NavBar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { dark, toggle } = useTheme();
  const { locale, toggleLocale, t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { setMenuOpen(false) }, [pathname]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const links = [
    { href: '/dashboard', label: t('nav_dashboard'),  icon: 'dashboard',  color: '#0a84ff' },
    { href: '/trades',    label: t('nav_journal'),    icon: 'trades',     color: '#30d158' },
    { href: '/goals',     label: 'Goals',             icon: 'goals',      color: '#ff9f0a' },
    { href: '/simulator', label: 'Simulator',         icon: 'simulator',  color: '#bf5af2' },
    { href: '/playbook',  label: 'Playbook',          icon: 'playbook',   color: '#30d158' },
    { href: '/journal',   label: 'Journal',           icon: 'journal',    color: '#0a84ff' },
    { href: '/ai',        label: t('nav_ai'),         icon: 'ai',         color: '#bf5af2' },
    { href: '/analytics', label: t('nav_analytics'),  icon: 'analytics',  color: '#bf5af2' },
    { href: '/settings',  label: t('nav_settings'),   icon: 'settings',   color: '#8e8e93' },
    { href: '/billing',   label: t('nav_billing'),    icon: 'billing',    color: '#30d158' },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const isAuthPage = pathname === '/login' || pathname === '/register'

  const textColor = dark ? DARK.text : LIGHT.text
  const subColor  = dark ? DARK.sub  : LIGHT.sub
  const borderTop = dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)'
  const borderBot = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
  const navBg     = dark ? 'rgba(10,10,11,0.7)' : 'rgba(255,255,255,0.6)'

  const Logo = () => (
    <Link href={isAuthPage ? '/' : '/dashboard'} style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
          <rect x="0" y="0" width="28" height="28" rx="8" fill="rgba(48,209,88,0.12)" />
          <rect x="0" y="0" width="28" height="28" rx="8" stroke="rgba(48,209,88,0.35)" strokeWidth="1" />
          <path d="M14 6L20.5 22H17.8L16.2 18H11.8L10.2 22H7.5L14 6Z" fill="#30d158" />
          <path d="M12.7 15.5H15.3L14 11.5L12.7 15.5Z" fill={dark ? '#0a0a0b' : '#f2f2f7'} />
          <circle cx="14" cy="6" r="1.5" fill="#f5c842" />
        </svg>
        <div style={{ fontFamily: NUNITO, fontSize: 15, fontWeight: 900, color: textColor, letterSpacing: '-0.03em' }}>
          Aurum<span style={{ color: '#30d158' }}>Trade</span>
        </div>
      </div>
    </Link>
  )

  const iconBtn = (onClick: () => void, children: React.ReactNode) => (
    <button onClick={onClick} style={{
      background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
      border: dark ? `1px solid ${DARK.border}` : `1px solid rgba(0,0,0,0.07)`,
      borderRadius: 9, width: 32, height: 32,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', fontSize: 13, fontWeight: 700,
      color: textColor, fontFamily: FONT,
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'inset 0 1px 0 rgba(255,255,255,0.8)',
      transition: 'all 0.15s',
    }}>{children}</button>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700;800;900&display=swap');
        .nav-link { transition: all 0.15s; }
        .nav-link:hover { opacity: 0.8; }
      `}</style>

      <nav style={{
        fontFamily: FONT,
        background: navBg,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${borderBot}`,
        boxShadow: dark
          ? `inset 0 1px 0 ${borderTop}, inset 0 -1px 0 rgba(255,255,255,0.02)`
          : `inset 0 1px 0 ${borderTop}, inset 0 -1px 0 rgba(0,0,0,0.02)`,
        padding: '0 20px', height: 54,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, gap: 16,
      }}>

        <Logo />

        {!isMobile && (
          <div style={{
            display: 'flex', gap: 2,
            background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            borderRadius: 11, padding: 3,
            border: dark ? `1px solid ${DARK.border}` : '1px solid rgba(0,0,0,0.05)',
            overflowX: 'auto',
          }}>
            {links.map(({ href, label, icon, color }) => (
              <Link key={href} href={href} className="nav-link" style={{
                padding: '5px 11px', borderRadius: 8, fontSize: 12,
                fontWeight: isActive(href) ? 600 : 400,
                color: isActive(href) ? textColor : subColor,
                textDecoration: 'none', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 5,
                background: isActive(href)
                  ? dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)'
                  : 'transparent',
                boxShadow: isActive(href)
                  ? dark
                    ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 3px rgba(0,0,0,0.2)'
                    : 'inset 0 1px 0 rgba(255,255,255,1), 0 1px 3px rgba(0,0,0,0.06)'
                  : 'none',
                transition: 'all 0.15s',
              }}>
                <Icon name={icon} size={12} color={isActive(href) ? color : subColor} />
                {label}
              </Link>
            ))}
          </div>
        )}

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {iconBtn(toggleLocale, locale === 'uk' ? 'EN' : 'UK')}
            {iconBtn(toggle, dark ? '☀️' : '🌙')}
            <button onClick={handleLogout} style={{
              fontSize: 13, color: subColor,
              background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              border: dark ? `1px solid ${DARK.border}` : '1px solid rgba(0,0,0,0.06)',
              borderRadius: 9, padding: '5px 12px', height: 32,
              cursor: 'pointer', fontFamily: FONT,
              backdropFilter: 'blur(10px)',
              boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.8)',
              transition: 'all 0.15s',
            }}>{t('nav_logout')}</button>
          </div>
        )}

        {isMobile && (
          <button onClick={() => setMenuOpen(v => !v)} style={{
            background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            border: dark ? `1px solid ${DARK.border}` : '1px solid rgba(0,0,0,0.07)',
            borderRadius: 9, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexDirection: 'column', gap: 5, padding: '10px 8px',
            flexShrink: 0,
            boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
          }}>
            <span style={{ display: 'block', width: 18, height: 2, background: textColor, borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: 18, height: 2, background: textColor, borderRadius: 2, transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 18, height: 2, background: textColor, borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        )}
      </nav>

      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed',
          top: 54, left: 0, right: 0,
          zIndex: 99,
          background: dark ? 'rgba(10,10,11,0.95)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${borderBot}`,
          boxShadow: dark
            ? 'inset 0 -1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.4)'
            : 'inset 0 -1px 0 rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.08)',
          padding: '8px 12px 16px',
          boxSizing: 'border-box',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 54px)',
        }}>
          {links.map(({ href, label, icon, color }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '13px 16px', borderRadius: 12,
              fontSize: 16,
              fontWeight: isActive(href) ? 600 : 400,
              color: isActive(href) ? textColor : subColor,
              textDecoration: 'none',
              background: isActive(href)
                ? dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)'
                : 'transparent',
              boxShadow: isActive(href) && !dark ? 'inset 0 1px 0 rgba(255,255,255,1)' : 'none',
              marginBottom: 2,
              transition: 'all 0.15s',
            }}>
              <Icon name={icon} size={20} color={isActive(href) ? color : subColor} />
              {label}
            </Link>
          ))}

          <div style={{ height: 1, background: borderBot, margin: '10px 0' }} />

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={toggleLocale} style={{
              flex: 1, padding: '11px 8px', borderRadius: 12,
              background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              border: dark ? `1px solid ${DARK.border}` : '1px solid rgba(0,0,0,0.07)',
              fontSize: 13, fontWeight: 700, color: textColor,
              cursor: 'pointer', fontFamily: FONT,
              boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
            }}>{locale === 'uk' ? 'EN' : 'UK'}</button>

            <button onClick={toggle} style={{
              flex: 1, padding: '11px 8px', borderRadius: 12,
              background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              border: dark ? `1px solid ${DARK.border}` : '1px solid rgba(0,0,0,0.07)',
              fontSize: 14, cursor: 'pointer', fontFamily: FONT, color: textColor,
              boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
            }}>{dark ? '☀️ Light' : '🌙 Dark'}</button>

            <button onClick={() => { setMenuOpen(false); handleLogout(); }} style={{
              flex: 1, padding: '11px 8px', borderRadius: 12,
              background: dark ? 'rgba(255,69,58,0.1)' : 'rgba(255,69,58,0.08)',
              border: '1px solid rgba(255,69,58,0.2)',
              fontSize: 13, color: '#ff453a',
              cursor: 'pointer', fontFamily: FONT,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
            }}>{t('nav_logout')}</button>
          </div>
        </div>
      )}
    </>
  );
}
