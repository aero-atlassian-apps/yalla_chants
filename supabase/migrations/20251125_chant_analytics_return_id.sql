DROP FUNCTION IF EXISTS public.record_chant_play(UUID, UUID);
CREATE OR REPLACE FUNCTION public.record_chant_play(p_chant_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO chant_plays(chant_id, user_id) VALUES (p_chant_id, p_user_id) RETURNING id INTO new_id;
  UPDATE chants SET play_count = play_count + 1 WHERE id = p_chant_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.record_chant_play(UUID, UUID) TO authenticated;
