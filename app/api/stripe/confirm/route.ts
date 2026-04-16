import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { getAppUrl } from '@/lib/appUrl';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const APP = getAppUrl();
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.redirect(`${APP}/billing?canceled=true`);
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    // SECURITY FIX: never trust user_id from URL params
    // derive user identity from Stripe session metadata only
    const userId = session.metadata?.user_id;
    if (!userId) {
      console.error('Stripe confirm: no user_id in session metadata');
      return NextResponse.redirect(`${APP}/billing?canceled=true`);
    }
    if (session.payment_status === 'paid') {
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          plan: 'pro',
          stripe_subscription_id: session.subscription as string,
        })
        .eq('id', userId);
      if (error) {
        console.error('Stripe confirm: failed to update user plan', error);
        return NextResponse.redirect(`${APP}/billing?canceled=true`);
      }
    }
    return NextResponse.redirect(`${APP}/billing?success=true`);
  } catch (error) {
    console.error('Stripe confirm error:', error);
    return NextResponse.redirect(`${APP}/billing?canceled=true`);
  }
}
