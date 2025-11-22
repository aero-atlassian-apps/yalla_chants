import NetInfo from '@react-native-community/netinfo';

type NetworkSpeed = 'fast' | 'medium' | 'slow' | 'offline';
type AudioQuality = 'high' | 'medium' | 'low';

interface AudioQualityConfig {
    bitrate: string;
    label: string;
}

const QUALITY_CONFIGS: Record<AudioQuality, AudioQualityConfig> = {
    high: { bitrate: '320kbps', label: 'High Quality' },
    medium: { bitrate: '192kbps', label: 'Medium Quality' },
    low: { bitrate: '128kbps', label: 'Low Quality' },
};

class AudioQualityService {
    private currentQuality: AudioQuality = 'high';
    private autoQuality: boolean = true;

    /**
     * Detect network speed based on connection type
     */
    async detectNetworkSpeed(): Promise<NetworkSpeed> {
        try {
            const state = await NetInfo.fetch();

            if (!state.isConnected) {
                return 'offline';
            }

            // Check connection type
            const type = state.type;
            const details = state.details as any;
            const effectiveType = details?.cellularGeneration;

            if (type === 'wifi' || type === 'ethernet') {
                return 'fast';
            }

            if (type === 'cellular') {
                if (effectiveType === '4g' || effectiveType === '5g') {
                    return 'fast';
                } else if (effectiveType === '3g') {
                    return 'medium';
                } else {
                    return 'slow';
                }
            }

            // Unknown connection type, assume medium
            return 'medium';
        } catch (error) {
            console.error('[AudioQuality] Error detecting network speed:', error);
            return 'medium';
        }
    }

    /**
     * Get optimal audio quality based on network speed
     */
    async getOptimalQuality(): Promise<AudioQuality> {
        if (!this.autoQuality) {
            return this.currentQuality;
        }

        const speed = await this.detectNetworkSpeed();

        switch (speed) {
            case 'fast':
                return 'high';
            case 'medium':
                return 'medium';
            case 'slow':
            case 'offline':
                return 'low';
            default:
                return 'medium';
        }
    }

    /**
     * Get audio URL for optimal quality
     * In a real implementation, you would have different URLs for different qualities
     */
    async getOptimalAudioUrl(baseUrl: string): Promise<string> {
        const quality = await this.getOptimalQuality();

        // For now, return the base URL
        // In production, you might have:
        // - baseUrl.replace('.mp3', '_high.mp3')
        // - baseUrl.replace('.mp3', '_medium.mp3')
        // - baseUrl.replace('.mp3', '_low.mp3')

        console.log(`[AudioQuality] Selected quality: ${quality} (${QUALITY_CONFIGS[quality].bitrate})`);
        return baseUrl;
    }

    /**
     * Set audio quality manually
     */
    setQuality(quality: AudioQuality, auto: boolean = false) {
        this.currentQuality = quality;
        this.autoQuality = auto;
        console.log(`[AudioQuality] Quality set to: ${quality} (auto: ${auto})`);
    }

    /**
     * Get current quality setting
     */
    getCurrentQuality(): AudioQuality {
        return this.currentQuality;
    }

    /**
     * Check if auto quality is enabled
     */
    isAutoQuality(): boolean {
        return this.autoQuality;
    }

    /**
     * Get quality configuration
     */
    getQualityConfig(quality: AudioQuality): AudioQualityConfig {
        return QUALITY_CONFIGS[quality];
    }

    /**
     * Monitor network changes and adjust quality
     */
    startNetworkMonitoring(onQualityChange?: (quality: AudioQuality) => void) {
        return NetInfo.addEventListener(async (state) => {
            if (this.autoQuality) {
                const newQuality = await this.getOptimalQuality();
                if (newQuality !== this.currentQuality) {
                    this.currentQuality = newQuality;
                    console.log(`[AudioQuality] Network changed, quality adjusted to: ${newQuality}`);
                    onQualityChange?.(newQuality);
                }
            }
        });
    }
}

export const audioQualityService = new AudioQualityService();
export type { NetworkSpeed, AudioQuality, AudioQualityConfig };
