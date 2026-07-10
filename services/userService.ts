import api from '../lib/axios';

export interface UserAddress {
  id: number;
  user_id: number;
  label: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  loyalty_points: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface AddAddressData {
  label: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default?: boolean;
}

export const getProfile = async (): Promise<User | null> => {
  try {
    const { data } = await api.get('/user/profile');
    return data.data;
  } catch (error) {
    console.warn('Error fetching user profile:', error);
    return null;
  }
};

export const updateProfile = async (profileData: UpdateProfileData): Promise<User | null> => {
  try {
    const { data } = await api.put('/user/profile', profileData);
    return data.data;
  } catch (error) {
    console.warn('Error updating user profile:', error);
    return null;
  }
};

export const getAddresses = async (): Promise<UserAddress[] | null> => {
  try {
    const { data } = await api.get('/user/addresses');
    return data.data;
  } catch (error) {
    console.warn('Error fetching addresses:', error);
    return null;
  }
};

export const addAddress = async (addressData: AddAddressData): Promise<UserAddress | null> => {
  try {
    const { data } = await api.post('/user/addresses', addressData);
    return data.data;
  } catch (error) {
    console.warn('Error adding address:', error);
    return null;
  }
};

export const setDefaultAddress = async (addressId: string): Promise<any> => {
  try {
    const { data } = await api.put(`/user/addresses/${addressId}/default`);
    return data;
  } catch (error) {
    console.warn('Error setting default address:', error);
    return null;
  }
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<any> => {
  try {
    const { data } = await api.post('/user/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return data;
  } catch (error) {
    console.warn('Error changing password:', error);
    if (error && (error as any).response && (error as any).response.data) {
      return (error as any).response.data;
    }
    return { success: false, message: 'Network error or password change failed.' };
  }
};
