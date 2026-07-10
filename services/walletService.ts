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

/**
 * GET /api/wallet
 * Fetch wallet balance and transaction history.
 * Requires authentication (Bearer token).
 */
export const getWallet = async (): Promise<LeshWallet | null> => {
  try {
    const { data } = await api.get('/wallet');
    return data.data;
  } catch (error) {
    console.warn('Error fetching wallet:', error);
    return null;
  }
};

/**
 * POST /api/wallet/debit
 * Debit from wallet for a purchase.
 * Requires authentication (Bearer token).
 */
export const debit = async (amount: number, description: string): Promise<{ balance: number; transaction: WalletTransaction } | null> => {
  try {
    const { data } = await api.post('/wallet/debit', { amount, description });
    return data.data;
  } catch (error) {
    console.warn('Error debiting wallet:', error);
    return null;
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// NOTE: topUp() has been REMOVED.
//
// Wallet top-ups are now handled exclusively through the BUX.ph payment flow:
// 1. App calls POST /api/payments/checkout with param1 = "TOPUP-{userId}-{amount}"
// 2. User completes payment on BUX.ph
// 3. BUX.ph webhook notifies the server
// 4. Server credits the wallet (verified + idempotent)
//
// Use paymentService.ts to initiate a top-up checkout instead.
// ──────────────────────────────────────────────────────────────────────────────
