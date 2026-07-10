import { getDatabase } from './database';

// ─── Read Helpers (return data in same format as dummyData.json) ───────────────

export async function getUser(): Promise<any> {
  const db = await getDatabase();
  const user = await db.getFirstAsync('SELECT * FROM users LIMIT 1') as any;
  if (!user) return null;

  const addresses = await db.getAllAsync('SELECT * FROM user_addresses WHERE userId = ? ORDER BY isDefault DESC', [user.id]);

  return {
    ...user,
    biometrics: user.biometrics === 1,
    pushNotifications: user.pushNotifications === 1,
    emailMarketing: user.emailMarketing === 1,
    is_dirty: user.is_dirty === 1,
    location: { latitude: user.latitude, longitude: user.longitude },
    addresses: (addresses as any[]).map((a) => ({
      id: a.id,
      label: a.label,
      address: a.address,
      isDefault: a.isDefault === 1,
      is_dirty: a.is_dirty === 1,
    })),
  };
}

export async function getCategories(): Promise<any[]> {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM categories');
}

export async function getProducts(): Promise<any[]> {
  const db = await getDatabase();
  const products = await db.getAllAsync('SELECT * FROM products') as any[];
  return products.map((p) => ({
    ...p,
    isPopular: p.isPopular === 1,
    customizable: p.customizable === 1,
  }));
}

export async function getCustomizationOptions(): Promise<Record<string, any>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM product_customizations') as any[];
  const options: Record<string, any> = {};

  for (const row of rows) {
    options[row.productId] = {
      productId: row.productId,
      customizations: row.customizations ? JSON.parse(row.customizations) : null,
    };
  }

  return options;
}

export async function getOrders(): Promise<{ active: any[]; past: any[] }> {
  const db = await getDatabase();
  const orders = await db.getAllAsync('SELECT * FROM orders') as any[];
  const items = await db.getAllAsync('SELECT * FROM order_items') as any[];

  const ordersWithItems = orders.map((order) => ({
    ...order,
    lineItems: items.filter((item) => item.orderId === order.id).map((item) => ({
      name: item.name,
      qty: item.qty,
      price: item.price,
    })),
  }));

  const active = ordersWithItems.filter((o) => o.status !== 'Completed');
  const past = ordersWithItems.filter((o) => o.status === 'Completed');

  return { active, past };
}

export async function getNotifications(): Promise<any[]> {
  const db = await getDatabase();
  const notifications = await db.getAllAsync('SELECT * FROM notifications') as any[];
  return notifications.map((n) => ({
    ...n,
    unread: n.unread === 1,
  }));
}

export async function getStamps(): Promise<any> {
  const db = await getDatabase();
  const achievements = await db.getAllAsync('SELECT * FROM stamp_achievements') as any[];
  const histories = await db.getAllAsync('SELECT * FROM stamp_histories') as any[];
  const vouchers = await db.getAllAsync('SELECT * FROM user_vouchers') as any[];

  const achievementsWithHistory = achievements.map((ach) => ({
    ...ach,
    history: histories
      .filter((h) => h.achievementId === ach.id)
      .map((h) => ({ id: h.id, product: h.product, date: h.date, time: h.time })),
  }));

  return {
    collected: achievements.length > 0 ? achievements[0].collected : 0,
    required: achievements.length > 0 ? achievements[0].required : 8,
    achievements: achievementsWithHistory,
    vouchers: vouchers.map((v) => ({
      ...v,
      used: v.used === 1,
    })),
  };
}

export async function getVouchers(): Promise<any[]> {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM vouchers');
}

export async function getWallet(): Promise<any> {
  const db = await getDatabase();
  const wallet = await db.getFirstAsync('SELECT * FROM wallet LIMIT 1') as any;
  const transactions = await db.getAllAsync('SELECT * FROM wallet_transactions') as any[];

  return {
    balance: wallet?.balance || 0,
    transactions,
  };
}

export async function getLoyaltyTransactions(): Promise<any[]> {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM loyalty_transactions');
}

export async function getSubscriptions(): Promise<any[]> {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM subscriptions');
}

export async function getPromos(): Promise<any[]> {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM promos');
}

export async function getDeliveryTracking(): Promise<any> {
  const db = await getDatabase();
  const tracking = await db.getFirstAsync('SELECT * FROM delivery_tracking LIMIT 1') as any;
  if (!tracking) return null;

  return {
    riderName: tracking.riderName,
    riderPhone: tracking.riderPhone,
    riderAvatar: tracking.riderAvatar,
    riderLocation: { latitude: tracking.riderLatitude, longitude: tracking.riderLongitude },
    userLocation: { latitude: tracking.userLatitude, longitude: tracking.userLongitude },
    estimatedMinutes: tracking.estimatedMinutes,
  };
}

export async function getStore(): Promise<any> {
  const db = await getDatabase();
  const store = await db.getFirstAsync('SELECT * FROM store LIMIT 1') as any;
  if (!store) return null;

  return {
    name: store.name,
    tagline: store.tagline,
    address: store.address,
    phone: store.phone,
    email: store.email,
    hours: store.hours,
    spotlightCustomer: {
      name: store.spotlightCustomerName,
      cupsThisMonth: store.spotlightCustomerCups,
      avatar: store.spotlightCustomerAvatar,
      reward: store.spotlightCustomerReward,
    },
  };
}

// ─── Get ALL data (same shape as dummyData.json) ──────────────────────────────

export async function getData(): Promise<any> {
  const [user, categories, products, orders, notifications, stamps, vouchers, wallet, loyaltyTransactions, subscriptions, promos, customizationOptions, deliveryTracking, store] = await Promise.all([
    getUser(),
    getCategories(),
    getProducts(),
    getOrders(),
    getNotifications(),
    getStamps(),
    getVouchers(),
    getWallet(),
    getLoyaltyTransactions(),
    getSubscriptions(),
    getPromos(),
    getCustomizationOptions(),
    getDeliveryTracking(),
    getStore(),
  ]);

  return {
    user,
    deliveryTracking,
    store,
    categories,
    products,
    orders,
    notifications,
    stamps,
    vouchers,
    wallet,
    loyaltyTransactions,
    subscriptions,
    promos,
    customizationOptions,
  };
}

// ─── Check if DB has data ─────────────────────────────────────────────────────

export async function hasData(): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM users') as any;
  return result?.count > 0;
}
