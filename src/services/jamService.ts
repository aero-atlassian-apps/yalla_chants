import { supabase } from './supabase';
import { ensureOnline } from './netGuard';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface JamSession {
    id: string;
    host_user_id: string;
    title: string;
    description?: string;
    is_public: boolean;
    join_code: string;
    max_participants: number;
    current_track_id?: string;
    current_position: number;
    is_playing: boolean;
    playlist: any[];
    status: string;
    participant_count: number;
    started_at: string;
}

export interface JamParticipant {
    id: string;
    jam_session_id: string;
    user_id: string;
    is_active: boolean;
    is_host: boolean;
    joined_at: string;
}

class JamService {
    private channels: Map<string, RealtimeChannel> = new Map();

    // Create new jam session
    async createSession(
        title: string,
        description: string,
        isPublic: boolean,
        userId: string
    ): Promise<JamSession> {
        try {
            ensureOnline();
            const { data, error } = await supabase
                .from('jam_sessions')
                .insert([
                    {
                        host_user_id: userId,
                        title,
                        description,
                        is_public: isPublic,
                    },
                ])
                .select()
                .single();

            if (error) {
                throw error;
            }

            // Auto-join creator as host
            await this.joinSession(data.id, userId, true);

            return data;
        } catch (error: any) {
            console.error('Error creating jam session:', error);
            throw error;
        }
    }

    // Join existing session
    async joinSession(
        sessionId: string,
        userId: string,
        isHost: boolean = false
    ): Promise<JamParticipant> {
        try {
            ensureOnline();
            const { data, error } = await supabase
                .from('jam_participants')
                .insert([
                    {
                        jam_session_id: sessionId,
                        user_id: userId,
                        is_host: isHost,
                    },
                ])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return data;
        } catch (error: any) {
            console.error('Error joining session:', error);
            throw error;
        }
    }

    // Join session by code
    async joinByCode(joinCode: string, userId: string): Promise<JamSession> {
        try {
            ensureOnline();
            console.log('[service:joinByCode]', { joinCode });
            // Find session by code
            const { data: session, error: sessionError } = await supabase
                .from('jam_sessions')
                .select('*')
                .eq('join_code', joinCode.toUpperCase())
                .eq('status', 'active')
                .single();

            if (sessionError) {
                throw new Error('Invalid join code or session has ended');
            }

            // Check if already a participant
            const { data: existing } = await supabase
                .from('jam_participants')
                .select('id')
                .eq('jam_session_id', session.id)
                .eq('user_id', userId)
                .single();

            if (!existing) {
                await this.joinSession(session.id, userId);
            }

            return session;
        } catch (error: any) {
            console.error('Error joining by code:', error);
            throw error;
        }
    }

    // Leave session
    async leaveSession(sessionId: string, userId: string): Promise<void> {
        try {
            ensureOnline();
            await supabase
                .from('jam_participants')
                .update({ is_active: false, left_at: new Date().toISOString() })
                .eq('jam_session_id', sessionId)
                .eq('user_id', userId);
        } catch (error: any) {
            console.error('Error leaving session:', error);
            throw error;
        }
    }

    // Update playback state (host only)
    async updatePlaybackState(
        sessionId: string,
        userId: string,
        updates: {
            current_track_id?: string;
            current_position?: number;
            is_playing?: boolean;
        }
    ): Promise<void> {
        try {
            ensureOnline();
            // Verify user is host
            const { data: session } = await supabase
                .from('jam_sessions')
                .select('host_user_id')
                .eq('id', sessionId)
                .single();

            if (!session || session.host_user_id !== userId) {
                throw new Error('Only host can update playback state');
            }

            await supabase
                .from('jam_sessions')
                .update({
                    ...updates,
                    last_activity_at: new Date().toISOString(),
                })
                .eq('id', sessionId);
        } catch (error: any) {
            console.error('Error updating playback:', error);
            throw error;
        }
    }

    // Add track to playlist
    async addToPlaylist(
        sessionId: string,
        userId: string,
        trackId: string
    ): Promise<void> {
        try {
            ensureOnline();
            const { data: session } = await supabase
                .from('jam_sessions')
                .select('playlist')
                .eq('id', sessionId)
                .single();

            const playlist = session?.playlist || [];
            playlist.push({ id: trackId, added_by: userId, added_at: new Date().toISOString() });

            await supabase
                .from('jam_sessions')
                .update({ playlist })
                .eq('id', sessionId);
        } catch (error: any) {
            console.error('Error adding to playlist:', error);
            throw error;
        }
    }

    // Get active sessions
    async getActiveSessions(limit: number = 20): Promise<JamSession[]> {
        ensureOnline();
        let lastError: any;
        for (let i = 0; i < 3; i++) {
            try {
                const { data, error } = await supabase
                    .from('jam_sessions')
                    .select('*')
                    .eq('is_public', true)
                    .eq('status', 'active')
                    .order('started_at', { ascending: false })
                    .limit(limit);

                if (error) throw error;
                return data || [];
            } catch (e) {
                lastError = e;
                await new Promise(res => setTimeout(res, 500 * Math.pow(2, i)));
            }
        }
        console.error('Error fetching sessions:', lastError);
        throw lastError;
    }

    // Get session participants
    async getParticipants(sessionId: string): Promise<any[]> {
        try {
            ensureOnline();
            const { data, error } = await supabase
                .from('jam_participants')
                .select(`
                    *,
                    user:user_profiles(username, avatar_url)
                `)
                .eq('jam_session_id', sessionId)
                .eq('is_active', true);

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error: any) {
            console.error('Error fetching participants:', error);
            throw error;
        }
    }

    // Subscribe to session updates with realtime
    subscribeToSession(
        sessionId: string,
        onUpdate: (session: JamSession) => void,
        onParticipantUpdate: (participants: JamParticipant[]) => void
    ): void {
        // Clean up existing channel
        this.unsubscribeFromSession(sessionId);

        const channel = supabase
            .channel(`jam-session-${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'jam_sessions',
                    filter: `id=eq.${sessionId}`,
                },
                (payload) => {
                    onUpdate(payload.new as JamSession);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'jam_participants',
                    filter: `jam_session_id=eq.${sessionId}`,
                },
                async () => {
                    // Fetch updated participants
                    const participants = await this.getParticipants(sessionId);
                    onParticipantUpdate(participants);
                }
            )
            .subscribe();

        this.channels.set(sessionId, channel);
    }

    // Unsubscribe from session
    unsubscribeFromSession(sessionId: string): void {
        const channel = this.channels.get(sessionId);
        if (channel) {
            supabase.removeChannel(channel);
            this.channels.delete(sessionId);
        }
    }

    // End session (host only)
    async endSession(sessionId: string, userId: string): Promise<void> {
        try {
            // Verify user is host
            const { data: session } = await supabase
                .from('jam_sessions')
                .select('host_user_id')
                .eq('id', sessionId)
                .single();

            if (!session || session.host_user_id !== userId) {
                throw new Error('Only host can end session');
            }

            await supabase
                .from('jam_sessions')
                .update({
                    status: 'ended',
                    ended_at: new Date().toISOString(),
                })
                .eq('id', sessionId);

            // Mark all participants as inactive
            await supabase
                .from('jam_participants')
                .update({ is_active: false, left_at: new Date().toISOString() })
                .eq('jam_session_id', sessionId);
        } catch (error: any) {
            console.error('Error ending session:', error);
            throw error;
        }
    }

    // Send chat message
    async sendChatMessage(
        sessionId: string,
        userId: string,
        message: string
    ): Promise<void> {
        try {
            await supabase
                .from('jam_chat_messages')
                .insert([
                    {
                        jam_session_id: sessionId,
                        user_id: userId,
                        message,
                    },
                ]);
        } catch (error: any) {
            console.error('Error sending chat message:', error);
            throw error;
        }
    }

    // Subscribe to chat messages
    subscribeToChatMessages(
        sessionId: string,
        onMessage: (message: any) => void
    ): void {
        const channelKey = `jam-chat-${sessionId}`;

        const channel = supabase
            .channel(channelKey)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'jam_chat_messages',
                    filter: `jam_session_id=eq.${sessionId}`,
                },
                (payload) => {
                    onMessage(payload.new);
                }
            )
            .subscribe();

        this.channels.set(channelKey, channel);
    }

    // Clean up all subscriptions
    cleanup(): void {
        this.channels.forEach((channel) => {
            supabase.removeChannel(channel);
        });
        this.channels.clear();
    }
}

export const jamService = new JamService();
