// Plans d'abonnement
export type PlanType = 'basic' | 'premium';
export type BillingCycle = 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
}

export const SUBSCRIPTION_PLANS: Record<PlanType, SubscriptionPlan> = {
  basic: {
    id: 'basic',
    name: 'BASIC',
    monthlyPrice: 39,
    yearlyPrice: 418, // 34.83€/mois
  },
  premium: {
    id: 'premium',
    name: 'PREMIUM',
    monthlyPrice: 79,
    yearlyPrice: 690, // 57.5€/mois
  },
};

