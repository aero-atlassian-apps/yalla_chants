ALTER TABLE countries
    ADD COLUMN IF NOT EXISTS theme_primary_color VARCHAR(7);

UPDATE countries
SET theme_primary_color = COALESCE(theme_primary_color, '#1DB954');

CREATE INDEX IF NOT EXISTS idx_countries_theme_primary_color ON countries(theme_primary_color);
