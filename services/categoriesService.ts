import api from '../lib/axios';

export interface Category {
  id: number;
  name: string;
  description: string;
  image: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const getCategories = async (): Promise<Category[] | null> => {
  try {
    const { data } = await api.get('/categories');
    return data.data;
  } catch (error) {
    console.warn('Error fetching categories:', error);
    return null;
  }
};
