'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useLocale } from '@/hooks/useLocale'
import NavBar from '@/components/layout/NavBar'

const PAIRS  = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'POL/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT', 'DOT/USDT']
const SETUPS = ['CHoCH + BOS + FVG', 'Breaker/Mitigation + iFVG', 'Order Block + FVG', 'Liquidity Sweep + Reversal', 'NWOG / NDOG', 'Premium/Discount + POI']
const GRADES = ['A', 'B', 'C', 'D']

export default function NewTradePage() {
  const { theme: c } = useTheme()
  const { t } = useLocale()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date:            new Date().toISOString().split('T')[0],
    pair:            '',
    setup:           '',
    direction:       'Long',
    result:          'Тейк',
    rr:              '',
    profit_usd:      '',
    profit_pct:      '',
    self_grade:      'A',
    comment:         '',
    tradingview_url: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        rr:         parseFloat(form.rr) || 0,
        profit_usd: parseFloat(form.profit_usd) || 0,
        profit_pct: parseFloat(form.profit_pct) || 0,
      }),
    })
    const json = await res.json()
    if (json.success) router.push('/trades')
    else { alert(t('new_trade_error_required')); setSaving(false) }
  }

  const inputStyle = {
    width: '100%', background: c.surface2, border: `1px solid ${c.border}`,
    borderRadius: 10, padding: '10px 14px', fontSize: 14, color: c.text,
    outline: 'none', boxSizing: 'border-box' as const,
  }

  const labelStyle = { fontSize: 12, color: c.text3, marginBottom: 6, display: 'block', fontWeight: 500 }

  const segmented = (key: string, options: string[], labels?: string[]) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
      {options.map((o, i) => (
        <button key={o} onClick={() => set(key, o)} style={{
          padding: '8px 16px', borderRadius: 10, border: `1px solid ${c.border}`,
          background: (form as any)[key] === o ? c.text : 'transparent',
          color:      (form as any)[key] === o ? c.surface : c.text3,
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>{labels ? labels[i] : o}</button>
      ))}
    </div>
  )

  return (
    <div style={{ background: c.bg, minHeight: '100vh' }}>
      <NavBar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => router.back()} style={{
            background: 'transparent', border: 'none', color: c.text3,
            fontSize: 14, cursor: 'pointer',
          }}>{t('new_trade_back')}</button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c.text, margin: 0 }}>{t('new_trade_title')}</h1>
        </div>

        <div style={{
          background: c.surface, borderRadius: 18, padding: '24px',
          border: `1px solid ${c.border}`, boxShadow: c.shadow,
          display: 'grid', gap: 20,
        }}>

          {/* Date + Pair */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>{t('new_trade_date')}</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('new_trade_pair')}</label>
              <input
                type="text"
                list="pairs-list"
                placeholder="BTC/USDT"
                value={form.pair}
                onChange={e => set('pair', e.target.value.toUpperCase())}
                style={inputStyle}
                autoComplete="off"
              />
              <datalist id="pairs-list">
                {PAIRS.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
          </div>

          {/* Setup */}
          <div>
            <label style={labelStyle}>{t('new_trade_setup')}</label>
            <input
              type="text"
              list="setups-list"
              placeholder="CHoCH + BOS + FVG"
              value={form.setup}
              onChange={e => set('setup', e.target.value)}
              style={inputStyle}
              autoComplete="off"
            />
            <datalist id="setups-list">
              {SETUPS.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          {/* Direction */}
          <div>
            <label style={labelStyle}>{t('new_trade_direction')}</label>
            {segmented('direction', ['Long', 'Short'], [t('new_trade_long'), t('new_trade_short')])}
          </div>

          {/* Result */}
          <div>
            <label style={labelStyle}>{t('new_trade_result')}</label>
            {segmented('result', ['Тейк', 'Стоп', 'БУ'], [t('new_trade_take'), t('new_trade_stop'), t('new_trade_bu')])}
          </div>

          {/* RR + P&L */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>{t('new_trade_rr')}</label>
              <input type="number" step="0.1" placeholder="2.5" value={form.rr}
                onChange={e => set('rr', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('new_trade_profit_usd')}</label>
              <input type="number" step="0.01" placeholder="150.00" value={form.profit_usd}
                onChange={e => set('profit_usd', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('new_trade_profit_pct')}</label>
              <input type="number" step="0.01" placeholder="1.5" value={form.profit_pct}
                onChange={e => set('profit_pct', e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Grade */}
          <div>
            <label style={labelStyle}>{t('new_trade_grade')}</label>
            {segmented('self_grade', GRADES)}
          </div>

          {/* Comment */}
          <div>
            <label style={labelStyle}>{t('new_trade_comment')}</label>
            <textarea value={form.comment} onChange={e => set('comment', e.target.value)}
              placeholder={t('new_trade_comment_ph')}
              rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* TradingView */}
          <div>
            <label style={labelStyle}>{t('new_trade_tv')}</label>
            <input type="url" placeholder={t('new_trade_tv_ph')} value={form.tradingview_url}
              onChange={e => set('tradingview_url', e.target.value)} style={inputStyle} />
          </div>

          {/* Save */}
          <button onClick={save} disabled={saving} style={{
            background: '#30d158', color: '#fff', border: 'none',
            borderRadius: 12, padding: '14px', fontSize: 15,
            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? t('new_trade_saving') : t('new_trade_save')}
          </button>

        </div>
      </div>
    </div>
  )
}
