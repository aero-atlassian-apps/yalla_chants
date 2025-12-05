
import { Platform } from 'react-native';
import TrackPlayer, { State as TrackPlayerState } from 'react-native-track-player';
import { usePlayerStore } from '../store/playerStore';
import { notify } from './notify';
import { audioQualityService } from './audioQualityService';
import { audioCacheService } from './audioCacheService';
import { analyticsService } from './analyticsService';
import { supabase } from './supabase';
import { useAuthStore } from '../store/authStore';

class AudioService {
  private htmlAudio: HTMLAudioElement | null = null;
  private statusTimer: any = null;
  private currentPlayId: string | null = null;
  private lastPositionMs: number = 0;
  private stallCounter: number = 0;

  async playTrack(trackUrl: string, metadata?: { title: string; artist: string; artwork?: string; flag_url?: string; id?: string }) {
    const start = Date.now();
    try {
      if (!trackUrl) {
        notify('Sound restricted');
        this.handlePlaybackError();
        return;
      }

      const cleanedInputUrl = this.sanitizeUrl(trackUrl);
      const optimalUrl = await audioQualityService.getOptimalAudioUrl(cleanedInputUrl);
      const playableUrl = this.sanitizeUrl(await audioCacheService.getPlayableUrl(optimalUrl));
      const wasCached = playableUrl !== optimalUrl;

      if (Platform.OS === 'web') {
        await this.playTrackWeb(playableUrl, metadata);
      } else {
        await this.playTrackNative(playableUrl, metadata);
      }

      const latency = Date.now() - start;
      analyticsService.trackPlaybackStart(latency, wasCached);
      if (metadata?.id) {
        this.startTrackingPlayback(metadata.id);
      }

    } catch (error: any) {
      console.error('[audio:playTrack] Error', error);
      notify('Unable to play audio');
      this.handlePlaybackError();
    }
  }

  private async playTrackWeb(playableUrl: string, metadata?: { title: string; artist: string; artwork?: string; flag_url?: string; id?: string }) {
    this.stop(); // Stop any existing playback

    this.htmlAudio = new (window as any).Audio(playableUrl);
    this.htmlAudio.preload = 'auto';

    this.htmlAudio.onerror = () => {
      console.error('[audio:web] error', { src: this.htmlAudio?.src, code: this.htmlAudio?.error?.code });
      notify('Unsupported audio on web');
      this.handlePlaybackError();
    };

    await this.htmlAudio.play();
    this.updatePlayerStore(metadata, playableUrl);
    this.startStatusTimer();
  }

  private async playTrackNative(playableUrl: string, metadata?: { title: string; artist: string; artwork?: string; flag_url?: string; id?: string }) {
    await TrackPlayer.reset();
    await TrackPlayer.add({
      url: playableUrl,
      title: metadata?.title || 'Unknown Title',
      artist: metadata?.artist || 'Unknown Artist',
      artwork: metadata?.artwork,
      id: metadata?.id,
    });
    await TrackPlayer.play();
    this.updatePlayerStore(metadata, playableUrl);
  }

  pause() {
    if (Platform.OS === 'web') {
      this.htmlAudio?.pause();
    } else {
      TrackPlayer.pause();
    }
    usePlayerStore.getState().setIsPlaying(false);
  }

  resume() {
    if (Platform.OS === 'web') {
      this.htmlAudio?.play();
    } else {
      TrackPlayer.play();
    }
    usePlayerStore.getState().setIsPlaying(true);
  }

  seekTo(positionMillis: number) {
    if (Platform.OS === 'web') {
      if (this.htmlAudio) this.htmlAudio.currentTime = positionMillis / 1000;
    } else {
      TrackPlayer.seekTo(positionMillis / 1000);
    }
  }

  stop() {
    if (Platform.OS === 'web') {
      if (this.htmlAudio) {
        this.htmlAudio.pause();
        this.htmlAudio = null;
      }
      if (this.statusTimer) {
        clearInterval(this.statusTimer);
        this.statusTimer = null;
      }
    } else {
      TrackPlayer.reset();
    }
    usePlayerStore.getState().setIsPlaying(false);
  }

  private updatePlayerStore(metadata: any, playableUrl: string) {
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
  }

  private startStatusTimer() {
    if (this.statusTimer) clearInterval(this.statusTimer);

    this.statusTimer = setInterval(async () => {
      if (this.htmlAudio) {
        const { currentTime, duration, paused } = this.htmlAudio;
        const positionMs = Math.max(0, Math.round(currentTime * 1000));
        const durationMs = Math.max(0, Math.round(duration * 1000));

        usePlayerStore.getState().updatePlayback(positionMs, durationMs, !paused);
        this.handleBuffering(positionMs, !paused);

        if (duration > 0 && currentTime >= duration - 0.5) {
            this.handlePlaybackEnd();
        }
      }
    }, 500);
  }

  private handleBuffering(positionMs: number, isPlaying: boolean) {
    if (isPlaying) {
      if (Math.abs(positionMs - this.lastPositionMs) < 250) {
        this.stallCounter++;
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
    }
  }
  
  private async startTrackingPlayback(chantId: string) {
    const user = useAuthStore.getState().user;
    try {
      const { data } = await supabase.rpc('record_chant_play', { 
        p_chant_id: chantId, 
        p_user_id: user?.id || null 
      });
      this.currentPlayId = typeof data === 'string' ? data : null;
    } catch (e) {
      // Swallow server analytics errors
    }
  }

  private async handlePlaybackEnd() {
    const { currentTrack, playNext, setRepeatMode } = usePlayerStore.getState();
    if (this.currentPlayId && currentTrack) {
        try {
            await supabase.rpc('complete_chant_play', { 
                p_play_id: this.currentPlayId, 
                p_duration_ms: currentTrack.duration 
            });
        } catch {}
        this.currentPlayId = null;
    }
    
    setRepeatMode('off');
    playNext();
  }

  private handlePlaybackError() {
    const { playNext, setIsPlaying } = usePlayerStore.getState();
    try {
      playNext();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }

  private sanitizeUrl(url: string): string {
    return String(url).trim().replace(/^[\`\'\"]|[\`\'\"]$/g, '');
  }

  async cleanup() {
    this.stop();
  }
}

export const audioService = new AudioService();
