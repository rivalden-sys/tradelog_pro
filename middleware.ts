import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - auth/callback (OAuth callback, Supabase handles its own session)
     * - api routes (each has own auth via supabase.auth.getUser)
     * - public routes: /, /u/*, /privacy, /terms
     * - forgot-password, reset-password (password flows)
     * - static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|api|u/|privacy|terms|forgot-password|reset-password|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
