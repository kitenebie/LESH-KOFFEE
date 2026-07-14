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

// ─── In-Memory Token Cache ──────────────────────────────────────────────────
// Fallback: keep token in memory so it works even if SQLite has issues
let memoryToken: string | null = null;

// ─── Token Functions ────────────────────────────────────────────────────────

/**
 * Get the stored Bearer token (Sanctum token)
 */
export async function getAuthToken(): Promise<string | null> {
  // First check in-memory cache (fastest, always works)
  if (memoryToken) {
    return memoryToken;
  }

  // Then try SQLite
  try {
    const db = await getDatabase();
    await db.execAsync(`CREATE TABLE IF NOT EXISTS auth_tokens (id INTEGER PRIMARY KEY, token TEXT DEFAULT '');`);
    const row = await db.getFirstAsync<{ token: string }>(
      'SELECT token FROM auth_tokens WHERE id = 1'
    );
    const token = row?.token || null;
    if (token) {
      memoryToken = token; // Cache it
    }
    return token;
  } catch (error) {
    console.warn('[authSession] getAuthToken error:', error);
    return null;
  }
}

/**
 * Store the Bearer token
 */
export async function setAuthToken(token: string): Promise<void> {
  // Always set in memory first (immediate, guaranteed)
  memoryToken = token;
  console.log('[authSession] Token set in memory, length:', token.length);

  // Then persist to SQLite (best-effort)
  try {
    const db = await getDatabase();
    await db.execAsync(`CREATE TABLE IF NOT EXISTS auth_tokens (id INTEGER PRIMARY KEY, token TEXT DEFAULT '');`);
    await db.execAsync(`DELETE FROM auth_tokens;`);
    // Use execAsync with escaped string since runAsync has binding issues
    const escaped = token.replace(/'/g, "''");
    await db.execAsync(`INSERT INTO auth_tokens (id, token) VALUES (1, '${escaped}');`);
    console.log('[authSession] Token persisted to SQLite');
  } catch (error) {
    console.warn('[authSession] setAuthToken SQLite error (token still in memory):', error);
    // Don't throw — token is in memory and will work for this session
  }
}

/**
 * Clear the stored token
 */
export async function clearAuthToken(): Promise<void> {
  memoryToken = null;
  try {
    const db = await getDatabase();
    await db.execAsync('DELETE FROM auth_tokens;');
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
      memberLevel: row.memberLevel || 'Bronze',
      memberLevelLabel: row.memberLevelLabel || 'Lesh Kaffe Bronze Member',
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
  // Store token first (in-memory + SQLite)
  await setAuthToken(token);

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
  } catch (error) {
    console.warn('[authSession] loginUser error:', error);
    // Don't throw — token is already in memory
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
  }
}
