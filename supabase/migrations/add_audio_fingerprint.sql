ALTER TABLE public.chants ADD COLUMN IF NOT EXISTS audio_fingerprint text;
CREATE INDEX IF NOT EXISTS idx_chants_audio_fingerprint ON public.chants USING btree (audio_fingerprint);
