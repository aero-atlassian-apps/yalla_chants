BEGIN;

ALTER TABLE countries ADD COLUMN IF NOT EXISTS theme_primary_color VARCHAR(7);

WITH m(code, hex) AS (
  VALUES
    -- MENA
    ('AE','#00732F'),('SA','#006C35'),('QA','#8A1538'),('BH','#CE1126'),('OM','#D70000'),('KW','#007A3D'),('JO','#007A3D'),('LB','#ED1C24'),('SY','#CE1126'),('IQ','#CE1126'),('EG','#CE1126'),('MA','#C1272D'),('TN','#E70013'),('DZ','#006233'),('PS','#007A3D'),('YE','#CE1126'),
    -- Africa
    ('ZA','#007749'),('NG','#008751'),('GH','#CE1126'),('CM','#007A5E'),('SN','#00853F'),('KE','#BB0000'),('TZ','#00A3DD'),('UG','#FCDC04'),('RW','#00A1DE'),('ET','#009A44'),('SD','#E31B23'),('LY','#008000'),('CD','#007FFF'),('SO','#0087BD'),('MR','#006233'),('DJ','#66AABB'),('BJ','#EE8811'),('BW','#66DDAA'),
    -- Europe
    ('GB','#012169'),('FR','#0055A4'),('DE','#DD0000'),('IT','#009246'),('ES','#AA151B'),('PT','#006600'),('NL','#AE1C28'),('BE','#FFDD00'),('SE','#006AA7'),('NO','#EF2B2D'),('DK','#C60C30'),('FI','#003580'),('IE','#169B62'),('CH','#D52B1E'),('AT','#ED2939'),('PL','#DC143C'),('CZ','#11457E'),('SK','#0B4EA2'),('HU','#436F4D'),('RO','#002B7F'),('BG','#00966E'),('RS','#C6363C'),('HR','#171796'),('SI','#005CE6'),('BA','#002F6C'),('IS','#003897'),('UA','#0057B7'),('RU','#0039A6'),('GR','#0D5EAF'),
    -- Americas
    ('US','#3C3B6E'),('CA','#D52B1E'),('MX','#006847'),('BR','#009C3B'),('AR','#75AADB'),('CL','#0039A6'),('CO','#FCD116'),('PE','#D91023'),('VE','#0033A0'),
    -- Asia
    ('CN','#DE2910'),('JP','#BC002D'),('IN','#FF9933'),('PK','#006600'),('TR','#E30A17'),('IR','#239F40'),('AF','#D32011'),('BD','#006A4E'),('LK','#D21034'),('NP','#DC143C'),('TH','#00247D'),('MY','#010066'),('SG','#ED2939'),('ID','#CE1126'),('PH','#0038A8'),('VN','#DA251D'),('KR','#003478'),
    -- Oceania
    ('AU','#00247D'),('NZ','#00247D')
)
UPDATE countries AS c
SET theme_primary_color = m.hex
FROM m
WHERE c.code = m.code
  AND (c.theme_primary_color IS NULL OR c.theme_primary_color = '');

UPDATE countries
SET theme_primary_color = '#1DB954'
WHERE theme_primary_color IS NULL OR theme_primary_color = '';

COMMIT;

