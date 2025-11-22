-- Add bucket URL column to chants to support both external and storage URLs
ALTER TABLE chants ADD COLUMN IF NOT EXISTS audio_bucket_url TEXT;

-- Optional index for queries filtering on bucket presence
CREATE INDEX IF NOT EXISTS idx_chants_bucket_url ON chants((audio_bucket_url IS NOT NULL));
