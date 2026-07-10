import api from '../lib/axios';

export interface CheckoutRequest {
  amount: number;
  description?: string;
  email?: string;
  contact?: string;
  name?: string;
  order_id?: string;
  channels?: string[];
}

export interface CheckoutResponse {
  checkout_url: string;
  req_id: string;
  order_id: string;
  amount: number;
  channels: string[];
  expires_in_minutes: number;
}

export interface PaymentStatus {
  req_id: string;
  status: 'pending' | 'paid' | 'expired' | 'failed';
}

/**
 * Generate a BUX.ph checkout link for payment
 */
export const createCheckout = async (data: CheckoutRequest): Promise<{ success: boolean; data?: CheckoutResponse; message?: string }> => {
  try {
    const response = await api.post('/payments/checkout', data);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Failed to generate payment link.';
    console.error('Error creating checkout:', error);
    return { success: false, message };
  }
};

/**
 * Check payment status by request ID
 */
export const getPaymentStatus = async (reqId: string): Promise<PaymentStatus | null> => {
  try {
    const { data } = await api.get(`/payments/status/${reqId}`);
    return data.data;
  } catch (error) {
    console.error('Error checking payment status:', error);
    return null;
  }
};
