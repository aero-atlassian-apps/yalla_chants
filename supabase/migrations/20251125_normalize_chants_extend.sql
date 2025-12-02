-- Extend normalization to artist and region fields

CREATE OR REPLACE FUNCTION public.normalize_chants_fields()
RETURNS void AS $$
BEGIN
  UPDATE chants
  SET 
    football_team = normalize_text(football_team),
    tournament = normalize_text(tournament),
    artist = normalize_text(artist),
    region = normalize_text(region),
    updated_at = NOW()
  WHERE football_team IS NOT NULL OR tournament IS NOT NULL OR artist IS NOT NULL OR region IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
