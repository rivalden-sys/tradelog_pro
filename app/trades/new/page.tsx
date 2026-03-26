'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/hooks/useLocale'
import NavBar from '@/components/layout/NavBar'
import { createClient } from '@/lib/supabase/client'

const SETUPS_DEFAULT = ['CHoCH + BOS + FVG', 'Breaker/Mitigation + iFVG', 'Order Block + FVG', 'Liquidity Sweep + Reversal', 'NWOG / NDOG', 'Premium/Discount + POI']
const GRADES         = ['A', 'B', 'C', 'D']

const GREEN  = '#30d158'
const RED    = '#ff453a'
const ORANGE = '#ff9f0a'
const BLUE   = '#0a84ff'
const GRAY   = '#8e8e93'
const FONT   = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"

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

interface FormErrors {
  pair?:        string
  setup?:       string
  rr?:          string
  profit_usd?:  string
  profit_pct?:  string
  entry_price?: string
  stop_price?:  string
  take_price?:  string
}

const initialForm = {
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
  entry_price:     '',
  stop_price:      '',
  take_price:      '',
  risk_pct:        '',
  risk_usdt:       '',
}

export default function NewTradePage() {
  const dark   = useDark()
  const { t }  = useLocale()
  const router = useRouter()

  const textColor   = dark ? '#f5f5f7' : '#1c1c1e'
  const subColor    = dark ? 'rgba(255,255,255,0.35)' : '#6e6e73'
  const borderColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.8)'
  const inputBg     = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const inputBorder = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)'
  const inputShadow = dark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 2px 4px rgba(0,0,0,0.04)'

  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

  const [saving,    setSaving]    = useState(false)
  const [errors,    setErrors]    = useState<FormErrors>({})
  const [form,      setForm]      = useState(initialForm)
  const [mode,      setMode]      = useState<'planned' | 'closed'>('planned')
  const [riskMode,  setRiskMode]  = useState<'pct' | 'usdt'>('pct')
  const [tradeType, setTradeType] = useState<'futures' | 'spot'>('futures')
  const [balance,   setBalance]   = useState<number>(0)
  const [setups,    setSetups]    = useState<string[]>(SETUPS_DEFAULT)
  const [pairs,     setPairs]     = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('users').select('balance').eq('id', user.id).single()
      if (profile?.balance) setBalance(profile.balance)
      const { data: pairsData } = await supabase.from('trades').select('pair').eq('user_id', user.id)
      if (pairsData?.length) setPairs([...new Set(pairsData.map((t: any) => t.pair).filter(Boolean))] as string[])
      const { data: setupsData } = await supabase.from('trades').select('setup').eq('user_id', user.id)
      if (setupsData?.length) {
        const unique = [...new Set(setupsData.map((t: any) => t.setup).filter(Boolean))] as string[]
        if (unique.length) setSetups([...new Set([...unique, ...SETUPS_DEFAULT])])
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (tradeType === 'spot') setForm(f => ({ ...f, direction: 'Long' }))
  }, [tradeType])

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
    if (errors[k as keyof FormErrors]) setErrors(e => ({ ...e, [k]: undefined }))
  }

  const validate = (): FormErrors => {
    const errs: FormErrors = {}
    if (!form.pair.trim())  errs.pair  = 'Вкажіть пару'
    if (!form.setup.trim()) errs.setup = 'Вкажіть сетап'
    if (mode === 'planned') {
      if (!form.entry_price || isNaN(parseFloat(form.entry_price))) errs.entry_price = 'Вкажіть ціну входу'
      if (!form.stop_price  || isNaN(parseFloat(form.stop_price)))  errs.stop_price  = 'Вкажіть стоп-лос'
      if (!form.take_price  || isNaN(parseFloat(form.take_price)))  errs.take_price  = 'Вкажіть тейк-профіт'
    } else {
      const rr = parseFloat(form.rr)
      if (!form.rr || isNaN(rr) || rr <= 0) errs.rr = 'RR має бути > 0'
      if (form.profit_usd === '' || isNaN(parseFloat(form.profit_usd))) errs.profit_usd = 'Вкажіть P&L $'
      if (form.profit_pct === '' || isNaN(parseFloat(form.profit_pct))) errs.profit_pct = 'Вкажіть P&L %'
    }
    return errs
  }

  const save = async () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setSaving(true)
    const payload: any = {
      ...form,
      rr:          parseFloat(form.rr)          || 0,
      profit_usd:  parseFloat(form.profit_usd)  || 0,
      profit_pct:  parseFloat(form.profit_pct)  || 0,
      entry_price: parseFloat(form.entry_price) || null,
      stop_price:  parseFloat(form.stop_price)  || null,
      take_price:  parseFloat(form.take_price)  || null,
      risk_pct:    parseFloat(form.risk_pct)    || null,
      risk_usdt:   parseFloat(form.risk_usdt)   || null,
      status:      mode, trade_type: tradeType,
    }
    if (mode === 'planned') { payload.result = 'Тейк'; payload.profit_usd = 0; payload.profit_pct = 0 }
    const res  = await fetch('/api/trades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const json = await res.json()
    if (json.success) router.push('/trades')
    else if (json.code === 'FREE_LIMIT_REACHED') router.push('/billing')
    else { setErrors({ pair: json.error || t('new_trade_error_required') }); setSaving(false) }
  }

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%', background: inputBg,
    border: `1px solid ${hasError ? RED : inputBorder}`,
    borderRadius: 10, padding: '11px 14px', fontSize: 14, color: textColor,
    outline: 'none', boxSizing: 'border-box', fontFamily: FONT,
    backdropFilter: 'blur(10px)', boxShadow: inputShadow,
  })

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: subColor, marginBottom: 6,
    display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
  }
  const errorStyle: React.CSSProperties = { fontSize: 11, color: RED, marginTop: 4 }

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
            fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
            transition: 'all 0.15s',
          }}>{labels ? labels[i] : o}</button>
        )
      })}
    </div>
  )

  const glassSection = (accent?: string): React.CSSProperties => ({
    background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 14, padding: '16px',
    border: `1px solid ${accent ? accent + '33' : dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
  })

  const calcReady = form.entry_price && form.stop_price && form.take_price

  const modeBtn = (val: 'planned' | 'closed' | 'futures' | 'spot', label: string, color: string, current: string): React.CSSProperties => ({
    flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
    background: current === val ? color + '22' : 'transparent',
    color: current === val ? color : subColor,
    fontSize: 14, fontWeight: current === val ? 700 : 500,
    cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
  })

  return (
    <div style={{ minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: dark ? '#0a0a0b' : 'linear-gradient(135deg, #e8edf5 0%, #f0f2f7 50%, #e8f0ed 100%)' }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: noiseSvg, opacity: dark ? 0.35 : 0.15 }} />
      {dark ? (
        <>
          <div style={{ position: 'fixed', top: -200, left: '30%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(48,209,88,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'fixed', bottom: -200, right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(10,132,255,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        </>
      ) : (
        <>
          <div style={{ position: 'fixed', top: -150, left: '20%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(10,132,255,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'fixed', bottom: -150, right: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(48,209,88,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        </>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: subColor, fontSize: 14, cursor: 'pointer', fontFamily: FONT }}>{t('new_trade_back')}</button>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: textColor, margin: 0, letterSpacing: '-0.04em' }}>{t('new_trade_title')}</h1>
          </div>

          {/* Type selector */}
          <div style={{ ...glassSection(), marginBottom: 12, padding: 4 }}>
            <div style={{ display: 'flex' }}>
              <button onClick={() => setTradeType('futures')} style={modeBtn('futures', '📈 Futures', BLUE,   tradeType)}>📈 Futures</button>
              <button onClick={() => setTradeType('spot')}    style={modeBtn('spot',    '🪙 Spot',    ORANGE, tradeType)}>🪙 Spot</button>
            </div>
          </div>

          {/* Mode selector */}
          <div style={{ ...glassSection(), marginBottom: 20, padding: 4 }}>
            <div style={{ display: 'flex' }}>
              <button onClick={() => setMode('planned')} style={modeBtn('planned', '🕐 Планова угода', ORANGE, mode)}>🕐 Планова угода</button>
              <button onClick={() => setMode('closed')}  style={modeBtn('closed',  '✅ Закрита угода', GREEN,  mode)}>✅ Закрита угода</button>
            </div>
          </div>

          {/* Main form */}
          <div style={{
            background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 20, padding: '24px 20px',
            border: `1px solid ${mode === 'planned' ? ORANGE + '44' : borderColor}`,
            boxShadow: dark
              ? 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.02)'
              : 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.02)',
            display: 'grid', gap: 18, position: 'relative', overflow: 'hidden',
          }}>

            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: dark ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />

            {/* Date + Pair */}
            <div className="form-grid-2">
              <div>
                <label style={labelStyle}>{t('new_trade_date')}</label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle}>{t('new_trade_pair')} *</label>
                <input type="text" list="pairs-list" placeholder="BTC/USDT" value={form.pair} onChange={e => set('pair', e.target.value.toUpperCase())} style={inputStyle(!!errors.pair)} autoComplete="off" />
                <datalist id="pairs-list">{pairs.map(p => <option key={p} value={p} />)}</datalist>
                {errors.pair && <div style={errorStyle}>{errors.pair}</div>}
              </div>
            </div>

            {/* Setup */}
            <div>
              <label style={labelStyle}>{t('new_trade_setup')} *</label>
              <input type="text" list="setups-list" placeholder="CHoCH + BOS + FVG" value={form.setup} onChange={e => set('setup', e.target.value)} style={inputStyle(!!errors.setup)} autoComplete="off" />
              <datalist id="setups-list">{setups.map(s => <option key={s} value={s} />)}</datalist>
              {errors.setup && <div style={errorStyle}>{errors.setup}</div>}
            </div>

            {/* Direction */}
            <div>
              <label style={labelStyle}>{t('new_trade_direction')}</label>
              {tradeType === 'spot' ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, border: `1px solid ${GREEN}`, background: GREEN + '22', color: GREEN, fontSize: 13, fontWeight: 700 }}>
                  🪙 Long (Spot only)
                </div>
              ) : (
                segmented('direction', ['Long', 'Short'], [GREEN, RED], [t('new_trade_long'), t('new_trade_short')])
              )}
            </div>

            {/* Entry points */}
            <div style={glassSection(mode === 'planned' ? ORANGE : undefined)}>
              <div style={{ fontSize: 13, fontWeight: 700, color: mode === 'planned' ? ORANGE : subColor, marginBottom: 14 }}>📍 Точки входу</div>
              <div className="form-grid-3" style={{ marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Ціна входу {mode === 'planned' ? '*' : ''}</label>
                  <input type="number" step="any" placeholder="84500" value={form.entry_price} onChange={e => set('entry_price', e.target.value)} style={inputStyle(!!errors.entry_price)} />
                  {errors.entry_price && <div style={errorStyle}>{errors.entry_price}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Стоп-лос {mode === 'planned' ? '*' : ''}</label>
                  <input type="number" step="any" placeholder="83000" value={form.stop_price} onChange={e => set('stop_price', e.target.value)} style={inputStyle(!!errors.stop_price)} />
                  {errors.stop_price && <div style={errorStyle}>{errors.stop_price}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Тейк-профіт {mode === 'planned' ? '*' : ''}</label>
                  <input type="number" step="any" placeholder="88000" value={form.take_price} onChange={e => set('take_price', e.target.value)} style={inputStyle(!!errors.take_price)} />
                  {errors.take_price && <div style={errorStyle}>{errors.take_price}</div>}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
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
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', background: GREEN + '12', borderRadius: 10, padding: '10px 14px', border: `1px solid ${GREEN}33` }}>
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

            {/* Closed fields */}
            {mode === 'closed' && (
              <>
                <div>
                  <label style={labelStyle}>{t('new_trade_result')}</label>
                  {segmented('result', ['Тейк', 'Стоп', 'БУ'], [GREEN, RED, GRAY], [t('new_trade_take'), t('new_trade_stop'), t('new_trade_bu')])}
                </div>
                <div className="form-grid-3">
                  <div>
                    <label style={labelStyle}>{t('new_trade_rr')} *</label>
                    <input type="number" step="0.1" placeholder="2.5" value={form.rr} onChange={e => set('rr', e.target.value)} style={inputStyle(!!errors.rr)} />
                    {errors.rr && <div style={errorStyle}>{errors.rr}</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>{t('new_trade_profit_usd')} *</label>
                    <input type="number" step="0.01" placeholder="150.00" value={form.profit_usd} onChange={e => set('profit_usd', e.target.value)} style={inputStyle(!!errors.profit_usd)} />
                    {errors.profit_usd && <div style={errorStyle}>{errors.profit_usd}</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>{t('new_trade_profit_pct')} *</label>
                    <input type="number" step="0.01" placeholder="1.5" value={form.profit_pct} onChange={e => set('profit_pct', e.target.value)} style={inputStyle(!!errors.profit_pct)} />
                    {errors.profit_pct && <div style={errorStyle}>{errors.profit_pct}</div>}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>{t('new_trade_grade')}</label>
                  {segmented('self_grade', GRADES, [GREEN, BLUE, ORANGE, RED])}
                </div>
              </>
            )}

            {/* Comment */}
            <div>
              <label style={labelStyle}>{t('new_trade_comment')}</label>
              <textarea value={form.comment} onChange={e => set('comment', e.target.value)}
                placeholder={mode === 'planned' ? 'Чому входжу? Яка ідея? Що підтверджує сетап?' : t('new_trade_comment_ph')}
                rows={4} style={{ ...inputStyle(), resize: 'vertical' as const }} />
            </div>

            {/* TradingView */}
            <div>
              <label style={labelStyle}>{t('new_trade_tv')}</label>
              <input type="url" placeholder={t('new_trade_tv_ph')} value={form.tradingview_url} onChange={e => set('tradingview_url', e.target.value)} style={inputStyle()} />
            </div>

            {/* Save button */}
            <button onClick={save} disabled={saving} style={{
              background: saving
                ? dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                : mode === 'planned'
                  ? dark ? ORANGE : 'linear-gradient(180deg, #e08b00 0%, #b36d00 100%)'
                  : dark ? GREEN  : 'linear-gradient(180deg, #1f9e3f 0%, #166b2b 100%)',
              color: saving ? subColor : mode === 'planned' ? '#000' : '#fff',
              border: 'none', borderRadius: 12, padding: '14px',
              fontSize: 15, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1, fontFamily: FONT,
              boxShadow: saving ? 'none' : dark
                ? `0 0 24px ${mode === 'planned' ? ORANGE : GREEN}44`
                : '0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
              transition: 'all 0.2s',
            }}>
              {saving ? t('new_trade_saving') : mode === 'planned' ? '🕐 Зберегти план' : '✓ Зберегти угоду'}
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
