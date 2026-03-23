// /app/trades/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useParams } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TradePage() {
  const params = useParams()
  const id = params?.id as string

  const [trade, setTrade] = useState<any>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchTrade = async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', Number(id))
        .single()

      if (!error && data) {
        setTrade(data)
        setComment(data.post_comment || '')
      }

      setLoading(false)
    }

    fetchTrade()
  }, [id])

  const handleSave = async () => {
    if (!id) return

    setSaving(true)

    await supabase
      .from('trades')
      .update({ post_comment: comment })
      .eq('id', Number(id))

    setSaving(false)
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!trade) return <div className="p-6">Trade not found</div>

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Trade Details</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Pair</p>
            <p className="font-medium">{trade.pair || '-'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Direction</p>
            <p className="font-medium">{trade.direction || '-'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Result</p>
            <p className="font-medium">{trade.result || '-'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">RR</p>
            <p className="font-medium">{trade.rr ?? '-'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">P&L $</p>
            <p className="font-medium">{trade.pnl_usd ?? '-'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">P&L %</p>
            <p className="font-medium">{trade.pnl_percent ?? '-'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Post Trade Comment</h2>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your conclusions after the trade..."
          className="w-full h-32 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-black/20"
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 px-5 py-2 rounded-xl bg-black text-white disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
