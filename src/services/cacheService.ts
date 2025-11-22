import { createMMKV } from 'react-native-mmkv';
import { analyticsService } from './analyticsService';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

interface CacheConfig {
    maxSize: number; // Maximum number of entries
    defaultTTL: number; // Default TTL in milliseconds
}

// Initialize MMKV storage
const storage = createMMKV({ id: 'yalla-chants-cache' });

class CacheService {
    private memoryCache: Map<string, CacheEntry<any>> = new Map();
    private config: CacheConfig = {
        maxSize: 100,
        defaultTTL: 5 * 60 * 1000, // 5 minutes
    };
    private cacheHits = 0;
    private cacheMisses = 0;

    /**
     * Get data from cache (synchronous with MMKV)
     */
    get<T>(key: string): T | null {
        // Check memory cache first
        const memoryEntry = this.memoryCache.get(key);
        if (memoryEntry && this.isValid(memoryEntry)) {
            this.cacheHits++;
            analyticsService.trackCacheHit();
            console.log(`[cache:hit:memory] ${key}`);
            return memoryEntry.data as T;
        }

        // Check MMKV storage (synchronous!)
        try {
            const persistentData = storage.getString(`cache:${key}`);
            if (persistentData) {
                const entry: CacheEntry<T> = JSON.parse(persistentData);
                if (this.isValid(entry)) {
                    // Restore to memory cache
                    this.memoryCache.set(key, entry);
                    this.cacheHits++;
                    analyticsService.trackCacheHit();
                    console.log(`[cache:hit:persistent] ${key}`);
                    return entry.data;
                } else {
                    // Expired, remove from storage
                    storage.delete(`cache:${key}`);
                }
            }
        } catch (error) {
            console.error('[cache:error:get]', key, error);
        }

        this.cacheMisses++;
        analyticsService.trackCacheMiss();
        console.log(`[cache:miss] ${key}`);
        return null;
    }

    /**
     * Set data in cache (synchronous with MMKV)
     */
    set<T>(key: string, data: T, ttl?: number): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.config.defaultTTL,
        };

        // Store in memory cache
        this.memoryCache.set(key, entry);
        this.evictIfNeeded();

        // Store in MMKV (synchronous!)
        try {
            storage.set(`cache:${key}`, JSON.stringify(entry));
            console.log(`[cache:set] ${key}`);
        } catch (error) {
            console.error('[cache:error:set]', key, error);
        }
    }

    /**
     * Remove specific key from cache (synchronous)
     */
    remove(key: string): void {
        this.memoryCache.delete(key);
        try {
            storage.delete(`cache:${key}`);
            console.log(`[cache:remove] ${key}`);
        } catch (error) {
            console.error('[cache:error:remove]', key, error);
        }
    }

    /**
     * Clear all cache entries (synchronous)
     */
    clear(): void {
        this.memoryCache.clear();
        try {
            const keys = storage.getAllKeys();
            const cacheKeys = keys.filter((k: string) => k.startsWith('cache:'));
            cacheKeys.forEach((key: string) => storage.delete(key));
            console.log('[cache:clear] All cache cleared');
        } catch (error) {
            console.error('[cache:error:clear]', error);
        }
    }

    /**
     * Clear expired entries (synchronous)
     */
    clearExpired(): void {
        // Clear from memory
        for (const [key, entry] of this.memoryCache.entries()) {
            if (!this.isValid(entry)) {
                this.memoryCache.delete(key);
            }
        }

        // Clear from MMKV storage
        try {
            const keys = storage.getAllKeys();
            const cacheKeys = keys.filter((k: string) => k.startsWith('cache:'));

            for (const key of cacheKeys) {
                const data = storage.getString(key);
                if (data) {
                    const entry = JSON.parse(data);
                    if (!this.isValid(entry)) {
                        storage.delete(key);
                    }
                }
            }
            console.log('[cache:clearExpired] Expired entries removed');
        } catch (error) {
            console.error('[cache:error:clearExpired]', error);
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.cacheHits + this.cacheMisses > 0
            ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100
            : 0;

        return {
            hits: this.cacheHits,
            misses: this.cacheMisses,
            hitRate: hitRate.toFixed(2) + '%',
            memorySize: this.memoryCache.size,
            maxSize: this.config.maxSize,
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }

    /**
     * Check if cache entry is still valid
     */
    private isValid(entry: CacheEntry<any>): boolean {
        const age = Date.now() - entry.timestamp;
        return age < entry.ttl;
    }

    /**
     * Evict oldest entries if cache is full (LRU)
     */
    private evictIfNeeded() {
        if (this.memoryCache.size > this.config.maxSize) {
            // Get oldest entry
            const firstKey = this.memoryCache.keys().next().value;
            if (firstKey) {
                this.memoryCache.delete(firstKey);
                console.log(`[cache:evict] ${firstKey}`);
            }
        }
    }

    /**
     * Warm cache with frequently accessed data
     */
    warmCache(warmupFn: () => void) {
        console.log('[cache:warm] Starting cache warmup...');
        try {
            warmupFn();
            console.log('[cache:warm] Cache warmup complete');
        } catch (error) {
            console.error('[cache:error:warm]', error);
        }
    }
}

export const cacheService = new CacheService();

// Cache key generators
export const CacheKeys = {
    allChants: (page: number) => `chants:all:${page}`,
    trendingChants: (limit: number, page: number) => `chants:trending:${limit}:${page}`,
    popularChants: (limit: number, page: number) => `chants:popular:${limit}:${page}`,
    recentChants: (limit: number, page: number) => `chants:recent:${limit}:${page}`,
    chantsByCountry: (countryId: string, page: number) => `chants:country:${countryId}:${page}`,
    searchChants: (query: string) => `chants:search:${query}`,
    countries: () => 'countries:all',
    likedChants: (userId: string) => `chants:liked:${userId}`,
};

// TTL configurations (in milliseconds)
export const CacheTTL = {
    SHORT: 1 * 60 * 1000,      // 1 minute
    MEDIUM: 5 * 60 * 1000,     // 5 minutes
    LONG: 30 * 60 * 1000,      // 30 minutes
    VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
};
