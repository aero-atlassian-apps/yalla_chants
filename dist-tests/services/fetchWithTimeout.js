import { useNetworkStore } from '../store/networkStore';
export const fetchWithTimeout = async (input, init = {}) => {
    const controller = new AbortController();
    const timeoutMs = 10000;
    const startedAt = Date.now();
    const isOnline = useNetworkStore.getState().isOnline;
    const url = typeof input === 'string' ? input : input?.url;
    const method = init?.method || 'GET';
    console.log('[net:req]', { url, method, timeoutMs, isOnline });
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(input, { ...init, signal: controller.signal });
        console.log('[net:ok]', { url, method, status: res.status, durationMs: Date.now() - startedAt });
        return res;
    }
    catch (e) {
        const aborted = e?.name === 'AbortError';
        console.log('[net:error]', { url, method, aborted, message: String(e?.message || e), durationMs: Date.now() - startedAt, isOnline });
        throw e;
    }
    finally {
        clearTimeout(id);
    }
};
