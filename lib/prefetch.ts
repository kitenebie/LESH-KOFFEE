import { getProducts } from '../services/productsService';
import { getCategories } from '../services/categoriesService';
import { getPromos } from '../services/promosService';
import { getSubscriptions } from '../services/subscriptionsService';
import { getStore } from '../services/storeService';

// ─── In-memory cache for public data ────────────────────────────────────────

export interface PublicData {
  products: any[] | null;
  categories: any[] | null;
  promos: any[] | null;
  subscriptions: any[] | null;
  store: any | null;
}

let cachedPublicData: PublicData = {
  products: null,
  categories: null,
  promos: null,
  subscriptions: null,
  store: null,
};

let isFetching = false;
let fetchPromise: Promise<PublicData> | null = null;

// ─── Prefetch public data (called from _layout.tsx) ─────────────────────────

/**
 * Fetches all public APIs in parallel (no auth required).
 * Called at app startup from _layout.tsx. Results are cached in memory.
 */
export function prefetchPublicData(): Promise<PublicData> {
  // If already fetching, return existing promise
  if (fetchPromise) return fetchPromise;

  isFetching = true;

  fetchPromise = (async () => {
    try {
      const [productsRes, categoriesRes, promosRes, subscriptionsRes, storeRes] =
        await Promise.allSettled([
          getProducts(),
          getCategories(),
          getPromos(),
          getSubscriptions(),
          getStore(),
        ]);

      const getValue = (r: PromiseSettledResult<any>) =>
        r.status === 'fulfilled' ? r.value : null;

      cachedPublicData = {
        products: getValue(productsRes),
        categories: getValue(categoriesRes),
        promos: getValue(promosRes),
        subscriptions: getValue(subscriptionsRes),
        store: getValue(storeRes),
      };

      console.log('[Prefetch] Public data loaded successfully');
    } catch (err) {
      console.warn('[Prefetch] Error:', err);
    } finally {
      isFetching = false;
    }

    return cachedPublicData;
  })();

  return fetchPromise;
}

// ─── Getters (used by useAppData to avoid refetching) ───────────────────────

/**
 * Returns cached public data. If not yet fetched, triggers fetch and waits.
 */
export async function getPublicData(): Promise<PublicData> {
  if (cachedPublicData.products !== null) {
    return cachedPublicData;
  }

  // If fetch is in progress, wait for it
  if (fetchPromise) {
    return fetchPromise;
  }

  // Otherwise trigger fetch
  return prefetchPublicData();
}

/**
 * Check if public data is already cached (synchronous)
 */
export function hasPublicDataCached(): boolean {
  return cachedPublicData.products !== null;
}

/**
 * Get cached data synchronously (returns null if not yet loaded)
 */
export function getCachedPublicData(): PublicData {
  return cachedPublicData;
}

/**
 * Force refresh public data cache
 */
export async function refreshPublicData(): Promise<PublicData> {
  fetchPromise = null;
  cachedPublicData = {
    products: null,
    categories: null,
    promos: null,
    subscriptions: null,
    store: null,
  };
  return prefetchPublicData();
}
