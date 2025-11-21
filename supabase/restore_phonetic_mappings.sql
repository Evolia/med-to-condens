-- Restore phonetic_mappings table data
-- Run this script to repopulate the phonetic mappings for fuzzy name search

-- Clear existing data (optional, uncomment if needed)
-- TRUNCATE TABLE phonetic_mappings;

-- Insert phonetic mappings for common French name variants
INSERT INTO phonetic_mappings (canonical, variant) VALUES
  -- Emma variants
  ('emma', 'ema'),

  -- Liam variants
  ('liam', 'lyam'),

  -- Mathis variants
  ('mathis', 'mathys'),
  ('mathis', 'matis'),

  -- Nathan variants
  ('nathan', 'natan'),

  -- Lucas variants
  ('lucas', 'lukas'),

  -- Noah variants
  ('noah', 'noa'),

  -- Ethan variants
  ('ethan', 'etan'),

  -- Raphael variants
  ('raphael', 'rafael'),
  ('raphael', 'raphaël'),

  -- Gabriel variants
  ('gabriel', 'gabrielle'),

  -- Lea variants
  ('lea', 'léa'),

  -- Chloe variants
  ('chloe', 'chloé'),

  -- Zoe variants
  ('zoe', 'zoé'),

  -- Ines variants
  ('ines', 'inès'),

  -- Mael variants
  ('mael', 'maël'),

  -- Loic variants
  ('loic', 'loïc'),

  -- Anais variants
  ('anais', 'anaïs'),

  -- Jules variants
  ('jules', 'jule'),

  -- Theo variants
  ('theo', 'théo'),

  -- Leo variants
  ('leo', 'léo'),

  -- Timothee variants
  ('timothee', 'timothé'),
  ('timothee', 'timothée'),

  -- Additional common variants
  ('nicolas', 'nikolas'),
  ('nicolas', 'nicolas'),
  ('thomas', 'tomas'),
  ('louis', 'lewis'),
  ('hugo', 'ugo'),
  ('adam', 'adame'),
  ('paul', 'paule'),
  ('antoine', 'anthoine'),
  ('maxime', 'maxim'),
  ('alexandre', 'alexendre'),
  ('julien', 'juliano'),
  ('camille', 'camile'),
  ('manon', 'mannon'),
  ('sarah', 'sara'),
  ('marie', 'mari'),
  ('laura', 'lora'),
  ('julie', 'juli'),
  ('oceane', 'océane'),
  ('clara', 'klara'),
  ('alice', 'alyce'),
  ('lucie', 'lucy'),
  ('eva', 'éva'),
  ('lena', 'léna'),
  ('lisa', 'liza'),
  ('rose', 'rrose'),
  ('jeanne', 'jane'),
  ('margot', 'margo'),
  ('elise', 'élise'),
  ('charlotte', 'charlote'),
  ('clemence', 'clémence'),
  ('agathe', 'agate'),
  ('valentine', 'valentyne'),
  ('helene', 'hélène'),
  ('amelie', 'amélie'),
  ('celine', 'céline'),
  ('noemie', 'noémie'),
  ('ophelie', 'ophélie'),
  ('aurelie', 'aurélie'),
  ('stephanie', 'stéphanie'),
  ('melanie', 'mélanie'),
  ('valerie', 'valérie'),
  ('veronique', 'véronique'),
  ('francois', 'françois'),
  ('jerome', 'jérôme'),
  ('sebastien', 'sébastien'),
  ('frederic', 'frédéric'),
  ('remi', 'rémi'),
  ('gregory', 'grégory'),
  ('cedric', 'cédric'),
  ('eric', 'éric'),
  ('benoit', 'benoît')
ON CONFLICT (canonical, variant) DO NOTHING;

-- Verify insertion
SELECT COUNT(*) as total_mappings FROM phonetic_mappings;
