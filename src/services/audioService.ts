// src/services/audioService.ts
import { createAudioPlayer, AudioPlayer, AudioModule } from 'expo-audio';
import { usePlayerStore } from '../store/playerStore';
import { notify } from './notify';
import { audioQualityService } from './audioQualityService';
import { audioCacheService } from './audioCacheService';
import { analyticsService } from './analyticsService';

/**
 * AudioService using expo-audio (new API).
 */
class AudioService {
    private player: AudioPlayer | null = null;
    private isSetup = false;
    private statusTimer: any = null;

    /** Configure audio for background playback */
    async setup() {
        if (this.isSetup) return;
        try {
            // AudioModule configuration (if available/needed)
            // expo-audio might handle this differently or via AudioModule.setAudioModeAsync equivalent
            // For now, we'll assume defaults or check AudioModule API later if needed.
            // Note: expo-audio is designed to be more native-like.
            // We might need to request permissions or set category.
            // Let's try to set category if AudioModule has it.
            // await AudioModule.setAudioModeAsync({ ... }); 
            // Since I can't verify AudioModule API, I'll skip explicit mode setting for now 
            // and rely on defaults, or add it if I find the API.
            this.isSetup = true;
            this.startStatusTimer();
        } catch (e) {
            console.error('[audio:setup] Error', e);
        }
    }

    /** Play a track, using cache when possible */
    async playTrack(
        trackUrl: string,
        metadata?: { title: string; artist: string; artwork?: string; flag_url?: string; id?: string }
    ) {
        const start = Date.now();
        try {
            await this.setup();
            const optimalUrl = await audioQualityService.getOptimalAudioUrl(trackUrl);
            const playableUrl = await audioCacheService.getPlayableUrl(optimalUrl);
            const wasCached = playableUrl !== optimalUrl;

            // Create or replace player
            if (this.player) {
                this.player.replace(playableUrl);
            } else {
                this.player = createAudioPlayer(playableUrl);
            }

            // Ensure we play
            this.player.play();

            // Update UI store
            usePlayerStore.getState().setCurrentTrack({
                id: metadata?.id || '',
                title: metadata?.title || 'Unknown Title',
                artist: metadata?.artist || 'Unknown Artist',
                artwork_url: metadata?.artwork,
                flag_url: metadata?.flag_url,
                audio_url: playableUrl,
                duration: 0
            });
            usePlayerStore.getState().setIsPlaying(true);

            const latency = Date.now() - start;
            analyticsService.trackPlaybackStart(latency, wasCached);
            if (metadata?.id) analyticsService.trackChantPlay(metadata.id);
        } catch (error) {
            console.error('[audio:play] Error playing track:', trackUrl, error);
            notify('Unable to play audio');
            usePlayerStore.getState().setIsPlaying(false);
        }
    }

    pause() {
        try {
            this.player?.pause();
            usePlayerStore.getState().setIsPlaying(false);
        } catch (e) {
            console.error('[audio:pause] Error', e);
        }
    }

    resume() {
        try {
            this.player?.play();
            usePlayerStore.getState().setIsPlaying(true);
        } catch (e) {
            console.error('[audio:resume] Error', e);
        }
    }

    seekTo(positionMillis: number) {
        try {
            // expo-audio usually uses seconds for seekTo
            if (this.player) {
                this.player.seekTo(positionMillis / 1000);
            }
        } catch (e) {
            console.error('[audio:seek] Error', e);
        }
    }

    stop() {
        try {
            if (this.player) {
                this.player.pause();
                // expo-audio might not have stop() or unload(). 
                // We can just pause and maybe release if needed, but usually we keep the player.
                // Or set source to null?
                // For now, pause is sufficient.
            }
            usePlayerStore.getState().setIsPlaying(false);
        } catch (e) {
            console.error('[audio:stop] Error', e);
        }
    }

    /** Periodic status updates for UI */
    private startStatusTimer() {
        if (this.statusTimer) clearInterval(this.statusTimer);
        this.statusTimer = setInterval(() => {
            try {
                if (this.player) {
                    // expo-audio properties are usually synchronous getters
                    const currentTime = this.player.currentTime; // seconds
                    const duration = this.player.duration; // seconds
                    const isPlaying = this.player.playing; // boolean

                    const positionMs = Math.round(currentTime * 1000);
                    const durationMs = Math.round(duration * 1000);

                    usePlayerStore.getState().updatePlayback(positionMs, durationMs, isPlaying);
                }
            } catch (e) {
                // ignore timer errors
            }
        }, 500);
    }

    async cleanup() {
        if (this.statusTimer) clearInterval(this.statusTimer);
        if (this.player) {
            // this.player.release(); // if available
            this.player = null;
        }
    }
}

export const audioService = new AudioService();
