import { createClient } from '@/lib/supabase/server'

interface RateLimitConfig {
  maxRequests: number
  windowMs:    number
}

const LIMITS: Record<string, RateLimitConfig> = {
  'trade_review': { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  'trade_score':  { maxRequests: 30, windowMs: 60 * 60 * 1000 },
  'coach':        { maxRequests: 5,  windowMs: 60 * 60 * 1000 },
  'psychology':   { maxRequests: 5,  windowMs: 60 * 60 * 1000 },
  'screenshot':   { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  'chat':         { maxRequests: 50, windowMs: 60 * 60 * 1000 },
}

export interface RateLimitResult {
  allowed:   boolean
  remaining: number
  resetAt:   number
}

export async function checkRateLimit(userId: string, endpoint: string): Promise<RateLimitResult> {
  const config = LIMITS[endpoint] ?? { maxRequests: 10, windowMs: 60 * 60 * 1000 }
  const now = Date.now()
  const windowEnd = new Date(now + config.windowMs).toISOString()

  const supabase = await createClient()

  // Try to get existing record
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .single()

  // If no record or window expired — reset
  if (!existing || new Date(existing.window_end).getTime() <= now) {
    await supabase
      .from('rate_limits')
      .upsert({
        user_id:    userId,
        endpoint,
        count:      1,
        window_end: windowEnd,
      }, { onConflict: 'user_id,endpoint' })

    return {
      allowed:   true,
      remaining: config.maxRequests - 1,
      resetAt:   now + config.windowMs,
    }
  }

  // Window active — check limit
  if (existing.count >= config.maxRequests) {
    return {
      allowed:   false,
      remaining: 0,
      resetAt:   new Date(existing.window_end).getTime(),
    }
  }

  // Increment counter
  await supabase
    .from('rate_limits')
    .update({ count: existing.count + 1 })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)

  return {
    allowed:   true,
    remaining: config.maxRequests - existing.count - 1,
    resetAt:   new Date(existing.window_end).getTime(),
  }
}
