import TrackPlayer, { Event, State } from 'react-native-track-player';

/**
 * Playback Service for Background Audio
 * Handles remote control events (play, pause, skip, etc.) when app is backgrounded
 */
export async function PlaybackService() {
    // Handle remote play event
    TrackPlayer.addEventListener(Event.RemotePlay, async () => {
        console.log('[PlaybackService] Remote play');
        await TrackPlayer.play();
    });

    // Handle remote pause event
    TrackPlayer.addEventListener(Event.RemotePause, async () => {
        console.log('[PlaybackService] Remote pause');
        await TrackPlayer.pause();
    });

    // Handle remote stop event
    TrackPlayer.addEventListener(Event.RemoteStop, async () => {
        console.log('[PlaybackService] Remote stop');
        await TrackPlayer.stop();
    });

    // Handle remote skip to next
    TrackPlayer.addEventListener(Event.RemoteNext, async () => {
        console.log('[PlaybackService] Remote next');
        await TrackPlayer.skipToNext();
    });

    // Handle remote skip to previous
    TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
        console.log('[PlaybackService] Remote previous');
        await TrackPlayer.skipToPrevious();
    });

    // Handle remote seek
    TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
        console.log('[PlaybackService] Remote seek:', event.position);
        await TrackPlayer.seekTo(event.position);
    });

    // Handle playback queue ended
    TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async (event) => {
        console.log('[PlaybackService] Queue ended');
        // Optionally loop or stop
    });

    // Handle playback state change
    TrackPlayer.addEventListener(Event.PlaybackState, async (event) => {
        console.log('[PlaybackService] State changed:', event.state);
    });

    // Handle track change
    TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (event) => {
        console.log('[PlaybackService] Track changed:', event);
    });
}
