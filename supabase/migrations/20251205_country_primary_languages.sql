BEGIN;

ALTER TABLE countries ADD COLUMN IF NOT EXISTS primary_languages TEXT[];

WITH m(code, langs) AS (
  VALUES
    ('AE', ARRAY['ar']),('SA', ARRAY['ar']),('QA', ARRAY['ar']),('BH', ARRAY['ar']),('OM', ARRAY['ar']),('KW', ARRAY['ar']),('JO', ARRAY['ar']),('LB', ARRAY['ar']),('SY', ARRAY['ar']),('IQ', ARRAY['ar']),('EG', ARRAY['ar']),('LY', ARRAY['ar']),('PS', ARRAY['ar']),('YE', ARRAY['ar']),('SD', ARRAY['ar']),('MA', ARRAY['ar']),('TN', ARRAY['ar']),('DZ', ARRAY['ar']),
    ('SN', ARRAY['fr']),('CI', ARRAY['fr']),('BF', ARRAY['fr']),('BJ', ARRAY['fr']),('TG', ARRAY['fr']),('NE', ARRAY['fr']),('ML', ARRAY['fr']),('GN', ARRAY['fr']),('TD', ARRAY['fr']),('CF', ARRAY['fr']),('CG', ARRAY['fr']),('CD', ARRAY['fr']),('GA', ARRAY['fr']),('CM', ARRAY['fr']),('DJ', ARRAY['fr']),('KM', ARRAY['fr']),('MR', ARRAY['fr']),('GQ', ARRAY['fr']),
    ('AO', ARRAY['pt']),('MZ', ARRAY['pt']),('CV', ARRAY['pt']),('GW', ARRAY['pt']),('ST', ARRAY['pt']),
    ('NG', ARRAY['en']),('GH', ARRAY['en']),('KE', ARRAY['en']),('UG', ARRAY['en']),('TZ', ARRAY['en']),('RW', ARRAY['en']),('SS', ARRAY['en']),('SL', ARRAY['en']),('LR', ARRAY['en']),('GM', ARRAY['en']),('ZW', ARRAY['en']),('ZM', ARRAY['en']),('MW', ARRAY['en']),('BW', ARRAY['en']),('NA', ARRAY['en']),('ZA', ARRAY['en']),('ET', ARRAY['en']),('SO', ARRAY['en']),('ER', ARRAY['en']),('BI', ARRAY['en']),
    ('GB', ARRAY['en']),('IE', ARRAY['en']),('FR', ARRAY['fr']),('PT', ARRAY['pt']),
    ('US', ARRAY['en']),('CA', ARRAY['en']),('BR', ARRAY['pt'])
)
UPDATE countries AS c
SET primary_languages = m.langs
FROM m
WHERE c.code = m.code
  AND (c.primary_languages IS NULL OR cardinality(c.primary_languages) = 0);

UPDATE countries
SET primary_languages = ARRAY['en']
WHERE primary_languages IS NULL OR cardinality(primary_languages) = 0;

COMMIT;

