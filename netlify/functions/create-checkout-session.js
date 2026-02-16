import Stripe from 'stripe';

const getStripeKey = () => process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SK || '';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Méthode non autorisée' }),
    };
  }

  try {
    const secretKey = getStripeKey();
    if (!secretKey || !secretKey.startsWith('sk_')) {
      console.error('STRIPE_SECRET_KEY / STRIPE_SK manquante ou invalide dans Netlify Environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Stripe non configuré: ajoute STRIPE_SECRET_KEY dans Netlify > Environment variables' }),
      };
    }
    const stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' });

    const { planType, billingCycle } = JSON.parse(event.body);

    if (!planType || !billingCycle) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'planType et billingCycle requis' }),
      };
    }

    // Mapping des prix (à configurer dans Stripe Dashboard)
    const priceIds = {
      basic: {
        monthly: process.env.STRIPE_PRICE_ID_BASIC_MONTHLY || '',
        yearly: process.env.STRIPE_PRICE_ID_BASIC_YEARLY || '',
      },
      premium: {
        monthly: process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY || '',
        yearly: process.env.STRIPE_PRICE_ID_PREMIUM_YEARLY || '',
      },
      journal: {
        monthly: process.env.STRIPE_PRICE_ID_JOURNAL_MONTHLY || '',
        yearly: process.env.STRIPE_PRICE_ID_JOURNAL_YEARLY || '',
      },
    };

    const priceId = priceIds[planType]?.[billingCycle];

    if (!priceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Plan ou cycle de facturation invalide' }),
      };
    }

    const origin = event.headers.origin || event.headers.referer || 'https://tradingpourlesnuls.com';

    // Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${origin}/?success=true&session_id={CHECKOUT_SESSION_ID}&setup_password=true`,
          cancel_url: `${origin}/?canceled=true`,
      metadata: {
        plan_type: planType,
        billing_cycle: billingCycle,
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
    };
  } catch (error) {
    console.error('❌ Erreur:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

