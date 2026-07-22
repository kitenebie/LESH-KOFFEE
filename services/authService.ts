import api from '../lib/axios';
import { loginUser, logoutUser, clearAuthToken, getAuthToken } from '../lib/authSession';

export interface LoginResponse {
  user: {
    id: number;
    name: string;
    first_name: string;
    email: string;
    phone: string;
    avatar: string;
    member_level: string;
    member_level_label: string;
    wallet_balance: number;
    loyalty_points: number;
    stamps_collected: number;
    stamps_required: number;
    joined_date: string;
  };
  token: string;
}

export interface RegisterData {
  name: string;
  first_name?: string;
  email: string;
  phone: string;
  password: string;
}

export const login = async (email: string, password: string): Promise<{ success: boolean; data?: LoginResponse; message?: string }> => {
  try {
    const { data } = await api.post('/auth/login', { email, password });

    // On success, save user session + token to SQLite
    if (data?.data?.user && data?.data?.token && typeof data.data.token === 'string') {
      const user = data.data.user;
      const token = data.data.token;

      await loginUser({
        id: user.id.toString(),
        name: user.name,
        firstName: user.first_name || user.name.split(' ')[0],
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar || '',
        memberLevel: user.member_level || 'Bronze',
        memberLevelLabel: user.member_level_label || 'Foam Coffee Bronze Member',
      }, token);
    }

    return { success: true, data: data.data };
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Network error. Please try again.';
    return { success: false, message };
  }
};

export const register = async (userData: RegisterData): Promise<{ success: boolean; data?: LoginResponse; message?: string }> => {
  try {
    const { data } = await api.post('/auth/register', userData);

    // On success, save user session + token to SQLite
    if (data?.data?.user && data?.data?.token) {
      const user = data.data.user;
      const token = data.data.token;

      await loginUser({
        id: user.id.toString(),
        name: user.name,
        firstName: user.first_name || user.name.split(' ')[0],
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar || '',
        memberLevel: user.member_level || 'Bronze',
        memberLevelLabel: user.member_level_label || 'Foam Coffee Bronze Member',
      }, token);
    }

    return { success: true, data: data.data };
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Registration failed. Please try again.';
    return { success: false, message };
  }
};

export const logout = async (): Promise<void> => {
  try {
    // Call server to revoke the token
    await api.post('/auth/logout');
  } catch (error) {
    // Silently fail — local logout is more important
  }

  // Always clear SQLite session + token regardless of API response
  await logoutUser();
};

/**
 * Resume session using stored token.
 * Called on app startup — if a valid token exists in SQLite, 
 * sends it to the server to validate and get fresh user data.
 * No password needed.
 */
export const resumeSession = async (): Promise<{ success: boolean; data?: LoginResponse; message?: string }> => {
  try {
    // Check if we have a stored token
    const token = await getAuthToken();
    if (!token) {
      return { success: false, message: 'No stored token.' };
    }

    // Call resume endpoint (token is auto-attached by axios interceptor)
    const { data } = await api.post('/auth/resume');

    // Update local SQLite user data with fresh server data
    if (data?.data?.user) {
      const user = data.data.user;
      await loginUser({
        id: user.id.toString(),
        name: user.name,
        firstName: user.first_name || user.name.split(' ')[0],
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar || '',
        memberLevel: user.member_level || 'Bronze',
        memberLevelLabel: user.member_level_label || 'Foam Coffee Bronze Member',
      }, token);
    }

    return { success: true, data: data.data };
  } catch (error: any) {
    // Only clear the token if it's genuinely expired/invalid (401)
    // Do NOT clear on 403 (signature issue), network error, or server error
    const status = error?.response?.status;
    if (status === 401) {
      await clearAuthToken();
      return { success: false, message: 'Token expired or invalid.' };
    }

    // For other errors (403, 500, network), keep the token — user stays logged in
    return { success: false, message: 'Session check failed. Will retry next sync.' };
  }
};
