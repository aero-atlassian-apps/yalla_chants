CREATE TABLE IF NOT EXISTS chant_plays (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chant_id UUID NOT NULL REFERENCES chants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_chant_plays_chant ON chant_plays(chant_id);
CREATE INDEX IF NOT EXISTS idx_chant_plays_user ON chant_plays(user_id);
CREATE INDEX IF NOT EXISTS idx_chant_plays_started ON chant_plays(started_at DESC);

CREATE OR REPLACE FUNCTION public.record_chant_play(p_chant_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO chant_plays(chant_id, user_id) VALUES (p_chant_id, p_user_id);
  UPDATE chants SET play_count = play_count + 1 WHERE id = p_chant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.record_chant_play(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_chant_play(p_play_id UUID, p_duration_ms INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE chant_plays
  SET completed = true, completed_at = NOW(), duration_ms = p_duration_ms
  WHERE id = p_play_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.complete_chant_play(UUID, INTEGER) TO authenticated;

ALTER TABLE chant_plays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view plays they created" ON chant_plays FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert via RPC" ON chant_plays FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_chant_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.chant_id IS NOT NULL THEN
    UPDATE chants SET like_count = like_count + 1 WHERE id = NEW.chant_id;
  ELSIF TG_OP = 'DELETE' AND OLD.chant_id IS NOT NULL THEN
    UPDATE chants SET like_count = like_count - 1 WHERE id = OLD.chant_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_chant_likes ON user_likes;
CREATE TRIGGER update_chant_likes
AFTER INSERT OR DELETE ON user_likes
FOR EACH ROW
EXECUTE FUNCTION update_chant_like_count();
