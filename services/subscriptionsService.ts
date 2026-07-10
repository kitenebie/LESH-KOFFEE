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
