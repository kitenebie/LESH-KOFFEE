import api from '../lib/axios';

export interface LoyaltyTransaction {
  id: number;
  user_id: number;
  type: 'earned' | 'redeemed' | 'expired';
  points: number;
  description: string;
  order_id: number | null;
  created_at: string;
}

export const getTransactions = async (): Promise<LoyaltyTransaction[] | null> => {
  try {
    const { data } = await api.get('/loyalty/transactions');
    return data.data;
  } catch (error) {
    console.warn('Error fetching loyalty transactions:', error);
    return null;
  }
};
