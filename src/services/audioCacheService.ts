// src/services/audioCacheService.ts
import { Platform } from 'react-native';

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

        // Native implementation - only load expo-file-system on native
        try {
            // Dynamic import to avoid bundling on web
            const FileSystemModule = await import('expo-file-system');
            const { File, Directory, Paths } = FileSystemModule;

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
            const FileSystem = FileSystemModule.default || FileSystemModule;
            await (FileSystem as any).downloadAsync(remoteUrl, file.uri);
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
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        const ext = url.split('.').pop()?.split('?')[0] || 'mp3';
        return `track_${Math.abs(hash)}.${ext}`;
    }
}

export const audioCacheService = new AudioCacheService();
