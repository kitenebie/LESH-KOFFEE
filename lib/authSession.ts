import { getDatabase } from './database';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UserSession {
  id: string;
  name: string;
  firstName: string;
  email: string;
  phone: string;
  avatar: string;
  memberLevel: string;
  memberLevelLabel: string;
}

// ─── Token Functions ────────────────────────────────────────────────────────

/**
 * Get the stored [REDACTED_TOKEN] (Sanctum [REDACTED_TOKEN])
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ token: string }>(
      'SELECT token FROM auth_tokens WHERE id = 1'
    );
    return row?.token || null;
  } catch (error) {
    console.warn('[authSession] getAuthToken error:', error);
    return null;
  }
}

/**
 * Store the [REDACTED_TOKEN] in SQLite
 */
export async function setAuthToken(token: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO auth_tokens (id, token) VALUES (1, ?)',
      [token]
    );
  } catch (error) {
    console.warn('[authSession] setAuthToken error:', error);
    throw error;
  }
}

/**
 * Clear the stored [REDACTED_TOKEN]
 */
export async function clearAuthToken(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM auth_tokens WHERE id = 1');
  } catch (error) {
    console.warn('[authSession] clearAuthToken error:', error);
  }
}

// ─── Session Functions ──────────────────────────────────────────────────────

/**
 * Check if any user is logged in (is_logged_in = 1)
 */
export async function isLoggedIn(): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE is_logged_in = 1'
    );
    return (result?.count || 0) > 0;
  } catch (error) {
    console.warn('[authSession] isLoggedIn error:', error);
    return false;
  }
}

/**
 * Get the currently logged-in user
 */
export async function getLoggedInUser(): Promise<UserSession | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM users WHERE is_logged_in = 1 LIMIT 1'
    );

    if (!row) return null;

    return {
      id: row.id,
      name: row.name || '',
      firstName: row.firstName || '',
      email: row.email || '',
      phone: row.phone || '',
      avatar: row.avatar || '',
      memberLevel: row.memberLevel || 'Silver',
      memberLevelLabel: row.memberLevelLabel || 'Lesh Kaffe Silver Member',
    };
  } catch (error) {
    console.warn('[authSession] getLoggedInUser error:', error);
    return null;
  }
}

/**
 * Login user — insert/replace in SQLite with is_logged_in = 1 + store token
 */
export async function loginUser(user: UserSession, token: string): Promise<void> {
  try {
    const db = await getDatabase();

    // First, logout all existing users
    await db.runAsync('UPDATE users SET is_logged_in = 0 WHERE is_logged_in = 1');

    // Insert or replace the user with is_logged_in = 1
    await db.runAsync(
      `INSERT OR REPLACE INTO users (id, name, firstName, email, phone, avatar, memberLevel, memberLevelLabel, is_logged_in)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [user.id, user.name, user.firstName, user.email, user.phone, user.avatar, user.memberLevel, user.memberLevelLabel]
    );

    // Store the [REDACTED_TOKEN]
    await setAuthToken(token);
  } catch (error) {
    console.warn('[authSession] loginUser error:', error);
    throw error;
  }
}

/**
 * Logout — set is_logged_in = 0 for all users + clear token
 */
export async function logoutUser(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM users WHERE is_logged_in = 1');
    await clearAuthToken();
  } catch (error) {
    console.warn('[authSession] logoutUser error:', error);
    throw error;
  }
}
