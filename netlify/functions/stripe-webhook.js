import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook signature missing' }),
    };
  }

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` }),
    };
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        const planType = session.metadata?.plan_type;
        const billingCycle = session.metadata?.billing_cycle;

        if (!planType || !billingCycle) {
          console.error('❌ Missing metadata in checkout session');
          break;
        }

        const subscriptionId = session.subscription;
        if (!subscriptionId) {
          console.error('❌ No subscription ID in session');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerEmail = session.customer_email || session.customer_details?.email;

        if (!customerEmail) {
          console.error('❌ No email found');
          break;
        }

        // Trouver l'utilisateur par email
        const { data: users } = await supabase.auth.admin.listUsers();
        let user = users?.users?.find(u => u.email === customerEmail);

        // Si l'utilisateur n'existe pas, le créer
        if (!user) {
          console.log('📝 Création d\'un nouvel utilisateur pour:', customerEmail);
          
          // Générer un mot de passe temporaire
          const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
          
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: customerEmail,
            password: tempPassword,
            email_confirm: true,
          });

          if (createError || !newUser) {
            console.error('❌ Erreur création utilisateur:', createError);
            break;
          }

          user = newUser.user;
          console.log('✅ Utilisateur créé:', user.id);
          
          // TODO: Envoyer un email avec le mot de passe temporaire
          // Pour l'instant, on le log (à remplacer par un service d'email)
          console.log('📧 Mot de passe temporaire pour', customerEmail, ':', tempPassword);
        }

        // Créer/mettre à jour l'abonnement
        await supabase.from('subscriptions').upsert({
          user_id: user.id,
          stripe_customer_id: session.customer,
          stripe_subscription_id: subscriptionId,
          plan_type: planType,
          billing_cycle: billingCycle,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end || false,
        });

        console.log('✅ Subscription created for:', customerEmail);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object;
        const status = stripeEvent.type === 'customer.subscription.deleted' 
          ? 'canceled' 
          : subscription.status;

        await supabase
          .from('subscriptions')
          .update({
            status: status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end || false,
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log('✅ Subscription updated:', subscription.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('❌ Erreur webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

