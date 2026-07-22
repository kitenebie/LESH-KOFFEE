import api from '../lib/axios';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customizations: Record<string, string | string[]>;
  notes: string;
}

export interface Order {
  id: number;
  user_id: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  payment_method: string;
  delivery_address: string;
  notes: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrdersResponse {
  active: Order[];
  past: Order[];
}

export interface CreateOrderData {
  order_number?: string;
  fulfillment?: string;
  table_no?: string;
  cashier?: string;
  subtotal?: number;
  delivery_fee?: number;
  discount?: number;
  total?: number;
  items: {
    product_id: number;
    name?: string;
    quantity: number;
    price?: number;
    customization?: any;
    customizations?: Record<string, string | string[]>;
    notes?: string;
  }[];
  payment_method?: string;
  delivery_address?: string;
  notes?: string;
}

export const getOrders = async (): Promise<OrdersResponse | null> => {
  try {
    const { data } = await api.get('/orders');
    return data.data;
  } catch (error) {
    console.warn('Error fetching orders:', error);
    return null;
  }
};

export const createOrder = async (orderData: CreateOrderData): Promise<Order | null> => {
  try {
    const { data } = await api.post('/orders', orderData);
    return data.data;
  } catch (error) {
    console.warn('Error creating order:', error);
    return null;
  }
};

/**
 * Mark an order as paid (called when online payment WebView returns success).
 */
export const markOrderPaid = async (orderNumber: string): Promise<boolean> => {
  try {
    await api.post(`/orders/${orderNumber}/mark-paid`);
    return true;
  } catch (error) {
    console.warn('[ordersService] Error marking order paid:', error);
    return false;
  }
};
