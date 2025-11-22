-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

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

-- Chants Table
CREATE TABLE chants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_arabic VARCHAR(255),
    title_french VARCHAR(255),
    country_id UUID NOT NULL REFERENCES countries(id),
    cultural_context_id UUID REFERENCES cultural_contexts(id),
    audio_url TEXT NOT NULL,
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
    chant_type VARCHAR(50) NOT NULL,
    football_team VARCHAR(255),
    tournament VARCHAR(100),
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
CREATE INDEX idx_chants_search ON chants USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(lyrics, '')));
CREATE INDEX idx_chants_tags ON chants USING gin(tags);

-- User Profiles
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

-- RLS Policies
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
