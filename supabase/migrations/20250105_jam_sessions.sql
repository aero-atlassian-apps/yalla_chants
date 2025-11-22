-- Jam Sessions Migration
-- Enables collaborative listening sessions

-- Jam Sessions Table
CREATE TABLE jam_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  join_code VARCHAR(8) UNIQUE NOT NULL,
  max_participants INTEGER DEFAULT 50,
  
  -- Playback state
  current_track_id UUID REFERENCES chants(id),
  current_position INTEGER DEFAULT 0,
  is_playing BOOLEAN DEFAULT false,
  playlist JSONB DEFAULT '[]'::jsonb, -- Array of chant IDs with metadata
  
  -- Session status
  status VARCHAR(20) DEFAULT 'active', -- active, ended
  participant_count INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jam Participants Table
CREATE TABLE jam_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  jam_session_id UUID NOT NULL REFERENCES jam_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Participant state
  is_active BOOLEAN DEFAULT true,
  is_host BOOLEAN DEFAULT false,
  
  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(jam_session_id, user_id)
);

-- Jam Chat Messages (Optional)
CREATE TABLE jam_chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  jam_session_id UUID NOT NULL REFERENCES jam_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jam_sessions_host ON jam_sessions(host_user_id);
CREATE INDEX idx_jam_sessions_code ON jam_sessions(join_code);
CREATE INDEX idx_jam_sessions_status ON jam_sessions(status);
CREATE INDEX idx_jam_sessions_public ON jam_sessions(is_public) WHERE is_public = true;
CREATE INDEX idx_jam_participants_session ON jam_participants(jam_session_id);
CREATE INDEX idx_jam_participants_user ON jam_participants(user_id);
CREATE INDEX idx_jam_chat_session ON jam_chat_messages(jam_session_id);

-- RLS Policies
ALTER TABLE jam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jam_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE jam_chat_messages ENABLE ROW LEVEL SECURITY;

-- Jam Sessions Policies
CREATE POLICY "Public sessions viewable by everyone" 
ON jam_sessions FOR SELECT 
USING (is_public = true AND status = 'active');

CREATE POLICY "Participants can view their sessions" 
ON jam_sessions FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM jam_participants
    WHERE jam_participants.jam_session_id = jam_sessions.id
    AND jam_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create sessions" 
ON jam_sessions FOR INSERT 
TO authenticated 
WITH CHECK (host_user_id = auth.uid());

CREATE POLICY "Hosts can update their sessions" 
ON jam_sessions FOR UPDATE 
TO authenticated 
USING (host_user_id = auth.uid());

-- Participants Policies
CREATE POLICY "Users can view session participants" 
ON jam_participants FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM jam_participants AS p
    WHERE p.jam_session_id = jam_participants.jam_session_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join sessions" 
ON jam_participants FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave sessions" 
ON jam_participants FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Chat Policies
CREATE POLICY "Participants can view chat" 
ON jam_chat_messages FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM jam_participants
    WHERE jam_participants.jam_session_id = jam_chat_messages.jam_session_id
    AND jam_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Participants can send messages" 
ON jam_chat_messages FOR INSERT 
TO authenticated 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM jam_participants
    WHERE jam_participants.jam_session_id = jam_chat_messages.jam_session_id
    AND jam_participants.user_id = auth.uid()
    AND jam_participants.is_active = true
  )
);

-- Function to generate random join code
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(8) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate join code automatically
CREATE OR REPLACE FUNCTION set_jam_join_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := generate_join_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_jam_code
BEFORE INSERT ON jam_sessions
FOR EACH ROW
EXECUTE FUNCTION set_jam_join_code();

-- Function to update participant count
CREATE OR REPLACE FUNCTION update_jam_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE jam_sessions
    SET participant_count = (
      SELECT COUNT(*) FROM jam_participants
      WHERE jam_session_id = NEW.jam_session_id
      AND is_active = true
    )
    WHERE id = NEW.jam_session_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jam_sessions
    SET participant_count = (
      SELECT COUNT(*) FROM jam_participants
      WHERE jam_session_id = OLD.jam_session_id
      AND is_active = true
    )
    WHERE id = OLD.jam_session_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_participant_count
AFTER INSERT OR UPDATE OR DELETE ON jam_participants
FOR EACH ROW
EXECUTE FUNCTION update_jam_participant_count();

-- Enable realtime for jam features
ALTER PUBLICATION supabase_realtime ADD TABLE jam_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE jam_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE jam_chat_messages;
