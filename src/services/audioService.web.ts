
// src/services/audioService.web.ts

import { usePlayerStore } from '../store/playerStore';

class AudioService {
  private audio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.ontimeupdate = () => {
        usePlayerStore.getState().setPosition(this.audio.currentTime * 1000);
      };
      this.audio.onended = () => {
        usePlayerStore.getState().playNext();
      };
      this.audio.onloadeddata = () => {
        usePlayerStore.getState().setDuration(this.audio.duration * 1000);
      };
      this.audio.onplay = () => {
        usePlayerStore.getState().setIsPlaying(true);
      };
      this.audio.onpause = () => {
        usePlayerStore.getState().setIsPlaying(false);
      };
    }
  }

  async playTrack(trackUrl: string) {
    if (this.audio) {
      this.audio.src = trackUrl;
      this.audio.play();
    }
  }

  pause() {
    this.audio?.pause();
  }

  resume() {
    this.audio?.play();
  }

  seekTo(position: number) {
    if (this.audio) {
      this.audio.currentTime = position / 1000;
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
    }
  }
}

export const audioService = new AudioService();
