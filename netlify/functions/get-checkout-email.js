import Stripe from 'stripe';

const getStripeKey = () => process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SK || '';

export const handler = async (event) => {
  const key = getStripeKey();
  if (!key || !key.startsWith('sk_')) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'STRIPE_SECRET_KEY manquante' }) };
  }
  const stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' });

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Méthode non autorisée' }),
    };
  }

  try {
    const sessionId = event.queryStringParameters?.session_id;

    if (!sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'session_id requis' }),
      };
    }

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const email = session.customer_email || session.customer_details?.email || '';

    if (!email) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Email non trouvé dans la session' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ email }),
    };
  } catch (error) {
    console.error('❌ Erreur get-checkout-email:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

