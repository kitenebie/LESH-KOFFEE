import React, { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { isLoggedIn as checkIsLoggedIn } from './authSession';
import { getPublicData } from './prefetch';
import * as repo from './dataRepository';
import * as db from './database';
import { getTransactions as getLoyaltyTransactions } from '../services/loyaltyService';
import { getNotifications } from '../services/notificationsService';
import { getOrders } from '../services/ordersService';
import { getStamps } from '../services/stampsService';
import { getAddresses, getProfile } from '../services/userService';
import { getVouchers } from '../services/vouchersService';
import { getWallet } from '../services/walletService';

// ─── App Data Shape ─────────────────────────────────────────────────────────
export interface AppData {
  user: any;
  deliveryTracking: any;
  store: any;
  categories: any[];
  products: any[];
  orders: { active: any[]; past: any[] };
  notifications: any[];
  stamps: { collected: number; required: number; achievements: any[]; vouchers: any[] };
  vouchers: any[];
  wallet: { balance: number; transactions: any[] };
  loyaltyTransactions: any[];
  subscriptions: any[];
  promos: any[];
  customizationOptions: Record<string, any>;
}

// ─── Default empty data ─────────────────────────────────────────────────────
const PLACEHOLDER_AVATAR = 'https://ui-avatars.com/api/?name=U&background=F3F0E6&color=4A3525&size=150';

const EMPTY_DATA: AppData = {
  user: {
    id: '', name: 'Loading...', firstName: '', email: '', phone: '',
    avatar: PLACEHOLDER_AVATAR, memberLevel: 'Silver', memberLevelLabel: 'Lesh Kaffe Silver Member',
    walletBalance: 0, loyaltyPoints: 0, stampsCollected: 0, stampsRequired: 8,
    subscriptionBalance: 0, activeSubscription: null, joinedDate: '',
    tableNo: '', cashier: '', location: { latitude: 0, longitude: 0 }, addresses: [],
  },
  deliveryTracking: {
    riderName: '', riderPhone: '', riderAvatar: '',
    riderLocation: { latitude: 0, longitude: 0 },
    userLocation: { latitude: 0, longitude: 0 },
    estimatedMinutes: 0,
  },
  store: {
    name: '', tagline: '', address: '', phone: '', email: '', hours: '',
    spotlightCustomer: { name: '', cupsThisMonth: 0, avatar: '', reward: '' },
  },
  categories: [],
  products: [],
  orders: { active: [], past: [] },
  notifications: [],
  stamps: { collected: 0, required: 8, achievements: [], vouchers: [] },
  vouchers: [],
  wallet: { balance: 0, transactions: [] },
  loyaltyTransactions: [],
  subscriptions: [],
  promos: [],
  customizationOptions: {},
};

// ─── Transform API data to AppData format ───────────────────────────────────
function transformApiData(raw: {
  user: any; addresses: any; products: any; categories: any;
  orders: any; wallet: any; loyalty: any; notifications: any;
  stamps: any; promos: any; subscriptions: any; store: any; vouchers: any;
}): AppData {
  const user = raw.user ? {
    id: raw.user.id?.toString() || '',
    name: raw.user.name || '',
    firstName: raw.user.first_name || raw.user.name?.split(' ')[0] || '',
    email: raw.user.email || '',
    phone: raw.user.phone || '',
    avatar: raw.user.avatar || '',
    memberLevel: raw.user.member_level || 'Silver',
    memberLevelLabel: raw.user.member_level_label || 'Lesh Kaffe Silver Member',
    walletBalance: Number(raw.user.wallet_balance) || 0,
    loyaltyPoints: Number(raw.user.loyalty_points) || 0,
    stampsCollected: Number(raw.user.stamps_collected) || 0,
    stampsRequired: Number(raw.user.stamps_required) || 8,
    subscriptionBalance: Number(raw.user.subscription_balance) || 0,
    activeSubscription: raw.user.active_subscription || null,
    joinedDate: raw.user.joined_date || '',
    tableNo: raw.user.table_no || '04',
    cashier: raw.user.cashier || 'Maria A.',
    location: { latitude: raw.user.latitude || 0, longitude: raw.user.longitude || 0 },
    addresses: (raw.addresses || []).map((a: any) => ({
      id: String(a.id), label: a.label || '', address: a.address || '', isDefault: a.is_default || false,
    })),
  } : EMPTY_DATA.user;

  const categories = (raw.categories || []).map((c: any) => ({
    id: c.slug || c.id?.toString() || '', name: c.name || '', icon: c.icon || 'grid-outline',
  }));

  const products = (raw.products || []).map((p: any) => ({
    id: p.id?.toString() || '',
    categoryId: p.category?.slug || p.category_id?.toString() || '',
    name: p.name || '', description: p.description || '',
    price: Number(p.price) || 0, rating: Number(p.rating) || 0, reviews: Number(p.reviews) || 0,
    isPopular: p.is_popular || false, image: p.image || '', customizable: p.is_customizable || false,
  }));

  const orderTransform = (o: any) => ({
    id: o.order_number || o.id?.toString() || '',
    date: o.date || '', time: o.time || '', status: o.status || '',
    currentStep: o.current_step || '', fulfillment: o.fulfillment || 'DineIn',
    tableNo: o.table_no || '', cashier: o.cashier || '',
    lineItems: (o.items || o.line_items || []).map((i: any) => ({
      name: i.name || '', qty: i.quantity || 1, price: Number(i.price) || 0,
    })),
    subtotal: Number(o.subtotal) || 0, deliveryFee: Number(o.delivery_fee) || 0,
    discount: Number(o.discount) || 0, total: Number(o.total) || 0,
  });

  const orders = raw.orders ? {
    active: (raw.orders.active || []).map(orderTransform),
    past: (raw.orders.past || []).map(orderTransform),
  } : EMPTY_DATA.orders;

  const wallet = raw.wallet ? {
    balance: Number(raw.wallet.balance) || 0,
    transactions: (raw.wallet.transactions || []).map((t: any) => ({
      id: t.id?.toString() || '', type: t.type === 'topup' ? 'credit' : t.type || 'debit',
      amount: Number(t.amount) || 0, description: t.description || '',
      date: t.transaction_date || t.created_at || '',
    })),
  } : EMPTY_DATA.wallet;

  const loyaltyTransactions = (raw.loyalty || []).map((t: any) => ({
    id: t.id?.toString() || '', type: t.type || 'earned',
    points: Number(t.points) || 0, description: t.description || '',
    date: t.transaction_date || t.created_at || '',
  }));

  const notifications = (raw.notifications || []).map((n: any) => ({
    id: n.id?.toString() || '', type: n.type || '', icon: n.icon || 'notifications-outline',
    title: n.title || '', message: n.message || '', time: n.time || n.created_at || '',
    unread: n.is_unread ?? true,
  }));

  const stampsData = raw.stamps || [];
  const achievements = (Array.isArray(stampsData) ? stampsData : []).map((s: any) => ({
    id: s.id?.toString() || '', category: s.category || '',
    icon: s.icon || 'cafe-outline', color: s.color || '#4A3525', accentColor: s.accent_color || '#B36534',
    label: s.label || '', description: s.description || '',
    collected: Number(s.collected) || 0, required: Number(s.required) || 8, reward: s.reward || '',
    history: (s.histories || s.history || []).map((h: any) => ({
      id: h.id?.toString() || '', product: h.product_name || h.product || '',
      date: h.stamped_date || '', time: h.stamped_time || '',
    })),
  }));

  const totalCollected = achievements.reduce((sum: number, a: any) => sum + a.collected, 0);
  const totalRequired = achievements.reduce((sum: number, a: any) => sum + a.required, 0);

  const stampVouchers = (raw.vouchers || []).map((v: any) => ({
    id: v.id?.toString() || '', code: v.code || '',
    description: v.description || '', expiresAt: v.expires_at || '', used: v.is_used || false,
  }));

  const globalVouchers = (raw.vouchers || []).map((v: any) => ({
    code: v.code || '', discount: Number(v.discount) || 0, label: v.description || '', type: 'percent',
  }));

  const promos = (raw.promos || []).map((p: any) => ({
    id: p.id?.toString() || '', label: p.badge || p.label || '',
    title: p.heading || p.title || '', heading: p.heading || p.title || '',
    subheading: p.subheading || '', subtitle: p.subheading || '',
    color: p.color || '#B36534', code: p.voucher?.code || p.code || '',
    badge: p.badge || '', image: p.image || '',
  }));

  const subscriptions = (raw.subscriptions || []).map((s: any) => ({
    id: s.id?.toString() || '', name: s.name || '', description: s.description || '',
    price: Number(s.price) || 0, drinks: s.drinks || 0, icon: s.icon || 'cafe-outline',
  }));

  const store = raw.store ? {
    name: raw.store.name || '', tagline: raw.store.tagline || '',
    address: raw.store.address || '', phone: raw.store.phone || '',
    email: raw.store.email || '', hours: raw.store.hours || '',
    spotlightCustomer: raw.store.spotlight_customer || raw.store.spotlightCustomer || EMPTY_DATA.store.spotlightCustomer,
  } : EMPTY_DATA.store;

  // Build customizationOptions from products that have customization data
  const customizationOptions: Record<string, any> = {};
  if (raw.products) {
    for (const p of raw.products) {
      if (p.customization) {
        customizationOptions[p.id?.toString()] = {
          productId: p.id?.toString(),
          customizations: p.customization.customizations || null,
        };
      }
    }
  }

  return {
    user, deliveryTracking: EMPTY_DATA.deliveryTracking, store, categories, products,
    orders, notifications,
    stamps: { collected: totalCollected, required: totalRequired, achievements, vouchers: stampVouchers },
    vouchers: globalVouchers, wallet, loyaltyTransactions, subscriptions, promos, customizationOptions,
  };
}

// ─── Store transformed data into SQLite ─────────────────────────────────────
async function storeInSQLite(data: AppData): Promise<void> {
  try {
    // Store user profile (loyaltyPoints, walletBalance, etc.)
    if (data.user && data.user.id && data.user.id !== '') await db.insertUser(data.user);

    if (data.categories.length > 0) await db.insertCategories(data.categories);
    if (data.products.length > 0) await db.insertProducts(data.products);
    if (data.customizationOptions && Object.keys(data.customizationOptions).length > 0) {
      await db.insertCustomizationOptions(data.customizationOptions);
    }
    if (data.promos.length > 0) await db.insertPromos(data.promos);
    if (data.subscriptions.length > 0) await db.insertSubscriptions(data.subscriptions);
    if (data.store.name) await db.insertStore(data.store);
    if (data.orders.active.length > 0 || data.orders.past.length > 0) await db.insertOrders(data.orders);
    if (data.notifications.length > 0) await db.insertNotifications(data.notifications);
    if (data.stamps.achievements.length > 0) await db.insertStamps(data.stamps);
    if (data.vouchers.length > 0) await db.insertVouchers(data.vouchers);
    if (data.wallet.balance >= 0 || data.wallet.transactions.length > 0) await db.insertWallet(data.wallet);
    if (data.loyaltyTransactions.length > 0) await db.insertLoyaltyTransactions(data.loyaltyTransactions);
    console.log('[useAppData] Data stored in SQLite');
  } catch (err) {
    console.warn('[useAppData] Failed to store in SQLite:', err);
  }
}

// ─── Read from SQLite ───────────────────────────────────────────────────────
async function readFromSQLite(): Promise<AppData | null> {
  try {
    const hasLocalData = await repo.hasData();
    if (!hasLocalData) return null;

    const data = await repo.getData();
    if (data && data.products && data.products.length > 0) {
      console.log('[useAppData] Loaded from SQLite');
      return data;
    }
    return null;
  } catch (err) {
    console.warn('[useAppData] Failed to read from SQLite:', err);
    return null;
  }
}

// ─── React Context ──────────────────────────────────────────────────────────
export interface AppDataContextType {
  data: AppData;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  updateProfileLocal: (name: string, email: string, phone: string) => Promise<void>;
  addAddressLocal: (label: string, address: string, latitude?: number | null, longitude?: number | null) => Promise<void>;
  setDefaultAddressLocal: (id: string) => Promise<void>;
  updateSettingsLocal: (settings: { biometrics?: boolean; pushNotifications?: boolean; emailMarketing?: boolean }) => Promise<void>;
  addOrderLocal: (order: any) => Promise<void>;
}

export const AppDataContext = React.createContext<AppDataContextType | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const fetchFromAPI = useCallback(async (): Promise<AppData | null> => {
    const loggedIn = await checkIsLoggedIn();
    const publicData = await getPublicData();

    let userRes: any = null, addressesRes: any = null, ordersRes: any = null;
    let walletRes: any = null, loyaltyRes: any = null, notificationsRes: any = null;
    let stampsRes: any = null, vouchersRes: any = null;

    if (loggedIn) {
      const results = await Promise.allSettled([
        getProfile(), getAddresses(), getOrders(), getWallet(),
        getLoyaltyTransactions(), getNotifications(), getStamps(), getVouchers(),
      ]);
      const get = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;
      [userRes, addressesRes, ordersRes, walletRes, loyaltyRes, notificationsRes, stampsRes, vouchersRes] =
        results.map(get);
    }

    return transformApiData({
      user: userRes, addresses: addressesRes,
      products: publicData.products, categories: publicData.categories,
      orders: ordersRes ? ordersRes : null, wallet: walletRes,
      loyalty: loyaltyRes, notifications: notificationsRes,
      stamps: stampsRes, promos: publicData.promos,
      subscriptions: publicData.subscriptions, store: publicData.store,
      vouchers: vouchersRes,
    });
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    try {
      const loggedIn = await checkIsLoggedIn();
      if (!loggedIn) return;

      const database = await db.getDatabase();

      // 1. Sync profile if dirty
      const dirtyUser = await database.getFirstAsync('SELECT * FROM users WHERE is_dirty = 1') as any;
      if (dirtyUser) {
        const { updateProfile } = await import('../services/userService');
        const res = await updateProfile({
          name: dirtyUser.name,
          email: dirtyUser.email,
          phone: dirtyUser.phone
        });
        if (res) {
          await database.runAsync('UPDATE users SET is_dirty = 0 WHERE id = ?', [dirtyUser.id]);
          console.log('[Sync] User profile synced successfully');
        }
      }

      // 2. Sync addresses if dirty
      const dirtyAddresses = await database.getAllAsync('SELECT * FROM user_addresses WHERE is_dirty = 1') as any[];
      for (const addr of dirtyAddresses) {
        const { addAddress, setDefaultAddress } = await import('../services/userService');
        if (addr.id.startsWith('temp_addr_')) {
          const res = await addAddress({
            label: addr.label,
            address: addr.address,
            latitude: addr.latitude || null,
            longitude: addr.longitude || null,
            is_default: addr.isDefault === 1
          });
          if (res) {
            await database.runAsync('DELETE FROM user_addresses WHERE id = ?', [addr.id]);
            await database.runAsync(
              'INSERT OR REPLACE INTO user_addresses (id, userId, label, address, isDefault, is_dirty) VALUES (?, ?, ?, ?, ?, 0)',
              [res.id.toString(), dirtyUser ? dirtyUser.id : 'u001', res.label, res.address, res.is_default ? 1 : 0]
            );
            console.log('[Sync] New offline address added to server:', res.id);
          }
        } else {
          if (addr.isDefault === 1) {
            const res = await setDefaultAddress(addr.id);
            if (res) {
              await database.runAsync('UPDATE user_addresses SET is_dirty = 0 WHERE id = ?', [addr.id]);
              console.log('[Sync] Default address synced to server:', addr.id);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Sync] Offline queue processing failed:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setError(null);

      // STEP 1: Try loading from SQLite first (instant, offline-first)
      const localData = await readFromSQLite();
      if (localData) {
        setData(localData);
      }
      setIsLoading(false); // Always stop loading after SQLite check (even if null)

      // STEP 2: Sync offline queue
      try {
        await syncOfflineQueue();
      } catch (syncErr) {
        console.warn('[useAppData] Offline sync failed (non-blocking):', syncErr);
      }

      // STEP 3: Background fetch from API
      setIsSyncing(true);
      const apiData = await fetchFromAPI();

      if (apiData) {
        // Always set data immediately from API (don't depend on SQLite roundtrip)
        console.log('[useAppData] Setting data — products:', apiData.products?.length, 'categories:', apiData.categories?.length, 'promos:', apiData.promos?.length);
        setData(apiData);

        // Store in SQLite in background (for offline next time)
        try {
          await storeInSQLite(apiData);
        } catch (storeErr) {
          console.warn('[useAppData] SQLite store failed:', storeErr);
        }
      }
    } catch (err: any) {
      console.warn('[useAppData] Error:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [fetchFromAPI, syncOfflineQueue]);

  const backgroundSync = useCallback(async () => {
    try {
      await syncOfflineQueue();

      const apiData = await fetchFromAPI();
      if (apiData) {
        // Always update display directly from API
        setData(apiData);

        // Store in SQLite for offline
        try {
          await storeInSQLite(apiData);
        } catch (e) {}
      }
    } catch (err) {
      // Silent fail
    }
  }, [fetchFromAPI, syncOfflineQueue]);

  const updateProfileLocal = useCallback(async (name: string, email: string, phone: string) => {
    setData(prev => ({
      ...prev,
      user: { ...prev.user, name, email, phone }
    }));

    try {
      const database = await db.getDatabase();
      const user = await repo.getUser();
      if (user) {
        await database.runAsync(
          'UPDATE users SET name = ?, email = ?, phone = ?, is_dirty = 1 WHERE id = ?',
          [name, email, phone, user.id]
        );
        console.log('[useAppData] Local profile updated in SQLite');
      }
      backgroundSync();
    } catch (err) {
      console.warn('[useAppData] Failed to update local profile:', err);
    }
  }, [backgroundSync]);

  const addAddressLocal = useCallback(async (label: string, address: string, latitude?: number | null, longitude?: number | null) => {
    const tempId = `temp_addr_${Date.now()}`;
    const newAddr = {
      id: tempId,
      label,
      address,
      isDefault: false,
      is_dirty: true
    };

    setData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        addresses: [...prev.user.addresses, newAddr]
      }
    }));

    try {
      const database = await db.getDatabase();
      const user = await repo.getUser();
      if (user) {
        await database.runAsync(
          'INSERT INTO user_addresses (id, userId, label, address, isDefault, is_dirty) VALUES (?, ?, ?, ?, 0, 1)',
          [tempId, user.id, label, address]
        );
        console.log('[useAppData] Local address inserted in SQLite');
      }
      backgroundSync();
    } catch (err) {
      console.warn('[useAppData] Failed to add local address:', err);
    }
  }, [backgroundSync]);

  const setDefaultAddressLocal = useCallback(async (id: string) => {
    setData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        addresses: prev.user.addresses.map((a: any) => ({
          ...a,
          isDefault: a.id === id
        }))
      }
    }));

    try {
      const database = await db.getDatabase();
      const user = await repo.getUser();
      if (user) {
        await database.runAsync('UPDATE user_addresses SET isDefault = 0 WHERE userId = ?', [user.id]);
        await database.runAsync('UPDATE user_addresses SET isDefault = 1, is_dirty = 1 WHERE id = ?', [id]);
        console.log('[useAppData] Local default address updated in SQLite');
      }
      backgroundSync();
    } catch (err) {
      console.warn('[useAppData] Failed to set default address:', err);
    }
  }, [backgroundSync]);

  const updateSettingsLocal = useCallback(async (settings: { biometrics?: boolean; pushNotifications?: boolean; emailMarketing?: boolean }) => {
    setData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        ...settings
      }
    }));

    try {
      const database = await db.getDatabase();
      const user = await repo.getUser();
      if (user) {
        if (settings.biometrics !== undefined) {
          await database.runAsync('UPDATE users SET biometrics = ? WHERE id = ?', [settings.biometrics ? 1 : 0, user.id]);
        }
        if (settings.pushNotifications !== undefined) {
          await database.runAsync('UPDATE users SET pushNotifications = ? WHERE id = ?', [settings.pushNotifications ? 1 : 0, user.id]);
        }
        if (settings.emailMarketing !== undefined) {
          await database.runAsync('UPDATE users SET emailMarketing = ? WHERE id = ?', [settings.emailMarketing ? 1 : 0, user.id]);
        }
        console.log('[useAppData] Local settings updated in SQLite');
      }
    } catch (err) {
      console.warn('[useAppData] Failed to update local settings:', err);
    }
  }, []);

  const addOrderLocal = useCallback(async (order: any) => {
    setData(prev => ({
      ...prev,
      orders: {
        ...prev.orders,
        active: [order, ...prev.orders.active]
      }
    }));

    try {
      const database = await db.getDatabase();
      await database.runAsync(
        `INSERT INTO orders (id, date, time, status, currentStep, fulfillment, tableNo, cashier, subtotal, deliveryFee, discount, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          order.date,
          order.time,
          order.status,
          order.currentStep,
          order.fulfillment,
          order.tableNo || null,
          order.cashier || null,
          order.subtotal,
          order.deliveryFee || 0,
          order.discount || 0,
          order.total
        ]
      );

      if (order.lineItems) {
        for (const item of order.lineItems) {
          await database.runAsync(
            'INSERT INTO order_items (orderId, name, qty, price) VALUES (?, ?, ?, ?)',
            [order.id, item.name, item.qty, item.price]
          );
        }
      }
      console.log('[useAppData] Local order inserted in SQLite');
    } catch (err) {
      console.warn('[useAppData] Failed to insert local order in SQLite:', err);
    }
  }, []);

  // ─── Trigger data load and start polling ──────────────────────────────────
  useEffect(() => {
    loadData();

    // Start 10-second polling interval
    intervalRef.current = setInterval(() => {
      backgroundSync();
    }, 7000);

    // Pause polling when app goes to background, resume when active
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        backgroundSync();
      }
      appStateRef.current = nextState;
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      appStateSub.remove();
    };
  }, [loadData, backgroundSync]);

  return (
    <AppDataContext.Provider
      value={{
        data,
        isLoading,
        isSyncing,
        error,
        refreshData: loadData,
        updateProfileLocal,
        addAddressLocal,
        setDefaultAddressLocal,
        updateSettingsLocal,
        addOrderLocal,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
