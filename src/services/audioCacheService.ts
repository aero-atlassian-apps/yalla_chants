import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Audio Cache Service
 * Manages local caching of audio files for faster playback and offline support
 */
class AudioCacheService {
    private cacheDir: string;
    private downloadQueue: Map<string, Promise<string>> = new Map();
    private accessTimesFile: string;
    private maxSizeMB: number = 500; // Default 500MB

    constructor() {
        // Use cache directory for audio files
        this.cacheDir = `${FileSystem.cacheDirectory}audio/`;
        this.accessTimesFile = `${FileSystem.cacheDirectory}audioAccessTimes.json`;
    }

    /**
     * Initialize cache directory
     */
    async initialize() {
        try {
            const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
                console.log('[AudioCache] Cache directory created');
            }
        } catch (error) {
            console.error('[AudioCache] Error initializing cache:', error);
        }
    }

    /**
     * Generate a filename from URL (hash-based)
     */
    private getFilenameFromUrl(url: string): string {
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            const char = url.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        const extension = url.split('.').pop()?.split('?')[0] || 'mp3';
        return `${Math.abs(hash)}.${extension}`;
    }

    /**
     * Get local file path for cached audio
     */
    private getLocalPath(url: string): string {
        return `${this.cacheDir}${this.getFilenameFromUrl(url)}`;
    }

    /**
     * Check if audio file is cached locally
     */
    async isCached(url: string): Promise<boolean> {
        try {
            const localPath = this.getLocalPath(url);
            const info = await FileSystem.getInfoAsync(localPath);
            return info.exists;
        } catch {
            return false;
        }
    }

    /**
     * Get the best URL to play (local if cached, remote otherwise)
     * Also triggers background download if not cached
     */
    async getPlayableUrl(url: string): Promise<string> {
        await this.initialize();

        const localPath = this.getLocalPath(url);
        const isCached = await this.isCached(url);

        if (isCached) {
            // Update access time for LRU
            await this.updateAccessTime(url);
            console.log('[AudioCache] Using cached file:', localPath);
            return localPath;
        }

        // Not cached - trigger download in background (don't await)
        this.downloadInBackground(url);

        // Return remote URL for immediate streaming
        console.log('[AudioCache] Streaming from remote, downloading in background');
        return url;
    }

    /**
     * Download audio file to cache (background task)
     */
    private async downloadInBackground(url: string): Promise<void> {
        const localPath = this.getLocalPath(url);

        // Check if already downloading
        if (this.downloadQueue.has(url)) {
            console.log('[AudioCache] Already downloading:', url);
            return;
        }

        const downloadPromise = (async () => {
            try {
                console.log('[AudioCache] Starting download:', url);
                const downloadResult = await FileSystem.downloadAsync(url, localPath);

                if (downloadResult.status === 200) {
                    console.log('[AudioCache] Download complete:', localPath);
                    // Update access time
                    await this.updateAccessTime(url);
                    // Check and enforce cache size limit
                    await this.enforceSize();
                } else {
                    console.warn('[AudioCache] Download failed with status:', downloadResult.status);
                }
            } catch (error) {
                console.error('[AudioCache] Download error:', error);
            } finally {
                this.downloadQueue.delete(url);
            }
            return localPath;
        })();

        this.downloadQueue.set(url, downloadPromise);
    }

    /**
     * Preload audio files (for next tracks in queue)
     */
    async preloadAudio(urls: string[]): Promise<void> {
        console.log('[AudioCache] Preloading', urls.length, 'files');

        for (const url of urls) {
            const isCached = await this.isCached(url);
            if (!isCached) {
                this.downloadInBackground(url);
            }
        }
    }

    /**
     * Clear all cached audio files
     */
    async clearCache(): Promise<void> {
        try {
            await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
            await this.initialize();
            console.log('[AudioCache] Cache cleared');
        } catch (error) {
            console.error('[AudioCache] Error clearing cache:', error);
        }
    }

    /**
     * Get cache size in MB
     */
    async getCacheSize(): Promise<number> {
        try {
            let totalSize = 0;
            const files = await FileSystem.readDirectoryAsync(this.cacheDir);

            for (const file of files) {
                const filePath = `${this.cacheDir}${file}`;
                const info = await FileSystem.getInfoAsync(filePath);
                if ('size' in info) {
                    totalSize += info.size || 0;
                }
            }

            return totalSize / (1024 * 1024); // Convert to MB
        } catch {
            return 0;
        }
    }

    /**
     * Set maximum cache size in MB
     */
    setMaxSize(sizeMB: number) {
        this.maxSizeMB = sizeMB;
        console.log('[AudioCache] Max cache size set to', sizeMB, 'MB');
    }

    /**
     * Get access times for all cached files
     */
    private async getAccessTimes(): Promise<Record<string, number>> {
        try {
            const data = await FileSystem.readAsStringAsync(this.accessTimesFile);
            return JSON.parse(data);
        } catch {
            return {};
        }
    }

    /**
     * Save access times
     */
    private async saveAccessTimes(accessTimes: Record<string, number>): Promise<void> {
        try {
            await FileSystem.writeAsStringAsync(this.accessTimesFile, JSON.stringify(accessTimes));
        } catch (error) {
            console.error('[AudioCache] Error saving access times:', error);
        }
    }

    /**
     * Update access time for a file
     */
    private async updateAccessTime(url: string): Promise<void> {
        try {
            const accessTimes = await this.getAccessTimes();
            const filename = this.getFilenameFromUrl(url);
            accessTimes[filename] = Date.now();
            await this.saveAccessTimes(accessTimes);
        } catch (error) {
            console.error('[AudioCache] Error updating access time:', error);
        }
    }

    /**
     * Enforce cache size limit (LRU eviction)
     */
    private async enforceSize(): Promise<void> {
        try {
            const currentSize = await this.getCacheSize();

            if (currentSize <= this.maxSizeMB) {
                return; // Under limit
            }

            console.log('[AudioCache] Cache size', currentSize.toFixed(2), 'MB exceeds limit of', this.maxSizeMB, 'MB');

            // Get all files with their access times
            const files = await FileSystem.readDirectoryAsync(this.cacheDir);
            const accessTimes = await this.getAccessTimes();

            // Sort files by access time (oldest first)
            const sortedFiles = files
                .map(file => ({
                    name: file,
                    accessTime: accessTimes[file] || 0,
                }))
                .sort((a, b) => a.accessTime - b.accessTime);

            // Delete oldest files until under limit
            let deletedCount = 0;
            for (const file of sortedFiles) {
                const filePath = `${this.cacheDir}${file.name}`;
                await FileSystem.deleteAsync(filePath, { idempotent: true });

                // Remove from access times
                delete accessTimes[file.name];
                deletedCount++;

                // Check if under limit now
                const newSize = await this.getCacheSize();
                if (newSize <= this.maxSizeMB) {
                    console.log('[AudioCache] Evicted', deletedCount, 'files. New size:', newSize.toFixed(2), 'MB');
                    await this.saveAccessTimes(accessTimes);
                    return;
                }
            }
        } catch (error) {
            console.error('[AudioCache] Error enforcing size:', error);
        }
    }
}

export const audioCacheService = new AudioCacheService();
