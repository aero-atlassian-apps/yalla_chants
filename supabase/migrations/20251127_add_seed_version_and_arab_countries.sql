-- Add seed_version to chants and upsert missing Arab countries

ALTER TABLE chants ADD COLUMN IF NOT EXISTS seed_version VARCHAR(10) DEFAULT 'v1' NOT NULL;

UPDATE chants SET seed_version = 'v1' WHERE seed_version IS NULL;

-- Upsert Arab League and related countries
INSERT INTO countries (name, code, code_alpha3, flag_emoji, flag_svg_url, region)
VALUES
('Bahrain', 'BH', 'BHR', '🇧🇭', 'https://flagcdn.com/bh.svg', 'Middle East'),
('Iraq', 'IQ', 'IRQ', '🇮🇶', 'https://flagcdn.com/iq.svg', 'Middle East'),
('Jordan', 'JO', 'JOR', '🇯🇴', 'https://flagcdn.com/jo.svg', 'Middle East'),
('Kuwait', 'KW', 'KWT', '🇰🇼', 'https://flagcdn.com/kw.svg', 'Middle East'),
('Lebanon', 'LB', 'LBN', '🇱🇧', 'https://flagcdn.com/lb.svg', 'Middle East'),
('Libya', 'LY', 'LBY', '🇱🇾', 'https://flagcdn.com/ly.svg', 'North Africa'),
('Mauritania', 'MR', 'MRT', '🇲🇷', 'https://flagcdn.com/mr.svg', 'West Africa'),
('Oman', 'OM', 'OMN', '🇴🇲', 'https://flagcdn.com/om.svg', 'Middle East'),
('Palestine', 'PS', 'PSE', '🇵🇸', 'https://flagcdn.com/ps.svg', 'Middle East'),
('Qatar', 'QA', 'QAT', '🇶🇦', 'https://flagcdn.com/qa.svg', 'Middle East'),
('Saudi Arabia', 'SA', 'SAU', '🇸🇦', 'https://flagcdn.com/sa.svg', 'Middle East'),
('Somalia', 'SO', 'SOM', '🇸🇴', 'https://flagcdn.com/so.svg', 'Horn of Africa'),
('Sudan', 'SD', 'SDN', '🇸🇩', 'https://flagcdn.com/sd.svg', 'North Africa'),
('Syria', 'SY', 'SYR', '🇸🇾', 'https://flagcdn.com/sy.svg', 'Middle East'),
('United Arab Emirates', 'AE', 'ARE', '🇦🇪', 'https://flagcdn.com/ae.svg', 'Middle East'),
('Yemen', 'YE', 'YEM', '🇾🇪', 'https://flagcdn.com/ye.svg', 'Middle East'),
('Comoros', 'KM', 'COM', '🇰🇲', 'https://flagcdn.com/km.svg', 'East Africa'),
('Djibouti', 'DJ', 'DJI', '🇩🇯', 'https://flagcdn.com/dj.svg', 'Horn of Africa')
ON CONFLICT (code) DO NOTHING;

