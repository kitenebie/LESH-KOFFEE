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
import api from '../../../../lib/axios';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category_id: number;
  category_name?: string;
  is_customizable: boolean;
  rating: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
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
  const [selectedCategory, setSelectedCategory] = useState<number>(0); // 0 = All
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

  // Cart helpers
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

  // Filters
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 0 || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes('all')) return 'grid-outline';
    if (lower.includes('pasalubong') || lower.includes('gift')) return 'gift-outline';
    if (lower.includes('dessert') || lower.includes('cake')) return 'ice-cream-outline';
    if (lower.includes('food') || lower.includes('meal') || lower.includes('snack')) return 'fast-food-outline';
    if (lower.includes('drink') || lower.includes('coffee') || lower.includes('beverage')) return 'cafe-outline';
    return 'restaurant-outline';
  };

  const getCategoryTagLabel = (item: Product) => {
    if (item.category_name) return item.category_name;
    const cat = categories.find(c => c.id === item.category_id);
    if (cat) return cat.name;
    const lowerName = item.name.toLowerCase();
    if (lowerName.includes('brew') || lowerName.includes('cold')) return 'Cold Brew';
    if (lowerName.includes('latte') || lowerName.includes('espresso') || lowerName.includes('cappuccino') || lowerName.includes('macchiato')) return 'Coffee';
    if (lowerName.includes('dessert') || lowerName.includes('cake') || lowerName.includes('pie')) return 'Desserts';
    if (lowerName.includes('pasalubong')) return 'Pasalubong';
    return 'Coffee';
  };

  const categoryList: Category[] = [
    { id: 0, name: 'All', slug: 'all', icon: 'grid-outline' },
    ...categories,
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  // ====== CART / ORDER VIEW ======
  if (currentView === 'cart') {
    return (
      <Animated.View entering={SlideInRight.duration(300)} style={styles.container}>
        {/* Cart Header with mascot emblem */}
        <View style={styles.summaryHeader}>
          <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backBtnCircle}>
            <Ionicons name="chevron-back" size={22} color="#2563EB" />
          </TouchableOpacity>

          <View style={styles.summaryTitleCenter}>
            <View style={styles.mascotWrapperSummary}>
              <Image
                source={require('../../../../assets/app/logo.png')}
                style={styles.mascotImgSummary}
                resizeMode="contain"
              />
              <Ionicons name="sparkles" size={10} color="#93C5FD" style={styles.sparkleSummaryLeft} />
              <Ionicons name="sparkles" size={8} color="#93C5FD" style={styles.sparkleSummaryRight} />
            </View>
            <Text style={styles.summaryPageTitle}>Order Summary</Text>
          </View>

          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 }}>
          {/* Customer Information Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardHeader}>
              <View style={styles.summaryIconBadge}>
                <Ionicons name="person" size={16} color="#2563EB" />
              </View>
              <Text style={styles.summaryCardTitle}>Customer Information</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Name field */}
              <View style={styles.summaryInputPill}>
                <Ionicons name="person-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.summaryTextInput}
                  placeholder="Name (optional)"
                  placeholderTextColor="#94A3B8"
                  value={customerName}
                  onChangeText={setCustomerName}
                />
              </View>

              {/* Table # field */}
              <View style={styles.summaryTablePill}>
                <Ionicons name="restaurant-outline" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.summaryTextInput}
                  placeholder="Table #"
                  placeholderTextColor="#94A3B8"
                  value={tableNo}
                  onChangeText={setTableNo}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          {/* Items Card & Breakdown */}
          <View style={styles.summaryCard}>
            {/* Header */}
            <View style={styles.summaryCardHeader}>
              <View style={styles.summaryIconBadge}>
                <Ionicons name="bag-handle" size={16} color="#2563EB" />
              </View>
              <Text style={styles.summaryCardTitle}>Items ({cartCount})</Text>
            </View>

            {/* Item List */}
            {orderItems.map((item, idx) => {
              const basePrice = Number(item.product.price);
              const extraPrice = item.customization?.extraPrice || 0;
              const unitPrice = basePrice + extraPrice;
              const itemTotal = unitPrice * item.quantity;
              const subLabel = item.customization?.label || 'Steamed · Espresso Shot';

              return (
                <View key={`${item.product.id}-${idx}`} style={styles.summaryItemRow}>
                  {/* Square Image */}
                  {item.product.image ? (
                    <Image source={{ uri: item.product.image }} style={styles.summaryItemImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.summaryItemImg, { backgroundColor: '#F1F5F9' }]} />
                  )}

                  {/* Details */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.summaryItemTitle} numberOfLines={1}>{item.product.name}</Text>
                    <Text style={styles.summaryItemSubLabel} numberOfLines={1}>{subLabel}</Text>
                    <Text style={styles.summaryItemPrice}>₱{itemTotal.toFixed(2)}</Text>
                  </View>

                  {/* Quantity & Trash */}
                  <View style={styles.summaryItemActions}>
                    <View style={styles.summaryQtyPill}>
                      <TouchableOpacity onPress={() => updateQuantity(idx, -1)} style={styles.summaryQtyBtn}>
                        <Ionicons name="remove" size={12} color="#2563EB" />
                      </TouchableOpacity>
                      <Text style={styles.summaryQtyVal}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(idx, 1)} style={styles.summaryQtyBtn}>
                        <Ionicons name="add" size={12} color="#2563EB" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => removeItem(idx)} style={styles.summaryTrashBtn}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Separator Line */}
            <View style={styles.summaryDashedLine} />

            {/* Order Breakdown Section */}
            <View style={styles.summaryCardHeader}>
              <View style={styles.summaryIconBadge}>
                <Ionicons name="receipt-outline" size={16} color="#2563EB" />
              </View>
              <Text style={styles.summaryCardTitle}>Order Breakdown</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownVal}>₱{getTotal().toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Discount</Text>
              <Text style={styles.breakdownValGreen}>-₱0.00</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Tax (0%)</Text>
              <Text style={styles.breakdownVal}>₱0.00</Text>
            </View>

            {/* Total Pill */}
            <View style={styles.summaryTotalPill}>
              <Text style={styles.summaryTotalPillLabel}>Total</Text>
              <Text style={styles.summaryTotalPillValue}>₱{getTotal().toFixed(2)}</Text>
            </View>
          </View>

          {/* Cloud Mascot Hint Speech Banner */}
          <View style={styles.speechBannerContainer}>
            <View style={styles.speechMascotWrapper}>
              <Image 
                source={require('../../../../assets/app/logo.png')} 
                style={styles.speechMascotImg} 
                resizeMode="contain" 
              />
            </View>
            <View style={styles.speechBubblePill}>
              <Text style={styles.speechBubbleText}>You're just one step away from your coffee! 💙</Text>
            </View>
          </View>

          {/* Create Order Blue Action Bar */}
          <TouchableOpacity
            style={[styles.createOrderActionBtn, (orderItems.length === 0 || submitting) && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={orderItems.length === 0 || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <View style={styles.createOrderIconCircle}>
                  <Ionicons name="cafe" size={18} color="#2563EB" />
                </View>
                <Text style={styles.createOrderActionBtnText}>Create Order</Text>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

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
                  alertConfig.type === 'info' && { backgroundColor: '#2563EB' },
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

  // ====== MENU VIEW ======
  return (
    <View style={styles.container}>
      {/* Top Header with Mascot & Cart */}
      <View style={styles.header}>
        <View style={styles.headerTitleCenter}>
          <View style={styles.mascotWrapper}>
            <Image
              source={require('../../../../assets/app/logo.png')}
              style={styles.mascotImg}
              resizeMode="contain"
            />
            <Ionicons name="sparkles" size={12} color="#93C5FD" style={styles.sparkleLeft} />
            <Ionicons name="sparkles" size={10} color="#93C5FD" style={styles.sparkleRight} />
          </View>
          <Text style={styles.pageTitle}>Create Order</Text>
        </View>

        <TouchableOpacity onPress={() => setCurrentView('cart')} style={styles.cartIconBtn} activeOpacity={0.85}>
          <Ionicons name="cart" size={22} color="#2563EB" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Input & Filter Button */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputPill}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInputText}
            placeholder="Search products..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.85}>
          <Ionicons name="options-outline" size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* Horizontal Category Chips */}
      <View style={styles.categoriesSection}>
        <FlatList
          data={categoryList}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item.id;
            const iconName = item.icon || getCategoryIcon(item.name);
            return (
              <TouchableOpacity
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(item.id)}
                activeOpacity={0.85}
              >
                <Ionicons 
                  name={iconName as any} 
                  size={15} 
                  color={isActive ? '#FFFFFF' : '#2563EB'} 
                />
                <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 2-Column Product Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridBody}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cafe-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No products found.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const categoryTag = getCategoryTagLabel(item);
          const numRating = Number(item.rating);
          const ratingVal = !isNaN(numRating) && numRating > 0 ? numRating.toFixed(1) : '4.8';

          return (
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => handleProductPress(item)}
              activeOpacity={0.9}
            >
              {/* Product Image & Badges */}
              <View style={styles.imageContainer}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.productImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.productImg, { backgroundColor: '#F1F5F9' }]} />
                )}

                {/* Top-Left Category Tag */}
                <View style={styles.categoryTagPill}>
                  <Text style={styles.categoryTagText}>{categoryTag}</Text>
                </View>

                {/* Top-Right Rating Tag */}
                <View style={styles.ratingTagPill}>
                  <Ionicons name="star" size={10} color="#F59E0B" style={{ marginRight: 2 }} />
                  <Text style={styles.ratingTagText}>{ratingVal}</Text>
                </View>
              </View>

              {/* Product Info */}
              <View style={styles.cardContent}>
                <Text style={styles.productTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productDesc} numberOfLines={2}>
                  {item.description || 'Rich espresso combined with smooth milk.'}
                </Text>

                {/* Price & Add Button Row */}
                <View style={styles.cardFooter}>
                  <Text style={styles.productPrice}>₱{Number(item.price).toFixed(2)}</Text>

                  <TouchableOpacity 
                    style={styles.addBtnCircle} 
                    onPress={() => handleProductPress(item)} 
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
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
                      <Ionicons name="close-circle" size={26} color="#94A3B8" />
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
                alertConfig.type === 'info' && { backgroundColor: '#2563EB' },
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: { 
    flex: 1, 
    backgroundColor: '#F8FAFC', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  loadingText: { 
    fontFamily: 'Poppins-Medium', 
    fontSize: 13, 
    color: '#64748B', 
    marginTop: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 38,
    paddingBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  headerTitleCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotWrapper: {
    width: 48,
    height: 48,
    position: 'relative',
    marginBottom: 2,
  },
  mascotImg: {
    width: '100%',
    height: '100%',
  },
  sparkleLeft: {
    position: 'absolute',
    top: -2,
    left: -4,
  },
  sparkleRight: {
    position: 'absolute',
    top: 8,
    right: -6,
  },
  pageTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#2563EB',
    lineHeight: 26,
  },
  cartIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1D5FA7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#2563EB',
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#FFFFFF',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#1E293B',
  },

  // Search & Filter
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 10,
  },
  searchInputPill: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInputText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#1E293B',
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },

  // Horizontal Category Chips
  categoriesSection: {
    marginBottom: 12,
  },
  categoriesList: {
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryChipText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#334155',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },

  // 2-Column Product Grid
  gridBody: {
    paddingHorizontal: 24,
    paddingBottom: 90,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1D5FA7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  productImg: {
    width: '100%',
    height: '100%',
  },
  categoryTagPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryTagText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#1D5FA7',
  },
  ratingTagPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingTagText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#1E293B',
  },
  cardContent: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  productTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#1E293B',
  },
  productDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: '#64748B',
    lineHeight: 13,
    marginTop: 2,
    height: 26,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  productPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#1D5FA7',
  },
  addBtnCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
  },

  // Order Summary View Styles
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 38,
    paddingBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  backBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1D5FA7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTitleCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotWrapperSummary: {
    width: 40,
    height: 40,
    position: 'relative',
    marginBottom: 2,
  },
  mascotImgSummary: {
    width: '100%',
    height: '100%',
  },
  sparkleSummaryLeft: {
    position: 'absolute',
    top: -2,
    left: -4,
  },
  sparkleSummaryRight: {
    position: 'absolute',
    top: 6,
    right: -6,
  },
  summaryPageTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#1E293B',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1D5FA7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  summaryCardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#1E293B',
  },
  summaryInputPill: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  summaryTablePill: {
    width: 120,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  summaryTextInput: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#1E293B',
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryItemImg: {
    width: 60,
    height: 60,
    borderRadius: 14,
  },
  summaryItemTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#1E293B',
  },
  summaryItemSubLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: '#3B82F6',
    marginVertical: 2,
  },
  summaryItemPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#1E293B',
  },
  summaryItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryQtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
  },
  summaryQtyBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryQtyVal: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#1E293B',
    marginHorizontal: 8,
  },
  summaryTrashBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#64748B',
  },
  breakdownVal: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#1E293B',
  },
  breakdownValGreen: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#16A34A',
  },
  summaryTotalPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 10,
  },
  summaryTotalPillLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#2563EB',
  },
  summaryTotalPillValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#2563EB',
  },
  speechBannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  speechMascotWrapper: {
    width: 44,
    height: 44,
    marginRight: 8,
  },
  speechMascotImg: {
    width: '100%',
    height: '100%',
  },
  speechBubblePill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  speechBubbleText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: '#475569',
  },
  createOrderActionBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  createOrderIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createOrderActionBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Customization Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
    marginRight: 12,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: 400,
  },
  fieldSection: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#1E293B',
    marginBottom: 8,
  },
  fieldHint: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: '#94A3B8',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  optionChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  optionName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#334155',
  },
  optionNameActive: {
    color: '#FFFFFF',
  },
  optionPrice: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: '#64748B',
    marginLeft: 6,
  },
  optionPriceActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalPriceText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#1E293B',
  },
  modalAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  modalAddBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },

  // Custom Alert
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  alertIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  alertTitle: { 
    fontFamily: 'Poppins-Bold', 
    fontSize: 18, 
    color: '#1E293B', 
    marginBottom: 8, 
    textAlign: 'center',
  },
  alertMessage: { 
    fontFamily: 'Poppins-Regular', 
    fontSize: 13, 
    color: '#64748B', 
    textAlign: 'center', 
    lineHeight: 20, 
    marginBottom: 20,
  },
  alertBtn: { 
    paddingVertical: 12, 
    paddingHorizontal: 36, 
    borderRadius: 14, 
    minWidth: 130, 
    alignItems: 'center',
  },
  alertBtnText: { 
    fontFamily: 'Poppins-Bold', 
    fontSize: 14, 
    color: '#FFFFFF',
  },
});
