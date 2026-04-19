import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getAppUrl } from '@/lib/appUrl';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeSubscriptionId(
  sub: string | Stripe.Subscription | null | undefined
): string | null {
  if (sub == null) return null;
  return typeof sub === 'string' ? sub : sub.id;
}

export async function GET(req: NextRequest) {
  const APP = getAppUrl();
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.redirect(`${APP}/billing?canceled=true`);
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const userId = session.metadata?.user_id;
    if (!userId) {
      console.error('Stripe confirm: no user_id in session metadata');
      return NextResponse.redirect(`${APP}/billing?canceled=true`);
    }
    if (session.payment_status === 'paid') {
      const subscriptionId = normalizeSubscriptionId(session.subscription);
      if (!subscriptionId) {
        console.error('Stripe confirm: missing subscription id');
        return NextResponse.redirect(`${APP}/billing?canceled=true`);
      }
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          plan: 'pro',
          stripe_subscription_id: subscriptionId,
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
