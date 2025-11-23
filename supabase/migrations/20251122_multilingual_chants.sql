-- Migration to support multilingual chant data from JSON seed files
-- This adds support for the structure found in seeded_audio/seed_guide.json

-- Add multilingual support for title field
ALTER TABLE chants ADD COLUMN IF NOT EXISTS title_arabic VARCHAR(255);
ALTER TABLE chants ADD COLUMN IF NOT EXISTS title_french VARCHAR(255);

-- Add multilingual support for description field (already has basic i18n)
-- The existing description, description_arabic, description_french columns are sufficient

-- Add artist information
ALTER TABLE chants ADD COLUMN IF NOT EXISTS artist VARCHAR(255);
ALTER TABLE chants ADD COLUMN IF NOT EXISTS year INTEGER;

-- Add hashtags support
ALTER TABLE chants ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';

-- Add viral moments with multilingual support
ALTER TABLE chants ADD COLUMN IF NOT EXISTS viral_moment_en TEXT;
ALTER TABLE chants ADD COLUMN IF NOT EXISTS viral_moment_ar TEXT;
ALTER TABLE chants ADD COLUMN IF NOT EXISTS viral_moment_fr TEXT;
ALTER TABLE chants ADD COLUMN IF NOT EXISTS viral_moment_pt TEXT;

-- Add tournament information (already exists as tournament column)
-- Add YouTube URL support (using existing audio_url for consistency)
ALTER TABLE chants ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chants_artist ON chants(artist);
CREATE INDEX IF NOT EXISTS idx_chants_year ON chants(year);
CREATE INDEX IF NOT EXISTS idx_chants_hashtags ON chants USING gin(hashtags);
CREATE INDEX IF NOT EXISTS idx_chants_youtube ON chants(youtube_url);

-- Create function to get localized title based on user language
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

-- Create function to get localized viral moment based on user language
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

-- Create function to get localized description based on user language
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

-- Create a view that provides localized data based on user's language preference
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

-- Add RLS policy for new columns (existing policies should cover these)
-- No new RLS policies needed as existing ones cover the table