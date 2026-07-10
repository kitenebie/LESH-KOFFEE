import api from '../lib/axios';
import { loginUser, logoutUser } from '../lib/authSession';

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

    // On success, save user session to SQLite
    if (data?.data?.user) {
      const user = data.data.user;
      await loginUser({
        id: user.id.toString(),
        name: user.name,
        firstName: user.first_name || user.name.split(' ')[0],
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar || '',
        memberLevel: user.member_level || 'Silver',
        memberLevelLabel: user.member_level_label || 'Lesh Kaffe Silver Member',
      });
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

    // On success, save user session to SQLite
    if (data?.data?.user) {
      const user = data.data.user;
      await loginUser({
        id: user.id.toString(),
        name: user.name,
        firstName: user.first_name || user.name.split(' ')[0],
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar || '',
        memberLevel: user.member_level || 'Silver',
        memberLevelLabel: user.member_level_label || 'Lesh Kaffe Silver Member',
      });
    }

    return { success: true, data: data.data };
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Registration failed. Please try again.';
    return { success: false, message };
  }
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    // Silently fail — local logout is more important
  }

  // Always clear SQLite session regardless of API response
  await logoutUser();
};
