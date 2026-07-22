import { getCategories as fetchCategories } from '../services/categoriesService';
import { getTransactions as fetchLoyalty } from '../services/loyaltyService';
import { getNotifications as fetchNotifications } from '../services/notificationsService';
import { getOrders as fetchOrders } from '../services/ordersService';
import { getProducts as fetchProducts } from '../services/productsService';
import { getPromos as fetchPromos } from '../services/promosService';
import { getStamps as fetchStamps } from '../services/stampsService';
import { getStore as fetchStore } from '../services/storeService';
import { getSubscriptions as fetchSubscriptions } from '../services/subscriptionsService';
import { getAddresses as fetchAddresses, getProfile as fetchProfile } from '../services/userService';
import { getVouchers as fetchVouchers } from '../services/vouchersService';
import { getWallet as fetchWallet } from '../services/walletService';

import {
    insertCategories,
    insertCustomizationOptions,
    insertLoyaltyTransactions,
    insertNotifications,
    insertOrders,
    insertProducts,
    insertPromos,
    insertStamps,
    insertStore,
    insertSubscriptions,
    insertUser,
    insertVouchers,
    insertWallet
} from './database';

// ─── Transform API data to dummyData format ───────────────────────────────────

function transformUser(profile: any, addresses: any[]): any {
  return {
    id: profile?.id?.toString() || 'u001',
    name: profile?.name || '',
    firstName: profile?.first_name || profile?.firstName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    avatar: profile?.avatar || '',
    memberLevel: profile?.member_level || profile?.memberLevel || 'Bronze',
    memberLevelLabel: profile?.member_level_label || profile?.memberLevelLabel || '',
    walletBalance: profile?.wallet_balance ?? profile?.walletBalance ?? 0,
    loyaltyPoints: profile?.loyalty_points ?? profile?.loyaltyPoints ?? 0,
    stampsCollected: profile?.stamps_collected ?? profile?.stampsCollected ?? 0,
    stampsRequired: profile?.stamps_required ?? profile?.stampsRequired ?? 8,
    subscriptionBalance: profile?.subscription_balance ?? profile?.subscriptionBalance ?? 0,
    activeSubscription: typeof (profile?.active_subscription) === 'object' ? (profile?.active_subscription?.name || null) : (profile?.active_subscription ?? profile?.activeSubscription ?? null),
    joinedDate: profile?.joined_date || profile?.joinedDate || '',
    tableNo: profile?.table_no || profile?.tableNo || '',
    cashier: profile?.cashier || '',
    location: {
      latitude: profile?.latitude ?? 0,
      longitude: profile?.longitude ?? 0,
    },
    addresses: (addresses || []).map((a: any) => ({
      id: a.id?.toString() || '',
      label: a.label || '',
      address: a.address || '',
      isDefault: a.is_default ?? a.isDefault ?? false,
    })),
  };
}

function transformProducts(products: any[]): any[] {
  return (products || []).map((p: any) => ({
    id: p.id?.toString() || `p${p.id}`,
    categoryId: p.category?.slug || p.category_id?.toString() || p.categoryId || '',
    name: p.name || '',
    description: p.description || '',
    price: p.price ?? 0,
    rating: p.rating ?? 0,
    reviews: p.reviews ?? 0,
    isPopular: p.is_popular ?? p.isPopular ?? false,
    image: p.image || '',
    customizable: p.is_customizable ?? p.customizable ?? false,
  }));
}

function transformCategories(categories: any[]): any[] {
  return (categories || []).map((c: any) => ({
    id: c.slug || c.id?.toString() || '',
    name: c.name || '',
    icon: c.icon || '',
  }));
}

function transformOrders(ordersData: any): { active: any[]; past: any[] } {
  const transform = (orders: any[]) => (orders || []).map((o: any) => ({
    id: o.order_number || o.id?.toString() || '',
    date: o.date || '',
    time: o.time || '',
    status: o.status || '',
    currentStep: o.current_step || o.currentStep || '',
    fulfillment: o.fulfillment || '',
    tableNo: o.table_no || o.tableNo || null,
    cashier: o.cashier || null,
    lineItems: (o.items || o.lineItems || []).map((item: any) => ({
      name: item.name || '',
      qty: item.quantity || item.qty || 0,
      price: item.price ?? 0,
    })),
    subtotal: o.subtotal ?? 0,
    deliveryFee: o.delivery_fee ?? o.deliveryFee ?? 0,
    discount: o.discount ?? 0,
    total: o.total ?? 0,
  }));

  if (ordersData?.active && ordersData?.past) {
    return { active: transform(ordersData.active), past: transform(ordersData.past) };
  }

  return { active: [], past: [] };
}

function transformWallet(walletData: any): any {
  return {
    balance: walletData?.balance ?? 0,
    transactions: (walletData?.transactions || []).map((t: any) => ({
      id: t.id?.toString() || '',
      type: t.type === 'topup' ? 'credit' : t.type || '',
      amount: t.amount ?? 0,
      description: t.description || '',
      date: t.transaction_date || t.date || t.created_at?.split('T')[0] || '',
    })),
  };
}

function transformLoyalty(transactions: any[]): any[] {
  return (transactions || []).map((t: any) => ({
    id: t.id?.toString() || '',
    type: t.type || '',
    points: t.points ?? 0,
    description: t.description || '',
    date: t.transaction_date || t.date || t.created_at?.split('T')[0] || '',
  }));
}

function transformNotifications(notifications: any[]): any[] {
  return (notifications || []).map((n: any) => ({
    id: n.id?.toString() || '',
    type: n.type || '',
    icon: n.icon || '',
    title: n.title || '',
    message: n.message || '',
    time: n.time || n.created_at || '',
    unread: n.is_unread ?? n.unread ?? false,
  }));
}

function transformStamps(stampsData: any): any {
  const achievements = (stampsData?.achievements || stampsData || []).map((a: any) => ({
    id: a.id?.toString() || '',
    category: a.category || '',
    icon: a.icon || '',
    color: a.color || '',
    accentColor: a.accent_color || a.accentColor || '',
    label: a.label || '',
    description: a.description || '',
    collected: a.collected ?? 0,
    required: a.required ?? 8,
    reward: a.reward || '',
    history: (a.histories || a.history || []).map((h: any) => ({
      id: h.id?.toString() || '',
      product: h.product_name || h.product || '',
      date: h.stamped_date || h.date || '',
      time: h.stamped_time || h.time || '',
    })),
  }));

  return {
    collected: achievements[0]?.collected ?? 0,
    required: achievements[0]?.required ?? 8,
    achievements,
    vouchers: (stampsData?.vouchers || []).map((v: any) => ({
      id: v.id?.toString() || '',
      code: v.code || '',
      description: v.description || '',
      expiresAt: v.expires_at || v.expiresAt || '',
      used: v.is_used ?? v.used ?? false,
    })),
  };
}

function transformVouchers(vouchers: any[]): any[] {
  return (vouchers || []).map((v: any) => ({
    code: v.code || '',
    discount: v.discount ?? 0,
    label: v.label || '',
    type: v.type || 'percent',
  }));
}

function transformPromos(promos: any[]): any[] {
  return (promos || []).map((p: any) => ({
    id: p.id?.toString() || '',
    label: p.label || p.badge || '',
    title: p.title || p.heading || '',
    heading: p.heading || p.title || '',
    subheading: p.subheading || p.subtitle || '',
    subtitle: p.subtitle || p.subheading || '',
    color: p.color || '#2D78CD',
    code: p.code || p.voucher?.code || '',
    badge: p.badge || p.label || '',
    image: p.image || '',
  }));
}

function transformSubscriptions(subscriptions: any[]): any[] {
  return (subscriptions || []).map((s: any) => ({
    id: s.id?.toString() || '',
    name: s.name || '',
    description: s.description || '',
    price: s.price ?? 0,
    drinks: s.drinks ?? 0,
    icon: s.icon || '',
  }));
}

function transformStore(store: any): any {
  return {
    name: store?.name || '',
    tagline: store?.tagline || '',
    address: store?.address || '',
    phone: store?.phone || '',
    email: store?.email || '',
    hours: store?.hours || '',
    spotlightCustomer: store?.spotlightCustomer || store?.spotlight_customer || {
      name: '',
      cupsThisMonth: 0,
      avatar: '',
      reward: '',
    },
  };
}

// ─── Sync Functions ───────────────────────────────────────────────────────────

export async function syncUser(): Promise<boolean> {
  try {
    const profile = await fetchProfile();
    const addresses = await fetchAddresses();
    if (profile) {
      const user = transformUser(profile, addresses || []);
      await insertUser(user);
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[Sync] User failed:', e);
    return false;
  }
}

export async function syncProducts(): Promise<boolean> {
  try {
    const products = await fetchProducts();
    if (products) {
      const transformed = transformProducts(products);
      await insertProducts(transformed);
      // Build customization options from product.customizations
      const options: Record<string, any> = {};
      for (const p of products) {
        if (p.customizations && p.customizations.length > 0) {
          options[`p${p.id}`] = { productId: `p${p.id}`, ...p.customizations };
        }
      }
      if (Object.keys(options).length > 0) {
        await insertCustomizationOptions(options);
      }
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[Sync] Products failed:', e);
    return false;
  }
}

export async function syncCategories(): Promise<boolean> {
  try {
    const categories = await fetchCategories();
    if (categories) {
      await insertCategories(transformCategories(categories));
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[Sync] Categories failed:', e);
    return false;
  }
}

export async function syncOrders(): Promise<boolean> {
  try {
    const orders = await fetchOrders();
    if (orders) {
      const transformed = transformOrders(orders);
      await insertOrders(transformed);
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[Sync] Orders failed:', e);
    return false;
  }
}

export async function syncWallet(): Promise<boolean> {
  try {
    const wallet = await fetchWallet();
    if (wallet) {
      await insertWallet(transformWallet(wallet));
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[Sync] Wallet failed:', e);
    return false;
  }
}

export async function syncLoyalty(): Promise<boolean> {
  try {
    const transactions = await fetchLoyalty();
    if (transactions) {
      await insertLoyaltyTransactions(transformLoyalty(transactions));
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[Sync] Loyalty failed:', e);
    return false;
  }
}

export async function syncNotifications(): Promise<boolean> {
  try {
    const notifications = await fetchNotifications();
    if (notifications) {
      await insertNotifications(transformNotifications(notifications));
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[Sync] Notifications failed:', e);
    return false;
  }
}

export async function syncStamps(): Promise<boolean> {
  try {
    const stamps = await fetchStamps();
    if (stamps) {
      await insertStamps(transformStamps(stamps));
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[Sync] Stamps failed:', e);
    return false;
  }
}

export async function syncPromos(): Promise<boolean> {
  try {
    const promos = await fetchPromos();
    if (promos) {
      await insertPromos(transformPromos(promos));
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[Sync] Promos failed:', e);
    return false;
  }
}

export async function syncSubscriptions(): Promise<boolean> {
  try {
    const subscriptions = await fetchSubscriptions();
    if (subscriptions) {
      await insertSubscriptions(transformSubscriptions(subscriptions));
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[Sync] Subscriptions failed:', e);
    return false;
  }
}

export async function syncVouchers(): Promise<boolean> {
  try {
    const vouchers = await fetchVouchers();
    if (vouchers) {
      await insertVouchers(transformVouchers(vouchers as any));
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[Sync] Vouchers failed:', e);
    return false;
  }
}

export async function syncStore(): Promise<boolean> {
  try {
    const store = await fetchStore();
    if (store) {
      await insertStore(transformStore(store));
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[Sync] Store failed:', e);
    return false;
  }
}

// ─── Sync All ─────────────────────────────────────────────────────────────────

export async function syncAll(): Promise<{ success: boolean; synced: string[]; failed: string[] }> {
  const results: { name: string; ok: boolean }[] = [];

  const tasks: [string, () => Promise<boolean>][] = [
    ['user', syncUser],
    ['categories', syncCategories],
    ['products', syncProducts],
    ['orders', syncOrders],
    ['wallet', syncWallet],
    ['loyalty', syncLoyalty],
    ['notifications', syncNotifications],
    ['stamps', syncStamps],
    ['promos', syncPromos],
    ['subscriptions', syncSubscriptions],
    ['vouchers', syncVouchers],
    ['store', syncStore],
  ];

  for (const [name, fn] of tasks) {
    const ok = await fn();
    results.push({ name, ok });
  }

  const synced = results.filter((r) => r.ok).map((r) => r.name);
  const failed = results.filter((r) => !r.ok).map((r) => r.name);

  console.log(`[Sync] Complete: ${synced.length} synced, ${failed.length} failed`);
  if (failed.length > 0) console.warn('[Sync] Failed:', failed);

  return { success: failed.length === 0, synced, failed };
}
