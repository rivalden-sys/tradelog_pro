'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useLocale } from '@/hooks/useLocale'
import NavBar from '@/components/layout/NavBar'
import { createClient } from '@/lib/supabase/client'

const PAIRS          = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'POL/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT', 'DOT/USDT']
const SETUPS_DEFAULT = ['CHoCH + BOS + FVG', 'Breaker/Mitigation + iFVG', 'Order Block + FVG', 'Liquidity Sweep + Reversal', 'NWOG / NDOG', 'Premium/Discount + POI']

const GREEN  = '#30d158'
const RED    = '#ff453a'
const ORANGE = '#ff9f0a'
const BLUE   = '#0a84ff'
const GRAY   = '#8e8e93'
const FONT   = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"

export default function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { theme: c } = useTheme()
  const { t } = useLocale()
  const router = useRouter()

  const [tradeId,  setTradeId]  = useState('')
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [balance,  setBalance]  = useState<number>(0)
  const [setups,   setSetups]   = useState<string[]>(SETUPS_DEFAULT)
  const [riskMode, setRiskMode] = useState<'pct' | 'usdt'>('pct')

  const [form, setForm] = useState({
    date:            '',
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
    entry_price:     '',
    stop_price:      '',
    take_price:      '',
    risk_pct:        '',
    risk_usdt:       '',
    status:          'closed',
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { id } = await params
      setTradeId(id)

      // Завантажити угоду
      const res  = await fetch(`/api/trades/${id}`)
      const json = await res.json()
      if (!json.success) { setLoading(false); return }
      const d = json.data

      setForm({
        date:            d.date            || '',
        pair:            d.pair            || '',
        setup:           d.setup           || '',
        direction:       d.direction       || 'Long',
        result:          d.result          || 'Тейк',
        rr:              String(d.rr       ?? ''),
        profit_usd:      String(d.profit_usd ?? ''),
        profit_pct:      String(d.profit_pct ?? ''),
        self_grade:      d.self_grade      || 'A',
        comment:         d.comment         || '',
        tradingview_url: d.tradingview_url || '',
        entry_price:     String(d.entry_price ?? ''),
        stop_price:      String(d.stop_price  ?? ''),
        take_price:      String(d.take_price  ?? ''),
        risk_pct:        String(d.risk_pct    ?? ''),
        risk_usdt:       String(d.risk_usdt   ?? ''),
        status:          d.status          || 'closed',
      })

      // Визначити режим ризику з даних угоди
      if (d.risk_usdt && !d.risk_pct) setRiskMode('usdt')

      // Баланс і сетапи
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users').select('balance').eq('id', user.id).single()
        if (profile?.balance) setBalance(profile.balance)

        const { data: setupsData } = await supabase
          .from('trades').select('setup').eq('user_id', user.id)
        if (setupsData && setupsData.length > 0) {
          const unique = [...new Set(setupsData.map((t: any) => t.setup).filter(Boolean))] as string[]
          if (unique.length > 0) {
            setSetups([...new Set([...unique, ...SETUPS_DEFAULT])])
          }
        }
      }

      setLoading(false)
    }
    load()
  }, [params])

  // Підказка ризику в USDT
  const riskHint = (() => {
    if (riskMode !== 'pct' || balance <= 0) return null
    const pct = parseFloat(form.risk_pct)
    if (!isNaN(pct) && pct > 0) {
      const usdt = (balance * pct / 100).toFixed(2)
      return `${pct}% від ${balance.toLocaleString()} USDT = ${usdt} USDT`
    }
    return `1% від ${balance.toLocaleString()} USDT = ${(balance / 100).toFixed(2)} USDT`
  })()

  const set = (k: string, v: string) => {
    setForm(f => {
      const next = { ...f, [k]: v }
      const entry = parseFloat(k === 'entry_price' ? v : next.entry_price)
      const stop  = parseFloat(k === 'stop_price'  ? v : next.stop_price)
      const take  = parseFloat(k === 'take_price'  ? v : next.take_price)

      if (entry > 0 && stop > 0 && take > 0) {
        const riskPts   = Math.abs(entry - stop)
        const rewardPts = Math.abs(take - entry)
        if (riskPts > 0) {
          next.rr = (rewardPts / riskPts).toFixed(2)
          // Перерахунок P&L
          if (riskMode === 'pct' && next.risk_pct) {
            const rp = parseFloat(next.risk_pct)
            if (!isNaN(rp)) next.profit_pct = (rp * rewardPts / riskPts).toFixed(2)
          }
          if (riskMode === 'usdt' && next.risk_usdt) {
            const ru = parseFloat(next.risk_usdt)
            if (!isNaN(ru)) next.profit_usd = (ru * rewardPts / riskPts).toFixed(2)
          }
        }
      }

      // При зміні ризику
      if ((k === 'risk_pct' || k === 'risk_usdt') && entry > 0 && stop > 0 && take > 0) {
        const riskPts   = Math.abs(entry - stop)
        const rewardPts = Math.abs(take - entry)
        if (riskPts > 0) {
          if (k === 'risk_pct') {
            const rp = parseFloat(v)
            if (!isNaN(rp)) next.profit_pct = (rp * rewardPts / riskPts).toFixed(2)
          }
          if (k === 'risk_usdt') {
            const ru = parseFloat(v)
            if (!isNaN(ru)) next.profit_usd = (ru * rewardPts / riskPts).toFixed(2)
          }
        }
      }

      return next
    })
  }

  const save = async () => {
    if (!form.pair.trim() || !form.setup.trim()) {
      setError('Заповніть обовязкові поля')
      return
    }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/trades/${tradeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date:            form.date,
        pair:            form.pair,
        setup:           form.setup,
        direction:       form.direction,
        result:          form.result,
        rr:              parseFloat(form.rr)         || 0,
        profit_usd:      parseFloat(form.profit_usd) || 0,
        profit_pct:      parseFloat(form.profit_pct) || 0,
        self_grade:      form.self_grade,
        comment:         form.comment         || null,
        tradingview_url: form.tradingview_url || null,
        entry_price:     parseFloat(form.entry_price) || null,
        stop_price:      parseFloat(form.stop_price)  || null,
        take_price:      parseFloat(form.take_price)  || null,
        risk_pct:        parseFloat(form.risk_pct)    || null,
        risk_usdt:       parseFloat(form.risk_usdt)   || null,
        status:          form.status,
      }),
    })
    const json = await res.json()
    if (json.success) {
      router.push(`/trades/${tradeId}`)
    } else {
      setError(json.error || 'Помилка збереження')
      setSaving(false)
    }
  }

  const inputStyle = (): React.CSSProperties => ({
    width: '100%', background: c.surface2,
    border: `1px solid ${c.border}`,
    borderRadius: 10, padding: '11px 14px', fontSize: 14, color: c.text,
    outline: 'none', boxSizing: 'border-box', fontFamily: FONT,
  })

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: c.text3, marginBottom: 6, display: 'block',
    fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em',
  }

  const segmented = (key: string, options: string[], colors?: string[], labels?: string[]) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((o, i) => {
        const active = (form as any)[key] === o
        const col = colors?.[i] || c.text
        return (
          <button key={o} onClick={() => set(key, o)} style={{
            padding: '9px 16px', borderRadius: 10,
            border: `1px solid ${active ? col : c.border}`,
            background: active ? col + '22' : 'transparent',
            color: active ? col : c.text3,
            fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: FONT,
          }}>{labels ? labels[i] : o}</button>
        )
      })}
    </div>
  )

  if (loading) return (
    <div style={{ background: c.bg, minHeight: '100vh', fontFamily: FONT }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: c.text3 }}>
        Завантаження...
      </div>
    </div>
  )

  const isPlanned = form.status === 'planned'
  const calcReady = form.entry_price && form.stop_price && form.take_price

  return (
    <div style={{ background: c.bg, minHeight: '100vh', fontFamily: FONT }}>
      <NavBar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => router.back()} style={{
            background: 'transparent', border: 'none', color: c.text3,
            fontSize: 14, cursor: 'pointer', fontFamily: FONT,
          }}>← Назад</button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c.text, margin: 0 }}>
            ✏️ Редагування угоди
          </h1>
          {isPlanned && (
            <span style={{
              fontSize: 12, fontWeight: 700, color: ORANGE,
              background: ORANGE + '22', borderRadius: 8, padding: '4px 10px',
            }}>🕐 Планова</span>
          )}
        </div>

        <div style={{
          background: c.surface, borderRadius: 18, padding: '20px 16px',
          border: `1px solid ${isPlanned ? ORANGE + '44' : c.border}`,
          boxShadow: c.shadow, display: 'grid', gap: 18,
        }}>

          {/* Date + Pair */}
          <div className="form-grid-2">
            <div>
              <label style={labelStyle}>Дата</label>
              <input type="date" value={form.date}
                onChange={e => set('date', e.target.value)} style={inputStyle()} />
            </div>
            <div>
              <label style={labelStyle}>Торгова пара *</label>
              <input type="text" list="pairs-list" value={form.pair}
                onChange={e => set('pair', e.target.value.toUpperCase())}
                style={inputStyle()} autoComplete="off" />
              <datalist id="pairs-list">{PAIRS.map(p => <option key={p} value={p} />)}</datalist>
            </div>
          </div>

          {/* Setup — динамічний */}
          <div>
            <label style={labelStyle}>Сетап *</label>
            <input type="text" list="setups-list" value={form.setup}
              onChange={e => set('setup', e.target.value)}
              style={inputStyle()} autoComplete="off" />
            <datalist id="setups-list">
              {setups.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          {/* Direction */}
          <div>
            <label style={labelStyle}>Напрямок</label>
            {segmented('direction', ['Long', 'Short'], [GREEN, RED])}
          </div>

          {/* Ціни входу */}
          <div style={{
            background: c.surface2, borderRadius: 14, padding: '16px',
            border: `1px solid ${isPlanned ? ORANGE + '33' : c.border}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: isPlanned ? ORANGE : c.text3, marginBottom: 14 }}>
              📍 Точки входу
            </div>
            <div className="form-grid-3" style={{ marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Ціна входу</label>
                <input type="number" step="any" value={form.entry_price}
                  onChange={e => set('entry_price', e.target.value)} style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle}>Стоп-лос</label>
                <input type="number" step="any" value={form.stop_price}
                  onChange={e => set('stop_price', e.target.value)} style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle}>Тейк-профіт</label>
                <input type="number" step="any" value={form.take_price}
                  onChange={e => set('take_price', e.target.value)} style={inputStyle()} />
              </div>
            </div>

            {/* Ризик з підказкою балансу */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Ризик</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['pct', 'usdt'] as const).map(rm => (
                    <button key={rm} onClick={() => setRiskMode(rm)} style={{
                      padding: '3px 10px', borderRadius: 8,
                      border: `1px solid ${riskMode === rm ? BLUE : c.border}`,
                      background: riskMode === rm ? BLUE + '22' : 'transparent',
                      color: riskMode === rm ? BLUE : c.text3,
                      fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                    }}>{rm === 'pct' ? '% від депо' : 'USDT'}</button>
                  ))}
                </div>
              </div>

              <div className="form-grid-2">
                {riskMode === 'pct' ? (
                  <div>
                    <input type="number" step="0.1" placeholder="1.0"
                      value={form.risk_pct} onChange={e => set('risk_pct', e.target.value)}
                      style={inputStyle()} />
                    {riskHint ? (
                      <div style={{ fontSize: 11, marginTop: 5, color: BLUE, fontWeight: 600 }}>
                        💰 {riskHint}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: c.text3, marginTop: 4 }}>% від депозиту</div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input type="number" step="1" placeholder="100"
                      value={form.risk_usdt} onChange={e => set('risk_usdt', e.target.value)}
                      style={inputStyle()} />
                    <div style={{ fontSize: 11, color: c.text3, marginTop: 4 }}>USDT ризику</div>
                  </div>
                )}
              </div>
            </div>

            {/* Авто-розрахунок */}
            {calcReady && (
              <div style={{
                display: 'flex', gap: 12, flexWrap: 'wrap',
                background: GREEN + '12', borderRadius: 10,
                padding: '10px 14px', border: `1px solid ${GREEN}33`,
                marginTop: 14,
              }}>
                <div style={{ fontSize: 12, color: c.text3 }}>Авто-розрахунок:</div>
                {form.rr && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>RR = {form.rr}</div>
                )}
                {form.profit_pct && riskMode === 'pct' && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>P&L ≈ +{form.profit_pct}%</div>
                )}
                {form.profit_usd && riskMode === 'usdt' && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>P&L ≈ +{form.profit_usd}$</div>
                )}
                {riskMode === 'pct' && form.risk_pct && balance > 0 && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>
                    Ризик: {(balance * parseFloat(form.risk_pct) / 100).toFixed(2)} USDT
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Result (тільки для закритих) */}
          {!isPlanned && (
            <div>
              <label style={labelStyle}>Результат</label>
              {segmented('result', ['Тейк', 'Стоп', 'БУ'], [GREEN, RED, GRAY])}
            </div>
          )}

          {/* RR + P&L */}
          <div className="form-grid-3">
            <div>
              <label style={labelStyle}>Risk/Reward</label>
              <input type="number" step="0.1" value={form.rr}
                onChange={e => set('rr', e.target.value)} style={inputStyle()} />
            </div>
            {!isPlanned && (
              <>
                <div>
                  <label style={labelStyle}>P&L ($)</label>
                  <input type="number" step="0.01" value={form.profit_usd}
                    onChange={e => set('profit_usd', e.target.value)} style={inputStyle()} />
                </div>
                <div>
                  <label style={labelStyle}>P&L (%)</label>
                  <input type="number" step="0.01" value={form.profit_pct}
                    onChange={e => set('profit_pct', e.target.value)} style={inputStyle()} />
                </div>
              </>
            )}
          </div>

          {/* Grade (тільки для закритих) */}
          {!isPlanned && (
            <div>
              <label style={labelStyle}>Самооцінка</label>
              {segmented('self_grade', ['A', 'B', 'C', 'D'], [GREEN, BLUE, ORANGE, RED])}
            </div>
          )}

          {/* Comment */}
          <div>
            <label style={labelStyle}>Коментар</label>
            <textarea value={form.comment} onChange={e => set('comment', e.target.value)}
              rows={4} style={{ ...inputStyle(), resize: 'vertical' as const }} />
          </div>

          {/* TradingView */}
          <div>
            <label style={labelStyle}>TradingView URL</label>
            <input type="url" value={form.tradingview_url}
              onChange={e => set('tradingview_url', e.target.value)} style={inputStyle()} />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: `${RED}12`, color: RED, fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Save */}
          <button onClick={save} disabled={saving} style={{
            background: GREEN, color: '#fff', border: 'none',
            borderRadius: 12, padding: '14px', fontSize: 15,
            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1, fontFamily: FONT,
            boxShadow: `0 0 24px ${GREEN}44`,
          }}>
            {saving ? 'Збереження...' : '✓ Зберегти зміни'}
          </button>

        </div>
      </div>

      <style>{`
        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) {
          .form-grid-2 { grid-template-columns: 1fr; }
          .form-grid-3 { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}
