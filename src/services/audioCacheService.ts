// src/services/audioCacheService.ts
import { Platform } from 'react-native';

// Static import to avoid Hermes issues
let FileSystemModule: any = null;
let File: any = null;
let Directory: any = null;
let Paths: any = null;
let FileSystem: any = null;

try {
    // Try to import the module statically (only available on native)
    const fsModule = require('expo-file-system');
    FileSystemModule = fsModule;
    File = fsModule.File;
    Directory = fsModule.Directory;
    Paths = fsModule.Paths;
    FileSystem = fsModule.default || fsModule;
} catch (error) {
    console.log('[AudioCacheService] expo-file-system not available on this platform');
}

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

        // Native implementation - only if module is available
        if (!FileSystemModule || !File || !Directory || !Paths || !FileSystem) {
            console.log('[AudioCacheService] File system not available, using remote URL');
            return remoteUrl;
        }

        try {
            const CACHE_DIR_PATH = Paths.cache + '/audio_cache';
            const cacheDir = new Directory(CACHE_DIR_PATH);

            if (!cacheDir.exists) {
                cacheDir.create();
            }

            const filename = this.hashUrl(remoteUrl);
            const file = new File(cacheDir, filename);

            if (file.exists) {
                return file.uri;
            }

            // Download using FileSystem
            await FileSystem.downloadAsync(remoteUrl, file.uri);
            return file.uri;
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
        if (Platform.OS === 'web' || !FileSystemModule || !Directory || !Paths) {
            return;
        }

        try {
            const CACHE_DIR_PATH = Paths.cache + '/audio_cache';
            const cacheDir = new Directory(CACHE_DIR_PATH);

            if (cacheDir.exists) {
                cacheDir.delete();
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
        if (Platform.OS === 'web' || !FileSystemModule || !Directory || !Paths) {
            return 0;
        }

        try {
            const CACHE_DIR_PATH = Paths.cache + '/audio_cache';
            const cacheDir = new Directory(CACHE_DIR_PATH);

            if (!cacheDir.exists) {
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