import api from '../lib/axios';

export interface SpotlightCustomer {
  id: number;
  name: string;
  avatar: string;
  review: string;
  rating: number;
}

export interface Store {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  image: string;
  logo: string;
  operating_hours: {
    day: string;
    open: string;
    close: string;
    is_closed: boolean;
  }[];
  is_open: boolean;
  rating: number;
  total_reviews: number;
  spotlight_customers: SpotlightCustomer[];
  created_at: string;
  updated_at: string;
}

export const getStore = async (): Promise<Store | null> => {
  try {
    const { data } = await api.get('/store');
    return data.data;
  } catch (error) {
    console.warn('Error fetching store:', error);
    return null;
  }
};
