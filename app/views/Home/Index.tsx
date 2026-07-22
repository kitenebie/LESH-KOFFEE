import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Dimensions,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ReAnimated, {
  ZoomIn,
} from 'react-native-reanimated';
import { Button } from '../../../components/UI/Button';
import { Colors } from '../../../components/UI/Colors';
import { Input } from '../../../components/UI/Input';
import GeneratedOrderQR from '../Cart/GeneratedOrderQR';
import CartView from '../Cart/Index';
import WalletView from '../Lesh-Wallet/index';
import NotificationView from '../Notification/Index';
import OrdersView from '../Orders/index';
import ProfileView from '../Profile/Index';
import StampCardView from '../StampCard/index';
import BestSellersPage from './BestSellersPage';
import HomeSkeleton from './HomeSkeleton';
import OurMenuPage from './OurMenuPage';
import PromoDiscount from './PromoDiscount';

import { useVideoPlayer, VideoView } from 'expo-video';

import { useRouter } from 'expo-router';
import { LoginRequiredModal } from '../../../components/UI/LoginRequiredModal';
import { getCartItems, saveCartItems, savePendingQROrder, getPendingQROrder, clearPendingQROrder } from '../../../lib/database';
import { useAppData } from '../../../lib/useAppData';
import { useAuth } from '../../../lib/useAuth';
import { createCheckout } from '../../../services/paymentService';
import api from '../../../lib/axios';
import { createOrder } from '../../../services/ordersService';
import CheckoutPage from '../Checkout/CheckoutPage';
import { ScannerPageContent } from '../admin/Scanner/index';
import CreateOrderPage from '../admin/CreateOrder/index';
import { logout } from '../../../services/authService';

const { width, height } = Dimensions.get('window');

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
  customizable?: boolean;
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

interface FlyingItem {
  id: string;
  anim: Animated.ValueXY;
  scale: Animated.Value;
}

export default function Home() {
  const { data: dummyData, isLoading, addOrderLocal } = useAppData();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const userRole = dummyData?.user?.role || 'user';
  const isSuperAdmin = userRole === 'super_admin';

  const [activeTab, setActiveTab] = useState<'Home' | 'Orders' | 'Wallet' | 'Profile' | 'Notification' | 'StampCard' | 'QRCode' | 'CreateOrder'>(isSuperAdmin ? 'QRCode' : 'Home');
  const [stampCardOrigin, setStampCardOrigin] = useState<'Home' | 'Profile'>('Home');

  // When role loads async, redirect super-admin to QRCode
  React.useEffect(() => {
    if (isSuperAdmin && activeTab === 'Home') {
      setActiveTab('QRCode');
    }
  }, [isSuperAdmin]);
 const [profileInitialSubView, setProfileInitialSubView] = useState<'Main' | 'Addresses'>('Main');
  const [generatedOrder, setGeneratedOrder] = useState<any>(null);
  const [homeSubView, setHomeSubView] = useState<'Main' | 'BestSellers' | 'OurMenu' | 'Promos'>('Main');
  const stampCardTranslateY = React.useRef(new Animated.Value(height)).current;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good morning,';
    } else if (hour >= 12 && hour < 18) {
      return 'Good afternoon,';
    } else {
      return 'Good evening,';
    }
  };

  // Video Player for the Capybara avatar
  const capyPlayer = useVideoPlayer(require('../../../assets/app/bara-video.mp4'), (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const navigateToStampCard = (from: 'Home' | 'Profile') => {
    setStampCardOrigin(from);
    setActiveTab('StampCard');
    stampCardTranslateY.setValue(height);
    Animated.spring(stampCardTranslateY, {
      toValue: 0,
      tension: 50,
      friction: 9,
      useNativeDriver: true,
    }).start();
  };

  const closeStampCard = () => {
    Animated.timing(stampCardTranslateY, {
      toValue: height,
      duration: 280,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setActiveTab(stampCardOrigin));
  };
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // 1. Digital Wallet & Subscription States
  const [walletBalance, setWalletBalance] = useState<number>(dummyData?.wallet?.balance ?? 0);
  const [activeSubscription, setActiveSubscription] = useState<string | null>(null);
  const [subscriptionBalance, setSubscriptionBalance] = useState<number>(0);

  // 2. Customization States (Loaded dynamically from dummyData.json)
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [customizerQty, setCustomizerQty] = useState<number>(1);
  const [customSize, setCustomSize] = useState<string>('Regular');
  const [customSweetness, setCustomSweetness] = useState<string>('100%');
  const [customMilk, setCustomMilk] = useState<string>('Full Cream');
  const [customAddons, setCustomAddons] = useState<string[]>([]);
  const [customSelections, setCustomSelections] = useState<Record<string, string[]>>({});

  // 3. Modals View States
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(200);
  const [customTopUpInput, setCustomTopUpInput] = useState<string>('');


  const [showUpsellModal, setShowUpsellModal] = useState<boolean>(false);

  const [showGiftModal, setShowGiftModal] = useState<boolean>(false);
  const [giftAmount, setGiftAmount] = useState<string>('');
  const [giftAmountError, setGiftAmountError] = useState<string>('');
  const [giftPhone, setGiftPhone] = useState<string>('');

  // Voucher Popup State
  const [showVoucherPopup, setShowVoucherPopup] = useState<boolean>(false);
  const [unclaimedVouchers, setUnclaimedVouchers] = useState<any[]>([]);
  const [claimingVoucherId, setClaimingVoucherId] = useState<number | null>(null);

  // Lifted voucher application states for CartView calculations
  const [appliedVouchers, setAppliedVouchers] = useState<{ code: string; discount: number; label: string; type?: string; max_discount?: number }[]>([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherStatus, setVoucherStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Checkout WebView State (Card / E-wallet payments)
  const [showCheckoutWebView, setShowCheckoutWebView] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [checkoutOrderId, setCheckoutOrderId] = useState('');
  const [checkoutPurpose, setCheckoutPurpose] = useState<'order' | 'topup' | 'subscription'>('order');
  const [pendingSubscription, setPendingSubscription] = useState<{ name: string; drinkCount: number; subscriptionId: number } | null>(null);
  const [pendingTopUpAmount, setPendingTopUpAmount] = useState<number>(0);

  // 4. Fulfillment & Payment states
  const [fulfillmentMode, setFulfillmentMode] = useState<'DineIn' | 'Delivery'>('DineIn');
  const [paymentMethod, setPaymentMethod] = useState<'Wallet' | 'CardEWallet' | 'COD'>('COD');

  // 5. Reusable Custom Alert Modal State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    showCancel?: boolean;
    hideButton?: boolean;
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: ''
  });

  // ==================== ANIMATION VALS & EFFECTS ====================
  const customizerScale = React.useRef(new Animated.Value(0.8)).current;
  const customizerOpacity = React.useRef(new Animated.Value(0)).current;
  const customizerTranslateX = React.useRef(new Animated.Value(0)).current;
  const customizerTranslateY = React.useRef(new Animated.Value(0)).current;
  const customizerBorderRadius = React.useRef(new Animated.Value(24)).current;

  const topUpScale = React.useRef(new Animated.Value(0.8)).current;
  const topUpOpacity = React.useRef(new Animated.Value(0)).current;

  const giftScale = React.useRef(new Animated.Value(0.8)).current;
  const giftOpacity = React.useRef(new Animated.Value(0)).current;

  const upsellScale = React.useRef(new Animated.Value(0.8)).current;
  const upsellOpacity = React.useRef(new Animated.Value(0)).current;

  const voucherScale = React.useRef(new Animated.Value(0.8)).current;
  const voucherOpacity = React.useRef(new Animated.Value(0)).current;

  const alertScale = React.useRef(new Animated.Value(0.8)).current;
  const alertOpacity = React.useRef(new Animated.Value(0)).current;

  const cartTabScale = React.useRef(new Animated.Value(1)).current;
  const notifTranslateX = React.useRef(new Animated.Value(width)).current;
  const cartTranslateX = React.useRef(new Animated.Value(width)).current;

  // Flying items array state
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);

  const isCartLoaded = React.useRef(false);

  // Load cart from SQLite on mount
  React.useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await getCartItems();
        if (savedCart && savedCart.length > 0) {
          setCart(savedCart);
        } else if (isLoggedIn) {
          // SQLite cart is empty but user is logged in — try loading from server
          try {
            const { getCart } = await import('../../../services/cartService');
            const serverCart = await getCart();
            if (serverCart.items && serverCart.items.length > 0) {
              const restoredCart = serverCart.items.map((item: any) => ({
                product: {
                  id: String(item.product?.id || item.product_id),
                  categoryId: item.product?.categoryId || String(item.product?.category_id || ''),
                  name: item.product?.name || '',
                  description: item.product?.description || '',
                  price: Number(item.product?.price || item.unit_price || 0),
                  rating: item.product?.rating || 0,
                  reviews: item.product?.reviews || 0,
                  isPopular: item.product?.isPopular || false,
                  image: item.product?.image || '',
                },
                quantity: item.quantity,
                customization: item.customization || undefined,
              }));
              setCart(restoredCart);
              if (serverCart.computed) setCartComputed(serverCart.computed);
            }
          } catch (e) {
            // Server fetch failed — start with empty cart
          }
        }
      } catch (error) {
        console.warn('Failed to load cart from SQLite:', error);
      } finally {
        isCartLoaded.current = true;
      }
    };
    loadCart();

    // Restore pending QR order if exists and not expired
    const loadPendingQR = async () => {
      try {
        const pendingOrder = await getPendingQROrder();
        if (pendingOrder) {
          setGeneratedOrder(pendingOrder);
        }
      } catch (error) {
        console.warn('Failed to load pending QR order:', error);
      }
    };
    loadPendingQR();
  }, []);

  // Flag to skip server sync when clearing cart for sign-out
  const isSigningOut = React.useRef(false);

  // Save cart to SQLite whenever it changes (after initial load)
  React.useEffect(() => {
    if (!isCartLoaded.current) return;
    const persistCart = async () => {
      try {
        await saveCartItems(cart);
      } catch (error) {
        console.warn('Failed to save cart to SQLite:', error);
      }
      // Sync to server
      if (isLoggedIn && cart.length > 0) {
        if (isSigningOut.current) return;
        try {
          const { syncCart } = await import('../../../services/cartService');
          await syncCart(cart.map(item => ({
            product_id: Number(item.product.id),
            quantity: item.quantity,
            customization: item.customization ? { selections: item.customization.selections } : null,
          })));
          // Fetch computed AFTER sync completes
          fetchCartComputed();
        } catch (e) {
          // Silent — server sync is best-effort
        }
      }
      // If cart is empty, clear on server too
      if (isLoggedIn && cart.length === 0 && !isSigningOut.current) {
        try {
          const { clearCart } = await import('../../../services/cartService');
          await clearCart();
        } catch (e) {}
      }
    };
    persistCart();
  }, [cart]);

  // Sync wallet balance when API data loads
  React.useEffect(() => {
    const apiBalance = dummyData?.wallet?.balance;
    if (apiBalance !== undefined && apiBalance !== null) setWalletBalance(apiBalance);
  }, [dummyData?.wallet?.balance]);

  // Sync subscription state when API data loads
  React.useEffect(() => {
    const sub = dummyData?.user?.activeSubscription;
    const subBal = dummyData?.user?.subscriptionBalance;
    if (sub && !activeSubscription) setActiveSubscription(sub);
    if (subBal && subBal > 0 && subscriptionBalance === 0) setSubscriptionBalance(subBal);
  }, [dummyData?.user?.activeSubscription, dummyData?.user?.subscriptionBalance]);

  // Customizer animations trigger
  React.useEffect(() => {
    if (customizingProduct) {
      Animated.parallel([
        Animated.spring(customizerScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: false }),
        Animated.timing(customizerOpacity, { toValue: 1, duration: 180, useNativeDriver: false })
      ]).start();
    }
  }, [customizingProduct, customizerScale, customizerOpacity]);

  // Top Up animations trigger
  React.useEffect(() => {
    if (showTopUpModal) {
      Animated.parallel([
        Animated.spring(topUpScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(topUpOpacity, { toValue: 1, duration: 180, useNativeDriver: true })
      ]).start();
    }
  }, [showTopUpModal, topUpScale, topUpOpacity]);

  // Gift Voucher animations trigger
  React.useEffect(() => {
    if (showGiftModal) {
      Animated.parallel([
        Animated.spring(giftScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(giftOpacity, { toValue: 1, duration: 180, useNativeDriver: true })
      ]).start();
    }
  }, [showGiftModal, giftScale, giftOpacity]);

  // Upsell animations trigger
  React.useEffect(() => {
    if (showUpsellModal) {
      Animated.parallel([
        Animated.spring(upsellScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(upsellOpacity, { toValue: 1, duration: 180, useNativeDriver: true })
      ]).start();
    }
  }, [showUpsellModal, upsellScale, upsellOpacity]);

  // Welcome voucher animations trigger
  React.useEffect(() => {
    if (showVoucherPopup) {
      Animated.parallel([
        Animated.spring(voucherScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(voucherOpacity, { toValue: 1, duration: 180, useNativeDriver: true })
      ]).start();
    }
  }, [showVoucherPopup, voucherScale, voucherOpacity]);

  // Custom alert animations trigger
  React.useEffect(() => {
    if (alertConfig.visible) {
      Animated.parallel([
        Animated.spring(alertScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(alertOpacity, { toValue: 1, duration: 180, useNativeDriver: true })
      ]).start();
    }
  }, [alertConfig.visible, alertScale, alertOpacity]);

  // Notification slide-in trigger
  React.useEffect(() => {
    if (activeTab === 'Notification') {
      notifTranslateX.setValue(width);
      Animated.spring(notifTranslateX, {
        toValue: 0,
        tension: 50,
        friction: 8.5,
        useNativeDriver: true
      }).start();
    }
  }, [activeTab, notifTranslateX]);

  // Cart slide-in trigger from header
  const openCartView = () => {
    fetchCartComputed();
    Animated.spring(cartTranslateX, {
      toValue: 0,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const closeCartView = () => {
    Animated.spring(cartTranslateX, {
      toValue: width,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  // ==================== ANIMATION CLOSING TRIGGERS ====================
  const closeCustomizer = () => {
    Animated.parallel([
      Animated.timing(customizerScale, { toValue: 0.8, duration: 120, useNativeDriver: false }),
      Animated.timing(customizerOpacity, { toValue: 0, duration: 120, useNativeDriver: false })
    ]).start(() => setCustomizingProduct(null));
  };

  const closeTopUp = () => {
    Animated.parallel([
      Animated.timing(topUpScale, { toValue: 0.8, duration: 120, useNativeDriver: true }),
      Animated.timing(topUpOpacity, { toValue: 0, duration: 120, useNativeDriver: true })
    ]).start(() => {
      setShowTopUpModal(false);
      setCustomTopUpInput('');
    });
  };

  React.useEffect(() => {
    if (showTopUpModal) {
      setCustomTopUpInput('');
      setTopUpAmount(200);
    }
  }, [showTopUpModal]);

  const closeGift = () => {
    Animated.parallel([
      Animated.timing(giftScale, { toValue: 0.8, duration: 120, useNativeDriver: true }),
      Animated.timing(giftOpacity, { toValue: 0, duration: 120, useNativeDriver: true })
    ]).start(() => setShowGiftModal(false));
  };

  const closeUpsell = () => {
    Animated.parallel([
      Animated.timing(upsellScale, { toValue: 0.8, duration: 120, useNativeDriver: true }),
      Animated.timing(upsellOpacity, { toValue: 0, duration: 120, useNativeDriver: true })
    ]).start(() => setShowUpsellModal(false));
  };

  const closeVoucher = () => {
    Animated.parallel([
      Animated.timing(voucherScale, { toValue: 0.8, duration: 120, useNativeDriver: true }),
      Animated.timing(voucherOpacity, { toValue: 0, duration: 120, useNativeDriver: true })
    ]).start(() => setShowVoucherPopup(false));
  };

  const closeAlert = () => {
    Animated.parallel([
      Animated.timing(alertScale, { toValue: 0.8, duration: 120, useNativeDriver: true }),
      Animated.timing(alertOpacity, { toValue: 0, duration: 120, useNativeDriver: true })
    ]).start(() => {
      if (alertConfig.onConfirm) {
        alertConfig.onConfirm();
      }
      setAlertConfig((prev) => ({ ...prev, visible: false }));
    });
  };

  const dismissAlert = () => {
    Animated.parallel([
      Animated.timing(alertScale, { toValue: 0.8, duration: 120, useNativeDriver: true }),
      Animated.timing(alertOpacity, { toValue: 0, duration: 120, useNativeDriver: true })
    ]).start(() => {
      setAlertConfig((prev) => ({ ...prev, visible: false }));
    });
  };

  const closeNotification = () => {
    Animated.timing(notifTranslateX, {
      toValue: width,
      duration: 220,
      useNativeDriver: true
    }).start(() => {
      setActiveTab('Home');
    });
  };

  const showAlert = (title: string, message: string, onConfirm?: () => void, hideButton?: boolean, showCancel?: boolean) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      hideButton,
      showCancel,
      onConfirm
    });
  };

  // Pulse cart tab when item lands
  const pulseCartTab = () => {
    Animated.sequence([
      Animated.spring(cartTabScale, { toValue: 1.3, tension: 150, friction: 3, useNativeDriver: true }),
      Animated.spring(cartTabScale, { toValue: 1, tension: 150, friction: 5, useNativeDriver: true })
    ]).start();
  };

  // Spawn flying item transition
  const triggerFlyToCart = (startX: number, startY: number) => {
    const id = Math.random().toString();
    const anim = new Animated.ValueXY({ x: startX - 16, y: startY - 16 });
    const scale = new Animated.Value(1);

    setFlyingItems((prev) => [...prev, { id, anim, scale }]);

    const endX = (width / 4) * 1.5 - 16;
    const endY = height - (Platform.OS === 'ios' ? 70 : 50);

    Animated.parallel([
      Animated.spring(anim, {
        toValue: { x: endX, y: endY },
        tension: 30,
        friction: 6,
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.4, duration: 250, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.1, duration: 350, useNativeDriver: true })
      ])
    ]).start(() => {
      setFlyingItems((prev) => prev.filter((item) => item.id !== id));
      pulseCartTab();
    });
  };

  // Trigger Voucher Claim
  const handleClaimVoucher = async (voucherId: number) => {
    const { claimVoucher } = await import('../../../services/vouchersService');
    setClaimingVoucherId(voucherId);
    try {
      const result = await claimVoucher(voucherId);
      if (result?.success) {
        // Remove from unclaimed list
        setUnclaimedVouchers((prev) => prev.filter((v) => v.id !== voucherId));
        showAlert('Voucher Claimed! 🎟️', result.message || 'Voucher has been added to your wallet.');
        // Close if no more unclaimed vouchers
        if (unclaimedVouchers.length <= 1) {
          closeVoucher();
        }
      } else {
        showAlert('Error', result?.message || 'Failed to claim voucher.');
      }
    } catch (err) {
      showAlert('Error', 'Network error. Please try again.');
    } finally {
      setClaimingVoucherId(null);
    }
  };

  // Fetch unclaimed vouchers on mount
  React.useEffect(() => {
    if (!isLoggedIn || isSuperAdmin) return;
    const fetchUnclaimed = async () => {
      try {
        const { getUnclaimedVouchers } = await import('../../../services/vouchersService');
        const vouchers = await getUnclaimedVouchers();
        if (vouchers && vouchers.length > 0) {
          setUnclaimedVouchers(vouchers);
          setShowVoucherPopup(true);
        }
      } catch (err) {
        // Silently fail — no voucher popup if offline
      }
    };
    fetchUnclaimed();
  }, [isLoggedIn]);



  // Trigger Gift Card sharing
  const handleSendGift = () => {
    const amount = Number(giftAmount);
    if (!giftAmount || isNaN(amount) || amount < 100) {
      setGiftAmountError('Minimum gift amount is ₱100');
      return;
    }
    setGiftAmountError('');
    if (!giftPhone || giftPhone.length < 10) {
      showAlert('Invalid Input', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (walletBalance < amount) {
      showAlert('Insufficient Funds', 'Please top up your wallet before sending a gift.');
      return;
    }
    setWalletBalance(walletBalance - amount);
    closeGift();
    showAlert(
      'Gift Sent! 🎁',
      `Foam Gift of ₱${amount} has been sent. Notification shared to +63 ${giftPhone} via WhatsApp.`
    );
    setGiftPhone('');
    setGiftAmount('');
  };

  // Add to Cart handler
  const handleAddClick = (product: Product, event?: any) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    const touchX = event?.nativeEvent?.pageX || (width / 2);
    const touchY = event?.nativeEvent?.pageY || (height / 2);

    const productId = product.id;
    const config = (dummyData as any).customizationOptions?.[productId];

    if (config && product.customizable) {
      setCustomizingProduct(product);
      setCustomizerQty(1);
      
      const dynamicConfig = config.customizations || config;
      const initialSelections: Record<string, string[]> = {};
      if (dynamicConfig) {
        Object.entries(dynamicConfig).forEach(([key, val]: [string, any]) => {
          if (val && typeof val === 'object' && val.options && val.options.length > 0) {
            if (!val.isMultiSelect) {
              initialSelections[key] = [val.options[0].name];
            } else {
              initialSelections[key] = [];
            }
          }
        });
      }
      setCustomSelections(initialSelections);

      // Backwards compatibility fallbacks
      const sizesObj = dynamicConfig?.['size'] || dynamicConfig?.['sizes'];
      const sweetnessObj = dynamicConfig?.['sweetness'] || dynamicConfig?.['sweetness Level'];
      const milkObj = dynamicConfig?.['milk'] || dynamicConfig?.['milk Choice'];

      setCustomSize(sizesObj ? sizesObj.options[0].name : 'Regular');
      setCustomSweetness(sweetnessObj ? sweetnessObj.options[0].name : '100%');
      setCustomMilk(milkObj ? milkObj.options[0].name : 'Full Cream');
      setCustomAddons([]);
    } else {
      const existingIndex = cart.findIndex((item) => item.product.id === product.id && !item.customization);
      if (existingIndex > -1) {
        const newCart = [...cart];
        newCart[existingIndex].quantity += 1;
        setCart(newCart);
      } else {
        setCart([...cart, { product, quantity: 1 }]);
      }
      triggerFlyToCart(touchX, touchY);
      showAlert('Added to Cart', `${product.name} has been added to your shopping cart.`);
    }
  };

  // Confirm custom item handler
  const handleConfirmCustomization = (event?: any) => {
    if (!customizingProduct) return;

    const productId = customizingProduct.id;
    const config = (dummyData as any).customizationOptions?.[productId];
    const customizationConfig = config?.customizations || config || {};

    let extraPrice = 0;
    const customParts: string[] = [];

    // Calculate extra price and description from dynamic customSelections
    Object.entries(customizationConfig).forEach(([key, val]: [string, any]) => {
      if (!val || typeof val !== 'object' || !val.options) return;

      const selections = customSelections[key] || [];
      selections.forEach((selName) => {
        const optionObj = val.options.find((o: any) => o.name === selName);
        if (optionObj) {
          extraPrice += Number(optionObj.price || 0);
        }
      });

      if (!val.isMultiSelect) {
        const defaultName = val.options[0]?.name;
        if (selections[0] && (selections[0] !== defaultName || key.toLowerCase() === 'size')) {
          customParts.push(selections[0]);
        }
      } else {
        if (selections.length > 0) {
          customParts.push('+' + selections.join('+'));
        }
      }
    });

    const finalPrice = Number(customizingProduct.price) + extraPrice;

    // Fallbacks for backward compatible customization object fields
    const sizeSelection = customSelections['size']?.[0] || customSelections['sizes']?.[0] || customSize || 'Regular';
    const milkSelection = customSelections['milk']?.[0] || customSelections['milk Choice']?.[0] || (config.milk ? customMilk : undefined);
    const sweetnessSelection = customSelections['sweetness']?.[0] || customSelections['sweetness Level']?.[0] || (config.sweetness ? customSweetness : undefined);
    const addonsSelection = customSelections['addons'] || customSelections['Add-ons'] || customAddons || [];

    const customizedProduct: Product = {
      ...customizingProduct,
      name: `${customizingProduct.name} (${customParts.join(', ')})`,
      price: finalPrice
    };

    // Check if the exact customization already exists in the cart
    const existingIndex = cart.findIndex((item) => 
      item.product.id === customizedProduct.id && 
      JSON.stringify(item.customization?.selections) === JSON.stringify(customSelections)
    );

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += customizerQty;
      setCart(newCart);
    } else {
      setCart([...cart, { 
        product: customizedProduct, 
        quantity: customizerQty,
        customization: {
          size: sizeSelection,
          sweetness: sweetnessSelection,
          milk: milkSelection,
          addons: addonsSelection,
          price: finalPrice,
          selections: customSelections
        }
      }]);
    }

    // Start all morph and fly animations on the JS thread to prevent layout driver mismatch errors
    Animated.parallel([
      Animated.timing(customizerBorderRadius, {
        toValue: 200,
        duration: 350,
        useNativeDriver: false,
      }),
      Animated.timing(customizerScale, {
        toValue: 0.05,
        duration: 650,
        useNativeDriver: false,
      }),
      Animated.timing(customizerTranslateX, {
        toValue: width / 2 - 40,
        duration: 650,
        useNativeDriver: false,
      }),
      Animated.timing(customizerTranslateY, {
        toValue: -height / 2 + (Platform.OS === 'ios' ? 70 : 50),
        duration: 650,
        useNativeDriver: false,
      }),
      Animated.timing(customizerOpacity, {
        toValue: 0,
        duration: 650,
        useNativeDriver: false,
      })
    ]).start(() => {
      setCustomizingProduct(null);
      // Reset values back to defaults for next open
      customizerScale.setValue(0.8);
      customizerOpacity.setValue(0);
      customizerTranslateX.setValue(0);
      customizerTranslateY.setValue(0);
      customizerBorderRadius.setValue(24);
      
      pulseCartTab();
      showAlert('Customization Added', `${customizedProduct.name} customized & added to cart.`);
    });
  };

  // Toggle addons selections
  const toggleAddon = (addon: string) => {
    if (customAddons.includes(addon)) {
      setCustomAddons(customAddons.filter((a) => a !== addon));
    } else {
      setCustomAddons([...customAddons, addon]);
    }
  };

  // Increment Cart Item Qty
  const handleIncrementQty = (index: number) => {
    const newCart = [...cart];
    newCart[index].quantity += 1;
    setCart(newCart);
  };

  // Decrement/Remove Cart Item Qty
  const handleDecrementQty = (index: number) => {
    const newCart = [...cart];
    if (newCart[index].quantity > 1) {
      newCart[index].quantity -= 1;
    } else {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  // Filtered products list
  const filteredProducts = dummyData.products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularProducts = dummyData.products.filter((p) => p.isPopular);

  // Cart totals
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  // ─── SERVER-COMPUTED CART STATE ─────────────────────────────────────
  // All calculations come from the server (CartCalculationService)
  const [cartComputed, setCartComputed] = React.useState<any>({
    subtotal: 0, delivery_fee: 0, subscription_discount: 0, subscription_items_covered: 0,
    voucher_discount: 0, applied_vouchers: [], perk_discount: 0, perks_applied: [],
    total_discount: 0, total: 0, item_count: 0,
  });

  // Fetch computed cart from server whenever cart changes
  const fetchCartComputed = React.useCallback(async () => {
    if (!isLoggedIn || cart.length === 0) {
      setCartComputed({ subtotal: 0, delivery_fee: 0, subscription_discount: 0, subscription_items_covered: 0, subscription_name: null, voucher_discount: 0, applied_vouchers: [], perk_discount: 0, perks_applied: [], total_discount: 0, total: 0, item_count: 0 });
      return;
    }
    try {
      const { getCart } = await import('../../../services/cartService');
      const result = await getCart();
      if (result.computed) {
        setCartComputed(result.computed);
      }
    } catch (e) {
      // Fallback: basic local calculation if server unavailable
      const localTotal = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
      setCartComputed(prev => ({ ...prev, subtotal: localTotal, total: localTotal, subscription_name: null, applied_vouchers: [] }));
    }
  }, [isLoggedIn, cart]);

  // Sync meta to server when fulfillment/vouchers/subscription change, then re-fetch computed
  React.useEffect(() => {
    if (!isLoggedIn || cart.length === 0) return;
    const syncMeta = async () => {
      try {
        const { updateCartMeta } = await import('../../../services/cartService');
        await updateCartMeta({
          fulfillment_mode: fulfillmentMode,
          applied_voucher_codes: appliedVouchers.map(v => v.code),
          use_subscription: subscriptionBalance > 0,
          subscription_items_to_use: subscriptionBalance,
        });
        fetchCartComputed();
      } catch (e) {}
    };
    syncMeta();
  }, [fulfillmentMode, appliedVouchers, subscriptionBalance]);

  // Destructure server-computed values for easy access
  const cartTotal = cartComputed.subtotal;
  const deliveryFee = cartComputed.delivery_fee;
  const subscriptionDiscount = cartComputed.subscription_discount;
  const voucherDiscount = cartComputed.voucher_discount;
  const perkDiscount = cartComputed.perk_discount;
  const perksApplied = cartComputed.perks_applied || [];
  const grandTotal = cartComputed.total;

  // Wallet top-up execution
  const executeTopUp = async () => {
    let parsedAmount = topUpAmount;
    if (topUpAmount === 0) {
      parsedAmount = parseFloat(customTopUpInput);
      if (isNaN(parsedAmount) || parsedAmount < 100) {
        showAlert('Invalid Amount', 'Custom top-up amount must be at least ₱100.00.');
        return;
      }
    }

    closeTopUp();
    showAlert('Processing...', 'Generating payment link for wallet top-up.', undefined, true);

    const userId = dummyData?.user?.id || '1';
    const paramId = `TOPUP-${userId}-${parsedAmount}`;

    const result = await createCheckout({
      amount: parsedAmount,
      order_id: paramId,
      description: `Foam Wallet Top-Up - ₱${parsedAmount.toFixed(2)}`,
      email: dummyData?.user?.email || undefined,
      contact: dummyData?.user?.phone || undefined,
      name: dummyData?.user?.name || undefined,
    });

    if (result.success && result.data?.checkout_url) {
      setCheckoutUrl(result.data.checkout_url);
      setCheckoutOrderId(paramId);
      setCheckoutPurpose('topup');
      setPendingTopUpAmount(parsedAmount);
      setAlertConfig(prev => ({ ...prev, visible: false }));
      setShowCheckoutWebView(true);
    } else {
      showAlert('Payment Error', result.message || 'Failed to generate payment link. Please try again.');
    }
  };
  // Buy a subscription
  const handleBuySubscription = async (subName: string, price: number, drinkCount: number, subscriptionId?: number) => {
    showAlert('Processing...', 'Generating payment link for subscription.', undefined, true);

    const userId = dummyData?.user?.id || '1';
    const subId = subscriptionId || 1;
    const paramId = `SUB-${userId}-${subId}`;

    const result = await createCheckout({
      amount: price,
      order_id: paramId,
      description: `Foam Subscription - "${subName}" (${drinkCount} drinks)`,
      email: dummyData?.user?.email || undefined,
      contact: dummyData?.user?.phone || undefined,
      name: dummyData?.user?.name || undefined,
    });

    if (result.success && result.data?.checkout_url) {
      setCheckoutUrl(result.data.checkout_url);
      setCheckoutOrderId(paramId);
      setCheckoutPurpose('subscription');
      setPendingSubscription({ name: subName, drinkCount, subscriptionId: subId });
      setAlertConfig(prev => ({ ...prev, visible: false }));
      setShowCheckoutWebView(true);
    } else {
      showAlert('Payment Error', result.message || 'Failed to generate payment link. Please try again.');
    }
  };
  

  // Proceed checkout flow
  const handleCheckoutClick = async () => {
    // Cash payment (both DineIn and Delivery)
    if (paymentMethod === 'COD') {
      const drinkItemsCount = cart.filter((item) => item.product.categoryId === 'drinks')
                                  .reduce((sum, item) => sum + item.quantity, 0);
      const drinksCovered = subscriptionBalance > 0 && drinkItemsCount > 0 
        ? Math.min(subscriptionBalance, drinkItemsCount) 
        : 0;
      if (drinksCovered > 0) {
        setSubscriptionBalance(subscriptionBalance - drinksCovered);
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      if (fulfillmentMode === 'Delivery') {
        const orderId = `LK-DEL-${Math.floor(10000 + Math.random() * 90000)}`;
        const defaultAddress = dummyData?.user?.addresses?.find((addr: any) => addr.isDefault)?.address || 'Manila Gate Road, Manila, Philippines';

        closeCartView();
        showAlert('Placing Order... ☕', 'Sending your delivery order to the store. Please wait...', undefined, true);

        try {
          const createdServerOrder = await createOrder({
            order_number: orderId,
            fulfillment: fulfillmentMode,
            table_no: 'Delivery',
            cashier: 'Online',
            delivery_address: defaultAddress,
            subtotal: cartTotal,
            delivery_fee: deliveryFee,
            discount: subscriptionDiscount + voucherDiscount + perkDiscount,
            subscription_discount: subscriptionDiscount,
            voucher_discount: voucherDiscount,
            perk_discount: perkDiscount,
            voucherCode: appliedVouchers.map(v => v.code).join(',') || null,
            subscription_items_used: subscriptionDiscount > 0 ? Math.min(subscriptionBalance, cart.filter(i => i.product.categoryId === 'drinks').reduce((s, i) => s + i.quantity, 0)) : 0,
            total: grandTotal,
            payment_method: 'COD',
            items: cart.map(item => {
              const basePrice = Number(item.product.price);
              const extraPrice = item.customization?.price ? (Number(item.customization.price) - basePrice) : 0;
              return {
                product_id: Number(item.product.id),
                name: item.product.name,
                quantity: item.quantity,
                price: basePrice + extraPrice,
                customization: item.customization || null,
              };
            })
          });

          const deliveryOrder = {
            id: createdServerOrder?.order_number || orderId,
            order_number: createdServerOrder?.order_number || orderId,
            user_id: Number(dummyData?.user?.id || 0),
            date: dateStr,
            time: timeStr,
            status: 'Preparing',
            currentStep: 'preparing' as const,
            fulfillment: fulfillmentMode,
            ref_no: 'Delivery',
            cashier: 'Online',
            payment_method: 'COD',
            lineItems: cart.map(item => {
              const bp = Number(item.product.price);
              const ep = item.customization?.price ? (Number(item.customization.price) - bp) : 0;
              return {
                name: item.product.name,
                qty: item.quantity,
                price: bp + ep,
              };
            }),
            items: cart.map(item => {
              const bp = Number(item.product.price);
              const ep = item.customization?.price ? (Number(item.customization.price) - bp) : 0;
              return {
                product_id: Number(item.product.id),
                name: item.product.name,
                quantity: item.quantity,
                price: bp + ep,
                customization: item.customization || null,
              };
            }),
            subtotal: cartTotal,
            deliveryFee: deliveryFee,
            discount: subscriptionDiscount + voucherDiscount + perkDiscount,
            total: grandTotal,
            voucherCode: appliedVouchers.map(v => v.code).join(',') || null,
            voucherDiscount: voucherDiscount,
            subscriptionDiscount: subscriptionDiscount,
            perkDiscount: perkDiscount,
            subscription_items_used: subscriptionDiscount > 0 ? Math.min(subscriptionBalance, cart.filter(i => i.product.categoryId === 'drinks').reduce((s, i) => s + i.quantity, 0)) : 0,
            createdAt: new Date().toISOString(),
          };

          addOrderLocal(deliveryOrder);

          setCart([]);
          setAppliedVouchers([]);
          setVoucherCode('');
          setVoucherStatus('idle');
          setActiveTab('Orders');
          showAlert(
            'Order Placed! 🛵',
            `Your delivery order (${deliveryOrder.order_number}) has been placed via COD for ₱${grandTotal.toFixed(2)}.`
          );
        } catch (err) {
          showAlert('Order Error', 'Failed to place delivery order. Please try again.');
        }
        return;
      }

      const dineInOrder = {
        order_number: `LK-QR-${Math.floor(10000 + Math.random() * 90000)}`,
        user_id: Number(dummyData?.user?.id || 0),
        date: dateStr,
        time: timeStr,
        status: 'Preparing',
        currentStep: 'preparing' as const,
        fulfillment: fulfillmentMode,
        ref_no: dummyData.user.tableNo || '04',
        cashier: dummyData.user.cashier || 'Jocelyn',
        payment_method: 'cash',
        items: cart.map(item => {
          const basePrice = Number(item.product.price);
          const extraPrice = item.customization?.price ? (Number(item.customization.price) - basePrice) : 0;
          const unitPrice = basePrice + extraPrice;
          return {
          product_id: Number(item.product.id),
          name: item.product.name,
          quantity: item.quantity,
          price: unitPrice,
          customization: item.customization || null,
          };
        }),
        subtotal: cartTotal,
        delivery_fee: deliveryFee,
        discount: subscriptionDiscount + voucherDiscount + perkDiscount,
        total: grandTotal,
        voucherCode: appliedVouchers.map(v => v.code).join(',') || null,
        voucherDiscount: voucherDiscount,
        subscriptionDiscount: subscriptionDiscount,
        perkDiscount: perkDiscount,
        subscription_items_used: subscriptionDiscount > 0 ? Math.min(subscriptionBalance, cart.filter(i => i.product.categoryId === 'drinks').reduce((s, i) => s + i.quantity, 0)) : 0,
        createdAt: new Date().toISOString(),
      };

      addOrderLocal(dineInOrder);

      // NOTE: Order is NOT created on the server here.
      // The QR code is shown to the cashier/admin who scans it
      // and creates the order from the admin panel.

      setCart([]);
      setAppliedVouchers([]);
      setVoucherCode('');
      setVoucherStatus('idle');
      closeCartView();
      setGeneratedOrder(dineInOrder);
      savePendingQROrder(dineInOrder).catch(err => console.warn('Failed to save pending QR:', err));
      return;
    }

    // Card / E-wallet → Call payment API → open WebView
    if (paymentMethod === 'CardEWallet') {
      handleCardEwalletPayment();
      return;
    }

    // Foam Wallet → direct charge
    executeFinalCheckout(false);
  };

  // Handle Card / E-wallet payment via BUX.ph checkout
  const handleCardEwalletPayment = async () => {
    const orderId = `LK-${Math.floor(10000 + Math.random() * 90000)}`;

    // Build description from cart items
    const itemDetails = cart.map(item => 
      `${item.quantity}x ${item.product.name}${item.customization ? ` (${item.customization.size || ''})` : ''} - PHP${(item.product.price * item.quantity).toFixed(2)}`
    ).join(', ');
    const description = `${orderId}: ${itemDetails}`;

    closeCartView();
    showAlert('Preparing Your Order ☕', 'Processing payment. Please wait...', undefined, true);

    // Pre-create order on backend first so it exists for the webhook to update
    try {
      await createOrder({
        order_number: orderId,
        fulfillment: fulfillmentMode,
        table_no: dummyData.user.tableNo || '04',
        cashier: dummyData.user.cashier || 'Jocelyn',
        subtotal: cartTotal,
        delivery_fee: deliveryFee,
        discount: subscriptionDiscount + voucherDiscount + perkDiscount,
        subscription_discount: subscriptionDiscount,
        voucher_discount: voucherDiscount,
        perk_discount: perkDiscount,
        voucherCode: appliedVouchers.map(v => v.code).join(',') || null,
        subscription_items_used: subscriptionDiscount > 0 ? Math.min(subscriptionBalance, cart.filter(i => i.product.categoryId === 'drinks').reduce((s, i) => s + i.quantity, 0)) : 0,
        total: grandTotal,
        payment_method: 'card',
        items: cart.map(item => {
          const bp = Number(item.product.price);
          const ep = item.customization?.price ? (Number(item.customization.price) - bp) : 0;
          return {
          product_id: Number(item.product.id),
          name: item.product.name,
          quantity: item.quantity,
          price: bp + ep,
          customization: item.customization,
          };
        })
      });
    } catch (err) {
      console.warn('Failed to pre-create order on backend:', err);
    }

    const result = await createCheckout({
      amount: grandTotal,
      order_id: orderId,
      description: description.length > 250 ? description.substring(0, 247) + '...' : description,
      email: dummyData?.user?.email || undefined,
      contact: dummyData?.user?.phone || undefined,
      name: dummyData?.user?.name || undefined,
    });

    if (result.success && result.data?.checkout_url) {
      setCheckoutUrl(result.data.checkout_url);
      setCheckoutOrderId(orderId);
      setCheckoutPurpose('order');
      setAlertConfig(prev => ({ ...prev, visible: false }));
      setShowCheckoutWebView(true);
    } else {
      showAlert('Payment Error', result.message || 'Failed to generate payment link. Please try again.');
    }
  };

  // Handle payment success from WebView
  const handlePaymentSuccess = async () => {
    setShowCheckoutWebView(false);

    if (checkoutPurpose === 'topup') {
      // ─── WALLET TOP-UP SUCCESS ───
      const amount = pendingTopUpAmount;
      setWalletBalance(walletBalance + amount);
      setPendingTopUpAmount(0);
      showAlert(
        'Top-Up Successful! 💳',
        `₱${amount.toFixed(2)} has been loaded into your Foam Digital Wallet.`
      );

    } else if (checkoutPurpose === 'subscription') {
      // ─── SUBSCRIPTION PURCHASE SUCCESS ───
      if (pendingSubscription) {
        // Call server to create subscription (in case webhook is delayed)
        try {
          const subRes = await api.post('/subscriptions/subscribe', {
            subscription_id: pendingSubscription.subscriptionId,
          });
          if (subRes.data?.success && subRes.data?.data) {
            setActiveSubscription(pendingSubscription.name);
            setSubscriptionBalance(subRes.data.data.drinks_remaining || pendingSubscription.drinkCount);
          } else {
            setActiveSubscription(pendingSubscription.name);
            setSubscriptionBalance(pendingSubscription.drinkCount);
          }
        } catch (e) {
          // Webhook may have already processed it — just set local state
          setActiveSubscription(pendingSubscription.name);
          setSubscriptionBalance(pendingSubscription.drinkCount);
        }
        showAlert(
          'Subscription Activated! ☕',
          `"${pendingSubscription.name}" purchased successfully. ${pendingSubscription.drinkCount} drink credits are now active.`
        );
        setPendingSubscription(null);
      }

    } else {
      // ─── ORDER PAYMENT SUCCESS ───
      // Mark order as paid on server (in case webhook hasn't arrived yet)
      try {
        const { markOrderPaid } = await import('../../../services/ordersService');
        await markOrderPaid(checkoutOrderId);
      } catch (e) {
        // Webhook will handle it eventually
        console.warn('[Payment] Failed to mark order paid directly:', e);
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const newOrder = {
        id: checkoutOrderId,
        date: dateStr,
        time: timeStr,
        status: 'Preparing',
        currentStep: 'preparing' as const,
        fulfillment: fulfillmentMode,
        tableNo: dummyData.user.tableNo || '04',
        cashier: dummyData.user.cashier || 'Jocelyn',
        lineItems: cart.map(item => {
          const bp = Number(item.product.price);
          const ep = item.customization?.price ? (Number(item.customization.price) - bp) : 0;
          return {
          name: item.product.name,
          qty: item.quantity,
          price: bp + ep,
          };
        }),
        subtotal: cartTotal,
        deliveryFee: deliveryFee,
        discount: subscriptionDiscount + voucherDiscount + perkDiscount,
        total: grandTotal,
        voucherCode: appliedVouchers.map(v => v.code).join(',') || null,
        voucherDiscount: voucherDiscount,
        subscriptionDiscount: subscriptionDiscount,
        perkDiscount: perkDiscount,
        subscription_items_used: subscriptionDiscount > 0 ? Math.min(subscriptionBalance, cart.filter(i => i.product.categoryId === 'drinks').reduce((s, i) => s + i.quantity, 0)) : 0,
      };

      addOrderLocal(newOrder);
      setCart([]);
      setAppliedVouchers([]);
      setVoucherCode('');
      setVoucherStatus('idle');
      showAlert('Payment Successful! 🎉', `Order ${checkoutOrderId} has been paid. Your order is now being prepared.`);
      setActiveTab('Home');
    }
  };

  // Final checkout logic
  const executeFinalCheckout = async (addPastry: boolean) => {
    closeUpsell();
    let finalTotal = grandTotal;
    
    if (addPastry) {
      finalTotal += 65; 
    }

    const drinkItemsCount = cart.filter((item) => item.product.categoryId === 'drinks')
                                .reduce((sum, item) => sum + item.quantity, 0);

    const drinksCovered = subscriptionBalance > 0 && drinkItemsCount > 0 
      ? Math.min(subscriptionBalance, drinkItemsCount) 
      : 0;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const lineItems = cart.map(item => {
      const bp = Number(item.product.price);
      const ep = item.customization?.price ? (Number(item.customization.price) - bp) : 0;
      return {
      name: item.product.name,
      qty: item.quantity,
      price: bp + ep,
      };
    });
    if (addPastry) {
      lineItems.push({
        name: 'Classic Butter Croissant',
        qty: 1,
        price: 65
      });
    }

    const newOrder = {
      id: `LK-${Math.floor(10000 + Math.random() * 90000)}`,
      date: dateStr,
      time: timeStr,
      status: 'Preparing',
      currentStep: 'preparing' as const,
      fulfillment: fulfillmentMode,
      tableNo: dummyData.user.tableNo || '04',
      cashier: dummyData.user.cashier || 'Jocelyn',
      lineItems,
      subtotal: cartTotal + (addPastry ? 65 : 0),
      deliveryFee: deliveryFee,
      discount: subscriptionDiscount + voucherDiscount + perkDiscount,
      total: finalTotal,
      voucherCode: appliedVouchers.map(v => v.code).join(',') || null,
      voucherDiscount: voucherDiscount,
      subscriptionDiscount: subscriptionDiscount,
      perkDiscount: perkDiscount,
      subscription_items_used: subscriptionDiscount > 0 ? Math.min(subscriptionBalance, cart.filter(i => i.product.categoryId === 'drinks').reduce((s, i) => s + i.quantity, 0)) : 0,
    };

    if (paymentMethod === 'Wallet') {
      if (walletBalance < finalTotal) {
        showAlert('Insufficient Funds', 'Your wallet balance is too low. Please top up before checking out.');
        return;
      }
    } else if (paymentMethod === 'CardEWallet') {
      if (drinksCovered > 0) {
        showAlert(
          'Checkout Complete! 🎉',
          `${drinksCovered} drinks redeemed from Subscription.\n₱${finalTotal.toFixed(2)} charged to Card & E-wallet.`
        );
      } else {
        showAlert(
          'Order Placed! ☕',
          `Successfully purchased! ₱${finalTotal.toFixed(2)} has been charged to your Card & E-wallet account.`
        );
      }
    } else {
      if (drinksCovered > 0) {
        showAlert(
          'Checkout Complete! 🎉',
          `${drinksCovered} drinks redeemed from Subscription.\nPay remaining ₱${finalTotal.toFixed(2)} via Cash.`
        );
      } else {
        showAlert(
          'Order Confirmed! ☕',
          fulfillmentMode === 'DineIn'
            ? `Please pay ₱${finalTotal.toFixed(2)} at the counter. Present your digital ticket to the barista.`
            : `Please pay ₱${finalTotal.toFixed(2)} via Cash on Delivery (COD).`
        );
      }
    }

    addOrderLocal(newOrder);

    // Send order to backend — for wallet payments, server debits the wallet
    const orderResult = await createOrder({
      order_number: newOrder.id,
      fulfillment: newOrder.fulfillment,
      table_no: newOrder.tableNo,
      cashier: newOrder.cashier,
      subtotal: newOrder.subtotal,
      delivery_fee: newOrder.deliveryFee,
      discount: newOrder.discount,
      subscription_discount: subscriptionDiscount,
      voucher_discount: voucherDiscount,
      perk_discount: perkDiscount,
      voucherCode: appliedVouchers.map(v => v.code).join(',') || null,
      subscription_items_used: subscriptionDiscount > 0 ? Math.min(subscriptionBalance, cart.filter(i => i.product.categoryId === 'drinks').reduce((s, i) => s + i.quantity, 0)) : 0,
      total: newOrder.total,
      payment_method: paymentMethod === 'Wallet' ? 'wallet' : paymentMethod === 'CardEWallet' ? 'card' : 'COD',
      items: cart.map(item => ({
        product_id: Number(item.product.id),
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        customization: item.customization
      }))
    });

    // Handle wallet payment result
    if (paymentMethod === 'Wallet') {
      if (orderResult) {
        // Server debited successfully — update local balance
        setWalletBalance(walletBalance - finalTotal);
        showAlert(
          'Order Placed! ☕',
          `₱${finalTotal.toFixed(2)} has been charged to your Foam Digital Wallet.`
        );
      } else {
        // Server debit failed — show error, don't clear cart
        showAlert('Payment Failed', 'Could not process wallet payment. Please try again.');
        return;
      }
    }

    if (drinksCovered > 0) {
      setSubscriptionBalance(subscriptionBalance - drinksCovered);
    }
    setCart([]);
    setAppliedVouchers([]);
    setVoucherCode('');
    setVoucherStatus('idle');
    closeCartView();
    setActiveTab('Home');
  };

  // Show full-screen loading while data is being fetched after login
  if (isLoading && !dummyData?.user?.id) {
    return (
      <View style={styles.fullLoadingScreen}>
        <ActivityIndicator size="large" color={Colors.primary.default} />
        <Text style={styles.fullLoadingText}>Loading your experience...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. MAIN CONTENT (Depends on active tab) */}
      <View style={styles.mainContent}>
        {!isSuperAdmin && activeTab === 'Home' && isLoading ? (
          <HomeSkeleton />
        ) : !isSuperAdmin && activeTab === 'Home' && (
          homeSubView === 'BestSellers' ? (
            <BestSellersPage
              products={popularProducts as any}
              onBack={() => setHomeSubView('Main')}
              onAddProduct={(product, event) => handleAddClick(product as any, event)}
            />
          ) : homeSubView === 'OurMenu' ? (
            <OurMenuPage
              products={dummyData.products as any}
              categories={dummyData.categories as any}
              onBack={() => setHomeSubView('Main')}
              onAddProduct={(product, event) => handleAddClick(product as any, event)}
            />
          ) : homeSubView === 'Promos' ? (
            (() => {
              const uniqueVouchersMap = new Map();
              
              // 1. Add unclaimed available vouchers (from database)
              (unclaimedVouchers || []).forEach((v: any) => {
                if (v && v.code) {
                  uniqueVouchersMap.set(v.code, {
                    id: v.id,
                    code: v.code,
                    discount: v.discount,
                    label: v.label,
                    type: v.type || 'percent',
                    min_order_amount: v.min_order_amount,
                    max_discount: v.max_discount,
                  });
                }
              });
              
              // 2. Add claimed user vouchers
              (dummyData.vouchers || []).forEach((v: any) => {
                if (v && v.code) {
                  uniqueVouchersMap.set(v.code, {
                    id: v.id || v.voucher_id,
                    code: v.code,
                    discount: v.discount,
                    label: v.label,
                    type: v.type || 'percent',
                    min_order_amount: v.min_order_amount,
                    max_discount: v.max_discount,
                  });
                }
              });
              
              const combinedVouchers = Array.from(uniqueVouchersMap.values());

              return (
                <PromoDiscount
                  promos={dummyData.promos as any}
                  claimedVoucherCodes={dummyData.vouchers?.map((v: any) => v.code) || []}
                  vouchers={combinedVouchers}
                  onBack={() => setHomeSubView('Main')}
                  onSendGift={() => {
                    setHomeSubView('Main');
                    setShowGiftModal(true);
                  }}
                  showAlert={showAlert}
                />
              );
            })()
          ) : (
            <View style={{ flex: 1 }}>
              {/* Floating Top Header Section */}
              <View style={styles.floatingHeaderContainer}>
                {/* Header Greeting & Group Order Trigger */}
                <View style={styles.homeHeader}>
                  <View>
                    <Text style={styles.greetingText}>{getGreeting()}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Text style={styles.userNameText}>
                        {isLoggedIn && dummyData?.user?.firstName
                          ? (dummyData.user.firstName.length > 7
                              ? `${dummyData.user.firstName.substring(0, 7)}...`
                              : dummyData.user.firstName)
                          : 'Guest'}
                      </Text>
                      {isLoggedIn && (
                        <VideoView
                          style={styles.wavingVideo}
                          player={capyPlayer}
                          allowsPictureInPicture={false}
                          nativeControls={false}
                          contentFit="cover"
                          surfaceType="textureView"
                        />
                      )}
                    </View>
                  </View>
                  <View style={styles.headerRightActions}>
                    {/* Cart Icon beside notification */}
                    <TouchableOpacity 
                      style={styles.cartIconBtn} 
                      onPress={openCartView}
                    >
                      <View style={{ position: 'relative' }}>
                        <Ionicons name="cart-outline" size={20} color={Colors.primary.default} />
                        {cartCount > 0 && (
                          <View style={styles.headerCartBadge}>
                            <Text style={styles.headerCartBadgeText}>{cartCount}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.notificationIconBtn} 
                      onPress={() => setActiveTab('Notification')}
                    >
                      <Ionicons name="notifications-outline" size={20} color={Colors.primary.default} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('Profile')}>
                      {isLoggedIn && dummyData?.user?.avatar ? (
                        <Image
                          source={{ uri: dummyData.user.avatar }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.avatarVideoWrapper}>
                          <VideoView
                            style={styles.avatarVideo}
                            player={capyPlayer}
                            allowsPictureInPicture={false}
                            nativeControls={false}
                            contentFit="cover"
                            surfaceType="textureView"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Custom Search Input */}
                <View style={styles.searchSection}>
                  <Input
                    placeholder="Search food, coffee, or treats..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    leftIcon={<Ionicons name="search-outline" size={20} color={Colors.primary.default} />}
                    rightIcon={
                      searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                          <Ionicons name="close-circle" size={18} color={Colors.neutral.gray500} />
                        </TouchableOpacity>
                      ) : null
                    }
                  />
                </View>
              </View>


              {/* Scrollable Feed Section */}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollFeedContainer}>
              
              {/* POINTS & LOYALTY CARD TEASER */}
              {searchQuery === '' && isLoggedIn && (
              <ReAnimated.View entering={ZoomIn.delay(200).duration(400)} style={styles.loyaltyTeaserCard}>
                 {/* Background Waves (Simulated) */}
                <View style={styles.loyaltyBgWaveDark} pointerEvents="none" />
                <View style={styles.loyaltyBgWaveLight} pointerEvents="none" />

                <View style={styles.loyaltyTopRow}>
                  {/* Left: 3D Cloud Logo & Sparkles */}
                  <View style={styles.loyaltyLogoContainer}>
                    <Image source={require('../../../assets/app/logo.png')} style={styles.loyaltyCloudImg} resizeMode="contain" />
                    <Ionicons name="sparkles" size={12} color="#FFFFFF" style={styles.loyaltySparkle1} />
                    <Ionicons name="sparkle" size={10} color="#FFFFFF" style={styles.loyaltySparkle2} />
                  </View>
                   {/* Middle: Text and Badge */}
                  <View style={styles.loyaltyCenterText}>
                    <View style={styles.loyaltyPointsHeaderRow}>
                      <Text style={styles.loyaltyTitleText}>Foam Loyalty Points</Text>
                      <Ionicons name="information-circle-outline" size={12} color="#1D5FA7" style={{ marginLeft: 4 }} />
                    </View>
                    <View style={styles.loyaltyPointsValRow}>
                      <Text style={styles.loyaltyPointsBigText}>{(Number(dummyData?.user?.loyaltyPoints) || 100).toLocaleString()}</Text>
                      <Text style={styles.loyaltyPointsLabelText}>Points</Text>
                    </View>
                    <View style={styles.loyaltyPraiseBadge}>
                      <Ionicons name="star" size={10} color="#F59E0B" style={{ marginRight: 4 }} />
                      <Text style={styles.loyaltyPraiseText}>You're doing great!</Text>
                    </View>
                  </View>

                  {/* Right: View Stamps Button */}
                  <TouchableOpacity 
                    style={styles.loyaltyViewStampsBtn}
                    onPress={() => navigateToStampCard('Home')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="gift" size={20} color="#1D5FA7" style={{ marginBottom: 4 }} />
                    <Text style={styles.loyaltyViewStampsBtnText}>View</Text>
                    <Text style={styles.loyaltyViewStampsBtnText}>Stamps</Text>
                  </TouchableOpacity>
                </View>

                {/* Bottom: Progress Area */}
                <View style={styles.loyaltyBottomRow}>
                  <Text style={styles.loyaltyProgressCupsText}>
                    <Text style={{ fontFamily: 'Poppins-Bold', color: '#1D5FA7' }}>
                      {dummyData.stamps?.achievements?.[0]?.collected || 0} of {dummyData.stamps?.achievements?.[0]?.required || 8}
                    </Text> cups collected for a free drink!
                  </Text>
                  
                  <View style={styles.loyaltyProgressSection}>
                    <View style={styles.loyaltyProgressLeftCol}>
                      {/* Cups Track */}
                      <View style={styles.loyaltyCupsList}>
                        {Array.from({ length: dummyData.stamps?.achievements?.[0]?.required || 8 }).map((_, i) => (
                          <Ionicons 
                            key={i} 
                            name="cafe-outline" 
                            size={18} 
                            color={i < (dummyData.stamps?.achievements?.[0]?.collected || 0) ? '#1D5FA7' : '#A0C4E8'} 
                          />
                        ))}
                      </View>
                      
                      {/* Progress Line Track */}
                      <View style={styles.loyaltyProgressLineBg}>
                        <View style={[styles.loyaltyProgressLineFill, { width: `${Math.min(100, Math.max(5, ((dummyData.stamps?.achievements?.[0]?.collected || 0) / (dummyData.stamps?.achievements?.[0]?.required || 1)) * 100))}%` }]} />
                        <View style={[styles.loyaltyProgressLineDot, { left: `${Math.min(100, Math.max(0, ((dummyData.stamps?.achievements?.[0]?.collected || 0) / (dummyData.stamps?.achievements?.[0]?.required || 1)) * 100))}%` }]} />
                      </View>
                    </View>

                    {/* Target Badge */}
                    <View style={styles.loyaltyCupsTargetBadge}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="cafe-outline" size={16} color="#1D5FA7" style={{ marginRight: 2 }} />
                        <Text style={styles.loyaltyCupsTargetBadgeVal}>{dummyData.stamps?.achievements?.[0]?.required || 8}</Text>
                      </View>
                      <Text style={styles.loyaltyCupsTargetBadgeLabel}>Cups</Text>
                    </View>
                  </View>
                </View>
              </ReAnimated.View>
            )}
            
            {/* PROMOS & DISCOUNTS CAROUSEL */}
            {searchQuery === '' && (
              <ReAnimated.View entering={ZoomIn.delay(300).duration(400)} style={styles.promoSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Promos & Discounts</Text>
                  <TouchableOpacity onPress={() => setHomeSubView('Promos')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.seeMoreText}>See More</Text>
                    <Ionicons name="chevron-forward" size={14} color="#2D78CD" style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoScroll}>
                  {dummyData.promos.map((promo, idx) => {
                    const isFirst = idx % 2 === 0;
                    return (
                       <View 
                        key={promo.id || idx} 
                        style={[
                          styles.promoCardWrapper, 
                          isFirst ? styles.promoCardBlue : styles.promoCardPeach
                        ]}
                      >
                        {/* Background Decor (only for Blue card) */}
                        {isFirst && (
                          <View style={styles.promoBlueRaysContainer}>
                            <View style={styles.promoBlueRay1} />
                            <View style={styles.promoBlueRay2} />
                            <View style={styles.promoBlueRay3} />
                          </View>
                        )}

                        <View style={styles.promoCardContentInner}>
                          {/* Top Pill Badge */}
                          <View style={[styles.promoTopBadge, isFirst ? styles.promoTopBadgeBlue : styles.promoTopBadgePeach]}>
                            <Ionicons name={isFirst ? "time-outline" : "flame"} size={10} color={isFirst ? "#FFFFFF" : "#D25400"} />
                            <Text style={[styles.promoTopBadgeText, isFirst ? styles.promoTopBadgeTextBlue : styles.promoTopBadgeTextPeach]}>
                              {isFirst ? "Limited Time" : "Weekend Deal"}
                            </Text>
                          </View>

                          {/* Titles */}
                          <Text style={[styles.promoLargeHeading, isFirst ? styles.promoTextWhite : styles.promoTextDark]}>
                            {promo.heading || (isFirst ? "50% OFF" : "Buy 1\nGet 1")}
                          </Text>
                          <Text style={[styles.promoSubHeading, isFirst ? styles.promoTextWhite : styles.promoTextDark]}>
                            {promo.subheading || (isFirst ? "on your 1st order!" : "On selected drinks")}
                          </Text>

                          {/* Code Box */}
                          <View style={[styles.promoCodeBox, isFirst ? styles.promoCodeBoxBlue : styles.promoCodeBoxPeach]}>
                            <Text style={[styles.promoCodeBoxText, isFirst ? styles.promoTextWhite : styles.promoTextDark]}>CODE</Text>
                            <View style={[styles.promoCodeBoxDivider, isFirst ? styles.promoCodeBoxDividerBlue : styles.promoCodeBoxDividerPeach]} />
                            <Text style={[styles.promoCodeBoxVal, isFirst ? styles.promoTextWhite : styles.promoTextDark]}>
                              {promo.code || (isFirst ? "LESH50" : "BOGO")}
                            </Text>
                          </View>

                          {/* Bottom Row */}
                          <View style={styles.promoBottomRow}>
                            <Text style={[styles.promoTermsText, isFirst ? styles.promoTextWhite : styles.promoTextDark]}>
                              T&Cs apply.
                            </Text>
                            {isFirst && (
                              <View style={styles.promoDeliveryBadge}>
                                <Ionicons name="bicycle" size={10} color="#FFFFFF" />
                                <Text style={styles.promoDeliveryBadgeText}>Free delivery</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        {/* Right Side Image for all cards */}
                        <View style={styles.promoRightImageContainer}>
                          <Image 
                            source={typeof promo.image === 'string' && promo.image ? { uri: promo.image } : (promo.image || require('../../../assets/app/latte-art.jpg'))} 
                            style={styles.promoLatteImg} 
                            resizeMode="cover"
                            defaultSource={require('../../../assets/app/logo.png')}
                          />
                        </View>
                      </View>
                                          );
                  })}
                </ScrollView>
                </ReAnimated.View>
            )}
            {/* BEST SELLERS MENU */}
            {searchQuery === '' && (
              <ReAnimated.View entering={ZoomIn.delay(400).duration(400)} style={styles.popularSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Best Sellers Menu</Text>
                  <TouchableOpacity onPress={() => setHomeSubView('BestSellers')}>
                    <Text style={styles.seeMoreText}>See More</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularScroll}>
                  {popularProducts.map((prod) => (
                    <View key={prod.id} style={styles.popularCard}>
                      <Image source={{ uri: prod.image }} style={styles.popularImage} />
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#F4A261" />
                        <Text style={styles.ratingText}>{prod.rating}</Text>
                      </View>
                      <View style={styles.popularCardContent}>
                        <Text style={styles.popularName} numberOfLines={1}>{prod.name}</Text>
                        <Text style={styles.popularPrice}>₱{prod.price.toFixed(2)}</Text>
                        <TouchableOpacity
                          style={styles.addButton}
                          onPress={(e) => handleAddClick(prod as any, e)}
                        >
                          <Ionicons name="add" size={18} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </ReAnimated.View>
            )}

            {/* CATEGORIES SCROLL */}
            <ReAnimated.View entering={ZoomIn.delay(500).duration(400)} style={styles.categorySection}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.categoryScroll}
                keyboardShouldPersistTaps="handled"
              >
                {dummyData.categories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryBtn, isActive && styles.categoryBtnActive]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={16}
                        color={isActive ? '#FFFFFF' : Colors.primary.default}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </ReAnimated.View>

            {/* Menu Grid Product List */}
            <ReAnimated.View entering={ZoomIn.delay(600).duration(400)} style={styles.gridSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Our Menu</Text>
                <TouchableOpacity onPress={() => setHomeSubView('OurMenu')}>
                  <Text style={styles.seeMoreText}>See More</Text>
                </TouchableOpacity>
              </View>
              {filteredProducts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="cafe-outline" size={48} color={Colors.neutral.gray400} />
                  <Text style={styles.emptyText}>No matches found in our menu.</Text>
                </View>
              ) : (
                <View style={styles.productGrid}>
                  {filteredProducts.slice(0, 10).map((prod) => (
                    <View key={prod.id} style={styles.gridCard}>
                      <Image source={{ uri: prod.image }} style={styles.gridImage} />
                      <View style={styles.ratingBadgeMini}>
                        <Ionicons name="star" size={10} color="#F4A261" />
                        <Text style={styles.ratingTextMini}>{prod.rating}</Text>
                      </View>
                      {prod.customizable && (dummyData as any).customizationOptions?.[prod.id] && (
                        <View style={styles.customizableMini}>
                          <Ionicons name="options-outline" size={9} color={Colors.secondary.default} />
                          <Text style={styles.customizableMiniText}>Custom</Text>
                        </View>
                      )}
                      <View style={styles.gridContent}>
                        <Text style={styles.gridName} numberOfLines={1}>{prod.name}</Text>
                        <Text style={styles.gridDesc} numberOfLines={1}>{prod.description}</Text>
                        <View style={styles.gridFooter}>
                          <Text style={styles.gridPrice}>₱{prod.price.toFixed(2)}</Text>
                          <TouchableOpacity
                            style={styles.addButtonMini}
                            onPress={(e) => handleAddClick(prod as any, e)}
                          >
                            <Ionicons name="add" size={16} color="#FFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* See more full button below the grid */}
              {filteredProducts.length > 10 && (
                <View style={styles.seeMoreBtnWrapper}>
                  <TouchableOpacity
                    style={styles.seeMoreFullBtn}
                    onPress={() => setHomeSubView('OurMenu')}
                  >
                    <Text style={styles.seeMoreFullBtnText}>See Full Menu</Text>
                    <Ionicons name="arrow-forward" size={16} color={Colors.secondary.default} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              )}
            </ReAnimated.View>



            {/* STORE LOCATION & CONTACT INFO */}
            {searchQuery === '' && (
              <ReAnimated.View entering={ZoomIn.delay(900).duration(400)} style={styles.storeInfoCard}>
                <Text style={styles.storeInfoTitle}>{dummyData.store.name}</Text>
                <Text style={styles.storeInfoSubtitle}>{dummyData.store.tagline}</Text>
                
                <View style={styles.storeDetailRow}>
                  <Ionicons name="location-outline" size={16} color={Colors.primary.default} style={styles.storeIcon} />
                  <Text style={styles.storeDetailText}>{dummyData.store.address}</Text>
                </View>

                <View style={styles.storeDetailRow}>
                  <Ionicons name="call-outline" size={16} color={Colors.primary.default} style={styles.storeIcon} />
                  <Text style={styles.storeDetailText}>{dummyData.store.phone}</Text>
                </View>

                <View style={styles.storeDetailRow}>
                  <Ionicons name="mail-outline" size={16} color={Colors.primary.default} style={styles.storeIcon} />
                  <Text style={styles.storeDetailText}>{dummyData.store.email}</Text>
                </View>

                <View style={styles.storeDetailRow}>
                  <Ionicons name="time-outline" size={16} color={Colors.primary.default} style={styles.storeIcon} />
                  <Text style={styles.storeDetailText}>{dummyData.store.hours}</Text>
                </View>
              </ReAnimated.View>
            )}
          </ScrollView>
            </View>
          )
        )}

        {/* MODULAR ORDERS VIEW */}
        {!isSuperAdmin && activeTab === 'Orders' && (
          <OrdersView />
        )}

        {/* MODULAR WALLET VIEW */}
        {!isSuperAdmin && activeTab === 'Wallet' && (
          <WalletView
            walletBalance={walletBalance}
            setShowTopUpModal={setShowTopUpModal}
            activeSubscription={activeSubscription}
            subscriptionBalance={subscriptionBalance}
            handleBuySubscription={handleBuySubscription}
            showAlert={showAlert}
            onOrderGenerated={(order) => {
              setGeneratedOrder(order);
              savePendingQROrder(order).catch(err => console.warn('Failed to save pending QR:', err));
            }}
          />
        )}

        {/* MODULAR NOTIFICATION VIEW */}
        {!isSuperAdmin && activeTab === 'Notification' && (
          <Animated.View style={{ flex: 1, transform: [{ translateX: notifTranslateX }] }}>
            <NotificationView onBack={closeNotification} />
          </Animated.View>
        )}

        {/* MODULAR PROFILE VIEW */}
        {!isSuperAdmin && activeTab === 'Profile' && (
          <ProfileView
            showAlert={showAlert}
            onNavigateToStamps={() => navigateToStampCard('Profile')}
            initialSubView={profileInitialSubView}
            onClearInitialSubView={() => setProfileInitialSubView('Main')}
          />
        )}

        {/* ADMIN: QR CODE VIEW */}
        {activeTab === 'QRCode' && isSuperAdmin && (
          <ScannerPageContent />
        )}

        {/* ADMIN: CREATE ORDER VIEW */}
        {activeTab === 'CreateOrder' && isSuperAdmin && (
          <CreateOrderPage />
        )}

        {/* MODULAR STAMP CARD VIEW (Rendered as sliding overlay at root) */}
      </View>

      {/* 2. FIXED BOTTOM NAVIGATION BAR */}
      {isSuperAdmin ? (
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('QRCode')}
        >
          <Ionicons
            name={activeTab === 'QRCode' ? 'qr-code' : 'qr-code-outline'}
            size={22}
            color={activeTab === 'QRCode' ? Colors.primary.default : Colors.neutral.gray500}
          />
          <Text style={[styles.navText, activeTab === 'QRCode' && styles.navTextActive]}>
            QR Code
          </Text>
          {activeTab === 'QRCode' && <View style={styles.activeNavIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('CreateOrder')}
        >
          <Ionicons
            name={activeTab === 'CreateOrder' ? 'create' : 'create-outline'}
            size={22}
            color={activeTab === 'CreateOrder' ? Colors.primary.default : Colors.neutral.gray500}
          />
          <Text style={[styles.navText, activeTab === 'CreateOrder' && styles.navTextActive]}>
            Create Order
          </Text>
          {activeTab === 'CreateOrder' && <View style={styles.activeNavIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            showAlert(
              'Sign Out',
              'Are you sure you want to sign out?',
              async () => {
                isSigningOut.current = true;
                await logout();
                const { clearAllCache } = await import('../../../lib/database');
                await clearAllCache();
                router.replace('/');
              },
              false,
              true
            );
          }}
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color={Colors.danger.default}
          />
          <Text style={[styles.navText, { color: Colors.danger.default }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
      ) : (
      <View style={styles.bottomNav}> 
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('Home')}
        >
          <Ionicons 
            name={activeTab === 'Home' ? 'home' : 'home-outline'} 
            size={22} 
            color={activeTab === 'Home' ? Colors.primary.default : Colors.neutral.gray500} 
          />
          <Text style={[styles.navText, activeTab === 'Home' && styles.navTextActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => {
            if (!isLoggedIn) { setShowLoginModal(true); return; }
            setActiveTab('Orders');
          }}
        >
          <Ionicons 
            name={activeTab === 'Orders' ? 'receipt' : 'receipt-outline'} 
            size={22} 
            color={activeTab === 'Orders' ? Colors.primary.default : Colors.neutral.gray500} 
          />
          <Text style={[styles.navText, activeTab === 'Orders' && styles.navTextActive]}>
            Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => {
            if (!isLoggedIn) { setShowLoginModal(true); return; }
            setActiveTab('Wallet');
          }}
        >
          <Ionicons 
            name={activeTab === 'Wallet' ? 'wallet' : 'wallet-outline'} 
            size={22} 
            color={activeTab === 'Wallet' ? Colors.primary.default : Colors.neutral.gray500} 
          />
          <Text style={[styles.navText, activeTab === 'Wallet' && styles.navTextActive]}>
            Foam Wallet
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => {
            if (!isLoggedIn) { setShowLoginModal(true); return; }
            setActiveTab('Profile');
          }}
        >
          <Ionicons 
            name={activeTab === 'Profile' ? 'person' : 'person-outline'} 
            size={22} 
            color={activeTab === 'Profile' ? Colors.primary.default : Colors.neutral.gray500} 
          />
          <Text style={[styles.navText, activeTab === 'Profile' && styles.navTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
      )}
{/* ==================== ANIMATION LAYER (FLYING PRODUCTS) ==================== */}
      {flyingItems.map((item) => (
        <Animated.View
          key={item.id}
          style={[
            styles.flyingItem,
            {
              transform: [
                { translateX: item.anim.x },
                { translateY: item.anim.y },
                { scale: item.scale }
              ]
            }
          ]}
        >
          <View style={styles.flyingIndicatorInner}>
            <Ionicons name="cafe" size={14} color="#FAF9F5" />
          </View>
        </Animated.View>
      ))}
 {/* ==================== INTERACTIVE      {/* CUSTOMIZATION MODAL */}
      {customizingProduct && (() => {
        const customizingProductId = customizingProduct.id;
        const productCustomConfig = (dummyData as any).customizationOptions?.[customizingProductId];

        const calculatedCustomPrice = (() => {
          let base = Number(customizingProduct.price) || 0;
          const dynamicConfig = productCustomConfig?.customizations || productCustomConfig;
          if (dynamicConfig) {
            Object.entries(dynamicConfig).forEach(([key, val]: [string, any]) => {
              if (!val || typeof val !== 'object' || !val.options) return;
              const selections = customSelections[key] || [];
              selections.forEach((selName) => {
                const optionObj = val.options.find((o: any) => o.name === selName);
                if (optionObj) base += Number(optionObj.price || 0);
              });
            });
          }
          return base;
        })();
        
        return (
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContentCustomizer,
                {
                  opacity: customizerOpacity,
                  borderRadius: customizerBorderRadius,
                  transform: [
                    { scale: customizerScale },
                    { translateX: customizerTranslateX },
                    { translateY: customizerTranslateY }
                  ]
                }
              ]}
            >
              {/* Modal Top Header */}
              <View style={styles.customizerHeaderRow}>
                <View style={styles.customizerHeaderLeft}>
                  <View style={styles.customizerTitleIconCircle}>
                    <Ionicons name="cafe" size={20} color="#1D5FA7" />
                  </View>
                  <View>
                    <Text style={styles.customizerModalTitle}>
                      {customizingProduct.categoryId === 'drinks' ? 'Customize Drink' : 'Customize Item'}
                    </Text>
                    <Text style={styles.customizerModalSubtitle}>Make it yours, enjoy it your way.</Text>
                  </View>
                </View>
                
                <TouchableOpacity onPress={closeCustomizer} style={styles.customizerCloseBtn} activeOpacity={0.8}>
                  <Ionicons name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.customizerScrollContent} showsVerticalScrollIndicator={false}>
                {/* Product Teaser Hero Card */}
                <View style={styles.customizerHeroCard}>
                  {/* Left Product Image */}
                  <View style={styles.customizerHeroImgContainer}>
                    <Image source={{ uri: customizingProduct.image }} style={styles.customizerHeroImg} resizeMode="cover" />
                    <View style={styles.customizerRatingBadge}>
                      <Ionicons name="star" size={10} color="#F59E0B" style={{ marginRight: 2 }} />
                      <Text style={styles.customizerRatingText}>{customizingProduct.rating || '4.8'}</Text>
                    </View>
                  </View>

                  {/* Right Product Details */}
                  <View style={styles.customizerHeroDetails}>
                    <View style={styles.customizerPraiseTag}>
                      <Ionicons name="star" size={9} color="#2563EB" style={{ marginRight: 3 }} />
                      <Text style={styles.customizerPraiseTagText}>CLASSIC FAVORITE</Text>
                    </View>

                    <Text style={styles.customizerHeroTitle} numberOfLines={1}>{customizingProduct.name}</Text>

                    {/* Roast / Bean Strength Indicators */}
                    <View style={styles.customizerBeansRow}>
                      {Array.from({ length: 5 }).map((_, bIdx) => (
                        <Ionicons 
                          key={bIdx} 
                          name="cafe" 
                          size={12} 
                          color={bIdx < 4 ? "#78350F" : "#CBD5E1"} 
                          style={{ marginRight: 3 }} 
                        />
                      ))}
                    </View>

                    <Text style={styles.customizerHeroDesc} numberOfLines={3}>
                      {customizingProduct.description || 'Rich espresso combined with steamed milk and a deep layer of thick foam.'}
                    </Text>

                    {/* Info Pill */}
                    <View style={styles.customizerInfoPillRow}>
                      <View style={styles.customizerInfoPill}>
                        <Ionicons name="flame" size={10} color="#EF4444" style={{ marginRight: 3 }} />
                        <Text style={styles.customizerInfoPillText}>120 kcal</Text>
                        <Text style={styles.customizerInfoDivider}>|</Text>
                        <Ionicons name="cafe" size={10} color="#1D5FA7" style={{ marginRight: 3 }} />
                        <Text style={styles.customizerInfoPillText}>Medium Strength</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Dynamic Option Groups */}
                {productCustomConfig && Object.entries(productCustomConfig.customizations || productCustomConfig).map(([fieldName, fieldConfig]: [string, any]) => {
                  if (!fieldConfig || typeof fieldConfig !== 'object' || !fieldConfig.options) return null;

                  const isMultiSelect = fieldConfig.isMultiSelect;
                  const selections = customSelections[fieldName] || [];
                  const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
                  const lowerName = fieldName.toLowerCase();

                  // Group header icon
                  let groupIcon = "options-outline";
                  let groupSub = `Choose your ${lowerName}`;
                  if (lowerName.includes('milk')) {
                    groupIcon = "nutrition-outline";
                    groupSub = "Choose your preferred milk";
                  } else if (lowerName.includes('size')) {
                    groupIcon = "cafe-outline";
                    groupSub = "Choose your size";
                  } else if (lowerName.includes('sweet')) {
                    groupIcon = "cube-outline";
                    groupSub = "Select sweetness level";
                  } else if (lowerName.includes('addon')) {
                    groupIcon = "sparkles-outline";
                    groupSub = "Add extra toppings";
                  }

                  return (
                    <View key={fieldName} style={styles.customizerOptionGroupCard}>
                      {/* Group Header */}
                      <View style={styles.customizerGroupHeader}>
                        <View style={styles.customizerGroupIconCircle}>
                          <Ionicons name={groupIcon as any} size={16} color="#1D5FA7" />
                        </View>
                        <View>
                          <Text style={styles.customizerGroupTitle}>{label}</Text>
                          <Text style={styles.customizerGroupSubtitle}>{groupSub}</Text>
                        </View>
                      </View>

                      {/* Selectable Options Row / Grid */}
                      <View style={styles.customizerOptionsContainer}>
                        {fieldConfig.options.map((opt: any) => {
                          const isChecked = selections.includes(opt.name);

                          // Sublabel for size (e.g. 12 oz, 16 oz)
                          let subSizeText = "";
                          if (lowerName.includes('size')) {
                            if (opt.name.toLowerCase().includes('regular')) subSizeText = "12 oz";
                            else if (opt.name.toLowerCase().includes('medium')) subSizeText = "16 oz";
                            else if (opt.name.toLowerCase().includes('large')) subSizeText = "20 oz";
                          }

                          return (
                            <TouchableOpacity
                              key={opt.name}
                              style={[
                                styles.customizerSelectCard,
                                isChecked && styles.customizerSelectCardActive
                              ]}
                              activeOpacity={0.8}
                              onPress={() => {
                                if (isMultiSelect) {
                                  let newSels = [...selections];
                                  if (isChecked) newSels = newSels.filter(s => s !== opt.name);
                                  else newSels.push(opt.name);
                                  setCustomSelections({ ...customSelections, [fieldName]: newSels });
                                  if (lowerName === 'addons') setCustomAddons(newSels);
                                } else {
                                  setCustomSelections({ ...customSelections, [fieldName]: [opt.name] });
                                  if (lowerName === 'size' || lowerName === 'sizes') setCustomSize(opt.name);
                                  else if (lowerName === 'sweetness') setCustomSweetness(opt.name);
                                  else if (lowerName === 'milk') setCustomMilk(opt.name);
                                }
                              }}
                            >
                              {/* Selected Checkmark Badge */}
                              {isChecked && (
                                <View style={styles.customizerCheckBadge}>
                                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                                </View>
                              )}

                              {/* Option Icon (if applicable) */}
                              {lowerName.includes('milk') && (
                                <Ionicons 
                                  name={opt.name.toLowerCase().includes('cream') ? "water-outline" : (opt.name.toLowerCase().includes('oat') ? "leaf-outline" : "cube-outline")} 
                                  size={18} 
                                  color={isChecked ? "#2563EB" : "#64748B"} 
                                  style={{ marginBottom: 4 }}
                                />
                              )}

                              <Text style={[styles.customizerSelectText, isChecked && styles.customizerSelectTextActive]}>
                                {opt.label || opt.name} {opt.price > 0 ? `(+₱${opt.price})` : ''}
                              </Text>

                              {subSizeText !== "" && (
                                <Text style={[styles.customizerSubSizeText, isChecked && styles.customizerSubSizeTextActive]}>
                                  {subSizeText}
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}

                {/* Cloud Banner */}
                <View style={styles.customizerCloudBanner}>
                  <Image source={require('../../../assets/app/logo.png')} style={styles.customizerCloudBannerImg} resizeMode="contain" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.customizerCloudBannerTitle}>Customization makes it perfect!</Text>
                    <Text style={styles.customizerCloudBannerSubtitle}>You're one step closer to your perfect cup.</Text>
                  </View>
                  <Ionicons name="sparkles" size={16} color="#3B82F6" />
                </View>
              </ScrollView>

              {/* Modal Footer Controls */}
              <View style={styles.customizerFooter}>
                <View style={styles.customizerFooterTopRow}>
                  {/* Quantity Counter */}
                  <View style={styles.customizerQtyContainer}>
                    <TouchableOpacity 
                      style={styles.customizerQtyBtn}
                      onPress={() => setCustomizerQty(prev => Math.max(1, prev - 1))}
                    >
                      <Ionicons name="remove" size={14} color="#334155" />
                    </TouchableOpacity>
                    
                    <Text style={styles.customizerQtyVal}>{customizerQty}</Text>
                    
                    <TouchableOpacity 
                      style={styles.customizerQtyBtn}
                      onPress={() => setCustomizerQty(prev => prev + 1)}
                    >
                      <Ionicons name="add" size={14} color="#334155" />
                    </TouchableOpacity>
                  </View>

                  {/* Calculated Price */}
                  <Text style={styles.customizerPriceText}>
                    ₱{(calculatedCustomPrice * customizerQty).toFixed(2)}
                  </Text>
                </View>

                {/* Action Buttons Row */}
                <View style={styles.customizerActionRow}>
                  <TouchableOpacity 
                    style={styles.customizerAddToCartBtn} 
                    activeOpacity={0.85}
                    onPress={(e) => handleConfirmCustomization(e)}
                  >
                    <Ionicons name="cart-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.customizerAddToCartText}>Add to Cart</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.customizerWishlistBtn} activeOpacity={0.85}>
                    <Ionicons name="heart-outline" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>
        );
      })()}

      {/* WALLET TOP-UP MODAL */}
      {showTopUpModal && (
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContentSmall, { opacity: topUpOpacity, transform: [{ scale: topUpScale }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Top Up Wallet</Text>
              <TouchableOpacity onPress={closeTopUp}>
                <Ionicons name="close-circle" size={24} color={Colors.primary.default} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabelText}>Select Top-Up Amount</Text>
              <View style={styles.topUpAmountRow}>
                {([200, 500, 1000, 'Custom'] as const).map((opt) => {
                  const isCustom = opt === 'Custom';
                  const isActive = isCustom ? topUpAmount === 0 : topUpAmount === opt;

                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.topUpAmtBtn, isActive && styles.topUpAmtBtnActive]}
                      onPress={() => {
                        if (isCustom) {
                          setTopUpAmount(0);
                        } else {
                          setTopUpAmount(opt);
                          setCustomTopUpInput('');
                        }
                      }}
                    >
                      <Text style={[styles.topUpAmtText, isActive && styles.topUpAmtTextActive]}>
                        {isCustom ? 'Custom' : `₱${opt}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {topUpAmount === 0 && (
                <View style={{ marginTop: 4, marginBottom: 16 }}>
                  <Text style={styles.inputLabelText}>Enter Custom Amount</Text>
                  <Input
                    keyboardType="numeric"
                    placeholder="Minimum ₱100"
                    value={customTopUpInput}
                    onChangeText={setCustomTopUpInput}
                  />
                </View>
              )}



              <Button
                title="Confirm Load"
                variant="primary"
                onPress={executeTopUp}
                style={styles.modalBtnMargin}
              />
            </View>
          </Animated.View>
        </View>
      )}

      {/* SEND A FOAM GIFT MODAL */}
      {showGiftModal && (
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContentSmall, { opacity: giftOpacity, transform: [{ scale: giftScale }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send a Foam Gift</Text>
              <TouchableOpacity onPress={closeGift}>
                <Ionicons name="close-circle" size={24} color={Colors.primary.default} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabelText}>Custom Gift Amount</Text>
              <Input
                placeholder="Enter amount (min ₱100)"
                keyboardType="numeric"
                value={giftAmount}
                onChangeText={(text) => {
                  setGiftAmount(text.replace(/[^0-9]/g, ''));
                  if (giftAmountError) setGiftAmountError('');
                }}
                leftIcon={<Text style={styles.innerPrefixText}>₱</Text>}
              />
              {giftAmountError !== '' && (
                <Text style={styles.giftAmountError}>{giftAmountError}</Text>
              )}

              <Text style={styles.inputLabelText}>{"Friend's Phone Number"}</Text>
              <Input
                placeholder="9171234567"
                keyboardType="phone-pad"
                maxLength={10}
                value={giftPhone}
                onChangeText={(text) => setGiftPhone(text.replace(/[^0-9]/g, ''))}
                leftIcon={<Text style={styles.innerPrefixText}>+63</Text>}
              />

              <Button
                title="Send Gift Card"
                variant="primary"
                onPress={handleSendGift}
                style={styles.modalBtnMargin}
              />
            </View>
          </Animated.View>
        </View>
      )}

      {/* PASTRY CHECKOUT UPSELL MODAL */}
      {showUpsellModal && (
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContentUpsell, { opacity: upsellOpacity, transform: [{ scale: upsellScale }] }]}>
            <View style={styles.upsellArtBg}>
              <Ionicons name="sparkles" size={32} color={Colors.secondary.default} />
              <Text style={styles.upsellBadgeHeader}>LIMITED DEAL</Text>
            </View>
            <View style={styles.upsellBody}>
              <Text style={styles.upsellTitle}>Pair your drink with a pastry? 🥐</Text>
              <Text style={styles.upsellDesc}>
                Add a freshly baked **Classic Butter Croissant** to your order for only **₱65.00** (Regular ₱95.00). Save 31% right now!
              </Text>
              
              <View style={styles.upsellBtnRow}>
                <TouchableOpacity 
                  style={styles.upsellSkipBtn}
                  onPress={() => executeFinalCheckout(false)}
                >
                  <Text style={styles.upsellSkipText}>No, Thanks</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.upsellAddBtn}
                  onPress={() => executeFinalCheckout(true)}
                >
                  <Text style={styles.upsellAddText}>Add & Checkout</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      )}

      {/* UNCLAIMED VOUCHER POP-UP */}
      {!isSuperAdmin && showVoucherPopup && unclaimedVouchers.length > 0 && (
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContentSmall, { opacity: voucherOpacity, transform: [{ scale: voucherScale }] }]}>
            <View style={styles.voucherPopupHeader2}>
              <Image 
                source={require('../../../assets/app/logo.png')} 
                style={{ width: 44, height: 44, marginRight: 12 }} 
                resizeMode="contain" 
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.voucherPopupTitle2, { textAlign: 'left', marginTop: 0 }]}>
                  {unclaimedVouchers.length === 1 ? 'Claim Your Voucher! 🎟️' : `${unclaimedVouchers.length} Vouchers Available!`}
                </Text>
                <Text style={{ fontFamily: 'Poppins', fontSize: 10.5, color: Colors.neutral.gray500, marginTop: 1 }}>
                  Tap claim to add these to your account!
                </Text>
              </View>
            </View>

            {/* Voucher Cards */}
            <ScrollView style={{ maxHeight: 320, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
              {unclaimedVouchers.map((voucher: any, idx: number) => {
                const cardColors = [Colors.primary.default, '#4299E1', '#3182CE', '#1B4D86'];
                const bgColor = cardColors[idx % cardColors.length];
                const isClaimed = dummyData.vouchers.some((v: any) => v.code === voucher.code);

                return (
                  <View key={voucher.id} style={styles.ticketCardPopup}>
                    {/* Physical Ticket Edge Cutouts (Punched Holes) */}
                    <View style={styles.topCenterCutoutPopup} />
                    <View style={styles.bottomCenterCutoutPopup} />
                    <View style={styles.leftEdgeCutoutPopup} />
                    <View style={styles.rightEdgeCutoutPopup} />

                    {/* LEFT TICKET (Main Body - Cream base) */}
                    <View style={styles.leftTicketPopup}>
                      {/* Top Left Brand Logo */}
                      <View style={styles.logoBlockPopup}>
                        <Image 
                          source={require('../../../assets/app/logo.png')} 
                          style={styles.logoImgPopup} 
                          resizeMode="contain" 
                        />
                        <View style={styles.logoDividerPopup} />
                        <View style={styles.logoTextContainerPopup}>
                          <Text style={styles.logoTitlePopup}>fōam</Text>
                          <Text style={styles.logoSubtitlePopup}>coffee</Text>
                        </View>
                      </View>

                      {/* Sparkle details */}
                      <Ionicons name="sparkles" size={10} color="#82C1F9" style={styles.sparkleDecorationPopup} />

                      {/* Center Content */}
                      <View style={styles.centerTextContainerPopup}>
                        <Text style={styles.voucherMainTitlePopup} numberOfLines={1}>
                          {voucher.label.toUpperCase()}
                        </Text>
                        
                        <View style={styles.dividerRowPopup}>
                          <View style={styles.dividerLinePopup} />
                          <Ionicons name="heart" size={8} color="#82C1F9" style={{ marginHorizontal: 6 }} />
                          <View style={styles.dividerLinePopup} />
                        </View>
                        
                        <Text style={styles.voucherSubtitlePopup} numberOfLines={1}>
                          VALID ON ALL FOAM COFFEE DRINKS
                        </Text>
                      </View>

                      {/* Bottom Row Details */}
                      <View style={styles.bottomDetailsRowPopup}>
                        {/* Value Badge */}
                        <View style={styles.valueRowPopup}>
                          <View style={styles.valueTagPopup}>
                            <Text style={styles.valueTagTextPopup}>VALUE</Text>
                          </View>
                          <Text style={styles.valueAmountTextPopup}>
                            {voucher.type === 'percent' ? `${(voucher.discount * 100).toFixed(0)}%` : `₱${Number(voucher.discount).toFixed(0)}`}
                          </Text>
                        </View>

                        <View style={styles.bottomRowDividerPopup} />

                        {/* Support message */}
                        <View style={styles.supportContainerPopup}>
                          <Ionicons name="cafe" size={12} color="#3D2B1F" style={{ marginRight: 4 }} />
                          <View>
                            <Text style={styles.supportTextPopup}>THANK YOU</Text>
                            <Text style={styles.supportTextPopup}>FOR CHOOSING FOAM COFFEE!</Text>
                          </View>
                        </View>
                      </View>

                      {/* Bottom Ribbon */}
                      <View style={styles.bottomRibbonPopup}>
                        <Text style={styles.bottomRibbonTextPopup}>❤ MADE WITH PASSION ❤</Text>
                      </View>
                    </View>

                    {/* Perforated vertical line */}
                    <View style={styles.perforatedDividerPopup} />

                    {/* RIGHT STUB (Tear-off Ticket - Sky Blue) */}
                    <View style={styles.rightTicketStubPopup}>
                      {/* Stub Header */}
                      <View style={styles.stubHeaderPopup}>
                        <Text style={styles.stubHeaderLabelPopup}>★ ENJOY ★</Text>
                        <Text style={styles.stubHeaderSubtitlePopup}>Your Coffee!</Text>
                      </View>

                      {/* Circular Mascot Emblem with dashed border */}
                      <View style={styles.stubMascotEmblemPopup}>
                        <View style={styles.stubMascotCirclePopup}>
                          <Image 
                            source={require('../../../assets/app/logo.png')} 
                            style={styles.stubMascotImgPopup} 
                            resizeMode="contain" 
                          />
                        </View>
                      </View>

                      {/* Expiry Details */}
                      <View style={styles.stubExpiryBlockPopup}>
                        <Text style={styles.stubExpiryLabelPopup}>VALID UNTIL</Text>
                        <Text style={styles.stubExpiryValuePopup}>12 / 31 / 2025</Text>
                      </View>

                      {/* Claim Action Button (Pill shape bottom) */}
                      <View style={styles.stubActionBlockPopup}>
                        <Text style={styles.stubCodeLabelPopup}>ACTION</Text>
                        {isClaimed ? (
                          <View style={styles.stubCodePillPopupClaimed}>
                            <Ionicons name="checkmark-circle" size={10} color="#FAF9F5" style={{ marginRight: 2 }} />
                            <Text style={[styles.stubCodePillTextPopup, { color: '#FAF9F5' }]}>CLAIMED</Text>
                          </View>
                        ) : (
                          <TouchableOpacity 
                            style={styles.stubCodePillPopup} 
                            onPress={() => handleClaimVoucher(voucher.id)}
                            disabled={claimingVoucherId === voucher.id}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.stubCodePillTextPopup}>
                              {claimingVoucherId === voucher.id ? '...' : 'CLAIM'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12 }}>
              <TouchableOpacity style={styles.voucherSeeMoreBtn} onPress={() => { closeVoucher(); setHomeSubView('Promos'); }} activeOpacity={0.8}>
                <Text style={styles.voucherSeeMoreText}>See More</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.primary.default} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.voucherSkipBtn} onPress={closeVoucher}>
                <Text style={styles.voucherSkipText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}

            {/* REUSABLE CUSTOM ALERT MODAL */}
      {alertConfig.visible && (
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContentSmall, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
            <View style={styles.customAlertHeader}>
              <Ionicons name={alertConfig.showCancel ? "log-out-outline" : "information-circle-outline"} size={48} color={alertConfig.showCancel ? Colors.danger.default : Colors.primary.default} />
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.customAlertTitle}>{alertConfig.title}</Text>
              <Text style={styles.customAlertMessage}>{alertConfig.message}</Text>
              
              {!alertConfig.hideButton && alertConfig.showCancel && (
              <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                <Button
                  title="No"
                  variant="outline"
                  onPress={dismissAlert}
                  style={[styles.customAlertBtn, { flex: 1 }]}
                />
                <Button
                  title="Yes"
                  variant="primary"
                  onPress={closeAlert}
                  style={[styles.customAlertBtn, { flex: 1 }]}
                />
              </View>
              )}

              {!alertConfig.hideButton && !alertConfig.showCancel && (
              <Button
                title="OK"
                variant="primary"
                onPress={closeAlert}
                style={styles.customAlertBtn}
              />
              )}
            </View>
          </Animated.View>
        </View>
      )}
      {/* Sliding Cart Screen (Covers entire layout) */}
      <Animated.View 
        style={[
          styles.cartSlidingOverlay,
          { transform: [{ translateX: cartTranslateX }] }
        ]}
      >
        <CartView
          cart={cart}
          fulfillmentMode={fulfillmentMode}
          setFulfillmentMode={setFulfillmentMode}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          walletBalance={walletBalance}
          subscriptionBalance={subscriptionBalance}
          cartTotal={cartTotal}
          grandTotal={grandTotal}
          deliveryFee={deliveryFee}
          subscriptionDiscount={subscriptionDiscount}
          voucherDiscount={voucherDiscount}
          perkDiscount={perkDiscount}
          perksApplied={perksApplied}
          subscriptionName={cartComputed.subscription_name || null}
          serverVouchers={cartComputed.applied_vouchers || []}
          appliedVouchers={appliedVouchers}
          setAppliedVouchers={setAppliedVouchers}
          voucherCode={voucherCode}
          setVoucherCode={setVoucherCode}
          voucherStatus={voucherStatus}
          setVoucherStatus={setVoucherStatus}
          handleCheckoutClick={handleCheckoutClick}
          handleIncrementQty={handleIncrementQty}
          handleDecrementQty={handleDecrementQty}
          onBack={closeCartView}
          onRedirectToAddresses={() => {
            closeCartView();
            setProfileInitialSubView('Addresses');
            setActiveTab('Profile');
          }}
        />
      </Animated.View>

      {/* Sliding Stamp Card Screen (Covers entire layout) */}
      {activeTab === 'StampCard' && (
        <Animated.View 
          style={[
            styles.stampCardSlidingOverlay,
            { transform: [{ translateY: stampCardTranslateY }] }
          ]}
        >
          <StampCardView onBack={closeStampCard} />
        </Animated.View>
      )}

      {/* Sliding Generated Order QR Screen */}
      {generatedOrder && (
        <Animated.View 
          style={styles.qrSlidingOverlay}
        >
          <GeneratedOrderQR 
            order={generatedOrder} 
            onBack={() => {
              setGeneratedOrder(null);
              clearPendingQROrder().catch(err => console.warn('Failed to clear pending QR:', err));
            }} 
          />
        </Animated.View>
      )}

      {/* LOGIN REQUIRED MODAL */}
      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => { setShowLoginModal(false); router.replace('/views/Login/Index'); }}
        onRegister={() => { setShowLoginModal(false); router.push('/views/Register/Index'); }}
      />

      {/* CHECKOUT WEBVIEW (Card / E-wallet payment) */}
      {showCheckoutWebView && checkoutUrl && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          <CheckoutPage
            checkoutUrl={checkoutUrl}
            orderId={checkoutOrderId}
            amount={grandTotal}
            onClose={() => setShowCheckoutWebView(false)}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailed={() => {
              setShowCheckoutWebView(false);
              showAlert('Payment Failed', 'The payment was not completed. Please try again.');
            }}
          />
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5', 
  },
  fullLoadingScreen: {
    flex: 1,
    backgroundColor: '#FAF9F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullLoadingText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: Colors.neutral.gray500,
    marginTop: 16,
  },
  mainContent: {
    flex: 1,
    paddingBottom: 68, 
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  scrollFeedContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  floatingHeaderContainer: {
    backgroundColor: '#FAF9F5',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
    zIndex: 10,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIconBtn: {
    backgroundColor: '#E1EEFA',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cartIconBtn: {
    backgroundColor: '#E1EEFA',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerCartBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: Colors.danger.default,
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCartBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#FFF',
    textAlign: 'center',
  },
  cartSlidingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF9F5',
    zIndex: 9999,
  },
  stampCardSlidingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF9F5',
    zIndex: 9999,
  },
  greetingText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: Colors.neutral.gray600,
  },
  userNameText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: Colors.primary.default,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.primary.default,
  },
  avatarVideoWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.primary.default,
    overflow: 'hidden',
  },
  avatarVideo: {
    width: '100%',
    height: '100%',
  },
  searchSection: {
    marginBottom: 20,
  },
  loyaltyTeaserCard: {
    backgroundColor: '#E8F2FA', // light blue background
    borderRadius: 20,
        marginBottom: 20,
overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#D0E3F3',
    shadowColor: '#1D5FA7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  loyaltyBgWaveLight: {
    position: 'absolute',
    bottom: -60,
    left: -20,
    right: -20,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 40,
  },
  loyaltyBgWaveDark: {
    position: 'absolute',
    bottom: 25,
    left: -30,
    right: -30,
    height: 100,
    backgroundColor: '#D1E5F7',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 80,
    opacity: 0.6,
  },
  loyaltyTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
    zIndex: 1,
  },
  loyaltyLogoContainer: {
    width: 80,
    height: 80,
    marginRight: 12,
    position: 'relative',
    marginTop: -8,
  },
  loyaltyCloudImg: {
    width: '100%',
    height: '100%',
  },
  loyaltySparkle1: {
    position: 'absolute',
    top: 6,
    left: 4,
  },
  loyaltySparkle2: {
    position: 'absolute',
    top: 20,
    right: 0,
  },
  loyaltyCenterText: {
    flex: 1, },
    loyaltyPointsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loyaltyTitleText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: '#1D5FA7',
  },
  loyaltyPointsValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: -6,
  },
  loyaltyPointsBigText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 42,
    color: '#1D5FA7',
    lineHeight: 50,
  },
  loyaltyPointsLabelText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#1D5FA7',
    marginLeft: 4,
  },
  loyaltyPraiseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1E5F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: -4,
  },
  loyaltyPraiseText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 9,
    color: '#1D5FA7',
  },
  loyaltyViewStampsBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D5FA7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loyaltyViewStampsBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#1D5FA7',
    lineHeight: 11,
  },
  loyaltyProgressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  loyaltyProgressLeftCol: {
    flex: 1,
    marginRight: 12,
  },
  loyaltyCupsList: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  loyaltyCupsTargetBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D5FA7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loyaltyCupsTargetBadgeVal: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#1D5FA7',
    lineHeight: 18,
  },
  loyaltyCupsTargetBadgeLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 9,
    color: '#718096',
    lineHeight: 10,
  },
  loyaltyProgressLineBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    width: '100%',
    position: 'relative',
  },
  loyaltyProgressLineFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#3182CE',
    borderRadius: 4,
  },
  loyaltyProgressLineDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1D5FA7',
    top: -3,
    marginLeft: -7,
  },
  loyaltyBottomRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 1,
  },
  loyaltyProgressCupsText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: '#4A5568',
    marginBottom: 8,
  },
  promoSection: {
    marginBottom: 20,
  },
  promoScroll: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  promoCardWrapper: {
    height: 160,
    borderRadius: 22,
    marginRight: 14,
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
  },
  promoCardBlue: {
    width: 290,
    backgroundColor: '#3B82F6',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  promoCardPeach: {
    width: 290,
    backgroundColor: '#FDE4D0',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  promoBlueRaysContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.15,
  },
  promoBlueRay1: {
    position: 'absolute',
    width: 200,
    height: 4,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    top: -20,
    right: -40,
  },
  promoBlueRay2: {
    position: 'absolute',
    width: 200,
    height: 4,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '25deg' }],
    top: 40,
    right: -20,
  },
  promoBlueRay3: {
    position: 'absolute',
    width: 200,
    height: 4,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-15deg' }],
    top: 100,
    right: -10,
  },
  promoCardContentInner: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  promoTopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  promoTopBadgeBlue: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  promoTopBadgePeach: {
    backgroundColor: 'rgba(210, 84, 0, 0.12)',
  },
  promoTopBadgeText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 9,
    marginLeft: 3,
  },
  promoTopBadgeTextBlue: {
    color: '#FFFFFF',
  },
  promoTopBadgeTextPeach: {
    color: '#D25400',
  },
  promoLargeHeading: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    lineHeight: 27,
    marginTop: 4,
  },
  promoSubHeading: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    marginTop: 1,
    marginBottom: 4,
  },
  promoTextWhite: {
    color: '#FFFFFF',
  },
  promoTextDark: {
    color: '#3B271A',
  },
  promoCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 4,
  },
  promoCodeBoxBlue: {
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  promoCodeBoxPeach: {
    borderColor: 'rgba(194, 65, 12, 0.4)',
  },
  promoCodeBoxText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    letterSpacing: 0.5,
  },
  promoCodeBoxDivider: {
    width: 1,
    height: 10,
    marginHorizontal: 5,
  },
  promoCodeBoxDividerBlue: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  promoCodeBoxDividerPeach: {
    backgroundColor: 'rgba(194, 65, 12, 0.4)',
  },
  promoCodeBoxVal: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  promoBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  promoTermsText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 8,
    opacity: 0.8,
  },
  promoDeliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  promoDeliveryBadgeText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 8,
    color: '#FFFFFF',
    marginLeft: 3,
  },
  promoRightImageContainer: {
    width: 120,
    height: '100%',
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
    borderTopLeftRadius: 65,
    borderBottomLeftRadius: 65,
    overflow: 'hidden',
  },
  promoLatteImg: {
    width: '100%',
    height: '100%',
  },

  categorySection: {
    marginBottom: 24,
  },
categorySectionSticky: {
    marginBottom: 10,
  },
  sectionTitleSticky: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.primary.default,
    marginBottom: 10,
  },
  stickyCategoriesHeader: {
    backgroundColor: '#FAF9F5',
    paddingHorizontal: 24,
    paddingVertical: 10,
    width: '100%',
    zIndex: 99,
    elevation: 5,
  },
  menuTitleStickyContainer: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.primary.default,
    marginBottom: 12,
  },
  categoryScroll: {
    paddingRight: 10,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
    marginRight: 10,
  },
  categoryBtnActive: {
    backgroundColor: Colors.primary.default,
    borderColor: Colors.primary.default,
  },
  categoryText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: Colors.primary.default,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  popularSection: {
    marginBottom: 24,
  },
  popularScroll: {
    paddingBottom: 10,
  },
  popularCard: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    marginRight: 16,
    shadowColor: Colors.primary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  popularImage: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    marginBottom: 10,
  },
  ratingBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 53, 37, 0.95)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  ratingText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#FAF9F5',
    marginLeft: 3,
  },
  popularCardContent: {
    position: 'relative',
  },
  popularName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: Colors.primary.default,
    marginBottom: 4,
    paddingRight: 24,
  },
  popularPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: Colors.primary.default,
  },
  addButton: {
    position: 'absolute',
    bottom: -2,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightSection: {
    marginBottom: 24,
  },
  highlightCard: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
  },
  highlightImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  highlightOverlay: {
    flex: 1,
    backgroundColor: 'rgba(74, 53, 37, 0.65)',
    padding: 20,
    justifyContent: 'flex-end',
  },
  highlightInfo: {
    width: '100%',
  },
  specialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondary.default,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  specialBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#FAF9F5',
  },
  highlightName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FAF9F5',
    marginBottom: 2,
  },
  highlightDesc: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#FAF9F5',
    opacity: 0.85,
    lineHeight: 15,
    marginBottom: 10,
  },
  highlightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FAF9F5',
  },
  highlightOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  highlightOrderText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.primary.default,
  },
  spotlightSection: {
    marginBottom: 24,
  },
  spotlightCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.secondary.default,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  spotlightAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: Colors.secondary.default,
    marginRight: 16,
  },
  spotlightContent: {
    flex: 1,
  },
  spotlightName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
  },
  spotlightStat: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray700,
    marginTop: 2,
  },
  boldText: {
    fontFamily: 'Poppins-Bold',
    color: Colors.secondary.default,
  },
  spotlightReward: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: Colors.primary.default,
    opacity: 0.8,
    marginTop: 4,
  },
  gridSection: {
    marginBottom: 24,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    marginBottom: 16,
    shadowColor: Colors.primary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  gridImage: {
    width: '100%',
    height: 110,
    borderRadius: 14,
    marginBottom: 8,
  },
  ratingBadgeMini: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 53, 37, 0.95)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  customizableMini: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    gap: 3,
  },
  customizableMiniText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: Colors.secondary.default,
  },
  ratingTextMini: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#FAF9F5',
    marginLeft: 2,
  },
  gridContent: {
    position: 'relative',
  },
  gridName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: Colors.primary.default,
    marginBottom: 2,
  },
  gridDesc: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: Colors.neutral.gray500,
    marginBottom: 6,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.primary.default,
  },
  addButtonMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: Colors.neutral.gray600,
    marginTop: 10,
  },
  storeInfoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  storeInfoTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
  },
  storeInfoSubtitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: Colors.secondary.default,
    marginBottom: 14,
  },
  storeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeIcon: {
    marginRight: 10,
    width: 16,
  },
  storeDetailText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray700,
    flex: 1,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 10,
    color: Colors.neutral.gray500,
    marginTop: 2,
  },
  navTextActive: {
    color: Colors.primary.default,
  },
  activeNavIndicator: {
    width: 28,
    height: 3,
    backgroundColor: Colors.primary.default,
    borderRadius: 2,
    marginTop: 3,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: Colors.danger.default,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#FFF',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContentCustomizer: {
    width: '92%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 18,
    shadowColor: '#1D5FA7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  customizerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  customizerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customizerTitleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  customizerModalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    color: '#1D5FA7',
    lineHeight: 20,
  },
  customizerModalSubtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: '#64748B',
  },
  customizerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customizerScrollContent: {
    paddingBottom: 14,
  },
  customizerHeroCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1D5FA7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  customizerHeroImgContainer: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 10,
  },
  customizerHeroImg: {
    width: '100%',
    height: '100%',
  },
  customizerRatingBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  customizerRatingText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#1E293B',
  },
  customizerHeroDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  customizerPraiseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  customizerPraiseTagText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  customizerHeroTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#1E293B',
    marginTop: 2,
  },
  customizerBeansRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  customizerHeroDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: '#64748B',
    lineHeight: 13,
  },
  customizerInfoPillRow: {
    marginTop: 4,
  },
  customizerInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customizerInfoPillText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 9,
    color: '#475569',
  },
  customizerInfoDivider: {
    fontSize: 9,
    color: '#CBD5E1',
    marginHorizontal: 4,
  },
  customizerOptionGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customizerGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  customizerGroupIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  customizerGroupTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 15,
  },
  customizerGroupSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 9,
    color: '#64748B',
  },
  customizerOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customizerSelectCard: {
    minWidth: 70,
    flexGrow: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  customizerSelectCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  customizerCheckBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  customizerSelectText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: '#475569',
  },
  customizerSelectTextActive: {
    color: '#2563EB',
    fontFamily: 'Poppins-Bold',
  },
  customizerSubSizeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  customizerSubSizeTextActive: {
    color: '#3B82F6',
  },
  customizerCloudBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  customizerCloudBannerImg: {
    width: 34,
    height: 34,
  },
  customizerCloudBannerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#1D5FA7',
  },
  customizerCloudBannerSubtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 9,
    color: '#64748B',
  },
  customizerFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  customizerFooterTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  customizerQtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 3,
  },
  customizerQtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  customizerQtyVal: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#1E293B',
    marginHorizontal: 12,
  },
  customizerPriceText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#1E293B',
  },
  customizerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customizerAddToCartBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  customizerAddToCartText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  customizerWishlistBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FAF9F5',
    borderRadius: 24,
    padding: 20,
  },
  modalContentSmall: {
    width: '98%',
    backgroundColor: '#FAF9F5',
    borderRadius: 24,
    padding: 20,
  },
  modalContentUpsell: {
    width: '85%',
    backgroundColor: '#FAF9F5',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.primary.default,
  },
  modalScrollBody: {
    paddingBottom: 20,
  },
  modalBody: {
    width: '100%',
  },
  customizerImg: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    marginBottom: 12,
  },
  customizerName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
    marginBottom: 4,
  },
  customizerDesc: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray600,
    marginBottom: 16,
    lineHeight: 15,
  },
  customLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.primary.default,
    marginVertical: 10,
  },
  customOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  customOptionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.neutral.gray400,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    marginBottom: 8,
  },
  customOptionBtnActive: {
    backgroundColor: Colors.primary.default,
    borderColor: Colors.primary.default,
  },
  customOptionText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: Colors.primary.default,
  },
  customOptionTextActive: {
    color: '#FFF',
  },
  customAddonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  addonCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  addonCardActive: {
    backgroundColor: Colors.secondary.default,
    borderColor: Colors.secondary.default,
  },
  addonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 10,
    color: Colors.primary.default,
    flex: 1,
  },
  addonTextActive: {
    color: '#FAF9F5',
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray200,
    paddingTop: 12,
    marginTop: 8,
  },
  modalActionBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
  },
  inputLabelText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.primary.default,
    marginBottom: 8,
    marginTop: 10,
  },
  topUpAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  topUpAmtBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.neutral.gray400,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  topUpAmtBtnActive: {
    backgroundColor: Colors.primary.default,
    borderColor: Colors.primary.default,
  },
  topUpAmtText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.primary.default,
  },
  topUpAmtTextActive: {
    color: '#FFF',
  },
  gatewayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gatewayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 3,
  },
  gatewayBtnActive: {
    backgroundColor: Colors.primary.default,
    borderColor: Colors.primary.default,
  },
  gatewayText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: Colors.primary.default,
    marginLeft: 4,
  },
  gatewayTextActive: {
    color: '#FFF',
  },
  modalBtnMargin: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    marginTop: 10,
  },
  innerPrefixText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: Colors.primary.default,
    marginRight: 6,
  },
  giftAmountError: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: '#D32F2F',
    marginTop: -4,
    marginBottom: 8,
  },
  upsellArtBg: {
    backgroundColor: '#E1EEFA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  upsellBadgeHeader: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.secondary.default,
    letterSpacing: 1,
    marginTop: 6,
  },
  upsellBody: {
    padding: 20,
    alignItems: 'center',
  },
  upsellTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
    textAlign: 'center',
    marginBottom: 8,
  },
  upsellDesc: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray600,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  upsellBtnRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  upsellSkipBtn: {
    width: '45%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E1EEFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upsellSkipText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.neutral.gray600,
  },
  upsellAddBtn: {
    width: '50%',
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upsellAddText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#FFF',
  },
  voucherPopupHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  voucherPopupTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.primary.default,
    textAlign: 'center',
    marginBottom: 8,
  },
  voucherPopupDesc: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray600,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  voucherClaimBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    marginBottom: 10,
  },
  voucherSkipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  voucherSkipText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.neutral.gray500,
  },
  voucherListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF9F5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  voucherListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  voucherListIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(179, 101, 52, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  voucherListLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.primary.default,
  },
  voucherListCode: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: Colors.neutral.gray500,
    marginTop: 1,
  },
  voucherListDiscount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: Colors.secondary.default,
    marginTop: 2,
  },
  voucherClaimItemBtn: {
    backgroundColor: Colors.secondary.default,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  voucherClaimItemBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FAF9F5',
  },
  customAlertHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  customAlertTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
    textAlign: 'center',
    marginBottom: 8,
  },
  customAlertMessage: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray700,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  customAlertBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
  },
  flyingItem: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  flyingIndicatorInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: Colors.secondary.default,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  qrSlidingOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FAF9F5',
    zIndex: 9999,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeMoreText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.primary.default,
  },
  seeMoreBtnWrapper: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  seeMoreFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E1EEFA',
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
  },
  seeMoreFullBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.primary.default,
  },
  wavingVideo: {
    width: 36,
    height: 36,
    marginLeft: 6,
    borderRadius: 6,
  },
  voucherPopupHeader2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  voucherPopupTitle2: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
    marginTop: 8,
    textAlign: 'center',
  },
  voucherPopupDesc2: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray600,
    textAlign: 'center',
    marginTop: 4,
  },
  voucherCard: {
    flexDirection: 'row',
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  voucherCardLeft: {
    flex: 1.3,
    padding: 14,
    justifyContent: 'center',
  },
  voucherCardLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFF',
    lineHeight: 18,
  },
  voucherCardDiscount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 2,
  },
  voucherCardCodePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  voucherCardCodeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#FFF',
  },
  voucherCardRight: {
    flex: 0.7,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  voucherCardShape: {
    position: 'absolute',
    left: -30,
    top: -40,
    width: 120,
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [{ rotate: '15deg' }],
  },
  voucherClaimedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.85)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    zIndex: 10,
  },
  voucherClaimedBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#FFF',
    marginLeft: 3,
  },
  voucherClaimBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  voucherClaimBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: Colors.primary.default,
  },

  // ─── Ticket-Style Voucher Cards ───────────────────────────────────────────────
  ticketCard: {
    flexDirection: 'row',
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  ticketLeft: {
    flex: 1,
    padding: 14,
    paddingRight: 6,
    justifyContent: 'center',
    position: 'relative',
  },
  ticketClaimedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ticketClaimedText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#FFF',
  },
  ticketLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFF',
    lineHeight: 18,
    marginBottom: 2,
  },
  ticketDiscount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FFF',
    opacity: 0.9,
  },
  ticketCodePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  ticketCodeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#FFF',
    letterSpacing: 1,
  },
  ticketDivider: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
    zIndex: 2,
    marginVertical: -1,
  },
  ticketNotchTop: {
    width: 20,
    height: 16,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: -1,
  },
  ticketNotchBottom: {
    width: 20,
    height: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginBottom: -1,
  },
  ticketDashedLine: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  ticketRight: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 0,
  },
  ticketClaimBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  ticketClaimBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
  },

  voucherSeeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  voucherSeeMoreText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.primary.default,
  },
  voucherSkipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  voucherSkipText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#8E8E93',
  },

  // ─── Welcome Voucher Popup Ticket Styles ───────────────────────────────────────
  ticketCardPopup: {
    flexDirection: 'row',
    width: '100%',
    height: 170, // Slightly shorter for popup scroll view
    borderRadius: 12,
    overflow: 'visible', // Visible overflow so punch holes aren't clipped!
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E5DF',
    backgroundColor: '#FDFBF7',
    position: 'relative',
    shadowColor: '#2D78CD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  topCenterCutoutPopup: {
    position: 'absolute',
    top: -7,
    left: '67.5%',
    marginLeft: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FAF9F5', // Blends with modal background to look like cutout
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#E8E5DF',
  },
  bottomCenterCutoutPopup: {
    position: 'absolute',
    bottom: -7,
    left: '67.5%',
    marginLeft: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FAF9F5', // Blends with modal background to look like cutout
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#E8E5DF',
  },
  leftEdgeCutoutPopup: {
    position: 'absolute',
    top: '50%',
    left: -7,
    marginTop: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FAF9F5', // Blends with modal background to look like cutout
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#E8E5DF',
  },
  rightEdgeCutoutPopup: {
    position: 'absolute',
    top: '50%',
    right: -7,
    marginTop: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FAF9F5', // Blends with modal background to look like cutout
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#E8E5DF',
  },
  leftTicketPopup: {
    flex: 2.1,
    backgroundColor: '#FDFBF7',
    padding: 10,
    justifyContent: 'space-between',
    position: 'relative',
    borderTopLeftRadius: 12, // Match parent corner radius
    borderBottomLeftRadius: 12,
  },
  perforatedDividerPopup: {
    width: 0.5,
    height: '100%',
    borderColor: 'rgba(61, 43, 31, 0.15)',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  rightTicketStubPopup: {
    flex: 1,
    backgroundColor: '#82C1F9',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopRightRadius: 12, // Match parent corner radius
    borderBottomRightRadius: 12,
  },
  logoBlockPopup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImgPopup: {
    width: 18,
    height: 18,
  },
  logoDividerPopup: {
    width: 1,
    height: 14,
    backgroundColor: '#3D2B1F',
    marginHorizontal: 6,
    opacity: 0.25,
  },
  logoTextContainerPopup: {
    justifyContent: 'center',
  },
  logoTitlePopup: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9.5,
    color: '#3D2B1F',
    lineHeight: 10,
    letterSpacing: 0.2,
  },
  logoSubtitlePopup: {
    fontFamily: 'Poppins-Bold',
    fontSize: 6.5,
    color: '#3D2B1F',
    lineHeight: 7,
    marginTop: -1,
  },
  sparkleDecorationPopup: {
    position: 'absolute',
    top: 18,
    right: 14,
  },
  centerTextContainerPopup: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    paddingHorizontal: 6,
  },
  voucherMainTitlePopup: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#3D2B1F',
    letterSpacing: 1.5,
  },
  dividerRowPopup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    width: '80%',
  },
  dividerLinePopup: {
    flex: 1,
    height: 0.8,
    backgroundColor: '#82C1F9',
  },
  voucherSubtitlePopup: {
    fontFamily: 'Poppins-Bold',
    fontSize: 6,
    color: '#3D2B1F',
    letterSpacing: 0.8,
  },
  bottomDetailsRowPopup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
  },
  valueRowPopup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueTagPopup: {
    backgroundColor: '#82C1F9',
    paddingVertical: 1.5,
    paddingHorizontal: 4,
    borderRadius: 3,
    marginRight: 4,
  },
  valueTagTextPopup: {
    fontFamily: 'Poppins-Bold',
    fontSize: 5.5,
    color: '#FFFFFF',
  },
  valueAmountTextPopup: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#82C1F9',
    lineHeight: 14,
  },
  bottomRowDividerPopup: {
    width: 0.8,
    height: 14,
    backgroundColor: '#3D2B1F',
    marginHorizontal: 8,
    opacity: 0.2,
  },
  supportContainerPopup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  supportTextPopup: {
    fontFamily: 'Poppins-Bold',
    fontSize: 5.2,
    color: '#3D2B1F',
    letterSpacing: 0.1,
    lineHeight: 6,
  },
  bottomRibbonPopup: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: '#E6F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 10,
  },
  bottomRibbonTextPopup: {
    fontFamily: 'Poppins-Bold',
    fontSize: 5.2,
    color: '#82C1F9',
    letterSpacing: 1.2,
  },
  stubHeaderPopup: {
    alignItems: 'center',
  },
  stubHeaderLabelPopup: {
    fontFamily: 'Poppins-Bold',
    fontSize: 6.5,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  stubHeaderSubtitlePopup: {
    fontFamily: 'Poppins-Bold',
    fontStyle: 'italic',
    fontSize: 8,
    color: '#FFFFFF',
  },
  stubMascotEmblemPopup: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stubMascotCirclePopup: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
  },
  stubMascotImgPopup: {
    width: 24,
    height: 24,
  },
  stubExpiryBlockPopup: {
    alignItems: 'center',
  },
  stubExpiryLabelPopup: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 5.5,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  stubExpiryValuePopup: {
    fontFamily: 'Poppins-Bold',
    fontSize: 7,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginTop: -1,
  },
  stubActionBlockPopup: {
    alignItems: 'center',
    width: '100%',
  },
  stubCodeLabelPopup: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 5.5,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 2,
  },
  stubCodePillPopup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 6,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stubCodePillPopupClaimed: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 6,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  stubCodePillTextPopup: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#82C1F9',
    letterSpacing: 0.5,
  },
});
