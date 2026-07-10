import api from '../lib/axios';

export interface StampHistory {
  id: number;
  achievement_id: number;
  order_id: number;
  stamped_at: string;
}

export interface StampAchievement {
  id: number;
  user_id: number;
  name: string;
  description: string;
  target_stamps: number;
  current_stamps: number;
  reward: string;
  is_completed: boolean;
  history: StampHistory[];
  created_at: string;
  updated_at: string;
}

export const getStamps = async (): Promise<StampAchievement[] | null> => {
  try {
    const { data } = await api.get('/stamps');
    return data.data;
  } catch (error) {
    console.warn('Error fetching stamps:', error);
    return null;
  }
};
