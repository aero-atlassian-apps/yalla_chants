-- Apply weighted tsvector segments for stronger title weighting
-- and update RPC to use coverage-based ranking

-- Update trigger function to build weighted search_vector
CREATE OR REPLACE FUNCTION public.chants_update_search_vector()
RETURNS trigger AS $$
DECLARE
  v_title TEXT := COALESCE(NEW.title,'') || ' ' || COALESCE(NEW.title_arabic,'') || ' ' || COALESCE(NEW.title_french,'');
  v_artist_team TEXT := COALESCE(NEW.artist,'') || ' ' || COALESCE(NEW.football_team,'');
  v_viral_tourney TEXT := COALESCE(NEW.viral_moment_en,'') || ' ' || COALESCE(NEW.viral_moment_ar,'') || ' ' || COALESCE(NEW.viral_moment_fr,'') || ' ' || COALESCE(NEW.viral_moment_pt,'') || ' ' || COALESCE(NEW.tournament,'');
  v_desc_lyrics TEXT := COALESCE(NEW.description,'') || ' ' || COALESCE(NEW.description_arabic,'') || ' ' || COALESCE(NEW.description_french,'') || ' ' || COALESCE(NEW.lyrics,'') || ' ' || COALESCE(NEW.lyrics_arabic,'') || ' ' || COALESCE(NEW.lyrics_french,'');
  v_tags TEXT := COALESCE(array_to_string(NEW.tags, ' '), '');
  v_hashtags TEXT := COALESCE(array_to_string(NEW.hashtags, ' '), '');
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('public.unaccent_simple'::regconfig, v_title), 'A') ||
    setweight(to_tsvector('public.unaccent_simple'::regconfig, v_hashtags), 'B') ||
    setweight(to_tsvector('public.unaccent_simple'::regconfig, v_artist_team), 'C') ||
    setweight(to_tsvector('public.unaccent_simple'::regconfig, v_viral_tourney), 'C') ||
    setweight(to_tsvector('public.unaccent_simple'::regconfig, v_desc_lyrics), 'C') ||
    setweight(to_tsvector('public.unaccent_simple'::regconfig, v_tags), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger to ensure it uses the latest function
DROP TRIGGER IF EXISTS chants_search_vector_tsv ON chants;
CREATE TRIGGER chants_search_vector_tsv
BEFORE INSERT OR UPDATE ON chants
FOR EACH ROW EXECUTE FUNCTION public.chants_update_search_vector();

-- Re-rank RPC using coverage-based ts_rank_cd
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
    OR COALESCE(c.title,'') ILIKE '%' || p_query || '%'
    OR COALESCE(c.title_arabic,'') ILIKE '%' || p_query || '%'
    OR COALESCE(c.title_french,'') ILIKE '%' || p_query || '%'
    OR COALESCE(c.lyrics,'') ILIKE '%' || p_query || '%'
    OR COALESCE(c.lyrics_arabic,'') ILIKE '%' || p_query || '%'
    OR COALESCE(c.lyrics_french,'') ILIKE '%' || p_query || '%'
    OR COALESCE(c.viral_moment_en,'') ILIKE '%' || p_query || '%'
    OR COALESCE(c.viral_moment_ar,'') ILIKE '%' || p_query || '%'
    OR COALESCE(c.viral_moment_fr,'') ILIKE '%' || p_query || '%'
    OR COALESCE(c.viral_moment_pt,'') ILIKE '%' || p_query || '%'
    OR COALESCE(c.artist,'') ILIKE '%' || p_query || '%'
    OR COALESCE(c.football_team,'') ILIKE '%' || p_query || '%'
    OR COALESCE(c.tournament,'') ILIKE '%' || p_query || '%'
    OR COALESCE(array_to_string(c.tags,' '),'') ILIKE '%' || p_query || '%'
    OR COALESCE(array_to_string(c.hashtags,' '),'') ILIKE '%' || p_query || '%'
  )
  AND (p_country_id IS NULL OR c.country_id = p_country_id)
  ORDER BY
    ts_rank_cd(
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

-- Backfill weighted search_vector for existing rows
UPDATE chants SET search_vector = (
  setweight(to_tsvector('public.unaccent_simple'::regconfig, COALESCE(title,'') || ' ' || COALESCE(title_arabic,'') || ' ' || COALESCE(title_french,'')), 'A') ||
  setweight(to_tsvector('public.unaccent_simple'::regconfig, COALESCE(array_to_string(hashtags, ' '), '')), 'B') ||
  setweight(to_tsvector('public.unaccent_simple'::regconfig, COALESCE(artist,'') || ' ' || COALESCE(football_team,'')), 'C') ||
  setweight(to_tsvector('public.unaccent_simple'::regconfig, COALESCE(viral_moment_en,'') || ' ' || COALESCE(viral_moment_ar,'') || ' ' || COALESCE(viral_moment_fr,'') || ' ' || COALESCE(viral_moment_pt,'') || ' ' || COALESCE(tournament,'')), 'C') ||
  setweight(to_tsvector('public.unaccent_simple'::regconfig, COALESCE(description,'') || ' ' || COALESCE(description_arabic,'') || ' ' || COALESCE(description_french,'') || ' ' || COALESCE(lyrics,'') || ' ' || COALESCE(lyrics_arabic,'') || ' ' || COALESCE(lyrics_french,'')), 'C') ||
  setweight(to_tsvector('public.unaccent_simple'::regconfig, COALESCE(array_to_string(tags, ' '), '')), 'C') ||
  setweight(to_tsvector('public.unaccent_simple'::regconfig, COALESCE(array_to_string(hashtags, ' '), '')), 'B')
) WHERE true;

ANALYZE chants;
