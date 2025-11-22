-- Enhanced Test Data for Yalla Chants - CAN 2025
-- Run this script in Supabase SQL Editor after running the initial schema migration
-- Features: Real MP3 links from fanchants.com, 3-5 chants per major country

-- Insert Countries (CAN 2025 Participants)
INSERT INTO countries (name, code, code_alpha3, flag_emoji, flag_svg_url, region) VALUES
('Morocco', 'MA', 'MAR', '🇲🇦', 'https://flagcdn.com/ma.svg', 'North Africa'),
('Egypt', 'EG', 'EGY', '🇪🇬', 'https://flagcdn.com/eg.svg', 'North Africa'),
('Algeria', 'DZ', 'DZA', '🇩🇿', 'https://flagcdn.com/dz.svg', 'North Africa'),
('Tunisia', 'TN', 'TUN', '🇹🇳', 'https://flagcdn.com/tn.svg', 'North Africa'),
('Nigeria', 'NG', 'NGA', '🇳🇬', 'https://flagcdn.com/ng.svg', 'West Africa'),
('Senegal', 'SN', 'SEN', '🇸🇳', 'https://flagcdn.com/sn.svg', 'West Africa'),
('Ghana', 'GH', 'GHA', '🇬🇭', 'https://flagcdn.com/gh.svg', 'West Africa'),
('Ivory Coast', 'CI', 'CIV', '🇨🇮', 'https://flagcdn.com/ci.svg', 'West Africa'),
('Cameroon', 'CM', 'CMR', '🇨🇲', 'https://flagcdn.com/cm.svg', 'Central Africa'),
('South Africa', 'ZA', 'ZAF', '🇿🇦', 'https://flagcdn.com/za.svg', 'Southern Africa')
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- MOROCCO CHANTS (4 chants - all REAL MP3s)
-- ==========================================

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type, is_verified)
SELECT 
    'Lkhadra Lwatania',
    'Al-khadra al-wataniya!
    Raja! Raja! 
    Dima Maghrib!
    Atlas Lions roar!',
    id,
    'Raja Casablanca / Morocco NT',
    'Arabic',
    ARRAY['CAN2025', 'Morocco', 'Raja', 'Classic', 'AtlasLions'],
    'https://www.fanchants.com/media/chants/full/download/lkhadra-lwatania-fanchants-free.mp3',
    45,
    'mp3',
    'Stadium Chant',
    true
FROM countries WHERE code = 'MA';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type, is_verified)
SELECT 
    'El Qarra Samra',
    'El qarra samra! 
    Raja! Raja!
    Allez les verts!
    Champions of Africa!',
    id,
    'Raja Casablanca / Morocco NT',
    'Arabic/French',
    ARRAY['CAN2025', 'Morocco', 'Raja', 'Ultras'],
    'https://www.fanchants.com/media/chants/full/download/el9arra-samra-fanchants-free.mp3',
    52,
    'mp3',
    'Ultras Chant',
    true
FROM countries WHERE code = 'MA';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type, is_verified)
SELECT 
    '3aychine 3icha Mehboula',
    'Aychine icha mehboula!
    Dima Maghrib!
    Yalla yalla ya Atlas!
    Morocco pride!',
    id,
    'Raja Casablanca / Morocco NT',
    'Darija',
    ARRAY['CAN2025', 'Morocco', 'Traditional', 'Raja', 'Passion'],
    'https://www.fanchants.com/media/chants/full/download/3aychine-3icha-mehboula-fanchants-free.mp3',
    48,
    'mp3',
    'Stadium Chant',
    true
FROM countries WHERE code = 'MA';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type, is_verified)
SELECT 
    'Ahd Menna (عهد منا)',
    'Ahd menna!
    FAR Rabat!
    Morocco military pride!
    Defenders of the nation!',
    id,
    'FAR Rabat / Morocco NT',
    'Arabic',
    ARRAY['CAN2025', 'Morocco', 'FAR', 'Military', 'Discipline'],
    'https://www.fanchants.com/media/chants/full/download/hd-mn-fanchants-free.mp3',
    40,
    'mp3',
    'Stadium Chant',
    true
FROM countries WHERE code = 'MA';

-- ==========================================
-- EGYPT CHANTS (5 chants - all REAL MP3s)
-- ==========================================

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type, is_verified)
SELECT 
    'Baladi Baladi (بلادي بلادي)',
    'Baladi! Baladi! Baladi!
    My country! My country!
    Egypt eternal!
    Pharaohs rise!',
    id,
    'Egypt National Team',
    'Arabic',
    ARRAY['CAN2025', 'Egypt', 'Pharaohs', 'National', 'Patriotic'],
    'https://www.fanchants.com/media/chants/full/download/bldy-bldy-bldy-fanchants-free.mp3',
    50,
    'mp3',
    'Stadium Chant',
    true
FROM countries WHERE code = 'EG';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type, is_verified)
SELECT 
    'Ismailia Baladna',
    'Ismailia Baladna!
    Our city, our pride!
    Yellow derwishes unite!
    Egypt strong!',
    id,
    'Ismaily SC / Egypt NT',
    'Arabic',
    ARRAY['CAN2025', 'Egypt', 'Ismaily', 'Regional'],
    'https://www.fanchants.com/media/chants/full/download/ismailia-baladna-fanchants-free.mp3',
    44,
    'mp3',
    'Stadium Chant',
    true
FROM countries WHERE code = 'EG';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type, is_verified)
SELECT 
    'Bnady Ya Ismailia (بنادي يا اسماعيلية)',
    'Bnady ya Ismailia!
    We call upon Ismailia!
    Pride of Egypt!',
    id,
    'Ismaily SC / Egypt NT',
    'Arabic',
    ARRAY['CAN2025', 'Egypt', 'Ismaily', 'Chant'],
    'https://www.fanchants.com/media/chants/full/download/bndy-y-smyly-fanchants-free.mp3',
    42,
    'mp3',
    'Stadium Chant',
    true
FROM countries WHERE code = 'EG';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type, is_verified)
SELECT 
    'Ismailia Alayha Namout',
    'Ismailia alayha namout!
    For Ismailia we would die!
    Egyptian passion!
    Pharaohs forever!',
    id,
    'Ismaily SC / Egypt NT',
    'Arabic',
    ARRAY['CAN2025', 'Egypt', 'Ismaily', 'Passion'],
    'https://www.fanchants.com/media/chants/full/download/smyly-lyh-nmwt-fanchants-free.mp3',
    46,
    'mp3',
    'Ultras Chant',
    true
FROM countries WHERE code = 'EG';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type, is_verified)
SELECT 
    'Jumhourk Ya Ismaili',
    'Jumhourk ya Ismaili!
    Your fans, Ismaili!
    Egypt united in song!',
    id,
    'Ismaily SC / Egypt NT',
    'Arabic',
    ARRAY['CAN2025', 'Egypt', 'Ismaily', 'Supporters'],
    'https://www.fanchants.com/media/chants/full/download/jmhwrk-y-smyly-fanchants-free.mp3',
    48,
    'mp3',
    'Stadium Chant',
    true
FROM countries WHERE code = 'EG';

-- ==========================================
-- ALGERIA CHANTS (3 chants)
-- ==========================================

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type, is_verified)
SELECT 
    'One Two Three Viva l''Algérie',
    'One, two, three! 
    Viva l''Algérie!
    Les Fennecs!
    Green and white forever!',
    id,
    'Algeria National Team',
    'French/Arabic',
    ARRAY['CAN2025', 'Algeria', 'Fennecs', 'Classic', 'Iconic'],
    'https://www.fanchants.com/media/chants/full/download/1-2-3-viva-l-algerie-fanchants-free.mp3',
    48,
    'mp3',
    'Stadium Chant',
    true
FROM countries WHERE code = 'DZ';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type)
SELECT 
    'Allez Les Fennecs',
    'Allez! Allez! Les Fennecs!
    Algeria strong!
    Desert warriors!',
    id,
    'Algeria National Team',
    'French',
    ARRAY['CAN2025', 'Algeria', 'Fennecs', 'Warriors'],
    'https://www.fanchants.com/media/chants/full/download/allez-allez-allez-fanchants-free.mp3',
    45,
    'mp3',
    'Stadium Chant'
FROM countries WHERE code = 'DZ';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type)
SELECT 
    'Fennecs d''Or',
    'Algeria! Algeria!
    Fennecs d''or!
    Champions of champions!',
    id,
    'Algeria National Team',
    'French/Arabic',
    ARRAY['CAN2025', 'Algeria', 'Champions', 'Gold'],
    'https://www.fanchants.com/media/chants/full/download/algeria-fanchants-free.mp3',
    42,
    'mp3',
    'Stadium Chant'
FROM countries WHERE code = 'DZ';

-- ==========================================
-- NIGERIA CHANTS (3 chants)
-- ==========================================

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type, is_verified)
SELECT 
    'Nigeria',
    'Nigeria! Nigeria!
    Super Eagles soar!
    Green white green!
    Giant of Africa!',
    id,
    'Nigeria National Team',
    'English',
    ARRAY['CAN2025', 'Nigeria', 'SuperEagles', 'Pride'],
    'https://www.fanchants.com/media/chants/full/download/nigeria-fanchants-free.mp3',
    45,
    'mp3',
    'Stadium Chant',
    true
FROM countries WHERE code = 'NG';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type)
SELECT 
    'Super Eagles Attack',
    'Super Eagles! Super Eagles!
    Attack! Attack! Attack!
    Naija no dey carry last!',
    id,
    'Nigeria National Team',
    'English/Pidgin',
    ARRAY['CAN2025', 'Nigeria', 'SuperEagles', 'Attack'],
    'https://www.fanchants.com/media/chants/full/download/super-eagles-fanchants-free.mp3',
    43,
    'mp3',
    'Stadium Chant'
FROM countries WHERE code = 'NG';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type)
SELECT 
    'We Are Nigeria',
    'We are! We are Nigeria!
    Proudly we stand!
    Green white green!',
    id,
    'Nigeria National Team',
    'English',
    ARRAY['CAN2025', 'Nigeria', 'Patriotic', 'Unity'],
    'https://www.fanchants.com/media/chants/full/download/we-are-nigeria-fanchants-free.mp3',
    40,
    'mp3',
    'Stadium Chant'
FROM countries WHERE code = 'NG';

-- ==========================================
-- GHANA CHANTS (3 chants)
-- ==========================================

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type, is_verified)
SELECT 
    'Oh Oh Oh Ghana',
    'Oh! Oh! Oh! Ghana!
    Black Stars shine!
    Ghana go! Ghana go!
    Pride of West Africa!',
    id,
    'Ghana National Team',
    'English',
    ARRAY['CAN2025', 'Ghana', 'BlackStars', 'Classic'],
    'https://www.fanchants.com/media/chants/full/download/oh-oh-oh-ghana-fanchants-free.mp3',
    42,
    'mp3',
    'Stadium Chant',
    true
FROM countries WHERE code = 'GH';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type)
SELECT 
    'Allez Ghana',
    'Allez! Ghana! Allez!
    Black Stars rising!
    Ghana power!',
    id,
    'Ghana National Team',
    'English/French',
    ARRAY['CAN2025', 'Ghana', 'BlackStars', 'Power'],
    'https://www.fanchants.com/media/chants/full/download/allez-ghana-fanchants-free.mp3',
    38,
    'mp3',
    'Stadium Chant'
FROM countries WHERE code = 'GH';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type)
SELECT 
    'Ghana Our Homeland',
    'Ghana! Our homeland!
    Black Stars forever!
    We stand united!',
    id,
    'Ghana National Team',
    'English',
    ARRAY['CAN2025', 'Ghana', 'National', 'Unity'],
    'https://www.fanchants.com/media/chants/full/download/ghana-fanchants-free.mp3',
    44,
    'mp3',
    'Stadium Chant'
FROM countries WHERE code = 'GH';

-- ==========================================
-- CAMEROON CHANTS (3 chants)
-- ==========================================

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type, is_verified)
SELECT 
    'Lions Indomptables',
    'Allez les Lions!
    Cameroun! Cameroun!
    Indomptable! Indomptable!
    Five-time champions!',
    id,
    'Cameroon National Team',
    'French',
    ARRAY['CAN2025', 'Cameroon', 'Indomitable', 'Champions'],
    'https://www.fanchants.com/media/chants/full/download/lions-indomptables-fanchants-free.mp3',
    46,
    'mp3',
    'Stadium Chant',
    true
FROM countries WHERE code = 'CM';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type)
SELECT 
    'Allez Cameroun',
    'Allez! Allez Cameroun!
    Lions roar!
    Red green yellow!',
    id,
    'Cameroon National Team',
    'French',
    ARRAY['CAN2025', 'Cameroon', 'Lions', 'Pride'],
    'https://www.fanchants.com/media/chants/full/download/allez-cameroun-fanchants-free.mp3',
    40,
    'mp3',
    'Stadium Chant'
FROM countries WHERE code = 'CM';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type)
SELECT 
    'Cameroun Allez',
    'Cameroun! Cameroun!
    Allez les Lions!
    Indomitable spirit!',
    id,
    'Cameroon National Team',
    'French',
    ARRAY['CAN2025', 'Cameroon', 'Spirit', 'Warriors'],
    'https://www.fanchants.com/media/chants/full/download/cameroon-fanchants-free.mp3',
    42,
    'mp3',
    'Stadium Chant'
FROM countries WHERE code = 'CM';

-- ==========================================
-- SENEGAL CHANTS (3 chants)
-- ==========================================

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type)
SELECT 
    'Lions de la Teranga',
    'Senegal! Senegal!
    Lions de la Teranga!
    Champions d''Afrique!',
    id,
    'Senegal National Team',
    'French/Wolof',
    ARRAY['CAN2025', 'Senegal', 'Teranga', 'Champions'],
    'https://www.fanchants.com/media/chants/full/download/allez-senegal-fanchants-free.mp3',
    44,
    'mp3',
    'Stadium Chant'
FROM countries WHERE code = 'SN';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type)
SELECT 
    'Allez Les Lions',
    'Allez! Allez les Lions!
    Senegal champions!
    Green yellow red pride!',
    id,
    'Senegal National Team',
    'French',
    ARRAY['CAN2025', 'Senegal', 'Lions', 'Champions'],
    'https://www.fanchants.com/media/chants/full/download/senegal-fanchants-free.mp3',
    42,
    'mp3',
    'Stadium Chant'
FROM countries WHERE code = 'SN';

INSERT INTO chants (title, lyrics, country_id, football_team, language, tags, audio_url, audio_duration, audio_format, chant_type)
SELECT 
    'Teranga Power',
    'Teranga! Teranga!
    Senegal united!
    Lions roar loud!',
    id,
    'Senegal National Team',
    'French/Wolof',
    ARRAY['CAN2025', 'Senegal', 'Power', 'Unity'],
    'https://www.fanchants.com/media/chants/full/download/senegal-teranga-fanchants-free.mp3',
    40,
    'mp3',
    'Stadium Chant'
FROM countries WHERE code = 'SN';

-- Verify data
SELECT 'Countries inserted:' as info, COUNT(*) as count FROM countries;
SELECT 'Chants inserted:' as info, COUNT(*) as count FROM chants;
SELECT 'Chants by country:' as info, c.name, COUNT(ch.id) as chant_count 
FROM countries c 
LEFT JOIN chants ch ON ch.country_id = c.id 
GROUP BY c.name 
ORDER BY chant_count DESC;
