import api from '../lib/axios';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'order' | 'promo' | 'system' | 'loyalty';
  is_read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
}

export const getNotifications = async (): Promise<Notification[] | null> => {
  try {
    const { data } = await api.get('/notifications');
    return data.data;
  } catch (error) {
    console.warn('Error fetching notifications:', error);
    return null;
  }
};

export const markAsRead = async (id: number): Promise<Notification | null> => {
  try {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data.data;
  } catch (error) {
    console.warn(`Error marking notification ${id} as read:`, error);
    return null;
  }
};
