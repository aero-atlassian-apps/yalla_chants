import { supabase } from './supabase';
import { ensureOnline } from './netGuard';
import { cacheService, CacheKeys, CacheTTL } from './cacheService';
import { showErrorToast } from './toastService';
import { handleAuthExpired } from './authUtils';

export interface Chant {
    id: string;
    title: string;
    title_arabic?: string;
    title_french?: string;
    lyrics?: string;
    lyrics_arabic?: string;
    lyrics_french?: string;
    description_en?: string;
    description_fr?: string;
    description_pt?: string;
    description_ar?: string;
    country_id: string;
    football_team?: string;
    artist?: string;
    year?: number;
    hashtags?: string[];
    tags?: string[];
    viral_moment_en?: string;
    viral_moment_fr?: string;
    viral_moment_pt?: string;
    viral_moment_ar?: string;
    youtube_url?: string;
    seed_version?: string;
    language?: string;
    dialect?: string;
    region?: string;
    audio_url: string;
    audio_duration: number;
    audio_format: string;
    chant_type: string;
    is_verified?: boolean;
    is_official?: boolean;
    is_traditional?: boolean;
    play_count?: number;
    like_count?: number;
    average_rating?: number;
    rating_count?: number;
    created_at?: string;
    tournament?: string;
    historical_significance?: string;
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
    private normalizeArrayField(v: any): string[] | undefined {
        try {
            if (Array.isArray(v)) {
                return v.map(x => String(x).trim()).filter(Boolean);
            }
            if (typeof v === 'string') {
                const s = v.trim();
                if (!s) return undefined;
                if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"['))) {
                    try {
                        const parsed = JSON.parse(s.replace(/^"|"$/g, ''));
                        if (Array.isArray(parsed)) {
                            return parsed.map((x: any) => String(x).trim()).filter(Boolean);
                        }
                    } catch {}
                }
                return s
                    .replace(/\[|\]|"|\'/g, '')
                    .split(/\s*[,;|#]\s*|\s+/)
                    .map(x => x.trim())
                    .filter(Boolean);
            }
        } catch {}
        return undefined;
    }

    private normalizeChant(c: any): Chant {
        const tags = this.normalizeArrayField(c.tags);
        const hashtags = this.normalizeArrayField(c.hashtags);
        const pickAudioUrl = (): string => {
            const clean = (u: any) => this.sanitizeUrl(u);
            const bucket = typeof c.audio_bucket_url === 'string' ? clean(c.audio_bucket_url) : '';
            if (bucket && /\.mp3($|\?)/i.test(bucket)) return bucket;
            const url = typeof c.audio_url === 'string' ? clean(c.audio_url) : '';
            if (url && /\.mp3($|\?)/i.test(url)) return url;
            // Avoid non-audio links like YouTube pages
            return '';
        };
        return {
            ...c,
            audio_url: pickAudioUrl(),
            tags,
            hashtags,
            lyrics: typeof c.lyrics === 'string' ? c.lyrics : undefined,
            title: typeof c.title === 'string' ? c.title : String(c.title || ''),
            football_team: typeof c.football_team === 'string' ? c.football_team : undefined,
            tournament: typeof c.tournament === 'string' ? c.tournament : undefined,
        } as Chant;
    }
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
                if (handleAuthExpired(error)) return [];
                throw error;
            }

            const chants = (data || []).map((c: any) => this.normalizeChant(c));
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

    private sanitizeUrl(u: any): string {
        try {
            return String(u || '')
                .trim()
                .replace(/`/g, '')
                .replace(/^"|"$/g, '')
                .replace(/^'|'$/g, '');
        } catch {
            return '';
        }
    }

    // Get trending chants with pagination
    async getTrendingChants(limit: number = 20, page: number = 0): Promise<Chant[]> {
        try {
            const cacheKey = CacheKeys.trendingChants(limit, page);
            const cached = await cacheService.get<Chant[]>(cacheKey);
            if (cached) return cached;

            ensureOnline();
            console.log('[service:getTrendingChants]', { limit, page });
            const { data, error } = await supabase.rpc('get_trending_mv_7d', { p_limit: limit });

            if (error) {
                console.error('Error fetching trending chants:', error);
                if (handleAuthExpired(error)) return [];
                throw error;
            }

            const chants = ((data as Chant[]) || []).map((c: any) => this.normalizeChant(c));
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

    async getTrendingByCountry(countryId: string, limit: number = 12): Promise<Chant[]> {
        try {
            ensureOnline();
            console.log('[service:getTrendingByCountry]', { countryId, limit });
            const { data, error } = await supabase.rpc('get_trending_chants_7d_country', { p_country_id: countryId, p_limit: limit });
            if (error) { if (handleAuthExpired(error)) return []; throw error; }
            return ((data as Chant[]) || []).map((c: any) => this.normalizeChant(c));
        } catch (error) {
            console.error('Error in getTrendingByCountry:', error);
            return [];
        }
    }

    async searchTeams(query: string, limit: number = 10): Promise<string[]> {
        try {
            ensureOnline();
            const { data, error } = await supabase
                .from('chants')
                .select('football_team')
                .ilike('football_team', `%${query}%`)
                .not('football_team', 'is', null)
                .limit(limit);
            if (error) { if (handleAuthExpired(error)) return []; throw error; }
            const vals = (data || []).map((r: any) => r.football_team).filter(Boolean);
            return Array.from(new Set(vals));
        } catch {
            return [];
        }
    }

    async searchTournaments(query: string, limit: number = 10): Promise<string[]> {
        try {
            ensureOnline();
            const { data, error } = await supabase
                .from('chants')
                .select('tournament')
                .ilike('tournament', `%${query}%`)
                .not('tournament', 'is', null)
                .limit(limit);
            if (error) { if (handleAuthExpired(error)) return []; throw error; }
            const vals = (data || []).map((r: any) => r.tournament).filter(Boolean);
            return Array.from(new Set(vals));
        } catch {
            return [];
        }
    }

    async getRelatedChants(base: Chant, limit: number = 6): Promise<Chant[]> {
        try {
            ensureOnline();
            const terms: string[] = [];
            if (base.football_team) terms.push(base.football_team);
            if (base.tournament) terms.push(base.tournament);
            const tags = Array.isArray(base.tags) ? base.tags.filter(Boolean) : [];

            let q = supabase
                .from('chants')
                .select('*')
                .neq('id', base.id)
                .limit(limit);

            const ors: string[] = [];
            if (base.football_team) ors.push(`football_team.ilike.%${base.football_team}%`);
            if (base.tournament) ors.push(`tournament.ilike.%${base.tournament}%`);
            if (tags.length > 0) {
                // Use overlaps operator for array intersection
                // Postgrest syntax via supabase-js: .overlaps('tags', tags) cannot be expressed in or(), so we’ll apply separately
                q = q.overlaps('tags', tags);
            }
            if (ors.length > 0) {
                q = q.or(ors.join(','));
            }

            const { data, error } = await q.order('play_count', { ascending: false });
            if (error) throw error;
            return (data as Chant[]) || [];
        } catch (e) {
            console.error('Error in getRelatedChants:', e);
            return [];
        }
    }

    // Get chants by country with pagination
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

            return (data || []).map((c: any) => this.normalizeChant(c));
        } catch (error) {
            console.error('Error in getChantsByCountry:', error);
            return [];
        }
    }

    // Search chants using RPC (multilingual, lyrics, hashtags, viral moments) with pagination
    async searchChants(query: string, page: number = 0, pageSize: number = 50): Promise<Chant[]> {
        const q = query.trim();
        if (!q) return [];
        try {
            ensureOnline();
            console.log('[service:searchChants]', { query: q, page, pageSize });
            const offset = page * pageSize;
            const { data, error } = await supabase.rpc('search_chants', {
                p_query: q,
                p_country_id: null,
                p_limit: pageSize,
                p_offset: offset,
            });
            if (error) {
                console.warn('[service:searchChants] RPC failed, falling back to client OR search', error);
                const from = offset;
                const to = from + pageSize - 1;
                const fallback = await supabase
                    .from('chants')
                    .select('*')
                    .or(`title.ilike.%${q}%,title_arabic.ilike.%${q}%,title_french.ilike.%${q}%,lyrics.ilike.%${q}%,lyrics_arabic.ilike.%${q}%,lyrics_french.ilike.%${q}%,football_team.ilike.%${q}%,artist.ilike.%${q}%,viral_moment_en.ilike.%${q}%,viral_moment_ar.ilike.%${q}%,viral_moment_fr.ilike.%${q}%,viral_moment_pt.ilike.%${q}%,tags.cs.{${q.toLowerCase()}},hashtags.cs.{${q.toLowerCase()}}`)
                    .order('play_count', { ascending: false })
                    .range(from, to);
                if (fallback.error) throw fallback.error;
                const rows = (fallback.data || []) as any[];
                return rows.map((c: any) => this.normalizeChant(c));
            }
            const rows = (data as any[]) || [];
            return rows.map((c: any) => this.normalizeChant(c));
        } catch (error) {
            console.error('Error in searchChants:', error);
            return [];
        }
    }

    // Global search using RPC; also merges country name matches
    async searchAll(query: string, page: number = 0, pageSize: number = 50): Promise<Chant[]> {
        const q = query.trim();
        if (!q) return [];
        try {
            ensureOnline();
            const offset = page * pageSize;
            const { data, error } = await supabase.rpc('search_chants', {
                p_query: q,
                p_country_id: null,
                p_limit: pageSize,
                p_offset: offset,
            });
            if (error) {
                console.warn('[service:searchAll] RPC failed, falling back to client OR search', error);
                return this.searchChants(q, page, pageSize);
            }

            // Country match by name → include chants from matching countries
            const { data: countries, error: countriesError } = await supabase
                .from('countries')
                .select('id')
                .or(`name.ilike.%${q}%,name_arabic.ilike.%${q}%,name_french.ilike.%${q}%`)
                .limit(25);
            if (countriesError) { if (handleAuthExpired(countriesError)) return []; throw countriesError; }
            const ids = (countries || []).map((c: any) => c.id);
            let countryData: any[] = [];
            if (ids.length > 0) {
                const { data: byCountry, error: countryError } = await supabase
                    .from('chants')
                    .select('*')
                    .in('country_id', ids)
                    .order('play_count', { ascending: false })
                    .range(offset, offset + pageSize - 1);
                if (countryError) { if (handleAuthExpired(countryError)) return []; throw countryError; }
                countryData = byCountry || [];
            }
            const all = [...((data as any[]) || []), ...countryData];
            const dedup = new Map<string, any>();
            for (const c of all) dedup.set(c.id, c);
            return Array.from(dedup.values()).map((c: any) => this.normalizeChant(c));
        } catch (error) {
            console.error('Error in searchAll:', error);
            return [];
        }
    }

    // Enhanced search with advanced filters; uses RPC when possible
    async searchChantsEnhanced(query: string, filters: {
        country_id?: string;
        football_team?: string;
        tournament?: string;
        year?: number;
        tags?: string[];
        hashtags?: string[];
        artist?: string;
        is_verified?: boolean;
        is_official?: boolean;
        is_traditional?: boolean;
        language?: string;
        region?: string;
    } = {}, page: number = 0, pageSize: number = 50): Promise<Chant[]> {
        if (!query.trim() && Object.keys(filters).length === 0) {
            return [];
        }

        try {
            ensureOnline();
            console.log('[service:searchChantsEnhanced]', { query, filters, page, pageSize });
            const offset = page * pageSize;
            const { data, error } = await supabase.rpc('search_chants', {
                p_query: query.trim() || '',
                p_country_id: filters.country_id || null,
                p_limit: pageSize,
                p_offset: offset,
            });

            if (error) {
                console.warn('[service:searchChantsEnhanced] RPC failed, falling back to client-side filtering', error);
                // Fallback: build query manually
                const from = offset;
                const to = from + pageSize - 1;
                let q = supabase
                    .from('chants')
                    .select('*');
                if (query.trim()) {
                    const ql = query.trim();
                    q = q.or(`title.ilike.%${ql}%,title_arabic.ilike.%${ql}%,title_french.ilike.%${ql}%,lyrics.ilike.%${ql}%,lyrics_arabic.ilike.%${ql}%,lyrics_french.ilike.%${ql}%,football_team.ilike.%${ql}%,artist.ilike.%${ql}%,viral_moment_en.ilike.%${ql}%,viral_moment_ar.ilike.%${ql}%,viral_moment_fr.ilike.%${ql}%,viral_moment_pt.ilike.%${ql}%,tags.cs.{${ql.toLowerCase()}},hashtags.cs.{${ql.toLowerCase()}}`);
                }
                if (filters.country_id) q = q.eq('country_id', filters.country_id);
                if (filters.football_team) q = q.ilike('football_team', `%${filters.football_team}%`);
                if (filters.tournament) q = q.ilike('tournament', `%${filters.tournament}%`);
                if (filters.year) q = q.eq('year', filters.year);
                if (filters.artist) q = q.ilike('artist', `%${filters.artist}%`);
                if (filters.is_verified !== undefined) q = q.eq('is_verified', filters.is_verified);
                if (filters.is_official !== undefined) q = q.eq('is_official', filters.is_official);
                if (filters.is_traditional !== undefined) q = q.eq('is_traditional', filters.is_traditional);
                if (filters.language) q = q.eq('language', filters.language);
                if (filters.region) q = q.ilike('region', `%${filters.region}%`);
                if (filters.tags && filters.tags.length > 0) q = q.contains('tags', filters.tags);
                if (filters.hashtags && filters.hashtags.length > 0) q = q.contains('hashtags', filters.hashtags);
                const fb = await q.order('play_count', { ascending: false }).range(from, to);
                if (fb.error) { if (handleAuthExpired(fb.error)) return []; throw fb.error; }
                const rows = (fb.data || []) as any[];
                return rows.map((c: any) => this.normalizeChant(c));
            }
            const rows = (data as any[]) || [];
            return rows.map((c: any) => this.normalizeChant(c));
        } catch (error) {
            console.error('Error in searchChantsEnhanced:', error);
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
                if (handleAuthExpired(error)) return [];
                throw error;
            }

            return (data || []).map((c: any) => this.normalizeChant(c));
        } catch (error) {
            console.error('Error in getChantsByTag:', error);
            return [];
        }
    }

    // Get all countries
    async getAllCountries(): Promise<Country[]> {
        try {
            ensureOnline();
            const { data, error } = await supabase
                .from('countries')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                console.error('Error fetching countries:', error);
                if (handleAuthExpired(error)) return [];
                throw error;
            }

            return (data || []).map(country => ({
                ...country,
                flag_svg_url: this.sanitizeUrl(country.flag_svg_url),
            }));
        } catch (error) {
            console.error('Error in getAllCountries:', error);
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
                console.error('Error fetching chant by ID:', error);
                throw error;
            }

            return data ? this.normalizeChant(data) : null;
        } catch (error) {
            console.error('Error in getChantById:', error);
            return null;
        }
    }

    // Like functionality methods
    async checkIsLiked(chantId: string, userId: string): Promise<boolean> {
        try {
            ensureOnline();
            const { data, error } = await supabase
                .from('user_likes')
                .select('id')
                .eq('chant_id', chantId)
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error checking like status:', error);
                if (handleAuthExpired(error)) return false;
                throw error;
            }

            return !!data;
        } catch (error) {
            console.error('Error in checkIsLiked:', error);
            return false;
        }
    }

    async toggleLike(chantId: string, userId: string): Promise<boolean> {
        try {
            ensureOnline();
            const isCurrentlyLiked = await this.checkIsLiked(chantId, userId);

            if (isCurrentlyLiked) {
                // Remove like
                const { error } = await supabase
                    .from('user_likes')
                    .delete()
                    .eq('chant_id', chantId)
                    .eq('user_id', userId);

                if (error) {
                    console.error('Error removing like:', error);
                    if (handleAuthExpired(error)) return isCurrentlyLiked;
                    throw error;
                }

                return false;
            } else {
                // Add like
                const { error } = await supabase
                    .from('user_likes')
                    .insert({ chant_id: chantId, user_id: userId });

                if (error) {
                    console.error('Error adding like:', error);
                    if (handleAuthExpired(error)) return false;
                    throw error;
                }

                return true;
            }
        } catch (error) {
            console.error('Error in toggleLike:', error);
            return false;
        }
    }

    async getLikedChants(userId: string, page: number = 0, pageSize: number = 50): Promise<Chant[]> {
        try {
            ensureOnline();
            const from = page * pageSize;
            const to = from + pageSize - 1;

            const { data, error } = await supabase
                .from('user_likes')
                .select(`
                    chant_id,
                    chants (*)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('Error fetching liked chants:', error);
                if (handleAuthExpired(error)) return [];
                throw error;
            }

            return data?.map((item: any) => item.chants).filter(Boolean).map((c: any) => this.normalizeChant(c)) || [];
        } catch (error) {
            console.error('Error in getLikedChants:', error);
            return [];
        }
    }

    async getPlaylistChants(playlistId: string, page: number = 0, pageSize: number = 50): Promise<Chant[]> {
        try {
            ensureOnline();
            const from = page * pageSize;
            const to = from + pageSize - 1;

            const { data, error } = await supabase
                .from('playlist_items')
                .select(`
                    chant_id,
                    position,
                    chants (*)
                `)
                .eq('playlist_id', playlistId)
                .order('position', { ascending: true })
                .range(from, to);

            if (error) {
                console.error('Error fetching playlist chants:', error);
                if (handleAuthExpired(error)) return [];
                throw error;
            }

            return data?.map((item: any) => item.chants).filter(Boolean).map((c: any) => this.normalizeChant(c)) || [];
        } catch (error) {
            console.error('Error in getPlaylistChants:', error);
            return [];
        }
    }
}

export const chantService = new ChantService();
