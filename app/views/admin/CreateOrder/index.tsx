import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { Colors } from '../../../../components/UI/Colors';
import { Input } from '../../../../components/UI/Input';
import api from '../../../../lib/axios';

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

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

interface CustomizationOption {
  name: string;
  price: number;
}

interface CustomizationField {
  isMultiSelect: boolean;
  options: CustomizationOption[];
}

interface OrderItem {
  product: Product;
  quantity: number;
  customization?: {
    selections: Record<string, string[]>;
    extraPrice: number;
    label: string;
  };
}

export default function CreateOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [customizationOptions, setCustomizationOptions] = useState<Record<string, Record<string, CustomizationField>>>({});
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // View state: 'menu' or 'cart'
  const [currentView, setCurrentView] = useState<'menu' | 'cart'>('menu');

  // Cart/Order form
  const [customerName, setCustomerName] = useState('');
  const [tableNo, setTableNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Custom alert modal
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    onDismiss?: () => void;
  }>({ visible: false, title: '', message: '', type: 'info' });

  // Customization modal
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [customSelections, setCustomSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const cats = res.data.data || res.data || [];
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCategory(cats[0].id);
      }
    } catch (err) {}
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      const prods = res.data.data || res.data || [];
      setProducts(prods);

      const customMap: Record<string, Record<string, CustomizationField>> = {};
      prods.forEach((p: any) => {
        const rawCustom = p.customization?.customizations || p.customizations;
        if (p.is_customizable && rawCustom) {
          if (Array.isArray(rawCustom)) {
            const grouped: Record<string, CustomizationField> = {};
            rawCustom.forEach((c: any) => {
              if (c.group_name && c.options) {
                grouped[c.group_name] = { isMultiSelect: c.is_multi_select || false, options: c.options };
              }
            });
            if (Object.keys(grouped).length > 0) customMap[String(p.id)] = grouped;
          } else if (typeof rawCustom === 'object') {
            customMap[String(p.id)] = rawCustom;
          }
        }
      });
      setCustomizationOptions(customMap);
    } catch (err) {
      setAlertConfig({ visible: true, title: 'Error', message: 'Failed to load products', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- Product tap ---
  const handleProductPress = (product: Product) => {
    const config = customizationOptions[String(product.id)];
    if (product.is_customizable && config && Object.keys(config).length > 0) {
      setCustomizingProduct(product);
      const defaults: Record<string, string[]> = {};
      Object.entries(config).forEach(([key, field]) => {
        if (!field.isMultiSelect && field.options.length > 0) {
          defaults[key] = [field.options[0].name];
        } else {
          defaults[key] = [];
        }
      });
      setCustomSelections(defaults);
    } else {
      addItemDirect(product);
    }
  };

  const addItemDirect = (product: Product) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.product.id === product.id && !i.customization);
      if (existing) {
        return prev.map(i => i.product.id === product.id && !i.customization ? { ...i, quantity: i.quantity + 1 } : i);
      }
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

    const existingIdx = orderItems.findIndex(i =>
      i.product.id === customizingProduct.id && i.customization && JSON.stringify(i.customization.selections) === JSON.stringify(customSelections)
    );

    if (existingIdx > -1) {
      setOrderItems(prev => prev.map((item, idx) => idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setOrderItems(prev => [...prev, {
        product: customizingProduct,
        quantity: 1,
        customization: { selections: { ...customSelections }, extraPrice, label: labelParts.join(', ') }
      }]);
    }
    setCustomizingProduct(null);
    setCustomSelections({});
  };

  // --- Cart helpers ---
  const cartCount = orderItems.reduce((sum, i) => sum + i.quantity, 0);

  const removeItem = (index: number) => setOrderItems(prev => prev.filter((_, i) => i !== index));

  const updateQuantity = (index: number, delta: number) => {
    setOrderItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(i => i.quantity > 0));
  };

  const getItemPrice = (item: OrderItem) => (Number(item.product.price) + (item.customization?.extraPrice || 0)) * item.quantity;
  const getTotal = () => orderItems.reduce((sum, item) => sum + getItemPrice(item), 0);

  const handleSubmit = async () => {
    if (orderItems.length === 0) {
      setAlertConfig({ visible: true, title: 'Empty Order', message: 'Please add at least one item.', type: 'info' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customer_name: customerName || 'Walk-in',
        table_no: tableNo || null,
        type: 'dine-in',
        payment_method: 'cash',
        items: orderItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: Number(item.product.price) + (item.customization?.extraPrice || 0),
          subtotal: getItemPrice(item),
          customization: item.customization ? item.customization.selections : null,
        })),
        subtotal: getTotal(),
        total: getTotal(),
      };
      await api.post('/orders/admin-create', payload);
      setAlertConfig({
        visible: true,
        title: 'Order Created! ☕',
        message: `Total: ₱${getTotal().toFixed(2)}\nOrder placed successfully.`,
        type: 'success',
        onDismiss: () => { setOrderItems([]); setCustomerName(''); setTableNo(''); setCurrentView('menu'); },
      });
    } catch (err: any) {
      setAlertConfig({
        visible: true,
        title: 'Order Failed',
        message: err?.response?.data?.message || 'Failed to create order. Please try again.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Filters ---
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.default} />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  // ====== CART / ORDER VIEW ======
  if (currentView === 'cart') {
    return (
      <Animated.View entering={SlideInRight.duration(300)} style={styles.container}>
        {/* Cart Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={Colors.primary.default} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Summary</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          {/* Customer Info */}
          <View style={styles.cartSection}>
            <Text style={styles.cartSectionTitle}>Customer Info</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.cartInput, { flex: 1 }]}
                placeholder="Name (optional)"
                placeholderTextColor={Colors.neutral.gray400}
                value={customerName}
                onChangeText={setCustomerName}
              />
              <TextInput
                style={[styles.cartInput, { width: 80 }]}
                placeholder="Table #"
                placeholderTextColor={Colors.neutral.gray400}
                value={tableNo}
                onChangeText={setTableNo}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Order Items */}
          <View style={styles.cartSection}>
            <Text style={styles.cartSectionTitle}>Items ({cartCount})</Text>
            {orderItems.map((item, idx) => (
              <View key={`${item.product.id}-${idx}`} style={styles.cartItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName}>{item.product.name}</Text>
                  {item.customization?.label ? <Text style={styles.cartItemCustom}>{item.customization.label}</Text> : null}
                  <Text style={styles.cartItemPrice}>₱{getItemPrice(item).toFixed(2)}</Text>
                </View>
                <View style={styles.cartQtyRow}>
                  <TouchableOpacity onPress={() => updateQuantity(idx, -1)} style={styles.qtyBtn}>
                    <Ionicons name="remove" size={14} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(idx, 1)} style={styles.qtyBtn}>
                    <Ionicons name="add" size={14} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeItem(idx)} style={{ marginLeft: 10 }}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger.default} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Total */}
          <View style={styles.cartTotalRow}>
            <Text style={styles.cartTotalLabel}>Total</Text>
            <Text style={styles.cartTotalValue}>₱{getTotal().toFixed(2)}</Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.cartFooter}>
          <TouchableOpacity
            style={[styles.submitBtn, (orderItems.length === 0 || submitting) && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={orderItems.length === 0 || submitting}
            activeOpacity={0.8}
          >
            {submitting ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Create Order</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Custom Alert Modal (inside cart view) */}
        <Modal visible={alertConfig.visible} transparent animationType="fade" onRequestClose={() => {}}>
          <View style={styles.alertOverlay}>
            <View style={styles.alertCard}>
              <View style={[
                styles.alertIconCircle,
                alertConfig.type === 'success' && { backgroundColor: '#E8F5E9' },
                alertConfig.type === 'error' && { backgroundColor: '#FFEBEE' },
                alertConfig.type === 'info' && { backgroundColor: '#FFF3E0' },
              ]}>
                <Ionicons
                  name={
                    alertConfig.type === 'success' ? 'checkmark-circle' :
                    alertConfig.type === 'error' ? 'close-circle' : 'information-circle'
                  }
                  size={40}
                  color={
                    alertConfig.type === 'success' ? '#4CAF50' :
                    alertConfig.type === 'error' ? '#F44336' : '#FF9800'
                  }
                />
              </View>
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>
              <TouchableOpacity
                style={[
                  styles.alertBtn,
                  alertConfig.type === 'success' && { backgroundColor: '#4CAF50' },
                  alertConfig.type === 'error' && { backgroundColor: '#F44336' },
                  alertConfig.type === 'info' && { backgroundColor: Colors.primary.default },
                ]}
                onPress={() => {
                  setAlertConfig(prev => ({ ...prev, visible: false }));
                  alertConfig.onDismiss?.();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.alertBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </Animated.View>
    );
  }

  // ====== MENU VIEW (OurMenu Style) ======
  return (
    <Animated.View entering={SlideInDown.duration(400)} style={styles.container}>
      {/* Header with Cart Icon */}
      <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.header}>
        <View style={{ width: 44 }} />
        <Text style={styles.headerTitle}>Create Order</Text>
        <TouchableOpacity onPress={() => setCurrentView('cart')} style={styles.cartIconBtn}>
          <Ionicons name="cart" size={24} color={Colors.primary.default} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Search */}
      <Animated.View entering={SlideInRight.delay(300).duration(400)} style={styles.searchWrap}>
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search-outline" size={18} color={Colors.primary.default} />}
          rightIcon={searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={Colors.neutral.gray500} />
            </TouchableOpacity>
          ) : null}
        />
      </Animated.View>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <Animated.View entering={SlideInLeft.delay(400).duration(400)} style={styles.categoriesSection}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => {
              const isActive = selectedCategory === item.id;
              return (
                <TouchableOpacity
                  style={[styles.categoryBtn, isActive && styles.categoryBtnActive]}
                  onPress={() => setSelectedCategory(item.id)}
                >
                  {item.icon && (
                    <Ionicons name={item.icon as any} size={14} color={isActive ? '#FFF' : Colors.primary.default} />
                  )}
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>{item.name}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </Animated.View>
      )}

      {/* Products Grid (same as OurMenu) */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridBody}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cafe-outline" size={48} color={Colors.neutral.gray400} />
            <Text style={styles.emptyText}>No products found.</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const hasCustomization = item.is_customizable && !!customizationOptions[String(item.id)];
          return (
            <Animated.View
              entering={index % 2 === 0 ? SlideInLeft.delay(450 + index * 40).duration(400) : SlideInRight.delay(450 + index * 40).duration(400)}
              style={styles.gridCardWrapper}
            >
              <View style={styles.gridCard}>
                {item.image ? <Image source={{ uri: item.image }} style={styles.gridImage} /> : <View style={[styles.gridImage, { backgroundColor: '#F0EDE5' }]} />}
                {item.rating > 0 && (
                  <View style={styles.ratingBadgeMini}>
                    <Ionicons name="star" size={10} color="#F4A261" />
                    <Text style={styles.ratingTextMini}>{item.rating}</Text>
                  </View>
                )}
                {hasCustomization && (
                  <View style={styles.customizableMini}>
                    <Ionicons name="options-outline" size={9} color={Colors.secondary.default} />
                    <Text style={styles.customizableMiniText}>Custom</Text>
                  </View>
                )}
                <View style={styles.gridContent}>
                  <Text style={styles.gridName} numberOfLines={1}>{item.name}</Text>
                  {item.description ? <Text style={styles.gridDesc} numberOfLines={1}>{item.description}</Text> : null}
                  <View style={styles.gridFooter}>
                    <Text style={styles.gridPrice}>₱{Number(item.price).toFixed(2)}</Text>
                    <TouchableOpacity style={styles.addButtonMini} onPress={() => handleProductPress(item)} activeOpacity={0.85}>
                      <Ionicons name="add" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
          );
        }}
      />

      {/* ====== CUSTOMIZATION MODAL ====== */}
      <Modal visible={!!customizingProduct} animationType="slide" transparent onRequestClose={() => setCustomizingProduct(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {customizingProduct && (() => {
              const config = customizationOptions[String(customizingProduct.id)] || {};
              let previewExtra = 0;
              Object.entries(config).forEach(([key, field]) => {
                (customSelections[key] || []).forEach(selName => {
                  const opt = field.options.find(o => o.name === selName);
                  if (opt) previewExtra += Number(opt.price || 0);
                });
              });
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
                                  {Number(opt.price) > 0 && <Text style={[styles.optionPrice, isSelected && styles.optionPriceActive]}>+₱{Number(opt.price).toFixed(0)}</Text>}
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
                    <Text style={styles.modalPriceText}>₱{(Number(customizingProduct.price) + previewExtra).toFixed(2)}</Text>
                    <TouchableOpacity style={styles.modalAddBtn} onPress={addItemWithCustomization} activeOpacity={0.8}>
                      <Ionicons name="add" size={18} color="#FFF" />
                      <Text style={styles.modalAddBtnText}>Add to Order</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* ====== CUSTOM ALERT MODAL ====== */}
      <Modal visible={alertConfig.visible} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            {/* Icon */}
            <View style={[
              styles.alertIconCircle,
              alertConfig.type === 'success' && { backgroundColor: '#E8F5E9' },
              alertConfig.type === 'error' && { backgroundColor: '#FFEBEE' },
              alertConfig.type === 'info' && { backgroundColor: '#FFF3E0' },
            ]}>
              <Ionicons
                name={
                  alertConfig.type === 'success' ? 'checkmark-circle' :
                  alertConfig.type === 'error' ? 'close-circle' : 'information-circle'
                }
                size={40}
                color={
                  alertConfig.type === 'success' ? '#4CAF50' :
                  alertConfig.type === 'error' ? '#F44336' : '#FF9800'
                }
              />
            </View>

            {/* Text */}
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>

            {/* Button */}
            <TouchableOpacity
              style={[
                styles.alertBtn,
                alertConfig.type === 'success' && { backgroundColor: '#4CAF50' },
                alertConfig.type === 'error' && { backgroundColor: '#F44336' },
                alertConfig.type === 'info' && { backgroundColor: Colors.primary.default },
              ]}
              onPress={() => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                alertConfig.onDismiss?.();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.alertBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F5' },
  loadingContainer: { flex: 1, backgroundColor: '#FAF9F5', justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: 'Poppins', fontSize: 14, color: Colors.neutral.gray500, marginTop: 12 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.neutral.gray200,
  },
  headerTitle: { fontFamily: 'Poppins-Bold', fontSize: 18, color: Colors.primary.default },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F0E6', justifyContent: 'center', alignItems: 'center' },
  cartIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F0E6', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  cartBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: Colors.danger.default, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontFamily: 'Poppins-Bold', fontSize: 9, color: '#FFF' },

  // Search
  searchWrap: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },

  // Categories
  categoriesSection: { marginBottom: 10 },
  categoriesList: { paddingHorizontal: 24, paddingVertical: 6, gap: 8 },
  categoryBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#FAF9F5', borderWidth: 1, borderColor: Colors.neutral.gray300, gap: 6 },
  categoryBtnActive: { backgroundColor: Colors.primary.default, borderColor: Colors.primary.default },
  categoryText: { fontFamily: 'Poppins-Bold', fontSize: 11, color: Colors.primary.default },
  categoryTextActive: { color: '#FAF9F5' },

  // Grid (OurMenu style)
  gridBody: { paddingHorizontal: 24, paddingBottom: 40 },
  gridRow: { justifyContent: 'space-between' },
  gridCardWrapper: { width: '48%' },
  gridCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: Colors.neutral.gray200, shadowColor: Colors.primary.default, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, position: 'relative' },
  gridImage: { width: '100%', height: 100, borderRadius: 12 },
  ratingBadgeMini: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.9)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 6, gap: 2 },
  ratingTextMini: { fontFamily: 'Poppins-Bold', fontSize: 9, color: '#D48C46' },
  customizableMini: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(255,255,255,0.9)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 6, gap: 3 },
  customizableMiniText: { fontFamily: 'Poppins-Bold', fontSize: 8, color: Colors.secondary.default },
  gridContent: { marginTop: 10 },
  gridName: { fontFamily: 'Poppins-Bold', fontSize: 13, color: Colors.neutral.gray900 },
  gridDesc: { fontFamily: 'Poppins', fontSize: 10, color: Colors.neutral.gray500, marginTop: 2 },
  gridFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  gridPrice: { fontFamily: 'Poppins-Bold', fontSize: 13, color: Colors.secondary.default },
  addButtonMini: { backgroundColor: Colors.secondary.default, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.secondary.default, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontFamily: 'Poppins', fontSize: 14, color: Colors.neutral.gray600, marginTop: 10 },

  // Cart View
  cartSection: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cartSectionTitle: { fontFamily: 'Poppins-Bold', fontSize: 15, color: Colors.primary.default, marginBottom: 12 },
  cartInput: { backgroundColor: '#F7F5F0', borderRadius: 10, padding: 12, fontFamily: 'Poppins', fontSize: 14, color: '#333' },
  cartItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0EDE5' },
  cartItemName: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#333' },
  cartItemCustom: { fontFamily: 'Poppins', fontSize: 11, color: Colors.primary.default, marginTop: 2 },
  cartItemPrice: { fontFamily: 'Poppins', fontSize: 12, color: Colors.neutral.gray600, marginTop: 2 },
  cartQtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary.default, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontFamily: 'Poppins-Bold', fontSize: 14, color: '#333', minWidth: 20, textAlign: 'center' },
  cartTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 2, borderTopColor: Colors.primary.default },
  cartTotalLabel: { fontFamily: 'Poppins-Bold', fontSize: 18, color: '#333' },
  cartTotalValue: { fontFamily: 'Poppins-Bold', fontSize: 22, color: Colors.primary.default },
  cartFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0EDE5' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary.default, borderRadius: 14, paddingVertical: 16 },
  submitBtnText: { fontFamily: 'Poppins-Bold', fontSize: 16, color: '#FFF' },

  // Customization Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0EDE5' },
  modalTitle: { fontFamily: 'Poppins-Bold', fontSize: 16, color: '#333', flex: 1, marginRight: 12 },
  modalBody: { paddingHorizontal: 20, paddingTop: 16, maxHeight: 400 },
  fieldSection: { marginBottom: 20 },
  fieldLabel: { fontFamily: 'Poppins-Bold', fontSize: 14, color: '#333', marginBottom: 10 },
  fieldHint: { fontFamily: 'Poppins', fontSize: 11, color: Colors.neutral.gray400 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F5F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5, borderColor: '#E8E4DC' },
  optionChipActive: { backgroundColor: Colors.primary.default, borderColor: Colors.primary.default },
  optionName: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#333' },
  optionNameActive: { color: '#FFF' },
  optionPrice: { fontFamily: 'Poppins', fontSize: 11, color: Colors.neutral.gray500, marginLeft: 6 },
  optionPriceActive: { color: 'rgba(255,255,255,0.8)' },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0EDE5' },
  modalPriceText: { fontFamily: 'Poppins-Bold', fontSize: 20, color: Colors.primary.default },
  modalAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary.default, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  modalAddBtnText: { fontFamily: 'Poppins-Bold', fontSize: 14, color: '#FFF', marginLeft: 6 },

  // Custom Alert
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  alertCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  alertIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: { fontFamily: 'Poppins-Bold', fontSize: 18, color: '#333', marginBottom: 8, textAlign: 'center' },
  alertMessage: { fontFamily: 'Poppins', fontSize: 14, color: Colors.neutral.gray600, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  alertBtn: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 14, minWidth: 140, alignItems: 'center' },
  alertBtnText: { fontFamily: 'Poppins-Bold', fontSize: 15, color: '#FFF' },
});
