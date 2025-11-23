// src/services/playlistService.ts
import { supabase } from './supabase';
import {
    Playlist,
    PlaylistWithChants,
    CreatePlaylistInput,
    UpdatePlaylistInput,
    PlaylistItem,
} from '../types/playlist';

class PlaylistService {
    /**
     * Create a new playlist
     */
    async createPlaylist(input: CreatePlaylistInput, userId: string): Promise<Playlist> {
        try {
            const { data, error } = await supabase
                .from('playlists')
                .insert([
                    {
                        user_id: userId,
                        name: input.name,
                        description: input.description,
                        is_public: input.is_public ?? false,
                    },
                ])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('[PlaylistService] Create error:', error);
            throw error;
        }
    }

    /**
     * Get a single playlist with all its chants
     */
    async getPlaylist(playlistId: string): Promise<PlaylistWithChants> {
        try {
            // Get playlist
            const { data: playlist, error: playlistError } = await supabase
                .from('playlists')
                .select('*')
                .eq('id', playlistId)
                .single();

            if (playlistError) throw playlistError;

            // Get playlist items with chant details
            const { data: items, error: itemsError } = await supabase
                .from('playlist_items')
                .select(`
          *,
          chant:chants(*)
        `)
                .eq('playlist_id', playlistId)
                .order('position', { ascending: true });

            if (itemsError) throw itemsError;

            return {
                ...playlist,
                items: items || [],
            };
        } catch (error: any) {
            console.error('[PlaylistService] Get playlist error:', error);
            throw error;
        }
    }

    /**
     * Get all playlists for a user
     */
    async getUserPlaylists(userId: string): Promise<Playlist[]> {
        try {
            const { data, error } = await supabase
                .from('playlists')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.error('[PlaylistService] Get user playlists error:', error);
            throw error;
        }
    }

    /**
     * Get public playlists (for discovery)
     */
    async getPublicPlaylists(limit: number = 20): Promise<Playlist[]> {
        try {
            const { data, error } = await supabase
                .from('playlists')
                .select('*')
                .eq('is_public', true)
                .order('play_count', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.error('[PlaylistService] Get public playlists error:', error);
            throw error;
        }
    }

    /**
     * Update a playlist
     */
    async updatePlaylist(
        playlistId: string,
        input: UpdatePlaylistInput,
        userId: string
    ): Promise<Playlist> {
        try {
            const { data, error } = await supabase
                .from('playlists')
                .update({
                    ...input,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', playlistId)
                .eq('user_id', userId) // Ensure user owns the playlist
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('[PlaylistService] Update error:', error);
            throw error;
        }
    }

    /**
     * Delete a playlist
     */
    async deletePlaylist(playlistId: string, userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('playlists')
                .delete()
                .eq('id', playlistId)
                .eq('user_id', userId); // Ensure user owns the playlist

            if (error) throw error;
        } catch (error: any) {
            console.error('[PlaylistService] Delete error:', error);
            throw error;
        }
    }

    /**
     * Add a chant to a playlist
     */
    async addChantToPlaylist(playlistId: string, chantId: string, userId: string): Promise<void> {
        try {
            // Verify user owns the playlist
            const { data: playlist } = await supabase
                .from('playlists')
                .select('user_id')
                .eq('id', playlistId)
                .single();

            if (!playlist || playlist.user_id !== userId) {
                throw new Error('Unauthorized');
            }

            // Get the next position
            const { data: items } = await supabase
                .from('playlist_items')
                .select('position')
                .eq('playlist_id', playlistId)
                .order('position', { ascending: false })
                .limit(1);

            const nextPosition = items && items.length > 0 ? items[0].position + 1 : 0;

            // Add the chant
            const { error } = await supabase.from('playlist_items').insert([
                {
                    playlist_id: playlistId,
                    chant_id: chantId,
                    position: nextPosition,
                    added_by: userId,
                },
            ]);

            if (error) throw error;
        } catch (error: any) {
            console.error('[PlaylistService] Add chant error:', error);
            throw error;
        }
    }

    /**
     * Remove a chant from a playlist
     */
    async removeChantFromPlaylist(
        playlistId: string,
        chantId: string,
        userId: string
    ): Promise<void> {
        try {
            // Verify user owns the playlist
            const { data: playlist } = await supabase
                .from('playlists')
                .select('user_id')
                .eq('id', playlistId)
                .single();

            if (!playlist || playlist.user_id !== userId) {
                throw new Error('Unauthorized');
            }

            const { error } = await supabase
                .from('playlist_items')
                .delete()
                .eq('playlist_id', playlistId)
                .eq('chant_id', chantId);

            if (error) throw error;

            // Reorder remaining items
            await this.reorderAfterRemoval(playlistId);
        } catch (error: any) {
            console.error('[PlaylistService] Remove chant error:', error);
            throw error;
        }
    }

    /**
     * Reorder playlist items
     */
    async reorderPlaylistItems(
        playlistId: string,
        itemPositions: Array<{ id: string; position: number }>,
        userId: string
    ): Promise<void> {
        try {
            // Verify user owns the playlist
            const { data: playlist } = await supabase
                .from('playlists')
                .select('user_id')
                .eq('id', playlistId)
                .single();

            if (!playlist || playlist.user_id !== userId) {
                throw new Error('Unauthorized');
            }

            // Use the database function for atomic reordering
            const { error } = await supabase.rpc('reorder_playlist_items', {
                p_playlist_id: playlistId,
                p_item_positions: itemPositions,
            });

            if (error) throw error;
        } catch (error: any) {
            console.error('[PlaylistService] Reorder error:', error);
            throw error;
        }
    }

    /**
     * Toggle playlist visibility (public/private)
     */
    async togglePlaylistVisibility(playlistId: string, userId: string): Promise<Playlist> {
        try {
            // Get current state
            const { data: playlist } = await supabase
                .from('playlists')
                .select('is_public')
                .eq('id', playlistId)
                .eq('user_id', userId)
                .single();

            if (!playlist) throw new Error('Playlist not found');

            // Toggle
            const { data, error } = await supabase
                .from('playlists')
                .update({ is_public: !playlist.is_public })
                .eq('id', playlistId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('[PlaylistService] Toggle visibility error:', error);
            throw error;
        }
    }

    /**
     * Increment play count
     */
    async incrementPlayCount(playlistId: string): Promise<void> {
        try {
            const { error } = await supabase.rpc('increment_playlist_play_count', {
                playlist_uuid: playlistId,
            });

            if (error) throw error;
        } catch (error: any) {
            console.error('[PlaylistService] Increment play count error:', error);
        }
    }

    /**
     * Increment share count
     */
    async incrementShareCount(playlistId: string): Promise<void> {
        try {
            const { error } = await supabase.rpc('increment_playlist_share_count', {
                playlist_uuid: playlistId,
            });

            if (error) throw error;
        } catch (error: any) {
            console.error('[PlaylistService] Increment share count error:', error);
        }
    }

    /**
     * Check if chant is in playlist
     */
    async isChantInPlaylist(playlistId: string, chantId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('playlist_items')
                .select('id')
                .eq('playlist_id', playlistId)
                .eq('chant_id', chantId)
                .single();

            return !!data;
        } catch (error: any) {
            return false;
        }
    }

    /**
     * Helper: Reorder items after removal
     */
    private async reorderAfterRemoval(playlistId: string): Promise<void> {
        try {
            const { data: items } = await supabase
                .from('playlist_items')
                .select('id')
                .eq('playlist_id', playlistId)
                .order('position', { ascending: true });

            if (!items) return;

            // Update positions sequentially
            const updates = items.map((item, index) => ({
                id: item.id,
                position: index,
            }));

            for (const update of updates) {
                await supabase
                    .from('playlist_items')
                    .update({ position: update.position })
                    .eq('id', update.id);
            }
        } catch (error: any) {
            console.error('[PlaylistService] Reorder after removal error:', error);
        }
    }
}

export const playlistService = new PlaylistService();
