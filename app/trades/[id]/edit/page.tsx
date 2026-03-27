'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/hooks/useLocale'
import NavBar from '@/components/layout/NavBar'
import { createClient } from '@/lib/supabase/client'
import { DARK, LIGHT } from '@/lib/colors'

const SETUPS_DEFAULT = ['CHoCH + BOS + FVG', 'Breaker/Mitigation + iFVG', 'Order Block + FVG', 'Liquidity Sweep + Reversal', 'NWOG / NDOG', 'Premium/Discount + POI']
const FONT = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"

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

export default function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const dark  = useDark()
  const { t } = useLocale()
  const router = useRouter()

  // Theme-aware кольори
  const GREEN  = dark ? DARK.green  : LIGHT.green
  const RED    = dark ? DARK.red    : LIGHT.red
  const ORANGE = dark ? DARK.orange : LIGHT.orange
  const BLUE   = dark ? DARK.blue   : LIGHT.blue
  const GRAY   = dark ? DARK.gray   : LIGHT.gray

  const textColor   = dark ? DARK.text   : LIGHT.text
  const subColor    = dark ? DARK.sub    : LIGHT.sub
  const borderColor = dark ? DARK.border : LIGHT.border

  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

  const [tradeId,  setTradeId]  = useState('')
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [balance,  setBalance]  = useState<number>(0)
  const [setups,   setSetups]   = useState<string[]>(SETUPS_DEFAULT)
  const [riskMode, setRiskMode] = useState<'pct' | 'usdt'>('pct')

  const [form, setForm] = useState({
    date: '', pair: '', setup: '', direction: 'Long', result: 'Тейк',
    rr: '', profit_usd: '', profit_pct: '', self_grade: 'A',
    comment: '', tradingview_url: '', entry_price: '', stop_price: '',
    take_price: '', risk_pct: '', risk_usdt: '', status: 'closed',
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { id } = await params
      setTradeId(id)
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
      if (d.risk_usdt && !d.risk_pct) setRiskMode('usdt')
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('users').select('balance').eq('id', user.id).single()
        if (profile?.balance) setBalance(profile.balance)
        const { data: setupsData } = await supabase.from('trades').select('setup').eq('user_id', user.id)
        if (setupsData?.length) {
          const unique = [...new Set(setupsData.map((t: any) => t.setup).filter(Boolean))] as string[]
          if (unique.length) setSetups([...new Set([...unique, ...SETUPS_DEFAULT])])
        }
      }
      setLoading(false)
    }
    load()
  }, [params])

  const riskHint = (() => {
    if (riskMode !== 'pct' || balance <= 0) return null
    const pct = parseFloat(form.risk_pct)
    if (!isNaN(pct) && pct > 0) return `${pct}% від ${balance.toLocaleString()} USDT = ${(balance * pct / 100).toFixed(2)} USDT`
    return `1% від ${balance.toLocaleString()} USDT = ${(balance / 100).toFixed(2)} USDT`
  })()

  const set = (k: string, v: string) => {
    setForm(f => {
      const next = { ...f, [k]: v }
      const entry = parseFloat(k === 'entry_price' ? v : next.entry_price)
      const stop  = parseFloat(k === 'stop_price'  ? v : next.stop_price)
      const take  = parseFloat(k === 'take_price'  ? v : next.take_price)
      if (entry > 0 && stop > 0 && take > 0) {
        const riskPts = Math.abs(entry - stop), rewardPts = Math.abs(take - entry)
        if (riskPts > 0) {
          next.rr = (rewardPts / riskPts).toFixed(2)
          if (riskMode === 'pct'  && next.risk_pct)  { const rp = parseFloat(next.risk_pct);  if (!isNaN(rp)) next.profit_pct = (rp * rewardPts / riskPts).toFixed(2) }
          if (riskMode === 'usdt' && next.risk_usdt) { const ru = parseFloat(next.risk_usdt); if (!isNaN(ru)) next.profit_usd = (ru * rewardPts / riskPts).toFixed(2) }
        }
      }
      if ((k === 'risk_pct' || k === 'risk_usdt') && entry > 0 && stop > 0 && take > 0) {
        const riskPts = Math.abs(entry - stop), rewardPts = Math.abs(take - entry)
        if (riskPts > 0) {
          if (k === 'risk_pct')  { const rp = parseFloat(v); if (!isNaN(rp)) next.profit_pct = (rp * rewardPts / riskPts).toFixed(2) }
          if (k === 'risk_usdt') { const ru = parseFloat(v); if (!isNaN(ru)) next.profit_usd = (ru * rewardPts / riskPts).toFixed(2) }
        }
      }
      return next
    })
  }

  const save = async () => {
    if (!form.pair.trim() || !form.setup.trim()) { setError('Заповніть обовязкові поля'); return }
    setSaving(true); setError('')
    const res = await fetch(`/api/trades/${tradeId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: form.date, pair: form.pair, setup: form.setup,
        direction: form.direction, result: form.result,
        rr: parseFloat(form.rr) || 0,
        profit_usd: parseFloat(form.profit_usd) || 0,
        profit_pct: parseFloat(form.profit_pct) || 0,
        self_grade: form.self_grade,
        comment: form.comment || null,
        tradingview_url: form.tradingview_url || null,
        entry_price: parseFloat(form.entry_price) || null,
        stop_price:  parseFloat(form.stop_price)  || null,
        take_price:  parseFloat(form.take_price)  || null,
        risk_pct:    parseFloat(form.risk_pct)    || null,
        risk_usdt:   parseFloat(form.risk_usdt)   || null,
        status: form.status,
      }),
    })
    const json = await res.json()
    if (json.success) router.push(`/trades/${tradeId}`)
    else { setError(json.error || 'Помилка збереження'); setSaving(false) }
  }

  const inputStyle = (): React.CSSProperties => ({
    width: '100%',
    background: dark ? DARK.inputBg : LIGHT.inputBg,
    border: `1px solid ${dark ? DARK.border : 'rgba(0,0,0,0.1)'}`,
    borderRadius: 10, padding: '11px 14px', fontSize: 14, color: textColor,
    outline: 'none', boxSizing: 'border-box', fontFamily: FONT,
    backdropFilter: 'blur(10px)',
    boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 2px 4px rgba(0,0,0,0.04)',
  })

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: subColor, marginBottom: 6, display: 'block',
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
  }

  const segmented = (key: string, options: string[], colors?: string[], labels?: string[]) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((o, i) => {
        const active = (form as any)[key] === o
        const col = colors?.[i] || textColor
        return (
          <button key={o} onClick={() => set(key, o)} style={{
            padding: '9px 16px', borderRadius: 10,
            border: `1px solid ${active ? col : dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
            background: active ? col + '22' : dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
            color: active ? col : subColor,
            fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: FONT,
            transition: 'all 0.15s',
          }}>{labels ? labels[i] : o}</button>
        )
      })}
    </div>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', background: dark ? DARK.bg : LIGHT.bg, fontFamily: FONT }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: subColor }}>Завантаження...</div>
    </div>
  )

  const isPlanned = form.status === 'planned'
  const calcReady = form.entry_price && form.stop_price && form.take_price

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: dark ? DARK.bg : LIGHT.bg }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: noiseSvg, opacity: dark ? 0.35 : 0.15 }} />
      <div style={{ position: 'fixed', top: -200, left: '30%', width: 600, height: 600, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(48,209,88,0.06) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(10,132,255,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -200, right: '10%', width: 500, height: 500, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(10,132,255,0.04) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(48,209,88,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: subColor, fontSize: 14, cursor: 'pointer', fontFamily: FONT }}>← Назад</button>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: textColor, margin: 0, letterSpacing: '-0.04em' }}>✏️ Редагування угоди</h1>
            {isPlanned && <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, background: ORANGE + '22', borderRadius: 8, padding: '4px 10px' }}>🕐 Планова</span>}
          </div>

          <div style={{
            background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 20, padding: '24px 20px',
            border: `1px solid ${isPlanned ? ORANGE + '44' : borderColor}`,
            boxShadow: dark
              ? 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.02)'
              : 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.02)',
            display: 'grid', gap: 18, position: 'relative', overflow: 'hidden',
          }}>

            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: dark ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />

            {/* Date + Pair */}
            <div className="form-grid-2">
              <div>
                <label style={labelStyle}>Дата</label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle}>Торгова пара *</label>
                <input type="text" value={form.pair} onChange={e => set('pair', e.target.value.toUpperCase())} style={inputStyle()} autoComplete="off" />
              </div>
            </div>

            {/* Setup */}
            <div>
              <label style={labelStyle}>Сетап *</label>
              <input type="text" list="setups-list" value={form.setup} onChange={e => set('setup', e.target.value)} style={inputStyle()} autoComplete="off" />
              <datalist id="setups-list">{setups.map(s => <option key={s} value={s} />)}</datalist>
            </div>

            {/* Direction */}
            <div>
              <label style={labelStyle}>Напрямок</label>
              {segmented('direction', ['Long', 'Short'], [GREEN, RED])}
            </div>

            {/* Entry points */}
            <div style={{
              background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              borderRadius: 14, padding: '16px',
              border: `1px solid ${isPlanned ? ORANGE + '33' : dark ? DARK.border : 'rgba(0,0,0,0.08)'}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: isPlanned ? ORANGE : subColor, marginBottom: 14 }}>📍 Точки входу</div>
              <div className="form-grid-3" style={{ marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Ціна входу</label>
                  <input type="number" step="any" value={form.entry_price} onChange={e => set('entry_price', e.target.value)} style={inputStyle()} />
                </div>
                <div>
                  <label style={labelStyle}>Стоп-лос</label>
                  <input type="number" step="any" value={form.stop_price} onChange={e => set('stop_price', e.target.value)} style={inputStyle()} />
                </div>
                <div>
                  <label style={labelStyle}>Тейк-профіт</label>
                  <input type="number" step="any" value={form.take_price} onChange={e => set('take_price', e.target.value)} style={inputStyle()} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Ризик</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['pct', 'usdt'] as const).map(rm => (
                      <button key={rm} onClick={() => setRiskMode(rm)} style={{
                        padding: '3px 10px', borderRadius: 8,
                        border: `1px solid ${riskMode === rm ? BLUE : dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                        background: riskMode === rm ? BLUE + '22' : 'transparent',
                        color: riskMode === rm ? BLUE : subColor,
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                      }}>{rm === 'pct' ? '% від депо' : 'USDT'}</button>
                    ))}
                  </div>
                </div>
                <div className="form-grid-2">
                  {riskMode === 'pct' ? (
                    <div>
                      <input type="number" step="0.1" placeholder="1.0" value={form.risk_pct} onChange={e => set('risk_pct', e.target.value)} style={inputStyle()} />
                      {riskHint
                        ? <div style={{ fontSize: 11, marginTop: 5, color: BLUE, fontWeight: 600 }}>💰 {riskHint}</div>
                        : <div style={{ fontSize: 11, color: subColor, marginTop: 4 }}>% від депозиту</div>
                      }
                    </div>
                  ) : (
                    <div>
                      <input type="number" step="1" placeholder="100" value={form.risk_usdt} onChange={e => set('risk_usdt', e.target.value)} style={inputStyle()} />
                      <div style={{ fontSize: 11, color: subColor, marginTop: 4 }}>USDT ризику</div>
                    </div>
                  )}
                </div>
              </div>

              {calcReady && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', background: GREEN + '12', borderRadius: 10, padding: '10px 14px', border: `1px solid ${GREEN}33`, marginTop: 14 }}>
                  <div style={{ fontSize: 12, color: subColor }}>Авто-розрахунок:</div>
                  {form.rr && <div style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>RR = {form.rr}</div>}
                  {form.profit_pct && riskMode === 'pct' && <div style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>P&L ≈ +{form.profit_pct}%</div>}
                  {form.profit_usd && riskMode === 'usdt' && <div style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>P&L ≈ +{form.profit_usd}$</div>}
                  {riskMode === 'pct' && form.risk_pct && balance > 0 && (
                    <div style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>Ризик: {(balance * parseFloat(form.risk_pct) / 100).toFixed(2)} USDT</div>
                  )}
                </div>
              )}
            </div>

            {/* Result */}
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
                <input type="number" step="0.1" value={form.rr} onChange={e => set('rr', e.target.value)} style={inputStyle()} />
              </div>
              {!isPlanned && (
                <>
                  <div>
                    <label style={labelStyle}>P&L ($)</label>
                    <input type="number" step="0.01" value={form.profit_usd} onChange={e => set('profit_usd', e.target.value)} style={inputStyle()} />
                  </div>
                  <div>
                    <label style={labelStyle}>P&L (%)</label>
                    <input type="number" step="0.01" value={form.profit_pct} onChange={e => set('profit_pct', e.target.value)} style={inputStyle()} />
                  </div>
                </>
              )}
            </div>

            {/* Grade */}
            {!isPlanned && (
              <div>
                <label style={labelStyle}>Самооцінка</label>
                {segmented('self_grade', ['A', 'B', 'C', 'D'], [GREEN, BLUE, ORANGE, RED])}
              </div>
            )}

            {/* Comment */}
            <div>
              <label style={labelStyle}>Коментар</label>
              <textarea value={form.comment} onChange={e => set('comment', e.target.value)} rows={4} style={{ ...inputStyle(), resize: 'vertical' as const }} />
            </div>

            {/* TradingView */}
            <div>
              <label style={labelStyle}>TradingView URL</label>
              <input type="url" value={form.tradingview_url} onChange={e => set('tradingview_url', e.target.value)} style={inputStyle()} />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: `${RED}12`, color: RED, fontSize: 13, position: 'relative' }}>{error}</div>
            )}

            {/* Save button */}
            <button onClick={save} disabled={saving} style={{
              background: dark
                ? (saving ? 'rgba(255,255,255,0.05)' : DARK.green)
                : (saving ? 'rgba(0,0,0,0.05)' : 'linear-gradient(180deg, #1f9e3f 0%, #166b2b 100%)'),
              color: saving ? subColor : '#fff',
              border: 'none', borderRadius: 12, padding: '14px',
              fontSize: 15, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1, fontFamily: FONT,
              boxShadow: saving ? 'none' : dark
                ? `0 0 24px ${DARK.green}44`
                : '0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
              transition: 'all 0.2s', position: 'relative',
            }}>
              {saving ? 'Збереження...' : '✓ Зберегти зміни'}
            </button>
          </div>
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
