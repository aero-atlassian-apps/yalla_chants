
import TrackPlayer, { Event, Capability } from 'react-native-track-player';
import { usePlayerStore } from '../store/playerStore';
import { audioService } from './audioService';

export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    usePlayerStore.getState().resume();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    usePlayerStore.getState().pause();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    usePlayerStore.getState().playNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    usePlayerStore.getState().playPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    audioService.seekTo(event.position * 1000);
  });

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
    // Optional: Handle end of queue
  });
}

export async function setupPlayer() {
  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
    });
    await PlaybackService();
  } catch (error) {
    console.error('[TrackPlayer] Setup error:', error);
  }
}
