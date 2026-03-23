'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeProvider'
import { useLocale } from '@/hooks/useLocale'
import { createClient } from '@/lib/supabase/client'
import NavBar from '@/components/layout/NavBar'

const PAIRS  = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'POL/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT', 'DOT/USDT']
const SETUPS = ['CHoCH + BOS + FVG', 'Breaker/Mitigation + iFVG', 'Order Block + FVG', 'Liquidity Sweep + Reversal', 'NWOG / NDOG', 'Premium/Discount + POI']

type RiskType = 'percent' | 'usdt'

interface FormErrors {
  pair?: string
  setup?: string
  initial_balance?: string
  risk_value?: string
  entry_price?: string
  stop_price?: string
  take_price?: string
}

const initialForm = {
  date:            new Date().toISOString().split('T')[0],
  pair:            '',
  setup:           '',
  direction:       'Long',
  initial_balance: '',
  risk_type:       'percent' as RiskType,
  risk_value:      '',
  entry_price:     '',
  stop_price:      '',
  take_price:      '',
  tradingview_url: '',
  comment:         '',
}

function validate(form: typeof initialForm): FormErrors {
  const errors: FormErrors = {}
  if (!form.pair.trim())  errors.pair = 'Вкажіть пару'
  if (!form.setup.trim()) errors.setup = 'Вкажіть сетап'

  const balance = parseFloat(form.initial_balance)
  if (!form.initial_balance || isNaN(balance) || balance <= 0) errors.initial_balance = 'Початковий баланс має бути > 0'

  const risk = parseFloat(form.risk_value)
  if (!form.risk_value || isNaN(risk) || risk <= 0) errors.risk_value = 'Ризик має бути > 0'

  const entry = parseFloat(form.entry_price)
  const stop = parseFloat(form.stop_price)
  const take = parseFloat(form.take_price)

  if (!form.entry_price || isNaN(entry) || entry <= 0) errors.entry_price = 'Вкажіть коректний entry'
  if (!form.stop_price || isNaN(stop) || stop <= 0) errors.stop_price = 'Вкажіть коректний stop'
  if (!form.take_price || isNaN(take) || take <= 0) errors.take_price = 'Вкажіть коректний take'

  return errors
}

export default function NewTradePage() {
  const { theme: c } = useTheme()
  const { t } = useLocale()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    const loadInitialBalance = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase.from('users').select('initial_balance').eq('id', user.id).single()
      if (error) return
      if (data?.initial_balance && Number(data.initial_balance) > 0) {
        setForm(prev => ({ ...prev, initial_balance: String(data.initial_balance) }))
      }
    }
    loadInitialBalance()
  }, [])

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k as keyof FormErrors]) {
      setErrors(e => ({ ...e, [k]: undefined }))
    }
  }

  const calculations = useMemo(() => {
    const balance = parseFloat(form.initial_balance)
    const riskValue = parseFloat(form.risk_value)
    const entry = parseFloat(form.entry_price)
    const stop = parseFloat(form.stop_price)
    const take = parseFloat(form.take_price)

    if ([balance, riskValue, entry, stop, take].some(v => isNaN(v) || v <= 0)) return null

    const riskUsd = form.risk_type === 'percent' ? (balance * riskValue) / 100 : riskValue
    const riskDistance = Math.abs(entry - stop)
    if (riskDistance === 0) return null

    const rewardDistance = form.direction === 'Long' ? (take - entry) : (entry - take)
    if (rewardDistance <= 0) return null

    const rr = rewardDistance / riskDistance
    const plannedProfitUsd = riskUsd * rr
    const plannedProfitPct = balance > 0 ? (plannedProfitUsd / balance) * 100 : 0

    return {
      riskUsd,
      rr,
      plannedProfitUsd,
      plannedProfitPct,
    }
  }, [form])

  const save = async () => {
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    if (!calculations) {
      setErrors({ take_price: 'Перевірте Entry / Stop / Take для вашого напрямку' })
      return
    }

    setSaving(true)
    const balance = parseFloat(form.initial_balance)
    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        initial_balance: balance,
        risk_value: parseFloat(form.risk_value),
        entry_price: parseFloat(form.entry_price),
        stop_price: parseFloat(form.stop_price),
        take_price: parseFloat(form.take_price),
        planned_rr: calculations.rr,
        planned_profit_usd: calculations.plannedProfitUsd,
        planned_profit_pct: calculations.plannedProfitPct,
        rr: calculations.rr,
      }),
    })
    const json = await res.json()
    if (json.success) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        try {
          await supabase.from('users').update({ initial_balance: balance }).eq('id', user.id).throwOnError()
        } catch {}
      }
      router.push('/trades')
    } else {
      setErrors({ pair: json.error || t('new_trade_error_required') })
      setSaving(false)
    }
  }

  const inputStyle = (hasError?: boolean) => ({
    width: '100%', background: c.surface2,
    border: `1px solid ${hasError ? '#ff453a' : c.border}`,
    borderRadius: 10, padding: '11px 14px', fontSize: 14, color: c.text,
    outline: 'none', boxSizing: 'border-box' as const,
  })

  const labelStyle = { fontSize: 12, color: c.text3, marginBottom: 6, display: 'block', fontWeight: 500 }
  const errorStyle = { fontSize: 11, color: '#ff453a', marginTop: 4 }

  const segmented = (key: 'direction' | 'risk_type', options: string[], labels?: string[]) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
      {options.map((o, i) => (
        <button key={o} onClick={() => set(key, o)} style={{
          padding: '9px 16px', borderRadius: 10, border: `1px solid ${c.border}`,
          background: form[key] === o ? c.text : 'transparent',
          color:      form[key] === o ? c.surface : c.text3,
          fontSize: 13, fontWeight: 500, cursor: 'pointer', flex: '0 0 auto',
        }}>{labels ? labels[i] : o}</button>
      ))}
    </div>
  )

  return (
    <div style={{ background: c.bg, minHeight: '100vh' }}>
      <NavBar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => router.back()} style={{
            background: 'transparent', border: 'none', color: c.text3,
            fontSize: 14, cursor: 'pointer',
          }}>{t('new_trade_back')}</button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: c.text, margin: 0 }}>План угоди</h1>
        </div>

        <div style={{
          background: c.surface, borderRadius: 18, padding: '20px 16px',
          border: `1px solid ${c.border}`, boxShadow: c.shadow,
          display: 'grid', gap: 18,
        }}>
          <div style={{ fontSize: 13, color: c.text3, marginBottom: -6 }}>
            Заповнюється до входу в позицію. Факт (результат, реальний P&L, висновки) додається після завершення угоди.
          </div>

          <div className="form-grid-2">
            <div>
              <label style={labelStyle}>{t('new_trade_date')}</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle()} />
            </div>
            <div>
              <label style={labelStyle}>{t('new_trade_pair')} *</label>
              <input
                type="text" list="pairs-list" placeholder="BTC/USDT"
                value={form.pair} onChange={e => set('pair', e.target.value.toUpperCase())}
                style={inputStyle(!!errors.pair)} autoComplete="off"
              />
              <datalist id="pairs-list">{PAIRS.map(p => <option key={p} value={p} />)}</datalist>
              {errors.pair && <div style={errorStyle}>{errors.pair}</div>}
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t('new_trade_setup')} *</label>
            <input
              type="text" list="setups-list" placeholder="CHoCH + BOS + FVG"
              value={form.setup} onChange={e => set('setup', e.target.value)}
              style={inputStyle(!!errors.setup)} autoComplete="off"
            />
            <datalist id="setups-list">{SETUPS.map(s => <option key={s} value={s} />)}</datalist>
            {errors.setup && <div style={errorStyle}>{errors.setup}</div>}
          </div>

          <div>
            <label style={labelStyle}>{t('new_trade_direction')}</label>
            {segmented('direction', ['Long', 'Short'], [t('new_trade_long'), t('new_trade_short')])}
          </div>

          <div className="form-grid-2">
            <div>
              <label style={labelStyle}>Початковий баланс (USDT) *</label>
              <input type="number" step="0.01" value={form.initial_balance}
                onChange={e => set('initial_balance', e.target.value)} style={inputStyle(!!errors.initial_balance)} />
              {errors.initial_balance && <div style={errorStyle}>{errors.initial_balance}</div>}
            </div>
            <div>
              <label style={labelStyle}>Тип ризику</label>
              {segmented('risk_type', ['percent', 'usdt'], ['% від балансу', 'USDT'])}
            </div>
          </div>

          <div className="form-grid-3">
            <div>
              <label style={labelStyle}>Ризик {form.risk_type === 'percent' ? '(%)' : '(USDT)'} *</label>
              <input type="number" step="0.01" value={form.risk_value}
                onChange={e => set('risk_value', e.target.value)} style={inputStyle(!!errors.risk_value)} />
              {errors.risk_value && <div style={errorStyle}>{errors.risk_value}</div>}
            </div>
            <div>
              <label style={labelStyle}>Entry *</label>
              <input type="number" step="0.0001" value={form.entry_price}
                onChange={e => set('entry_price', e.target.value)} style={inputStyle(!!errors.entry_price)} />
              {errors.entry_price && <div style={errorStyle}>{errors.entry_price}</div>}
            </div>
            <div>
              <label style={labelStyle}>Stop *</label>
              <input type="number" step="0.0001" value={form.stop_price}
                onChange={e => set('stop_price', e.target.value)} style={inputStyle(!!errors.stop_price)} />
              {errors.stop_price && <div style={errorStyle}>{errors.stop_price}</div>}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Take *</label>
            <input type="number" step="0.0001" value={form.take_price}
              onChange={e => set('take_price', e.target.value)} style={inputStyle(!!errors.take_price)} />
            {errors.take_price && <div style={errorStyle}>{errors.take_price}</div>}
          </div>

          {calculations && (
            <div style={{ background: c.surface2, border: `1px solid ${c.border}`, borderRadius: 12, padding: '12px 14px', color: '#2f2f33' }}>
              <div style={{ fontSize: 12, color: '#4a4a52', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Авто-розрахунок плану</div>
              <div className="form-grid-3">
                <div><strong>Ризик:</strong> {calculations.riskUsd.toFixed(2)} USDT</div>
                <div><strong>RR:</strong> {calculations.rr.toFixed(2)}</div>
                <div><strong>План P&L:</strong> +{calculations.plannedProfitUsd.toFixed(2)} USDT ({calculations.plannedProfitPct.toFixed(2)}%)</div>
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Pre-trade нотатка</label>
            <textarea value={form.comment} onChange={e => set('comment', e.target.value)}
              placeholder={t('new_trade_comment_ph')}
              rows={4} style={{ ...inputStyle(), resize: 'vertical' }} />
          </div>

          <div>
            <label style={labelStyle}>{t('new_trade_tv')}</label>
            <input type="url" placeholder={t('new_trade_tv_ph')} value={form.tradingview_url}
              onChange={e => set('tradingview_url', e.target.value)} style={inputStyle()} />
          </div>

          <button onClick={save} disabled={saving} style={{
            background: '#30d158', color: '#fff', border: 'none',
            borderRadius: 12, padding: '14px', fontSize: 15,
            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? t('new_trade_saving') : 'Зберегти план'}
          </button>

        </div>
      </div>

      <style>{`
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 600px) {
          .form-grid-2 {
            grid-template-columns: 1fr;
          }
          .form-grid-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
