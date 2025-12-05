// src/services/audioCacheService.ts
import { Platform } from 'react-native';

let FileSystem: any = null;
try {
    const fsModule = require('expo-file-system');
    FileSystem = fsModule.default || fsModule;
} catch {}

const CACHE_NAME = 'yalla-chant-audio-cache-v1';

class AudioCacheService {
    /**
     * Get a playable URL. On web, returns URL directly (service worker handles caching).
     * On native, uses expo-file-system for local caching.
     */
    async getPlayableUrl(remoteUrl: string): Promise<string> {
        // On web, service worker handles caching
        if (Platform.OS === 'web') {
            return remoteUrl;
        }

        if (!FileSystem) {
            console.log('[AudioCacheService] File system not available, using remote URL');
            return remoteUrl;
        }

        try {
            const base = (FileSystem.cacheDirectory || FileSystem.documentDirectory || '').toString();
            const dir = base.replace(/\/$/, '') + '/audio_cache';
            const info = await FileSystem.getInfoAsync(dir);
            if (!info.exists) {
                await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
            }
            const ext = (() => { try { const u = new URL(remoteUrl); const p = u.pathname; const e = (p.split('.').pop() || '').toLowerCase(); return e && e.length < 6 ? `.${e}` : ''; } catch { const e = (remoteUrl.split('?')[0].split('.').pop() || '').toLowerCase(); return e && e.length < 6 ? `.${e}` : ''; } })();
            const filename = this.hashUrl(remoteUrl) + ext;
            const dest = dir + '/' + filename;
            const fileInfo = await FileSystem.getInfoAsync(dest);
            if (fileInfo.exists) {
                return dest;
            }
            const res = await FileSystem.downloadAsync(remoteUrl, dest);
            return res.uri || dest;
        } catch (error) {
            console.warn('[AudioCache] Error caching, using remote url:', error);
            return remoteUrl;
        }
    }

    private hashUrl(url: string): string {
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            const char = url.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Clear the audio cache
     */
    async clearCache(): Promise<void> {
        if (Platform.OS === 'web' || !FileSystem) {
            return;
        }

        try {
            const base = (FileSystem.cacheDirectory || FileSystem.documentDirectory || '').toString();
            const dir = base.replace(/\/$/, '') + '/audio_cache';
            const info = await FileSystem.getInfoAsync(dir);
            if (info.exists) {
                await FileSystem.deleteAsync(dir, { idempotent: true });
                console.log('[AudioCache] Cache cleared');
            }
        } catch (error) {
            console.error('[AudioCache] Error clearing cache:', error);
        }
    }

    /**
     * Get cache size in bytes
     */
    async getCacheSize(): Promise<number> {
        if (Platform.OS === 'web' || !FileSystem) {
            return 0;
        }

        try {
            const base = (FileSystem.cacheDirectory || FileSystem.documentDirectory || '').toString();
            const dir = base.replace(/\/$/, '') + '/audio_cache';
            const info = await FileSystem.getInfoAsync(dir);
            if (!info.exists) {
                return 0;
            }

            // This is a simplified implementation
            // In a real app, you'd recursively calculate the size
            return 0;
        } catch (error) {
            console.error('[AudioCache] Error getting cache size:', error);
            return 0;
        }
    }
}

export const audioCacheService = new AudioCacheService();
