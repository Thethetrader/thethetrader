// Configuration des plans d'abonnement et accès aux canaux

export type PlanType = 'basic' | 'premium' | 'journal';
export type BillingCycle = 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  monthlyPrice: number; // en euros
  yearlyPrice: number; // en euros (montant total annuel)
  stripePriceIdMonthly?: string; // À remplir avec les ID Stripe
  stripePriceIdYearly?: string; // À remplir avec les ID Stripe
  accessibleChannels: string[]; // IDs des canaux accessibles
}

// Définition des canaux disponibles
export const CHANNELS = {
  // Éducation
  EDUCATION_FUNDAMENTAUX: 'fondamentaux',
  EDUCATION_LETSGOOO: 'letsgooo-model',
  
  // Signaux
  SIGNALS_INDICES: 'general-chat-2',
  SIGNALS_CRYPTO: 'general-chat-3',
  SIGNALS_FOREX: 'general-chat-4',
  
  // Trading
  TRADING_JOURNAL: 'trading-journal',
  JOURNAL_SIGNAUX: 'calendrier',
  JOURNAL_PERSO: 'journal',
  LIVESTREAM: 'video',
  LIVESTREAM_PREMIUM: 'livestream-premium',
} as const;

// Plans d'abonnement
export const SUBSCRIPTION_PLANS: Record<PlanType, SubscriptionPlan> = {
  basic: {
    id: 'basic',
    name: 'BASIC',
    monthlyPrice: 39,
    yearlyPrice: 418, // 34.83€/mois × 12
    accessibleChannels: [
      CHANNELS.EDUCATION_FUNDAMENTAUX,
      CHANNELS.SIGNALS_INDICES,
      CHANNELS.SIGNALS_CRYPTO,
      CHANNELS.SIGNALS_FOREX,
      CHANNELS.TRADING_JOURNAL,
      CHANNELS.JOURNAL_SIGNAUX,
      CHANNELS.JOURNAL_PERSO,
    ],
  },
  premium: {
    id: 'premium',
    name: 'PREMIUM',
    monthlyPrice: 79,
    yearlyPrice: 690, // 57.5€/mois × 12
    accessibleChannels: [
      // Premium a accès à tous les canaux
      CHANNELS.EDUCATION_FUNDAMENTAUX,
      CHANNELS.EDUCATION_LETSGOOO,
      CHANNELS.SIGNALS_INDICES,
      CHANNELS.SIGNALS_CRYPTO,
      CHANNELS.SIGNALS_FOREX,
      CHANNELS.TRADING_JOURNAL,
      CHANNELS.JOURNAL_SIGNAUX,
      CHANNELS.JOURNAL_PERSO,
      CHANNELS.LIVESTREAM,
      CHANNELS.LIVESTREAM_PREMIUM,
    ],
  },
  journal: {
    id: 'journal',
    name: 'JOURNAL PERSO',
    monthlyPrice: 15,
    yearlyPrice: 150, // 12.5€/mois × 12
    accessibleChannels: [
      CHANNELS.JOURNAL_PERSO, // 'journal'
      CHANNELS.TRADING_JOURNAL, // 'trading-journal'
      // Note: calendrier (Journal Signaux) n'est PAS inclus
    ],
  },
};

// Helper pour obtenir le prix selon le cycle
export const getPlanPrice = (plan: PlanType, cycle: BillingCycle): number => {
  const subscriptionPlan = SUBSCRIPTION_PLANS[plan];
  return cycle === 'monthly' ? subscriptionPlan.monthlyPrice : subscriptionPlan.yearlyPrice;
};

// Helper pour vérifier si un utilisateur a accès à un canal
export const hasChannelAccess = (userPlan: PlanType | null, channelId: string): boolean => {
  if (!userPlan) return false;
  
  // Les admins ont accès à tout
  // (à gérer séparément dans le code)
  
  const plan = SUBSCRIPTION_PLANS[userPlan];
  return plan.accessibleChannels.includes(channelId);
};

