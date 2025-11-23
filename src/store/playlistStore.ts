// src/store/playlistStore.ts
import { create } from 'zustand';
import {
    Playlist,
    PlaylistWithChants,
    CreatePlaylistInput,
    UpdatePlaylistInput,
} from '../types/playlist';
import { playlistService } from '../services/playlistService';
import { useAuthStore } from './authStore';

interface PlaylistStore {
    // State
    playlists: Playlist[];
    currentPlaylist: PlaylistWithChants | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchUserPlaylists: () => Promise<void>;
    fetchPlaylist: (id: string) => Promise<void>;
    createPlaylist: (input: CreatePlaylistInput) => Promise<Playlist>;
    updatePlaylist: (id: string, input: UpdatePlaylistInput) => Promise<void>;
    deletePlaylist: (id: string) => Promise<void>;
    addChant: (playlistId: string, chantId: string) => Promise<void>;
    removeChant: (playlistId: string, chantId: string) => Promise<void>;
    toggleVisibility: (playlistId: string) => Promise<void>;
    clearError: () => void;
    clearCurrentPlaylist: () => void;
}

export const usePlaylistStore = create<PlaylistStore>((set, get) => ({
    // Initial state
    playlists: [],
    currentPlaylist: null,
    isLoading: false,
    error: null,

    // Fetch user's playlists
    fetchUserPlaylists: async () => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) {
            set({ error: 'User not authenticated' });
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const playlists = await playlistService.getUserPlaylists(userId);
            set({ playlists, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    // Fetch a single playlist with chants
    fetchPlaylist: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const playlist = await playlistService.getPlaylist(id);
            set({ currentPlaylist: playlist, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    // Create a new playlist
    createPlaylist: async (input: CreatePlaylistInput) => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) {
            throw new Error('User not authenticated');
        }

        set({ isLoading: true, error: null });
        try {
            const playlist = await playlistService.createPlaylist(input, userId);
            set((state) => ({
                playlists: [playlist, ...state.playlists],
                isLoading: false,
            }));
            return playlist;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Update a playlist
    updatePlaylist: async (id: string, input: UpdatePlaylistInput) => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) {
            throw new Error('User not authenticated');
        }

        set({ isLoading: true, error: null });
        try {
            const updated = await playlistService.updatePlaylist(id, input, userId);
            set((state) => ({
                playlists: state.playlists.map((p) => (p.id === id ? updated : p)),
                currentPlaylist:
                    state.currentPlaylist?.id === id
                        ? { ...state.currentPlaylist, ...updated }
                        : state.currentPlaylist,
                isLoading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Delete a playlist
    deletePlaylist: async (id: string) => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) {
            throw new Error('User not authenticated');
        }

        set({ isLoading: true, error: null });
        try {
            await playlistService.deletePlaylist(id, userId);
            set((state) => ({
                playlists: state.playlists.filter((p) => p.id !== id),
                currentPlaylist: state.currentPlaylist?.id === id ? null : state.currentPlaylist,
                isLoading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Add a chant to a playlist
    addChant: async (playlistId: string, chantId: string) => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) {
            throw new Error('User not authenticated');
        }

        set({ isLoading: true, error: null });
        try {
            await playlistService.addChantToPlaylist(playlistId, chantId, userId);

            // Refresh the current playlist if it's the one we just updated
            if (get().currentPlaylist?.id === playlistId) {
                await get().fetchPlaylist(playlistId);
            }

            // Refresh playlists to update chant_count
            await get().fetchUserPlaylists();

            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Remove a chant from a playlist
    removeChant: async (playlistId: string, chantId: string) => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) {
            throw new Error('User not authenticated');
        }

        set({ isLoading: true, error: null });
        try {
            await playlistService.removeChantFromPlaylist(playlistId, chantId, userId);

            // Refresh the current playlist if it's the one we just updated
            if (get().currentPlaylist?.id === playlistId) {
                await get().fetchPlaylist(playlistId);
            }

            // Refresh playlists to update chant_count
            await get().fetchUserPlaylists();

            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Toggle playlist visibility
    toggleVisibility: async (playlistId: string) => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) {
            throw new Error('User not authenticated');
        }

        set({ isLoading: true, error: null });
        try {
            const updated = await playlistService.togglePlaylistVisibility(playlistId, userId);
            set((state) => ({
                playlists: state.playlists.map((p) => (p.id === playlistId ? updated : p)),
                currentPlaylist:
                    state.currentPlaylist?.id === playlistId
                        ? { ...state.currentPlaylist, ...updated }
                        : state.currentPlaylist,
                isLoading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Clear error
    clearError: () => set({ error: null }),

    // Clear current playlist
    clearCurrentPlaylist: () => set({ currentPlaylist: null }),
}));
