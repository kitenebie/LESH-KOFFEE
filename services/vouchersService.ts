import api from '../lib/axios';

export interface Voucher {
  id: number;
  code: string;
  discount: number;
  label: string;
  type: 'percent' | 'fixed';
  is_active: boolean;
}

export interface UserVoucher {
  id: number;
  user_id: number;
  voucher_id: number;
  code: string;
  description: string;
  expires_at: string;
  is_used: boolean;
  voucher?: Voucher;
}

/**
 * Get all user vouchers (claimed)
 */
export const getVouchers = async (): Promise<UserVoucher[] | null> => {
  try {
    const { data } = await api.get('/vouchers');
    return data.data;
  } catch (error) {
    console.warn('Error fetching vouchers:', error);
    return null;
  }
};

/**
 * Get unclaimed (available) vouchers that user hasn't claimed yet
 */
export const getUnclaimedVouchers = async (): Promise<Voucher[] | null> => {
  try {
    const { data } = await api.get('/vouchers/unclaimed');
    return data.data;
  } catch (error) {
    console.warn('Error fetching unclaimed vouchers:', error);
    return null;
  }
};

/**
 * Get claimed vouchers for the user
 */
export const getClaimedVouchers = async (): Promise<UserVoucher[] | null> => {
  try {
    const { data } = await api.get('/vouchers/claimed');
    return data.data;
  } catch (error) {
    console.warn('Error fetching claimed vouchers:', error);
    return null;
  }
};

/**
 * Claim a voucher by ID
 */
export const claimVoucher = async (voucherId: number): Promise<{ success: boolean; message: string; data?: UserVoucher } | null> => {
  try {
    const { data } = await api.post(`/vouchers/${voucherId}/claim`);
    return data;
  } catch (error: any) {
    console.warn('Error claiming voucher:', error);
    if (error.response?.data) {
      return error.response.data;
    }
    return null;
  }
};
