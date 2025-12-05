const createMockAnalytics = () => {
    const analytics = new Map<string, any>();
    return {
        getNumber: (key: string) => analytics.get(key),
        getString: (key: string) => analytics.get(key),
        set: (key: string, value: any) => analytics.set(key, value),
        delete: (key: string) => analytics.delete(key),
    }
}

const analytics = createMockAnalytics();

interface PlaybackMetric {
    timestamp: number;
    latencyMs: number;
    wasCached: boolean;
}

interface ChantPlayCount {
    [chantId: string]: number;
}

/**
 * Analytics Service
 * Tracks performance metrics and user behavior
 */
class AnalyticsService {
    // Keys for MMKV storage
    private readonly CACHE_HITS_KEY = 'cache_hits';
    private readonly CACHE_MISSES_KEY = 'cache_misses';
    private readonly PLAYBACK_METRICS_KEY = 'playback_metrics';
    private readonly CHANT_PLAY_COUNTS_KEY = 'chant_play_counts';
    private readonly BUFFERING_EVENTS_KEY = 'buffering_events';
    private readonly AD_IMPRESSIONS_KEY = 'ad_impressions';
    private readonly AD_CLICKS_KEY = 'ad_clicks';

    /**
     * Track cache hit
     */
    trackCacheHit() {
        const hits = analytics.getNumber(this.CACHE_HITS_KEY) || 0;
        analytics.set(this.CACHE_HITS_KEY, hits + 1);
        console.log('[Analytics] Cache hit tracked:', hits + 1);
    }

    /**
     * Track cache miss
     */
    trackCacheMiss() {
        const misses = analytics.getNumber(this.CACHE_MISSES_KEY) || 0;
        analytics.set(this.CACHE_MISSES_KEY, misses + 1);
        console.log('[Analytics] Cache miss tracked:', misses + 1);
    }

    /**
     * Track playback start with latency
     */
    trackPlaybackStart(latencyMs: number, wasCached: boolean) {
        try {
            const existingData = analytics.getString(this.PLAYBACK_METRICS_KEY);
            const metrics: PlaybackMetric[] = existingData ? JSON.parse(existingData) : [];

            metrics.push({
                timestamp: Date.now(),
                latencyMs,
                wasCached,
            });

            // Keep only last 100 metrics
            if (metrics.length > 100) {
                metrics.shift();
            }

            analytics.set(this.PLAYBACK_METRICS_KEY, JSON.stringify(metrics));
            console.log('[Analytics] Playback latency tracked:', latencyMs, 'ms');
        } catch (error) {
            console.error('[Analytics] Error tracking playback:', error);
        }
    }

    /**
     * Track buffering event
     */
    trackBufferingEvent() {
        const events = analytics.getNumber(this.BUFFERING_EVENTS_KEY) || 0;
        analytics.set(this.BUFFERING_EVENTS_KEY, events + 1);
    }

    trackAdImpression(type: string, slot: string) {
        try {
            const existing = analytics.getString(this.AD_IMPRESSIONS_KEY);
            const arr: Array<{ t: string; s: string; ts: number }> = existing ? JSON.parse(existing) : [];
            arr.push({ t: type, s: slot, ts: Date.now() });
            if (arr.length > 200) arr.shift();
            analytics.set(this.AD_IMPRESSIONS_KEY, JSON.stringify(arr));
        } catch {}
    }

    trackAdClick(type: string, slot: string) {
        try {
            const existing = analytics.getString(this.AD_CLICKS_KEY);
            const arr: Array<{ t: string; s: string; ts: number }> = existing ? JSON.parse(existing) : [];
            arr.push({ t: type, s: slot, ts: Date.now() });
            if (arr.length > 200) arr.shift();
            analytics.set(this.AD_CLICKS_KEY, JSON.stringify(arr));
        } catch {}
    }

    /**
     * Track chant play
     */
    trackChantPlay(chantId: string) {
        try {
            const existingData = analytics.getString(this.CHANT_PLAY_COUNTS_KEY);
            const playCounts: ChantPlayCount = existingData ? JSON.parse(existingData) : {};

            playCounts[chantId] = (playCounts[chantId] || 0) + 1;

            analytics.set(this.CHANT_PLAY_COUNTS_KEY, JSON.stringify(playCounts));
        } catch (error) {
            console.error('[Analytics] Error tracking chant play:', error);
        }
    }

    /**
     * Get cache hit rate
     */
    getCacheHitRate(): number {
        const hits = analytics.getNumber(this.CACHE_HITS_KEY) || 0;
        const misses = analytics.getNumber(this.CACHE_MISSES_KEY) || 0;
        const total = hits + misses;

        return total > 0 ? (hits / total) * 100 : 0;
    }

    /**
     * Get average playback latency
     */
    getAverageLatency(): { all: number; cached: number; uncached: number } {
        try {
            const existingData = analytics.getString(this.PLAYBACK_METRICS_KEY);
            const metrics: PlaybackMetric[] = existingData ? JSON.parse(existingData) : [];

            if (metrics.length === 0) {
                return { all: 0, cached: 0, uncached: 0 };
            }

            const cachedMetrics = metrics.filter(m => m.wasCached);
            const uncachedMetrics = metrics.filter(m => !m.wasCached);

            const allAvg = metrics.reduce((sum, m) => sum + m.latencyMs, 0) / metrics.length;
            const cachedAvg = cachedMetrics.length > 0
                ? cachedMetrics.reduce((sum, m) => sum + m.latencyMs, 0) / cachedMetrics.length
                : 0;
            const uncachedAvg = uncachedMetrics.length > 0
                ? uncachedMetrics.reduce((sum, m) => sum + m.latencyMs, 0) / uncachedMetrics.length
                : 0;

            return {
                all: Math.round(allAvg),
                cached: Math.round(cachedAvg),
                uncached: Math.round(uncachedAvg),
            };
        } catch (error) {
            console.error('[Analytics] Error getting average latency:', error);
            return { all: 0, cached: 0, uncached: 0 };
        }
    }

    /**
     * Get most played chants
     */
    getMostPlayedChants(limit: number = 10): Array<{ id: string; count: number }> {
        try {
            const existingData = analytics.getString(this.CHANT_PLAY_COUNTS_KEY);
            const playCounts: ChantPlayCount = existingData ? JSON.parse(existingData) : {};

            return Object.entries(playCounts)
                .map(([id, count]) => ({ id, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
        } catch (error) {
            console.error('[Analytics] Error getting most played:', error);
            return [];
        }
    }

    /**
     * Get total buffering events
     */
    getBufferingEvents(): number {
        return analytics.getNumber(this.BUFFERING_EVENTS_KEY) || 0;
    }

    /**
     * Get all analytics data
     */
    getAllMetrics() {
        const hits = analytics.getNumber(this.CACHE_HITS_KEY) || 0;
        const misses = analytics.getNumber(this.CACHE_MISSES_KEY) || 0;
        const latency = this.getAverageLatency();
        const mostPlayed = this.getMostPlayedChants(10);
        const bufferingEvents = this.getBufferingEvents();

        return {
            cache: {
                hits,
                misses,
                hitRate: this.getCacheHitRate(),
            },
            playback: {
                averageLatency: latency,
                bufferingEvents,
            },
            mostPlayed,
            ads: {
                impressions: (() => { const s = analytics.getString(this.AD_IMPRESSIONS_KEY); return s ? JSON.parse(s) : []; })(),
                clicks: (() => { const s = analytics.getString(this.AD_CLICKS_KEY); return s ? JSON.parse(s) : []; })(),
            }
        };
    }

    /**
     * Reset all analytics
     */
    reset() {
        analytics.delete(this.CACHE_HITS_KEY);
        analytics.delete(this.CACHE_MISSES_KEY);
        analytics.delete(this.PLAYBACK_METRICS_KEY);
        analytics.delete(this.CHANT_PLAY_COUNTS_KEY);
        analytics.delete(this.BUFFERING_EVENTS_KEY);
        analytics.delete(this.AD_IMPRESSIONS_KEY);
        analytics.delete(this.AD_CLicks_KEY);
        console.log('[Analytics] All metrics reset');
    }
}

export const analyticsService = new AnalyticsService();