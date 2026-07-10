import api from '../lib/axios';

export interface ProductCustomization {
  id: number;
  product_id: number;
  customizations: Record<string, {
    isMultiSelect: boolean;
    options: {
      name: string;
      price?: number;
      label?: string;
    }[];
  }>;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  is_available: boolean;
  preparation_time: number;
  customizations: ProductCustomization[];
  created_at: string;
  updated_at: string;
}

export const getProducts = async (categoryId?: string): Promise<Product[] | null> => {
  try {
    const { data } = await api.get('/products', {
      params: categoryId ? { category_id: categoryId } : undefined,
    });
    return data.data;
  } catch (error) {
    console.warn('Error fetching products:', error);
    return null;
  }
};

export const getProductById = async (id: number): Promise<Product | null> => {
  try {
    const { data } = await api.get(`/products/${id}`);
    return data.data;
  } catch (error) {
    console.warn(`Error fetching product ${id}:`, error);
    return null;
  }
};
