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

interface Voucher {
  id: string | number;
  code: string;
  discount: number;
  label: string;
  type: 'percent' | 'fixed';
  min_order_amount?: number;
  max_discount?: number;
}

interface PromoDiscountProps {
  promos: Promo[];
  claimedVoucherCodes?: string[];
  vouchers?: Voucher[];
  onBack: () => void;
  onSendGift: () => void;
  showAlert: (title: string, message: string) => void;
}

export default function PromoDiscount({ promos, claimedVoucherCodes = [], vouchers = [], onBack, onSendGift, showAlert }: PromoDiscountProps) {
  const handleCopyCode = (code: string) => {
    Clipboard.setString(code);
    showAlert('Code Copied! 🎟️', `Promo code "${code}" has been copied to your clipboard.`);
  };

  // Get promo codes so we can filter out vouchers already linked to promos
  const promoCodes = promos.map(p => p.code);
  const standaloneVouchers = vouchers.filter(v => !promoCodes.includes(v.code));

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
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listBody}
        renderItem={({ item, index }) => {
          const isGiftCard = item.id === 'pr3';
          const isClaimed = claimedVoucherCodes.includes(item.code);

          // Render promo item as a perforated voucher ticket
          return (
            <Animated.View
              entering={
                index % 2 === 0
                  ? SlideInLeft.delay(300 + index * 100).duration(400)
                  : SlideInRight.delay(300 + index * 100).duration(400)
              }
            >
              <View style={styles.ticketWrapper}>
                {/* Physical Ticket Edge Cutouts (Punched Holes) */}
                <View style={styles.topCenterCutout} />
                <View style={styles.bottomCenterCutout} />
                <View style={styles.leftEdgeCutout} />
                <View style={styles.rightEdgeCutout} />

                {/* LEFT TICKET (Main Body - Cream base) */}
                <View style={styles.leftTicket}>
                  {/* Top Left Brand Logo */}
                  <View style={styles.logoBlock}>
                    <Image 
                      source={require('../../../assets/app/logo.png')} 
                      style={styles.logoImg} 
                      resizeMode="contain" 
                    />
                    <View style={styles.logoDivider} />
                    <View style={styles.logoTextContainer}>
                      <Text style={styles.logoTitle}>fōam</Text>
                      <Text style={styles.logoSubtitle}>coffee</Text>
                    </View>
                  </View>

                  {/* Sparkle details */}
                  <Ionicons name="sparkles" size={12} color="#82C1F9" style={styles.sparkleDecoration} />

                  {/* Center Content */}
                  <View style={styles.centerTextContainer}>
                    <Text style={styles.voucherMainTitle} numberOfLines={1}>
                      {isGiftCard ? "GIFT CARD" : item.heading.toUpperCase()}
                    </Text>
                    
                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Ionicons name="heart" size={8} color="#82C1F9" style={{ marginHorizontal: 6 }} />
                      <View style={styles.dividerLine} />
                    </View>
                    
                    <Text style={styles.voucherSubtitle} numberOfLines={1}>
                      {isGiftCard ? "SEND A DRINK TO A FRIEND." : item.subheading.toUpperCase()}
                    </Text>
                  </View>

                  {/* Bottom Row Details */}
                  <View style={styles.bottomDetailsRow}>
                    {/* Value Badge */}
                    <View style={styles.valueRow}>
                      <View style={styles.valueTag}>
                        <Text style={styles.valueTagText}>VALUE</Text>
                      </View>
                      <Text style={styles.valueAmountText}>
                        {isGiftCard ? "FREE" : "PROMO"}
                      </Text>
                    </View>

                    <View style={styles.bottomRowDivider} />

                    {/* Support message */}
                    <View style={styles.supportContainer}>
                      <Ionicons name="cafe" size={14} color="#3D2B1F" style={{ marginRight: 6 }} />
                      <View>
                        <Text style={styles.supportText}>THANK YOU</Text>
                        <Text style={styles.supportText}>FOR CHOOSING FOAM COFFEE!</Text>
                      </View>
                    </View>
                  </View>

                  {/* Bottom Ribbon */}
                  <View style={styles.bottomRibbon}>
                    <Text style={styles.bottomRibbonText}>❤ MADE WITH PASSION ❤</Text>
                  </View>
                </View>

                {/* Perforated vertical line */}
                <View style={styles.perforatedDivider} />

                {/* RIGHT STUB (Tear-off Ticket - Sky Blue) */}
                <View style={styles.rightTicketStub}>
                  {/* Stub Header */}
                  <View style={styles.stubHeader}>
                    <Text style={styles.stubHeaderLabel}>★ ENJOY ★</Text>
                    <Text style={styles.stubHeaderSubtitle}>Your Coffee!</Text>
                  </View>

                  {/* Circular Mascot Emblem with dashed border */}
                  <View style={styles.stubMascotEmblem}>
                    <View style={styles.stubMascotCircle}>
                      <Image 
                        source={require('../../../assets/app/logo.png')} 
                        style={styles.stubMascotImg} 
                        resizeMode="contain" 
                      />
                    </View>
                  </View>

                  {/* Expiry Details */}
                  {/* <View style={styles.stubExpiryBlock}>
                    <Text style={styles.stubExpiryLabel}>VALID UNTIL</Text>
                    <Text style={styles.stubExpiryValue}>12 / 31 / 2025</Text>
                  </View> */}

                  {/* Voucher Code Action button */}
                  <View style={styles.stubActionBlock}>
                    <Text style={styles.stubCodeLabel}>VOUCHER NO.</Text>
                    {isGiftCard ? (
                      <TouchableOpacity 
                        style={styles.stubCodePill} 
                        onPress={onSendGift}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.stubCodePillText, { fontSize: 8 }]} numberOfLines={1}>SEND GIFT</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={styles.stubCodePill} 
                        onPress={() => handleCopyCode(item.code)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.stubCodePillText} numberOfLines={1}>{item.code}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>
          );
        }}
        ListFooterComponent={standaloneVouchers.length > 0 ? () => (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.voucherSectionTitle}>Vouchers</Text>
            {standaloneVouchers.map((v, idx) => {
              const isClaimed = claimedVoucherCodes.includes(v.code);
              const discountValue = v.type === 'percent'
                ? `${(v.discount * 100).toFixed(0)}%`
                : `₱${Number(v.discount).toFixed(0)}`;

              return (
                <Animated.View
                  key={`voucher-${v.id || v.code}-${idx}`}
                  entering={
                    idx % 2 === 0
                      ? SlideInLeft.delay(300 + idx * 100).duration(400)
                      : SlideInRight.delay(300 + idx * 100).duration(400)
                  }
                >
                  <View style={styles.ticketWrapper}>
                    {/* Physical Ticket Edge Cutouts (Punched Holes) */}
                    <View style={styles.topCenterCutout} />
                    <View style={styles.bottomCenterCutout} />
                    <View style={styles.leftEdgeCutout} />
                    <View style={styles.rightEdgeCutout} />

                    {/* LEFT TICKET (Main Body - Cream base) */}
                    <View style={styles.leftTicket}>
                      {/* Top Left Brand Logo */}
                      <View style={styles.logoBlock}>
                        <Image 
                          source={require('../../../assets/app/logo.png')} 
                          style={styles.logoImg} 
                          resizeMode="contain" 
                        />
                        <View style={styles.logoDivider} />
                        <View style={styles.logoTextContainer}>
                          <Text style={styles.logoTitle}>fōam</Text>
                          <Text style={styles.logoSubtitle}>coffee</Text>
                        </View>
                      </View>

                      {/* Sparkle details */}
                      <Ionicons name="sparkles" size={12} color="#82C1F9" style={styles.sparkleDecoration} />

                      {/* Center Content */}
                      <View style={styles.centerTextContainer}>
                        <Text style={styles.voucherMainTitle} numberOfLines={1}>
                          {v.label.toUpperCase()}
                        </Text>
                        
                        <View style={styles.dividerRow}>
                          <View style={styles.dividerLine} />
                          <Ionicons name="heart" size={8} color="#82C1F9" style={{ marginHorizontal: 6 }} />
                          <View style={styles.dividerLine} />
                        </View>
                        
                        <Text style={styles.voucherSubtitle} numberOfLines={1}>
                          {v.min_order_amount ? `MINIMUM ORDER ₱${v.min_order_amount}` : "VALID ON ALL FOAM COFFEE DRINKS"}
                        </Text>
                      </View>

                      {/* Bottom Row Details */}
                      <View style={styles.bottomDetailsRow}>
                        {/* Value Badge */}
                        <View style={styles.valueRow}>
                          <View style={styles.valueTag}>
                            <Text style={styles.valueTagText}>VALUE</Text>
                          </View>
                          <Text style={styles.valueAmountText}>{discountValue}</Text>
                        </View>

                        <View style={styles.bottomRowDivider} />

                        {/* Support message */}
                        <View style={styles.supportContainer}>
                          <Ionicons name="cafe" size={14} color="#3D2B1F" style={{ marginRight: 6 }} />
                          <View>
                            <Text style={styles.supportText}>THANK YOU</Text>
                            <Text style={styles.supportText}>FOR CHOOSING FOAM COFFEE!</Text>
                          </View>
                        </View>
                      </View>

                      {/* Bottom Ribbon */}
                      <View style={styles.bottomRibbon}>
                        <Text style={styles.bottomRibbonText}>❤ MADE WITH PASSION ❤</Text>
                      </View>
                    </View>

                    {/* Perforated vertical line */}
                    <View style={styles.perforatedDivider} />

                    {/* RIGHT STUB (Tear-off Ticket - Sky Blue) */}
                    <View style={styles.rightTicketStub}>
                      {/* Stub Header */}
                      <View style={styles.stubHeader}>
                        <Text style={styles.stubHeaderLabel}>★ ENJOY ★</Text>
                        <Text style={styles.stubHeaderSubtitle}>Your Coffee!</Text>
                      </View>

                      {/* Circular Mascot Emblem with dashed border */}
                      <View style={styles.stubMascotEmblem}>
                        <View style={styles.stubMascotCircle}>
                          <Image 
                            source={require('../../../assets/app/logo.png')} 
                            style={styles.stubMascotImg} 
                            resizeMode="contain" 
                          />
                        </View>
                      </View>

                      {/* Expiry Details */}
                      <View style={styles.stubExpiryBlock}>
                        <Text style={styles.stubExpiryLabel}>VALID UNTIL</Text>
                        <Text style={styles.stubExpiryValue}>12 / 31 / 2025</Text>
                      </View>

                      {/* Voucher Code Action button */}
                      <View style={styles.stubActionBlock}>
                        <Text style={styles.stubCodeLabel}>VOUCHER NO.</Text>
                        <TouchableOpacity 
                          style={styles.stubCodePill} 
                          onPress={() => handleCopyCode(v.code)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.stubCodePillText} numberOfLines={1}>{v.code}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        ) : null}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E1EEFA', // Soft cloud blue to match app background theme
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 120, 205, 0.15)', // Blue-tinted separator line
    backgroundColor: '#FFFFFF', // White header background for clean separation
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E1EEFA', // Cloud blue back button background
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.primary.default,
  },
  listBody: {
    padding: 20,
    paddingBottom: 40,
  },
  ticketWrapper: {
    flexDirection: 'row',
    width: '100%',
    height: 190,
    borderRadius: 16,
    overflow: 'visible', // Visible overflow so punch holes aren't clipped!
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
    backgroundColor: '#FDFBF7',
    position: 'relative',
    shadowColor: Colors.primary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  // Punched circular hole styles to simulate physical ticket perforated scallops
  topCenterCutout: {
    position: 'absolute',
    top: -8,
    left: '67.5%',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E1EEFA', // Overlay matches parent screen background color
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
  },
  bottomCenterCutout: {
    position: 'absolute',
    bottom: -8,
    left: '67.5%',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E1EEFA',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
  },
  leftEdgeCutout: {
    position: 'absolute',
    top: '50%',
    left: -8,
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E1EEFA',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
  },
  rightEdgeCutout: {
    position: 'absolute',
    top: '50%',
    right: -8,
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E1EEFA',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
  },
  leftTicket: {
    flex: 2.1,
    backgroundColor: '#FDFBF7', // Cream base color
    padding: 14,
    justifyContent: 'space-between',
    position: 'relative',
    borderTopLeftRadius: 16, // Match parent corner radius
    borderBottomLeftRadius: 16,
  },
  perforatedDivider: {
    width: 0.5,
    height: '100%',
    borderColor: 'rgba(61, 43, 31, 0.2)',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  rightTicketStub: {
    flex: 1,
    backgroundColor: '#82C1F9', // Solid sky blue
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopRightRadius: 16, // Match parent corner radius
    borderBottomRightRadius: 16,
  },
  logoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImg: {
    width: 24,
    height: 24,
  },
  logoDivider: {
    width: 1.2,
    height: 18,
    backgroundColor: '#3D2B1F',
    marginHorizontal: 8,
    opacity: 0.25,
  },
  logoTextContainer: {
    justifyContent: 'center',
  },
  logoTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11.5,
    color: '#3D2B1F',
    lineHeight: 12,
    letterSpacing: 0.2,
  },
  logoSubtitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#3D2B1F',
    lineHeight: 9,
    marginTop: -1,
  },
  sparkleDecoration: {
    position: 'absolute',
    top: 24,
    right: 20,
  },
  centerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  voucherMainTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#3D2B1F', // Espresso brown text
    letterSpacing: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
    width: '80%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#82C1F9',
  },
  voucherSubtitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 7,
    color: '#3D2B1F',
    letterSpacing: 1.2,
  },
  bottomDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueTag: {
    backgroundColor: '#82C1F9', // Sky blue tag
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
    marginRight: 6,
  },
  valueTagText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 6.5,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  valueAmountText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#82C1F9',
    lineHeight: 18,
  },
  bottomRowDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#3D2B1F',
    marginHorizontal: 10,
    opacity: 0.2,
  },
  supportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  supportText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 6,
    color: '#3D2B1F',
    letterSpacing: 0.2,
    lineHeight: 7,
  },
  bottomRibbon: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: '#E6F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 14,
  },
  bottomRibbonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 6,
    color: '#82C1F9',
    letterSpacing: 1.5,
  },
  stubHeader: {
    alignItems: 'center',
  },
  stubHeaderLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 7.5,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  stubHeaderSubtitle: {
    fontFamily: 'Poppins-Bold',
    fontStyle: 'italic',
    fontSize: 9.5,
    color: '#FFFFFF',
  },
  stubMascotEmblem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stubMascotCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed', // Dashed border around circular avatar
  },
  stubMascotImg: {
    width: 32,
    height: 32,
  },
  stubExpiryBlock: {
    alignItems: 'center',
  },
  stubExpiryLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 6.5,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  stubExpiryValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginTop: -1,
  },
  stubActionBlock: {
    alignItems: 'center',
    width: '100%',
  },
  stubCodeLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 6.5,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 2,
  },
  stubCodePill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stubCodePillText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#82C1F9',
    letterSpacing: 0.5,
  },
  voucherSectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
    marginBottom: 14,
    marginTop: 6,
  },
});
