import { create } from 'zustand';

export interface Track {
    id: string;
    title: string;
    artist: string; // In our case, this might be the country or team
    artwork_url?: string;
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

    setCurrentTrack: (track: Track | null) => void;
    setIsPlaying: (isPlaying: boolean) => void;
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
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentTrack: null,
    isPlaying: false,
    position: 0,
    duration: 0,
    queue: [],
    currentTrackIndex: 0,
    isMinimized: true,

    setCurrentTrack: (track) => set({ currentTrack: track }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setPosition: (position) => set({ position }),
    setDuration: (duration) => set({ duration }),
    setQueue: (queue) => set({ queue, currentTrackIndex: 0 }),
    setCurrentTrackIndex: (index) => set({ currentTrackIndex: index }),
    setIsMinimized: (isMinimized) => set({ isMinimized }),

    addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),

    playNext: () => {
        const { queue, currentTrack } = get();
        if (!currentTrack) return;
        const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
        if (currentIndex < queue.length - 1) {
            set({ currentTrack: queue[currentIndex + 1] });
        }
    },

    playPrevious: () => {
        const { queue, currentTrack } = get();
        if (!currentTrack) return;
        const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
        if (currentIndex > 0) {
            set({ currentTrack: queue[currentIndex - 1] });
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
}));
