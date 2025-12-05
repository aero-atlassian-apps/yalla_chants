-- Backfill search_vector for existing chants rows
UPDATE chants SET search_vector = to_tsvector(
  'public.unaccent_simple'::regconfig,
  COALESCE(title,'') || ' ' || COALESCE(title_arabic,'') || ' ' || COALESCE(title_french,'') || ' ' ||
  COALESCE(description,'') || ' ' || COALESCE(description_arabic,'') || ' ' || COALESCE(description_french,'') || ' ' ||
  COALESCE(lyrics,'') || ' ' || COALESCE(lyrics_arabic,'') || ' ' || COALESCE(lyrics_french,'') || ' ' ||
  COALESCE(viral_moment_en,'') || ' ' || COALESCE(viral_moment_ar,'') || ' ' || COALESCE(viral_moment_fr,'') || ' ' || COALESCE(viral_moment_pt,'') || ' ' ||
  COALESCE(artist,'') || ' ' || COALESCE(football_team,'') || ' ' || COALESCE(tournament,'') || ' ' ||
  COALESCE(array_to_string(tags, ' '), '') || ' ' || COALESCE(array_to_string(hashtags, ' '), '')
) WHERE true;

-- Optional: analyze for planner stats
ANALYZE chants;
