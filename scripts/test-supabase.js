// Quick reachability test for Supabase endpoints from Node (outside emulator)
// Usage: node scripts/test-supabase.js https://<project>.supabase.co [anonKey]

const url = process.argv[2] || '';
const anonKey = process.argv[3] || '';

if (!url || !/^https:\/\/.*\.supabase\.co\/?$/.test(url)) {
  console.log('Usage: node scripts/test-supabase.js https://<project>.supabase.co [anonKey]');
  process.exit(1);
}

const fetchWithTimeout = async (input, init = {}, timeoutMs = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return { ok: true, status: res.status, durationMs: Date.now() - startedAt };
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e), durationMs: Date.now() - startedAt };
  } finally {
    clearTimeout(id);
  }
};

(async () => {
  console.log('[test] project url:', url);
  const head = await fetchWithTimeout(url, { method: 'HEAD' });
  console.log('[test:HEAD]', head);

  const tokenUrl = `${url.replace(/\/$/, '')}/auth/v1/token?grant_type=refresh_token`;
  const body = JSON.stringify({ refresh_token: 'invalid' });
  const headers = { 'Content-Type': 'application/json' };
  if (anonKey) headers['apikey'] = anonKey;
  const post = await fetchWithTimeout(tokenUrl, { method: 'POST', headers, body });
  console.log('[test:POST refresh_token]', post);

  process.exit(0);
})();

