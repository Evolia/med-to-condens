-- =============================================================================
-- MedCondens Database Schema
-- =============================================================================
-- Run this SQL in your Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable unaccent for accent-insensitive search
CREATE EXTENSION IF NOT EXISTS unaccent;

-- =============================================================================
-- 2. CUSTOM TYPES (ENUMS)
-- =============================================================================

-- Type d'observation
CREATE TYPE type_observation AS ENUM (
  'consultation',
  'suivi',
  'urgence',
  'telephone',
  'resultats',
  'courrier',
  'reunion',
  'note'
);

-- Type de todo
CREATE TYPE type_todo AS ENUM (
  'rappel',
  'prescription',
  'examen',
  'courrier',
  'rdv',
  'avis',
  'administratif',
  'autre'
);

-- Urgence du todo
CREATE TYPE urgence_todo AS ENUM (
  'basse',
  'normale',
  'haute',
  'critique'
);

-- Sexe du patient
CREATE TYPE sexe_patient AS ENUM (
  'M',
  'F',
  'autre'
);

-- =============================================================================
-- 3. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: allowed_users (whitelist for Google Auth)
-- -----------------------------------------------------------------------------
CREATE TABLE allowed_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- -----------------------------------------------------------------------------
-- Table: patients
-- -----------------------------------------------------------------------------
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identité
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  sexe sexe_patient,
  date_naissance DATE,

  -- Coordonnées
  telephone TEXT,
  email TEXT,
  adresse TEXT,

  -- Médical
  secteur TEXT,
  notes TEXT,

  -- IA
  resume_ia TEXT,
  resume_updated_at TIMESTAMPTZ,

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_nom_trgm ON patients USING gin(nom gin_trgm_ops);
CREATE INDEX idx_patients_prenom_trgm ON patients USING gin(prenom gin_trgm_ops);
CREATE INDEX idx_patients_nom_prenom ON patients(nom, prenom);

-- -----------------------------------------------------------------------------
-- Table: consultations (sessions de travail)
-- -----------------------------------------------------------------------------
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT, -- 'matin', 'apres-midi', 'reunion', etc.
  titre TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consultations_user_id ON consultations(user_id);
CREATE INDEX idx_consultations_date ON consultations(date DESC);

-- -----------------------------------------------------------------------------
-- Table: observations
-- -----------------------------------------------------------------------------
CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,

  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type_observation type_observation NOT NULL DEFAULT 'consultation',
  contenu TEXT,

  -- Âge calculé au moment de l'observation (en jours)
  age_patient_jours INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_observations_user_id ON observations(user_id);
CREATE INDEX idx_observations_patient_id ON observations(patient_id);
CREATE INDEX idx_observations_consultation_id ON observations(consultation_id);
CREATE INDEX idx_observations_date ON observations(date DESC);

-- -----------------------------------------------------------------------------
-- Table: work_sessions (sessions de travail pour organiser les todos)
-- -----------------------------------------------------------------------------
CREATE TABLE work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  date DATE,
  description TEXT,

  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX idx_work_sessions_completed ON work_sessions(completed);
CREATE INDEX idx_work_sessions_date ON work_sessions(date DESC);

-- -----------------------------------------------------------------------------
-- Table: todos
-- -----------------------------------------------------------------------------
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  observation_id UUID REFERENCES observations(id) ON DELETE SET NULL,
  work_session_id UUID REFERENCES work_sessions(id) ON DELETE SET NULL,

  contenu TEXT NOT NULL,
  type_todo type_todo NOT NULL DEFAULT 'autre',
  urgence urgence_todo NOT NULL DEFAULT 'normale',

  date_echeance DATE,
  annotations TEXT,
  tags TEXT, -- Comma-separated tags

  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_patient_id ON todos(patient_id);
CREATE INDEX idx_todos_observation_id ON todos(observation_id);
CREATE INDEX idx_todos_work_session_id ON todos(work_session_id);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_urgence ON todos(urgence);
CREATE INDEX idx_todos_date_echeance ON todos(date_echeance);

-- -----------------------------------------------------------------------------
-- Table: mail_imports
-- -----------------------------------------------------------------------------
CREATE TABLE mail_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,

  contenu_original TEXT NOT NULL,
  analyse_ia TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mail_imports_user_id ON mail_imports(user_id);
CREATE INDEX idx_mail_imports_patient_id ON mail_imports(patient_id);

-- -----------------------------------------------------------------------------
-- Table: phonetic_mappings (variations de prénoms)
-- -----------------------------------------------------------------------------
CREATE TABLE phonetic_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical TEXT NOT NULL, -- Forme canonique (ex: 'emma')
  variant TEXT NOT NULL,   -- Variante (ex: 'ema')
  UNIQUE(canonical, variant)
);

-- Index pour recherche rapide
CREATE INDEX idx_phonetic_canonical ON phonetic_mappings(canonical);
CREATE INDEX idx_phonetic_variant ON phonetic_mappings(variant);

-- Données initiales pour les prénoms courants
INSERT INTO phonetic_mappings (canonical, variant) VALUES
  -- Emma / Ema
  ('emma', 'emma'),
  ('emma', 'ema'),
  -- Liam / Lyam
  ('liam', 'liam'),
  ('liam', 'lyam'),
  -- Mathis / Mathys / Matis
  ('mathis', 'mathis'),
  ('mathis', 'mathys'),
  ('mathis', 'matis'),
  -- Nathan / Natan
  ('nathan', 'nathan'),
  ('nathan', 'natan'),
  -- Lucas / Lukas
  ('lucas', 'lucas'),
  ('lucas', 'lukas'),
  -- Noah / Noa
  ('noah', 'noah'),
  ('noah', 'noa'),
  -- Ethan / Etan
  ('ethan', 'ethan'),
  ('ethan', 'etan'),
  -- Raphaël / Rafael / Raphael
  ('raphael', 'raphaël'),
  ('raphael', 'raphael'),
  ('raphael', 'rafael'),
  -- Gabriel / Gabrielle
  ('gabriel', 'gabriel'),
  ('gabriel', 'gabrielle'),
  -- Léa / Lea
  ('lea', 'léa'),
  ('lea', 'lea'),
  -- Chloé / Chloe
  ('chloe', 'chloé'),
  ('chloe', 'chloe'),
  -- Zoé / Zoe
  ('zoe', 'zoé'),
  ('zoe', 'zoe'),
  -- Inès / Ines
  ('ines', 'inès'),
  ('ines', 'ines'),
  -- Maël / Mael
  ('mael', 'maël'),
  ('mael', 'mael'),
  -- Loïc / Loic
  ('loic', 'loïc'),
  ('loic', 'loic'),
  -- Anaïs / Anais
  ('anais', 'anaïs'),
  ('anais', 'anais'),
  -- Jules / Jule
  ('jules', 'jules'),
  ('jules', 'jule'),
  -- Théo / Theo
  ('theo', 'théo'),
  ('theo', 'theo'),
  -- Léo / Leo
  ('leo', 'léo'),
  ('leo', 'leo'),
  -- Timothée / Timothé / Timothee
  ('timothee', 'timothée'),
  ('timothee', 'timothé'),
  ('timothee', 'timothee')
ON CONFLICT (canonical, variant) DO NOTHING;

-- =============================================================================
-- 4. FUNCTIONS
-- =============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_observations_updated_at
  BEFORE UPDATE ON observations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_sessions_updated_at
  BEFORE UPDATE ON work_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction de recherche de patients avec similarité
CREATE OR REPLACE FUNCTION search_patients(
  p_user_id UUID,
  p_search_term TEXT
)
RETURNS TABLE (
  id UUID,
  nom TEXT,
  prenom TEXT,
  sexe sexe_patient,
  date_naissance DATE,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  secteur TEXT,
  notes TEXT,
  resume_ia TEXT,
  resume_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity_score REAL
) AS $$
DECLARE
  search_normalized TEXT;
BEGIN
  -- Normaliser le terme de recherche
  search_normalized := lower(unaccent(p_search_term));

  RETURN QUERY
  SELECT
    p.id,
    p.nom,
    p.prenom,
    p.sexe,
    p.date_naissance,
    p.telephone,
    p.email,
    p.adresse,
    p.secteur,
    p.notes,
    p.resume_ia,
    p.resume_updated_at,
    p.created_at,
    p.updated_at,
    GREATEST(
      similarity(lower(unaccent(p.nom)), search_normalized),
      similarity(lower(unaccent(p.prenom)), search_normalized),
      similarity(lower(unaccent(p.nom || ' ' || p.prenom)), search_normalized)
    ) AS similarity_score
  FROM patients p
  WHERE p.user_id = p_user_id
    AND (
      -- Recherche par similarité sur nom/prénom
      similarity(lower(unaccent(p.nom)), search_normalized) > 0.2
      OR similarity(lower(unaccent(p.prenom)), search_normalized) > 0.2
      OR similarity(lower(unaccent(p.nom || ' ' || p.prenom)), search_normalized) > 0.2
      -- Recherche par préfixe
      OR lower(unaccent(p.nom)) LIKE search_normalized || '%'
      OR lower(unaccent(p.prenom)) LIKE search_normalized || '%'
      -- Recherche par variante phonétique
      OR EXISTS (
        SELECT 1 FROM phonetic_mappings pm
        WHERE pm.variant = search_normalized
          AND (
            lower(unaccent(p.prenom)) IN (
              SELECT pm2.variant FROM phonetic_mappings pm2
              WHERE pm2.canonical = pm.canonical
            )
          )
      )
    )
  ORDER BY similarity_score DESC, p.nom, p.prenom;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_imports ENABLE ROW LEVEL SECURITY;

-- Policies pour patients
CREATE POLICY "Users can view their own patients"
  ON patients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patients"
  ON patients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients"
  ON patients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients"
  ON patients FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour consultations
CREATE POLICY "Users can view their own consultations"
  ON consultations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consultations"
  ON consultations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consultations"
  ON consultations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consultations"
  ON consultations FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour observations
CREATE POLICY "Users can view their own observations"
  ON observations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own observations"
  ON observations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own observations"
  ON observations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own observations"
  ON observations FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour todos
CREATE POLICY "Users can view their own todos"
  ON todos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos"
  ON todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos"
  ON todos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos"
  ON todos FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour work_sessions
CREATE POLICY "Users can view their own work sessions"
  ON work_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own work sessions"
  ON work_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work sessions"
  ON work_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work sessions"
  ON work_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour mail_imports
CREATE POLICY "Users can view their own mail imports"
  ON mail_imports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mail imports"
  ON mail_imports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mail imports"
  ON mail_imports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mail imports"
  ON mail_imports FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 6. REALTIME
-- =============================================================================

-- Activer Realtime sur les tables principales
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
ALTER PUBLICATION supabase_realtime ADD TABLE consultations;
ALTER PUBLICATION supabase_realtime ADD TABLE observations;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE work_sessions;

-- =============================================================================
-- 7. VERIFICATION DE L'EMAIL AUTORISE (fonction pour le login)
-- =============================================================================

-- Cette fonction vérifie si l'email est dans la whitelist
CREATE OR REPLACE FUNCTION is_email_allowed(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM allowed_users
    WHERE lower(email) = lower(check_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FIN DU SCHEMA
-- =============================================================================
