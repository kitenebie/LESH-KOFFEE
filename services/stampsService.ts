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

// ─── Stamp Quota (Membership Tiers) ─────────────────────────────────────────────

export interface StampQuotaRequirement {
  id: number;
  category_name: string;
  category_id: number;
  required_count: number;
  current_count: number;
  is_completed: boolean;
  points_per_stamp: number;
}

export interface StampQuotaTier {
  id: number;
  name: string;
  slug: string;
  color: string;
  rank: number;
  reward_points: number;
}

export interface StampQuotaProgress {
  tier: StampQuotaTier | null;
  requirements: StampQuotaRequirement[];
}

export const getQuotaProgress = async (): Promise<StampQuotaProgress | null> => {
  try {
    const { data } = await api.get('/stamps/quota-progress');
    return data.data;
  } catch (error) {
    console.warn('Error fetching stamp quota progress:', error);
    return null;
  }
};
