import { useState, useEffect, useCallback } from 'react';
import { chantService, Chant } from '../services/chantService';
import { backoff } from '../services/retry';

// Hook for all chants with pagination
export const useChants = (pageSize: number = 50) => {
    const [chants, setChants] = useState<Chant[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const loadChants = useCallback(async (pageNum: number) => {
        try {
            setLoading(true);
            const data = await backoff(() => chantService.getAllChants(pageNum, pageSize));

            if (pageNum === 0) {
                setChants(data);
            } else {
                setChants(prev => [...prev, ...data]);
            }

            setHasMore(data.length === pageSize);
        } catch (error) {
            console.error('Error loading chants:', error);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        loadChants(0);
    }, [loadChants]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadChants(nextPage);
        }
    }, [page, loading, hasMore, loadChants]);

    const refresh = useCallback(() => {
        setPage(0);
        loadChants(0);
    }, [loadChants]);

    return { chants, loading, loadMore, refresh, hasMore };
};

// Hook for trending chants with pagination
export const useTrendingChants = (limit: number = 20) => {
    const [chants, setChants] = useState<Chant[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const loadChants = useCallback(async (pageNum: number) => {
        try {
            setLoading(true);
            const data = await backoff(() => chantService.getTrendingChants(limit, pageNum));

            if (pageNum === 0) {
                setChants(data);
            } else {
                setChants(prev => [...prev, ...data]);
            }

            setHasMore(data.length === limit);
        } catch (error) {
            console.error('Error loading trending chants:', error);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        loadChants(0);
    }, [loadChants]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadChants(nextPage);
        }
    }, [page, loading, hasMore, loadChants]);

    const refresh = useCallback(() => {
        setPage(0);
        loadChants(0);
    }, [loadChants]);

    return { chants, loading, loadMore, refresh, hasMore };
};

// Hook for chants by country with pagination
export const useChantsByCountry = (countryId?: string, pageSize: number = 50) => {
    const [chants, setChants] = useState<Chant[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const loadChants = useCallback(async (pageNum: number) => {
        if (!countryId) return;

        try {
            setLoading(true);
            const data = await backoff(() => chantService.getChantsByCountry(countryId, pageNum, pageSize));

            if (pageNum === 0) {
                setChants(data);
            } else {
                setChants(prev => [...prev, ...data]);
            }

            setHasMore(data.length === pageSize);
        } catch (error) {
            console.error('Error loading chants by country:', error);
        } finally {
            setLoading(false);
        }
    }, [countryId, pageSize]);

    useEffect(() => {
        if (countryId) {
            setPage(0);
            loadChants(0);
        }
    }, [countryId, loadChants]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore && countryId) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadChants(nextPage);
        }
    }, [page, loading, hasMore, countryId, loadChants]);

    const refresh = useCallback(() => {
        setPage(0);
        loadChants(0);
    }, [loadChants]);

    return { chants, loading, loadMore, refresh, hasMore };
};

// Hook for chant search with pagination
export const useChantSearch = (pageSize: number = 50) => {
    const [chants, setChants] = useState<Chant[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const performSearch = useCallback(async (searchQuery: string, pageNum: number) => {
        if (!searchQuery.trim()) {
            setChants([]);
            setHasMore(false);
            return;
        }

        try {
            setLoading(true);
            const data = await backoff(() => chantService.searchChants(searchQuery, pageNum, pageSize));

            if (pageNum === 0) {
                setChants(data);
            } else {
                setChants(prev => [...prev, ...data]);
            }

            setHasMore(data.length === pageSize);
        } catch (error) {
            console.error('Error searching chants:', error);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    const search = useCallback((newQuery: string) => {
        setQuery(newQuery);
        setPage(0);
        performSearch(newQuery, 0);
    }, [performSearch]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore && query.trim()) {
            const nextPage = page + 1;
            setPage(nextPage);
            performSearch(query, nextPage);
        }
    }, [page, loading, hasMore, query, performSearch]);

    const refresh = useCallback(() => {
        setPage(0);
        performSearch(query, 0);
    }, [query, performSearch]);

    return { chants, loading, search, loadMore, refresh, hasMore };
};

// Hook for countries (no pagination needed - small dataset)
export const useCountries = () => {
    const [countries, setCountries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCountries = async () => {
            try {
                const data = await chantService.getAllCountries();
                setCountries(data);
            } catch (error) {
                console.error('Error loading countries:', error);
            } finally {
                setLoading(false);
            }
        };

        loadCountries();
    }, []);

    return { countries, loading };
};
