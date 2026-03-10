import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    limits: {
      trades: 20,
      aiAnalysis: false,
      advancedAnalytics: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 19,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    limits: {
      trades: Infinity,
      aiAnalysis: true,
      advancedAnalytics: true,
    },
  },
};