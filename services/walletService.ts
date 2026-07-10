import api from '../lib/axios';

export interface WalletTransaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  transaction_date: string;
  created_at: string;
}

export interface LeshWallet {
  id: number;
  user_id: number;
  balance: number;
  currency: string;
  is_active: boolean;
  transactions: WalletTransaction[];
}

export const getWallet = async (): Promise<LeshWallet | null> => {
  try {
    const { data } = await api.get('/wallet');
    return data.data;
  } catch (error) {
    console.warn('Error fetching wallet:', error);
    return null;
  }
};

export const topUp = async (amount: number, description?: string): Promise<{ balance: number; transaction: WalletTransaction } | null> => {
  try {
    const { data } = await api.post('/wallet/topup', { amount, description });
    return data.data;
  } catch (error) {
    console.warn('Error topping up wallet:', error);
    return null;
  }
};

export const debit = async (amount: number, description: string): Promise<{ balance: number; transaction: WalletTransaction } | null> => {
  try {
    const { data } = await api.post('/wallet/debit', { amount, description });
    return data.data;
  } catch (error) {
    console.warn('Error debiting wallet:', error);
    return null;
  }
};
