import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Client normal pour resetPasswordForEmail (nécessite la clé anon)
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
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

        // Trouver l'utilisateur par email (insensible à la casse)
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        let user = users?.users?.find(u => 
          u.email?.toLowerCase() === customerEmail.toLowerCase()
        );

        // Si l'utilisateur n'existe pas, le créer
        if (!user) {
          console.log('📝 Création d\'un nouvel utilisateur pour:', customerEmail);
          
          // Générer un mot de passe temporaire
          const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
          
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: customerEmail,
            password: tempPassword,
            email_confirm: true,
          });

          if (createError) {
            // Si l'utilisateur existe déjà, le récupérer
            if (createError.message?.includes('already been registered')) {
              console.log('ℹ️ Utilisateur existe déjà, récupération...');
              const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
              user = existingUsers?.users?.find(u => 
                u.email?.toLowerCase() === customerEmail.toLowerCase()
              );
              if (!user) {
                console.error('❌ Impossible de trouver l\'utilisateur existant');
                break;
              }
            } else {
              console.error('❌ Erreur création utilisateur:', createError);
              break;
            }
          } else if (newUser) {
            user = newUser.user;
            console.log('✅ Utilisateur créé:', user.id);
          }
        } else {
          console.log('ℹ️ Utilisateur existe déjà:', user.id);
        }

        // Envoyer un email de réinitialisation de mot de passe (même si l'utilisateur existe déjà)
        if (user) {
          try {
            const { error: emailError } = await supabase.auth.resetPasswordForEmail(customerEmail, {
              redirectTo: 'https://tradingpourlesnuls.com/?reset=true',
            });
            if (emailError) {
              console.error('❌ Erreur envoi email:', emailError);
            } else {
              console.log('📧 Email de réinitialisation envoyé à:', customerEmail);
            }
          } catch (emailError) {
            console.error('❌ Erreur envoi email:', emailError);
          }
        }

        // Créer/mettre à jour l'abonnement
        const periodStart = subscription.current_period_start 
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : new Date().toISOString();
        const periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 jours par défaut

        await supabaseAdmin.from('subscriptions').upsert({
          user_id: user.id,
          stripe_customer_id: session.customer,
          stripe_subscription_id: subscriptionId,
          plan_type: planType,
          billing_cycle: billingCycle,
          status: subscription.status,
          current_period_start: periodStart,
          current_period_end: periodEnd,
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

        const periodStart = subscription.current_period_start 
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : new Date().toISOString();
        const periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: status,
            current_period_start: periodStart,
            current_period_end: periodEnd,
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

