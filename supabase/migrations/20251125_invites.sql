-- Referral codes & invite events

CREATE TABLE IF NOT EXISTS user_invites (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invite_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_code TEXT NOT NULL,
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  landing_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invite_events_code ON invite_events(invite_code);

CREATE OR REPLACE FUNCTION public.get_or_create_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  SELECT invite_code INTO code FROM user_invites WHERE user_id = auth.uid();
  IF code IS NOT NULL THEN
    RETURN code;
  END IF;
  code := encode(gen_random_bytes(6), 'hex');
  INSERT INTO user_invites(user_id, invite_code) VALUES (auth.uid(), code);
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.record_invite_event(p_code TEXT, p_referrer UUID DEFAULT NULL, p_visitor UUID DEFAULT NULL, p_url TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO invite_events(invite_code, referrer_user_id, visitor_user_id, landing_url)
  VALUES (p_code, p_referrer, p_visitor, p_url);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_or_create_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_invite_event(TEXT, UUID, UUID, TEXT) TO authenticated;

ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own invite" ON user_invites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own invite" ON user_invites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
