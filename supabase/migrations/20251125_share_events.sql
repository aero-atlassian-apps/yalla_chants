-- Share analytics: events table and RPC to record shares for chants/playlists

CREATE TABLE IF NOT EXISTS share_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type TEXT NOT NULL CHECK (target_type IN ('chant','playlist')),
  target_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_events_target ON share_events(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_share_events_user ON share_events(user_id);
CREATE INDEX IF NOT EXISTS idx_share_events_created ON share_events(created_at DESC);

CREATE OR REPLACE FUNCTION public.record_share_event(p_target_type TEXT, p_target_id UUID, p_user_id UUID DEFAULT NULL, p_platform TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO share_events(target_type, target_id, user_id, platform)
  VALUES (p_target_type, p_target_id, p_user_id, p_platform);

  IF p_target_type = 'chant' THEN
    UPDATE chants SET share_count = share_count + 1 WHERE id = p_target_id;
  ELSIF p_target_type = 'playlist' THEN
    UPDATE playlists SET share_count = share_count + 1 WHERE id = p_target_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.record_share_event(TEXT, UUID, UUID, TEXT) TO authenticated;

ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own share events" ON share_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert via RPC" ON share_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
