import { supabase } from './supabase';
import { ensureOnline } from './netGuard';
import { cacheService, CacheKeys, CacheTTL } from './cacheService';
import { showErrorToast } from './toastService';

export interface Chant {
    id: string;
    title: string;
    lyrics?: string;
    country_id: string;
    football_team?: string;
    language?: string;
    tags?: string[];
    audio_url: string;
    audio_duration: number;
    audio_format: string;
    chant_type: string;
    is_verified?: boolean;
    play_count?: number;
    like_count?: number;
    created_at?: string;
}

export interface Country {
    id: string;
    name: string;
    code: string;
    code_alpha3: string;
    flag_emoji: string;
    flag_svg_url?: string;
    region: string;
}

class ChantService {
    // Get all chants with pagination
    async getAllChants(page: number = 0, pageSize: number = 50): Promise<Chant[]> {
        try {
            // Check cache first
            const cacheKey = CacheKeys.allChants(page);
            const cached = await cacheService.get<Chant[]>(cacheKey);
            if (cached) {
                return cached;
            }

            ensureOnline();
            console.log('[service:getAllChants]', { page, pageSize });
            const from = page * pageSize;
            const to = from + pageSize - 1;

            const { data, error } = await supabase
                .from('chants')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('Error fetching chants:', error);
                throw error;
            }

            const chants = data || [];
            // Cache for 5 minutes
            await cacheService.set(cacheKey, chants, CacheTTL.MEDIUM);
            return chants;
        } catch (error) {
            console.error('Error in getAllChants:', error);
            if (error instanceof Error && error.message === 'Network unavailable') {
                showErrorToast('No internet connection');
            } else {
                showErrorToast('Failed to load chants');
            }
            return [];
        }
    }

    // Get trending chants with pagination
    async getTrendingChants(limit: number = 20, page: number = 0): Promise<Chant[]> {
        try {
            // Check cache first
            const cacheKey = CacheKeys.trendingChants(limit, page);
            const cached = await cacheService.get<Chant[]>(cacheKey);
            if (cached) {
                return cached;
            }

            ensureOnline();
            console.log('[service:getTrendingChants]', { limit, page });
            const from = page * limit;
            const to = from + limit - 1;

            const { data, error } = await supabase
                .from('chants')
                .select('*')
                .order('play_count', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('Error fetching trending chants:', error);
                throw error;
            }

            const chants = data || [];
            // Cache for 1 minute (trending changes frequently)
            await cacheService.set(cacheKey, chants, CacheTTL.SHORT);
            return chants;
        } catch (error) {
            console.error('Error in getTrendingChants:', error);
            if (error instanceof Error && error.message === 'Network unavailable') {
                showErrorToast('No internet connection');
            }
            return [];
        }
    }

    // Get   chants by country with pagination
    async getChantsByCountry(countryId: string, page: number = 0, pageSize: number = 50): Promise<Chant[]> {
        try {
            ensureOnline();
            console.log('[service:getChantsByCountry]', { countryId, page, pageSize });
            const from = page * pageSize;
            const to = from + pageSize - 1;

            const { data, error } = await supabase
                .from('chants')
                .select('*')
                .eq('country_id', countryId)
                .order('play_count', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('Error fetching chants by country:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Error in getChantsByCountry:', error);
            return [];
        }
    }

    // Search chants with pagination
    async searchChants(query: string, page: number = 0, pageSize: number = 50): Promise<Chant[]> {
        if (!query.trim()) {
            return [];
        }

        try {
            ensureOnline();
            console.log('[service:searchChants]', { query, page, pageSize });
            const from = page * pageSize;
            const to = from + pageSize - 1;

            const { data, error } = await supabase
                .from('chants')
                .select('*')
                .or(`title.ilike.%${query}%,lyrics.ilike.%${query}%,football_team.ilike.%${query}%`)
                .order('play_count', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('Error searching chants:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Error in searchChants:', error);
            return [];
        }
    }

    // Get chants by tag
    async getChantsByTag(tag: string): Promise<Chant[]> {
        try {
            ensureOnline();
            const { data, error } = await supabase
                .from('chants')
                .select('*')
                .contains('tags', [tag])
                .limit(50);

            if (error) {
                console.error('Error fetching chants by tag:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Error in getChantsByTag:', error);
            return [];
        }
    }

    // Get single chant by ID
    async getChantById(id: string): Promise<Chant | null> {
        try {
            ensureOnline();
            const { data, error } = await supabase
                .from('chants')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching chant:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error in getChantById:', error);
            return null;
        }
    }

    // Increment play count
    async incrementPlayCount(chantId: string): Promise<void> {
        try {
            ensureOnline();
            const { error } = await supabase.rpc('increment_play_count', {
                chant_id: chantId
            });

            if (error) {
                console.error('Error incrementing play count:', error);
            }
        } catch (error) {
            console.error('Error in incrementPlayCount:', error);
        }
    }

    // Get all countries
    async getAllCountries(): Promise<Country[]> {
        try {
            ensureOnline();
            const { data, error } = await supabase
                .from('countries')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) {
                console.error('Error fetching countries:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Error in getAllCountries:', error);
            return [];
        }
    }

    // Get country by code
    async getCountryByCode(code: string): Promise<Country | null> {
        try {
            ensureOnline();
            const { data, error } = await supabase
                .from('countries')
                .select('*')
                .eq('code', code)
                .single();

            if (error) {
                console.error('Error fetching country:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error in getCountryByCode:', error);
            return null;
        }
    }
    // Toggle like status for a chant
    async toggleLike(chantId: string, userId: string): Promise<boolean> {
        try {
            // Check if already liked
            const { data: existingLike } = await supabase
                .from('user_likes')
                .select('id')
                .eq('user_id', userId)
                .eq('chant_id', chantId)
                .single();

            if (existingLike) {
                // Unlike
                const { error } = await supabase
                    .from('user_likes')
                    .delete()
                    .eq('id', existingLike.id);

                if (error) throw error;
                return false;
            } else {
                // Like
                const { error } = await supabase
                    .from('user_likes')
                    .insert({
                        user_id: userId,
                        chant_id: chantId
                    });

                if (error) throw error;
                return true;
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            throw error;
        }
    }

    // Check if a chant is liked by user
    async checkIsLiked(chantId: string, userId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('user_likes')
                .select('id')
                .eq('user_id', userId)
                .eq('chant_id', chantId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error('Error checking like status:', error);
            }

            return !!data;
        } catch (error) {
            return false;
        }
    }

    // Get user's liked chants
    async getLikedChants(userId: string, page: number = 0, pageSize: number = 50): Promise<Chant[]> {
        try {
            const from = page * pageSize;
            const to = from + pageSize - 1;

            const { data: likes, error: likesError } = await supabase
                .from('user_likes')
                .select('chant_id')
                .eq('user_id', userId)
                .not('chant_id', 'is', null)
                .range(from, to);

            if (likesError) throw likesError;

            if (!likes || likes.length === 0) return [];

            const chantIds = likes.map(l => l.chant_id);

            const { data: chants, error: chantsError } = await supabase
                .from('chants')
                .select('*')
                .in('id', chantIds);

            if (chantsError) throw chantsError;

            return chants || [];
        } catch (error) {
            console.error('Error fetching liked chants:', error);
            return [];
        }
    }
}

export const chantService = new ChantService();
