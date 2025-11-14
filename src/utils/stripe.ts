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
    console.log('🚀 Démarrage checkout:', { planType, billingCycle });
    
    // Vérifier que la clé Stripe est présente
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!stripeKey) {
      throw new Error('VITE_STRIPE_PUBLISHABLE_KEY manquante');
    }
    console.log('✅ Clé Stripe trouvée');

    // Appeler la fonction Netlify pour créer la session
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planType, billingCycle }),
    });

    console.log('📡 Réponse Netlify:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur Netlify:', errorText);
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Session créée:', data);
    
    if (!data.url) {
      throw new Error('URL de checkout manquante dans la réponse');
    }

    console.log('🔄 Redirection vers Stripe Checkout...');
    window.location.href = data.url;
  } catch (error) {
    console.error('❌ Erreur Stripe:', error);
    throw error;
  }
};
