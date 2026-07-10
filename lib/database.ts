import * as SQLite from 'expo-sqlite';

const DB_NAME = 'leshkaffe.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync('PRAGMA journal_mode = WAL;');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

  // Migrate schema for product_customizations if needed
  try {
    const tableInfo = await database.getAllAsync("PRAGMA table_info(product_customizations);") as any[];
    const hasCustomizations = tableInfo.some((col: any) => col.name === 'customizations');
    if (tableInfo.length > 0 && !hasCustomizations) {
      console.log('[SQLite] Migration: Dropping old product_customizations table');
      await database.execAsync('DROP TABLE IF EXISTS product_customizations;');
    }
  } catch (err) {
    console.warn('[SQLite] Failed to check/migrate product_customizations table:', err);
  }

  // Migrate auth_tokens: drop and recreate to ensure correct schema
  try {
    await database.execAsync('DROP TABLE IF EXISTS auth_tokens;');
  } catch (err) {
    console.warn('[SQLite] Failed to drop auth_tokens table:', err);
  }

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id INTEGER PRIMARY KEY,
      token TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      firstName TEXT,
      email TEXT,
      phone TEXT,
      avatar TEXT,
      memberLevel TEXT,
      memberLevelLabel TEXT,
      walletBalance REAL DEFAULT 0,
      loyaltyPoints INTEGER DEFAULT 0,
      stampsCollected INTEGER DEFAULT 0,
      stampsRequired INTEGER DEFAULT 8,
      subscriptionBalance INTEGER DEFAULT 0,
      activeSubscription TEXT,
      joinedDate TEXT,
      tableNo TEXT,
      cashier TEXT,
      latitude REAL,
      longitude REAL,
      is_logged_in INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_addresses (
      id TEXT PRIMARY KEY,
      userId TEXT,
      label TEXT,
      address TEXT,
      isDefault INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      categoryId TEXT,
      name TEXT,
      description TEXT,
      price REAL,
      rating REAL,
      reviews INTEGER,
      isPopular INTEGER DEFAULT 0,
      image TEXT,
      customizable INTEGER DEFAULT 0,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS product_customizations (
      productId TEXT PRIMARY KEY,
      customizations TEXT,
      FOREIGN KEY (productId) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      date TEXT,
      time TEXT,
      status TEXT,
      currentStep TEXT,
      fulfillment TEXT,
      tableNo TEXT,
      cashier TEXT,
      subtotal REAL,
      deliveryFee REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId TEXT,
      name TEXT,
      qty INTEGER,
      price REAL,
      FOREIGN KEY (orderId) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT,
      icon TEXT,
      title TEXT,
      message TEXT,
      time TEXT,
      unread INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS stamp_achievements (
      id TEXT PRIMARY KEY,
      category TEXT,
      icon TEXT,
      color TEXT,
      accentColor TEXT,
      label TEXT,
      description TEXT,
      collected INTEGER DEFAULT 0,
      required INTEGER DEFAULT 8,
      reward TEXT
    );

    CREATE TABLE IF NOT EXISTS stamp_histories (
      id TEXT PRIMARY KEY,
      achievementId TEXT,
      product TEXT,
      date TEXT,
      time TEXT,
      FOREIGN KEY (achievementId) REFERENCES stamp_achievements(id)
    );

    CREATE TABLE IF NOT EXISTS user_vouchers (
      id TEXT PRIMARY KEY,
      code TEXT,
      description TEXT,
      expiresAt TEXT,
      used INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS vouchers (
      code TEXT PRIMARY KEY,
      discount REAL,
      label TEXT,
      type TEXT
    );

    CREATE TABLE IF NOT EXISTS wallet (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      balance REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id TEXT PRIMARY KEY,
      type TEXT,
      amount REAL,
      description TEXT,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id TEXT PRIMARY KEY,
      type TEXT,
      points INTEGER,
      description TEXT,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      price REAL,
      drinks INTEGER,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS promos (
      id TEXT PRIMARY KEY,
      label TEXT,
      title TEXT,
      heading TEXT,
      subheading TEXT,
      subtitle TEXT,
      color TEXT,
      code TEXT,
      badge TEXT,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS delivery_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      riderName TEXT,
      riderPhone TEXT,
      riderAvatar TEXT,
      riderLatitude REAL,
      riderLongitude REAL,
      userLatitude REAL,
      userLongitude REAL,
      estimatedMinutes INTEGER
    );

    CREATE TABLE IF NOT EXISTS store (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      tagline TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      hours TEXT,
      spotlightCustomerName TEXT,
      spotlightCustomerCups INTEGER,
      spotlightCustomerAvatar TEXT,
      spotlightCustomerReward TEXT
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId TEXT,
      quantity INTEGER,
      product_json TEXT,
      customization_json TEXT
    );
  `);

  // Run schema migrations for offline support
  try {
    await database.execAsync('ALTER TABLE users ADD COLUMN is_dirty INTEGER DEFAULT 0;');
  } catch (e) {}
  try {
    await database.execAsync('ALTER TABLE users ADD COLUMN biometrics INTEGER DEFAULT 1;');
  } catch (e) {}
  try {
    await database.execAsync('ALTER TABLE users ADD COLUMN pushNotifications INTEGER DEFAULT 1;');
  } catch (e) {}
  try {
    await database.execAsync('ALTER TABLE users ADD COLUMN emailMarketing INTEGER DEFAULT 0;');
  } catch (e) {}
  try {
    await database.execAsync('ALTER TABLE user_addresses ADD COLUMN is_dirty INTEGER DEFAULT 0;');
  } catch (e) {}
}

// ─── Insert Helpers ───────────────────────────────────────────────────────────

export async function insertUser(user: any): Promise<void> {
  const database = await getDatabase();
  
  // Check if user already exists to merge / respect dirty state
  const existingUser = await database.getFirstAsync('SELECT * FROM users WHERE id = ?', [user.id]) as any;

  if (existingUser) {
    const isDirty = existingUser.is_dirty === 1;
    const name = isDirty ? existingUser.name : user.name;
    const firstName = isDirty ? existingUser.firstName : user.firstName;
    const email = isDirty ? existingUser.email : user.email;
    const phone = isDirty ? existingUser.phone : user.phone;

    const biometrics = user.biometrics !== undefined ? (user.biometrics ? 1 : 0) : existingUser.biometrics;
    const pushNotifications = user.pushNotifications !== undefined ? (user.pushNotifications ? 1 : 0) : existingUser.pushNotifications;
    const emailMarketing = user.emailMarketing !== undefined ? (user.emailMarketing ? 1 : 0) : existingUser.emailMarketing;
    const is_dirty = isDirty ? 1 : 0;

    await database.runAsync(
      `UPDATE users SET 
        name = ?, firstName = ?, email = ?, phone = ?, avatar = ?, 
        memberLevel = ?, memberLevelLabel = ?, walletBalance = ?, loyaltyPoints = ?, 
        stampsCollected = ?, stampsRequired = ?, subscriptionBalance = ?, 
        activeSubscription = ?, joinedDate = ?, tableNo = ?, cashier = ?, 
        latitude = ?, longitude = ?, biometrics = ?, pushNotifications = ?, 
        emailMarketing = ?, is_dirty = ?
       WHERE id = ?`,
      [
        name, firstName, email, phone, user.avatar, 
        user.memberLevel, user.memberLevelLabel, user.walletBalance, user.loyaltyPoints, 
        user.stampsCollected, user.stampsRequired, user.subscriptionBalance, 
        user.activeSubscription, user.joinedDate, user.tableNo, user.cashier, 
        user.location?.latitude, user.location?.longitude, biometrics, pushNotifications, 
        emailMarketing, is_dirty, user.id
      ]
    );
  } else {
    const biometrics = user.biometrics !== undefined ? (user.biometrics ? 1 : 0) : 1;
    const pushNotifications = user.pushNotifications !== undefined ? (user.pushNotifications ? 1 : 0) : 1;
    const emailMarketing = user.emailMarketing !== undefined ? (user.emailMarketing ? 1 : 0) : 0;

    await database.runAsync(
      `INSERT INTO users (id, name, firstName, email, phone, avatar, memberLevel, memberLevelLabel, walletBalance, loyaltyPoints, stampsCollected, stampsRequired, subscriptionBalance, activeSubscription, joinedDate, tableNo, cashier, latitude, longitude, biometrics, pushNotifications, emailMarketing, is_dirty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        user.id, user.name, user.firstName, user.email, user.phone, user.avatar, 
        user.memberLevel, user.memberLevelLabel, user.walletBalance, user.loyaltyPoints, 
        user.stampsCollected, user.stampsRequired, user.subscriptionBalance, 
        user.activeSubscription, user.joinedDate, user.tableNo, user.cashier, 
        user.location?.latitude, user.location?.longitude, biometrics, pushNotifications, 
        emailMarketing
      ]
    );
  }

  // Addresses
  if (user.addresses) {
    // Before deleting user_addresses, check which ones are dirty (unsynced)
    const dirtyAddresses = await database.getAllAsync('SELECT * FROM user_addresses WHERE userId = ? AND is_dirty = 1', [user.id]) as any[];
    const dirtyMap = new Map(dirtyAddresses.map(a => [a.id, a]));

    await database.runAsync('DELETE FROM user_addresses WHERE userId = ? AND is_dirty = 0', [user.id]);
    
    for (const addr of user.addresses) {
      if (dirtyMap.has(addr.id.toString())) {
        continue;
      }
      await database.runAsync(
        'INSERT OR REPLACE INTO user_addresses (id, userId, label, address, isDefault, is_dirty) VALUES (?, ?, ?, ?, ?, 0)',
        [addr.id.toString(), user.id, addr.label, addr.address, addr.isDefault ? 1 : 0]
      );
    }
  }
}

export async function insertCategories(categories: any[]): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM categories');
  for (const cat of categories) {
    await database.runAsync(
      'INSERT OR REPLACE INTO categories (id, name, icon) VALUES (?, ?, ?)',
      [cat.id, cat.name, cat.icon]
    );
  }
}

export async function insertProducts(products: any[]): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM products');
  for (const prod of products) {
    await database.runAsync(
      'INSERT OR REPLACE INTO products (id, categoryId, name, description, price, rating, reviews, isPopular, image, customizable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [prod.id, prod.categoryId, prod.name, prod.description, prod.price, prod.rating, prod.reviews, prod.isPopular ? 1 : 0, prod.image, prod.customizable ? 1 : 0]
    );
  }
}

export async function insertCustomizationOptions(options: Record<string, any>): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM product_customizations');
  for (const [productId, config] of Object.entries(options)) {
    await database.runAsync(
      'INSERT OR REPLACE INTO product_customizations (productId, customizations) VALUES (?, ?)',
      [productId, JSON.stringify(config.customizations || config || null)]
    );
  }
}

export async function insertOrders(orders: { active: any[]; past: any[] }): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM orders');
  await database.execAsync('DELETE FROM order_items');

  const allOrders = [...(orders.active || []), ...(orders.past || [])];
  for (const order of allOrders) {
    await database.runAsync(
      'INSERT OR REPLACE INTO orders (id, date, time, status, currentStep, fulfillment, tableNo, cashier, subtotal, deliveryFee, discount, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [order.id, order.date, order.time, order.status, order.currentStep, order.fulfillment, order.tableNo || null, order.cashier || null, order.subtotal, order.deliveryFee || 0, order.discount || 0, order.total]
    );

    if (order.lineItems) {
      for (const item of order.lineItems) {
        await database.runAsync(
          'INSERT INTO order_items (orderId, name, qty, price) VALUES (?, ?, ?, ?)',
          [order.id, item.name, item.qty, item.price]
        );
      }
    }
  }
}

export async function insertNotifications(notifications: any[]): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM notifications');
  for (const notif of notifications) {
    await database.runAsync(
      'INSERT OR REPLACE INTO notifications (id, type, icon, title, message, time, unread) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [notif.id, notif.type, notif.icon, notif.title, notif.message, notif.time, notif.unread ? 1 : 0]
    );
  }
}

export async function insertStamps(stamps: any): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM stamp_achievements');
  await database.execAsync('DELETE FROM stamp_histories');
  await database.execAsync('DELETE FROM user_vouchers');

  if (stamps.achievements) {
    for (const ach of stamps.achievements) {
      await database.runAsync(
        'INSERT OR REPLACE INTO stamp_achievements (id, category, icon, color, accentColor, label, description, collected, required, reward) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [ach.id, ach.category, ach.icon, ach.color, ach.accentColor, ach.label, ach.description, ach.collected, ach.required, ach.reward]
      );

      if (ach.history) {
        for (const h of ach.history) {
          await database.runAsync(
            'INSERT OR REPLACE INTO stamp_histories (id, achievementId, product, date, time) VALUES (?, ?, ?, ?, ?)',
            [h.id, ach.id, h.product, h.date, h.time]
          );
        }
      }
    }
  }

  if (stamps.vouchers) {
    for (const v of stamps.vouchers) {
      await database.runAsync(
        'INSERT OR REPLACE INTO user_vouchers (id, code, description, expiresAt, used) VALUES (?, ?, ?, ?, ?)',
        [v.id, v.code, v.description, v.expiresAt, v.used ? 1 : 0]
      );
    }
  }
}

export async function insertVouchers(vouchers: any[]): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM vouchers');
  for (const v of vouchers) {
    await database.runAsync(
      'INSERT OR REPLACE INTO vouchers (code, discount, label, type) VALUES (?, ?, ?, ?)',
      [v.code, v.discount, v.label, v.type]
    );
  }
}

export async function insertWallet(wallet: any): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM wallet');
  await database.execAsync('DELETE FROM wallet_transactions');

  await database.runAsync('INSERT INTO wallet (balance) VALUES (?)', [wallet.balance]);

  if (wallet.transactions) {
    for (const tx of wallet.transactions) {
      await database.runAsync(
        'INSERT OR REPLACE INTO wallet_transactions (id, type, amount, description, date) VALUES (?, ?, ?, ?, ?)',
        [tx.id, tx.type, tx.amount, tx.description, tx.date]
      );
    }
  }
}

export async function insertLoyaltyTransactions(transactions: any[]): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM loyalty_transactions');
  for (const tx of transactions) {
    await database.runAsync(
      'INSERT OR REPLACE INTO loyalty_transactions (id, type, points, description, date) VALUES (?, ?, ?, ?, ?)',
      [tx.id, tx.type, tx.points, tx.description, tx.date]
    );
  }
}

export async function insertSubscriptions(subscriptions: any[]): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM subscriptions');
  for (const sub of subscriptions) {
    await database.runAsync(
      'INSERT OR REPLACE INTO subscriptions (id, name, description, price, drinks, icon) VALUES (?, ?, ?, ?, ?, ?)',
      [sub.id, sub.name, sub.description, sub.price, sub.drinks, sub.icon]
    );
  }
}

export async function insertPromos(promos: any[]): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM promos');
  for (const promo of promos) {
    await database.runAsync(
      'INSERT OR REPLACE INTO promos (id, label, title, heading, subheading, subtitle, color, code, badge, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [promo.id, promo.label, promo.title, promo.heading, promo.subheading, promo.subtitle, promo.color, promo.code, promo.badge || null, promo.image || null]
    );
  }
}

export async function insertDeliveryTracking(tracking: any): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM delivery_tracking');
  await database.runAsync(
    'INSERT INTO delivery_tracking (riderName, riderPhone, riderAvatar, riderLatitude, riderLongitude, userLatitude, userLongitude, estimatedMinutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [tracking.riderName, tracking.riderPhone, tracking.riderAvatar, tracking.riderLocation?.latitude, tracking.riderLocation?.longitude, tracking.userLocation?.latitude, tracking.userLocation?.longitude, tracking.estimatedMinutes]
  );
}

export async function insertStore(store: any): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM store');
  await database.runAsync(
    'INSERT INTO store (name, tagline, address, phone, email, hours, spotlightCustomerName, spotlightCustomerCups, spotlightCustomerAvatar, spotlightCustomerReward) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [store.name, store.tagline, store.address, store.phone, store.email, store.hours, store.spotlightCustomer?.name, store.spotlightCustomer?.cupsThisMonth, store.spotlightCustomer?.avatar, store.spotlightCustomer?.reward]
  );
}

// ─── Seed from dummyData ──────────────────────────────────────────────────────

export async function seedFromData(data: any): Promise<void> {
  await insertUser(data.user);
  await insertCategories(data.categories);
  await insertProducts(data.products);
  await insertCustomizationOptions(data.customizationOptions);
  await insertOrders(data.orders);
  await insertNotifications(data.notifications);
  await insertStamps(data.stamps);
  await insertVouchers(data.vouchers);
  await insertWallet(data.wallet);
  await insertLoyaltyTransactions(data.loyaltyTransactions);
  await insertSubscriptions(data.subscriptions);
  await insertPromos(data.promos);
  await insertDeliveryTracking(data.deliveryTracking);
  await insertStore(data.store);
}

// ─── Cart SQLite Persistence Helpers ─────────────────────────────────────────

export async function saveCartItems(cart: any[]): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM cart_items');
  for (const item of cart) {
    await database.runAsync(
      'INSERT INTO cart_items (productId, quantity, product_json, customization_json) VALUES (?, ?, ?, ?)',
      [
        item.product.id,
        item.quantity,
        JSON.stringify(item.product),
        item.customization ? JSON.stringify(item.customization) : null
      ]
    );
  }
}

export async function getCartItems(): Promise<any[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync('SELECT * FROM cart_items') as any[];
  return rows.map((row) => ({
    product: JSON.parse(row.product_json),
    quantity: row.quantity,
    customization: row.customization_json ? JSON.parse(row.customization_json) : undefined
  }));
}
