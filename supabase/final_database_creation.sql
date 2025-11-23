-- =============================================================================
-- YALLA CHANTS - COMPLETE DATABASE SETUP SCRIPT
-- =============================================================================
-- This script creates the entire database schema from scratch
-- Includes: Core tables, RLS policies, functions, triggers, and multilingual support
-- =============================================================================

-- =============================================================================
-- STEP 1: ENABLE EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =============================================================================
-- STEP 2: CORE TABLES
-- =============================================================================

-- Countries Table
CREATE TABLE countries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_arabic VARCHAR(100),
    name_french VARCHAR(100),
    code VARCHAR(2) NOT NULL UNIQUE,
    code_alpha3 VARCHAR(3) NOT NULL UNIQUE,
    flag_emoji VARCHAR(10) NOT NULL,
    flag_svg_url TEXT,
    capital_city VARCHAR(100),
    population BIGINT,
    region VARCHAR(50) NOT NULL,
    cultural_description TEXT,
    cultural_description_arabic TEXT,
    cultural_description_french TEXT,
    football_history TEXT,
    traditional_instruments TEXT[],
    primary_languages TEXT[],
    currency_code VARCHAR(3),
    timezone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    cultural_importance_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_countries_region ON countries(region);
CREATE INDEX idx_countries_active ON countries(is_active);
CREATE INDEX idx_countries_cultural_score ON countries(cultural_importance_score DESC);

-- Cultural Context Table
CREATE TABLE cultural_contexts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_arabic VARCHAR(255),
    title_french VARCHAR(255),
    description TEXT NOT NULL,
    description_arabic TEXT,
    description_french TEXT,
    historical_period VARCHAR(100),
    significance_level INTEGER CHECK (significance_level BETWEEN 1 AND 5),
    sources TEXT[],
    images TEXT[],
    audio_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cultural_contexts_country ON cultural_contexts(country_id);
CREATE INDEX idx_cultural_contexts_type ON cultural_contexts(context_type);

-- User Profiles Table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    bio_arabic TEXT,
    bio_french TEXT,
    country_id UUID REFERENCES countries(id),
    primary_language VARCHAR(50) DEFAULT 'english',
    secondary_languages TEXT[],
    cultural_background TEXT,
    favorite_team VARCHAR(255),
    favorite_country_id UUID REFERENCES countries(id),
    football_position VARCHAR(50),
    avatar_url TEXT,
    cover_image_url TEXT,
    theme_preference VARCHAR(20) DEFAULT 'auto',
    is_creator BOOLEAN DEFAULT FALSE,
    is_verified_creator BOOLEAN DEFAULT FALSE,
    creator_since TIMESTAMP WITH TIME ZONE,
    profile_visibility VARCHAR(20) DEFAULT 'public',
    show_country BOOLEAN DEFAULT TRUE,
    allow_messages BOOLEAN DEFAULT TRUE,
    join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    streak_days INTEGER DEFAULT 0,
    uploads_count INTEGER DEFAULT 0,
    playlists_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    achievement_badges TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_country ON user_profiles(country_id);
CREATE INDEX idx_user_profiles_creator ON user_profiles(is_creator);

-- Chants Table (with multilingual support)
CREATE TABLE chants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_arabic VARCHAR(255),
    title_french VARCHAR(255),
    country_id UUID NOT NULL REFERENCES countries(id),
    cultural_context_id UUID REFERENCES cultural_contexts(id),
    audio_url TEXT NOT NULL,
    audio_bucket_url TEXT,
    audio_duration INTEGER NOT NULL,
    audio_file_size BIGINT,
    audio_format VARCHAR(10) NOT NULL,
    audio_bitrate INTEGER,
    audio_sample_rate INTEGER,
    description TEXT,
    description_arabic TEXT,
    description_french TEXT,
    lyrics TEXT,
    lyrics_arabic TEXT,
    lyrics_french TEXT,
    tags TEXT[],
    hashtags TEXT[] DEFAULT '{}',
    chant_type VARCHAR(50) NOT NULL,
    football_team VARCHAR(255),
    tournament VARCHAR(100),
    artist VARCHAR(255),
    year INTEGER,
    youtube_url TEXT,
    viral_moment_en TEXT,
    viral_moment_ar TEXT,
    viral_moment_fr TEXT,
    viral_moment_pt TEXT,
    historical_significance TEXT,
    is_official BOOLEAN DEFAULT FALSE,
    is_traditional BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    copyright_status VARCHAR(50),
    copyright_holder VARCHAR(255),
    license_type VARCHAR(100),
    license_expires_at TIMESTAMP WITH TIME ZONE,
    attribution_required TEXT,
    creator_user_id UUID REFERENCES auth.users(id),
    community_submitted BOOLEAN DEFAULT FALSE,
    community_notes TEXT,
    play_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    average_rating DECIMAL(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    moderation_notes TEXT,
    moderated_by UUID REFERENCES auth.users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    language VARCHAR(50),
    dialect VARCHAR(100),
    region VARCHAR(100),
    meta_title VARCHAR(255),
    meta_description TEXT,
    slug VARCHAR(255) UNIQUE,
    recorded_date DATE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chants_country ON chants(country_id);
CREATE INDEX idx_chants_type ON chants(chant_type);
CREATE INDEX idx_chants_team ON chants(football_team);
CREATE INDEX idx_chants_status ON chants(status);
CREATE INDEX idx_chants_verified ON chants(is_verified);
CREATE INDEX idx_chants_creator ON chants(creator_user_id);
CREATE INDEX idx_chants_play_count ON chants(play_count DESC);
CREATE INDEX idx_chants_created ON chants(created_at DESC);
CREATE INDEX idx_chants_language ON chants(language);
CREATE INDEX idx_chants_artist ON chants(artist);
CREATE INDEX idx_chants_year ON chants(year);
CREATE INDEX idx_chants_hashtags ON chants USING gin(hashtags);
CREATE INDEX idx_chants_youtube ON chants(youtube_url);
CREATE INDEX idx_chants_bucket_url ON chants((audio_bucket_url IS NOT NULL));
CREATE INDEX idx_chants_search ON chants USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(lyrics, '')));
CREATE INDEX idx_chants_tags ON chants USING gin(tags);

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

CREATE INDEX idx_user_uploads_user ON user_uploads(user_id);
CREATE INDEX idx_user_uploads_status ON user_uploads(status);
CREATE INDEX idx_user_uploads_created ON user_uploads(created_at DESC);
CREATE INDEX idx_user_uploads_country ON user_uploads(country_id);
CREATE INDEX idx_user_uploads_play_count ON user_uploads(play_count DESC);

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

-- Jam Chat Messages
CREATE TABLE jam_chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  jam_session_id UUID NOT NULL REFERENCES jam_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_jam_sessions_host ON jam_sessions(host_user_id);
CREATE INDEX idx_jam_sessions_code ON jam_sessions(join_code);
CREATE INDEX idx_jam_sessions_status ON jam_sessions(status);
CREATE INDEX idx_jam_sessions_public ON jam_sessions(is_public) WHERE is_public = true;
CREATE INDEX idx_jam_participants_session ON jam_participants(jam_session_id);
CREATE INDEX idx_jam_participants_user ON jam_participants(user_id);
CREATE INDEX idx_jam_chat_session ON jam_chat_messages(jam_session_id);

-- =============================================================================
-- STEP 3: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Chants RLS
ALTER TABLE chants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view active verified chants" 
ON chants FOR SELECT 
USING (status = 'active');

CREATE POLICY "Users can view own chants" 
ON chants FOR SELECT 
TO authenticated 
USING (creator_user_id = auth.uid());

CREATE POLICY "Authenticated users can create chants" 
ON chants FOR INSERT 
TO authenticated 
WITH CHECK (creator_user_id = auth.uid());

-- User Profiles RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON user_profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON user_profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = id);

-- User Uploads RLS
ALTER TABLE user_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved uploads are viewable by everyone" 
ON user_uploads FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can view own uploads" 
ON user_uploads FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create uploads" 
ON user_uploads FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own uploads" 
ON user_uploads FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own uploads" 
ON user_uploads FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- User Likes RLS
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

-- Jam Sessions RLS
ALTER TABLE jam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jam_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE jam_chat_messages ENABLE ROW LEVEL SECURITY;

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

-- Jam Participants RLS (with recursion fix)
CREATE OR REPLACE FUNCTION public.is_member_of_session(sid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM jam_participants p
    WHERE p.jam_session_id = sid
      AND p.user_id = auth.uid()
  );
$$;

CREATE POLICY "Users can view session participants"
ON public.jam_participants
FOR SELECT
TO authenticated
USING (
  public.is_member_of_session(jam_session_id)
);

CREATE POLICY "Users can join sessions" 
ON jam_participants FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave sessions" 
ON jam_participants FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Jam Chat Messages RLS
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

-- =============================================================================
-- STEP 4: FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to increment upload play count
CREATE OR REPLACE FUNCTION increment_upload_play_count(upload_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_uploads
  SET play_count = play_count + 1
  WHERE id = upload_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update upload like count
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

-- =============================================================================
-- STEP 5: MULTILINGUAL SUPPORT FUNCTIONS
-- =============================================================================

-- Function to get localized title based on user language
CREATE OR REPLACE FUNCTION get_localized_title(chant_row chants, user_lang VARCHAR(10) DEFAULT 'en')
RETURNS VARCHAR(255) AS $$
BEGIN
  RETURN CASE 
    WHEN user_lang = 'ar' AND chant_row.title_arabic IS NOT NULL THEN chant_row.title_arabic
    WHEN user_lang = 'fr' AND chant_row.title_french IS NOT NULL THEN chant_row.title_french
    ELSE chant_row.title
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get localized description based on user language
CREATE OR REPLACE FUNCTION get_localized_description(chant_row chants, user_lang VARCHAR(10) DEFAULT 'en')
RETURNS TEXT AS $$
BEGIN
  RETURN CASE 
    WHEN user_lang = 'ar' AND chant_row.description_arabic IS NOT NULL THEN chant_row.description_arabic
    WHEN user_lang = 'fr' AND chant_row.description_french IS NOT NULL THEN chant_row.description_french
    ELSE chant_row.description
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get localized viral moment based on user language
CREATE OR REPLACE FUNCTION get_localized_viral_moment(chant_row chants, user_lang VARCHAR(10) DEFAULT 'en')
RETURNS TEXT AS $$
BEGIN
  RETURN CASE 
    WHEN user_lang = 'ar' AND chant_row.viral_moment_ar IS NOT NULL THEN chant_row.viral_moment_ar
    WHEN user_lang = 'fr' AND chant_row.viral_moment_fr IS NOT NULL THEN chant_row.viral_moment_fr
    WHEN user_lang = 'pt' AND chant_row.viral_moment_pt IS NOT NULL THEN chant_row.viral_moment_pt
    ELSE chant_row.viral_moment_en
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- STEP 6: VIEWS AND REALTIME
-- =============================================================================

-- Create localized view for chants
CREATE OR REPLACE VIEW localized_chants AS
SELECT 
  c.*,
  get_localized_title(c, 'en') as localized_title_en,
  get_localized_title(c, 'ar') as localized_title_ar,
  get_localized_title(c, 'fr') as localized_title_fr,
  get_localized_description(c, 'en') as localized_description_en,
  get_localized_description(c, 'ar') as localized_description_ar,
  get_localized_description(c, 'fr') as localized_description_fr,
  get_localized_viral_moment(c, 'en') as localized_viral_moment_en,
  get_localized_viral_moment(c, 'ar') as localized_viral_moment_ar,
  get_localized_viral_moment(c, 'fr') as localized_viral_moment_fr,
  get_localized_viral_moment(c, 'pt') as localized_viral_moment_pt
FROM chants c;

-- Enable realtime for jam features
ALTER PUBLICATION supabase_realtime ADD TABLE jam_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE jam_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE jam_chat_messages;

-- =============================================================================
-- STEP 7: GRANTS AND PERMISSIONS
-- =============================================================================

-- Grant necessary permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT ON user_profiles TO authenticated;
GRANT UPDATE ON user_profiles TO authenticated;
GRANT INSERT ON chants TO authenticated;
GRANT INSERT ON user_uploads TO authenticated;
GRANT UPDATE ON user_uploads TO authenticated;
GRANT DELETE ON user_uploads TO authenticated;
GRANT INSERT ON user_likes TO authenticated;
GRANT DELETE ON user_likes TO authenticated;
GRANT INSERT ON jam_sessions TO authenticated;
GRANT UPDATE ON jam_sessions TO authenticated;
GRANT INSERT ON jam_participants TO authenticated;
GRANT UPDATE ON jam_participants TO authenticated;
GRANT INSERT ON jam_chat_messages TO authenticated;

-- =============================================================================
-- COMPLETE DATABASE SETUP
-- =============================================================================
-- This script creates a complete Yalla Chants database with:
-- 
-- 1. Core Tables: countries, cultural_contexts, user_profiles, chants
-- 2. User Features: user_uploads, user_likes
-- 3. Social Features: jam_sessions, jam_participants, jam_chat_messages
-- 4. Multilingual Support: Arabic, French, English, Portuguese
-- 5. Security: Row Level Security policies
-- 6. Performance: Indexes and optimization
-- 7. Realtime: Supabase realtime subscriptions
-- 8. Automation: Triggers and functions
--
-- Ready for production use with your JSON seed data!