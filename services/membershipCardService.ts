import api from '../lib/axios';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface MembershipCardTier {
  id: number;
  name: string;       // "Bronze", "Silver", "Gold", "Platinum", "Diamond"
  slug: string;       // "bronze", "silver", etc.
  rank: number;       // 1, 2, 3, 4, 5
  color: string;      // hex color from stamp_quota_categories (e.g., "#CD7F32")
  icon: string | null;
  reward_points: number;
}

export interface MembershipCard {
  id: number;
  card_tier: string;
  card_number: string; // XXXX-XXXX-XXXX-XXXX
  card_exp: string;    // MM/YY
  is_active: boolean;
  tier_label: string;  // "Lesh Kaffe Bronze Member"
}

export interface MembershipCardResponse {
  card: MembershipCard | null;
  tiers: MembershipCardTier[];
}

// ─── API Call ──────────────────────────────────────────────────────────────────

/**
 * GET /api/membership-card
 * 
 * Returns the user's current membership card (tier, number, exp)
 * and all available tier colors from stamp_quota_categories.
 */
export const getMembershipCard = async (): Promise<MembershipCardResponse | null> => {
  try {
    const { data } = await api.get('/membership-card');
    return data.data;
  } catch (error) {
    console.warn('Error fetching membership card:', error);
    return null;
  }
};
