import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        // SECURITY: prefer metadata.user_id (set in checkout/route.ts) for first linkage
        const userId = session.metadata?.user_id;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        if (userId) {
          // strict mapping by user id from Stripe metadata
          const { error } = await supabaseAdmin
            .from("users")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: subscription.status,
            })
            .eq("id", userId);
          if (error) console.error("Webhook checkout update (by user_id) failed:", error);
        } else {
          // fallback: map by customer id, ensure exactly one match
          const { data: users, error: selError } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("stripe_customer_id", customerId);
          if (selError || !users || users.length !== 1) {
            console.error("Webhook checkout: ambiguous customer mapping", { customerId, count: users?.length });
            break;
          }
          const { error } = await supabaseAdmin
            .from("users")
            .update({
              stripe_subscription_id: subscriptionId,
              subscription_status: subscription.status,
            })
            .eq("id", users[0].id);
          if (error) console.error("Webhook checkout update (by customer_id) failed:", error);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string | null;
        const customerId = invoice.customer as string;

        // SECURITY: prefer subscription_id (precise), fallback to customer_id
        if (subscriptionId) {
          const { error } = await supabaseAdmin
            .from("users")
            .update({
              plan: "pro",
              subscription_status: "active",
              current_period_end: new Date(invoice.period_end * 1000).toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
          if (error) console.error("Webhook invoice update (by subscription_id) failed:", error);
        } else if (customerId) {
          const { error } = await supabaseAdmin
            .from("users")
            .update({
              plan: "pro",
              subscription_status: "active",
              current_period_end: new Date(invoice.period_end * 1000).toISOString(),
            })
            .eq("stripe_customer_id", customerId);
          if (error) console.error("Webhook invoice update (by customer_id) failed:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        // SECURITY: map by subscription_id (precise)
        const { error } = await supabaseAdmin
          .from("users")
          .update({
            plan: "free",
            subscription_status: "canceled",
          })
          .eq("stripe_subscription_id", subscriptionId);
        if (error) console.error("Webhook subscription.deleted update failed:", error);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler failed:", error);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
