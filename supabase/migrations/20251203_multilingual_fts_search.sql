-- Full-text search across multilingual chant fields, lyrics, hashtags, viral moments
-- Adds an optimized GIN index and a unified RPC for clients (mobile + web)

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create an accent-insensitive text search configuration and index
DROP TEXT SEARCH CONFIGURATION IF EXISTS public.unaccent_simple;
CREATE TEXT SEARCH CONFIGURATION public.unaccent_simple ( COPY = simple );
ALTER TEXT SEARCH CONFIGURATION public.unaccent_simple
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, simple;

ALTER TABLE chants ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.chants_update_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'public.unaccent_simple'::regconfig,
    COALESCE(NEW.title,'') || ' ' || COALESCE(NEW.title_arabic,'') || ' ' || COALESCE(NEW.title_french,'') || ' ' ||
    COALESCE(NEW.description,'') || ' ' || COALESCE(NEW.description_arabic,'') || ' ' || COALESCE(NEW.description_french,'') || ' ' ||
    COALESCE(NEW.lyrics,'') || ' ' || COALESCE(NEW.lyrics_arabic,'') || ' ' || COALESCE(NEW.lyrics_french,'') || ' ' ||
    COALESCE(NEW.viral_moment_en,'') || ' ' || COALESCE(NEW.viral_moment_ar,'') || ' ' || COALESCE(NEW.viral_moment_fr,'') || ' ' || COALESCE(NEW.viral_moment_pt,'') || ' ' ||
    COALESCE(NEW.artist,'') || ' ' || COALESCE(NEW.football_team,'') || ' ' || COALESCE(NEW.tournament,'') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '') || ' ' || COALESCE(array_to_string(NEW.hashtags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chants_search_vector_tsv ON chants;
CREATE TRIGGER chants_search_vector_tsv
BEFORE INSERT OR UPDATE ON chants
FOR EACH ROW EXECUTE FUNCTION public.chants_update_search_vector();

CREATE INDEX IF NOT EXISTS idx_chants_search_vector ON chants USING gin (search_vector);

-- Trigram indexes for fast partial matches on key fields (without unaccent in index expression)
CREATE INDEX IF NOT EXISTS idx_chants_title_trgm ON chants USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_chants_artist_trgm ON chants USING gin (artist gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_chants_team_trgm ON chants USING gin (football_team gin_trgm_ops);

-- Unified RPC function for searching chants
CREATE OR REPLACE FUNCTION public.search_chants(
  p_query TEXT,
  p_country_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS SETOF chants AS $$
BEGIN
  RETURN QUERY
  SELECT c.*
  FROM chants c
  WHERE (
    c.search_vector @@ websearch_to_tsquery('public.unaccent_simple'::regconfig, p_query)
    OR unaccent(COALESCE(c.title,'')) ILIKE unaccent('%' || p_query || '%')
    OR unaccent(COALESCE(c.title_arabic,'')) ILIKE unaccent('%' || p_query || '%')
    OR unaccent(COALESCE(c.title_french,'')) ILIKE unaccent('%' || p_query || '%')
    OR unaccent(COALESCE(c.lyrics,'')) ILIKE unaccent('%' || p_query || '%')
    OR unaccent(COALESCE(c.lyrics_arabic,'')) ILIKE unaccent('%' || p_query || '%')
    OR unaccent(COALESCE(c.lyrics_french,'')) ILIKE unaccent('%' || p_query || '%')
    OR unaccent(COALESCE(c.viral_moment_en,'')) ILIKE unaccent('%' || p_query || '%')
    OR unaccent(COALESCE(c.viral_moment_ar,'')) ILIKE unaccent('%' || p_query || '%')
    OR unaccent(COALESCE(c.viral_moment_fr,'')) ILIKE unaccent('%' || p_query || '%')
    OR unaccent(COALESCE(c.viral_moment_pt,'')) ILIKE unaccent('%' || p_query || '%')
    OR unaccent(COALESCE(c.artist,'')) ILIKE unaccent('%' || p_query || '%')
    OR unaccent(COALESCE(c.football_team,'')) ILIKE unaccent('%' || p_query || '%')
    OR unaccent(COALESCE(c.tournament,'')) ILIKE unaccent('%' || p_query || '%')
    OR COALESCE(array_to_string(c.tags,' '),'') ILIKE '%' || p_query || '%'
    OR COALESCE(array_to_string(c.hashtags,' '),'') ILIKE '%' || p_query || '%'
  )
  AND (p_country_id IS NULL OR c.country_id = p_country_id)
  ORDER BY
    ts_rank(
      c.search_vector,
      websearch_to_tsquery('public.unaccent_simple'::regconfig, p_query)
    ) DESC NULLS LAST,
    c.play_count DESC NULLS LAST,
    c.created_at DESC
  OFFSET p_offset
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION public.search_chants(TEXT, UUID, INT, INT) TO authenticated, anon;
