import TrackPlayer, {
    Capability,
    State,
    RepeatMode,
    Event,
    Track,
} from 'react-native-track-player';
import { usePlayerStore } from '../store/playerStore';
import { notify } from './notify';
import { audioQualityService } from './audioQualityService';
import { audioCacheService } from './audioCacheService';
import { analyticsService } from './analyticsService';

class AudioService {
    private isSetup = false;
    private statusTimer: any = null;

    /**
     * Setup TrackPlayer with capabilities
     */
    async setup() {
        if (this.isSetup) return;
        try {
            await TrackPlayer.setupPlayer({
                autoHandleInterruptions: true,
            });

            // Set up capabilities (what controls are available)
            await TrackPlayer.updateOptions({
                capabilities: [
                    Capability.Play,
                    Capability.Pause,
                    Capability.SkipToNext,
                    Capability.SkipToPrevious,
                    Capability.SeekTo,
                    Capability.Stop,
                ],
                compactCapabilities: [
                    Capability.Play,
                    Capability.Pause,
                    Capability.SkipToNext,
                ],
                notificationCapabilities: [
                    Capability.Play,
                    Capability.Pause,
                    Capability.SkipToNext,
                    Capability.SkipToPrevious,
                ],
            });

            this.isSetup = true;
            this.setupEventListeners();
            console.log('[audio:setup] TrackPlayer configured');
        } catch (error) {
            console.error('[audio:setup] Error setting up TrackPlayer:', error);
        }
    }

    /**
     * Setup event listeners for state changes
     */
    private setupEventListeners() {
        // Listen for playback state changes
        TrackPlayer.addEventListener(Event.PlaybackState, async ({ state }) => {
            const isPlaying = state === State.Playing;
            const isBuffering = state === State.Buffering || state === State.Connecting;

            usePlayerStore.getState().setIsPlaying(isPlaying);
            console.log('[audio:state]', state);
        });

        // Listen for track changes
        TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (event) => {
            if (event.track != null) {
                const track = await TrackPlayer.getActiveTrack();
                if (track) {
                    // Update store with current track
                    usePlayerStore.getState().setCurrentTrack({
                        id: track.id as string,
                        title: track.title || '',
                        artist: track.artist || '',
                        artwork_url: track.artwork as string,
                        audio_url: track.url as string,
                        duration: track.duration || 0,
                    });
                }
            }
        });

        // Start progress updates
        this.startStatusTimer();
    }

    /**
     * Play a track with caching support
     */
    async playTrack(trackUrl: string, metadata?: { title: string; artist: string; artwork?: string; id?: string }) {
        const startTime = Date.now();
        try {
            await this.setup();

            // Get optimal audio URL based on network quality
            const optimalUrl = await audioQualityService.getOptimalAudioUrl(trackUrl);

            // Get playable URL (local if cached, remote + background download if not)
            const playableUrl = await audioCacheService.getPlayableUrl(optimalUrl);
            const wasCached = playableUrl !== url;

            console.log('[audio:play] Starting playback:', playableUrl);

            // Create track object
            const track: Track = {
                url: playableUrl,
                title: metadata?.title || 'Unknown Title',
                artist: metadata?.artist || 'Unknown Artist',
                artwork: metadata?.artwork,
                duration: 0, // Will be updated when loaded
            };

            // Reset queue and add new track
            await TrackPlayer.reset();
            await TrackPlayer.add(track);
            await TrackPlayer.play();

            const latency = Date.now() - startTime;
            analyticsService.trackPlaybackStart(latency, wasCached);
            if (metadata?.id) {
                analyticsService.trackChantPlay(metadata.id);
            }

            usePlayerStore.getState().setIsPlaying(true);
        } catch (error) {
            console.error('[audio:play] Error playing track:', error);
            notify('Unable to play audio');
            usePlayerStore.getState().setIsPlaying(false);
        }
    }

    /**
     * Set queue of tracks
     */
    async setQueue(tracks: Array<{ id: string; title: string; artist: string; artwork_url?: string; audio_url: string; duration: number }>) {
        try {
            await this.setup();

            const trackPlayerTracks: Track[] = await Promise.all(
                tracks.map(async (track) => {
                    const optimalUrl = await audioQualityService.getOptimalAudioUrl(track.audio_url);
                    const playableUrl = await audioCacheService.getPlayableUrl(optimalUrl);

                    return {
                        id: track.id,
                        url: playableUrl,
                        title: track.title,
                        artist: track.artist,
                        artwork: track.artwork_url,
                        duration: track.duration,
                    };
                })
            );

            await TrackPlayer.reset();
            await TrackPlayer.add(trackPlayerTracks);

            console.log('[audio:queue] Set queue with', trackPlayerTracks.length, 'tracks');
        } catch (error) {
            console.error('[audio:queue] Error setting queue:', error);
        }
    }

    /**
     * Play specific track from queue by index
     */
    async playQueueTrack(index: number) {
        try {
            await TrackPlayer.skip(index);
            await TrackPlayer.play();
        } catch (error) {
            console.error('[audio:playQueueTrack] Error:', error);
        }
    }

    /**
     * Play next track
     */
    async playNext() {
        try {
            await TrackPlayer.skipToNext();
            await TrackPlayer.play();
        } catch (error) {
            console.error('[audio:next] Error:', error);
        }
    }

    /**
     * Play previous track
     */
    async playPrevious() {
        try {
            await TrackPlayer.skipToPrevious();
            await TrackPlayer.play();
        } catch (error) {
            console.error('[audio:previous] Error:', error);
        }
    }

    /**
     * Pause playback
     */
    async pause() {
        try {
            await TrackPlayer.pause();
            usePlayerStore.getState().setIsPlaying(false);
        } catch (error) {
            console.error('[audio:pause] Error:', error);
        }
    }

    /**
     * Resume playback
     */
    async resume() {
        try {
            await TrackPlayer.play();
            usePlayerStore.getState().setIsPlaying(true);
        } catch (error) {
            console.error('[audio:resume] Error:', error);
        }
    }

    /**
     * Seek to position (in seconds)
     */
    async seekTo(positionSeconds: number) {
        try {
            await TrackPlayer.seekTo(positionSeconds);
        } catch (error) {
            console.error('[audio:seek] Error:', error);
        }
    }

    /**
     * Update Now Playing metadata
     */
    async updateMetadata(metadata: { title: string; artist: string; artwork?: string }) {
        try {
            const activeIndex = await TrackPlayer.getActiveTrackIndex();
            if (activeIndex !== null && activeIndex !== undefined) {
                await TrackPlayer.updateMetadataForTrack(activeIndex, {
                    title: metadata.title,
                    artist: metadata.artist,
                    artwork: metadata.artwork,
                });
            }
        } catch (error) {
            console.error('[audio:updateMetadata] Error:', error);
        }
    }

    /**
     * Smooth position updates using polling
     */
    private startStatusTimer() {
        if (this.statusTimer) clearInterval(this.statusTimer);

        // Update every ~500ms (smooth enough for UI)
        this.statusTimer = setInterval(async () => {
            try {
                const position = await TrackPlayer.getPosition();
                const duration = await TrackPlayer.getDuration();

                const positionMs = Math.round(position * 1000);
                const durationMs = Math.round(duration * 1000);

                usePlayerStore.getState().updatePlayback(positionMs, durationMs);
            } catch (e) {
                // Swallow timer errors
            }
        }, 500); //  2 updates per second
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        if (this.statusTimer) {
            clearInterval(this.statusTimer);
        }
        try {
            await TrackPlayer.reset();
            await TrackPlayer.destroy();
        } catch (error) {
            console.error('[audio:cleanup] Error:', error);
        }
    }
}

export const audioService = new AudioService();
