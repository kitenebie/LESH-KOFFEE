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
  const [paymentMethod, setPaymentMethod] = useState<'Wallet' | 'CardEWallet' | 'COD'>('Wallet');

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

  // Save cart to SQLite whenever it changes (after initial load)
  React.useEffect(() => {
    if (!isCartLoaded.current) return;
    const persistCart = async () => {
      try {
        await saveCartItems(cart);
      } catch (error) {
        console.warn('Failed to save cart to SQLite:', error);
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
      `Lesh Gift of ₱${amount} has been sent. Notification shared to +63 ${giftPhone} via WhatsApp.`
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
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { 
        product: customizedProduct, 
        quantity: 1,
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
  const cartTotal = cart.reduce((sum, item) => {
    const basePrice = Number(item.product.price);
    const extraPrice = item.customization?.price ? (Number(item.customization.price) - basePrice) : 0;
    return sum + (basePrice + extraPrice) * item.quantity;
  }, 0);
  const deliveryFee = fulfillmentMode === 'Delivery' ? 49 : 0;

  // Subscription Discount calculation
  const getSubscriptionDiscount = () => {
    if (subscriptionBalance <= 0) return 0;
    const drinkPrices = cart
      .filter((item) => item.product.categoryId === 'drinks')
      .flatMap((item) => Array(item.quantity).fill(item.product.price))
      .sort((a, b) => b - a);

    const drinksCovered = Math.min(subscriptionBalance, drinkPrices.length);
    return drinkPrices.slice(0, drinksCovered).reduce((sum, price) => sum + price, 0);
  };
  const subscriptionDiscount = getSubscriptionDiscount();

  // Subscription Perk Discount (e.g. 10% food discount)
  const { perkDiscount, perksApplied } = React.useMemo(() => {
    if (!activeSubscription || cart.length === 0) return { perkDiscount: 0, perksApplied: [] };

    // Find active subscription's perks from dummyData
    const activePlan = (dummyData?.subscriptions || []).find((s: any) => s.name === activeSubscription);
    const perks = activePlan?.perks || [];
    if (perks.length === 0) return { perkDiscount: 0, perksApplied: [] };

    let totalPerkDiscount = 0;
    const applied: any[] = [];

    perks.forEach((perk: any) => {
      // Find cart items matching perk's category
      const matchingItems = cart.filter(item => String(item.product.categoryId) === String(perk.category_id));
      if (matchingItems.length === 0) return;

      let perkAmount = 0;
      matchingItems.forEach(item => {
        const itemPrice = Number(item.product.price) * item.quantity;
        if (perk.discount_type === 'percent') {
          const disc = itemPrice * (perk.discount_value / 100);
          perkAmount += perk.max_discount ? Math.min(disc, perk.max_discount) : disc;
        } else {
          perkAmount += Math.min(perk.discount_value, itemPrice) * item.quantity;
        }
      });

      if (perkAmount > 0) {
        totalPerkDiscount += perkAmount;
        applied.push({ category_name: perk.category_name, discount_type: perk.discount_type, discount_value: perk.discount_value, applied_discount: perkAmount });
      }
    });

    return { perkDiscount: Math.round(totalPerkDiscount * 100) / 100, perksApplied: applied };
  }, [cart, activeSubscription, dummyData?.subscriptions]);

  // Eligible subtotal for voucher discount
  const eligibleSubtotal = Math.max(0, cartTotal - subscriptionDiscount);

  // Voucher Discount calculation
  const voucherDiscount = appliedVouchers.reduce((sum, v) => {
    // Check min order amount requirement
    const minOrder = v.min_order_amount ? Number(v.min_order_amount) : 0;
    if (minOrder > 0 && eligibleSubtotal < minOrder) return sum;

    if (v.type === 'fixed') {
      // Only apply if subtotal can cover the fixed discount
      return eligibleSubtotal >= v.discount ? sum + v.discount : sum;
    }
    // Percent: apply with cap if max_discount exists
    const raw = eligibleSubtotal * v.discount;
    return sum + Math.min(raw, v.max_discount || Infinity);
  }, 0);

  // Grand Total
  const grandTotal = Math.max(0, eligibleSubtotal - voucherDiscount - perkDiscount) + deliveryFee;

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
      description: `Lesh Wallet Top-Up - ₱${parsedAmount.toFixed(2)}`,
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
      description: `Lesh Subscription - "${subName}" (${drinkCount} drinks)`,
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
  const handleCheckoutClick = () => {
    // Cash payment (both DineIn and Delivery) → Generate order code
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

    // Lesh Wallet → direct charge
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
        `₱${amount.toFixed(2)} has been loaded into your Lesh Digital Wallet.`
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
          `₱${finalTotal.toFixed(2)} has been charged to your Lesh Digital Wallet.`
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
            <PromoDiscount
              promos={dummyData.promos as any}
              claimedVoucherCodes={dummyData.vouchers?.map((v: any) => v.code) || []}
              vouchers={dummyData.vouchers as any}
              onBack={() => setHomeSubView('Main')}
              onSendGift={() => {
                setHomeSubView('Main');
                setShowGiftModal(true);
              }}
              showAlert={showAlert}
            />
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
                <View style={styles.loyaltyTeaserLeft}>
                  <Text style={styles.loyaltyTeaserTitle}>Lesh Loyalty Points</Text>
                  <Text style={styles.loyaltyTeaserPoints}>{(Number(dummyData?.user?.loyaltyPoints) || 0).toLocaleString()} <Text style={styles.pointsLabel}>Points</Text></Text>
                  <View style={styles.loyaltyMiniProgressBg}>
                    <View style={[styles.loyaltyMiniProgressFill, { width: `${((dummyData.stamps?.achievements?.[0]?.collected || 0) / (dummyData.stamps?.achievements?.[0]?.required || 1)) * 100}%` }]} />
                  </View>
                  <Text style={styles.loyaltyProgressText}>{dummyData.stamps?.achievements?.[0]?.collected || 0} of {dummyData.stamps?.achievements?.[0]?.required || 8} cups collected for a free drink!</Text>
                </View>
                <TouchableOpacity 
                  style={styles.loyaltyTeaserRight}
                  onPress={() => navigateToStampCard('Home')}
                >
                  <Ionicons name="gift" size={32} color="#FAF9F5" />
                  <Text style={styles.viewStampsText}>View Stamps</Text>
                </TouchableOpacity>
              </ReAnimated.View>
            )}

            {/* PROMOS & DISCOUNTS CAROUSEL */}
            {searchQuery === '' && (
              <ReAnimated.View entering={ZoomIn.delay(300).duration(400)} style={styles.promoSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Promos & Discounts</Text>
                  <TouchableOpacity onPress={() => setHomeSubView('Promos')}>
                    <Text style={styles.seeMoreText}>See More</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoScroll}>
                  {dummyData.promos.map((promo) => (
                    <View key={promo.id} style={[styles.promoCardContainer, { backgroundColor: promo.color }]}>
                      {/* Left Side */}
                      <View style={styles.promoCardLeft}>
                        <View>
                          <Text style={styles.promoCardHeading}>{promo.heading}</Text>
                          <Text style={styles.promoCardSubheading}>{promo.subheading}</Text>
                        </View>
                        
                        {/* Action/Code Pill */}
                        <View style={styles.promoCardActionRow}>
                          {promo.id === 'pr3' ? (
                            <TouchableOpacity
                              style={styles.promoPillButton}
                              onPress={() => setShowGiftModal(true)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.promoPillBtnText}>Send Gift</Text>
                              <Ionicons name="arrow-forward" size={11} color="#FFF" style={{ marginLeft: 4 }} />
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.promoPill}>
                              <View style={styles.promoPillLabel}>
                                <Text style={styles.promoPillLabelText}>code</Text>
                              </View>
                              <View style={styles.promoPillValue}>
                                <Text style={styles.promoPillValueText}>{promo.code}</Text>
                              </View>
                            </View>
                          )}
                        </View>

                        <Text style={styles.promoCardFootnote}>T&Cs apply.</Text>
                      </View>

                      {/* Right Side (Image + Diagonal cut shape) */}
                      <View style={styles.promoCardRight}>
                        {/* Background Cut Shape */}
                        <View style={styles.promoImageBgShape} />
                        
                        {/* Product Image */}
                        <Image source={{ uri: promo.image }} style={styles.promoProductImage} resizeMode="cover" />
                      </View>

                      {/* Float Badge */}
                      {promo.badge && (
                        <View style={styles.promoFloatBadge}>
                          <Text style={styles.promoFloatBadgeText}>{promo.badge}</Text>
                        </View>
                      )}
                    </View>
                  ))}
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

            {/* SPECIAL HIGHLIGHT */}
            {searchQuery === '' && (
              <ReAnimated.View entering={ZoomIn.delay(700).duration(400)} style={styles.highlightSection}>
                <Text style={styles.sectionTitle}>{"Barista's Special Highlight"}</Text>
                <View style={styles.highlightCard}>
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?q=80&w=600&auto=format&fit=crop' }} 
                    style={styles.highlightImage} 
                  />
                  <View style={styles.highlightOverlay}>
                    <View style={styles.highlightInfo}>
                      <View style={styles.specialBadge}>
                        <Ionicons name="sparkles" size={10} color="#FAF9F5" style={{ marginRight: 4 }} />
                        <Text style={styles.specialBadgeText}>Special Highlight</Text>
                      </View>
                      <Text style={styles.highlightName}>Lesh Velvet Cream Macchiato</Text>
                      <Text style={styles.highlightDesc} numberOfLines={2}>
                        Double-shot heritage Barako espresso, layered with wild honey syrup, creamed vanilla oat milk, and a dusting of toasted cinnamon.
                      </Text>
                      <View style={styles.highlightFooter}>
                        <Text style={styles.highlightPrice}>₱195.00</Text>
                        <TouchableOpacity 
                          style={styles.highlightOrderBtn}
                          onPress={(e) => handleAddClick({
                            id: 'spec1',
                            categoryId: 'drinks',
                            name: 'Lesh Velvet Cream Macchiato',
                            description: 'Double-shot heritage Barako espresso layered with wild honey and vanilla oat milk.',
                            price: 195.00,
                            rating: 5.0,
                            reviews: 42,
                            isPopular: true,
                            image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?q=80&w=600&auto=format&fit=crop'
                          }, e)}
                        >
                          <Text style={styles.highlightOrderText}>Order Now</Text>
                          <Ionicons name="cart" size={16} color={Colors.primary.default} style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </ReAnimated.View>
            )}

            {/* CUSTOMER OF THE MONTH */}
            {searchQuery === '' && dummyData?.store?.spotlightCustomer?.name && (
              <ReAnimated.View entering={ZoomIn.delay(800).duration(400)} style={styles.spotlightSection}>
                <Text style={styles.sectionTitle}>Customer of the Month 👑</Text>
                <View style={styles.spotlightCard}>
                  <Image 
                    source={{ uri: dummyData.store.spotlightCustomer.avatar }} 
                    style={styles.spotlightAvatar} 
                  />
                  <View style={styles.spotlightContent}>
                    <Text style={styles.spotlightName}>{dummyData.store.spotlightCustomer.name}</Text>
                    <Text style={styles.spotlightStat}>Ordered <Text style={styles.boldText}>{dummyData.store.spotlightCustomer.cupsThisMonth} Cups</Text> this month!</Text>
                    <Text style={styles.spotlightReward}>{dummyData.store.spotlightCustomer.reward}</Text>
                  </View>
                </View>
              </ReAnimated.View>
            )}

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
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            showAlert('Sign Out', 'Are you sure you want to sign out?', async () => {
              await logout();
              router.replace('/');
            });
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
            Lesh Wallet
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
        return (
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContent,
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
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {customizingProduct.categoryId === 'drinks' ? 'Customize Drink' : 'Customize Item'}
                </Text>
                <TouchableOpacity onPress={closeCustomizer}>
                  <Ionicons name="close-circle" size={24} color={Colors.primary.default} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                <Image source={{ uri: customizingProduct.image }} style={styles.customizerImg} />
                <Text style={styles.customizerName}>{customizingProduct.name}</Text>
                <Text style={styles.customizerDesc}>{customizingProduct.description}</Text>

                {/* Dynamic Customization Fields */}
                {productCustomConfig && Object.entries(productCustomConfig.customizations || productCustomConfig).map(([fieldName, fieldConfig]: [string, any]) => {
                  if (!fieldConfig || typeof fieldConfig !== 'object' || !fieldConfig.options) return null;

                  const isMultiSelect = fieldConfig.isMultiSelect;
                  const selections = customSelections[fieldName] || [];
                  const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

                  return (
                    <View key={fieldName} style={{ marginBottom: 16 }}>
                      <Text style={styles.customLabel}>{label}</Text>
                      {isMultiSelect ? (
                        /* Multi Select layout (similar to add-ons grid) */
                        <View style={styles.customAddonGrid}>
                          {fieldConfig.options.map((opt: any) => {
                            const isChecked = selections.includes(opt.name);
                            return (
                              <TouchableOpacity
                                key={opt.name}
                                style={[styles.addonCard, isChecked && styles.addonCardActive]}
                                onPress={() => {
                                  let newSels = [...selections];
                                  if (isChecked) {
                                    newSels = newSels.filter(s => s !== opt.name);
                                  } else {
                                    newSels.push(opt.name);
                                  }
                                  setCustomSelections({
                                    ...customSelections,
                                    [fieldName]: newSels
                                  });
                                  // Update backward compatible state if fieldName is 'addons'
                                  if (fieldName.toLowerCase() === 'addons') {
                                    setCustomAddons(newSels);
                                  }
                                }}
                              >
                                <Ionicons
                                  name={isChecked ? 'checkmark-circle' : 'add-circle-outline'}
                                  size={16}
                                  color={isChecked ? '#FAF9F5' : Colors.primary.default}
                                  style={{ marginRight: 6 }}
                                />
                                <Text style={[styles.addonText, isChecked && styles.addonTextActive]}>
                                  {opt.name} {opt.price > 0 ? `(+₱${opt.price})` : ''}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : (
                        /* Single Select layout (similar to size/sweetness row) */
                        <View style={styles.customOptionRow}>
                          {fieldConfig.options.map((opt: any) => {
                            const isChecked = selections.includes(opt.name);
                            return (
                              <TouchableOpacity
                                key={opt.name}
                                style={[styles.customOptionBtn, isChecked && styles.customOptionBtnActive]}
                                onPress={() => {
                                  setCustomSelections({
                                    ...customSelections,
                                    [fieldName]: [opt.name]
                                  });
                                  // Update backward compatible states
                                  const lowerName = fieldName.toLowerCase();
                                  if (lowerName === 'size' || lowerName === 'sizes') {
                                    setCustomSize(opt.name);
                                  } else if (lowerName === 'sweetness') {
                                    setCustomSweetness(opt.name);
                                  } else if (lowerName === 'milk') {
                                    setCustomMilk(opt.name);
                                  }
                                }}
                              >
                                <Text style={[styles.customOptionText, isChecked && styles.customOptionTextActive]}>
                                  {opt.label || opt.name} {opt.price > 0 ? `(+₱${opt.price})` : ''}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.modalFooter}>
                <Button
                  title="Add to Cart"
                  variant="primary"
                  onPress={(e) => handleConfirmCustomization(e)}
                  style={styles.modalActionBtn}
                />
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

      {/* SEND A LESH GIFT MODAL */}
      {showGiftModal && (
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContentSmall, { opacity: giftOpacity, transform: [{ scale: giftScale }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send a Lesh Gift</Text>
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
              <Ionicons name="gift" size={36} color={Colors.secondary.default} />
              <Text style={styles.voucherPopupTitle2}>
                {unclaimedVouchers.length === 1 ? 'Claim Your Voucher! 🎟️' : `${unclaimedVouchers.length} Vouchers Available!`}
              </Text>
            </View>

            {/* Voucher Cards */}
            <ScrollView style={{ maxHeight: 320, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
              {unclaimedVouchers.map((voucher: any, idx: number) => {
                const cardColors = [Colors.secondary.default, '#5B8A72', '#C67B5C', '#6B5CA5'];
                const bgColor = cardColors[idx % cardColors.length];
                const isClaimed = dummyData.vouchers.some((v: any) => v.code === voucher.code);

                return (
                  <View key={voucher.id} style={styles.ticketCard}>
                    {/* Ticket Left (main content) */}
                    <View style={[styles.ticketLeft, { backgroundColor: bgColor }]}>
                      {/* Claimed Badge */}
                      {isClaimed && (
                        <View style={styles.ticketClaimedBadge}>
                          <Ionicons name="checkmark-circle" size={10} color="#FFF" />
                          <Text style={styles.ticketClaimedText}> Claimed</Text>
                        </View>
                      )}
                      <Text style={styles.ticketLabel} numberOfLines={2}>{voucher.label}</Text>
                      <Text style={styles.ticketDiscount}>
                        {voucher.type === 'percent' ? `${(voucher.discount * 100).toFixed(0)}% OFF` : `₱${Number(voucher.discount).toFixed(0)} OFF`}
                      </Text>
                      <View style={styles.ticketCodePill}>
                        <Text style={styles.ticketCodeText}>{voucher.code}</Text>
                      </View>
                    </View>

                    {/* Perforated divider */}
                    <View style={[styles.ticketDivider, { backgroundColor: bgColor }]}>
                      <View style={[styles.ticketNotchTop, { backgroundColor: '#FAF9F5' }]} />
                      <View style={styles.ticketDashedLine}>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <View
                            key={i}
                            style={{ width: 2, height: 6, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1, marginVertical: 2 }}
                          />
                        ))}
                      </View>
                      <View style={[styles.ticketNotchBottom, { backgroundColor: '#FAF9F5' }]} />
                    </View>

                    {/* Ticket Right (action) */}
                    <View style={[styles.ticketRight, { backgroundColor: bgColor }]}>
                    {isClaimed && (
                        <Ionicons name="checkmark-circle" size={24} color="rgba(255,255,255,0.8)" />
                      )}
                      {!isClaimed && (
                        <TouchableOpacity
                          style={[styles.ticketClaimBtn, claimingVoucherId === voucher.id && { opacity: 0.5 }]}
                          onPress={() => handleClaimVoucher(voucher.id)}
                          disabled={claimingVoucherId === voucher.id}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="ticket-outline" size={16} color={bgColor} />
                          <Text style={[styles.ticketClaimBtnText, { color: bgColor }]}>
                            {claimingVoucherId === voucher.id ? '...' : 'Claim'}
                          </Text>
                        </TouchableOpacity>
                      )}
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
          subscriptionDiscount={subscriptionDiscount}
          voucherDiscount={voucherDiscount}
          perkDiscount={perkDiscount}
          perksApplied={perksApplied}
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
    backgroundColor: '#F3F0E6',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cartIconBtn: {
    backgroundColor: '#F3F0E6',
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
    flexDirection: 'row',
    backgroundColor: Colors.primary.default,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loyaltyTeaserLeft: {
    flex: 1,
    paddingRight: 10,
  },
  loyaltyTeaserTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#FAF9F5',
    opacity: 0.8,
  },
  loyaltyTeaserPoints: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: '#FAF9F5',
    marginVertical: 2,
  },
  pointsLabel: {
    fontFamily: 'Poppins',
    fontSize: 14,
    opacity: 0.8,
  },
  loyaltyMiniProgressBg: {
    width: '90%',
    height: 4,
    backgroundColor: 'rgba(250, 249, 245, 0.2)',
    borderRadius: 2,
    marginVertical: 8,
  },
  loyaltyMiniProgressFill: {
    height: '100%',
    backgroundColor: Colors.secondary.default,
    borderRadius: 2,
  },
  loyaltyProgressText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: '#FAF9F5',
    opacity: 0.75,
  },
  loyaltyTeaserRight: {
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(250, 249, 245, 0.15)',
    paddingLeft: 16,
    width: 90,
  },
  viewStampsText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#FAF9F5',
    marginTop: 4,
    textAlign: 'center',
  },
  promoSection: {
    marginBottom: 20,
  },
  promoScroll: {
    paddingBottom: 8,
  },
  promoCardContainer: {
    width: 310,
    height: 132,
    borderRadius: 20,
    marginRight: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  promoCardLeft: {
    flex: 1.3,
    padding: 16,
    justifyContent: 'space-between',
  },
  promoCardHeading: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#FFF',
    lineHeight: 26,
  },
  promoCardSubheading: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#FFF',
    marginTop: 2,
    opacity: 0.9,
  },
  promoCardActionRow: {
    marginTop: 8,
  },
  promoPill: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFF',
    height: 26,
  },
  promoPillLabel: {
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  promoPillLabelText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 7.5,
    color: Colors.secondary.default,
    textTransform: 'uppercase',
  },
  promoPillValue: {
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  promoPillValueText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#333',
    letterSpacing: 0.5,
  },
  promoPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    height: 26,
  },
  promoPillBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#FFF',
  },
  promoCardFootnote: {
    fontFamily: 'Poppins',
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 2,
  },
  promoCardRight: {
    flex: 1.1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoImageBgShape: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    left: 16,
    right: -20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderTopLeftRadius: 36,
    borderBottomLeftRadius: 36,
    transform: [{ rotate: '-8deg' }],
  },
  promoProductImage: {
    width: 84,
    height: 84,
    borderRadius: 14,
    zIndex: 2,
  },
  promoFloatBadge: {
    position: 'absolute',
    bottom: 12,
    left: 136,
    zIndex: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  promoFloatBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8.5,
    color: '#FFF',
    letterSpacing: 0.3,
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
    height: 68,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray200,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
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
    marginTop: 4,
  },
  navTextActive: {
    color: Colors.primary.default,
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
    backgroundColor: '#F3F0E6',
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
    backgroundColor: '#F3F0E6',
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
    color: Colors.secondary.default,
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
    backgroundColor: '#F3F0E6',
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
});
