-- Normalize team/tournament strings to improve related matching quality

CREATE OR REPLACE FUNCTION public.normalize_text(s TEXT)
RETURNS TEXT AS $$
BEGIN
  IF s IS NULL THEN RETURN NULL; END IF;
  -- lowercase, trim, collapse spaces, remove trailing punctuation
  RETURN regexp_replace(lower(trim(s)), '\s+', ' ', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.normalize_chants_fields()
RETURNS void AS $$
BEGIN
  UPDATE chants
  SET 
    football_team = normalize_text(football_team),
    tournament = normalize_text(tournament),
    updated_at = NOW()
  WHERE football_team IS NOT NULL OR tournament IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.normalize_chants_fields() TO authenticated;
