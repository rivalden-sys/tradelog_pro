import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      'whsec_021d9c3a5a6392691bc130239a8e7aff459e3f8a84538325b264c8bac428e63d'
    );
  } catch (err) {
    console.error('Webhook signature error:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('📩 Event received:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        console.log('✅ checkout.session.completed');
        console.log('customerId:', customerId);
        console.log('subscriptionId:', subscriptionId);

        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

        const { data, error } = await supabaseAdmin
          .from('users')
          .update({
            plan: 'pro',
            stripe_subscription_id: subscriptionId,
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        console.log('Supabase update result:', data, error);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;

        console.log('✅ invoice.payment_succeeded');
        console.log('customerId:', customerId);

        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any

        const { data, error } = await supabaseAdmin
          .from('users')
          .update({
            plan: 'pro',
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        console.log('Supabase update result:', data, error);
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const isActive = subscription.status === 'active';

        console.log('✅ subscription event:', event.type);
        console.log('customerId:', customerId);

        const { data, error } = await supabaseAdmin
          .from('users')
          .update({
            plan: isActive ? 'pro' : 'free',
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        console.log('Supabase update result:', data, error);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}