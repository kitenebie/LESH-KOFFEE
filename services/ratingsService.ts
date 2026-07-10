import api from '../lib/axios';

export interface RatingItem {
  product_id: number;
  rating: number;
  comment?: string;
}

export interface RateOrderData {
  order_id: string; // order_number e.g. "LK-90214"
  rating: number;   // 1-5
  comment?: string;
}

export interface SubmitRatingData {
  order_id: number;
  ratings: RatingItem[];
}

export interface ProductRating {
  id: number;
  user_id: number;
  product_id: number;
  order_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    avatar: string | null;
  };
}

export const rateOrder = async (data: RateOrderData): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post('/ratings/order', data);
    return { success: true, message: response.data.message || 'Rating submitted successfully.' };
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Failed to submit rating.';
    return { success: false, message };
  }
};

export const submitRatings = async (data: SubmitRatingData): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post('/ratings', data);
    return { success: true, message: response.data.message || 'Rating submitted successfully.' };
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Failed to submit rating.';
    return { success: false, message };
  }
};

export const getProductRatings = async (productId: number): Promise<ProductRating[]> => {
  try {
    const { data } = await api.get(`/ratings/product/${productId}`);
    return data.data || [];
  } catch (error) {
    console.warn('Error fetching product ratings:', error);
    return [];
  }
};

export const getOrderRatings = async (orderId: number): Promise<ProductRating[]> => {
  try {
    const { data } = await api.get(`/ratings/order/${orderId}`);
    return data.data || [];
  } catch (error) {
    console.warn('Error fetching order ratings:', error);
    return [];
  }
};
