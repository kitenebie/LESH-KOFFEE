import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Clipboard,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeIn,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { Colors } from '../../../components/UI/Colors';

interface Promo {
  id: string;
  color: string;
  heading: string;
  subheading: string;
  code: string;
  badge?: string;
  image: string;
}

interface PromoDiscountProps {
  promos: Promo[];
  onBack: () => void;
  onSendGift: () => void;
  showAlert: (title: string, message: string) => void;
}

export default function PromoDiscount({ promos, onBack, onSendGift, showAlert }: PromoDiscountProps) {
  const handleCopyCode = (code: string) => {
    Clipboard.setString(code);
    showAlert('Code Copied! 🎟️', `Promo code "${code}" has been copied to your clipboard.`);
  };

  return (
    <Animated.View entering={SlideInDown.duration(400)} style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary.default} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promos & Discounts</Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      <FlatList
        data={promos}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listBody}
        renderItem={({ item, index }) => {
          const isGiftCard = item.id === 'pr3';

          return (
            <Animated.View
              entering={
                index % 2 === 0
                  ? SlideInLeft.delay(300 + index * 100).duration(400)
                  : SlideInRight.delay(300 + index * 100).duration(400)
              }
            >
            <View style={[styles.promoCardContainer, { backgroundColor: item.color }]}>
              {/* Left Side */}
              <View style={styles.promoCardLeft}>
                <View>
                  {/* Float Badge */}
                  {item.badge && (
                    <View style={styles.promoFloatBadge}>
                      <Text style={styles.promoFloatBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <Text style={styles.promoCardHeading}>{item.heading}</Text>
                  <Text style={styles.promoCardSubheading}>{item.subheading}</Text>
                </View>

                {/* Action/Code Row */}
                <View style={styles.promoCardActionRow}>
                  {isGiftCard ? (
                    <TouchableOpacity
                      style={styles.promoPillButton}
                      onPress={onSendGift}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.promoPillBtnText}>Send Gift Card</Text>
                      <Ionicons name="gift-outline" size={13} color="#FFF" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.promoPill}
                      onPress={() => handleCopyCode(item.code)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.promoPillLabel}>
                        <Text style={styles.promoPillLabelText}>tap to copy</Text>
                      </View>
                      <View style={styles.promoPillValue}>
                        <Text style={styles.promoPillValueText}>{item.code}</Text>
                        <Ionicons name="copy-outline" size={10} color={item.color} style={{ marginLeft: 4 }} />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.promoCardFootnote}>Terms & Conditions apply. Valid for a limited time.</Text>
              </View>

              {/* Right Side (Image + Diagonal cut shape) */}
              <View style={styles.promoCardRight}>
                {/* Background Cut Shape */}
                <View style={styles.promoImageBgShape} />
                
                {/* Product Image */}
                <Image source={{ uri: item.image }} style={styles.promoProductImage} resizeMode="cover" />
              </View>
            </View>
            </Animated.View>
          );
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F0E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.primary.default,
  },
  listBody: {
    padding: 24,
    paddingBottom: 40,
  },
  promoCardContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: Colors.primary.default,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  promoCardLeft: {
    flex: 1.2,
    padding: 16,
    justifyContent: 'space-between',
  },
  promoFloatBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  promoFloatBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#FFF',
    textTransform: 'uppercase',
  },
  promoCardHeading: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFF',
    lineHeight: 26,
  },
  promoCardSubheading: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 2,
  },
  promoCardActionRow: {
    marginVertical: 10,
  },
  promoPill: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#FAF9F5',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  promoPillLabel: {
    backgroundColor: 'rgba(74, 53, 37, 0.08)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  promoPillLabelText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 7.5,
    color: '#7C7C7C',
    textTransform: 'uppercase',
  },
  promoPillValue: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  promoPillValueText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: Colors.primary.default,
  },
  promoPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.default,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  promoPillBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11.5,
    color: '#FFF',
  },
  promoCardFootnote: {
    fontFamily: 'Poppins',
    fontSize: 8.5,
    color: '#FFF',
    opacity: 0.7,
  },
  promoCardRight: {
    flex: 0.8,
    position: 'relative',
    overflow: 'hidden',
  },
  promoImageBgShape: {
    position: 'absolute',
    left: -40,
    top: -50,
    width: 150,
    height: 300,
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [{ rotate: '15deg' }],
  },
  promoProductImage: {
    width: '100%',
    height: '100%',
  },
});
