interface RateLimitEntry {
  count:     number
  windowEnd: number
}

const store = new Map<string, RateLimitEntry>()

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

export function checkRateLimit(userId: string, endpoint: string): RateLimitResult {
  const config = LIMITS[endpoint] ?? { maxRequests: 10, windowMs: 60 * 60 * 1000 }
  const key    = `${userId}:${endpoint}`
  const now    = Date.now()

  const entry = store.get(key)

  if (!entry || now > entry.windowEnd) {
    store.set(key, { count: 1, windowEnd: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs }
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.windowEnd }
  }

  entry.count++
  return {
    allowed:   true,
    remaining: config.maxRequests - entry.count,
    resetAt:   entry.windowEnd,
  }
}