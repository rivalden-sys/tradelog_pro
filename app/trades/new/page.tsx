'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
import { Header } from '@/components/layout/Header'

const SETUPS = [
  'CHoCH + BOS + FVG',
  'Breaker/Mitigation + iFVG',
  'Order Block + FVG',
  'Liquidity Sweep + Reversal',
  'NWOG / NDOG',
  'Premium/Discount + POI',
]

export default function NewTradePage() {
  const { theme: c } = useTheme()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({
    date: '', pair: '', setup: '', rr: '',
    direction: '', result: '', profit_usd: '',
    profit_pct: '', tradingview_url: '', comment: '', self_grade: '',
  })

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.date || !form.pair || !form.setup || !form.rr || !form.direction || !form.result) {
      setError('Заполните обязательные поля')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        rr:         parseFloat(form.rr),
        profit_usd: parseFloat(form.profit_usd) || 0,
        profit_pct: parseFloat(form.profit_pct) || 0,
      }),
    })

    const json = await res.json()
    if (json.success) {
      router.push('/trades')
    } else {
      setError(json.error)
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    background: c.surface2, border: `1px solid ${c.border}`,
    borderRadius: 12, padding: '11px 14px', fontSize: 14,
    color: c.text, outline: 'none',
  }

  const labelStyle = {
    fontSize: 13, color: c.text3,
    marginBottom: 6, display: 'block', fontWeight: 500,
  }

  const SelectGroup = ({ label, field, options, colorMap = {} }: {
    label: string, field: string, options: string[], colorMap?: Record<string, string>
  }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
        {options.map(o => {
          const active = form[field as keyof typeof form] === o
          const accent = colorMap[o]
          return (
            <button key={o} type="button" onClick={() => upd(field, o)} style={{
              background: active ? (accent ?? c.text) : 'transparent',
              color:      active ? (accent ? '#fff' : c.surface) : c.text3,
              border:     `1px solid ${active ? (accent ?? c.text) : c.border}`,
              borderRadius: 10, padding: '9px 16px', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}>{o}</button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{ background: c.bg, minHeight: '100vh' }}>
      <Header />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 24px' }}>
        <button onClick={() => router.back()} style={{
          background: 'transparent', border: 'none', color: c.text3,
          fontSize: 14, cursor: 'pointer', marginBottom: 20,
        }}>← Назад</button>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: c.text, margin: '0 0 24px' }}>
          Новая сделка
        </h1>

        {error && (
          <div style={{
            background: '#ff453a18', border: '1px solid #ff453a44',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            fontSize: 13, color: '#ff453a',
          }}>{error}</div>
        )}

        <div style={{
          background: c.surface, borderRadius: 18, padding: '24px',
          border: `1px solid ${c.border}`, boxShadow: c.shadow,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <label style={labelStyle}>Дата *</label>
              <input type="date" style={inputStyle} value={form.date} onChange={e => upd('date', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Торговая пара *</label>
              <input type="text" placeholder="BTC/USDT" style={inputStyle} value={form.pair} onChange={e => upd('pair', e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={labelStyle}>Сетап *</label>
            <select style={{ ...inputStyle }} value={form.setup} onChange={e => upd('setup', e.target.value)}>
              <option value="">Выберите сетап</option>
              {SETUPS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
            <div>
              <label style={labelStyle}>Risk/Reward *</label>
              <input type="number" placeholder="2.5" step="0.01" style={inputStyle} value={form.rr} onChange={e => upd('rr', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>P&L ($)</label>
              <input type="number" placeholder="250" style={inputStyle} value={form.profit_usd} onChange={e => upd('profit_usd', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>P&L (%)</label>
              <input type="number" placeholder="2.5" step="0.01" style={inputStyle} value={form.profit_pct} onChange={e => upd('profit_pct', e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <SelectGroup label="Направление *" field="direction" options={['Long', 'Short']}
              colorMap={{ Long: '#30d158', Short: '#ff453a' }} />
          </div>

          <div style={{ marginTop: 20 }}>
            <SelectGroup label="Результат *" field="result" options={['Тейк', 'Стоп', 'БУ']}
              colorMap={{ 'Тейк': '#30d158', 'Стоп': '#ff453a', 'БУ': '#8e8e93' }} />
          </div>

          <div style={{ marginTop: 20 }}>
            <SelectGroup label="Самооценка" field="self_grade" options={['A', 'B', 'C', 'D']}
              colorMap={{ A: '#30d158', B: '#0a84ff', C: '#ff9f0a', D: '#ff453a' }} />
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={labelStyle}>Ссылка TradingView</label>
            <input type="url" placeholder="https://tradingview.com/..." style={inputStyle}
              value={form.tradingview_url} onChange={e => upd('tradingview_url', e.target.value)} />
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={labelStyle}>Комментарий</label>
            <textarea
              placeholder="Что смущало? Почему вошли? Что можно было сделать лучше?"
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical', lineHeight: '1.5' }}
              value={form.comment} onChange={e => upd('comment', e.target.value)}
            />
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => router.back()} style={{
              background: 'transparent', border: `1px solid ${c.border}`,
              borderRadius: 12, padding: '10px 18px', fontSize: 14,
              fontWeight: 600, cursor: 'pointer', color: c.text3,
            }}>Отмена</button>
            <button onClick={handleSubmit} disabled={loading} style={{
              background: '#30d158', color: '#fff', border: 'none',
              borderRadius: 12, padding: '10px 20px', fontSize: 14,
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}>{loading ? 'Сохраняем...' : 'Сохранить сделку'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}