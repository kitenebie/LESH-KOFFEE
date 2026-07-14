import api from '../lib/axios';

export interface Subscription {
  id: number;
  user_id: number;
  plan_name: string;
  description: string;
  price: number;
  billing_cycle: 'weekly' | 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired' | 'paused';
  benefits: string[];
  starts_at: string;
  expires_at: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export const getSubscriptions = async (): Promise<Subscription[] | null> => {
  try {
    const { data } = await api.get('/subscriptions');
    return data.data;
  } catch (error) {
    console.warn('Error fetching subscriptions:', error);
    return null;
  }
};

export interface PerkDescription {
  perk_id: number;
  category_id: number;
  category_name: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_discount: number | null;
  description: string;
}

export interface PerkCalculation {
  total_discount: number;
  perks_applied: {
    perk_id: number;
    category_name: string;
    discount_type: string;
    discount_value: number;
    max_discount: number | null;
    applied_discount: number;
  }[];
}

export const getSubscriptionPerks = async (subscriptionId: number): Promise<PerkDescription[]> => {
  try {
    const { data } = await api.get(`/subscriptions/${subscriptionId}/perks`);
    return data.data || [];
  } catch (error) {
    console.warn('Error fetching subscription perks:', error);
    return [];
  }
};

export const calculatePerkDiscount = async (items: { product_id: number; quantity: number; price: number }[]): Promise<PerkCalculation> => {
  try {
    const { data } = await api.post('/subscriptions/calculate-perks', { items });
    return data.data || { total_discount: 0, perks_applied: [] };
  } catch (error) {
    console.warn('Error calculating perk discount:', error);
    return { total_discount: 0, perks_applied: [] };
  }
};
