import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Button } from '../../../components/UI/Button';
import { Colors } from '../../../components/UI/Colors';

import { useAppData } from '../../../lib/useAppData';
import { claimVoucherByCode } from '../../../services/vouchersService';


interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  reviews: number;
  isPopular: boolean;
  image: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  customization?: {
    size: string;
    sweetness?: string;
    milk?: string;
    addons: string[];
    price: number;
    selections?: Record<string, string[]>;
  };
}

interface CartViewProps {
  cart: CartItem[];
  fulfillmentMode: 'DineIn' | 'Delivery';
  setFulfillmentMode: (mode: 'DineIn' | 'Delivery') => void;
  paymentMethod: 'Wallet' | 'CardEWallet' | 'COD';
  setPaymentMethod: (method: 'Wallet' | 'CardEWallet' | 'COD') => void;
  walletBalance: number;
  subscriptionBalance: number;
  cartTotal: number;
  grandTotal: number;
  subscriptionDiscount: number;
  voucherDiscount: number;
  perkDiscount?: number;
  perksApplied?: any[];
  appliedVouchers: { code: string; discount: number; label: string; type?: string; max_discount?: number; min_order_amount?: number | null }[];
  setAppliedVouchers: (v: any) => void;
  voucherCode: string;
  setVoucherCode: (code: string) => void;
  voucherStatus: 'idle' | 'valid' | 'invalid';
  setVoucherStatus: (status: 'idle' | 'valid' | 'invalid') => void;
  handleCheckoutClick: () => void;
  handleIncrementQty: (index: number) => void;
  handleDecrementQty: (index: number) => void;
  onBack?: () => void;
  onRedirectToAddresses?: () => void;
}

export default function CartView({
  cart,
  fulfillmentMode,
  setFulfillmentMode,
  paymentMethod,
  setPaymentMethod,
  walletBalance,
  subscriptionBalance,
  cartTotal,
  grandTotal,
  subscriptionDiscount,
  voucherDiscount,
  perkDiscount = 0,
  perksApplied = [],
  appliedVouchers,
  setAppliedVouchers,
  voucherCode,
  setVoucherCode,
  voucherStatus,
  setVoucherStatus,
  handleCheckoutClick,
  handleIncrementQty,
  handleDecrementQty,
  onBack,
  onRedirectToAddresses
}: CartViewProps) {
  const { data: dummyData } = useAppData();

  const [showVoucherPicker, setShowVoucherPicker] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const VALID_VOUCHERS = Object.fromEntries(
    dummyData.vouchers.map((v) => [v.code, { discount: v.discount, label: v.label }])
  );

  const handleApplyVoucher = () => {
    const trimmed = voucherCode.trim().toUpperCase();
    if (VALID_VOUCHERS[trimmed]) {
      // Don't add duplicate
      if (appliedVouchers.some(v => v.code === trimmed)) return;

      setAppliedVouchers([...appliedVouchers, {
        code: trimmed,
        discount: VALID_VOUCHERS[trimmed].discount,
        label: VALID_VOUCHERS[trimmed].label
      }]);
      setVoucherStatus('valid');
      setVoucherCode('');
    } else {
      setVoucherStatus('invalid');
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode('');
    setVoucherStatus('idle');
    setAppliedVouchers([]);
  };

  // Toggle a voucher card selection (multi-select)
  const toggleVoucherSelection = (voucher: { code: string; discount: number; label: string; type?: string; max_discount?: number; min_order_amount?: number | null }) => {
    const isSelected = appliedVouchers.some(v => v.code === voucher.code);
    if (isSelected) {
      setAppliedVouchers(appliedVouchers.filter(v => v.code !== voucher.code));
    } else {
      setAppliedVouchers([...appliedVouchers, voucher]);
    }
  };

  // Redeem voucher by code → claim on server + apply locally
  const handleRedeemCode = async () => {
    const code = redeemCode.trim().toUpperCase();
    if (!code) return;

    setRedeemLoading(true);
    const result = await claimVoucherByCode(code);
    setRedeemLoading(false);

    if (result.success && result.voucher) {
      // Auto-apply the claimed voucher
      const v = result.voucher;
      if (!appliedVouchers.some(av => av.code === v.code)) {
        setAppliedVouchers([...appliedVouchers, { code: v.code, discount: v.discount, label: v.label }]);
      }
      setRedeemCode('');
      Alert.alert('Voucher Claimed! 🎟️', result.message);
    } else {
      Alert.alert('Invalid Code', result.message);
    }
  };

  return (
    <View style={styles.tabViewContainer}>
      {onBack ? (
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={Colors.primary.default} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 32 }} />{/* Balancer */}
        </View>
      ) : (
        <Text style={styles.tabTitle}>Your Cart</Text>
      )}

      {cart.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cart-outline" size={64} color={Colors.neutral.gray400} />
          <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCartSubtitle}>Add some delicious coffee to get started!</Text>
          <Button
            title="Explore Menu"
            variant="primary"
            onPress={onBack}
            style={styles.exploreBtn}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Interactive Fulfillment Address/Table Box */}
          {fulfillmentMode === 'Delivery' && (
            <TouchableOpacity
              style={styles.addressDisplayCard}
              onPress={() => {
                if (onRedirectToAddresses) {
                  onRedirectToAddresses();
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.addressDisplayHeader}>
                <Ionicons 
                  name="location" 
                  size={15} 
                  color={Colors.secondary.default} 
                />
                <Text style={styles.addressDisplayTitle}>Delivery Address</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.neutral.gray500} style={{ marginLeft: 'auto' }} />
              </View>
              <Text style={styles.addressDisplayText} numberOfLines={2}>
                {dummyData.user.addresses?.find((addr: any) => addr.isDefault)?.address || 'Manila Gate Road, Manila, Philippines'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Fulfillment Mode Selectors */}
          <View style={styles.fulfillmentSection}>
            <Text style={styles.fulfillmentTitle}>Fulfillment Method</Text>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <TouchableOpacity 
                style={[styles.fulfillmentBtn, fulfillmentMode === 'DineIn' && styles.fulfillmentBtnActive]}
                onPress={() => setFulfillmentMode('DineIn')}
              >
                <Ionicons name="restaurant-outline" size={14} color={fulfillmentMode === 'DineIn' ? '#FFF' : Colors.primary.default} />
                <Text style={[styles.fulfillmentText, fulfillmentMode === 'DineIn' && styles.fulfillmentTextActive]}>Dine In</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.fulfillmentBtn, fulfillmentMode === 'Delivery' && styles.fulfillmentBtnActive]}
                onPress={() => setFulfillmentMode('Delivery')}
              >
                <Ionicons name="bicycle-outline" size={14} color={fulfillmentMode === 'Delivery' ? '#FFF' : Colors.primary.default} />
                <Text style={[styles.fulfillmentText, fulfillmentMode === 'Delivery' && styles.fulfillmentTextActive]}>Delivery</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cart Items List */}
          <FlatList
            data={cart}
            keyExtractor={(_, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View style={styles.cartItemRow}>
                <Image source={{ uri: item.product.image }} style={styles.productImage} />
                <View style={styles.itemInfo}>
                  <Text style={styles.productName}>{item.product.name}</Text>
                  
                  {/* Customizations details */}
                  {item.customization && (
                    <View style={{ marginTop: 2 }}>
                      {(() => {
                        let details: string[] = [];
                        let addons: { name: string; price: number }[] = [];

                        const config = (dummyData as any).customizationOptions?.[item.product.id];
                        const dynamicConfig = config?.customizations || config;

                        if (item.customization.selections) {
                          Object.entries(item.customization.selections).forEach(([key, val]: [string, any]) => {
                            if (!val || val.length === 0) return;
                            const label = key.charAt(0).toUpperCase() + key.slice(1);
                            const fieldConfig = dynamicConfig?.[key];

                            if (key.toLowerCase() === 'addons' || key.toLowerCase() === 'add-ons') {
                              const list = Array.isArray(val) ? val : [val];
                              list.forEach((selName) => {
                                const optionObj = fieldConfig?.options?.find((o: any) => o.name === selName);
                                const price = optionObj?.price ? Number(optionObj.price) : 0;
                                addons.push({ name: selName, price });
                              });
                            } else {
                              const formattedValues = (Array.isArray(val) ? val : [val]).map((selName) => {
                                const optionObj = fieldConfig?.options?.find((o: any) => o.name === selName);
                                const price = optionObj?.price ? Number(optionObj.price) : 0;
                                return price > 0 ? `${selName} (+₱${price})` : selName;
                              }).join(', ');
                              details.push(`${label}: ${formattedValues}`);
                            }
                          });
                        } else {
                          if (item.customization.size) details.push(item.customization.size);
                          if (item.customization.sweetness) details.push(`${item.customization.sweetness} Sugar`);
                          if (item.customization.milk) details.push(item.customization.milk);
                          
                          if (item.customization.addons && item.customization.addons.length > 0) {
                            const addonsConfig = dynamicConfig?.['addons'] || dynamicConfig?.['Add-ons'];
                            item.customization.addons.forEach((addonName) => {
                              const optionObj = addonsConfig?.options?.find((o: any) => o.name.toLowerCase() === addonName.toLowerCase());
                              const price = optionObj?.price ? Number(optionObj.price) : 0;
                              addons.push({ name: addonName, price });
                            });
                          }
                        }

                        return (
                          <>
                            {details.length > 0 && (
                              <Text style={styles.customizationDetails}>
                                {details.join(' • ')}
                              </Text>
                            )}
                            {addons.length > 0 && (
                              <View style={{ marginTop: 2 }}>
                                <Text style={[styles.customizationDetails, { fontFamily: 'Poppins-Bold' }]}>
                                  addons:
                                </Text>
                                {addons.map((addon, idx) => (
                                  <Text key={idx} style={[styles.customizationDetails, { marginLeft: 4 }]}>
                                    {addon.name} - PHP{addon.price.toFixed(2)}
                                  </Text>
                                ))}
                              </View>
                            )}
                          </>
                        );
                      })()}
                    </View>
                  )}
                  
                  <Text style={styles.productPrice}>
                    ₱{(item.product.price * item.quantity).toFixed(2)}
                  </Text>
                </View>

                {/* Quantity Controls */}
                <View style={styles.quantityContainer}>
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => handleDecrementQty(index)}
                  >
                    <Ionicons name="remove" size={14} color={Colors.primary.default} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => handleIncrementQty(index)}
                  >
                    <Ionicons name="add" size={14} color={Colors.primary.default} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          {/* Voucher Code Input */}
          <View style={styles.voucherSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.voucherTitle}>Voucher</Text>
              <TouchableOpacity
                style={styles.voucherLinkBtn}
                onPress={() => setShowVoucherPicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="pricetag-outline" size={14} color={Colors.secondary.default} style={{ marginRight: 4 }} />
                <Text style={styles.voucherLinkText}>
                  {appliedVouchers.length > 0 ? `${appliedVouchers.length} Applied` : 'Select Vouchers'}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.secondary.default} />
              </TouchableOpacity>
            </View>

            {/* Show applied vouchers as pills */}
            {appliedVouchers.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {appliedVouchers.map((v) => (
                  <View key={v.code} style={styles.voucherAppliedPill}>
                    <Text style={styles.voucherAppliedPillText}>{v.label}</Text>
                    <TouchableOpacity onPress={() => toggleVoucherSelection(v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={14} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View> 
            )}
          </View>

          {/* Checkout Info & Summary Block */}
          <View style={styles.cartSummary}>
            {/* Prepaid drink deduction banner if active */}
            {subscriptionBalance > 0 && (
              <View style={styles.subActiveAlert}>
                <Ionicons name="sparkles" size={16} color="#FAF9F5" style={{ marginRight: 6 }} />
                <Text style={styles.subActiveAlertText}>
                  Your package subscription discount covers eligible coffee items automatically.
                </Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryVal}>₱{cartTotal.toFixed(2)}</Text>
            </View>

            {fulfillmentMode === 'Delivery' && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryVal}>₱49.00</Text>
              </View>
            )}

            {subscriptionDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subscription Discount</Text>
                <Text style={[styles.summaryVal, { color: '#4CAF50' }]}>-₱{subscriptionDiscount.toFixed(2)}</Text>
              </View>
            )}

            {perkDiscount > 0 && perksApplied.length > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {perksApplied.map(p => `${p.discount_type === 'percent' ? p.discount_value + '%' : '₱' + p.discount_value} ${p.category_name}`).join(', ')}
                </Text>
                <Text style={[styles.summaryVal, { color: '#4CAF50' }]}>-₱{perkDiscount.toFixed(2)}</Text>
              </View>
            )}

            {appliedVouchers.length > 0 && voucherDiscount > 0 && (
              <>
                {appliedVouchers.map((v) => {
                  const minReq = v.min_order_amount ? Number(v.min_order_amount) : 0;
                  const meetsMin = minReq <= 0 || cartTotal >= minReq;
                  const canApplyFixed = v.type !== 'fixed' || cartTotal >= v.discount;
                  const applicable = meetsMin && canApplyFixed;
                  const discountAmt = applicable
                    ? (v.type === 'fixed' ? v.discount : Math.min(v.discount * cartTotal, v.max_discount || Infinity))
                    : 0;
                  return (
                    <View key={v.code} style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Voucher ({v.code})</Text>
                      <Text style={[styles.summaryVal, { color: applicable ? '#4CAF50' : Colors.neutral.gray400 }]}>
                        {applicable ? `-₱${discountAmt.toFixed(2)}` : 'Not applicable'}
                      </Text>
                    </View>
                  );
                })}
              </>
            )}

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalVal}>₱{grandTotal.toFixed(2)}</Text>
            </View>

            {/* Payment Method Selector */}
              <View style={styles.paymentSection}>
                <Text style={styles.paymentTitle}>Payment Method</Text>
                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                  {[
                    { key: 'Wallet', label: 'LESH Wallet', icon: 'wallet-outline' as const },
                    { key: 'COD', label: fulfillmentMode === 'DineIn' ? 'Cash' : 'COD', icon: 'cash-outline' as const },
                    { key: 'CardEWallet', label: 'Card & E-wallet', icon: 'card-outline' as const }
                  ].map((method) => (
                    <TouchableOpacity 
                      key={method.key}
                      style={[styles.paymentBtn, paymentMethod === method.key && styles.paymentBtnActive]}
                      onPress={() => setPaymentMethod(method.key as any)}
                    >
                      <Ionicons 
                        name={method.icon} 
                        size={12} 
                        color={paymentMethod === method.key ? '#FAF9F5' : Colors.primary.default} 
                      />
                      <Text style={[styles.paymentText, paymentMethod === method.key && styles.paymentTextActive]}>
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

            {paymentMethod === 'Wallet' && (
              <View style={styles.walletCheckoutTeaser}>
                <Ionicons name="wallet-outline" size={16} color={Colors.primary.default} style={{ marginRight: 6 }} />
                <Text style={styles.walletTeaserBalanceText}>
                  Lesh Wallet: <Text style={styles.boldWalletVal}>₱{walletBalance.toFixed(2)}</Text>
                </Text>
              </View>
            )}

            <Button
              title={
                paymentMethod === 'COD' ? "Generate Order Code" 
                : paymentMethod === 'Wallet' ? "Pay with Wallet" 
                : paymentMethod === 'CardEWallet' ? "Pay with Card / E-wallet"
                : "Place Order"
              }
              variant="secondary"
              onPress={handleCheckoutClick}
              style={styles.checkoutBtn}
            />
          </View>
        </View>
      )}

      {/* Voucher Picker Overlay */}
      <Modal visible={showVoucherPicker} animationType="slide" transparent={false}>
        <View style={styles.voucherPickerContainer}>
          <View style={styles.voucherPickerHeader}>
            <Text style={styles.voucherPickerTitle}>Select Vouchers</Text>
            <TouchableOpacity onPress={() => setShowVoucherPicker(false)} style={styles.voucherPickerCloseBtn}>
              <Ionicons name="close" size={24} color={Colors.primary.default} />
            </TouchableOpacity>
          </View>

          <Text style={styles.voucherPickerSubtitle}>
            Tap to select. You can apply multiple vouchers.
          </Text>

          {/* Redeem Voucher Code Input */}
          <View style={[styles.redeemSection, { borderTopWidth: 0, borderBottomWidth: 1, borderBottomColor: Colors.neutral.gray200, marginBottom: 16 }]}>
            <Text style={styles.redeemLabel}>Have a voucher code?</Text>
            <View style={styles.redeemRow}>
              <View style={styles.redeemInputWrap}>
                <Ionicons name="key-outline" size={14} color={Colors.neutral.gray400} style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.redeemInput}
                  placeholder="Enter code"
                  placeholderTextColor={Colors.neutral.gray400}
                  value={redeemCode}
                  onChangeText={setRedeemCode}
                  autoCapitalize="characters"
                  returnKeyType="done"
                  onSubmitEditing={handleRedeemCode}
                />
              </View>
              <TouchableOpacity
                style={[styles.redeemBtn, (!redeemCode.trim() || redeemLoading) && { opacity: 0.5 }]}
                onPress={handleRedeemCode}
                disabled={!redeemCode.trim() || redeemLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.redeemBtnText}>{redeemLoading ? '...' : 'Claim'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.voucherPickerGrid} showsVerticalScrollIndicator={false}>
            {dummyData.vouchers && dummyData.vouchers.map((v: any, idx: number) => {
              const cardColors = [Colors.secondary.default, '#5B8A72', '#C67B5C', '#6B5CA5'];
              const bgColor = cardColors[idx % cardColors.length];
              const isSelected = appliedVouchers.some(av => av.code === v.code);
              const minOrder = v.min_order_amount ? Number(v.min_order_amount) : 0;
              const meetsMinimum = minOrder <= 0 || cartTotal >= minOrder;
              // Also disable fixed-type vouchers where discount > subtotal
              const fixedExceedsSubtotal = v.type === 'fixed' && Number(v.discount) > cartTotal;
              const isDisabled = !meetsMinimum || fixedExceedsSubtotal;

              return (
                <TouchableOpacity
                  key={v.id || v.code}
                  style={[
                    styles.voucherPickerCard,
                    { backgroundColor: isDisabled ? Colors.neutral.gray300 : bgColor },
                    isSelected && styles.voucherPickerCardSelected,
                    isDisabled && { opacity: 0.6 },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => !isDisabled && toggleVoucherSelection({ code: v.code, discount: v.discount, label: v.label, type: v.type, max_discount: v.max_discount, min_order_amount: v.min_order_amount })}
                  disabled={isDisabled}
                >
                  {isSelected && (
                    <View style={styles.voucherPickerCheckmark}>
                      <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                    </View>
                  )}
                  <Text style={styles.voucherPickerCardLabel} numberOfLines={2}>{v.label}</Text>
                  {Number(v.discount) > 0 && (
                    <Text style={styles.voucherPickerCardDiscount}>
                      {v.type === 'percent' ? `${(v.discount * 100).toFixed(0)}% OFF` : `₱${Number(v.discount).toFixed(0)} OFF`}
                    </Text>
                  )}
                  {v.type === 'percent' && v.max_discount && (
                    <Text style={{ fontFamily: 'Poppins', fontSize: 8, color: 'rgba(255,255,255,0.7)', marginTop: -2 }}>
                      max ₱{Number(v.max_discount).toFixed(0)}
                    </Text>
                  )}
                  {minOrder > 0 && (
                    <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 8, color: meetsMinimum ? 'rgba(255,255,255,0.8)' : '#FFCDD2', marginTop: 4 }}>
                      {meetsMinimum ? `Min: ₱${minOrder}` : `Need ₱${(minOrder - cartTotal).toFixed(0)} more`}
                    </Text>
                  )}
                  {fixedExceedsSubtotal && minOrder <= 0 && (
                    <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 8, color: '#FFCDD2', marginTop: 4 }}>
                      {`Subtotal must be \u2265 \u20b1${Number(v.discount).toFixed(0)}`}
                    </Text>
                  )}
                  <View style={styles.voucherPickerCodePill}>
                    <Text style={styles.voucherPickerCodeText}>{v.code}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={styles.voucherPickerDoneBtn}
            onPress={() => setShowVoucherPicker(false)}
            activeOpacity={0.85}
          >
            <Text style={styles.voucherPickerDoneText}>
              Done {appliedVouchers.length > 0 ? `(${appliedVouchers.length} Selected)` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabViewContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FAF9F5',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
    marginLeft: -6,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.primary.default,
  },
  tabTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: Colors.primary.default,
    marginBottom: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCartTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.neutral.gray700,
    marginTop: 16,
  },
  emptyCartSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: Colors.neutral.gray500,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  exploreBtn: {
    marginTop: 20,
    width: 160,
  },
  fulfillmentSection: {
    marginBottom: 12,
  },
  fulfillmentTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: Colors.neutral.gray700,
    marginBottom: 8,
  },
  fulfillmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  fulfillmentBtnActive: {
    borderColor: Colors.primary.default,
    backgroundColor: Colors.primary.default,
  },
  fulfillmentText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: Colors.primary.default,
    marginLeft: 6,
  },
  fulfillmentTextActive: {
    color: '#FAF9F5',
  },
  addressDisplayCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: Colors.neutral.gray200,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  addressDisplayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  addressDisplayTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.neutral.gray700,
  },
  addressDisplayText: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    color: Colors.neutral.gray500,
    lineHeight: 16,
  },
  paymentSection: {
    marginBottom: 12,
  },
  paymentTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: Colors.neutral.gray700,
    marginBottom: 6,
  },
  paymentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
    marginRight: 6,
    backgroundColor: '#FFFFFF',
  },
  paymentBtnActive: {
    borderColor: Colors.primary.default,
    backgroundColor: Colors.primary.default,
  },
  paymentText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 10,
    color: Colors.primary.default,
  },
  paymentTextActive: {
    color: '#FAF9F5',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  productName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.neutral.gray800,
  },
  customizationDetails: {
    fontFamily: 'Poppins',
    fontSize: 9,
    color: Colors.neutral.gray500,
    marginTop: 2,
  },
  productPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.primary.default,
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.primary.default,
    marginHorizontal: 12,
  },
  cartSummary: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray200,
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  subActiveAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary.default,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  subActiveAlertText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: '#FAF9F5',
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: Colors.neutral.gray600,
  },
  summaryVal: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: Colors.primary.default,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray200,
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  totalLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.primary.default,
  },
  totalVal: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
  },
  walletCheckoutTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0E6',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  walletTeaserBalanceText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.primary.default,
  },
  boldWalletVal: {
    fontFamily: 'Poppins-Bold',
    color: Colors.secondary.default,
  },
  checkoutBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
  },

  // ── Voucher ──
  voucherSection: {
    marginBottom: 14,
  },
  voucherCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  voucherMiniCard: {
    width: '47%',
    borderRadius: 14,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 80,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  voucherMiniCardSelected: {
    borderWidth: 2.5,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
  },
  voucherMiniCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
  },
  voucherMiniLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FFF',
    lineHeight: 14,
  },
  voucherMiniDiscount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#FFF',
    opacity: 0.95,
    marginTop: 2,
  },
  voucherMiniCode: {
    fontFamily: 'Poppins',
    fontSize: 8,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  voucherLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(196, 142, 72, 0.08)',
    borderRadius: 12,
  },
  voucherLinkText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: Colors.secondary.default,
    marginRight: 2,
  },
  voucherAppliedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary.default,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 6,
  },
  voucherAppliedPillText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#FFF',
  },
  voucherPickerContainer: {
    flex: 1,
    backgroundColor: '#FAF9F5',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  voucherPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  voucherPickerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.primary.default,
  },
  voucherPickerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F0E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherPickerSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray500,
    marginBottom: 20,
  },
  voucherPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 100,
  },
  voucherPickerCard: {
    width: '47%',
    borderRadius: 18,
    padding: 14,
    minHeight: 110,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  voucherPickerCardSelected: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  voucherPickerCheckmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  voucherPickerCardLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#FFF',
    lineHeight: 17,
  },
  voucherPickerCardDiscount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFF',
    marginTop: 4,
  },
  voucherPickerCodePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  voucherPickerCodeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#FFF',
  },
  voucherPickerDoneBtn: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: Colors.primary.default,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  voucherPickerDoneText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFF',
  },
  redeemSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray200,
  },
  redeemLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: Colors.neutral.gray700,
    marginBottom: 8,
  },
  redeemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redeemInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3EE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  redeemInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 13,
    color: Colors.primary.default,
    padding: 0,
  },
  redeemBtn: {
    backgroundColor: Colors.secondary.default,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  redeemBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#FFF',
  },
  voucherTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: Colors.neutral.gray700,
    marginBottom: 8,
  },
  voucherInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voucherInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.neutral.gray200,
    paddingHorizontal: 12,
    height: 46,
  },
  voucherInputWrapError: {
    borderColor: Colors.danger.default,
    backgroundColor: '#FFF5F5',
  },
  voucherInput: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: Colors.primary.default,
    letterSpacing: 1.5,
    height: '100%',
  },
  voucherApplyBtn: {
    backgroundColor: Colors.primary.default,
    borderRadius: 14,
    height: 46,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherApplyBtnDisabled: {
    backgroundColor: Colors.neutral.gray300,
  },
  voucherApplyText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#FFF',
  },
  voucherAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FBF0',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  voucherAppliedCode: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#2E7D32',
    letterSpacing: 1,
  },
  voucherAppliedLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 1,
  },
  voucherRemoveBtn: {
    padding: 4,
  },
  voucherError: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.danger.default,
    marginTop: 6,
    marginLeft: 4,
  },
});
