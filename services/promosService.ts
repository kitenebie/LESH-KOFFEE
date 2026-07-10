import api from '../lib/axios';

export interface Promo {
  id: number;
  title: string;
  description: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  image: string;
  is_active: boolean;
  starts_at: string;
  expires_at: string;
  created_at: string;
}

export const getPromos = async (): Promise<Promo[] | null> => {
  try {
    const { data } = await api.get('/promos');
    return data.data;
  } catch (error) {
    console.warn('Error fetching promos:', error);
    return null;
  }
};
