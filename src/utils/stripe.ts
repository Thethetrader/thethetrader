import { loadStripe } from '@stripe/stripe-js';
import type { PlanType, BillingCycle } from '../config/subscription-plans';

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

export const redirectToCheckout = async (
  planType: PlanType,
  billingCycle: BillingCycle
): Promise<void> => {
  try {
    // Appeler la fonction Netlify pour créer la session
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planType, billingCycle }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la création de la session');
    }

    const { sessionId } = await response.json();
    const stripe = await getStripe();

    if (!stripe) {
      throw new Error('Stripe non initialisé');
    }

    const result = await stripe.redirectToCheckout({ sessionId });

    if (result.error) {
      throw result.error;
    }
  } catch (error) {
    console.error('❌ Erreur Stripe:', error);
    throw error;
  }
};
