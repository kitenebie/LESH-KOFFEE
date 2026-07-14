import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../../../components/UI/Colors';

interface SubscriptionProps {
  activeSubscription: string | null;
  subscriptionBalance: number;
  onBuySubscription: (name: string, price: number, drinks: number, subscriptionId?: number) => void;
  onUseGiftCard?: (planId: number, planName: string) => void;
  plans?: any[];
}

const CARD_COLORS = ['#5B8A72', '#C67B5C', '#6B5CA5', '#4A7C9B'];

const FALLBACK_PLANS = [
  {
    id: '1',
    name: 'Daily Grind Basic',
    items_per_week: 5,
    items_limit: 20,
    price: 399,
    icon: 'cafe-outline',
    description: '5 Iced Americanos per week',
    perks: [],
  },
  {
    id: '2',
    name: 'Daily Grind Plus',
    items_per_week: 7,
    items_limit: 28,
    price: 599,
    icon: 'sparkles-outline',
    description: '7 any drinks per week + 10% food discount',
    perks: [{ discount_type: 'percent', discount_value: 10, category_name: 'Foods' }],
  },
];

export default function Subscription({
  activeSubscription,
  subscriptionBalance,
  onBuySubscription,
  onUseGiftCard,
  plans = [],
}: SubscriptionProps) {
  // Use API plans if available, otherwise fallback
  const displayPlans = plans.length > 0 ? plans : FALLBACK_PLANS;

  // Debug: log what we're rendering
  if (__DEV__) {
    console.log('[Subscription] plans.length:', plans.length, 'displayPlans.length:', displayPlans.length);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prepaid Subscriptions</Text>
      <Text style={styles.desc}>Buy monthly packages upfront to lock in discounts!</Text>

      {activeSubscription && (
        <View style={styles.activeIndicator}>
          <Ionicons name="checkmark-circle" size={18} color="#FAF9F5" style={{ marginRight: 6 }} />
          <Text style={styles.activeIndicatorText}>
            Active: {activeSubscription} ({subscriptionBalance} item{subscriptionBalance !== 1 ? 's' : ''} available)
          </Text>
        </View>
      )}

      {/* Subscription Cards */}
      {displayPlans.map((plan, idx) => {
        const isActive = activeSubscription === plan.name;
        const color = CARD_COLORS[idx % CARD_COLORS.length];
        const planIcon = plan.icon || 'cafe-outline';

        return (
          <View key={plan.id} style={[styles.card, { backgroundColor: color }]}>
            {/* Active badge */}
            {isActive && (
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={10} color="#FFF" />
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}

            <View style={styles.cardContent}>
              {/* Left: Info */}
              <View style={styles.cardLeft}>
                <Text style={styles.cardName}>{plan.name}</Text>
                <Text style={styles.cardDescription}>{plan.description}</Text>
                {/* Perks display */}
                {plan.perks && plan.perks.length > 0 && (
                  <View style={styles.perksList}>
                    {plan.perks.map((perk: any, pIdx: number) => (
                      <View key={pIdx} style={styles.perkPill}>
                        <Ionicons name="gift-outline" size={10} color="#FFF" />
                        <Text style={styles.perkText}>
                          {perk.discount_type === 'percent' ? `${perk.discount_value}%` : `₱${perk.discount_value}`} {perk.category_name} discount
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Right: Price + Button */}
              <View style={styles.cardRight}>
                <View style={styles.cardIconCircle}>
                  <Ionicons name={planIcon as any} size={22} color="#FFF" />
                </View>
                <Text style={styles.cardPrice}>₱{Number(plan.price).toLocaleString()}</Text>
                {!isActive && (
                  <TouchableOpacity
                    style={[styles.buyBtn, isActive && styles.buyBtnActive]}
                    onPress={() => {
                      if (isActive && onUseGiftCard) {
                        onUseGiftCard(Number(plan.id), plan.name);
                      } else if (!isActive) {
                        onBuySubscription(plan.name, Number(plan.price), Number(plan.items_limit), Number(plan.id));
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.buyBtnText, isActive && styles.buyBtnActiveText]}>
                      {/* {isActive ? 'Use My Gift Card' : 'Subscribe'} */}
                      Subscribe
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Decorative shape */}
            <View style={styles.cardShape} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
    marginBottom: 2,
  },
  desc: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray600,
    marginBottom: 14,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary.default,
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  activeIndicatorText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FAF9F5',
  },

  // Cards
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.85)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    zIndex: 10,
  },
  activeBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#FFF',
    marginLeft: 3,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
    paddingRight: 12,
  },
  cardName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFF',
    marginBottom: 2,
  },
  cardDescription: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 8,
  },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  savingsText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#FFF',
  },
  cardRight: {
    alignItems: 'center',
  },
  perksList: {
    marginTop: 8,
    gap: 4,
  },
  perkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  perkText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 9,
    color: '#FFF',
  },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFF',
    marginBottom: 6,
  },
  buyBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  buyBtnActive: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buyBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: Colors.primary.default,
  },
  buyBtnActiveText: {
    color: '#FFFFFF',
  },
  cardShape: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
