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
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('increment_rate_limit', {
    p_user_id:   userId,
    p_endpoint:  endpoint,
    p_max:       config.maxRequests,
    p_window_ms: config.windowMs,
  })

  if (error || !data) {
    console.error('Rate limit RPC error:', error)
    // fail closed — block request if RPC fails (protects against cost exhaustion)
    return { allowed: false, remaining: 0, resetAt: now + config.windowMs }
  }

  const resetAt = new Date(data.window_end).getTime()

  if (!data.allowed) {
    return { allowed: false, remaining: 0, resetAt }
  }

  return {
    allowed:   true,
    remaining: config.maxRequests - data.count,
    resetAt,
  }
}
