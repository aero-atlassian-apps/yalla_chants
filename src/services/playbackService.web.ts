
// src/services/playbackService.web.ts

// A dummy implementation for the web to avoid including react-native-track-player

class PlaybackService {
  async setup() {
    // No-op on the web
  }

  register() {
    // No-op on the web
  }
}

export const playbackService = new PlaybackService();
