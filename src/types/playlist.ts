// src/types/playlist.ts
export interface Playlist {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    chant_count: number;
    total_duration: number;
    share_count: number;
    play_count: number;
}

export interface PlaylistItem {
    id: string;
    playlist_id: string;
    chant_id: string;
    position: number;
    added_at: string;
    added_by?: string;
}

export interface PlaylistWithChants extends Playlist {
    items: Array<PlaylistItem & { chant: any }>;
}

export interface CreatePlaylistInput {
    name: string;
    description?: string;
    is_public?: boolean;
}

export interface UpdatePlaylistInput {
    name?: string;
    description?: string;
    is_public?: boolean;
}

export interface AddChantToPlaylistInput {
    playlist_id: string;
    chant_id: string;
}
