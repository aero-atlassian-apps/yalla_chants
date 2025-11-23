-- ==========================================
-- YALLA CHANTS - PLAYLIST FEATURE MIGRATION
-- ==========================================
-- This migration adds playlist functionality to the Yalla Chants app
-- Run this in Supabase SQL Editor
-- Date: 2025-01-23

-- ==========================================
-- 1. CREATE PLAYLISTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata (auto-calculated)
  chant_count INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0, -- in seconds
  share_count INTEGER DEFAULT 0,
  play_count INTEGER DEFAULT 0,
  
  CONSTRAINT name_not_empty CHECK (char_length(name) > 0)
);

-- ==========================================
-- 2. CREATE PLAYLIST_ITEMS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS playlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  chant_id UUID NOT NULL REFERENCES chants(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique chant per playlist and unique position per playlist
  UNIQUE(playlist_id, chant_id),
  UNIQUE(playlist_id, position),
  
  CONSTRAINT position_positive CHECK (position >= 0)
);

-- ==========================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ==========================================

-- Playlists indexes
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_is_public ON playlists(is_public);
CREATE INDEX IF NOT EXISTS idx_playlists_created_at ON playlists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playlists_play_count ON playlists(play_count DESC);

-- Playlist items indexes
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_chant_id ON playlist_items(chant_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_position ON playlist_items(playlist_id, position);

-- ==========================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 5. CREATE RLS POLICIES FOR PLAYLISTS
-- ==========================================

-- Policy: Users can view their own playlists
CREATE POLICY "Users can view own playlists"
  ON playlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Anyone can view public playlists
CREATE POLICY "Anyone can view public playlists"
  ON playlists FOR SELECT
  USING (is_public = true);

-- Policy: Users can create playlists
CREATE POLICY "Users can create playlists"
  ON playlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own playlists
CREATE POLICY "Users can update own playlists"
  ON playlists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own playlists
CREATE POLICY "Users can delete own playlists"
  ON playlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==========================================
-- 6. CREATE RLS POLICIES FOR PLAYLIST_ITEMS
-- ==========================================

-- Policy: Users can view items from their own playlists
CREATE POLICY "Users can view own playlist items"
  ON playlist_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Policy: Anyone can view items from public playlists
CREATE POLICY "Anyone can view public playlist items"
  ON playlist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND playlists.is_public = true
    )
  );

-- Policy: Users can add items to their own playlists
CREATE POLICY "Users can add items to own playlists"
  ON playlist_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Policy: Users can update items in their own playlists
CREATE POLICY "Users can update own playlist items"
  ON playlist_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND playlists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Policy: Users can delete items from their own playlists
CREATE POLICY "Users can delete own playlist items"
  ON playlist_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- ==========================================
-- 7. CREATE TRIGGER FUNCTION FOR METADATA
-- ==========================================

CREATE OR REPLACE FUNCTION update_playlist_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_playlist_id UUID;
  v_chant_count INTEGER;
  v_total_duration INTEGER;
BEGIN
  -- Get the playlist_id from either NEW or OLD
  v_playlist_id := COALESCE(NEW.playlist_id, OLD.playlist_id);
  
  -- Calculate chant count
  SELECT COUNT(*) INTO v_chant_count
  FROM playlist_items
  WHERE playlist_id = v_playlist_id;
  
  -- Calculate total duration
  SELECT COALESCE(SUM(c.audio_duration), 0) INTO v_total_duration
  FROM playlist_items pi
  JOIN chants c ON c.id = pi.chant_id
  WHERE pi.playlist_id = v_playlist_id;
  
  -- Update playlist metadata
  UPDATE playlists
  SET 
    chant_count = v_chant_count,
    total_duration = v_total_duration,
    updated_at = NOW()
  WHERE id = v_playlist_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 8. CREATE TRIGGERS
-- ==========================================

-- Drop trigger if exists (for re-running migration)
DROP TRIGGER IF EXISTS update_playlist_metadata_trigger ON playlist_items;

-- Create trigger for INSERT and DELETE
CREATE TRIGGER update_playlist_metadata_trigger
AFTER INSERT OR DELETE ON playlist_items
FOR EACH ROW
EXECUTE FUNCTION update_playlist_metadata();

-- ==========================================
-- 9. CREATE HELPER FUNCTIONS
-- ==========================================

-- Function to increment playlist play count
CREATE OR REPLACE FUNCTION increment_playlist_play_count(playlist_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE playlists
  SET play_count = play_count + 1
  WHERE id = playlist_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment playlist share count
CREATE OR REPLACE FUNCTION increment_playlist_share_count(playlist_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE playlists
  SET share_count = share_count + 1
  WHERE id = playlist_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reorder playlist items
CREATE OR REPLACE FUNCTION reorder_playlist_items(
  p_playlist_id UUID,
  p_item_positions JSONB
)
RETURNS void AS $$
DECLARE
  item JSONB;
BEGIN
  -- Validate user owns the playlist
  IF NOT EXISTS (
    SELECT 1 FROM playlists
    WHERE id = p_playlist_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Update positions
  FOR item IN SELECT * FROM jsonb_array_elements(p_item_positions)
  LOOP
    UPDATE playlist_items
    SET position = (item->>'position')::INTEGER
    WHERE id = (item->>'id')::UUID
    AND playlist_id = p_playlist_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 10. UPDATE USER_PROFILES TABLE (if exists)
-- ==========================================

-- Add playlists_count column if user_profiles table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
  ) THEN
    -- Add column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'playlists_count'
    ) THEN
      ALTER TABLE user_profiles ADD COLUMN playlists_count INTEGER DEFAULT 0;
    END IF;
  END IF;
END $$;

-- ==========================================
-- 11. CREATE TRIGGER TO UPDATE USER PROFILE
-- ==========================================

CREATE OR REPLACE FUNCTION update_user_playlists_count()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  -- Get user_id from either NEW or OLD
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  
  -- Only update if user_profiles table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
  ) THEN
    -- Calculate playlist count
    SELECT COUNT(*) INTO v_count
    FROM playlists
    WHERE user_id = v_user_id;
    
    -- Update user profile
    UPDATE user_profiles
    SET playlists_count = v_count
    WHERE id = v_user_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_user_playlists_count_trigger ON playlists;

-- Create trigger
CREATE TRIGGER update_user_playlists_count_trigger
AFTER INSERT OR DELETE ON playlists
FOR EACH ROW
EXECUTE FUNCTION update_user_playlists_count();

-- ==========================================
-- 12. VERIFICATION QUERIES
-- ==========================================

-- Verify tables were created
SELECT 
  'Tables created successfully' as status,
  COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('playlists', 'playlist_items');

-- Verify indexes were created
SELECT 
  'Indexes created successfully' as status,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('playlists', 'playlist_items');

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('playlists', 'playlist_items');

-- Verify policies were created
SELECT 
  'Policies created successfully' as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('playlists', 'playlist_items');

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ Playlist feature migration completed successfully!';
  RAISE NOTICE '📊 Tables: playlists, playlist_items';
  RAISE NOTICE '🔒 RLS policies: Enabled and configured';
  RAISE NOTICE '⚡ Triggers: Metadata auto-update enabled';
  RAISE NOTICE '🎯 Ready to use!';
END $$;
