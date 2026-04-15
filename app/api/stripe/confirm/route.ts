import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP = 'https://aurumtrade.vercel.app';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');
  const userId    = searchParams.get('user_id');

  if (!sessionId || !userId) {
    return NextResponse.redirect(`${APP}/billing?canceled=true`);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      await supabaseAdmin
        .from('users')
        .update({ plan: 'pro', stripe_subscription_id: session.subscription as string })
        .eq('id', userId);
    }
    return NextResponse.redirect(`${APP}/billing?success=true`);
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(`${APP}/billing?canceled=true`);
  }
}
