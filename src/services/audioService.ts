// src/services/audioService.ts
import { createAudioPlayer, AudioPlayer, AudioModule } from 'expo-audio';
import { Platform } from 'react-native';
import { usePlayerStore } from '../store/playerStore';
import { notify } from './notify';
import { audioQualityService } from './audioQualityService';
import { audioCacheService } from './audioCacheService';
import { analyticsService } from './analyticsService';
import { supabase } from './supabase';
import { useAuthStore } from '../store/authStore';

/**
 * AudioService using expo-audio (new API).
 */
class AudioService {
    private player: AudioPlayer | null = null;
    private htmlAudio: any = null;
    private isSetup = false;
    private statusTimer: any = null;
    private currentPlayId: string | null = null;
    private lastPositionMs: number = 0;
    private stallCounter: number = 0;

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
            if (!trackUrl) {
                notify('Sound restricted');
                // skip to next playable item if possible
                try { usePlayerStore.getState().playNext(); usePlayerStore.getState().setIsPlaying(true); } catch {}
                return;
            }
            const cleanedInputUrl = this.sanitizeUrl(trackUrl);
            console.log('[audio:web] input', cleanedInputUrl);
            const optimalUrl = await audioQualityService.getOptimalAudioUrl(cleanedInputUrl);
            const playableUrl = this.sanitizeUrl(await audioCacheService.getPlayableUrl(optimalUrl));
            console.log('[audio:web] playable', playableUrl);
            if (Platform.OS === 'web') {
                this.logWebSupport(playableUrl);
                const canPlay = this.canPlayUrlOnWeb(playableUrl);
                if (!canPlay) {
                    notify('Unsupported audio on web');
                    try { usePlayerStore.getState().playNext(); usePlayerStore.getState().setIsPlaying(true); } catch {}
                    return;
                }
            }
            const wasCached = playableUrl !== optimalUrl;

            if (Platform.OS === 'web') {
                if (this.htmlAudio) {
                    try { this.htmlAudio.pause(); } catch {}
                }
                this.htmlAudio = new (window as any).Audio();
                this.htmlAudio.src = playableUrl;
                this.htmlAudio.preload = 'auto';
                this.htmlAudio.onerror = () => {
                    const code = this.htmlAudio && this.htmlAudio.error ? this.htmlAudio.error.code : null;
                    console.error('[audio:web] error', { src: this.htmlAudio ? this.htmlAudio.src : playableUrl, code });
                    try { usePlayerStore.getState().playNext(); usePlayerStore.getState().setIsPlaying(true); } catch {}
                };
                this.htmlAudio.onloadedmetadata = () => {
                    console.log('[audio:web] metadata', { duration: this.htmlAudio ? this.htmlAudio.duration : 0 });
                };
                this.htmlAudio.oncanplay = () => {
                    console.log('[audio:web] canplay');
                };
                this.htmlAudio.onplay = () => {
                    console.log('[audio:web] play');
                };
            } else {
                if (this.player) {
                    this.player.replace(playableUrl);
                } else {
                    this.player = createAudioPlayer(playableUrl);
                }
            }

            // Ensure we play with light retry
            const playAttempt = async () => {
                try {
                    if (Platform.OS === 'web') {
                        await this.htmlAudio.play();
                    } else {
                        await this.player!.play();
                    }
                } catch (e) {
                    await new Promise(res => setTimeout(res, 300));
                    try {
                        if (Platform.OS === 'web') {
                            await this.htmlAudio.play();
                        } else {
                            await this.player!.play();
                        }
                    } catch (e2) {
                        // hard failure: skip to next
                        try { usePlayerStore.getState().playNext(); usePlayerStore.getState().setIsPlaying(true); } catch {}
                        throw e2;
                    }
                }
            };
            await playAttempt();

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
            if (metadata?.id) {
                analyticsService.trackChantPlay(metadata.id);
                const u = useAuthStore.getState().user;
                try {
                    const { data } = await supabase.rpc('record_chant_play', { p_chant_id: metadata.id, p_user_id: u?.id || null });
                    this.currentPlayId = typeof data === 'string' ? data : null;
                } catch (e) {
                    // swallow server analytics errors
                }
            }
        } catch (error) {
            const msg = String((error as any)?.message || '');
            const code = (error as any)?.status || (error as any)?.code;
            const restricted = msg.includes('403') || msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('unauthorized') || code === 403;
            const notSupported = msg.toLowerCase().includes('notsupportederror') || msg.toLowerCase().includes('no supported source');
            notify(restricted ? 'Sound restricted' : (notSupported ? 'Unsupported audio on web' : 'Unable to play audio'));
            try { usePlayerStore.getState().playNext(); usePlayerStore.getState().setIsPlaying(true); } catch { usePlayerStore.getState().setIsPlaying(false); }
        }
    }

    pause() {
        try {
            if (Platform.OS === 'web') {
                this.htmlAudio?.pause?.();
            } else {
                this.player?.pause();
            }
            usePlayerStore.getState().setIsPlaying(false);
        } catch (e) {
            console.error('[audio:pause] Error', e);
        }
    }

    resume() {
        try {
            if (Platform.OS === 'web') {
                this.htmlAudio?.play?.();
            } else {
                this.player?.play();
            }
            usePlayerStore.getState().setIsPlaying(true);
        } catch (e) {
            console.error('[audio:resume] Error', e);
        }
    }

    seekTo(positionMillis: number) {
        try {
            // expo-audio usually uses seconds for seekTo
            if (Platform.OS === 'web') {
                if (this.htmlAudio) this.htmlAudio.currentTime = positionMillis / 1000;
            } else {
                if (this.player) this.player.seekTo(positionMillis / 1000);
            }
        } catch (e) {
            console.error('[audio:seek] Error', e);
        }
    }

    stop() {
        try {
            if (Platform.OS === 'web') {
                if (this.htmlAudio) {
                    try { this.htmlAudio.pause(); } catch {}
                }
            } else {
                if (this.player) {
                    this.player.pause();
                }
            }
            usePlayerStore.getState().setIsPlaying(false);
        } catch (e) {
            console.error('[audio:stop] Error', e);
        }
    }

    /** Periodic status updates for UI */
    private startStatusTimer() {
        if (this.statusTimer) clearInterval(this.statusTimer);
        this.statusTimer = setInterval(async () => {
            try {
                if (Platform.OS === 'web') {
                    if (this.htmlAudio) {
                        let currentTime = this.htmlAudio.currentTime;
                        let duration = this.htmlAudio.duration;
                        const isPlaying = !this.htmlAudio.paused;

                        if (!Number.isFinite(currentTime)) currentTime = 0;
                        if (!Number.isFinite(duration)) duration = 0;

                        const positionMs = Math.max(0, Math.round(currentTime * 1000));
                        const durationMs = Math.max(0, Math.round(duration * 1000));

                        usePlayerStore.getState().updatePlayback(positionMs, durationMs, isPlaying);
                        if (isPlaying) {
                            if (Math.abs(positionMs - this.lastPositionMs) < 250) {
                                this.stallCounter += 1;
                                if (this.stallCounter >= 6) {
                                    analyticsService.trackBufferingEvent();
                                    usePlayerStore.getState().setIsBuffering(true);
                                    this.stallCounter = 0;
                                }
                            } else {
                                this.stallCounter = 0;
                                usePlayerStore.getState().setIsBuffering(false);
                            }
                            this.lastPositionMs = positionMs;
                        } else {
                            this.handleStatus(positionMs, durationMs);
                        }

                        const state = usePlayerStore.getState();
                        const { queue, shuffledQueue, shuffleEnabled, currentTrack } = state as any;
                        const active = (shuffleEnabled && shuffledQueue && shuffledQueue.length) ? shuffledQueue : queue;
                        if (currentTrack && active && active.length > 0) {
                            const idx = active.findIndex((t: any) => t.id === currentTrack.id);
                            const next = idx >= 0 ? active[(idx + 1) % active.length] : null;
                            if (next?.audio_url) {
                                const nextOptimal = await audioQualityService.getOptimalAudioUrl(next.audio_url);
                                await audioCacheService.getPlayableUrl(nextOptimal);
                            }
                        }
                    }
                } else if (this.player) {
                    let currentTime = this.player.currentTime; // seconds
                    let duration = this.player.duration; // seconds
                    const isPlaying = !!this.player.playing; // boolean

                    if (!Number.isFinite(currentTime)) currentTime = 0;
                    if (!Number.isFinite(duration)) duration = 0;

                    const positionMs = Math.max(0, Math.round(currentTime * 1000));
                    const durationMs = Math.max(0, Math.round(duration * 1000));

                    usePlayerStore.getState().updatePlayback(positionMs, durationMs, isPlaying);
                    if (isPlaying) {
                        if (Math.abs(positionMs - this.lastPositionMs) < 250) {
                            this.stallCounter += 1;
                            if (this.stallCounter >= 6) {
                                analyticsService.trackBufferingEvent();
                                usePlayerStore.getState().setIsBuffering(true);
                                this.stallCounter = 0;
                            }
                        } else {
                            this.stallCounter = 0;
                            usePlayerStore.getState().setIsBuffering(false);
                        }
                        this.lastPositionMs = positionMs;
                    } else {
                        this.handleStatus(positionMs, durationMs);
                    }

                    const state = usePlayerStore.getState();
                    const { queue, shuffledQueue, shuffleEnabled, currentTrack } = state as any;
                    const active = (shuffleEnabled && shuffledQueue && shuffledQueue.length) ? shuffledQueue : queue;
                    if (currentTrack && active && active.length > 0) {
                        const idx = active.findIndex((t: any) => t.id === currentTrack.id);
                        const next = idx >= 0 ? active[(idx + 1) % active.length] : null;
                        if (next?.audio_url) {
                            const nextOptimal = await audioQualityService.getOptimalAudioUrl(next.audio_url);
                            await audioCacheService.getPlayableUrl(nextOptimal);
                        }
                    }
                }
            } catch (e) {
                // ignore timer errors
            }
        }, 500);
    }

    private async handleStatus(positionMs: number, durationMs: number) {
        const reachedEnd = durationMs > 0 && positionMs >= durationMs - 500;
        if (reachedEnd && this.currentPlayId) {
            const playId = this.currentPlayId;
            this.currentPlayId = null;
            try {
                await supabase.rpc('complete_chant_play', { p_play_id: playId, p_duration_ms: durationMs });
            } catch {}
        }
        usePlayerStore.getState().setIsBuffering(false);
        if (reachedEnd) {
            const st: any = usePlayerStore.getState();
            st.setRepeatMode('off');
            st.playNext();
        }
    }

    async __test_onTick(positionMs: number, durationMs: number, isPlaying: boolean) {
        usePlayerStore.getState().updatePlayback(positionMs, durationMs, isPlaying);
        if (!isPlaying) {
            await this.handleStatus(positionMs, durationMs);
        }
    }

    async cleanup() {
        if (this.statusTimer) clearInterval(this.statusTimer);
        if (this.player) {
            // this.player.release(); // if available
            this.player = null;
        }
        if (this.htmlAudio) {
            try { this.htmlAudio.pause?.(); } catch {}
            this.htmlAudio = null;
        }
    }

    private canPlayUrlOnWeb(url: string): boolean {
        if (Platform.OS !== 'web') return true;
        try {
            const audio = new Audio();
            const pathname = (() => { try { return new URL(url).pathname; } catch { return url; } })();
            const ext = (pathname.split('.').pop() || '').toLowerCase();
            const mimeByExt: Record<string, string> = {
                mp3: 'audio/mpeg',
                m4a: 'audio/mp4',
                aac: 'audio/aac',
                ogg: 'audio/ogg',
                oga: 'audio/ogg',
                wav: 'audio/wav',
                webm: 'audio/webm'
            };
            const mime = mimeByExt[ext];
            if (mime) {
                const res = audio.canPlayType(mime);
                return !!res;
            }
            // Unknown extension: try a few common types
            const candidates = ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav'];
            return candidates.some((m) => !!audio.canPlayType(m));
        } catch {
            return true;
        }
    }

    private logWebSupport(url: string): void {
        try {
            const audio = new Audio();
            const pathname = (() => { try { return new URL(url).pathname; } catch { return url; } })();
            const ext = (pathname.split('.').pop() || '').toLowerCase();
            const mimeByExt: Record<string, string> = {
                mp3: 'audio/mpeg',
                m4a: 'audio/mp4',
                aac: 'audio/aac',
                ogg: 'audio/ogg',
                oga: 'audio/ogg',
                wav: 'audio/wav',
                webm: 'audio/webm'
            };
            const mime = mimeByExt[ext] || null;
            const support = mime ? audio.canPlayType(mime) : '';
            console.log('[audio:web] support', { ext, mime, canPlayType: support });
        } catch {
            console.log('[audio:web] support', { url });
        }
    }

    private sanitizeUrl(url: string): string {
        try {
            return String(url).trim().replace(/^`|`$/g, '').replace(/^\"|\"$/g, '').replace(/^'|'$/g, '');
        } catch {
            return url;
        }
    }
}

export const audioService = new AudioService();
