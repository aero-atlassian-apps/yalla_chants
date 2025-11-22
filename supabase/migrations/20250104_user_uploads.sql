-- User Uploads Migration
-- Enables users to upload their own chants

-- User Uploads Table
CREATE TABLE user_uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  audio_file_url TEXT NOT NULL,
  audio_duration INTEGER NOT NULL,
  audio_format VARCHAR(10) NOT NULL DEFAULT 'mp3',
  audio_file_size BIGINT,
  thumbnail_url TEXT,
  country_id UUID REFERENCES countries(id),
  football_team VARCHAR(255),
  tags TEXT[],
  language VARCHAR(50),
  
  -- Moderation
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  moderation_notes TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMP WITH TIME ZONE,
  
  -- Engagement metrics
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- Timestamps
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_uploads_user ON user_uploads(user_id);
CREATE INDEX idx_user_uploads_status ON user_uploads(status);
CREATE INDEX idx_user_uploads_created ON user_uploads(created_at DESC);
CREATE INDEX idx_user_uploads_country ON user_uploads(country_id);
CREATE INDEX idx_user_uploads_play_count ON user_uploads(play_count DESC);

-- RLS Policies
ALTER TABLE user_uploads ENABLE ROW LEVEL SECURITY;

-- Users can view approved uploads
CREATE POLICY "Approved uploads are viewable by everyone" 
ON user_uploads FOR SELECT 
USING (status = 'approved');

-- Users can view their own uploads
CREATE POLICY "Users can view own uploads" 
ON user_uploads FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Users can create uploads
CREATE POLICY "Authenticated users can create uploads" 
ON user_uploads FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Users can update own uploads
CREATE POLICY "Users can update own uploads" 
ON user_uploads FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Users can delete own uploads
CREATE POLICY "Users can delete own uploads" 
ON user_uploads FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- User Likes Table
CREATE TABLE user_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chant_id UUID REFERENCES chants(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES user_uploads(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chant_or_upload_check CHECK (
    (chant_id IS NOT NULL AND upload_id IS NULL) OR
    (chant_id IS NULL AND upload_id IS NOT NULL)
  ),
  UNIQUE(user_id, chant_id),
  UNIQUE(user_id, upload_id)
);

CREATE INDEX idx_user_likes_user ON user_likes(user_id);
CREATE INDEX idx_user_likes_chant ON user_likes(chant_id);
CREATE INDEX idx_user_likes_upload ON user_likes(upload_id);

-- RLS for likes
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes" 
ON user_likes FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert own likes" 
ON user_likes FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own likes" 
ON user_likes FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- Function to increment play count
CREATE OR REPLACE FUNCTION increment_upload_play_count(upload_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_uploads
  SET play_count = play_count + 1
  WHERE id = upload_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update like count
CREATE OR REPLACE FUNCTION update_upload_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.upload_id IS NOT NULL THEN
    UPDATE user_uploads
    SET like_count = like_count + 1
    WHERE id = NEW.upload_id;
  ELSIF TG_OP = 'DELETE' AND OLD.upload_id IS NOT NULL THEN
    UPDATE user_uploads
    SET like_count = like_count - 1
    WHERE id = OLD.upload_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_upload_likes
AFTER INSERT OR DELETE ON user_likes
FOR EACH ROW
EXECUTE FUNCTION update_upload_like_count();
