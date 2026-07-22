import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { Colors } from '../../../components/UI/Colors';
import api from '../../../lib/axios';
import { savePendingQROrder } from '../../../lib/database';

const { height } = Dimensions.get('window');

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category_id: number;
  is_customizable: boolean;
  rating: number;
}

interface CustomizationOption { name: string; price: number; }
interface CustomizationField { isMultiSelect: boolean; options: CustomizationOption[]; }

interface RedeemItem {
  product: Product;
  quantity: number;
  customization?: { selections: Record<string, string[]>; extraPrice: number; label: string; };
}

interface SubscriptionRedeemProps {
  visible: boolean;
  onClose: () => void;
  onOrderGenerated: (order: any) => void;
  userId: string;
  planId: number;
  planName: string;
  itemsAvailable: number;
  subscriptionBalance: number;
}

export default function SubscriptionRedeem({
  visible,
  onClose,
  onOrderGenerated,
  userId,
  planId,
  planName,
  itemsAvailable,
  subscriptionBalance,
}: SubscriptionRedeemProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customizationOptions, setCustomizationOptions] = useState<Record<string, Record<string, CustomizationField>>>({});
  const [redeemItems, setRedeemItems] = useState<RedeemItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Customization modal
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [customSelections, setCustomSelections] = useState<Record<string, string[]>>({});

  const maxItems = itemsAvailable;
  const currentItemCount = redeemItems.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    if (visible) {
      fetchProducts();
      setRedeemItems([]);
    }
  }, [visible]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let prods: any[] = [];
      if (planId > 0) {
        try {
          const res = await api.get(`/subscriptions/${planId}/eligible-products`);
          prods = res.data.data || [];
        } catch (e) {
          // Fallback: fetch all products, exclude food/perk categories
          const res = await api.get('/products');
          const allProds = res.data.data || res.data || [];
          // Exclude food — food only gets perk discount in Cart, NOT free in Redeem
          prods = allProds.filter((p: any) => {
            const catName = (p.category?.name || '').toLowerCase();
            const catSlug = (p.category?.slug || '').toLowerCase();
            return !catName.includes('food') && !catSlug.includes('food') && !catName.includes('pastry') && !catSlug.includes('pastry');
          });
        }
      } else {
        const res = await api.get('/products');
        const allProds = res.data.data || res.data || [];
        prods = allProds.filter((p: any) => {
          const catName = (p.category?.name || '').toLowerCase();
          const catSlug = (p.category?.slug || '').toLowerCase();
          return !catName.includes('food') && !catSlug.includes('food') && !catName.includes('pastry') && !catSlug.includes('pastry');
        });
      }
      setProducts(prods);

      const customMap: Record<string, Record<string, CustomizationField>> = {};
      prods.forEach((p: any) => {
        const rawCustom = p.customization?.customizations || p.customizations;
        if (p.is_customizable && rawCustom) {
          if (typeof rawCustom === 'object' && !Array.isArray(rawCustom)) {
            customMap[String(p.id)] = rawCustom;
          } else if (Array.isArray(rawCustom)) {
            const grouped: Record<string, CustomizationField> = {};
            rawCustom.forEach((c: any) => {
              if (c.group_name && c.options) {
                grouped[c.group_name] = { isMultiSelect: c.is_multi_select || false, options: c.options };
              }
            });
            if (Object.keys(grouped).length > 0) customMap[String(p.id)] = grouped;
          }
        }
      });
      setCustomizationOptions(customMap);
    } catch (err) {
      console.warn('Failed to load drinks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (product: Product) => {
    if (currentItemCount >= maxItems) return; // Can't add more

    const config = customizationOptions[String(product.id)];
    if (product.is_customizable && config && Object.keys(config).length > 0) {
      setCustomizingProduct(product);
      const defaults: Record<string, string[]> = {};
      Object.entries(config).forEach(([key, field]) => {
        defaults[key] = !field.isMultiSelect && field.options.length > 0 ? [field.options[0].name] : [];
      });
      setCustomSelections(defaults);
    } else {
      addItemDirect(product);
    }
  };

  const addItemDirect = (product: Product) => {
    setRedeemItems(prev => {
      const existing = prev.find(i => i.product.id === product.id && !i.customization);
      if (existing) return prev.map(i => i.product.id === product.id && !i.customization ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const addItemWithCustomization = () => {
    if (!customizingProduct) return;
    const config = customizationOptions[String(customizingProduct.id)];
    let extraPrice = 0;
    const labelParts: string[] = [];

    Object.entries(config).forEach(([key, field]) => {
      const selections = customSelections[key] || [];
      selections.forEach(selName => {
        const opt = field.options.find(o => o.name === selName);
        if (opt) extraPrice += Number(opt.price || 0);
      });
      if (!field.isMultiSelect && selections.length > 0) {
        const isDefault = field.options[0]?.name === selections[0] && Number(field.options[0]?.price || 0) === 0;
        if (!isDefault) labelParts.push(selections[0]);
      } else if (field.isMultiSelect && selections.length > 0) {
        labelParts.push(...selections);
      }
    });

    const existingIdx = redeemItems.findIndex(i =>
      i.product.id === customizingProduct.id && i.customization && JSON.stringify(i.customization.selections) === JSON.stringify(customSelections)
    );

    if (existingIdx > -1) {
      setRedeemItems(prev => prev.map((item, idx) => idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setRedeemItems(prev => [...prev, {
        product: customizingProduct,
        quantity: 1,
        customization: { selections: { ...customSelections }, extraPrice, label: labelParts.join(', ') },
      }]);
    }
    setCustomizingProduct(null);
    setCustomSelections({});
  };

  const removeItem = (index: number) => setRedeemItems(prev => prev.filter((_, i) => i !== index));

  const handleGenerateQR = () => {
    if (redeemItems.length === 0) return;

    const now = new Date();
    const order = {
      order_number: `${planName.replace(/\s+/g, '_')}-LK-SUB-${Math.floor(10000 + Math.random() * 90000)}`,
      user_id: Number(userId),
      date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      status: 'Completed',
      currentStep: 'received' as const,
      fulfillment: 'DineIn',
      ref_no: null,
      cashier: null,
      payment_method: 'subscription',
      paid_at: now.toISOString(),
      items: redeemItems.map(item => {
        const basePrice = Number(item.product.price);
        const extraPrice = item.customization?.extraPrice || 0;
        const unitPrice = basePrice + extraPrice;
        return {
          product_id: Number(item.product.id),
          name: item.product.name,
          quantity: item.quantity,
          price: unitPrice,
          customization: item.customization?.selections || null,
        };
      }),
      subtotal: redeemItems.reduce((sum, item) => {
        const base = Number(item.product.price);
        const extra = item.customization?.extraPrice || 0;
        return sum + ((base + extra) * item.quantity);
      }, 0),
      delivery_fee: 0,
      discount: (() => {
        // Same logic as Cart: cover base prices of items, highest first, up to subscriptionBalance
        const basePrices = redeemItems
          .flatMap(item => Array(item.quantity).fill(Number(item.product.price)))
          .sort((a, b) => b - a);
        const covered = Math.min(subscriptionBalance, basePrices.length);
        return basePrices.slice(0, covered).reduce((sum, p) => sum + p, 0);
      })(),
      subscriptionDiscount: (() => {
        const basePrices = redeemItems
          .flatMap(item => Array(item.quantity).fill(Number(item.product.price)))
          .sort((a, b) => b - a);
        const covered = Math.min(subscriptionBalance, basePrices.length);
        return basePrices.slice(0, covered).reduce((sum, p) => sum + p, 0);
      })(),
      voucherDiscount: 0,
      total: (() => {
        const subtotal = redeemItems.reduce((sum, item) => {
          const base = Number(item.product.price);
          const extra = item.customization?.extraPrice || 0;
          return sum + ((base + extra) * item.quantity);
        }, 0);
        const basePrices = redeemItems
          .flatMap(item => Array(item.quantity).fill(Number(item.product.price)))
          .sort((a, b) => b - a);
        const covered = Math.min(subscriptionBalance, basePrices.length);
        const discount = basePrices.slice(0, covered).reduce((sum, p) => sum + p, 0);
        return Math.max(0, subtotal - discount);
      })(),
      subscription_id: planId,
      subscription_name: planName,
      createdAt: now.toISOString(),
    };

    savePendingQROrder(order).catch(err => console.warn('Failed to save pending QR:', err));
    onOrderGenerated(order);
  };

  if (!visible) return null;

  return (
    <Animated.View entering={SlideInDown.duration(400)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary.default} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Redeem Items</Text>
          <Text style={styles.headerSubtitle}>{planName} • {currentItemCount}/{maxItems} selected</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Drinks remaining badge */}
      <View style={styles.remainingBadge}>
        <Ionicons name="cafe" size={16} color={Colors.primary.default} />
        <Text style={styles.remainingText}>
          {maxItems - currentItemCount} item{maxItems - currentItemCount !== 1 ? 's' : ''} left to pick
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.default} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridBody}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cafe-outline" size={48} color={Colors.neutral.gray400} />
              <Text style={styles.emptyText}>No items available.</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const hasCustomization = item.is_customizable && !!customizationOptions[String(item.id)];
            const isMaxed = currentItemCount >= maxItems;
            return (
              <Animated.View
                entering={index % 2 === 0 ? SlideInLeft.delay(200 + index * 40).duration(400) : SlideInRight.delay(200 + index * 40).duration(400)}
                style={styles.gridCardWrapper}
              >
                <TouchableOpacity
                  style={[styles.gridCard, isMaxed && styles.gridCardDisabled]}
                  onPress={() => handleProductPress(item)}
                  activeOpacity={isMaxed ? 1 : 0.7}
                  disabled={isMaxed}
                >
                  {item.image ? <Image source={{ uri: item.image }} style={styles.gridImage} /> : <View style={[styles.gridImage, { backgroundColor: '#F0EDE5' }]} />}
                  {hasCustomization && (
                    <View style={styles.customizableMini}>
                      <Ionicons name="options-outline" size={9} color={Colors.secondary.default} />
                      <Text style={styles.customizableMiniText}>Custom</Text>
                    </View>
                  )}
                  <View style={styles.gridContent}>
                    <Text style={styles.gridName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.gridFooter}>
                      <Text style={styles.gridPrice}>FREE</Text>
                      <View style={[styles.addButtonMini, isMaxed && { opacity: 0.3 }]}>
                        <Ionicons name="add" size={16} color="#FFF" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />
      )}

      {/* Selected Items + Generate QR Button */}
      {redeemItems.length > 0 && (
        <View style={styles.footer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedScroll}>
            {redeemItems.map((item, idx) => (
              <View key={`${item.product.id}-${idx}`} style={styles.selectedChip}>
                <Text style={styles.selectedChipText} numberOfLines={1}>
                  {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.product.name}
                </Text>
                <TouchableOpacity onPress={() => removeItem(idx)}>
                  <Ionicons name="close-circle" size={18} color={Colors.danger.default} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateQR} activeOpacity={0.85}>
            <Ionicons name="qr-code" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.generateBtnText}>Generate QR Code</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Customization Modal */}
      <Modal visible={!!customizingProduct} animationType="slide" transparent onRequestClose={() => setCustomizingProduct(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {customizingProduct && (() => {
              const config = customizationOptions[String(customizingProduct.id)] || {};
              return (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Customize: {customizingProduct.name}</Text>
                    <TouchableOpacity onPress={() => setCustomizingProduct(null)}>
                      <Ionicons name="close-circle" size={28} color={Colors.neutral.gray500} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                    {Object.entries(config).map(([fieldName, fieldConfig]) => {
                      if (!fieldConfig?.options) return null;
                      const selections = customSelections[fieldName] || [];
                      const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
                      return (
                        <View key={fieldName} style={styles.fieldSection}>
                          <Text style={styles.fieldLabel}>{label}{fieldConfig.isMultiSelect && <Text style={styles.fieldHint}> (select multiple)</Text>}</Text>
                          <View style={styles.optionsGrid}>
                            {fieldConfig.options.map(opt => {
                              const isSelected = selections.includes(opt.name);
                              return (
                                <TouchableOpacity
                                  key={opt.name}
                                  style={[styles.optionChip, isSelected && styles.optionChipActive]}
                                  onPress={() => {
                                    if (fieldConfig.isMultiSelect) {
                                      const newSels = isSelected ? selections.filter(s => s !== opt.name) : [...selections, opt.name];
                                      setCustomSelections(prev => ({ ...prev, [fieldName]: newSels }));
                                    } else {
                                      setCustomSelections(prev => ({ ...prev, [fieldName]: [opt.name] }));
                                    }
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>{opt.name}</Text>
                                  {isSelected && <Ionicons name="checkmark-circle" size={16} color="#FFF" style={{ marginLeft: 4 }} />}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                  <View style={styles.modalFooter}>
                    <Text style={styles.modalPriceText}>FREE</Text>
                    <TouchableOpacity style={styles.modalAddBtn} onPress={addItemWithCustomization} activeOpacity={0.8}>
                      <Ionicons name="add" size={18} color="#FFF" />
                      <Text style={styles.modalAddBtnText}>Add Drink</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F5', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.neutral.gray200 },
  headerTitle: { fontFamily: 'Poppins-Bold', fontSize: 18, color: Colors.primary.default },
  headerSubtitle: { fontFamily: 'Poppins', fontSize: 11, color: Colors.neutral.gray500, marginTop: 2 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E1EEFA', justifyContent: 'center', alignItems: 'center' },
  remainingBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 8, backgroundColor: Colors.primary.default + '10' },
  remainingText: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: Colors.primary.default },

  // Grid
  gridBody: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 140 },
  gridRow: { justifyContent: 'space-between' },
  gridCardWrapper: { width: '48%' },
  gridCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: Colors.neutral.gray200, shadowColor: Colors.primary.default, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, position: 'relative' },
  gridCardDisabled: { opacity: 0.4 },
  gridImage: { width: '100%', height: 100, borderRadius: 12 },
  customizableMini: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(255,255,255,0.9)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 6, gap: 3 },
  customizableMiniText: { fontFamily: 'Poppins-Bold', fontSize: 8, color: Colors.secondary.default },
  gridContent: { marginTop: 10 },
  gridName: { fontFamily: 'Poppins-Bold', fontSize: 13, color: Colors.neutral.gray900 },
  gridFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  gridPrice: { fontFamily: 'Poppins-Bold', fontSize: 13, color: '#4CAF50' },
  addButtonMini: { backgroundColor: Colors.secondary.default, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontFamily: 'Poppins', fontSize: 14, color: Colors.neutral.gray600, marginTop: 10 },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0EDE5', padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  selectedScroll: { marginBottom: 12 },
  selectedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F5F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, gap: 6, maxWidth: 180 },
  selectedChipText: { fontFamily: 'Poppins-SemiBold', fontSize: 11, color: '#333' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary.default, borderRadius: 14, paddingVertical: 14 },
  generateBtnText: { fontFamily: 'Poppins-Bold', fontSize: 15, color: '#FFF' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0EDE5' },
  modalTitle: { fontFamily: 'Poppins-Bold', fontSize: 16, color: '#333', flex: 1, marginRight: 12 },
  modalBody: { paddingHorizontal: 20, paddingTop: 16, maxHeight: 350 },
  fieldSection: { marginBottom: 20 },
  fieldLabel: { fontFamily: 'Poppins-Bold', fontSize: 14, color: '#333', marginBottom: 10 },
  fieldHint: { fontFamily: 'Poppins', fontSize: 11, color: Colors.neutral.gray400 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F5F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5, borderColor: '#E8E4DC' },
  optionChipActive: { backgroundColor: Colors.primary.default, borderColor: Colors.primary.default },
  optionName: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#333' },
  optionNameActive: { color: '#FFF' },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0EDE5' },
  modalPriceText: { fontFamily: 'Poppins-Bold', fontSize: 20, color: '#4CAF50' },
  modalAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary.default, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  modalAddBtnText: { fontFamily: 'Poppins-Bold', fontSize: 14, color: '#FFF', marginLeft: 6 },
});
