import api from '../lib/axios';

export interface ServerCartItem {
  id: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    categoryId: string;
    category: string;
    is_customizable: boolean;
  };
  quantity: number;
  customization: any;
  unit_price: number;
  line_total: number;
}

export interface CartMeta {
  fulfillment_mode: 'DineIn' | 'Delivery';
  applied_voucher_codes: string[];
  use_subscription: boolean;
  subscription_items_to_use: number;
}

export interface CartResponse {
  items: ServerCartItem[];
  meta: CartMeta;
  computed: {
    subtotal: number;
    delivery_fee: number;
    subscription_discount: number;
    subscription_items_covered: number;
    subscription_name: string | null;
    voucher_discount: number;
    applied_vouchers: any[];
    perk_discount: number;
    perks_applied: any[];
    total_discount: number;
    total: number;
    item_count: number;
  };
}

/**
 * Get user's cart from server.
 */
export const getCart = async (): Promise<CartResponse> => {
  const empty = { items: [], meta: { fulfillment_mode: 'DineIn' as const, applied_voucher_codes: [], use_subscription: false, subscription_items_to_use: 0 }, computed: { subtotal: 0, delivery_fee: 0, subscription_discount: 0, subscription_items_covered: 0, subscription_name: null, voucher_discount: 0, applied_vouchers: [], perk_discount: 0, perks_applied: [], total_discount: 0, total: 0, item_count: 0 } };
  try {
    const { data } = await api.get('/cart');
    return data.data || empty;
  } catch (error) {
    console.warn('[cartService] Error fetching cart:', error);
    return empty;
  }
};

/**
 * Add item to server cart.
 */
export const addToCart = async (productId: number, quantity: number, customization?: any): Promise<boolean> => {
  try {
    await api.post('/cart/add', {
      product_id: productId,
      quantity,
      customization: customization || null,
    });
    return true;
  } catch (error) {
    console.warn('[cartService] Error adding to cart:', error);
    return false;
  }
};

/**
 * Update item quantity.
 */
export const updateCartItem = async (cartItemId: number, quantity: number): Promise<boolean> => {
  try {
    await api.put(`/cart/${cartItemId}`, { quantity });
    return true;
  } catch (error) {
    console.warn('[cartService] Error updating cart item:', error);
    return false;
  }
};

/**
 * Remove item from cart.
 */
export const removeCartItem = async (cartItemId: number): Promise<boolean> => {
  try {
    await api.delete(`/cart/${cartItemId}`);
    return true;
  } catch (error) {
    console.warn('[cartService] Error removing cart item:', error);
    return false;
  }
};

/**
 * Clear entire cart.
 */
export const clearCart = async (): Promise<boolean> => {
  try {
    await api.delete('/cart');
    return true;
  } catch (error) {
    console.warn('[cartService] Error clearing cart:', error);
    return false;
  }
};

/**
 * Sync local cart state to server (full replace).
 * Call on login or when reconnecting after offline.
 */
export const syncCart = async (items: { product_id: number; quantity: number; customization?: any }[]): Promise<boolean> => {
  try {
    await api.post('/cart/sync', { items });
    return true;
  } catch (error) {
    console.warn('[cartService] Error syncing cart:', error);
    return false;
  }
};

/**
 * Update cart meta (fulfillment mode, subscription preference).
 */
export const updateCartMeta = async (meta: Partial<CartMeta>): Promise<boolean> => {
  try {
    await api.put('/cart/meta', meta);
    return true;
  } catch (error) {
    console.warn('[cartService] Error updating cart meta:', error);
    return false;
  }
};

/**
 * Apply voucher to cart.
 */
export const applyVoucherToCart = async (code: string): Promise<boolean> => {
  try {
    await api.post('/cart/apply-voucher', { code });
    return true;
  } catch (error) {
    console.warn('[cartService] Error applying voucher:', error);
    return false;
  }
};

/**
 * Remove voucher from cart.
 */
export const removeVoucherFromCart = async (code: string): Promise<boolean> => {
  try {
    await api.post('/cart/remove-voucher', { code });
    return true;
  } catch (error) {
    console.warn('[cartService] Error removing voucher:', error);
    return false;
  }
};

/**
 * Get cart meta only.
 */
export const getCartMeta = async (): Promise<CartMeta> => {
  try {
    const { data } = await api.get('/cart/meta');
    return data.data;
  } catch (error) {
    console.warn('[cartService] Error getting cart meta:', error);
    return { fulfillment_mode: 'DineIn', applied_voucher_codes: [], use_subscription: false, subscription_items_to_use: 0 };
  }
};
