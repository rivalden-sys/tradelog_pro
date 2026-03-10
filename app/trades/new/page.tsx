'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
import NavBar from '@/components/layout/NavBar'

const PAIRS   = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'POL/USDT', 'BNB/USDT', 'XRP/USDT']
const SETUPS  = ['CHoCH + BOS + FVG', 'Breaker/Mitigation + iFVG', 'Order Block + FVG', 'Liquidity Sweep + Reversal', 'NWOG / NDOG', 'Premium/Discount + POI']
const RESULTS = ['Тейк', 'Стоп', 'БУ']
const GRADES  = ['A', 'B', 'C', 'D']

export default function NewTradePage() {
  const { theme: c } = useTheme()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date:           new Date().toISOString().split('T')[0],
    pair:           'BTC/USDT',
    setup:          SETUPS[0],
    direction:      'Long',
    result:         'Тейк',
    rr:             '',
    profit_usd:     '',
    profit_pct:     '',
    self_grade:     'A',
    comment:        '',
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
    else { alert('Ошибка сохранения'); setSaving(false) }
  }

  const inputStyle = {
    width: '100%', background: c.surface2, border: `1px solid ${c.border}`,
    borderRadius: 10, padding: '10px 14px', fontSize: 14, color: c.text,
    outline: 'none', boxSizing: 'border-box' as const,
  }

  const labelStyle = { fontSize: 12, color: c.text3, marginBottom: 6, display: 'block', fontWeight: 500 }

  const segmented = (key: string, options: string[]) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o} onClick={() => set(key, o)} style={{
          padding: '8px 16px', borderRadius: 10, border: `1px solid ${c.border}`,
          background: (form as any)[key] === o ? c.text : 'transparent',
          color:      (form as any)[key] === o ? c.surface : c.text3,
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>{o}</button>
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
          }}>← Назад</button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c.text, margin: 0 }}>Новая сделка</h1>
        </div>

        <div style={{
          background: c.surface, borderRadius: 18, padding: '24px',
          border: `1px solid ${c.border}`, boxShadow: c.shadow,
          display: 'grid', gap: 20,
        }}>

          {/* Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Дата</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Пара</label>
              <select value={form.pair} onChange={e => set('pair', e.target.value)} style={inputStyle}>
                {PAIRS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Setup */}
          <div>
            <label style={labelStyle}>Сетап</label>
            <select value={form.setup} onChange={e => set('setup', e.target.value)} style={inputStyle}>
              {SETUPS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Direction */}
          <div>
            <label style={labelStyle}>Направление</label>
            {segmented('direction', ['Long', 'Short'])}
          </div>

          {/* Result */}
          <div>
            <label style={labelStyle}>Результат</label>
            {segmented('result', RESULTS)}
          </div>

          {/* Row numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>RR</label>
              <input type="number" step="0.1" placeholder="2.5" value={form.rr}
                onChange={e => set('rr', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>P&L $</label>
              <input type="number" step="0.01" placeholder="150.00" value={form.profit_usd}
                onChange={e => set('profit_usd', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>P&L %</label>
              <input type="number" step="0.01" placeholder="1.5" value={form.profit_pct}
                onChange={e => set('profit_pct', e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Grade */}
          <div>
            <label style={labelStyle}>Самооценка</label>
            {segmented('self_grade', GRADES)}
          </div>

          {/* Comment */}
          <div>
            <label style={labelStyle}>Комментарий</label>
            <textarea value={form.comment} onChange={e => set('comment', e.target.value)}
              placeholder="Описание сделки, наблюдения..."
              rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* TradingView */}
          <div>
            <label style={labelStyle}>Ссылка TradingView (необязательно)</label>
            <input type="url" placeholder="https://tradingview.com/..." value={form.tradingview_url}
              onChange={e => set('tradingview_url', e.target.value)} style={inputStyle} />
          </div>

          {/* Save */}
          <button onClick={save} disabled={saving} style={{
            background: '#30d158', color: '#fff', border: 'none',
            borderRadius: 12, padding: '14px', fontSize: 15,
            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'Сохраняем...' : 'Сохранить сделку'}
          </button>

        </div>
      </div>
    </div>
  )
}