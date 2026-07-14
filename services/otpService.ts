import api from '../lib/axios';

export interface OtpSendResponse {
  success: boolean;
  message: string;
  data?: {
    expires_in: number; // seconds
    resend_cooldown: number; // seconds
  };
}

export interface OtpVerifyResponse {
  success: boolean;
  message: string;
}

/**
 * Send OTP to the given phone number.
 */
export const sendOtp = async (phone: string): Promise<OtpSendResponse> => {
  try {
    const { data } = await api.post('/otp/send', { phone });
    return data;
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Failed to send verification code.';
    return { success: false, message };
  }
};

/**
 * Verify OTP code for a phone number.
 */
export const verifyOtp = async (phone: string, code: string): Promise<OtpVerifyResponse> => {
  try {
    const { data } = await api.post('/otp/verify', { phone, code });
    return data;
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Verification failed.';
    return { success: false, message };
  }
};

/**
 * Resend OTP (alias for send).
 */
export const resendOtp = async (phone: string): Promise<OtpSendResponse> => {
  try {
    const { data } = await api.post('/otp/resend', { phone });
    return data;
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Failed to resend code.';
    return { success: false, message };
  }
};
