import { create } from 'zustand';

export interface Track {
    id: string;
    title: string;
    artist: string; // In our case, this might be the country or team
    artwork_url?: string;
    flag_url?: string; // Fallback if artwork is missing
    audio_url: string;
    duration: number;
}

interface PlayerState {
    currentTrack: Track | null;
    isPlaying: boolean;
    position: number;
    duration: number;
    queue: Track[];
    currentTrackIndex: number;
    isMinimized: boolean;
    isBuffering: boolean;
    shuffleEnabled: boolean;
    repeatMode: 'off' | 'one' | 'all';
    shuffledQueue: Track[] | null;

    setCurrentTrack: (track: Track | null) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setIsBuffering: (isBuffering: boolean) => void;
    setPosition: (position: number) => void;
    setDuration: (duration: number) => void;
    setQueue: (queue: Track[]) => void;
    setCurrentTrackIndex: (index: number) => void;
    setIsMinimized: (isMinimized: boolean) => void;
    addToQueue: (track: Track) => void;
    playNext: () => void;
    playPrevious: () => void;
    updatePlayback: (position: number, duration: number, isPlaying?: boolean) => void;
    clearCurrentTrack: () => void;
    toggleShuffle: () => void;
    setRepeatMode: (mode: 'off' | 'one' | 'all') => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentTrack: null,
    isPlaying: false,
    position: 0,
    duration: 0,
    queue: [],
    currentTrackIndex: 0,
    isMinimized: true,
    isBuffering: false,
    shuffleEnabled: false,
    repeatMode: 'off',
    shuffledQueue: null,

    setCurrentTrack: (track) => set({ currentTrack: track }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setIsBuffering: (isBuffering) => set({ isBuffering }),
    setPosition: (position) => set({ position }),
    setDuration: (duration) => set({ duration }),
    setQueue: (queue) => {
        const state = get();
        let shuffled: Track[] | null = null;
        if (state.shuffleEnabled && queue.length > 1) {
            const arr = queue.slice();
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const tmp = arr[i];
                arr[i] = arr[j];
                arr[j] = tmp;
            }
            shuffled = arr;
        }
        set({ queue, currentTrackIndex: 0, shuffledQueue: shuffled });
    },
    setCurrentTrackIndex: (index) => set({ currentTrackIndex: index }),
    setIsMinimized: (isMinimized) => set({ isMinimized }),

    addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),

    playNext: () => {
        const { queue, shuffledQueue, shuffleEnabled, repeatMode, currentTrack } = get();
        const active = (shuffleEnabled && shuffledQueue && shuffledQueue.length) ? shuffledQueue : queue;
        if (!currentTrack || active.length === 0) return;
        const currentIndex = active.findIndex(t => t.id === currentTrack.id);
        if (currentIndex < 0) return;
        if (currentIndex === active.length - 1) {
            if (repeatMode === 'all') {
                set({ currentTrack: active[0] });
            } else {
                return;
            }
        } else {
            set({ currentTrack: active[currentIndex + 1] });
        }
    },

    playPrevious: () => {
        const { queue, shuffledQueue, shuffleEnabled, repeatMode, currentTrack } = get();
        const active = (shuffleEnabled && shuffledQueue && shuffledQueue.length) ? shuffledQueue : queue;
        if (!currentTrack || active.length === 0) return;
        const currentIndex = active.findIndex(t => t.id === currentTrack.id);
        if (currentIndex < 0) return;
        if (currentIndex === 0) {
            if (repeatMode === 'all') {
                set({ currentTrack: active[active.length - 1] });
            } else {
                return;
            }
        } else {
            set({ currentTrack: active[currentIndex - 1] });
        }
    },

    updatePlayback: (position, duration, isPlaying) =>
        set((state) => ({
            position,
            duration,
            isPlaying: typeof isPlaying === 'boolean' ? isPlaying : state.isPlaying,
        })),

    clearCurrentTrack: () => {
        set({
            currentTrack: null,
            isPlaying: false,
            position: 0,
            duration: 0,
            isMinimized: true
        });
    },

    toggleShuffle: () => {
        const { shuffleEnabled, queue, currentTrack } = get();
        if (!shuffleEnabled) {
            if (queue.length > 1) {
                const arr = queue.slice();
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    const tmp = arr[i];
                    arr[i] = arr[j];
                    arr[j] = tmp;
                }
                set({ shuffleEnabled: true, shuffledQueue: arr });
                if (currentTrack) {
                    const idx = arr.findIndex(t => t.id === currentTrack.id);
                    if (idx < 0) set({ currentTrack: arr[0] });
                }
            } else {
                set({ shuffleEnabled: true, shuffledQueue: null });
            }
        } else {
            set({ shuffleEnabled: false });
        }
    },

    setRepeatMode: (mode) => set({ repeatMode: mode }),
}));
